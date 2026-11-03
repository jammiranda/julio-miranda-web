import { NextResponse, type NextRequest } from "next/server"
import { informarEstado, tokenValido } from "@/lib/oficina"

export const dynamic = "force-dynamic"

/**
 * Las tareas programadas informan cómo van. Va por GET porque las tareas en la nube solo pueden abrir páginas (WebFetch):
 *   /api/oficina/evento?k=TOKEN&agente=ventas&estado=working&paso=revisando+respuestas
 * El token solo permite informar estado (nada más) y el paso se limpia de mails y links.
 */
async function manejar(p: URLSearchParams) {
  if (!tokenValido(p.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const r = await informarEstado(String(p.get("agente") ?? ""), String(p.get("estado") ?? ""), String(p.get("paso") ?? ""))
  return NextResponse.json(r, { headers: { "cache-control": "no-store" } })
}
export const GET = (req: NextRequest) => manejar(req.nextUrl.searchParams)
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const p = new URLSearchParams({ k: req.nextUrl.searchParams.get("k") ?? String(b.k ?? ""), agente: String(b.agente ?? ""), estado: String(b.estado ?? ""), paso: String(b.paso ?? "") })
  return manejar(p)
}
