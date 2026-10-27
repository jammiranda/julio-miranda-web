import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, randomBytes } from "crypto"
import { q, one, audit } from "./db"
import { secret } from "./auth"
import { URL_SISTEMA } from "./brief"
import { aHtml, plantilla, enviarBrevo } from "./email"

/**
 * Portal del cliente: cada cliente entra con un link por email (sin contraseña)
 * y ve la trazabilidad de sus proyectos: fase, novedades, entregas, documentos,
 * reuniones y lo que necesita aprobar.
 */

export const FASES = [
  { v: "inicio", n: "Contratación e inicio", d: "Firmamos, armamos el equipo y el plan de trabajo." },
  { v: "relevamiento", n: "Relevamiento", d: "Entendemos tus procesos, datos y necesidades." },
  { v: "diseno", n: "Diseño", d: "Definimos pantallas, flujos y la identidad visual." },
  { v: "desarrollo", n: "Desarrollo", d: "Construimos e integramos con lo que ya usás." },
  { v: "pruebas", n: "Pruebas y ajustes", d: "Probamos juntos y corregimos antes de salir." },
  { v: "entrega", n: "Entrega y capacitación", d: "Publicamos, capacitamos y entregamos la documentación." },
  { v: "soporte", n: "Soporte y mejora continua", d: "Acompañamiento, mantenimiento y nuevas mejoras." },
] as const
export type Fase = (typeof FASES)[number]["v"]
export const faseIdx = (v: string | null | undefined) => Math.max(0, FASES.findIndex((f) => f.v === v))
export const fase = (v: string | null | undefined) => FASES[faseIdx(v)]

export const TIPOS_HITO = [
  { v: "avance", n: "Avance", i: "▲" },
  { v: "entrega", n: "Entrega", i: "★" },
  { v: "documento", n: "Documento", i: "▤" },
  { v: "reunion", n: "Reunión", i: "◷" },
  { v: "pago", n: "Pago / factura", i: "$" },
  { v: "aprobacion", n: "Para aprobar", i: "✓" },
  { v: "cliente", n: "Mensaje del cliente", i: "✉" },
  { v: "sistema", n: "Registro automático", i: "•" },
] as const
export const tipoHito = (v: string) => TIPOS_HITO.find((t) => t.v === v) ?? TIPOS_HITO[0]

export type Hito = {
  id: number; proyecto_id: number; tipo: string; titulo: string; detalle: string | null; url: string | null
  fecha: string; visible: boolean; requiere_ok: boolean; ok_en: string | null; ok_comentario: string | null; autor: string | null
}

/** Rutas del portal: si existe PORTAL_URL (p. ej. https://portal.devisebit.com) se usa ese dominio. */
export function urlPortal(path = "") {
  const base = process.env.PORTAL_URL?.replace(/\/$/, "")
  return base ? `${base}${path || "/"}` : `${URL_SISTEMA}/portal${path}`
}

// ── Sesión del cliente (separada de la del equipo) ──
const COOKIE = "db_cliente"
export type Cliente = { id: number; nombre: string; organizacion: string | null; email: string }

async function crearSesionCliente(contactoId: number) {
  const token = await new SignJWT({ cid: contactoId, typ: "cliente" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(await secret())
  cookies().set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
}
export function cerrarSesionCliente() { cookies().delete(COOKIE) }

export async function clienteActual(): Promise<Cliente | null> {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  try {
    const { payload } = await jwtVerify(t, await secret())
    if (payload.typ !== "cliente") return null
    return await one<Cliente>("select id, nombre, organizacion, email from db_contactos where id=$1 and email is not null", [payload.cid])
  } catch { return null }
}
export async function requerirCliente(): Promise<Cliente> {
  const c = await clienteActual()
  if (!c) redirect("/portal/entrar")
  return c
}

// ── Links de acceso de un solo uso ──
const hash = (t: string) => createHash("sha256").update(t).digest("hex")

/** ¿El contacto tiene algo para ver? (al menos un proyecto no cancelado) */
export async function tienePortal(contactoId: number) {
  return !!(await one("select 1 from db_proyectos where contacto_id=$1 and estado<>'cancelado' limit 1", [contactoId]))
}

export async function crearAcceso(contactoId: number, motivo: "ingreso" | "invitacion") {
  const tok = randomBytes(32).toString("base64url")
  const horas = motivo === "invitacion" ? 24 * 7 : 1
  await q("insert into portal_accesos(contacto_id, token_hash, expira, motivo) values ($1,$2, now() + ($3 || ' hours')::interval, $4)", [contactoId, hash(tok), String(horas), motivo])
  return { url: urlPortal(`/acceso/${tok}`), horas }
}

/** Manda el link por email. Devuelve ok/errores para mostrar al equipo. */
export async function enviarAcceso(contactoId: number, motivo: "ingreso" | "invitacion") {
  const c = await one<{ nombre: string; email: string | null; organizacion: string | null }>("select nombre, email, organizacion from db_contactos where id=$1", [contactoId])
  if (!c?.email) return { ok: false, error: "El contacto no tiene email cargado." }
  const { url, horas } = await crearAcceso(contactoId, motivo)
  const vence = horas >= 24 ? `${horas / 24} días` : "1 hora"
  const md = motivo === "invitacion"
    ? `# Tu portal de cliente ya está activo\n\nHola {{nombre}}, desde hoy podés seguir tu proyecto con DEVISEBIT en un solo lugar: en qué etapa está, qué entregamos, los documentos, las próximas reuniones y lo que necesitamos que apruebes.\n\nNo necesitás contraseña: entrás con este botón y, las próximas veces, pidiendo un link nuevo con tu email.\n\n[[Entrar a mi portal|${url}]]\n\nEl botón vale por ${vence} y se usa una sola vez. Cualquier duda, respondé este correo o escribinos por WhatsApp.`
    : `# Tu link para entrar al portal\n\nHola {{nombre}}, este es tu acceso al portal de clientes de DEVISEBIT.\n\n[[Entrar a mi portal|${url}]]\n\nVale por ${vence} y se usa una sola vez. Si no lo pediste vos, ignorá este correo: nadie puede entrar sin este link.`
  const r = await enviarBrevo({ email: c.email, name: c.nombre }, motivo === "invitacion" ? "Tu portal de cliente DEVISEBIT" : "Tu acceso al portal DEVISEBIT", plantilla(aHtml(md), { nombre: c.nombre, preheader: "Seguí tu proyecto en un solo lugar" }))
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar el email" }
}

/** Valida el token sin consumirlo (para mostrar la página de ingreso). */
export async function verAcceso(tok: string) {
  return await one<{ id: number; contacto_id: number; nombre: string }>(
    "select a.id, a.contacto_id, c.nombre from portal_accesos a join db_contactos c on c.id=a.contacto_id where a.token_hash=$1 and a.usado is null and a.expira > now()",
    [hash(tok)],
  )
}

/** Consume el token (un solo uso) y abre la sesión. */
export async function usarAcceso(tok: string) {
  const a = await one<{ contacto_id: number }>("update portal_accesos set usado=now() where token_hash=$1 and usado is null and expira > now() returning contacto_id", [hash(tok)])
  if (!a) return false
  await crearSesionCliente(a.contacto_id)
  await q("update db_contactos set portal_ultimo=now() where id=$1", [a.contacto_id])
  await audit({ id: 0, usuario: `cliente:${a.contacto_id}` }, "portal_ingreso", "db_contacto", a.contacto_id)
  return true
}

// ── Novedades del proyecto ──
export async function registrarHito(pid: number, h: { tipo: string; titulo: string; detalle?: string | null; url?: string | null; fecha?: string | null; visible?: boolean; requiere_ok?: boolean; autor?: string | null }) {
  return await one<{ id: number }>(
    "insert into db_hitos(proyecto_id,tipo,titulo,detalle,url,fecha,visible,requiere_ok,autor) values ($1,$2,$3,$4,$5,coalesce($6::timestamptz, now()),$7,$8,$9) returning id",
    [pid, h.tipo, h.titulo.slice(0, 200), h.detalle ?? null, h.url ?? null, h.fecha && h.fecha.length === 10 ? `${h.fecha}T12:00:00-03:00` : h.fecha ?? null, h.visible ?? true, h.requiere_ok ?? false, h.autor ?? null],
  )
}

/** Avisa al cliente por email de una novedad (con link directo al proyecto en el portal). */
export async function avisarNovedad(pid: number, hito: { titulo: string; detalle?: string | null; requiere_ok?: boolean }) {
  const p = await one<{ nombre: string; contacto_id: number | null }>("select nombre, contacto_id from db_proyectos where id=$1", [pid])
  if (!p?.contacto_id) return { ok: false, error: "El proyecto no tiene cliente asignado." }
  const c = await one<{ nombre: string; email: string | null }>("select nombre, email from db_contactos where id=$1", [p.contacto_id])
  if (!c?.email) return { ok: false, error: "El cliente no tiene email cargado." }
  const { url: acceso } = await crearAcceso(p.contacto_id, "invitacion")
  const url = `${acceso}?ir=${encodeURIComponent(`/portal/p/${pid}`)}`
  const md = `# ${hito.requiere_ok ? "Necesitamos tu aprobación" : "Novedad en tu proyecto"}\n\nHola {{nombre}}, hay una novedad en **${p.nombre}**:\n\n**${hito.titulo}**${hito.detalle ? `\n\n${hito.detalle.slice(0, 600)}` : ""}\n\n[[${hito.requiere_ok ? "Revisar y aprobar" : "Ver en mi portal"}|${url}]]\n\nTodo el historial del proyecto queda guardado en tu portal.`
  const r = await enviarBrevo({ email: c.email, name: c.nombre }, `${hito.requiere_ok ? "Para aprobar" : "Novedad"} · ${p.nombre}`, plantilla(aHtml(md), { nombre: c.nombre, preheader: hito.titulo }))
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar" }
}

/** Proyectos que puede ver el cliente (solo los suyos). */
export async function proyectosDe(cid: number) {
  return await q<any>(
    `select p.id, p.nombre, p.estado, p.fase, p.inicio, p.entrega, p.responsable, p.trello_board, p.actualizado, s.nombre servicio,
       (select count(*)::int from db_hitos h where h.proyecto_id=p.id and h.visible and h.requiere_ok and h.ok_en is null) pendientes,
       (select max(h.fecha) from db_hitos h where h.proyecto_id=p.id and h.visible) ultima
     from db_proyectos p left join db_servicios s on s.id=p.servicio_id
     where p.contacto_id=$1 and p.estado<>'cancelado' order by p.estado='terminado', p.actualizado desc`,
    [cid],
  )
}
export async function proyectoDe(cid: number, pid: number) {
  return await one<any>(
    `select p.*, s.nombre servicio from db_proyectos p left join db_servicios s on s.id=p.servicio_id where p.id=$1 and p.contacto_id=$2 and p.estado<>'cancelado'`,
    [pid, cid],
  )
}

/** Limita pedidos de link: máximo 3 por contacto cada 15 minutos. */
export async function puedePedirLink(contactoId: number) {
  const r = await one<{ n: number }>("select count(*)::int n from portal_accesos where contacto_id=$1 and motivo='ingreso' and creado > now() - interval '15 minutes'", [contactoId])
  return (r?.n ?? 0) < 3
}
