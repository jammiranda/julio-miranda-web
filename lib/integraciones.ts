/**
 * Integraciones del Sistema de gestión con el resto del ecosistema DEVISEBIT:
 * - Google (Calendar, Drive y Gmail) por el conector de Apps Script de la agenda.
 * - Casilla info@devisebit.com (Donweb) por IMAP.
 * Las respuestas se guardan unos minutos en g_cache para que las pantallas carguen rápido.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"
import { q, one } from "@/lib/db"
import { googleScript, calendarioConectado } from "@/lib/agenda"
import { secret } from "@/lib/auth"

/* ---------------- Caché ---------------- */
async function cache<T>(clave: string, minutos: number, cargar: () => Promise<T | null>, forzar = false): Promise<{ valor: T | null; cuando: Date | null }> {
  const c = await one<{ valor: T; actualizado: Date }>("select valor, actualizado from g_cache where clave=$1", [clave]).catch(() => null)
  if (!forzar && c && Date.now() - new Date(c.actualizado).getTime() < minutos * 60e3) return { valor: c.valor, cuando: new Date(c.actualizado) }
  const v = await cargar().catch(() => null)
  if (v != null) {
    await q("insert into g_cache(clave,valor,actualizado) values ($1,$2,now()) on conflict (clave) do update set valor=excluded.valor, actualizado=now()", [clave, JSON.stringify(v)]).catch(() => {})
    return { valor: v, cuando: new Date() }
  }
  return { valor: c?.valor ?? null, cuando: c ? new Date(c.actualizado) : null }
}
export const limpiarCache = (prefijo: string) => q("delete from g_cache where clave like $1", [prefijo + "%"]).catch(() => {})

async function cfg<T>(clave: string, def: T): Promise<T> {
  const r = await one<{ valor: string }>("select valor from config where clave=$1", [clave]).catch(() => null)
  if (!r) return def
  try { return { ...def, ...JSON.parse(r.valor) } } catch { return def }
}
const guardarCfg = (clave: string, v: unknown) => q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [clave, JSON.stringify(v)])

/* ---------------- Google: estado del conector ---------------- */
export type EstadoGoogle = { conectado: boolean; version: number; cuenta: string | null; error?: string }
export async function estadoGoogle(forzar = false): Promise<EstadoGoogle> {
  if (!(await calendarioConectado())) return { conectado: false, version: 0, cuenta: null }
  const r = await cache("g:version", 30, async () => {
    const x = await googleScript({ accion: "version" }, 15000)
    if (!x) return null
    return x.version ? { version: Number(x.version), cuenta: x.cuenta ?? null } : { version: 1, cuenta: null }
  }, forzar)
  return { conectado: true, version: (r.valor as any)?.version ?? 0, cuenta: (r.valor as any)?.cuenta ?? null, error: r.valor ? undefined : "El conector no respondió" }
}
export const conectorAlDia = async () => (await estadoGoogle()).version >= 2

/* ---------------- Google Calendar ---------------- */
export type Evento = { id: string; titulo: string; inicio: string; fin: string; todoElDia: boolean; lugar: string; meet: string; link: string; descripcion: string; invitados: string[]; organizador: string }
export async function eventosCalendario(dias = 30, forzar = false): Promise<{ eventos: Evento[]; cuando: Date | null; ok: boolean }> {
  if (!(await conectorAlDia())) return { eventos: [], cuando: null, ok: false }
  const desde = new Date(Date.now() - 6 * 3600e3)
  const hasta = new Date(Date.now() + dias * 864e5)
  const r = await cache<Evento[]>(`g:eventos:${dias}`, 5, async () => {
    const x = await googleScript({ accion: "eventos", desde: desde.toISOString(), hasta: hasta.toISOString() })
    return Array.isArray(x?.eventos) ? x.eventos : null
  }, forzar)
  const ahora = Date.now()
  const eventos = (r.valor ?? []).filter((e) => new Date(e.fin).getTime() > ahora).sort((a, b) => a.inicio.localeCompare(b.inicio))
  return { eventos, cuando: r.cuando, ok: r.valor != null }
}

/* ---------------- Google Drive → Documentos ---------------- */
export type CfgDrive = { carpeta: string; ultima?: string; resultado?: string }
export const driveConfig = () => cfg<CfgDrive>("drive", { carpeta: "DEVISEBIT" })
export const guardarDriveConfig = async (carpeta: string) => guardarCfg("drive", { ...(await driveConfig()), carpeta })

const CATEGORIAS: [RegExp, string][] = [
  [/licitaci|pliego|compr\.?ar/i, "licitacion"],
  [/contrat|legal|nda|acuerdo|estatuto|poder|societ/i, "legal"],
  [/contab|factur|impuest|arca|afip|iibb|balance|recibo|banco|sueldo/i, "contable"],
  [/plantilla|template|modelo/i, "plantilla"],
  [/propuesta|comercial|presupuest|brochure|venta|cotiz/i, "comercial"],
  [/t[eé]cnic|desarroll|arquitect|api|manual del sistema|spec|c[oó]digo/i, "tecnico"],
  [/equipo|rrhh|proceso|procedimiento|onboarding|rutina|m[oó]dulo/i, "equipo"],
]
export const categoriaDe = (ruta: string, nombre: string) => CATEGORIAS.find(([re]) => re.test(ruta))?.[1] ?? CATEGORIAS.find(([re]) => re.test(nombre))?.[1] ?? "institucional"

/** Trae los archivos de la carpeta de Drive y los deja en Documentos: crea los nuevos, actualiza nombre y link, y quita los que ya no están. */
export async function sincronizarDrive(usuario = "drive"): Promise<{ ok: boolean; mensaje: string; nuevos?: number; actualizados?: number; quitados?: number }> {
  if (!(await conectorAlDia())) return { ok: false, mensaje: "Falta actualizar el conector de Google a la versión 2." }
  const c = await driveConfig()
  const x = await googleScript({ accion: "drive", carpeta: c.carpeta, max: 800 }, 60000)
  if (!x || x.error || !Array.isArray(x.archivos)) {
    const mensaje = x?.error ?? "Google no respondió."
    await guardarCfg("drive", { ...c, ultima: new Date().toISOString(), resultado: mensaje })
    return { ok: false, mensaje }
  }
  let nuevos = 0, actualizados = 0, quitados = 0
  const vistos: string[] = []
  for (const a of x.archivos as { id: string; nombre: string; url: string; mime: string; actualizado: string; ruta: string }[]) {
    vistos.push(a.id)
    const ya = await one<{ id: number; titulo: string; url: string; ruta: string | null }>("select id, titulo, url, ruta from g_documentos where externo_id=$1", [a.id])
    if (!ya) {
      await q(`insert into g_documentos(titulo,categoria,url,version,responsable,confidencial,descripcion,origen,externo_id,ruta,mime,creado_por,actualizado)
               values ($1,$2,$3,null,null,$4,$5,'drive',$6,$7,$8,$9,$10)`,
        [a.nombre, categoriaDe(a.ruta, a.nombre), a.url, categoriaDe(a.ruta, a.nombre) === "contable" || categoriaDe(a.ruta, a.nombre) === "legal", a.ruta ? `Drive: ${x.carpeta} / ${a.ruta}` : `Drive: ${x.carpeta}`, a.id, a.ruta || null, a.mime, usuario, a.actualizado])
      nuevos++
    } else if (ya.titulo !== a.nombre || ya.url !== a.url || (ya.ruta ?? "") !== (a.ruta ?? "")) {
      await q("update g_documentos set titulo=$2, url=$3, ruta=$4, mime=$5, actualizado=$6 where id=$1", [ya.id, a.nombre, a.url, a.ruta || null, a.mime, a.actualizado])
      actualizados++
    }
  }
  if (!x.truncado) {
    const r = await q<{ id: number }>("delete from g_documentos where origen='drive' and not (externo_id = any($1)) returning id", [vistos])
    quitados = r.length
  }
  const mensaje = `Drive sincronizado: ${x.archivos.length} archivos en «${x.carpeta}» · ${nuevos} nuevos, ${actualizados} actualizados${quitados ? `, ${quitados} quitados` : ""}${x.truncado ? " (la carpeta tiene más de 800 archivos: se trajeron los primeros)" : ""}.`
  await guardarCfg("drive", { ...c, ultima: new Date().toISOString(), resultado: mensaje, url: x.url })
  return { ok: true, mensaje, nuevos, actualizados, quitados }
}

/* ---------------- Gmail ---------------- */
export type CfgGmail = { consulta: string }
export const GMAIL_DEF = "in:inbox newer_than:14d -category:promotions -category:social -category:forums"
export const gmailConfig = () => cfg<CfgGmail>("gmail", { consulta: GMAIL_DEF })
export const guardarGmailConfig = (consulta: string) => guardarCfg("gmail", { consulta: consulta || GMAIL_DEF })
export type Hilo = { id: string; asunto: string; de: string; para: string; fecha: string; fragmento: string; noLeido: boolean; mensajes: number; link: string }

export async function correosGmail(forzar = false): Promise<{ hilos: Hilo[]; cuando: Date | null; ok: boolean }> {
  if (!(await conectorAlDia())) return { hilos: [], cuando: null, ok: false }
  const { consulta } = await gmailConfig()
  const r = await cache<Hilo[]>("g:gmail", 5, async () => {
    const x = await googleScript({ accion: "gmail", q: consulta, max: 40 })
    return Array.isArray(x?.hilos) ? x.hilos : null
  }, forzar)
  return { hilos: r.valor ?? [], cuando: r.cuando, ok: r.valor != null }
}
/** Correos con una persona (para la ficha del contacto). */
export async function correosCon(email: string): Promise<Hilo[]> {
  if (!email || !/^[^\s@]+@[^\s@]+$/.test(email) || !(await conectorAlDia())) return []
  const r = await cache<Hilo[]>(`g:gmail:${email.toLowerCase()}`, 15, async () => {
    const x = await googleScript({ accion: "gmail", q: `from:${email} OR to:${email}`, max: 10 })
    return Array.isArray(x?.hilos) ? x.hilos : null
  })
  return r.valor ?? []
}

/* ---------------- Casilla de Donweb (IMAP) ---------------- */
export type CfgImap = { host: string; puerto: number; usuario: string; clave?: string; webmail?: string }
const IMAP_DEF: CfgImap = { host: "c1381774.ferozo.com", puerto: 993, usuario: "info@devisebit.com", webmail: "" }

async function llave() { return createHash("sha256").update(await secret()).update("imap").digest() }
async function cifrar(t: string) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", await llave(), iv)
  const enc = Buffer.concat([c.update(t, "utf8"), c.final()])
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".")
}
async function descifrar(t: string) {
  const [iv, tag, enc] = t.split(".").map((x) => Buffer.from(x, "base64url"))
  const d = createDecipheriv("aes-256-gcm", await llave(), iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8")
}
export async function imapConfig() {
  const c = await cfg<CfgImap>("imap", IMAP_DEF)
  return { host: c.host, puerto: c.puerto || 993, usuario: c.usuario, webmail: c.webmail ?? "", tieneClave: !!c.clave }
}
export async function guardarImap(d: { host: string; puerto: number; usuario: string; clave?: string; webmail?: string }) {
  const prev = await cfg<CfgImap>("imap", IMAP_DEF)
  await guardarCfg("imap", { host: d.host, puerto: d.puerto || 993, usuario: d.usuario, webmail: d.webmail ?? "", clave: d.clave ? await cifrar(d.clave) : prev.clave })
  await limpiarCache("imap:")
}

export type Mail = { uid: number; asunto: string; de: string; deEmail: string; fecha: string; leido: boolean }
export async function correosImap(forzar = false): Promise<{ mails: Mail[]; cuando: Date | null; ok: boolean; error?: string; noLeidos?: number }> {
  const c = await cfg<CfgImap>("imap", IMAP_DEF)
  if (!c.host || !c.usuario || !c.clave) return { mails: [], cuando: null, ok: false }
  let error: string | undefined
  const r = await cache<{ mails: Mail[]; noLeidos: number }>("imap:inbox", 5, async () => {
    const { ImapFlow } = await import("imapflow")
    const cli = new ImapFlow({ host: c.host, port: c.puerto || 993, secure: (c.puerto || 993) === 993, auth: { user: c.usuario, pass: await descifrar(c.clave!) }, logger: false, socketTimeout: 20000 })
    cli.on("error", (e: any) => { error = e?.message || String(e) })
    try {
      await cli.connect()
      const lock = await cli.getMailboxLock("INBOX")
      try {
        const st = await cli.status("INBOX", { messages: true, unseen: true })
        const total = st.messages ?? 0
        const mails: Mail[] = []
        if (total > 0) {
          for await (const m of cli.fetch(`${Math.max(1, total - 29)}:*`, { envelope: true, flags: true, uid: true })) {
            const f = m.envelope?.from?.[0]
            mails.push({ uid: m.uid, asunto: m.envelope?.subject || "(sin asunto)", de: f?.name || f?.address || "", deEmail: (f?.address || "").toLowerCase(), fecha: (m.envelope?.date ?? new Date()).toISOString(), leido: !!m.flags?.has("\\Seen") })
          }
        }
        return { mails: mails.sort((a, b) => b.fecha.localeCompare(a.fecha)), noLeidos: st.unseen ?? 0 }
      } finally { lock.release() }
    } catch (e: any) {
      error = e?.responseText || e?.message || String(e)
      return null
    } finally { await cli.logout().catch(() => {}) }
  }, forzar)
  return { mails: r.valor?.mails ?? [], noLeidos: r.valor?.noLeidos, cuando: r.cuando, ok: r.valor != null, error }
}

/** Busca contactos del CRM por email para enlazar correos con fichas. */
export async function contactosPorEmail(emails: string[]) {
  const limpios = [...new Set(emails.map((e) => e.toLowerCase()).filter(Boolean))]
  if (!limpios.length) return {} as Record<string, { id: number; n: string }>
  const r = await q<{ id: number; email: string; n: string }>("select id, lower(email) email, coalesce(nullif(organizacion,''), nombre) n from db_contactos where lower(email) = any($1)", [limpios])
  return Object.fromEntries(r.map((x) => [x.email, { id: x.id, n: x.n }]))
}
export const emailDe = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase()
export const nombreDe = (s: string) => s.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || emailDe(s)
