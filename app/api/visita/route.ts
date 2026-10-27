import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Contador de visitas propio, sin cookies ni datos personales: guarda día, sitio, página, de dónde vino y tipo de dispositivo. */
const HOSTS = ["devisebit.com", "www.devisebit.com", "academia.devisebit.com", "desarrollo.devisebit.com", "sistema.devisebit.com"]
const PROPIOS = /(^|\.)devisebit\.com$/
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|vercel/i

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }) }

export async function POST(req: NextRequest) {
  try {
    if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204, headers: cors })
    const b = JSON.parse((await req.text()).slice(0, 2000) || "{}")
    let host = String(b.h ?? "").toLowerCase().trim()
    if (!HOSTS.includes(host)) return new NextResponse(null, { status: 204, headers: cors })
    if (host === "devisebit.com") host = "www.devisebit.com"
    const path = (String(b.p ?? "/").split(/[?#]/)[0] || "/").slice(0, 120)
    let ref = ""
    try { const r = new URL(String(b.r ?? "")).hostname.toLowerCase().replace(/^www\./, ""); ref = PROPIOS.test(r) ? "" : r.slice(0, 80) } catch {}
    const disp = Number(b.w) > 0 && Number(b.w) < 768 ? "movil" : "escritorio"
    await q(
      `insert into pv_visitas(dia,host,path,ref,disp,n) values ((now() at time zone 'America/Argentina/Buenos_Aires')::date,$1,$2,$3,$4,1)
       on conflict (dia,host,path,ref,disp) do update set n=pv_visitas.n+1`,
      [host, path, ref, disp],
    )
  } catch {}
  return new NextResponse(null, { status: 204, headers: cors })
}
