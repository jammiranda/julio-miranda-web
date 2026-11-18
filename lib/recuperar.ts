import { one } from "./db"
import { linkBrief } from "./brief"
import { linkAgenda } from "./agenda"
import { guardarDesdeApi, type ItemApi } from "./prospeccion"
import { hoyISO } from "./util"
import { modelos, aplicar, esBase } from "./modelos"

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
 * Deja en Acercamientos (para hoy) los mensajes de una consulta armados con los modelos elegidos
 * (sin elegir: los dos de recuperación). Se editan en Comunicación → Modelos de mensaje.
 */
export async function prepararRecuperacion(cid: number, por: string, ids?: string[]) {
  const c = await one<any>("select nombre, organizacion, telefono, email, motivo from consultas where id=$1", [cid])
  if (!c) return null
  const nombre = c.nombre ? String(c.nombre).split(" ")[0] : null
  const tema = c.motivo ? String(c.motivo).replace(/\s+/g, " ").trim().replace(/^./, (x: string) => x.toLowerCase()) : "nuestros servicios"
  const org = c.organizacion || c.nombre || `Consulta ${cid}`
  const todos = await modelos()
  const elegidos = ids?.length ? todos.filter((m) => ids.includes(m.id)) : todos.filter((m) => esBase(m.id))
  const items: ItemApi[] = []
  for (const m of elegidos) {
    const destino = m.canal === "email" ? c.email : c.telefono
    if (!destino) continue
    const asunto = m.canal === "email" ? aplicar(m.asunto || "DEVISEBIT", { nombre, tema }) : `Recuperar consulta: ${tema}`
    const sufijo = m.id === "recuperar-email" ? "brief" : m.id === "recuperar-wa" ? "wa" : `m:${m.id}`
    items.push({
      ref: `consulta:${cid}:${sufijo}`, campania: "Recuperar consultas", tipo: "cliente", sentido: "saliente", organizacion: org, persona: nombre, estado: "borrador", seguimiento: hoyISO(),
      canal: m.canal === "email" ? "gmail" : "whatsapp", destino, asunto,
      notas: `SUGERENCIA:\nConsultó por ${tema}. Armado con el modelo «${m.nombre}».\n\n${m.canal === "email" ? `ASUNTO:\n${asunto}\n\n` : ""}MENSAJE:\n${aplicar(m.cuerpo, { nombre, tema })}`.slice(0, 2000),
    })
  }
  if (!items.length) return null
  await guardarDesdeApi(items, por)
  return { buscar: c.email || c.telefono, cuantos: items.length }
}
