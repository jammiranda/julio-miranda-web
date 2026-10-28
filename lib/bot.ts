import { q, one } from "./db"
import { BOTS, EQUIPO, NOMBRE_BOT, type Empresa } from "./bots/conocimiento"
import { preciosParaBot } from "./precios"
import { MATERIALES } from "./materiales"
import { enviarTexto } from "./whatsapp"
import { notificar } from "./push"
import { desdeTexto, limpiarRef, type Origen } from "./origen"
import { catalogo, linkBrief } from "./brief"
import { sugerencias, reservar, deLocal, linkAgenda } from "./agenda"

/** Estado de la conversación guardado por chat (wa_chats.estado). */
type Estado = { paso?: number | null; datos?: Record<string, string>; noEntendi?: number; tema?: string }
type Resultado = { respuestas: string[]; datos: Record<string, string | null>; derivar: boolean; pedidoHumano?: boolean; estado: Estado; reunion?: string | null; area?: string | null }
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

/** Preguntas de calificación, en orden. Se hacen de a una, como lo haría una persona de atención. */
const PREGUNTAS: Record<Empresa, { k: string; p: (d: Record<string, string>) => string; omitible?: boolean }[]> = {
  devisebit: [
    { k: "motivo", p: () => "Contame en una o dos líneas *qué necesitás resolver* (por ejemplo: un sistema de turnos, un bot como este, un tablero con tus datos…) 👇" },
    { k: "nombre", p: () => "¡Buenísimo! 🙌 ¿Cómo es tu nombre?" },
    { k: "organizacion", p: (d) => `Un gusto${d.nombre ? `, ${d.nombre.split(" ")[0]}` : ""}. ¿De qué *empresa u organización* nos escribís?` },
    { k: "email", p: () => "Última: ¿a qué *email* te mandamos la propuesta? (si preferís seguir solo por WhatsApp, escribí *no*)", omitible: true },
  ],
}
/** Temas del menú que arrancan la toma de datos (la persona quiere avanzar). */
const INICIAN: Record<Empresa, string[]> = {
  devisebit: ["A medida", "WhatsApp IA", "Redes", "Productos", "Precio", "Tableros"],
}

function cierre(e: Empresa, d: Record<string, string>, brief?: string | null, agenda?: string | null) {
  const nombre = d.nombre ? `, ${d.nombre.split(" ")[0]}` : ""
  const ag = agenda ? `\n\n📅 Y si querés avanzar ya, elegí día y hora para una videollamada de 30 minutos sin costo: ${agenda} (o decime acá qué día y horario te queda cómodo).` : "\n\n📅 ¿Qué día y horario te queda cómodo para una videollamada de 30 minutos sin costo?"
  const br = brief ? `\n\n📝 Para darte una *propuesta preliminar con alcance, plazo y rango de inversión en 48 h hábiles*, completá este brief de 3 minutos: ${brief}` : ""
  return `¡Gracias${nombre}! ✅ Ya tengo lo principal.${br}${ag}\n\nMientras tanto podés ver proyectos que hicimos: www.devisebit.com/casos-de-exito`
}

/** Lo que el equipo le fue enseñando al bot (Sistema → Bot · Conocimiento). */
export async function aprendido(e: Empresa) {
  const r = await q<{ pregunta: string | null; respuesta: string }>("select pregunta, respuesta from bot_conocimiento where empresa=$1 and activo order by id desc limit 80", [e])
  return r.map((x) => (x.pregunta ? `- Si preguntan: "${x.pregunta}" → ${x.respuesta}` : `- ${x.respuesta}`)).join("\n")
}

function sistema(e: Empresa, extra = "", ctx = "", lista = "") {
  const b = BOTS[e]
  const objetivo = "Tu objetivo es atender como el mejor vendedor consultivo: entender la necesidad, mostrar cómo DEVISEBIT la resuelve con ejemplos y casos reales, despejar dudas u objeciones, y llevar la conversación a un próximo paso concreto: que deje sus datos para recibir una propuesta, o que reserve una reunión de 30 minutos sin costo. Hacé una pregunta por mensaje y siempre terminá con una pregunta o una invitación a avanzar."
  return `Sos ${NOMBRE_BOT}, el asistente con inteligencia artificial de WhatsApp de ${b.nombre}. Conversás con personas reales.
${objetivo}

IDENTIDAD: te llamás ${NOMBRE_BOT}. Si te preguntan tu nombre o si sos una persona, decí que sos ${NOMBRE_BOT}, el asistente con IA de DEVISEBIT, y que del otro lado hay un equipo. Nunca digas que sos una persona ni firmes con el nombre de alguien del equipo.

EQUIPO (para derivar al que corresponde y nombrarlo: "te paso con Bárbara, de coordinación"):
${EQUIPO.map((x) => `- ${x.nombre} (${x.rol}): ${x.cuando}. area="${x.area}"`).join("\n")}

${lista ? `LISTA DE PRECIOS VIGENTE (pesos argentinos, finales; podés y debés informarlos cuando pregunten o cuando sirva para avanzar):\n${lista}\n` : ""}
MATERIAL PARA MANDAR (mandá el link apenas lo pidan o cuando ayude a decidir; no hace falta que lo pidan):
${MATERIALES.filter((m) => m.link).map((m) => `- ${m.n}: ${m.link}`).join("\n")}
- Datos de pago: transferencia a DEVISEBIT SRL, CUIT 30-71770834-9, Banco Santander, cuenta corriente en pesos 558-002508/3, CBU 0720558320000000250836, alias *devisebitsrl* (10% de descuento). Mandalos cuando la persona quiera pagar o señar.

INFORMACIÓN OFICIAL (lo único que podés afirmar):
${b.presentacion}

RESPUESTAS MODELO (usalas como base, adaptadas a la conversación):
${b.faqs.map((f) => `- ${f.tema}: ${f.respuesta.replace(/\n/g, " ")}`).join("\n")}

${extra ? `LO QUE EL EQUIPO TE ENSEÑÓ (tiene prioridad sobre lo anterior si hay diferencias; usalo con criterio, adaptado a cada persona):\n${extra}\n\n` : ""}MENÚ QUE VE LA PERSONA AL PRINCIPIO (si responde solo con un número, interpretalo según este menú):
${b.saludo}

${ctx}

DATOS A CONSEGUIR, de a uno, de forma natural: ${b.datos.map((d) => d.n).join("; ")}.

REGLAS:
- Español rioplatense, cálido, seguro y profesional, como un consultor senior. Si la persona escribe de "tú" o de "usted", adaptate a su trato sin perder calidez.
- FORMATO WHATSAPP: la persona lee desde el celular. Entre 40 y 90 palabras por mensaje, en párrafos de 1 o 2 oraciones separados por una línea en blanco. Negrita con UN solo asterisco (*así*), nunca doble (**). Nada de tablas, encabezados con "#" ni bloques de más de 10 líneas; para enumerar usá guiones o emojis sobrios (🔹 ✅ 🚀 📈).
- PING-PONG: cerrá cada mensaje con UNA sola pregunta, clara y fácil de responder, que acerque al próximo paso. Nunca termines con un dato suelto ni con "cualquier cosa avisame" sin haber pedido los datos o propuesto la reunión.
- Por WhatsApp ya tenemos su número: no lo pidas. Lo que buscás es el dolor, el rubro o empresa, el nombre, el email y la reunión.
- MICRO-INSIGHT: cuando la persona cuente su situación, dale una idea concreta de cómo se resuelve (por ejemplo: "con 150 consultas por día, lo ideal es conectar el bot a tu sistema para que consulte stock y precios solo") antes de pedir el siguiente dato.
- Integraciones: podemos conectar con lo que ya usa el cliente (Tango, Odoo, SAP, Salesforce, HubSpot, ARCA, pasarelas de pago, bancos, Excel, APIs propias). Trabajamos por etapas: diagnóstico sin cargo, propuesta con alcance y plazo por escrito, avances visibles cada 1 o 2 semanas arrancando por una primera versión (MVP), y después capacitación y soporte.
- Extracción de datos de la web: monitoreo diario de precios y stock de la competencia, catálogos de proveedores, licitaciones y boletines oficiales, entregados limpios en un tablero, Excel o API. Para cotizar preguntá cuántos sitios, cada cuánto y si son públicos o requieren usuario y clave.
- No recomiendes herramientas externas ni otras empresas para que "lo haga solo": DEVISEBIT lo entrega llave en mano.
- Extracción de datos: solo de información pública o con acceso autorizado por el titular de la cuenta. Si piden entrar con usuario y clave de otra persona o de un competidor, decí con claridad que eso no lo hacemos porque puede ser ilegal y viola los términos del sitio, y ofrecé la alternativa con datos públicos.
- REFERENCIAS: nunca prometas nombres, teléfonos ni contactos de clientes, ni que alguien del equipo los va a pasar. Ofrecé los casos públicos (www.devisebit.com/casos-de-exito) y decí que las referencias directas se coordinan solo con autorización de cada cliente.
- SOPORTE Y GARANTÍAS: no digas que el soporte, el monitoreo o las copias de seguridad están incluidos ni prometas tiempos de respuesta. Decí que son un servicio que se define en la propuesta, con alcance y condiciones por escrito.
- Certificaciones, normas y requisitos legales (ISO, ley 25.326 u otras): no confirmes ni niegues nada que no esté en la INFORMACIÓN OFICIAL. Decí que lo confirma el equipo por escrito.
- Licitaciones, organismos públicos y pliegos: derivá a Julio Miranda (area="comercial"), no a desarrollo.
- Nunca dejes a la persona sin respuesta ni le digas solo "te derivo": respondé lo que preguntó y proponé el próximo paso.
- No inventes datos, precios, plazos, horarios ni coberturas que no estén arriba. Para los paquetes usá los precios exactos de la LISTA DE PRECIOS. Para proyectos a medida podés mencionar los RANGOS DE REFERENCIA del catálogo, como "proyectos de este tipo suelen ir de X a Y según alcance; el precio final es fijo y por escrito". Nunca inventes descuentos.
- Cuando pidan información, brochure, precios, ejemplos, cómo pagar, cómo agendar o el brief, mandá el link correspondiente en ese mismo mensaje.
- Si la persona quiere contratar: confirmá el paquete y el precio, pedí nombre o razón social, CUIT y email para el contrato, mandá el alias para la seña y avisá que el contrato llega por este chat para firmar desde el celular. Marcá derivar=true con area="coordinacion".
- CIERRE DE VENTA: apenas sepas qué necesita y el nombre, no te quedes en "el equipo te escribe". Dale valor y un próximo paso concreto en el mismo mensaje: 1) el rango de referencia si existe para ese servicio, 2) el link del brief de 3 minutos para recibir una propuesta preliminar en 48 h hábiles, 3) invitá a reservar la videollamada: ofrecé 2 o 3 horarios de la lista HORARIOS LIBRES o el link de agenda, y preguntá qué día y hora le queda mejor, y 4) un link de casos o del servicio que se relacione (www.devisebit.com/trabajos, www.devisebit.com/productos o el link del servicio). Usá urgencia amable (por ejemplo: "si lo completás hoy, el lunes tenés la propuesta"). Preguntá cuál de las opciones prefiere.
- Si solo dice "hola", "info" o algo muy corto: saludá, decí en una línea qué hacemos y preguntá qué está buscando (o mostrá el menú).
- "Pasame info por acá o por mail": mandá el link que corresponda y, para no mandar algo genérico, preguntá a qué se dedica y a qué email se lo enviamos.
- Pregunta muy técnica o fuera de lo común: nunca digas "no sé" ni "no hacemos eso". Explicá que el equipo técnico evalúa la viabilidad según su infraestructura, preguntá qué sistema usan hoy y ofrecé que lo confirme Jonathan, de desarrollo (derivar=true, area según EQUIPO).
- Objeciones típicas: "es caro" → explicá que se puede arrancar por una primera etapa (MVP) y crecer; "lo tengo que pensar" → ofrecé el brief para que tenga una propuesta concreta para decidir; "ya tengo proveedor" → ofrecé una segunda opinión sin costo.
- derivar=true solo si la persona pide hablar con una persona, si hay una queja, si es un tema delicado, si quiere contratar o cuando ya tenés los datos principales y corresponde que el equipo tome el caso. En "area" poné a quién va según EQUIPO y nombralo en la respuesta ("te escribe Bárbara, de coordinación, por este mismo chat"). Horario del equipo: lunes a viernes de 8 a 18 h; fuera de horario aclaralo y seguí ayudando vos.

- AGENDA: cuando la persona elija un horario que esté EXACTAMENTE en HORARIOS LIBRES, poné su clave en "reunion" (por ejemplo "2026-10-27T10:00") y en "respuesta" solo una línea de confirmación (el sistema agrega fecha, link y recordatorio). Si pide un día u hora que no está, ofrecé los más cercanos de la lista o el link de agenda. Nunca inventes horarios.

Respondé SOLO un JSON: {"respuesta":"texto para enviar","datos":{${b.datos.map((d) => `"${d.k}":null`).join(",")}},"derivar":false,"area":null,"reunion":null}
En "datos" poné solo lo que la persona dijo explícitamente en toda la conversación.`
}

async function conIA(e: Empresa, hist: { autor: string; texto: string | null }[], ctx = ""): Promise<Resultado | null> {
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
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_BOT ?? "claude-haiku-4-5-20251001", max_tokens: 1000, temperature: Number(process.env.CLAUDE_TEMP_BOT ?? 0.4), system: sistema(e, await aprendido(e).catch(() => ""), ctx, await preciosParaBot().catch(() => "")), messages: msgs }),
    })
    if (!r.ok) return null
    const j = await r.json()
    const t: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
    const m = t.match(/\{[\s\S]*\}/)
    if (!m) return null
    const o = JSON.parse(m[0])
    if (!o.respuesta) return null
    return { respuestas: [String(o.respuesta)], datos: o.datos ?? {}, derivar: !!o.derivar, area: typeof o.area === "string" ? o.area : null, estado: {}, reunion: typeof o.reunion === "string" ? o.reunion : null }
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
export function sinIA(e: Empresa, texto: string, primero: boolean, est: Estado, brief: string | null = null, agenda: string | null = null): Resultado {
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
    if (sig === -1) return { respuestas: [cierre(e, d, brief, agenda)], datos: d, derivar: true, estado: { datos: d, paso: null, noEntendi: 0 } }
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
      return out(sig === -1 ? [faq.r, cierre(e, d, brief, agenda)] : [faq.r], sig === -1 ? null : sig, { estado: { ...est, datos: d, paso: sig === -1 ? null : sig, tema: faq.tema, noEntendi: 0 } })
    }
    return out([faq.r], est.paso ?? null)
  }

  // 3) Saludo
  if (primero || saludoRe.test(t)) return out([b.saludo], null)

  // 4) No es una opción: lo tomamos como la necesidad que nos cuenta y seguimos la conversación
  if (!d.motivo && t.length > 12) {
    d.motivo = texto.trim().slice(0, 300)
    const sig = siguiente(0)
    const intro = "¡Gracias por contarme! Eso lo resolvemos seguido 💪"
    return out([`${intro}\n${sig === -1 ? "" : preg[sig].p(d)}`.trim()], sig === -1 ? null : sig)
  }
  const n = (est.noEntendi ?? 0) + 1
  const menuCorto = b.saludo.split("\n").filter((l) => /^\d️⃣/.test(l)).join("\n")
  return { respuestas: [`Perdón, no llegué a entenderte 🙏 Elegí una opción escribiendo el número:\n${menuCorto}${n >= 2 ? "\n\nO contame con tus palabras qué necesitás y te ayudo." : ""}`], datos: d, derivar: false, estado: { ...est, datos: d, noEntendi: n } }
}

/** Procesa un mensaje entrante: guarda, actualiza el CRM y responde (salvo que una persona haya tomado el chat). */
export async function procesar(e: Empresa, waId: string, perfil: string | null, texto: string | null, tipo: string, metaId: string, canal: "whatsapp" | "instagram" = "whatsapp", origen: Origen | null = null) {
  const og = origen ?? desdeTexto(texto) ?? { fuente: canal === "instagram" ? "Instagram directo" : "WhatsApp directo" }
  texto = limpiarRef(texto)
  const roles = ["gerente", "coordinacion"]
  const marca = "DEVISEBIT"
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
    if (!c || c.estado === "descartada") { cid = null; est = {} }
  }
  if (!cid) {
    const n = await one<{ id: number }>("insert into consultas(empresa,canal,nombre,telefono,mensaje,chat_id,fuente,campania,origen_detalle) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id", [e, canal, perfil, canal === "whatsapp" ? "+" + waId : null, texto ?? `(${tipo})`, waId, og.fuente, og.campania ?? null, og.detalle ? JSON.stringify(og.detalle) : null])
    cid = n!.id
    await notificar(roles, `💬 Nueva consulta por ${red} · ${marca}`, `${perfil ?? (canal === "whatsapp" ? "+" + waId : "Instagram")}: ${texto ?? "(archivo)"}`, `/consultas/${cid}`)
    await q("update wa_chats set consulta_id=$1 where empresa=$2 and wa_id=$3", [cid, e, waId])
  } else {
    await q("update consultas set actualizado=now() where id=$1", [cid])
    if (origen) await q("update consultas set fuente=$1, campania=coalesce($2,campania), origen_detalle=coalesce($3,origen_detalle) where id=$4 and coalesce(fuente,'') not in ('Google Ads','Meta Ads')", [og.fuente, og.campania ?? null, og.detalle ? JSON.stringify(og.detalle) : null, cid])
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
    res = { respuestas: ["¡Recibido! 📎 Lo revisa el equipo. ¿Me contás en un mensaje qué necesitás?"], datos: {}, derivar: false, estado: est }
  } else {
    const hist = await q<{ autor: string; texto: string | null }>("select autor, texto from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '3 days' order by creado desc limit 30", [e, waId])
    const brief = await linkBrief(cid).catch(() => null)
    const ya = await one<{ brief_en: string | null }>("select brief_en from consultas where id=$1", [cid])
    const cat = await catalogo().catch(() => [])
    const tok = (await one<{ brief_token: string | null }>("select brief_token from consultas where id=$1", [cid]))?.brief_token
    const agenda = tok ? linkAgenda(tok) : null
    const libres = await sugerencias(8).catch(() => [])
    const yaReunion = await one<{ inicio: Date }>("select inicio from db_reuniones where consulta_id=$1 and estado='confirmada' and inicio > now() order by inicio limit 1", [cid])
    const quienEs = perfil ? `CONTEXTO DEL CANAL: la persona escribe por ${canal === "instagram" ? "Instagram" : "WhatsApp"} y su nombre de perfil es "${perfil}". Podés saludarla por su primer nombre si parece un nombre real (no un alias o el nombre de un negocio), pero confirmá el nombre completo antes de usarlo en "datos".\n` : ""
    const ahora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    const ctx = `FECHA Y HORA ACTUAL EN ARGENTINA: ${ahora}. Usala para saber si el equipo está en horario; si la persona dice otro día, guiate por esta fecha.\n${quienEs}CATÁLOGO CON RANGOS DE REFERENCIA, PLAZOS Y LINKS (solo estos números):
${cat.map((s) => `- ${s.nombre}${s.rango ? `: ${s.rango}` : ""}${s.plazo ? ` · plazo típico ${s.plazo}` : ""}${s.link ? ` · ${s.link}` : ""}`).join("\n")}
Casos y trabajos: www.devisebit.com/trabajos · Productos: www.devisebit.com/productos
${yaReunion ? `Esta persona YA tiene una reunión agendada (${new Date(yaReunion.inicio).toISOString()}): no ofrezcas otra salvo que pida cambiarla.` : `HORARIOS LIBRES (clave → cómo decirlo): ${libres.map((s) => `${s.clave} → ${s.texto}`).join(" | ")}${agenda ? `\nLink de agenda de ESTA persona (para que elija otro horario): ${agenda}` : ""}`}
${ya?.brief_en ? "Esta persona YA completó el brief: no se lo pidas de nuevo; confirmale que la propuesta preliminar llega en 48 h hábiles y ofrecé la videollamada." : brief ? `Link del brief de ESTA persona (usalo tal cual): ${brief}` : ""}`
    res = (await conIA(e, hist.reverse(), ctx)) ?? sinIA(e, texto ?? "", primero, est, brief, agenda)
    if (res.reunion && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(res.reunion)) {
      const [f, h] = res.reunion.split("T")
      const rv = await reservar(cid, deLocal(f, h), { nombre: res.datos?.nombre ?? null, email: res.datos?.email ?? null }).catch(() => null)
      if (rv?.ok) res.respuestas = [rv.confirmacion]
      else res.respuestas = [`Uy, ese horario se acaba de ocupar 🙈 Elegí otro acá: ${agenda ?? "o decime otro día y horario"}`]
    }
  }

  const d = res.datos ?? {}
  const v = (k: string) => (d[k] && d[k] !== "-" ? String(d[k]) : null)
  await q(
    `update consultas set nombre=coalesce($1,nombre), motivo=coalesce($2,motivo), organizacion=coalesce($3,organizacion),
       email=coalesce($4,email), necesita_humano=necesita_humano or $5, actualizado=now() where id=$6`,
    [v("nombre"), v("motivo"), v("organizacion"), v("email"), res.derivar, cid],
  )
  await alCRM(cid, canal).catch(() => {})
  await q("update wa_chats set estado=$1 where empresa=$2 and wa_id=$3", [JSON.stringify(res.estado ?? {}), e, waId])
  if (res.derivar) {
    const quien = v("nombre") ?? perfil ?? "Cliente"
    const resp = EQUIPO.find((x) => x.area === res.area)
    if (resp) await q("update consultas set asignado=coalesce(asignado,$1) where id=$2", [resp.nombre, cid])
    await notificar(roles, res.pedidoHumano ? `🙋 Pide hablar con una persona · ${marca}` : `✅ Consulta lista para seguir · ${marca}`, `${resp ? `Para ${resp.nombre} · ` : ""}${quien}${v("motivo") ? ` — ${v("motivo")}` : ""}${v("organizacion") ? ` (${v("organizacion")})` : ""}`, `/consultas/${cid}`)
  }
  for (const r of res.respuestas) {
    const env = await enviarTexto(e, waId, r)
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'bot',$3,$4,'Bit (asistente IA)')", [e, waId, env.ok ? r : `[no enviado: ${env.error}] ${r}`, env.ok ? env.id ?? null : null])
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


/** Cuándo responde el bot de cada empresa: siempre, solo fuera del horario de atención, o nunca (solo registra y avisa). */
export async function modoBot(e: Empresa): Promise<"siempre" | "fuera_horario" | "nunca"> {
  const r = await one<{ valor: string }>("select valor from config where clave=$1", [`bot_modo_${e}`]).catch(() => null)
  return (r?.valor as any) ?? "siempre"
}
export function enHorario(d = new Date()) {
  const ar = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
  const dia = ar.getDay(), h = ar.getHours()
  return dia >= 1 && dia <= 5 && h >= 8 && h < 18
}

/** Cuando el bot ya tiene nombre y algo más (organización, motivo o email), crea o completa el contacto en el CRM comercial. */
export async function alCRM(cid: number, canal: string) {
  const k = await one<any>("select nombre, organizacion, email, telefono, motivo, mensaje, fuente, campania from consultas where id=$1", [cid])
  if (!k?.nombre || !(k.organizacion || k.motivo || k.email)) return
  const ya = await one<{ id: number }>("select id from db_contactos where consulta_id=$1", [cid])
  const notas = [k.motivo && `Motivo: ${k.motivo}`, k.mensaje && `Primer mensaje: ${k.mensaje}`].filter(Boolean).join("\n")
  if (ya) {
    await q("update db_contactos set organizacion=coalesce(organizacion,$1), email=coalesce(email,$2), notas=coalesce(notas,$3), clase=coalesce(clase,'oportunidad'), actualizado=now() where id=$4", [k.organizacion, k.email, notas || null, ya.id])
  } else {
    await q(
      "insert into db_contactos(nombre,organizacion,email,telefono,etapa,origen,notas,consulta_id,proximo,proximo_fecha,fuente,campania,clase) values ($1,$2,$3,$4,'nuevo',$5,$6,$7,'Responder y coordinar reunión',(now() at time zone 'America/Argentina/Buenos_Aires')::date,$8,$9,'oportunidad') on conflict (lower(email)) where email is not null do update set consulta_id=coalesce(db_contactos.consulta_id,excluded.consulta_id), clase=coalesce(db_contactos.clase,'oportunidad'), etapa=case when db_contactos.etapa='base' then 'nuevo' else db_contactos.etapa end, fuente=coalesce(db_contactos.fuente,excluded.fuente), actualizado=now()",
      [k.nombre, k.organizacion, k.email, k.telefono, canal === "instagram" ? "Instagram (bot)" : canal === "web" ? "Web (formulario)" : "WhatsApp (bot)", notas || null, cid, k.fuente, k.campania],
    )
  }
}
