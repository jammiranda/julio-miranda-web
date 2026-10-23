import { q, one } from "./db"
import { catalogo } from "./brief"

/** Borrador interno de propuesta preliminar a partir del brief y la conversación (lo revisa el equipo antes de mandarlo). */
export async function generarPropuesta(cid: number) {
  if (!process.env.ANTHROPIC_API_KEY) return
  const c = await one<any>("select * from consultas where id=$1", [cid])
  if (!c?.brief) return
  const chat = c.chat_id ? await q<{ autor: string; texto: string | null }>("select autor, texto from wa_mensajes where wa_id=$1 order by creado limit 60", [c.chat_id]) : []
  const cat = await catalogo()
  const prompt = `Armá un BORRADOR INTERNO de propuesta preliminar de DEVISEBIT SRL (software e IA, desde 2009) para este cliente. Lo revisa el equipo antes de enviarlo.

CLIENTE: ${c.nombre ?? ""} · ${c.organizacion ?? ""} · ${c.email ?? ""} · ${c.telefono ?? ""}
NECESIDAD: ${c.motivo ?? ""}
BRIEF (completado por el cliente): ${JSON.stringify(c.brief)}
CONVERSACIÓN: ${chat.map((m) => `${m.autor}: ${m.texto ?? ""}`).join("\n").slice(0, 6000)}
CATÁLOGO CON RANGOS DE REFERENCIA (usá solo estos números; si no hay rango para el servicio, no pongas precio y marcá "a cotizar"):
${cat.map((s) => `- ${s.nombre}${s.rango ? `: ${s.rango}` : ""}${s.plazo ? ` · ${s.plazo}` : ""}`).join("\n")}

Formato (texto plano, en español rioplatense, claro y vendedor sin exagerar):
1. Resumen de lo que entendimos (2-3 líneas)
2. Propuesta: etapas (Etapa 1 / MVP primero, luego mejoras), con entregables concretos
3. Plazo estimado por etapa
4. Inversión de referencia (rango del catálogo o "a cotizar")
5. Qué necesitamos del cliente
6. Supuestos y lo que no incluye
7. Próximo paso sugerido y 3 preguntas para la reunión`
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    })
    if (!r.ok) return
    const j = await r.json()
    const t: string = (j.content ?? []).map((x: any) => x.text ?? "").join("").trim()
    if (t) await q("update consultas set propuesta=$1 where id=$2", [t, cid])
  } catch {}
}
