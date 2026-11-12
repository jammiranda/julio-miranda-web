import { recursoEnMensaje, recurso, sumarUso, linkRecurso, entregarPorEmail } from "./recursos"
import { q, one } from "./db"
import { DEMOS, demoInfo, validarEmail, crearAcceso, enviarAcceso } from "./demos"
import { BOTS, EQUIPO, NOMBRE_BOT, type Empresa } from "./bots/conocimiento"
import { preciosParaBot } from "./precios"
import { MATERIALES } from "./materiales"
import { enviarTexto } from "./whatsapp"
import { notificar } from "./push"
import { desdeTexto, limpiarRef, type Origen } from "./origen"
import { catalogo, linkBrief } from "./brief"
import { sugerencias, reservar, deLocal, linkAgenda } from "./agenda"

/** Estado de la conversación guardado por chat (wa_chats.estado). */
type Estado = { paso?: number | null; datos?: Record<string, string>; noEntendi?: number; tema?: string; recurso?: string | null }
type Resultado = { respuestas: string[]; datos: Record<string, string | null>; derivar: boolean; pedidoHumano?: boolean; estado: Estado; reunion?: string | null; area?: string | null; demo?: string | null }
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
  // Un solo próximo paso, igual que le pedimos a la IA: el brief si hay link (la agenda se ofrece al completarlo); si no, la videollamada
  const paso = brief ? `📝 Para darte una *propuesta preliminar con alcance, plazo y rango de inversión en 48 h hábiles*, completá este brief de 3 minutos: ${brief}`
    : agenda ? `📅 Para avanzar, elegí día y hora para una videollamada de 30 minutos sin costo: ${agenda} (o decime acá qué día y horario te queda cómodo).`
    : "📅 ¿Qué día y horario te queda cómodo para una videollamada de 30 minutos sin costo?"
  return `¡Gracias${nombre}! ✅ Ya tengo lo principal.\n\n${paso}`
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

VOZ (tiene prioridad sobre cualquier otra regla de estilo de más abajo): escribí como escribiría Julio por WhatsApp a un cliente: cercano, claro y sin sonar a folleto ni a formulario.
- Mensajes cortos, de 1 a 3 oraciones y entre 20 y 60 palabras, con frases cortas y variadas. Si hace falta más, dos mensajes cortos antes que uno largo.
- UNA sola pregunta por mensaje, fácil de contestar en una línea.
- Hablá de lo que dijo la persona (su rubro, su negocio, lo que pidió), no de todo lo que vende DEVISEBIT. No repitas algo que ya dijiste: si vuelve a preguntar lo mismo, decilo distinto y más corto.
- Emojis: casi nunca; uno de vez en cuando está bien. Nunca uno en cada mensaje. No repitas la misma fórmula de apertura o de cierre en mensajes seguidos, ni abras con "Perfecto" o "Excelente".
- No uses listas si una oración alcanza. No pegues listas de precios ni menús con viñetas salvo que la persona pida comparar o pida la lista. Si todavía no sabés qué necesita, primero preguntá a qué se dedica y qué quiere lograr; recomendá UNA opción con su precio y una frase de por qué le sirve. Si ya nombró un producto, dale su precio y plazo directo y después preguntá para qué es.
- Un solo link por mensaje y solo si ayuda a lo que se está hablando.

EQUIPO (para derivar al que corresponde y nombrarlo: "te paso con Bárbara, coordinadora general"):
${EQUIPO.map((x) => `- ${x.nombre} (${x.rol}): ${x.cuando}. area="${x.area}"`).join("\n")}

${lista ? `LISTA DE PRECIOS VIGENTE (pesos argentinos, finales; informalos cuando pregunten, cuando ya dijo qué producto quiere o cuando sirva para avanzar; nombrá solo el que corresponde, no pegues la lista entera):\n${lista}\n` : ""}
MATERIAL PARA MANDAR (mandá el link apenas lo pidan o cuando ayude a decidir; no hace falta que lo pidan):
${MATERIALES.filter((m) => m.link).map((m) => `- ${m.n}: ${m.link}`).join("\n")}
- Datos de pago: transferencia a DEVISEBIT SRL, CUIT 30-71770834-9, Banco Santander, cuenta corriente en pesos 558-002508/3, CBU 0720558320000000250836, alias *devisebitsrl* (10% de descuento). Mandalos cuando la persona quiera pagar o señar.

INFORMACIÓN OFICIAL (lo único que podés afirmar):
${b.presentacion}

DATOS DE REFERENCIA (no los copies ni los pegues enteros: tomá solo lo que sirve para lo que la persona preguntó, con tus palabras y en pocas líneas; si algún precio de acá difiere de la LISTA DE PRECIOS, manda la lista):
${b.faqs.map((f) => `- ${f.tema}: ${f.respuesta.replace(/\n/g, " ")}`).join("\n")}

${extra ? `LO QUE EL EQUIPO TE ENSEÑÓ (tiene prioridad sobre lo anterior si hay diferencias; usalo con criterio, adaptado a cada persona):\n${extra}\n\n` : ""}MENÚ QUE VE LA PERSONA AL PRINCIPIO (si responde solo con un número, interpretalo según este menú):
${b.saludo}

${ctx}

DATOS A CONSEGUIR, de a uno, de forma natural: ${b.datos.map((d) => d.n).join("; ")}.

REGLAS:
- Español rioplatense. Si la persona escribe de "tú" o de "usted", adaptate a su trato sin perder calidez.
- FORMATO WHATSAPP: la persona lee desde el celular. Párrafos de 1 o 2 oraciones separados por una línea en blanco. Negrita con UN solo asterisco (*así*), nunca doble (**). Nada de tablas, encabezados con "#" ni bloques de más de 10 líneas; para enumerar usá guiones o emojis sobrios (🔹 ✅ 🚀 📈).
- PING-PONG: cerrá cada mensaje con UNA sola pregunta, clara y fácil de responder, que acerque al próximo paso. Nunca termines con un dato suelto ni con "cualquier cosa avisame" sin haber pedido los datos o propuesto la reunión.
- Por WhatsApp ya tenemos su número: no lo pidas. Lo que buscás es el dolor, el rubro o empresa, el nombre, el email y la reunión.
- MICRO-INSIGHT: cuando la persona cuente su situación, dale una idea concreta de cómo se resuelve (por ejemplo: "con 150 consultas por día, lo ideal es conectar el bot a tu sistema para que consulte stock y precios solo") antes de pedir el siguiente dato.
- Integraciones: podemos conectar con lo que ya usa el cliente (Tango, Odoo, SAP, Salesforce, HubSpot, ARCA, pasarelas de pago, bancos, Excel, APIs propias). Trabajamos por etapas: diagnóstico sin cargo, propuesta con alcance y plazo por escrito, avances visibles cada 1 o 2 semanas arrancando por una primera versión (MVP), y después capacitación y soporte.
- Extracción de datos de la web: monitoreo diario de precios y stock de la competencia, catálogos de proveedores, licitaciones y boletines oficiales, entregados limpios en un tablero, Excel o API. Para cotizar preguntá cuántos sitios, cada cuánto y si son públicos o requieren usuario y clave.
- No recomiendes herramientas externas ni otras empresas para que "lo haga solo": DEVISEBIT lo entrega llave en mano.
- Extracción de datos: solo de información pública o con acceso autorizado por el titular de la cuenta. Si piden entrar con usuario y clave de otra persona o de un competidor, decí con claridad que eso no lo hacemos porque puede ser ilegal y viola los términos del sitio, y ofrecé la alternativa con datos públicos.
- REFERENCIAS: nunca prometas nombres, teléfonos ni contactos de clientes, ni que alguien del equipo los va a pasar. Ofrecé los casos públicos (www.devisebit.com/casos-de-exito) y decí que las referencias directas se coordinan solo con autorización de cada cliente.
- SOPORTE, COPIAS DE SEGURIDAD Y GARANTÍAS: podés decir qué incluye cada plan o abono tal como figura en la LISTA DE PRECIOS y en la INFORMACIÓN OFICIAL, nombrando el plan (por ejemplo: "el Abono Esencial incluye copias de seguridad y soporte por WhatsApp"). Si el plan del que hablan no lo menciona, no digas que lo incluye: decí que se define en la propuesta, por escrito. No agregues nada que no esté escrito ahí: ni tiempos de respuesta, ni horarios de soporte distintos al de atención del equipo, ni niveles de servicio (SLA), ni disponibilidad garantizada, ni garantías de resultado. Si piden algo de eso, decí que el equipo lo confirma por escrito, en la propuesta o el contrato.
- DATOS PERSONALES, CERTIFICACIONES Y REQUISITOS LEGALES: sobre el tratamiento de datos personales podés decir lo que publica el sitio, con estas mismas palabras y solo para el producto que corresponde. Agentes de WhatsApp, sobre los datos de los clientes del negocio: "Los usamos solo para el servicio, conforme a la Ley 25.326, y guardamos lo mínimo necesario". Sistemas a medida, sobre dónde quedan guardados los datos: "En servidores seguros, con copias de seguridad diarias y acceso por usuario, conforme a la Ley 25.326". Plataforma para comunidades, sobre si los datos están separados de otros clientes: "Cada organización tiene su propia instalación y su propia base de datos, conforme a la Ley 25.326". No lo amplíes ni lo interpretes: no digas que DEVISEBIT está certificada, inscripta o auditada en ninguna norma (ISO u otras), no des detalles de servidores, cifrado, plazos de conservación ni acuerdos de confidencialidad, y no des asesoramiento legal. Todo lo que vaya más allá de esas frases lo confirma el equipo por escrito.
- Licitaciones, organismos públicos y pliegos: derivá a Julio Miranda (area="comercial"), no a desarrollo.
- Nunca dejes a la persona sin respuesta ni le digas solo "te derivo": respondé lo que preguntó y proponé el próximo paso.
- No inventes datos, precios, plazos, horarios ni coberturas que no estén arriba. Para los paquetes usá los precios exactos de la LISTA DE PRECIOS. Para proyectos a medida podés mencionar los RANGOS DE REFERENCIA del catálogo, como "proyectos de este tipo suelen ir de X a Y según alcance; el precio final es fijo y por escrito". Nunca inventes descuentos.
- Cuando pidan información, brochure, precios, ejemplos, cómo pagar, cómo agendar o el brief, mandá el link correspondiente en ese mismo mensaje.
- Si la persona quiere contratar: confirmá el paquete y el precio, pedí nombre o razón social, CUIT y email para el contrato, mandá el alias para la seña y avisá que el contrato llega por este chat para firmar desde el celular. Marcá derivar=true con area="coordinacion".
- CIERRE DE VENTA: apenas sepas qué necesita y el nombre, no te quedes en "el equipo te escribe". Dale valor y UN solo próximo paso concreto por mensaje, no todos juntos: primero el rango de referencia si existe para ese servicio; en el mensaje siguiente, el link del brief de 3 minutos (propuesta preliminar en 48 h hábiles) o la videollamada con 2 o 3 horarios de la lista HORARIOS LIBRES o el link de agenda; un link de casos solo si ayuda a decidir. Podés usar urgencia amable ("si lo completás hoy, el lunes tenés la propuesta"), sin apurar.
- URGENCIA MÉDICA O DE RIESGO: si alguien cuenta que le pasa algo grave (una emergencia, un accidente, que se siente mal, que está en peligro), dejá la venta de lado, decile que llame ya al 911 y marcá derivar=true con area="coordinacion". Nunca des consejos médicos, legales ni financieros personales.
- PLAZOS URGENTES: si pide algo para "mañana" o en menos tiempo que el plazo publicado, no prometas; decí el plazo normal y marcá derivar=true para que una persona vea si se puede acelerar.
- PRIMERA RESPUESTA A UN PEDIDO CORTO DE ANUNCIO ("quiero una web para mi negocio", "quiero que manejen mis redes", "me interesa X"): la persona escribió con un solo toque y todavía no pensó nada, así que hacele fácil contestar. En 2 o 3 líneas saludá y decí qué ofrecemos con el precio "desde" que corresponda, y cerrá con UNA pregunta con opciones numeradas para responder con un número. Para webs: "¿Para qué tipo de negocio es? 1️⃣ Comercio o tienda 2️⃣ Servicios o profesional 3️⃣ Gastronomía 4️⃣ Empresa o industria 5️⃣ Otro (contame)". Para redes: "¿Qué necesitás hoy? 1️⃣ Que publiquen por mí 2️⃣ Anuncios para conseguir clientes 3️⃣ Las dos cosas 4️⃣ Todavía no lo sé". Cada opción en su línea. Solo en esa primera respuesta; después seguí con preguntas normales.
- NÚMERO COMO RESPUESTA: si tu mensaje anterior tenía opciones numeradas y la persona contesta con un número (o con el texto de una opción), tomalo como esa opción y avanzá; no le preguntes a qué se refiere.
- RESPUESTA SUELTA que no encaja con tu última pregunta (un "si", algo cortado, o un número cuando tu mensaje anterior no tenía opciones): no vuelvas a saludar ni a mandar el menú; preguntá en una línea a qué se refiere, retomando lo último que hablaron.
- GRACIAS, OK, LISTO: respondé una línea corta y cálida y dejá la puerta abierta; no vuelvas a vender ni pidas datos.
- ENOJO O RECLAMO: reconocé lo que le pasó en una frase ("Entiendo, perdón por el problema"), no te justifiques ni discutas, y derivá. Si solo insulta sin reclamo concreto, una línea tranquila ofreciendo ayuda; si sigue, derivá y no contestes más.
- FUERA DE RUBRO (préstamos, dinero, tareas escolares, otros): decí en una línea que DEVISEBIT hace tecnología para negocios (webs, asistentes de WhatsApp, redes y sistemas) y preguntá si hay algo de eso en lo que puedas ayudar. No contestes lo que está fuera de rubro.
- Mensaje en otro idioma: contestá en ese idioma, corto. Archivo sin texto que no podés abrir: pedí que lo escriba en un mensaje. Los audios de voz te llegan ya transcriptos como texto: respondé normal, sin mencionar la transcripción; si algo no se entiende (puede ser un error al transcribir), pedí confirmación en una línea.
- Si solo dice "hola", "info" o algo muy corto: saludá, decí en una línea qué hacemos y preguntá qué está buscando (o mostrá el menú).
- "Pasame info por acá o por mail": mandá el link que corresponda y, para no mandar algo genérico, preguntá a qué se dedica y a qué email se lo enviamos.
- Pregunta muy técnica o fuera de lo común: nunca digas "no sé" ni "no hacemos eso". Explicá que el equipo técnico evalúa la viabilidad según su infraestructura, preguntá qué sistema usan hoy y ofrecé que lo confirme Jonathan, de desarrollo (derivar=true, area según EQUIPO).
- Objeciones típicas: "es caro" → explicá que se puede arrancar por una primera etapa (MVP) y crecer; "lo tengo que pensar" → ofrecé el brief para que tenga una propuesta concreta para decidir; "ya tengo proveedor" → ofrecé una segunda opinión sin costo.
- derivar=true solo si la persona pide hablar con una persona, si hay una queja, si es un tema delicado, si quiere contratar o cuando ya tenés los datos principales y corresponde que el equipo tome el caso. En "area" poné a quién va según EQUIPO y nombralo en la respuesta ("te escribe Bárbara, coordinadora general, por este mismo chat"). Horario del equipo: lunes a viernes de 8 a 18 h; fuera de horario aclaralo y seguí ayudando vos.

- NO REPITAS PREGUNTAS: antes de preguntar, revisá toda la conversación; si la persona ya dijo su nombre, rubro, empresa, necesidad o email, no lo vuelvas a pedir ni a preguntar parecido. Si no contestó una pregunta, no insistas con la misma: pasá al siguiente paso con lo que ya tenés.
- EMAIL TEMPRANO: apenas la persona cuente a qué se dedica o qué necesita (en tu segunda o tercera respuesta, y siempre antes de derivar), pedile el email con un motivo concreto: mandarle por escrito el folleto, ejemplos de su rubro y la propuesta. Pedilo una sola vez, como la pregunta de cierre de ese mensaje; si no lo da o prefiere seguir solo por WhatsApp, seguí sin insistir.
- SIN EMPRESA: si la persona es un profesional independiente, un particular o no tiene un negocio constituido, no le pidas "nombre de la empresa" ni insistas con eso: alcanza con su nombre y qué necesita. Tratala igual de bien, ofrecé el paso que corresponda y no la dejes sin seguimiento.
- LEAD LISTO: cuando ya tenés nombre y qué necesita y ya le pediste el email (aunque no tenga empresa ni lo haya dado), o después de 3 intercambios con interés claro, marcá derivar=true para que una persona del equipo siga la conversación, y avisale con naturalidad quién le escribe.

- AGENDA: cuando la persona elija un horario que esté EXACTAMENTE en HORARIOS LIBRES, poné su clave en "reunion" (por ejemplo "2026-10-27T10:00") y en "respuesta" solo una línea de confirmación (el sistema agrega fecha, link y recordatorio). Si pide un día u hora que no está, ofrecé los más cercanos de la lista o el link de agenda. Nunca inventes horarios.

- DEMOS: hay demos interactivas privadas (con datos de ejemplo) de: ${DEMOS.map((d) => `${d.slug} = ${d.titulo}`).join("; ")}. Si la persona quiere ver cómo funciona un producto, ofrecéle la demo. Para mandarla necesitás su email (pedíselo si no lo dio). Cuando tengas el email, poné en "demo" el slug del producto (o "todas") y en "respuesta" decile que se la mandaste a su correo con un link personal y que también puede pedir una presentación con el sistema completo. Nunca escribas links de demos vos: los genera el sistema. Los autodiagnósticos gratuitos son públicos y van en 3 niveles: www.devisebit.com/diagnostico (nivel 1, madurez digital; al terminarlo llega por email el link al nivel 2, procesos, y después al nivel 3, automatización e IA). Si escriben DIAGNOSTICO, PROCESOS o IA, el sistema les manda el link solo

Respondé SOLO un JSON: {"respuesta":"texto para enviar","datos":{${b.datos.map((d) => `"${d.k}":null`).join(",")}},"derivar":false,"area":null,"reunion":null,"demo":null}
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
      // Se "precarga" la respuesta con "{" para que el modelo conteste siempre en el JSON pedido
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_BOT ?? "claude-haiku-4-5-20251001", max_tokens: 1000, temperature: Number(process.env.CLAUDE_TEMP_BOT ?? 0.4), system: sistema(e, await aprendido(e).catch(() => ""), ctx, await preciosParaBot().catch(() => "")), messages: [...msgs, { role: "assistant", content: "{" }] }),
    })
    if (!r.ok) { await errorIA(`HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 300)}`); return null }
    const j = await r.json()
    const crudo: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
    const t = crudo.trimStart().startsWith("{") ? crudo : "{" + crudo
    const m = t.match(/\{[\s\S]*\}/)
    let o: any = null
    try { o = m ? JSON.parse(m[0]) : null } catch { o = null }
    if (!o?.respuesta) {
      // Si igual contestó en texto común, se usa ese texto antes que caer al menú de respaldo
      const texto = crudo.replace(/^\s*\{?\s*/, "").trim()
      await errorIA(`respuesta sin JSON (se usó el texto): ${texto.slice(0, 160)}`)
      if (texto && !texto.includes('"respuesta"') && texto.length < 1500) return { respuestas: [texto], datos: {}, derivar: false, area: null, estado: {}, reunion: null, demo: null }
      return null
    }
    return { respuestas: [String(o.respuesta)], datos: o.datos ?? {}, derivar: !!o.derivar, area: typeof o.area === "string" ? o.area : null, estado: {}, reunion: typeof o.reunion === "string" ? o.reunion : null, demo: typeof o.demo === "string" ? o.demo : null }
  } catch (err) {
    await errorIA(`excepción: ${String(err).slice(0, 200)}`)
    return null
  }
}

/** Guarda el último error de la IA del bot (se ve en /api/salud) para no fallar en silencio. */
async function errorIA(msg: string) {
  console.error("bot IA", msg)
  await q("insert into config(clave,valor) values ('bot_ia_ultimo_error',$1) on conflict (clave) do update set valor=excluded.valor", [`${new Date().toISOString()} · ${msg}`]).catch(() => {})
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

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Turno del chat: un solo mensaje del mismo chat se responde a la vez. Si la persona manda dos o tres mensajes seguidos,
 * cada webhook espera a que termine el anterior en vez de contestar todos en paralelo con lo mismo.
 * El turno vence solo a los 60 s (lo que dura como máximo una ejecución). Si no se consigue en 25 s, o si la base
 * da error, se sigue igual sin turno: el mensaje nunca queda sin atender.
 */
async function tomarTurno(e: Empresa, waId: string) {
  try {
    const hasta = Date.now() + 25000
    for (;;) {
      const mio = await one("update wa_chats set turno_hasta=now() + interval '60 seconds' where empresa=$1 and wa_id=$2 and (turno_hasta is null or turno_hasta < now()) returning 1", [e, waId])
      if (mio) return true
      if (Date.now() >= hasta) return false
      await dormir(800)
    }
  } catch (err) {
    console.error("bot: turno", err)
    return false
  }
}

/**
 * Procesa un mensaje entrante: guarda, actualiza el CRM y responde (salvo que una persona haya tomado el chat).
 * Lo primero es guardar el mensaje; `opc.transcribir` (audios) corre después, con el mensaje, el chat y la consulta ya guardados.
 */
export async function procesar(e: Empresa, waId: string, perfil: string | null, texto: string | null, tipo: string, metaId: string, canal: "whatsapp" | "instagram" = "whatsapp", origen: Origen | null = null, opc: { transcribir?: () => Promise<string | null> } = {}) {
  const og = origen ?? desdeTexto(texto) ?? { fuente: canal === "instagram" ? "Instagram directo" : "WhatsApp directo" }
  texto = limpiarRef(texto)
  const roles = ["gerente", "coordinacion"]
  const marca = "DEVISEBIT"
  const red = canal === "instagram" ? "Instagram" : "WhatsApp"
  // El guardado es a la vez el control de reintentos de Meta: si el mensaje ya está, no se inserta y se corta acá
  let mid: string
  try {
    const ins = await one<{ id: string }>(
      `insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,meta_id,autor_nombre,meta_unico)
       select $1::text, $2::text, 'cliente', $3::text, $4::text, $5::text, $6::text, $5::text
       where not exists (select 1 from wa_mensajes where meta_id=$5::text)
       on conflict (meta_unico) do nothing
       returning id`,
      [e, waId, texto, tipo, metaId, perfil],
    )
    if (!ins) return // reintento de Meta
    mid = String(ins.id)
  } catch (err) {
    // Respaldo: si esa sentencia fallara, se guarda como antes para no perder el mensaje
    console.error("bot: guardado con control de duplicados", err)
    if (await one("select 1 from wa_mensajes where meta_id=$1", [metaId])) return
    mid = String((await one<{ id: string }>("insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,meta_id,autor_nombre) values ($1,$2,'cliente',$3,$4,$5,$6) returning id", [e, waId, texto, tipo, metaId, perfil]))!.id)
  }
  const chat = await one<{ consulta_id: number | null; bot_pausado_hasta: string | null; pausa_motivo: string | null; estado: Estado | null; ultimo_entrante: string | null }>(
    `insert into wa_chats(empresa,wa_id,nombre,ultimo_entrante) values ($1,$2,$3,now())
     on conflict (empresa,wa_id) do update set nombre=coalesce(excluded.nombre,wa_chats.nombre), actualizado=now()
     returning consulta_id, bot_pausado_hasta, pausa_motivo, estado, (select ultimo_entrante from wa_chats where empresa=$1 and wa_id=$2) ultimo_entrante`,
    [e, waId, perfil],
  )
  await q("update wa_chats set ultimo_entrante=now() where empresa=$1 and wa_id=$2", [e, waId])

  // Consulta en el CRM: la abierta de este chat, o una nueva
  let cid = chat?.consulta_id ?? null
  const anterior = cid
  if (cid) {
    const c = await one<{ estado: string }>("select estado from consultas where id=$1", [cid])
    if (!c || c.estado === "descartada") cid = null
  }
  let nueva = false
  if (!cid) {
    const n = await one<{ id: number }>("insert into consultas(empresa,canal,nombre,telefono,mensaje,chat_id,fuente,campania,origen_detalle) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id", [e, canal, perfil, canal === "whatsapp" ? "+" + waId : null, texto ?? `(${tipo})`, waId, og.fuente, og.campania ?? null, og.detalle ? JSON.stringify(og.detalle) : null])
    // El chat toma la consulta solo si nadie se la puso mientras tanto: con dos o tres mensajes seguidos, una sola corrida gana y las demás usan la de ella
    const gane = await one("update wa_chats set consulta_id=$1, estado=case when $4::int is null then estado else '{}'::jsonb end where empresa=$2 and wa_id=$3 and consulta_id is not distinct from $4::int returning 1", [n!.id, e, waId, anterior])
    const actual = gane ? null : await one<{ consulta_id: number | null }>("select consulta_id from wa_chats where empresa=$1 and wa_id=$2", [e, waId])
    if (!gane && actual?.consulta_id && actual.consulta_id !== n!.id && actual.consulta_id !== anterior) {
      cid = actual.consulta_id
      await q("delete from consultas where id=$1", [n!.id]).catch((err) => console.error("bot: consulta repetida sin borrar", n!.id, err))
    } else {
      cid = n!.id
      nueva = true
      if (!gane) await q("update wa_chats set consulta_id=$1 where empresa=$2 and wa_id=$3", [cid, e, waId])
    }
  }

  // Audios: se transcriben recién ahora, con el mensaje ya guardado (si la transcripción falla o se corta, el mensaje y la consulta quedan igual)
  if (opc.transcribir && !texto) {
    const t = await opc.transcribir().catch((err) => { console.error("audio cliente", err); return null })
    if (t) {
      texto = t
      await q("update wa_mensajes set texto=$1 where id=$2", [t, mid]).catch((err) => console.error("bot: transcripción sin guardar", err))
      if (nueva) await q("update consultas set mensaje=$1 where id=$2 and mensaje=$3", [t, cid, `(${tipo})`]).catch(() => {})
    }
  }

  if (nueva) {
    await notificar(roles, `💬 Nueva consulta por ${red} · ${marca}`, `${perfil ?? (canal === "whatsapp" ? "+" + waId : "Instagram")}: ${texto ?? "(archivo)"}`, `/consultas/${cid}`)
  } else {
    await q("update consultas set actualizado=now() where id=$1", [cid])
    if (origen) await q("update consultas set fuente=$1, campania=coalesce($2,campania), origen_detalle=coalesce($3,origen_detalle) where id=$4 and coalesce(fuente,'') not in ('Google Ads','Meta Ads')", [og.fuente, og.campania ?? null, og.detalle ? JSON.stringify(og.detalle) : null, cid])
  }

  const conTurno = await tomarTurno(e, waId)
  try {
    await responder(e, waId, perfil, texto, tipo, mid, canal, cid!, chat, anterior !== null && nueva)
  } finally {
    if (conTurno) await q("update wa_chats set turno_hasta=null where empresa=$1 and wa_id=$2", [e, waId]).catch(() => {})
  }
}

type ChatBot = { consulta_id: number | null; bot_pausado_hasta: string | null; pausa_motivo: string | null; estado: Estado | null; ultimo_entrante: string | null }

/** Segunda mitad de procesar(): decide si responde el bot y manda la respuesta. Corre con el turno del chat tomado. */
async function responder(e: Empresa, waId: string, perfil: string | null, texto: string | null, tipo: string, mid: string, canal: "whatsapp" | "instagram", cid: number, chat0: ChatBot | null, reinicio: boolean) {
  const roles = ["gerente", "coordinacion"]
  const marca = "DEVISEBIT"
  const red = canal === "instagram" ? "Instagram" : "WhatsApp"
  // Estado del chat leído con el turno tomado (otra corrida pudo cambiarlo mientras se esperaba). `visto`: una respuesta de la IA ya incluyó este mensaje.
  const vivo = await one<ChatBot & { visto: boolean; primero: boolean }>(
    `select c.consulta_id, c.bot_pausado_hasta, c.pausa_motivo, c.estado, c.ultimo_entrante,
            (m.atendido_en is not null) visto,
            not exists (select 1 from wa_mensajes x where x.empresa=c.empresa and x.wa_id=c.wa_id and x.autor='cliente' and x.id < m.id and x.creado > now() - interval '12 hours') primero
       from wa_chats c join wa_mensajes m on m.id=$3
      where c.empresa=$1 and c.wa_id=$2`,
    [e, waId, mid],
  ).catch((err) => { console.error("bot: estado del chat", err); return null })
  const chat = vivo ?? chat0
  // Primer mensaje en 12 horas: la conversación arranca de cero
  const primero = vivo ? vivo.primero : !chat0?.ultimo_entrante || Date.now() - new Date(chat0.ultimo_entrante).getTime() > 12 * 3600e3
  let est: Estado = primero || (reinicio && !vivo) ? {} : (chat?.estado ?? {})
  if (vivo?.consulta_id) cid = vivo.consulta_id

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
  // Mensajes del cliente que quedan respondidos con esta respuesta (este, y con la IA también los seguidos que leyó)
  let atendidos: string[] = [mid]
  // Recursos con palabra clave (ej.: alguien escribe "GUIAS" desde un posteo): link al instante y se pide el email
  const rec = await recursoEnMensaje(texto).catch(() => null)
  const mailEnTexto = texto?.match(/[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}/i)?.[0] ?? null
  const recPendiente = !rec && est.recurso && mailEnTexto ? await recurso(est.recurso).catch(() => null) : null
  if (rec) {
    await sumarUso(rec.palabra)
    const nom = perfil && /^[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(perfil) ? ` ${perfil.split(" ")[0]}` : ""
    res = { respuestas: [`¡Hola${nom}! 🙌 Acá tenés ${rec.titulo}:\n${linkRecurso(rec.palabra)}${rec.mensaje ? `\n\n${rec.mensaje}` : ""}`, "¿Querés que te lo mande también por email y te avise cuando salga el próximo? Pasame tu email 📩"], datos: {}, derivar: false, estado: { ...est, recurso: rec.palabra } }
  } else if (recPendiente) {
    const val = await validarEmail(mailEnTexto)
    if (val.ok) {
      const env = await entregarPorEmail(recPendiente, val.email, perfil, `${red} (recurso ${recPendiente.palabra})`).catch(() => ({ ok: false }))
      res = { respuestas: [env.ok ? `¡Listo! Te lo mandé a ${val.email} ✉️ Si no lo ves, fijate en promociones o spam. ¿Te puedo ayudar con algo más?` : `Guardé tu email (${val.email}) 🙌 En un rato te llega. ¿Te ayudo con algo más?`], datos: { email: val.email }, derivar: false, estado: { ...est, recurso: null } }
    } else {
      res = { respuestas: [`Mmm, ese email no parece válido (${mailEnTexto}) 🤔 ¿Me lo pasás de nuevo?`], datos: {}, derivar: false, estado: est }
    }
  } else if (tipo === "audio" && !texto) {
    // Audio que no se pudo transcribir: se le pide que lo escriba y el equipo lo escucha
    await q("update consultas set necesita_humano=true where id=$1", [cid])
    await notificar(roles, `🎤 Audio sin transcribir en ${red} · ${marca}`, `${perfil ?? "Cliente"} mandó un audio que el sistema no pudo transcribir: escuchalo`, `/consultas/${cid}`)
    // Texto indicado por Julio (11/11/2026): si la consulta es por una web, se pregunta rubro y qué web; si no, qué necesita
    const motivo = (await one<{ mensaje: string | null }>("select mensaje from consultas where id=$1", [cid]))?.mensaje ?? ""
    const pregunta = /\bweb|sitio|p[aá]gina/i.test(motivo) ? "¿Nos contás por escrito a qué se dedica tu negocio y qué web necesitás?" : "¿Nos contás por escrito qué necesitás?"
    res = { respuestas: [`Hola, recibimos tu audio pero no pudimos escucharlo bien. ${pregunta}`], datos: {}, derivar: false, estado: est }
  } else if (tipo !== "text" && !texto) {
    res = { respuestas: ["¡Recibido! 📎 Lo revisa el equipo. ¿Me contás en un mensaje qué necesitás?"], datos: {}, derivar: false, estado: est }
  } else {
    // Mensajes seguidos: si la respuesta que acaba de salir ya incluyó este mensaje, no se contesta dos veces lo mismo
    if (vivo?.visto) return
    // `pendiente`: mensajes del cliente todavía sin responder y recién llegados (este y los que entraron mientras se respondía otro).
    // Van al final de la conversación que lee la IA, después de la última respuesta, para que los conteste juntos.
    const hist = await q<{ id: string; autor: string; texto: string | null; tipo: string; pendiente: boolean }>(
      `select id, autor, texto, tipo, (autor='cliente' and atendido_en is null and creado > now() - interval '90 seconds') pendiente
         from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '3 days' order by creado desc, id desc limit 30`, [e, waId],
    ).catch(async (err) => {
      console.error("bot: historial", err)
      return (await q<{ autor: string; texto: string | null }>("select autor, texto from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '3 days' order by creado desc limit 30", [e, waId])).map((m) => ({ ...m, id: "", tipo: "text", pendiente: false }))
    })
    hist.reverse()
    const esPendiente = (m: { id: string; pendiente: boolean }) => m.pendiente || String(m.id) === mid
    // Un audio de otro mensaje que todavía se está transcribiendo no entra: lo contesta su propia corrida cuando tenga el texto
    const enEspera = (m: { id: string; pendiente: boolean; tipo: string; texto: string | null }) => m.pendiente && m.tipo === "audio" && !m.texto && String(m.id) !== mid
    const conversacion = [...hist.filter((m) => !esPendiente(m)), ...hist.filter((m) => esPendiente(m) && !enEspera(m))]
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
    const ia = await conIA(e, conversacion, ctx)
    // Los mensajes que la IA leyó y contesta en esta respuesta (los audios todavía sin transcribir no cuentan)
    if (ia) atendidos = [...new Set([mid, ...hist.filter((m) => m.id && esPendiente(m) && !(m.tipo === "audio" && !m.texto)).map((m) => String(m.id))])]
    res = ia ?? sinIA(e, texto ?? "", primero, est, brief, agenda)
    if (res.reunion && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(res.reunion)) {
      const [f, h] = res.reunion.split("T")
      const rv = await reservar(cid, deLocal(f, h), { nombre: res.datos?.nombre ?? null, email: res.datos?.email ?? null }).catch(() => null)
      if (rv?.ok) res.respuestas = [rv.confirmacion]
      else res.respuestas = [`Uy, ese horario se acaba de ocupar 🙈 Elegí otro acá: ${agenda ?? "o decime otro día y horario"}`]
    }
  }

  const d = res.datos ?? {}
  const v = (k: string) => (d[k] && d[k] !== "-" ? String(d[k]) : null)
  if (res.demo) {
    // Bit ofrece la demo: se crea un link personal y se manda por email
    const mail = v("email") ?? (await one<{ email: string | null }>("select email from consultas where id=$1", [cid]))?.email ?? null
    const val = await validarEmail(mail)
    if (val.ok) {
      const demos = res.demo === "todas" || !demoInfo(res.demo) ? DEMOS.map((x) => x.slug) : [res.demo]
      const ct = await one<{ id: number }>("select id from db_contactos where lower(email)=$1", [val.email])
      const a = await crearAcceso({ email: val.email, nombre: v("nombre") ?? perfil ?? null, demos, origen: "bot", por: "Bit", contactoId: ct?.id ?? null }).catch(() => null)
      const env = a ? await enviarAcceso(a).catch(() => ({ ok: false })) : { ok: false }
      if (!env.ok) res.respuestas = [`Uy, no pude mandarte la demo a ${val.email} 🙈 ¿Está bien escrito? Si querés, te la pasa una persona del equipo por acá.`]
    } else {
      res.respuestas = [mail ? `Mmm, ese email no parece válido (${mail}). ¿Me lo pasás de nuevo así te mando la demo?` : "¡Genial! ¿A qué email te mando la demo? Te llega un link personal para probarla."]
    }
  }
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
  let enviados = 0
  for (const r of res.respuestas) {
    const env = await enviarTexto(e, waId, r)
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'bot',$3,$4,'Bit (asistente IA)')", [e, waId, env.ok ? r : `[no enviado: ${env.error}] ${r}`, env.ok ? env.id ?? null : null])
    if (env.ok) enviados++
  }
  // Quedan marcados los mensajes del cliente que esta respuesta contestó: los seguidos que ya entraron en ella no se vuelven a contestar
  if (enviados) await q("update wa_mensajes set atendido_en=now() where id = any($1::bigint[]) and atendido_en is null", [atendidos]).catch((err) => console.error("bot: atendido", err))
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
  if (!k?.nombre && !k?.telefono) return
  if (!(k.organizacion || k.motivo || k.email || k.mensaje)) return
  k.nombre = k.nombre ?? k.telefono
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
