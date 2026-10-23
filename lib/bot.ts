import { q, one } from "./db"
import { BOTS, type Empresa } from "./bots/conocimiento"
import { enviarTexto } from "./whatsapp"
import { notificar } from "./push"

/** Estado de la conversación guardado por chat (wa_chats.estado). */
type Estado = { paso?: number | null; datos?: Record<string, string>; noEntendi?: number; tema?: string }
type Resultado = { respuestas: string[]; datos: Record<string, string | null>; derivar: boolean; pedidoHumano?: boolean; estado: Estado }
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

/** Preguntas de calificación, en orden. Se hacen de a una, como lo haría una persona de atención. */
const PREGUNTAS: Record<Empresa, { k: string; p: (d: Record<string, string>) => string; omitible?: boolean }[]> = {
  devisebit: [
    { k: "motivo", p: () => "Contame en una o dos líneas *qué necesitás resolver* (por ejemplo: un sistema de turnos, un bot como este, un tablero con tus datos…) 👇" },
    { k: "nombre", p: () => "¡Buenísimo! 🙌 ¿Cómo es tu nombre?" },
    { k: "organizacion", p: (d) => `Un gusto${d.nombre ? `, ${d.nombre.split(" ")[0]}` : ""}. ¿De qué *empresa u organización* nos escribís?` },
    { k: "email", p: () => "Última: ¿a qué *email* te mandamos la propuesta? (si preferís seguir solo por WhatsApp, escribí *no*)", omitible: true },
  ],
  sanpatricio: [
    { k: "motivo", p: () => "¿Qué necesita el paciente? Por ejemplo: *enfermería, kinesiología, control médico, internación domiciliaria o equipamiento*." },
    { k: "paciente_nombre", p: () => "Gracias. ¿Cuál es el *nombre y apellido del paciente*?" },
    { k: "obra_social", p: () => "¿Qué *cobertura* tiene? (PAMI, otra obra social o particular)" },
    { k: "localidad", p: () => "¿En qué *localidad* está el paciente?" },
    { k: "nombre", p: () => "Y por último, ¿tu *nombre*, para saber con quién hablamos? ☘️" },
  ],
}
/** Temas del menú que arrancan la toma de datos (la persona quiere avanzar). */
const INICIAN: Record<Empresa, string[]> = {
  devisebit: ["A medida", "WhatsApp IA", "Tableros", "Productos", "Precio"],
  sanpatricio: ["Pedir atención", "Servicios", "Cobertura", "Zonas"],
}

function cierre(e: Empresa, d: Record<string, string>) {
  const nombre = d.nombre ? `, ${d.nombre.split(" ")[0]}` : ""
  if (e === "devisebit") {
    const ag = process.env.DB_AGENDA_URL ? `\n\nSi querés ganar tiempo, reservá ya una reunión de 30 minutos sin costo: ${process.env.DB_AGENDA_URL}` : "\n\n¿Preferís que te llamemos o que coordinemos una videollamada de 30 minutos sin costo? Decime día y horario que te queden cómodos 📅"
    return `¡Listo${nombre}! ✅ Ya tenemos todo para armarte una propuesta a medida, con alcance, fecha y precio fijo por escrito. El equipo te escribe por acá (lunes a viernes de 8 a 20 h).${ag}`
  }
  return `¡Muchas gracias${nombre}! ✅ Ya registramos el pedido. Una persona del equipo de San Patricio te contacta por acá (lunes a viernes de 8 a 20 h) para coordinar. Si tenés la orden o indicación médica, podés mandarnos una foto 📷 ☘️`
}

/** Lo que el equipo le fue enseñando al bot (Sistema → Bot · Conocimiento). */
export async function aprendido(e: Empresa) {
  const r = await q<{ pregunta: string | null; respuesta: string }>("select pregunta, respuesta from bot_conocimiento where empresa=$1 and activo order by id desc limit 80", [e])
  return r.map((x) => (x.pregunta ? `- Si preguntan: "${x.pregunta}" → ${x.respuesta}` : `- ${x.respuesta}`)).join("\n")
}

function sistema(e: Empresa, extra = "") {
  const b = BOTS[e]
  const objetivo = e === "devisebit"
    ? "Tu objetivo es atender como el mejor vendedor consultivo: entender la necesidad, mostrar cómo DEVISEBIT la resuelve con ejemplos y casos reales, despejar dudas u objeciones, y llevar la conversación a un próximo paso concreto: que deje sus datos para recibir una propuesta, o que reserve una reunión de 30 minutos sin costo. Hacé una pregunta por mensaje y siempre terminá con una pregunta o una invitación a avanzar."
    : "Tu objetivo es atender como la mejor recepcionista de una empresa de salud: con calidez y precisión, entender qué necesita el paciente, explicar cómo trabaja San Patricio y tomar los datos para que coordinación inicie el pedido. Hacé una pregunta por mensaje y siempre terminá con el próximo paso."
  return `Sos el asistente de WhatsApp de ${b.nombre}. Conversás con personas reales.
${objetivo}

INFORMACIÓN OFICIAL (lo único que podés afirmar):
${b.presentacion}

RESPUESTAS MODELO (usalas como base, adaptadas a la conversación):
${b.faqs.map((f) => `- ${f.tema}: ${f.respuesta.replace(/\n/g, " ")}`).join("\n")}

${extra ? `LO QUE EL EQUIPO TE ENSEÑÓ (tiene prioridad sobre lo anterior si hay diferencias; usalo con criterio, adaptado a cada persona):\n${extra}\n\n` : ""}MENÚ QUE VE LA PERSONA AL PRINCIPIO (si responde solo con un número, interpretalo según este menú):
${b.saludo}

DATOS A CONSEGUIR, de a uno, de forma natural: ${b.datos.map((d) => d.n).join("; ")}.

REGLAS:
- Español rioplatense, cálido, seguro y profesional. Mensajes cortos (2 a 5 líneas), aptos para WhatsApp; podés usar *negrita* y algún emoji con moderación.
- Nunca dejes a la persona sin respuesta ni le digas solo "te derivo": respondé lo que preguntó y proponé el próximo paso.
- No inventes datos, precios, plazos, horarios ni coberturas que no estén arriba. No des precios: explicá que la propuesta es a medida.
${e === "sanpatricio" ? "- No des consejos médicos, diagnósticos ni dosis. Ante una urgencia indicá llamar al 107 de inmediato.\n" : ""}- derivar=true solo si la persona pide hablar con una persona, si hay una queja, si es un tema delicado, o cuando ya tenés los datos principales y corresponde que el equipo tome el caso (en ese caso confirmá que una persona sigue por este mismo chat, de lunes a viernes de 8 a 20 h).

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
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_BOT ?? "claude-haiku-4-5-20251001", max_tokens: 800, system: sistema(e, await aprendido(e).catch(() => "")), messages: msgs }),
    })
    if (!r.ok) return null
    const j = await r.json()
    const t: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
    const m = t.match(/\{[\s\S]*\}/)
    if (!m) return null
    const o = JSON.parse(m[0])
    if (!o.respuesta) return null
    return { respuestas: [String(o.respuesta)], datos: o.datos ?? {}, derivar: !!o.derivar, estado: {} }
  } catch {
    return null
  }
}

function buscarFaq(e: Empresa, t: string) {
  let mejor: { r: string; tema: string; peso: number } | null = null
  for (const f of BOTS[e].faqs) for (const c of f.claves) {
    const k = norm(c)
    const hit = /^\d$/.test(k) ? t === k : k.length <= 3 ? new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(t) : t.includes(k)
    if (hit && (!mejor || k.length > mejor.peso)) mejor = { r: f.respuesta, tema: f.tema, peso: k.length }
  }
  return mejor
}

/** Conversación guiada sin IA: menú + preguntas de a una hasta tener los datos, y cierre con próximo paso. */
export function sinIA(e: Empresa, texto: string, primero: boolean, est: Estado): Resultado {
  const b = BOTS[e]
  const t = norm(texto)
  const d = { ...(est.datos ?? {}) }
  const preg = PREGUNTAS[e]
  const siguiente = (desde: number) => { for (let i = desde; i < preg.length; i++) if (!d[preg[i].k]) return i; return -1 }
  const out = (respuestas: string[], paso: number | null, extra: Partial<Resultado> = {}): Resultado =>
    ({ respuestas, datos: d, derivar: false, estado: { ...est, datos: d, paso, noEntendi: 0 }, ...extra })
  const saludoRe = /^(hola+|buen[oa]s?|buen dia|buenas tardes|buenas noches|hey|que tal|holis)\b/

  // 1) Si estamos tomando datos y no es una opción del menú, la respuesta es el dato pedido
  const faq = buscarFaq(e, t)
  const esMenu = /^[1-5]$/.test(t)
  const pidePersona = !!faq && faq.tema === "Persona" && !/^\d$/.test(t) && t.length < 40
  if (est.paso != null && est.paso >= 0 && !esMenu && !pidePersona) {
    const p = preg[est.paso]
    if (!(p.omitible && /^(no|nop|prefiero no|-)$/.test(t))) d[p.k] = texto.trim().slice(0, 300)
    else d[p.k] = "-"
    const sig = siguiente(est.paso + 1)
    if (sig === -1) return { respuestas: [cierre(e, d)], datos: d, derivar: true, estado: { datos: d, paso: null, noEntendi: 0 } }
    return out([preg[sig].p(d)], sig)
  }

  // 2) Opción del menú o pregunta frecuente
  if (faq) {
    if (faq.tema === "Persona") {
      const sig = siguiente(0)
      return { respuestas: [faq.r], datos: d, derivar: true, pedidoHumano: true, estado: { ...est, datos: d, paso: sig === -1 ? null : sig, noEntendi: 0 } }
    }
    if (INICIAN[e].includes(faq.tema)) {
      const sig = siguiente(0)
      return out(sig === -1 ? [faq.r, cierre(e, d)] : [faq.r], sig === -1 ? null : sig, { estado: { ...est, datos: d, paso: sig === -1 ? null : sig, tema: faq.tema, noEntendi: 0 } })
    }
    return out([faq.r], est.paso ?? null)
  }

  // 3) Saludo
  if (primero || saludoRe.test(t)) return out([b.saludo], null)

  // 4) No es una opción: lo tomamos como la necesidad que nos cuenta y seguimos la conversación
  if (!d.motivo && t.length > 12) {
    d.motivo = texto.trim().slice(0, 300)
    const sig = siguiente(0)
    const intro = e === "devisebit" ? "¡Gracias por contarme! Eso lo resolvemos seguido 💪" : "¡Gracias por contarnos! Te ayudamos a organizarlo ☘️"
    return out([`${intro}\n${sig === -1 ? "" : preg[sig].p(d)}`.trim()], sig === -1 ? null : sig)
  }
  const n = (est.noEntendi ?? 0) + 1
  const menuCorto = b.saludo.split("\n").filter((l) => /^\d️⃣/.test(l)).join("\n")
  return { respuestas: [`Perdón, no llegué a entenderte 🙏 Elegí una opción escribiendo el número:\n${menuCorto}${n >= 2 ? "\n\nO contame con tus palabras qué necesitás y te ayudo." : ""}`], datos: d, derivar: false, estado: { ...est, datos: d, noEntendi: n } }
}

/** Procesa un mensaje entrante: guarda, actualiza el CRM y responde (salvo que una persona haya tomado el chat). */
export async function procesar(e: Empresa, waId: string, perfil: string | null, texto: string | null, tipo: string, metaId: string, canal: "whatsapp" | "instagram" = "whatsapp") {
  const roles = e === "devisebit" ? ["gerente"] : ["gerente", "coordinacion"]
  const marca = e === "devisebit" ? "DEVISEBIT" : "San Patricio"
  const red = canal === "instagram" ? "Instagram" : "WhatsApp"
  if (await one("select 1 from wa_mensajes where meta_id=$1", [metaId])) return // reintento de Meta
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,meta_id,autor_nombre) values ($1,$2,'cliente',$3,$4,$5,$6)", [e, waId, texto, tipo, metaId, perfil])
  const chat = await one<{ consulta_id: number | null; bot_pausado_hasta: string | null; pausa_motivo: string | null; estado: Estado | null; ultimo_entrante: string | null }>(
    `insert into wa_chats(empresa,wa_id,nombre,ultimo_entrante) values ($1,$2,$3,now())
     on conflict (empresa,wa_id) do update set nombre=coalesce(excluded.nombre,wa_chats.nombre), actualizado=now()
     returning consulta_id, bot_pausado_hasta, pausa_motivo, estado, (select ultimo_entrante from wa_chats where empresa=$1 and wa_id=$2) ultimo_entrante`,
    [e, waId, perfil],
  )
  await q("update wa_chats set ultimo_entrante=now() where empresa=$1 and wa_id=$2", [e, waId])
  const primero = !chat?.ultimo_entrante || Date.now() - new Date(chat.ultimo_entrante).getTime() > 12 * 3600e3
  let est: Estado = primero ? {} : (chat?.estado ?? {})

  // Consulta en el CRM: la abierta de este chat, o una nueva
  let cid = chat?.consulta_id ?? null
  if (cid) {
    const c = await one<{ estado: string }>("select estado from consultas where id=$1", [cid])
    if (!c || ["ingreso", "descartada"].includes(c.estado)) { cid = null; est = {} }
  }
  if (!cid) {
    const n = await one<{ id: number }>("insert into consultas(empresa,canal,nombre,telefono,mensaje,chat_id) values ($1,$2,$3,$4,$5,$6) returning id", [e, canal, perfil, canal === "whatsapp" ? "+" + waId : null, texto ?? `(${tipo})`, waId])
    cid = n!.id
    await notificar(roles, `💬 Nueva consulta por ${red} · ${marca}`, `${perfil ?? (canal === "whatsapp" ? "+" + waId : "Instagram")}: ${texto ?? "(archivo)"}`, `/consultas/${cid}`)
    await q("update wa_chats set consulta_id=$1 where empresa=$2 and wa_id=$3", [cid, e, waId])
  } else {
    await q("update consultas set actualizado=now() where id=$1", [cid])
  }

  // Si una persona del equipo tomó el chat, el bot no interviene
  const pausado = chat?.bot_pausado_hasta && new Date(chat.bot_pausado_hasta).getTime() > Date.now() && chat.pausa_motivo === "equipo"
  const modo = await modoBot(e)
  if (!pausado && (modo === "nunca" || (modo === "fuera_horario" && enHorario()))) {
    await q("update consultas set necesita_humano=true where id=$1", [cid])
    await notificar(roles, `💬 Mensaje en ${red} · ${marca}`, `${perfil ?? "Cliente"}: ${texto ?? "(archivo)"}`, `/consultas/${cid}`)
    return
  }
  if (pausado) {
    await q("update consultas set necesita_humano=true where id=$1", [cid])
    await notificar(roles, `✉️ Te respondieron en ${red} · ${marca}`, `${perfil ?? "Cliente"}: ${texto ?? "(archivo)"}`, `/consultas/${cid}`)
    return
  }

  let res: Resultado
  if (tipo !== "text" && !texto) {
    res = { respuestas: [e === "sanpatricio" ? "¡Recibido! 📎 Lo va a ver una persona del equipo. Si me escribís el nombre del paciente y la localidad, lo agilizamos." : "¡Recibido! 📎 Lo revisa el equipo. ¿Me contás en un mensaje qué necesitás?"], datos: {}, derivar: false, estado: est }
  } else {
    const hist = await q<{ autor: string; texto: string | null }>("select autor, texto from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '3 days' order by creado desc limit 30", [e, waId])
    res = (await conIA(e, hist.reverse())) ?? sinIA(e, texto ?? "", primero, est)
  }

  const d = res.datos ?? {}
  const v = (k: string) => (d[k] && d[k] !== "-" ? String(d[k]) : null)
  await q(
    `update consultas set nombre=coalesce($1,nombre), paciente_nombre=coalesce($2,paciente_nombre), obra_social=coalesce($3,obra_social),
       nro_afiliado=coalesce($4,nro_afiliado), localidad=coalesce($5,localidad), motivo=coalesce($6,motivo), organizacion=coalesce($7,organizacion),
       email=coalesce($8,email), necesita_humano=necesita_humano or $9, actualizado=now() where id=$10`,
    [v("nombre"), v("paciente_nombre"), v("obra_social"), v("nro_afiliado"), v("localidad"), v("motivo"), v("organizacion"), v("email"), res.derivar, cid],
  )
  if (e === "devisebit") await alCRM(cid, canal).catch(() => {})
  await q("update wa_chats set estado=$1 where empresa=$2 and wa_id=$3", [JSON.stringify(res.estado ?? {}), e, waId])
  if (res.derivar) {
    const quien = v("nombre") ?? perfil ?? "Cliente"
    await notificar(roles, res.pedidoHumano ? `🙋 Pide hablar con una persona · ${marca}` : `✅ Consulta lista para seguir · ${marca}`, `${quien}${v("motivo") ? ` — ${v("motivo")}` : ""}${v("organizacion") ? ` (${v("organizacion")})` : ""}`, `/consultas/${cid}`)
  }
  for (const r of res.respuestas) {
    const env = await enviarTexto(e, waId, r)
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'bot',$3,$4,'Asistente')", [e, waId, env.ok ? r : `[no enviado: ${env.error}] ${r}`, env.ok ? env.id ?? null : null])
  }
}

/** Respuesta de una persona del equipo desde el CRM: el bot queda en pausa en ese chat. */
export async function responderDesdeCRM(e: Empresa, waId: string, texto: string, autor: string) {
  const env = await enviarTexto(e, waId, texto)
  if (env.ok) {
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'equipo',$3,$4,$5)", [e, waId, texto, env.id ?? null, autor])
    await q("update wa_chats set bot_pausado_hasta=now() + interval '24 hours', pausa_motivo='equipo' where empresa=$1 and wa_id=$2", [e, waId])
  }
  return env
}


/** Mensaje que el equipo mandó desde la app WhatsApp Business del celular (coexistencia): queda en el CRM y el bot se corre 24 h. */
export async function ecoDelEquipo(e: Empresa, waId: string, texto: string | null, metaId: string) {
  if (await one("select 1 from wa_mensajes where meta_id=$1", [metaId])) return
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'equipo',$3,$4,'Desde el celular')", [e, waId, texto, metaId])
  await q(`insert into wa_chats(empresa,wa_id,bot_pausado_hasta,pausa_motivo) values ($1,$2,now() + interval '24 hours','equipo')
           on conflict (empresa,wa_id) do update set bot_pausado_hasta=now() + interval '24 hours', pausa_motivo='equipo', actualizado=now()`, [e, waId])
  await q("update consultas set necesita_humano=false, estado=case when estado='nueva' then 'contactada' else estado end, actualizado=now() where empresa=$1 and chat_id=$2 and estado not in ('ingreso','descartada')", [e, waId])
}

/** Cuándo responde el bot de cada empresa: siempre, solo fuera del horario de atención, o nunca (solo registra y avisa). */
export async function modoBot(e: Empresa): Promise<"siempre" | "fuera_horario" | "nunca"> {
  const r = await one<{ valor: string }>("select valor from config where clave=$1", [`bot_modo_${e}`]).catch(() => null)
  return (r?.valor as any) ?? "siempre"
}
export function enHorario(d = new Date()) {
  const ar = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
  const dia = ar.getDay(), h = ar.getHours()
  return dia >= 1 && dia <= 5 && h >= 8 && h < 20
}

/** DEVISEBIT: cuando el bot ya tiene nombre y algo más (organización, motivo o email), crea o completa el contacto en el CRM comercial. */
async function alCRM(cid: number, canal: string) {
  const k = await one<any>("select nombre, organizacion, email, telefono, motivo, mensaje from consultas where id=$1", [cid])
  if (!k?.nombre || !(k.organizacion || k.motivo || k.email)) return
  const ya = await one<{ id: number }>("select id from db_contactos where consulta_id=$1", [cid])
  const notas = [k.motivo && `Motivo: ${k.motivo}`, k.mensaje && `Primer mensaje: ${k.mensaje}`].filter(Boolean).join("\n")
  if (ya) {
    await q("update db_contactos set organizacion=coalesce(organizacion,$1), email=coalesce(email,$2), notas=coalesce(notas,$3), actualizado=now() where id=$4", [k.organizacion, k.email, notas || null, ya.id])
  } else {
    await q(
      "insert into db_contactos(nombre,organizacion,email,telefono,etapa,origen,notas,consulta_id,proximo,proximo_fecha) values ($1,$2,$3,$4,'nuevo',$5,$6,$7,'Responder y coordinar reunión',(now() at time zone 'America/Argentina/Buenos_Aires')::date)",
      [k.nombre, k.organizacion, k.email, k.telefono, canal === "instagram" ? "Instagram (bot)" : "WhatsApp (bot)", notas || null, cid],
    )
  }
}
