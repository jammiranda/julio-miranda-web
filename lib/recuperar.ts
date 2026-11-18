import { one } from "./db"
import { linkBrief } from "./brief"
import { linkAgenda } from "./agenda"
import { guardarDesdeApi, type ItemApi } from "./prospeccion"
import { hoyISO } from "./util"

/** Links propios de una consulta: el formulario de 3 minutos (brief) y la agenda para elegir horario. */
export async function linksConsulta(cid: number) {
  const brief = await linkBrief(cid)
  return { brief, agenda: linkAgenda(brief.split("/").pop()!) }
}

/** Reemplaza {{brief}} y {{agenda}} por los links reales de la consulta. */
export async function conLinks(texto: string, cid: number | null) {
  if (!/\{\{(brief|agenda)\}\}/.test(texto)) return texto
  if (!cid) return texto.replaceAll("{{brief}}", "https://sistema.devisebit.com/agendar").replaceAll("{{agenda}}", "https://sistema.devisebit.com/agendar")
  const l = await linksConsulta(cid)
  return texto.replaceAll("{{brief}}", l.brief).replaceAll("{{agenda}}", l.agenda)
}

export const cidDeRef = (ref: unknown) => { const m = /^consulta:(\d+)/.exec(String(ref ?? "")); return m ? Number(m[1]) : null }

/**
 * MODELO BASE para recuperar una consulta que no cerró. Se usa desde la ficha de la consulta («Recuperar esta consulta»)
 * y deja los mensajes como borradores en Acercamientos, donde se pueden editar antes de enviar.
 * {{brief}} y {{agenda}} se cambian solos por los links de esa consulta.
 */
export const MODELO_EMAIL = (nombre: string | null, tema: string) => ({
  asunto: `${nombre ? nombre + ", " : ""}avancemos con ${tema} sin esperar la reunión`,
  mensaje: `Hola${nombre ? " " + nombre : ""}, ¿cómo estás? Te escribe Julio, de DEVISEBIT.

Hace unos días nos consultaste por ${tema} y no quiero que quede en el aire. Te propongo avanzar sin depender de una reunión.

Para armarte una propuesta concreta necesito conocer un poco más tu negocio. Son 3 minutos, desde el celular:

{{brief}}

Con eso te preparo un plan a medida, con alcance, plazo e inversión.

Y si preferís hablarlo, elegí el horario que te quede cómodo acá y te llamo yo:
{{agenda}}

Un abrazo,
Julio Miranda
DEVISEBIT`,
})
export const MODELO_WHATSAPP = (nombre: string | null, tema: string) =>
  `${nombre ? "Hola " + nombre : "Hola"}, ¿cómo estás? Soy Julio, de DEVISEBIT. Hace unos días nos escribiste por ${tema} y no quiero que quede en el aire.

Si seguís con la idea, contame en dos líneas de qué es tu negocio y qué necesitás, y te paso una propuesta concreta hoy mismo. Si te resulta más cómodo, lo completás acá en 3 minutos: {{brief}}

Y si ya lo resolviste, avisame y no te molesto más. ¡Gracias!`

/** Deja en Acercamientos (para hoy) el email y/o el WhatsApp de recuperación de una consulta. Devuelve qué buscar para verlos. */
export async function prepararRecuperacion(cid: number, por: string) {
  const c = await one<any>("select nombre, organizacion, telefono, email, motivo from consultas where id=$1", [cid])
  if (!c) return null
  const nombre = c.nombre ? String(c.nombre).split(" ")[0] : null
  const tema = c.motivo ? String(c.motivo).replace(/\s+/g, " ").trim().replace(/^./, (x: string) => x.toLowerCase()) : "nuestros servicios"
  const org = c.organizacion || c.nombre || `Consulta ${cid}`
  const comun = { campania: "Recuperar consultas", tipo: "cliente", sentido: "saliente", organizacion: org, persona: nombre, estado: "borrador", seguimiento: hoyISO() }
  const items: ItemApi[] = []
  if (c.email) { const m = MODELO_EMAIL(nombre, tema); items.push({ ...comun, ref: `consulta:${cid}:brief`, canal: "gmail", destino: c.email, asunto: m.asunto, notas: `SUGERENCIA:\nConsultó por ${tema} y no cerró. Email con el formulario y la agenda.\n\nASUNTO:\n${m.asunto}\n\nMENSAJE:\n${m.mensaje}` }) }
  if (c.telefono) items.push({ ...comun, ref: `consulta:${cid}:wa`, canal: "whatsapp", destino: c.telefono, asunto: `Recuperar consulta: ${tema}`, notas: `SUGERENCIA:\nConsultó por ${tema} y no cerró. Mensaje corto para reabrir la conversación.\n\nMENSAJE:\n${MODELO_WHATSAPP(nombre, tema)}` })
  if (!items.length) return null
  await guardarDesdeApi(items, por)
  return { buscar: c.email || c.telefono, cuantos: items.length }
}
