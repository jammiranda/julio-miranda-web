import { q } from "./db"

/**
 * Importar información al bot: un PDF, un texto/CSV/Markdown, texto pegado o una página web.
 * La IA lo convierte en pares "cuando pregunten… / el bot tiene que saber…" y los deja como
 * sugerencias para aprobar (el bot no los usa hasta que alguien los aprueba en Bot → Conocimiento).
 */
type Fuente = { nombre: string; texto?: string | null; pdfBase64?: string | null }

const limpiar = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()

export async function leerUrl(url: string) {
  const r = await fetch(url, { headers: { "user-agent": "devisebit-bot-importador" }, signal: AbortSignal.timeout(15000), cache: "no-store" })
  if (!r.ok) throw new Error(`La página respondió ${r.status}`)
  return limpiar(await r.text()).slice(0, 60000)
}

export async function importarConocimiento(f: Fuente, empresa: string, autor: string) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false as const, error: "La IA no está activa (falta la clave de Anthropic)." }
  const instruccion = `Sos el editor del conocimiento de "Bit", el asistente de WhatsApp de DEVISEBIT SRL (software e IA). Te paso información de "${f.nombre}".
Extraé lo que le sirve al bot para responder a clientes: servicios, condiciones, plazos, requisitos, horarios, procesos, preguntas frecuentes, datos de contacto y políticas.
Devolvé SOLO un JSON: {"items":[{"pregunta":"cómo lo preguntaría un cliente","respuesta":"lo que el bot tiene que saber, en 1 a 4 oraciones claras, en español rioplatense"}]}
Reglas: entre 3 y 25 items; nada inventado ni deducido: solo lo que dice la fuente; sin datos personales de terceros; sin precios si la fuente no los dice; agrupá lo repetido.`
  const content: any[] = []
  if (f.pdfBase64) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.pdfBase64 } })
  content.push({ type: "text", text: f.texto ? `${instruccion}\n\n--- FUENTE ---\n${f.texto.slice(0, 60000)}` : instruccion })
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL_REVISION ?? "claude-sonnet-5-5", max_tokens: 4000, messages: [{ role: "user", content }] }),
  })
  if (!r.ok) return { ok: false as const, error: `La IA respondió ${r.status}` }
  const j = await r.json()
  const t: string = (j.content ?? []).map((x: any) => x.text ?? "").join("")
  const m = t.match(/\{[\s\S]*\}/)
  let items: { pregunta?: string; respuesta?: string }[] = []
  try { items = JSON.parse(m ? m[0] : "{}").items ?? [] } catch { items = [] }
  items = items.filter((x) => x.respuesta && x.respuesta.trim()).slice(0, 25)
  for (const x of items) {
    await q("insert into bot_conocimiento(empresa,pregunta,respuesta,activo,origen,creado_por) values ($1,$2,$3,false,'revision',$4)",
      [empresa, (x.pregunta ?? "").slice(0, 300) || null, x.respuesta!.slice(0, 2000), `Importado de ${f.nombre}`.slice(0, 120)])
  }
  return { ok: true as const, n: items.length }
}
