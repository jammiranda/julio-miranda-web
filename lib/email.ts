import { REDES } from "./redes"
import { q, one } from "./db"
import { URL_SISTEMA } from "./brief"
import { emailConEstilo } from "./email-estilos"

/** Email marketing: plantilla con la marca, segmentos, cola diaria y envío por Brevo. */
export const LIMITE_DIARIO = Number(process.env.EMAIL_LIMITE_DIARIO ?? 300)
export const REMITENTE = { name: process.env.EMAIL_FROM_NOMBRE ?? "DEVISEBIT", email: process.env.EMAIL_FROM ?? "info@devisebit.com" }
export const RESPONDER_A = process.env.EMAIL_REPLY_TO ?? "info@devisebit.com"
export const brevoConfigurado = () => !!process.env.BREVO_API_KEY

/** Reemplaza {{nombre}}; si no hay nombre, también saca el espacio de adelante ("Hola {{nombre}}," → "Hola,"). */
export const conNombre = (t: string, n: string) => t.replace(/\s?\{\{nombre\}\}/g, (m: string) => (!n ? "" : m.startsWith("{") ? n : " " + n))

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Texto simple → HTML de email. Soporta: # Título, ## Subtítulo, **negrita**, [texto](url), - listas, ![alt](img), [[Botón|url]], --- separador. */
export function aHtml(md: string) {
  const inline = (s: string) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#C8231F;font-weight:600">$1</a>')
  const out: string[] = []
  let lista: string[] = []
  const cerrar = () => { if (lista.length) { out.push(`<ul style="margin:0 0 16px;padding-left:20px">${lista.map((l) => `<li style="margin:0 0 6px">${inline(l)}</li>`).join("")}</ul>`); lista = [] } }
  for (const raw of md.replace(/\r/g, "").split(/\n{2,}|\n(?=[#\-!\[])/)) {
    const l = raw.trim()
    if (!l) continue
    if (/^- /.test(l)) { for (const x of l.split("\n")) lista.push(x.replace(/^- /, "")); continue }
    cerrar()
    let m
    if ((m = l.match(/^## (.+)/))) out.push(`<h2 style="margin:24px 0 8px;font-size:19px;color:#0E1116">${inline(m[1])}</h2>`)
    else if ((m = l.match(/^# (.+)/))) out.push(`<h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#0E1116">${inline(m[1])}</h1>`)
    else if ((m = l.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/))) out.push(`<img src="${m[2]}" alt="${esc(m[1])}" width="100%" style="display:block;width:100%;max-width:560px;border-radius:12px;margin:0 0 16px">`)
    else if ((m = l.match(/^\[\[(.+?)\|(https?:\/\/[^\]]+)\]\]$/))) out.push(`<p style="margin:8px 0 20px"><a href="${m[2]}" style="display:inline-block;background:#C8231F;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${esc(m[1])}</a></p>`)
    else if (l === "---") out.push(`<hr style="border:0;border-top:1px solid #E2E5EA;margin:24px 0">`)
    else out.push(`<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#262C37">${inline(l).replace(/\n/g, "<br>")}</p>`)
  }
  cerrar()
  return out.join("\n")
}

export function plantilla(cuerpo: string, o: { preheader?: string | null; baja?: string | null; nombre?: string | null } = {}) {
  const saludo = conNombre(cuerpo, o.nombre ? esc(o.nombre.split(" ")[0]) : "")
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEVISEBIT</title></head>
<body style="margin:0;background:#F5F6F8;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="background:#0E1116;border-radius:16px 16px 0 0;padding:22px 28px"><span style="font-size:20px;font-weight:800;letter-spacing:.04em;color:#fff">DEVISE<span style="color:#FF6A63">BIT</span></span></td></tr>
<tr><td style="background:#fff;padding:28px">${saludo}</td></tr>
<tr><td style="background:#fff;border-top:1px solid #EEF0F3;border-radius:0 0 16px 16px;padding:18px 28px;font-size:12px;line-height:1.6;color:#4A515C">
DEVISEBIT SRL · Software e IA. Desde 2009<br>${REDES.map((r) => `<a href="${r.href}" style="color:#C8231F;font-weight:600;text-decoration:none">${r.nombre}</a>`).join(" · ")}<br>WhatsApp +54 9 11 7346-6490 · <a href="https://www.devisebit.com" style="color:#4A515C">devisebit.com</a><br>
${o.baja ? `Recibís este correo porque estás en contacto con DEVISEBIT. <a href="${o.baja}" style="color:#4A515C">Darte de baja</a>.` : ""}
</td></tr></table></td></tr></table></body></html>`
}

/** Suma UTM a los links propios (devisebit.com) para ver en la web qué campaña trajo la visita. */
export function conUtm(u: string, campaniaId: number | string) {
  try {
    const x = new URL(u)
    if (!/(^|\.)devisebit\.com$/.test(x.hostname) || x.searchParams.has("utm_source")) return u
    x.searchParams.set("utm_source", "email"); x.searchParams.set("utm_medium", "email"); x.searchParams.set("utm_campaign", `envio-${campaniaId}`)
    return x.toString()
  } catch { return u }
}

/** Envuelve los links para medir clics y agrega el píxel de apertura. */
export function conSeguimiento(html: string, envioId: number | string, campaniaId?: number | string) {
  const base = `${URL_SISTEMA}/api/e`
  return html
    .replace(/href="(https?:\/\/[^"]+)"/g, (_m, u: string) => (u.includes("/baja/") ? `href="${u}"` : `href="${base}/c/${envioId}?u=${encodeURIComponent(campaniaId ? conUtm(u.replace(/&amp;/g, "&"), campaniaId) : u)}"`))
    .replace("</body>", `<img src="${base}/o/${envioId}" width="1" height="1" alt="" style="display:block;width:1px;height:1px"></body>`)
}

export async function enviarBrevo(to: { email: string; name?: string | null }, asunto: string, html: string, baja?: string | null, adjuntos?: { name: string; content: string }[]) {
  const key = process.env.BREVO_API_KEY
  if (!key) return { ok: false, error: "Falta BREVO_API_KEY" }
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: REMITENTE, replyTo: { email: RESPONDER_A }, to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }], subject: asunto, htmlContent: html,
        ...(adjuntos?.length ? { attachment: adjuntos } : {}),
        ...(baja ? { headers: { "List-Unsubscribe": `<${baja}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      }),
    })
    const j = await r.json().catch(() => ({}))
    await q("insert into em_log(tipo,email) values ($1,$2)", [r.ok ? "enviado" : "error", to.email])
    return r.ok ? { ok: true, id: j.messageId as string | undefined } : { ok: false, error: j.message ?? `Error ${r.status}` }
  } catch (e) { return { ok: false, error: (e as Error).message } }
}

export async function enviadosHoy() {
  const r = await one<{ n: number }>("select count(*)::int n from em_log where tipo='enviado' and creado >= date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires'")
  return r?.n ?? 0
}

/** Segmento → condición SQL sobre db_contactos (c). */
export type Segmento = { clases?: string[]; etapas?: string[]; sectores?: string[]; categorias?: string[]; tags?: string[]; fuentes?: string[]; soloSuscriptos?: boolean; excluirTags?: string[] }
export function segmentoSQL(s: Segmento, base = 1) {
  const cond = ["c.email is not null", "c.email_estado='activo'", "c.clase is not null", "c.clase<>'descartado'"], args: unknown[] = []
  const add = (sql: string, v: unknown) => { args.push(v); cond.push(sql.replace("$?", `$${base + args.length - 1}`)) }
  if (s.clases?.length) add("c.clase = any($?)", s.clases)
  if (s.etapas?.length) add("c.etapa = any($?)", s.etapas)
  if (s.sectores?.length) add("c.sector = any($?)", s.sectores)
  if (s.categorias?.length) add("c.categoria = any($?)", s.categorias)
  if (s.fuentes?.length) add("c.fuente = any($?)", s.fuentes)
  if (s.tags?.length) add("c.tags && $?::text[]", s.tags)
  if (s.excluirTags?.length) add("not (c.tags && $?::text[])", s.excluirTags)
  if (s.soloSuscriptos) cond.push("c.suscrito_en is not null")
  return { where: cond.join(" and "), args }
}
export async function contarSegmento(s: Segmento) {
  const { where, args } = segmentoSQL(s)
  return (await one<{ n: number }>(`select count(*)::int n from db_contactos c where ${where}`, args))?.n ?? 0
}

/** Arma la cola de una campaña (una fila por destinatario, sin repetir emails). */
export async function encolar(cid: number) {
  const c = await one<{ segmento: Segmento }>("select segmento from em_campanias where id=$1", [cid])
  if (!c) return 0
  const { where, args } = segmentoSQL(c.segmento ?? {}, 2)
  const r = await q(`insert into em_envios(campania_id, contacto_id, email) select distinct on (lower(c.email)) $1, c.id, lower(c.email) from db_contactos c where ${where} order by lower(c.email), c.id on conflict (campania_id, email) do nothing returning id`, [cid, ...args])
  return r.length
}

/** Manda lo pendiente respetando el límite diario. Devuelve cuántos salieron. */
export async function procesarCola(max = LIMITE_DIARIO) {
  if (!brevoConfigurado()) return { enviados: 0, motivo: "Brevo no configurado" }
  const cupo = Math.max(0, Math.min(max, LIMITE_DIARIO - (await enviadosHoy())))
  if (!cupo) return { enviados: 0, motivo: "Límite diario alcanzado" }
  const lote = await q<any>(
    `select e.id, e.email, e.campania_id, ct.nombre, ct.email_token, k.asunto, k.preheader, k.contenido, k.estilo, k.portada
     from em_envios e join em_campanias k on k.id=e.campania_id left join db_contactos ct on ct.id=e.contacto_id
     where e.estado='pendiente' and k.estado='enviando' order by e.campania_id, e.id limit $1`, [cupo])
  let enviados = 0
  for (const x of lote) {
    const vigente = await one<{ email_estado: string }>("select email_estado from db_contactos where lower(email)=lower($1)", [x.email])
    if (vigente && vigente.email_estado !== "activo") { await q("update em_envios set estado='omitido' where id=$1", [x.id]); continue }
    const baja = x.email_token ? `${URL_SISTEMA}/baja/${x.email_token}` : null
    const html = conSeguimiento(emailConEstilo(x.contenido, { estilo: x.estilo, portada: x.portada, preheader: x.preheader, baja, nombre: x.nombre }), x.id, x.campania_id)
    const r = await enviarBrevo({ email: x.email, name: x.nombre }, conNombre(x.asunto, x.nombre ? x.nombre.split(" ")[0] : "").replace(/^[,\s]+/, "").trim(), html, baja)
    await q("update em_envios set estado=$1, error=$2, proveedor_id=$3, enviado_en=case when $1='enviado' then now() else enviado_en end where id=$4", [r.ok ? "enviado" : "error", r.ok ? null : r.error, r.ok ? r.id ?? null : null, x.id])
    if (r.ok) enviados++
    else if (/key|unauthorized|forbidden|limit|quota|sender|not valid|activat|blocked|suspend/i.test(r.error ?? "")) break
  }
  await q(`update em_campanias k set estado='enviada', terminada=now() where estado='enviando' and not exists (select 1 from em_envios e where e.campania_id=k.id and e.estado='pendiente')`)
  return { enviados, motivo: lote.length < cupo ? "Cola vacía" : "Sigue mañana" }
}

/** Diagnóstico de Brevo: cuenta, créditos y si el remitente está validado. */
export async function diagnosticoBrevo(): Promise<{ ok: boolean; problemas: string[]; info: string[] }> {
  const key = process.env.BREVO_API_KEY
  if (!key) return { ok: false, problemas: ["Falta la clave de Brevo (BREVO_API_KEY) en Vercel."], info: [] }
  const h = { "api-key": key, accept: "application/json" }
  const problemas: string[] = [], info: string[] = []
  try {
    const a = await fetch("https://api.brevo.com/v3/account", { headers: h, cache: "no-store" })
    if (a.status === 401) {
      const m = String((await a.json().catch(() => ({}))).message ?? "")
      if (/ip/i.test(m)) return { ok: false, problemas: [`Brevo bloquea el envío porque viene de una IP no autorizada (Vercel cambia de IP). En Brevo → Seguridad → IP autorizadas, desactivá el bloqueo de IP desconocidas. Mensaje de Brevo: «${m}»`], info }
      return { ok: false, problemas: [`Brevo rechaza la clave (BREVO_API_KEY inválida o revocada). Generá una nueva en Brevo → SMTP y API → Claves API y cargala en Vercel.${m ? ` Mensaje de Brevo: «${m}»` : ""}`], info }
    }
    const ja = await a.json().catch(() => ({}))
    const planes = (ja.plan ?? []) as { type: string; credits: number; creditsType: string }[]
    for (const pl of planes) info.push(`Plan ${pl.type}: ${pl.credits} ${pl.creditsType === "sendLimit" ? "envíos disponibles" : "créditos"}`)
    if (planes.length && planes.every((pl) => Number(pl.credits) <= 0)) problemas.push("La cuenta de Brevo no tiene créditos de envío disponibles.")
    if (ja.relay && ja.relay.enabled === false) problemas.push("El envío transaccional (SMTP) de Brevo no está activado en la cuenta: hay que pedir la activación en Brevo → SMTP y API.")
  } catch (e) { problemas.push("No se pudo consultar la cuenta de Brevo: " + (e as Error).message) }
  try {
    const r = await fetch("https://api.brevo.com/v3/senders", { headers: h, cache: "no-store" })
    const j = await r.json().catch(() => ({}))
    const lista = (j.senders ?? []) as { email: string; active: boolean }[]
    const s = lista.find((x) => x.email.toLowerCase() === REMITENTE.email.toLowerCase())
    if (!s) problemas.push(`El remitente ${REMITENTE.email} no está cargado en Brevo. Agregalo en Brevo → Remitentes, dominio e IP, o usá uno validado${lista.length ? ` (validados: ${lista.filter((x) => x.active).map((x) => x.email).join(", ") || "ninguno"})` : ""}.`)
    else if (!s.active) problemas.push(`El remitente ${REMITENTE.email} está cargado en Brevo pero sin validar: confirmá el correo de verificación o autenticá el dominio devisebit.com.`)
    else info.push(`Remitente ${REMITENTE.email} validado.`)
  } catch {}
  return { ok: problemas.length === 0, problemas, info }
}
