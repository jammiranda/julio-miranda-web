import { agregar, decidir, esJulio, obtener, procesarOrden, textoPropuesta, transcribir, ultimaPropuesta } from "./oficina"
import { cuenta, enviarTexto } from "./whatsapp"
import type { Empresa } from "./bots/conocimiento"

export { esJulio }

export async function bajarAudio(e: Empresa, mediaId: string): Promise<{ buf: ArrayBuffer; mime: string } | null> {
  const { token } = cuenta(e)
  if (!token) return null
  const v = process.env.WA_GRAPH_VERSION ?? "v23.0"
  const meta = await fetch(`https://graph.facebook.com/${v}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  if (!meta?.url) return null
  const r = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return null
  return { buf: await r.arrayBuffer(), mime: String(meta.mime_type ?? "audio/ogg") }
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

/** Mensajes de Julio al número de DEVISEBIT: van al jefe de gabinete (texto o audio), no al bot de ventas. */
export async function jefePorWhatsApp(e: Empresa, m: any) {
  const a = m.from as string
  const decir = (t: string) => enviarTexto(e, a, t).catch(() => {})
  let texto: string | null = m.type === "text" ? (m.text?.body ?? null) : (m[m.type]?.caption ?? null)
  let eco = ""
  let canal = "whatsapp"
  if (m.type === "audio" && m.audio?.id) {
    canal = "voz"
    const au = await bajarAudio(e, m.audio.id)
    texto = au ? await transcribir(au.buf, au.mime) : null
    if (!texto) return decir("Recibí tu audio, pero todavía no puedo transcribirlo desde acá. Mandámelo escrito y lo tomo igual.")
    eco = `Te escuché: «${texto.slice(0, 300)}»\n\n`
  }
  if (!texto?.trim()) return decir("Mandame la orden por texto o con un audio y la reparto.")
  const n = norm(texto)
  const prop = await ultimaPropuesta()
  if (prop && /^(ok|oka|dale|si|sii|aprobado|aprobar|aprobada|listo|adelante|va)\b/.test(n)) {
    const r = await decidir(prop.id, true)
    return decir(r.ok ? `Listo. Repartí ${r.tareas} tarea${r.tareas === 1 ? "" : "s"}: cada agente la toma en su próxima corrida.` : "No pude aprobarla. Revisala en la Oficina.")
  }
  if (prop && /^(no|nop|rechazo|rechazar|rechazada|cancelar|cancela|descartar)\b/.test(n)) {
    await decidir(prop.id, false)
    return decir("Descartada. No repartí nada.")
  }
  const id = await agregar("ordenes", { texto: texto.trim().slice(0, 1500), estado: "nueva", creado: new Date().toISOString(), por: "Julio", canal })
  const r = await procesarOrden(id)
  const o = await obtener("ordenes", id)
  if (!r.ok || !o) return decir(`${eco}La anoté en la Oficina, pero no pude analizarla ahora. La ves ahí para reintentar.`)
  if (o.data.estado === "propuesta") return decir(eco + textoPropuesta(o))
  return decir(eco + String(o.data.resumen ?? "Listo."))
}
