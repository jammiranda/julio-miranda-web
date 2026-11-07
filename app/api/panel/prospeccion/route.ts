import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { claveOk } from "@/lib/clave"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { guardarDesdeApi, prospeccionPanel, type ItemApi } from "@/lib/prospeccion"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Prospección: alta y actualización de mails, invitaciones de LinkedIn y postulaciones, con su historia.
 *
 * Autenticación (igual que /api/panel/linkedin/importar):
 * - Header x-api-key = ADS_INGESTA_KEY (tareas programadas), o
 * - PANEL_TOKEN en x-panel-token o ?k=, o
 * - sesión del sistema con rol Dirección o Comercial.
 *
 * POST { items: [{ ref, campania, tanda, tipo, canal, sentido, organizacion, persona, cargo, destino, asunto,
 *                  estado, enviado_en, respondio_en, seguimiento, responsable, notas, eventos: [{ fecha, tipo, detalle }] }] }
 * `ref` es único (ej. "gmail:<id del borrador>", "linkedin:<nombre-empresa>"): si ya existe se actualiza y lo que no se manda no se pisa.
 * Cada cambio de estado y cada evento queda en la historia con fecha y origen.
 * GET devuelve el resumen (las mismas cifras del Panel).
 */
function tokenPanel(k: string | null) {
  const t = process.env.PANEL_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function quien(req: NextRequest) {
  if (process.env.ADS_INGESTA_KEY && claveOk(req.headers.get("x-api-key"), "ADS_INGESTA_KEY")) return { por: "tarea (ADS_INGESTA_KEY)", u: null }
  if (tokenPanel(req.headers.get("x-panel-token") ?? req.nextUrl.searchParams.get("k"))) return { por: "tarea (PANEL_TOKEN)", u: null }
  const u = await usuarioActual().catch(() => null)
  if (u && ["gerente", "coordinacion"].includes(u.rol)) return { por: u.nombre ?? u.usuario, u }
  return null
}

const NO = () => NextResponse.json({ ok: false, error: "no autorizado: mandá x-api-key (ADS_INGESTA_KEY) o x-panel-token (PANEL_TOKEN)" }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!(await quien(req))) return NO()
  try {
    return NextResponse.json({ ok: true, ...(await prospeccionPanel()) }, { headers: { "cache-control": "no-store" } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e).slice(0, 300) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const qn = await quien(req)
  if (!qn) return NO()
  let items: ItemApi[] = []
  try {
    const b: any = await req.json()
    items = Array.isArray(b?.items) ? b.items : Array.isArray(b) ? b : []
  } catch {
    return NextResponse.json({ ok: false, error: "cuerpo JSON inválido" }, { status: 400 })
  }
  if (!items.length) return NextResponse.json({ ok: false, error: "no llegó ningún item" }, { status: 400 })
  try {
    const r = await guardarDesdeApi(items, qn.por)
    if (qn.u) await audit(qn.u, "importar", "g_prospeccion", undefined, `${r.creados} nuevos, ${r.actualizados} actualizados`)
    return NextResponse.json({ ok: true, ...r }, { headers: { "cache-control": "no-store" } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `error al guardar: ${String(e?.message ?? e).slice(0, 300)}` }, { status: 500 })
  }
}
