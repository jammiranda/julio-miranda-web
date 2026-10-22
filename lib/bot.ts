import { q, one } from "./db"
import { BOTS, type Empresa } from "./bots/conocimiento"
import { enviarTexto } from "./whatsapp"

type Resultado = { respuesta: string; datos: Record<string, string | null>; derivar: boolean }
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function sistema(e: Empresa) {
  const b = BOTS[e]
  return `Sos el asistente de WhatsApp de ${b.nombre}. Respondés consultas de personas reales.
INFORMACIÓN OFICIAL (lo único que podés afirmar):
${b.presentacion}

PREGUNTAS FRECUENTES Y RESPUESTAS MODELO:
${b.faqs.map((f) => `- ${f.tema}: ${f.respuesta.replace(/\n/g, " ")}`).join("\n")}

DATOS A RECOLECTAR (de a uno o dos por mensaje, sin interrogar): ${b.datos.map((d) => d.n).join("; ")}.

REGLAS:
- Español rioplatense, cálido y profesional. Mensajes cortos (máximo ~500 caracteres), aptos para WhatsApp; podés usar *negrita* y algún emoji.
- No inventes datos, precios, plazos, horarios ni coberturas que no estén arriba. Si no sabés, decí que lo consultás con el equipo y derivá.
- No des precios. ${e === "sanpatricio" ? "No des consejos médicos, diagnósticos ni dosis. Si describen una urgencia o emergencia, indicá llamar al 107 (emergencias) de inmediato." : ""}
- Derivá a una persona (derivar=true) si lo piden, si hay una queja, si es un tema sensible o si ya tenés los datos mínimos y la consulta requiere que alguien la tome.
- Cuando tengas los datos principales, confirmá que una persona del equipo continúa por este mismo chat.
- Si el mensaje del cliente es solo un número del menú (1 a 5), interpretalo según el menú del saludo: ${b.saludo.replace(/\n/g, " ")}

Respondé SOLO un JSON: {"respuesta":"texto para enviar","datos":{${b.datos.map((d) => `"${d.k}":null`).join(",")}},"derivar":false}
En "datos" poné solo lo que la persona dijo explícitamente en toda la conversación.`
}

async function conIA(e: Empresa, hist: { autor: string; texto: string | null }[]): Promise<Resultado | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const msgs: { role: "user" | "assistant"; content: string }[] = []
  for (const m of hist) {
    const role = m.autor === "cliente" ? "user" : "assistant"
    const t = m.texto || "(archivo adjunto)"
    if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += "\n" + t
    else msgs.push({ role, content: t })
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift()
  if (!msgs.length) return null
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_BOT ?? "claude-haiku-4-5-20251001", max_tokens: 800, system: sistema(e), messages: msgs }),
    })
    if (!r.ok) return null
    const j = await r.json()
    const t: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
    const m = t.match(/\{[\s\S]*\}/)
    if (!m) return null
    const o = JSON.parse(m[0])
    if (!o.respuesta) return null
    return { respuesta: String(o.respuesta), datos: o.datos ?? {}, derivar: !!o.derivar }
  } catch {
    return null
  }
}

function sinIA(e: Empresa, texto: string, primero: boolean): Resultado {
  const b = BOTS[e]
  const t = norm(texto.trim())
  let mejor: { r: string; tema: string; peso: number } | null = null
  for (const f of b.faqs) for (const c of f.claves) {
    const k = norm(c)
    const hit = /^\d$/.test(k) ? t === k : k.length <= 3 ? new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(t) : t.includes(k)
    if (hit && (!mejor || k.length > mejor.peso)) mejor = { r: f.respuesta, tema: f.tema, peso: k.length }
  }
  if (mejor) return { respuesta: mejor.r, datos: {}, derivar: mejor.tema === "Persona" }
  if (primero || /^(hola|buen[oa]s|buen dia|buenas tardes|buenas noches|hey|que tal)\b/.test(t)) return { respuesta: b.saludo, datos: {}, derivar: false }
  return { respuesta: `¡Gracias! ${b.derivacion}`, datos: {}, derivar: true }
}

/** Procesa un mensaje entrante: guarda, actualiza el CRM y responde (salvo que una persona haya tomado el chat). */
export async function procesar(e: Empresa, waId: string, perfil: string | null, texto: string | null, tipo: string, metaId: string) {
  if (await one("select 1 from wa_mensajes where meta_id=$1", [metaId])) return // reintento de Meta
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,meta_id,autor_nombre) values ($1,$2,'cliente',$3,$4,$5,$6)", [e, waId, texto, tipo, metaId, perfil])
  const chat = await one<{ consulta_id: number | null; bot_pausado_hasta: string | null; ultimo_entrante: string | null }>(
    `insert into wa_chats(empresa,wa_id,nombre,ultimo_entrante) values ($1,$2,$3,now())
     on conflict (empresa,wa_id) do update set nombre=coalesce(excluded.nombre,wa_chats.nombre), actualizado=now()
     returning consulta_id, bot_pausado_hasta, (select ultimo_entrante from wa_chats where empresa=$1 and wa_id=$2) ultimo_entrante`,
    [e, waId, perfil],
  )
  await q("update wa_chats set ultimo_entrante=now() where empresa=$1 and wa_id=$2", [e, waId])
  const primero = !chat?.ultimo_entrante || Date.now() - new Date(chat.ultimo_entrante).getTime() > 12 * 3600e3

  // Consulta en el CRM: la abierta de este chat, o una nueva
  let cid = chat?.consulta_id ?? null
  if (cid) {
    const c = await one<{ estado: string }>("select estado from consultas where id=$1", [cid])
    if (!c || ["ingreso", "descartada"].includes(c.estado)) cid = null
  }
  if (!cid) {
    const n = await one<{ id: number }>(
      "insert into consultas(empresa,canal,nombre,telefono,mensaje,motivo) values ($1,'whatsapp',$2,$3,$4,null) returning id",
      [e, perfil, "+" + waId, texto ?? `(${tipo})`],
    )
    cid = n!.id
    await q("update wa_chats set consulta_id=$1 where empresa=$2 and wa_id=$3", [cid, e, waId])
  } else {
    await q("update consultas set actualizado=now(), estado=case when estado='descartada' then 'nueva' else estado end where id=$1", [cid])
  }

  const pausado = chat?.bot_pausado_hasta && new Date(chat.bot_pausado_hasta).getTime() > Date.now()
  if (pausado) { await q("update consultas set necesita_humano=true where id=$1", [cid]); return }

  let res: Resultado
  if (tipo !== "text" && !texto) {
    res = { respuesta: e === "sanpatricio" ? "¡Recibido! 📎 Lo va a ver una persona del equipo. Si me escribís el nombre del paciente y la localidad, lo agilizamos." : "¡Recibido! 📎 Lo revisa el equipo. ¿Me contás en un mensaje qué necesitás?", datos: {}, derivar: false }
  } else {
    const hist = await q<{ autor: string; texto: string | null }>("select autor, texto from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '3 days' order by creado desc limit 30", [e, waId])
    res = (await conIA(e, hist.reverse())) ?? sinIA(e, texto ?? "", primero)
  }

  const d = res.datos ?? {}
  await q(
    `update consultas set nombre=coalesce($1,nombre), paciente_nombre=coalesce($2,paciente_nombre), obra_social=coalesce($3,obra_social),
       nro_afiliado=coalesce($4,nro_afiliado), localidad=coalesce($5,localidad), motivo=coalesce($6,motivo), organizacion=coalesce($7,organizacion),
       email=coalesce($8,email), necesita_humano=necesita_humano or $9, actualizado=now() where id=$10`,
    [d.nombre ?? null, d.paciente_nombre ?? null, d.obra_social ?? null, d.nro_afiliado ?? null, d.localidad ?? null, d.motivo ?? null, d.organizacion ?? null, d.email ?? null, res.derivar, cid],
  )
  const env = await enviarTexto(e, waId, res.respuesta)
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'bot',$3,$4,'Asistente')", [e, waId, env.ok ? res.respuesta : `[no enviado: ${env.error}] ${res.respuesta}`, env.ok ? env.id ?? null : null])
  if (res.derivar) await q("update wa_chats set bot_pausado_hasta=now() + interval '12 hours' where empresa=$1 and wa_id=$2", [e, waId])
}

/** Respuesta de una persona del equipo desde el CRM: pausa el bot en ese chat. */
export async function responderDesdeCRM(e: Empresa, waId: string, texto: string, autor: string) {
  const env = await enviarTexto(e, waId, texto)
  if (env.ok) {
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'equipo',$3,$4,$5)", [e, waId, texto, env.id ?? null, autor])
    await q("update wa_chats set bot_pausado_hasta=now() + interval '24 hours' where empresa=$1 and wa_id=$2", [e, waId])
  }
  return env
}
