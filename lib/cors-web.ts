import { NextResponse, type NextRequest } from "next/server"

/** CORS para formularios de www.devisebit.com que llaman al sistema. */
const ORIGENES = ["https://www.devisebit.com", "https://devisebit.com"]
export function corsWeb(req: NextRequest): Record<string, string> {
  const o = req.headers.get("origin") ?? ""
  const ok = ORIGENES.includes(o) || /^http:\/\/localhost:\d+$/.test(o)
  return ok ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {}
}
export const preflight = (req: NextRequest) => new NextResponse(null, { status: 204, headers: corsWeb(req) })
export function conCors(req: NextRequest, res: NextResponse) {
  for (const [k, v] of Object.entries(corsWeb(req))) res.headers.set(k, v)
  return res
}
export const ipDe = (req: NextRequest) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || "sin-ip"
