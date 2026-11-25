import { NextResponse, type NextRequest } from "next/server"
import { one } from "@/lib/db"

export const dynamic = "force-dynamic"

/** La demo externa (Salud Digital) pregunta si un link personal sigue vigente para ese producto. No devuelve datos del interesado. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? ""
  const s = req.nextUrl.searchParams.get("s") ?? ""
  if (!t || !s) return NextResponse.json({ ok: false })
  const a = await one<{ demos: string[]; expira: Date; revocado: boolean }>("select demos, expira, revocado from demo_accesos where token=$1", [t])
  const ok = !!a && !a.revocado && new Date(a.expira) > new Date() && a.demos.includes(s)
  return NextResponse.json({ ok }, { headers: { "cache-control": "no-store" } })
}
