import { NextResponse, type NextRequest } from "next/server"
import { q, one } from "@/lib/db"
import { procesar } from "@/lib/bot"
import { desdeUtm } from "@/lib/origen"
import { codigoChat, sitioValido, SITIOS } from "@/lib/chat-web"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Chat web de Bit (widget /chat.js en los sitios de DEVISEBIT).
 * POST { sid, texto, sitio, pagina, o: { utm_*, gclid, fbclid, landing, referrer } } → procesa el mensaje con el mismo bot de WhatsApp
 *   y devuelve lo que respondió. La conversación queda en Conversaciones (canal Web) con su origen.
 * GET ?sid=&desde= → mensajes posteriores a `desde` (respuestas del equipo desde el sistema, o el historial al volver a abrir).
 */
const E = "devisebit" as const
const SID = /^[a-z0-9]{20,40}$/
const LIM_CHAT_HORA = 40 // mensajes por visitante por hora
const LIM_IP_HORA = 6 // conversaciones nuevas por IP por hora
const LIM_DIA = 2500 // mensajes web por día en total (techo de gasto de IA)

function cors(req: NextRequest): Record<string, string> {
  const o = req.headers.get("origin") ?? ""
  const ok = /^https:\/\/([a-z0-9-]+\.)*devisebit\.com$/.test(o) || /^http:\/\/localhost:\d+$/.test(o)
  return ok ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" } : {}
}
const json = (req: NextRequest, cuerpo: unknown, status = 200) => NextResponse.json(cuerpo, { status, headers: { ...cors(req), "Cache-Control": "no-store" } })
const t = (v: unknown, n: number) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))
const WA = "5491173466490"

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req) })
}

type Msj = { id: string; autor: string; texto: string | null; autor_nombre: string | null; creado: string }
const salida = (m: Msj[]) => m.map((x) => ({ id: Number(x.id), autor: x.autor, texto: x.texto ?? "", nombre: x.autor === "equipo" ? (x.autor_nombre ?? "Equipo DEVISEBIT").split(" ")[0] : x.autor === "bot" ? "Bit" : null, t: x.creado }))

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") ?? ""
  if (!SID.test(sid)) return json(req, { ok: false, error: "sid" }, 400)
  const desde = Math.max(0, Number(req.nextUrl.searchParams.get("desde") ?? 0) || 0)
  const waId = "web:" + sid
  // Sin `desde` es la reapertura del chat: vuelve la conversación completa (últimos 40). Con `desde`, solo lo nuevo que no escribió la persona.
  const filas = desde
    ? await q<Msj>("select id, autor, texto, autor_nombre, creado from wa_mensajes where empresa=$1 and wa_id=$2 and id > $3 and autor <> 'cliente' and coalesce(texto,'') not like '[no enviado:%' order by id limit 20", [E, waId, desde])
    : (await q<Msj>("select id, autor, texto, autor_nombre, creado from wa_mensajes where empresa=$1 and wa_id=$2 and creado > now() - interval '7 days' order by id desc limit 40", [E, waId])).reverse()
  return json(req, { ok: true, mensajes: salida(filas), codigo: codigoChat(sid) })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const sid = String(b.sid ?? "")
  const texto = t(b.texto, 1200)
  if (!SID.test(sid) || !texto) return json(req, { ok: false, error: "datos" }, 400)
  if (b.website) return json(req, { ok: true, mensajes: [] }) // trampa para robots
  const sitio = sitioValido(b.sitio)
  const pagina = t(b.pagina, 160)
  const waId = "web:" + sid
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || "sin-ip"
  const wa = `https://wa.me/${WA}`

  // Límites: por visitante, por IP (conversaciones nuevas) y un techo diario. Si se pasa, se lo manda a WhatsApp en vez de dejarlo sin respuesta.
  const lim = await one<{ chat: number; nuevas: number; dia: number; existe: boolean }>(
    `select (select count(*)::int from wa_mensajes where empresa=$1 and wa_id=$2 and autor='cliente' and creado > now() - interval '1 hour') chat,
            (select count(*)::int from consultas where canal='web' and chat_id like 'web:%' and origen_detalle->>'ip'=$3 and creado > now() - interval '1 hour') nuevas,
            (select count(*)::int from wa_mensajes where empresa=$1 and wa_id like 'web:%' and autor='cliente' and creado > now() - interval '24 hours') dia,
            exists (select 1 from wa_chats where empresa=$1 and wa_id=$2) existe`,
    [E, waId, ip],
  )
  if (lim && (lim.chat >= LIM_CHAT_HORA || lim.dia >= LIM_DIA || (!lim.existe && lim.nuevas >= LIM_IP_HORA))) {
    return json(req, { ok: false, error: "limite", aviso: "Llegamos al máximo de mensajes por ahora. Seguí por WhatsApp y te atendemos enseguida.", wa }, 429)
  }

  const o = b.o && typeof b.o === "object" ? b.o : {}
  const og = desdeUtm({ utm_source: t(o.utm_source, 80), utm_medium: t(o.utm_medium, 80), utm_campaign: t(o.utm_campaign, 160), gclid: t(o.gclid ?? o.gbraid ?? o.wbraid, 200), fbclid: t(o.fbclid, 200), landing: t(o.landing, 200), referrer: t(o.referrer, 200) })
  og.campania = og.campania ?? `Chat de ${SITIOS[sitio].url}`
  og.detalle = { ...(og.detalle ?? {}), ip, sitio, pagina, chat: "web" }

  const antes = (await one<{ id: string | null }>("select max(id) id from wa_mensajes where empresa=$1 and wa_id=$2", [E, waId]))?.id ?? "0"
  const metaId = `web_${sid}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  try {
    await procesar(E, waId, null, texto, "text", metaId, "web", og, { web: { sitio, pagina } })
  } catch (err) {
    console.error("chat web", err)
    return json(req, { ok: false, error: "interno", aviso: "Se me cortó la conexión un segundo. ¿Me lo mandás de nuevo? Si no, seguimos por WhatsApp.", wa }, 500)
  }
  const nuevos = await q<Msj>("select id, autor, texto, autor_nombre, creado from wa_mensajes where empresa=$1 and wa_id=$2 and id > $3 and autor <> 'cliente' and coalesce(texto,'') not like '[no enviado:%' order by id", [E, waId, antes])
  const k = await one<{ id: number; email: string | null; telefono: string | null; utm_source: string | null }>("select id, email, telefono, utm_source from consultas where chat_id=$1 order by id desc limit 1", [waId])
  // Los utm_* de la visita quedan también en sus columnas (los informes de origen los leen de ahí)
  if (k && !k.utm_source && (og.utm_source || og.gclid)) await q("update consultas set utm_source=$1, utm_medium=$2, utm_campaign=$3, gclid=$4 where id=$5", [og.utm_source ?? null, og.utm_medium ?? null, og.utm_campaign ?? null, og.gclid ?? null, k.id]).catch(() => {})
  return json(req, {
    ok: true,
    mensajes: salida(nuevos),
    // Dejó un dato de contacto: el widget lo cuenta como conversión (una sola vez)
    lead: !!(k?.email || k?.telefono),
    email: !!k?.email,
    codigo: codigoChat(sid),
    // El bot no respondió (una persona del equipo tomó el chat, o está configurado para no responder en horario)
    aviso: nuevos.length ? null : "Recibimos tu mensaje. Una persona del equipo te responde por acá en un rato; si preferís, seguí por WhatsApp.",
  })
}
