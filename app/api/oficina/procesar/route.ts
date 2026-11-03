import { NextResponse, type NextRequest } from "next/server"
import { reintentarOrden, soloJulio } from "@/lib/oficina"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Reintenta que el jefe analice una orden que quedó sin propuesta. Solo Julio. */
export async function POST(req: NextRequest) {
  if (!(await soloJulio())) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const id = req.nextUrl.searchParams.get("id") ?? ""
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 })
  return NextResponse.json(await reintentarOrden(id), { headers: { "cache-control": "no-store" } })
}
