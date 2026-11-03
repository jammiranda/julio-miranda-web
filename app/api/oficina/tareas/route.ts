import { NextResponse, type NextRequest } from "next/server"
import { cerrarTarea, tareasPendientes, tokenValido } from "@/lib/oficina"

export const dynamic = "force-dynamic"

/** Tareas que Julio ya aprobó para un agente: /api/oficina/tareas?k=TOKEN&agente=ventas  (para marcar una hecha: &hecha=ID&nota=...) */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (!tokenValido(p.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const hecha = p.get("hecha")
  if (hecha) return NextResponse.json({ ok: await cerrarTarea(hecha, p.get("nota") ?? "") }, { headers: { "cache-control": "no-store" } })
  const agente = p.get("agente") ?? ""
  return NextResponse.json({ ok: true, tareas: agente ? await tareasPendientes(agente) : [] }, { headers: { "cache-control": "no-store" } })
}
