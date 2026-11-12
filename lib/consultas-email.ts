import { q, one } from "./db"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { linkBrief } from "./brief"
import { linkAgenda } from "./agenda"
import { material } from "./materiales"
import { validarEmail } from "./demos"

/** Lo que el equipo le manda al cliente desde la consulta: el link de agenda, el brief o un material de lib/materiales. */
export type Envio = "agenda" | "brief" | "material"

const CIERRE = "Cualquier duda, respondé este correo o escribinos por WhatsApp al +54 9 11 7346-6490.\n\n**Equipo de DEVISEBIT**"
const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Asunto, cuerpo (texto simple de lib/email) y etiqueta para el registro de cada envío. {{nombre}} lo completa la plantilla. */
export async function correoDeConsulta(cid: number, que: Envio, k?: string): Promise<{ asunto: string; md: string; preheader: string; etiqueta: string } | null> {
  if (que === "material") {
    const m = material(k ?? "")
    if (!m) return null
    const cuerpo = m.link ? `${mayus(m.frase)}.\n\n[[${m.boton}|${m.link}]]` : `${mayus(m.frase)}:`
    return {
      asunto: `${m.n.replace(/^Landing · /, "").replace(/ \(PDF\)$/, "")} · DEVISEBIT`, preheader: `${mayus(m.frase)}.`, etiqueta: m.n,
      md: `Hola {{nombre}}:\n\n${cuerpo}\n\n${m.correo ? m.correo + "\n\n" : ""}${CIERRE}`,
    }
  }
  const brief = await linkBrief(cid)
  if (que === "brief") return {
    asunto: "Tu brief para la propuesta preliminar · DEVISEBIT", preheader: "3 minutos y te mandamos la propuesta en 48 h hábiles.", etiqueta: "Brief",
    md: `Hola {{nombre}}:\n\nPara armarte una **propuesta preliminar con alcance, plazo e inversión en 48 h hábiles**, completá este brief de 3 minutos.\n\n[[Completar el brief|${brief}]]\n\n${CIERRE}`,
  }
  return {
    asunto: "Elegí el horario de nuestra videollamada · DEVISEBIT", preheader: "Videollamada de 30 minutos, sin costo.", etiqueta: "Link para agendar",
    md: `Hola {{nombre}}:\n\nPara conversar sobre lo que necesitás, elegí el día y el horario que te queden cómodos para una videollamada de 30 minutos, sin costo.\n\n[[Elegir día y horario|${linkAgenda(brief.split("/").pop()!)}]]\n\n${CIERRE}`,
  }
}

/**
 * Manda por email (Brevo, con la plantilla y el «responder a» de siempre) el link de agenda, el brief o un material.
 * Si la consulta no tiene email, usa `emailNuevo`: lo valida y lo guarda en la consulta (y en su contacto del CRM si no tenía) antes de enviar.
 */
export async function enviarAConsulta(cid: number, que: Envio, o: { k?: string; emailNuevo?: string | null } = {}): Promise<{ ok: boolean; email?: string; etiqueta?: string; error?: string }> {
  const c = await one<{ nombre: string | null; email: string | null }>("select nombre, email from consultas where id=$1", [cid])
  if (!c) return { ok: false, error: "No se encontró la consulta." }
  const correo = await correoDeConsulta(cid, que, o.k)
  if (!correo) return { ok: false, error: "Elegí qué material mandar." }
  let email = c.email?.trim() || null
  if (!email) {
    if (!o.emailNuevo?.trim()) return { ok: false, etiqueta: correo.etiqueta, error: "Falta el email del cliente: escribilo y volvé a enviar." }
    const v = await validarEmail(o.emailNuevo)
    if (!v.ok) return { ok: false, etiqueta: correo.etiqueta, error: v.error }
    email = v.email
    await q("update consultas set email=$1, actualizado=now() where id=$2 and coalesce(email,'')=''", [email, cid])
    // El contacto del CRM de esta consulta también lo recibe, salvo que ese email ya sea de otro contacto
    await q("update db_contactos set email=$1, actualizado=now() where consulta_id=$2 and email is null and not exists (select 1 from db_contactos x where lower(x.email)=lower($1))", [email, cid]).catch(() => {})
  }
  const r = await enviarBrevo({ email, name: c.nombre }, correo.asunto, plantilla(aHtml(correo.md), { nombre: c.nombre, preheader: correo.preheader }))
  return { ok: r.ok, email, etiqueta: correo.etiqueta, error: r.ok ? undefined : String((r as { error?: string }).error ?? "error") }
}
