import { randomBytes } from "crypto"
import { promises as dns } from "dns"
import { q, one } from "./db"
import { enviarBrevo, plantilla } from "./email"
import { URL_SISTEMA } from "./brief"

/**
 * Demos privadas: no son públicas. Se piden con email (web, bot o el equipo) y llegan por correo
 * con un link personal que vence. El autodiagnóstico de transformación digital sí es público.
 */
export type DemoInfo = { slug: string; titulo: string; texto: string }
export const DEMOS: DemoInfo[] = [
  { slug: "whatsapp", titulo: "Asistente de WhatsApp con IA", texto: "Chateá como si fueras un cliente y mirá cómo se llena el tablero." },
  { slug: "webs", titulo: "Páginas web con IA", texto: "Elegí rubro, nombre y color, y mirá tu web armada al instante." },
  { slug: "sistemas", titulo: "Sistemas a medida", texto: "Un sistema de gestión con módulos que se activan según lo que necesitás." },
  { slug: "padron", titulo: "Sistema de padrón", texto: "Afiliados, aportes y credencial digital, del lado del administrador y del afiliado." },
  { slug: "obras-sociales", titulo: "Sistema para obras sociales", texto: "Afiliados, órdenes, autorizaciones, prestadores y tablero de la conducción." },
  { slug: "academia", titulo: "Plataforma de cursos", texto: "Inscripción, aula, examen y certificado verificable." },
  { slug: "panel-de-contenido", titulo: "Panel de Contenido", texto: "Redes, web, competencia y publicaciones en un solo tablero." },
]
export const demoInfo = (slug: string) => DEMOS.find((d) => d.slug === slug)
/** Videos de 1 minuto (carpeta no listada de la web). */
export const VIDEO_BASE = "https://www.devisebit.com/dv-e96893d90d8d"
export const videoDe = (slug: string, blanca: boolean) => `${VIDEO_BASE}/${slug}${blanca ? "-marca-blanca" : ""}.mp4`

const DESCARTABLES = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com", "mohmal.com", "emailondeck.com"]

/** Email real: formato, sin dominios descartables y con servidor de correo (MX). */
export async function validarEmail(email: string | null | undefined): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const e = (email ?? "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) || e.length > 160) return { ok: false, error: "El email no es válido." }
  const dom = e.split("@")[1]
  if (DESCARTABLES.some((d) => dom === d || dom.endsWith("." + d))) return { ok: false, error: "Usá un email permanente (no temporal)." }
  if (!process.env.SIN_VALIDAR_MX) try {
    const mx = await Promise.race([dns.resolveMx(dom), new Promise<never>((_, r) => setTimeout(() => r(new Error("t")), 4000))])
    if (!mx?.length) return { ok: false, error: "Ese dominio no recibe emails. Revisá que esté bien escrito." }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "ENOTFOUND" || code === "ENODATA") return { ok: false, error: "Ese dominio no recibe emails. Revisá que esté bien escrito." }
    // si el DNS no responde a tiempo, no bloqueamos
  }
  return { ok: true, email: e }
}

export type Acceso = { id: number; token: string; email: string; nombre: string | null; demos: string[]; blanca: boolean; expira: Date }

export async function crearAcceso(o: { email: string; nombre?: string | null; demos: string[]; blanca?: boolean; dias?: number; origen: string; por?: string | null; contactoId?: number | null }): Promise<Acceso> {
  const demos = o.demos.filter((d) => demoInfo(d))
  const token = randomBytes(18).toString("base64url")
  const r = await one<Acceso>(
    `insert into demo_accesos(token,email,nombre,demos,blanca,expira,origen,creado_por,contacto_id) values ($1,$2,$3,$4,$5,now() + ($6 || ' days')::interval,$7,$8,$9) returning id, token, email, nombre, demos, blanca, expira`,
    [token, o.email, o.nombre ?? null, demos.length ? demos : DEMOS.map((d) => d.slug), !!o.blanca, String(Math.min(Math.max(o.dias ?? 14, 1), 90)), o.origen, o.por ?? null, o.contactoId ?? null],
  )
  return r!
}

export const linkAcceso = (a: { token: string }) => `${URL_SISTEMA}/demo/${a.token}`

export async function enviarAcceso(a: Acceso) {
  const lista = a.demos.map((s) => demoInfo(s)).filter(Boolean) as DemoInfo[]
  const varias = lista.length > 1
  const link = linkAcceso(a)
  const vence = new Date(a.expira).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long" })
  const cuerpo = `<p style="margin:0 0 12px;font-size:16px">Hola${a.nombre ? ` ${a.nombre.split(" ")[0]}` : ""} 👋</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#262C37">Te dejamos ${varias ? "las demos que pediste" : `la demo de <strong>${lista[0]?.titulo ?? "nuestro producto"}</strong>`}. Funcionan en el navegador de tu celular o compu, con datos de ejemplo: podés tocar todo, ver el recorrido guiado o mirar el video de un minuto.</p>
<ul style="margin:0 0 18px;padding-left:18px;font-size:15px;line-height:1.7;color:#262C37">${lista.map((d) => `<li><strong>${d.titulo}</strong>: ${d.texto}</li>`).join("")}</ul>
<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#C8231F;color:#fff;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:10px">Abrir ${varias ? "las demos" : "la demo"}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#4A515C">El link es personal y vale hasta el ${vence}. Las demos muestran las funciones básicas: el sistema completo tiene más módulos, que vemos juntos en una presentación.</p>
<p style="margin:0;font-size:13px;color:#4A515C">¿Querés verlo con tus datos? Respondé este correo o escribinos por WhatsApp al +54 9 11 7346-6490.</p>`
  return enviarBrevo({ email: a.email, name: a.nombre }, varias ? "Tus demos de DEVISEBIT" : `Tu demo: ${lista[0]?.titulo ?? "DEVISEBIT"}`, plantilla(cuerpo, { preheader: "Tu link personal para probar las demos" }))
}

/** Busca o crea el contacto en el CRM a partir de una consulta web. */
export async function consultaYContacto(d: { nombre: string; email: string; organizacion?: string | null; telefono?: string | null; motivo: string; mensaje?: string | null; fuente: string }) {
  const c = await one<{ id: number }>(
    "insert into consultas(canal,nombre,telefono,organizacion,email,motivo,mensaje,fuente) values ('web',$1,$2,$3,$4,$5,$6,$7) returning id",
    [d.nombre, d.telefono ?? null, d.organizacion ?? null, d.email, d.motivo, d.mensaje ?? null, d.fuente],
  )
  const { alCRM } = await import("./bot")
  await alCRM(c!.id, "web").catch(() => {})
  const ct = await one<{ id: number }>("select id from db_contactos where lower(email)=lower($1)", [d.email])
  return { consultaId: c!.id, contactoId: ct?.id ?? null }
}
