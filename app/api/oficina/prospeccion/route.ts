import { NextResponse, type NextRequest } from "next/server"
import { tokenValido } from "@/lib/oficina"
import { q } from "@/lib/db"
import { guardarDesdeApi, type ItemApi } from "@/lib/prospeccion"

export const dynamic = "force-dynamic"

/**
 * Prospección para las tareas programadas (mismo token de la Oficina, OFICINA_TOKEN).
 * Va también por GET porque las tareas en la nube abren direcciones con curl.
 *
 *   ?k=TOKEN&agente=busqueda-laboral&op=leer[&canal=gmail|linkedin|web][&campania=…]
 *     → registros abiertos (borrador, enviado, respondió, reunión) para cruzar con Gmail y LinkedIn.
 *   ?k=TOKEN&agente=…&op=estado&ref=…&estado=enviado|respondio|reunion|sin_respuesta&fecha=AAAA-MM-DD&detalle=…
 *     → cambia el estado de un registro que ya existe (queda en la historia con fecha y agente).
 *   ?k=TOKEN&agente=…&op=alta&ref=…&campania=…&canal=…&tipo=…&sentido=…&organizacion=…&persona=…&cargo=…&destino=…&asunto=…&estado=…&fecha=…&notas=…
 *     → da de alta (o completa) un registro por su ref.
 *   POST ?k=TOKEN&agente=… con { items: [...] } → igual que /api/panel/prospeccion (varios a la vez).
 * Nunca borra. El estado "ganado" y "descartado" solo los pone una persona desde el Sistema.
 */
const PERMITIDOS = ["borrador", "enviado", "respondio", "reunion", "sin_respuesta"]
const no = () => NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: { "cache-control": "no-store" } })
const fecha = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
const por = (p: URLSearchParams) => `tarea ${String(p.get("agente") ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "sin nombre"}`

function limpiar(items: ItemApi[]) {
  return items.map((it) => ({ ...it, estado: it.estado && PERMITIDOS.includes(it.estado) ? it.estado : undefined }))
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (!tokenValido(p.get("k"))) return no()
  const op = p.get("op") ?? "leer"
  try {
    if (op === "leer") {
      const cond = ["estado in ('borrador','enviado','respondio','reunion')"]
      const params: unknown[] = []
      if (p.get("canal")) { params.push(p.get("canal")); cond.push(`canal=$${params.length}`) }
      if (p.get("campania")) { params.push(p.get("campania")); cond.push(`campania=$${params.length}`) }
      const filas = await q<any>(
        `select ref, campania, tipo, canal, sentido, organizacion, persona, destino, asunto, estado, to_char(enviado_en,'YYYY-MM-DD') enviado_en, to_char(respondio_en,'YYYY-MM-DD') respondio_en, to_char(seguimiento,'YYYY-MM-DD') seguimiento
         from g_prospeccion where ${cond.join(" and ")} order by canal, estado, id limit 400`, params)
      return json({ ok: true, n: filas.length, items: filas })
    }
    const ref = p.get("ref")
    if (!ref) return json({ ok: false, error: "falta ref" }, 400)
    if (op === "estado") {
      const estado = p.get("estado") ?? ""
      if (!PERMITIDOS.includes(estado)) return json({ ok: false, error: `estado no permitido: usá ${PERMITIDOS.join(", ")}` }, 400)
      const ya = await q<{ id: number }>("select id from g_prospeccion where ref=$1", [ref])
      if (!ya.length) return json({ ok: false, error: "no existe ese ref: usá op=alta" }, 404)
      const f = fecha(p.get("fecha"))
      const it: ItemApi = { ref, estado, notas: undefined }
      if (estado === "enviado" && f) it.enviado_en = f
      if (["respondio", "reunion"].includes(estado) && f) it.respondio_en = f
      if (p.get("detalle")) it.eventos = [{ tipo: "nota", detalle: String(p.get("detalle")).slice(0, 300), fecha: f ?? undefined }]
      return json({ ok: true, ...(await guardarDesdeApi([it], por(p))) })
    }
    if (op === "alta") {
      const f = fecha(p.get("fecha"))
      const estado = p.get("estado") ?? "borrador"
      const it: ItemApi = {
        ref, campania: p.get("campania") ?? undefined, tipo: p.get("tipo") ?? undefined, canal: p.get("canal") ?? undefined, sentido: p.get("sentido") ?? undefined,
        organizacion: p.get("organizacion") ?? undefined, persona: p.get("persona"), cargo: p.get("cargo"), destino: p.get("destino"), asunto: p.get("asunto"),
        estado, notas: p.get("notas"),
        enviado_en: estado !== "borrador" && f ? f : null, respondio_en: ["respondio", "reunion"].includes(estado) && f ? f : null,
      }
      return json({ ok: true, ...(await guardarDesdeApi(limpiar([it]), por(p))) })
    }
    return json({ ok: false, error: "op desconocida: leer, estado o alta" }, 400)
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message ?? e).slice(0, 200) }, 500)
  }
}

export async function POST(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (!tokenValido(p.get("k"))) return no()
  const b: any = await req.json().catch(() => null)
  const items: ItemApi[] = Array.isArray(b?.items) ? b.items : []
  if (!items.length) return json({ ok: false, error: "no llegó ningún item" }, 400)
  try {
    return json({ ok: true, ...(await guardarDesdeApi(limpiar(items), por(p))) })
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message ?? e).slice(0, 200) }, 500)
  }
}
