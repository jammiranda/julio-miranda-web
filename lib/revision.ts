import { q, one } from "./db"
import { notificar } from "./push"

/**
 * Revisión semanal del bot: los viernes lee los chats de los últimos 7 días, marca dónde Bit falló
 * y deja sugerencias en Bot → Conocimiento como DESACTIVADAS (origen 'revision'), para que el equipo
 * las active con un clic. Nunca cambia lo que el bot ya sabe por su cuenta.
 */
export type Informe = { fecha: string; chats: number; resumen: string; fallas: { chat: string; problema: string }[]; sugerencias: number }

const hoyBA = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))

export async function revisionSemanal(forzar = false): Promise<string> {
  const h = hoyBA()
  if (!forzar && h.getDay() !== 5) return "no es viernes"
  const fecha = h.toISOString().slice(0, 10)
  const ult = await one<{ valor: string }>("select valor from config where clave='bot_revision_ult'")
  if (!forzar && ult?.valor === fecha) return "ya corrió hoy"
  if (!process.env.ANTHROPIC_API_KEY) return "sin ANTHROPIC_API_KEY"

  const filas = await q<{ wa_id: string; autor: string; texto: string | null }>(
    `select wa_id, autor, texto from wa_mensajes
     where empresa='devisebit' and creado > now() - interval '7 days'
       and wa_id in (select wa_id from wa_mensajes where empresa='devisebit' and autor='bot' and creado > now() - interval '7 days' group by wa_id order by max(creado) desc limit 40)
     order by wa_id, creado`,
  )
  const porChat = new Map<string, string[]>()
  for (const f of filas) {
    const quien = f.autor === "cliente" ? "Cliente" : f.autor === "bot" ? "Bit" : "Equipo"
    const l = porChat.get(f.wa_id) ?? []
    l.push(`${quien}: ${(f.texto ?? "(archivo)").slice(0, 600)}`)
    porChat.set(f.wa_id, l)
  }
  // Los chats van identificados solo por número de orden, sin teléfono.
  const chats = [...porChat.values()].map((l, i) => `### Chat ${i + 1}\n${l.slice(-40).join("\n")}`)
  if (!chats.length) {
    await q("insert into config(clave,valor) values ('bot_revision_ult',$1) on conflict (clave) do update set valor=excluded.valor", [fecha])
    return "sin chats esta semana"
  }
  const ya = await q<{ pregunta: string | null; respuesta: string }>("select pregunta, respuesta from bot_conocimiento where empresa='devisebit' order by id desc limit 80")

  const system = `Sos el supervisor de calidad de "Bit", el asistente de WhatsApp con IA de DEVISEBIT SRL (software, webs, bots y sistemas). Revisás sus conversaciones reales de la semana.
Marcá solo fallas concretas de Bit: inventó un dato, precio, plazo, descuento o compromiso; prometió referencias o soporte incluido; mensaje largo o con formato que WhatsApp no muestra (**, tablas, #); no cerró con una pregunta; mezcló vos y tú; no derivó cuando pidieron una persona o había una queja; no propuso próximo paso; respondió mal una pregunta que se repite.
Para cada falla que se pueda evitar enseñándole algo, proponé una entrada de conocimiento corta: "pregunta" (cómo lo suelen preguntar) y "respuesta" (qué tiene que hacer o decir Bit). Nunca propongas precios, descuentos ni datos que no aparezcan en lo que dijo el equipo o en lo que Bit ya sabe. No repitas lo que ya sabe. Máximo 6 sugerencias.
No incluyas nombres, teléfonos ni emails de los clientes en tu respuesta.
Respondé SOLO un JSON: {"resumen":"2 o 3 oraciones sobre cómo anduvo Bit","fallas":[{"chat":"Chat N","problema":"..."}],"sugerencias":[{"pregunta":"...","respuesta":"...","motivo":"Chat N: ..."}]}`
  const user = `LO QUE BIT YA SABE (cargado por el equipo):\n${ya.map((x) => `- ${x.pregunta ? `${x.pregunta} → ` : ""}${x.respuesta}`).join("\n") || "(nada)"}\n\nCONVERSACIONES DE LA SEMANA:\n\n${chats.join("\n\n")}`

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL_REVISION ?? "claude-sonnet-5-5", max_tokens: 4000, temperature: 0.2, system, messages: [{ role: "user", content: user }] }),
  })
  if (!r.ok) return `error IA ${r.status}`
  const j = await r.json()
  const t: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
  const m = t.match(/\{[\s\S]*\}/)
  if (!m) return "respuesta sin JSON"
  const o = JSON.parse(m[0])
  const sug: { pregunta?: string; respuesta?: string; motivo?: string }[] = Array.isArray(o.sugerencias) ? o.sugerencias.slice(0, 6) : []
  let n = 0
  for (const s of sug) {
    if (!s.respuesta) continue
    await q("insert into bot_conocimiento(empresa,pregunta,respuesta,activo,origen,creado_por) values ('devisebit',$1,$2,false,'revision',$3)", [s.pregunta ?? null, s.respuesta, `Revisión semanal · ${s.motivo ?? ""}`.slice(0, 300)])
    n++
  }
  const informe: Informe = { fecha, chats: chats.length, resumen: String(o.resumen ?? ""), fallas: Array.isArray(o.fallas) ? o.fallas.slice(0, 15) : [], sugerencias: n }
  await q("insert into config(clave,valor) values ('bot_revision_informe',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify(informe)])
  await q("insert into config(clave,valor) values ('bot_revision_ult',$1) on conflict (clave) do update set valor=excluded.valor", [fecha])
  await notificar(["gerente", "coordinacion"], `🤖 Revisión semanal de Bit: ${informe.fallas.length} fallas, ${n} sugerencias`, informe.resumen || `Se revisaron ${chats.length} chats.`, "/bot")
  return `ok: ${chats.length} chats, ${informe.fallas.length} fallas, ${n} sugerencias`
}

export async function ultimoInforme(): Promise<Informe | null> {
  const r = await one<{ valor: string }>("select valor from config where clave='bot_revision_informe'")
  try { return r ? JSON.parse(r.valor) : null } catch { return null }
}
