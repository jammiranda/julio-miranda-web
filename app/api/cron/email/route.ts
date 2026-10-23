import { NextResponse, type NextRequest } from "next/server"
import { procesarCola } from "@/lib/email"
export const dynamic = "force-dynamic"
export const maxDuration = 300
/** Lo llama Vercel Cron una vez por día: manda la tanda diaria de la cola de campañas. */
export async function GET(req: NextRequest) {
  const s = process.env.CRON_SECRET
  if (s && req.headers.get("authorization") !== `Bearer ${s}`) return NextResponse.json({ ok: false }, { status: 401 })
  const r = await procesarCola()
  return NextResponse.json({ ok: true, ...r })
}
