import { NextResponse, type NextRequest } from "next/server"
import { tokenValido } from "@/lib/oficina"
import { academiaPanel } from "@/lib/academia-panel"

export const dynamic = "force-dynamic"

/** Cifras agregadas de la Academia para los agentes de Academia Educativa (sin datos personales). */
export async function GET(req: NextRequest) {
  if (!tokenValido(req.nextUrl.searchParams.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, ...(await academiaPanel()) }, { headers: { "cache-control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "sin datos" }, { status: 500 })
  }
}
