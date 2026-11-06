import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Contador de visitas propio, sin cookies ni datos personales: guarda día, sitio, página, de dónde vino y tipo de dispositivo. */
const HOSTS = ["devisebit.com", "www.devisebit.com", "academia.devisebit.com", "desarrollo.devisebit.com", "sistema.devisebit.com"]
const PROPIOS = /(^|\.)devisebit\.com$/
const ACCIONES = ["suscripcion", "inscripcion", "compra"]
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
    const dia = `(now() at time zone 'America/Argentina/Buenos_Aires')::date`
    // Clic en un botón de suscripción, inscripción o compra: solo el tipo y la página, sin nada de lo escrito
    if (b.a !== undefined) {
      const accion = String(b.a)
      if (ACCIONES.includes(accion)) {
        await q(
          `insert into pv_clics(dia,host,path,accion,n) values (${dia},$1,$2,$3,1)
           on conflict (dia,host,path,accion) do update set n=pv_clics.n+1`,
          [host, path, accion],
        )
      }
      return new NextResponse(null, { status: 204, headers: cors })
    }
    let ref = ""
    try { const r = new URL(String(b.r ?? "")).hostname.toLowerCase().replace(/^www\./, ""); ref = PROPIOS.test(r) ? "" : r.slice(0, 80) } catch {}
    // Si el link traía utm_*, el origen es ese (por ejemplo "utm:email" para los mails); gana sobre el referrer
    const utm = String(b.m ?? "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30)
    const utmFuente = String(b.s ?? "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30)
    if (utm || utmFuente) ref = "utm:" + (/^(email|e-mail|mail|newsletter)$/.test(utm) || /^(email|mail|newsletter|brevo)$/.test(utmFuente) ? "email" : utmFuente || utm)
    const disp = Number(b.w) > 0 && Number(b.w) < 768 ? "movil" : "escritorio"
    await q(
      `insert into pv_visitas(dia,host,path,ref,disp,n) values (${dia},$1,$2,$3,$4,1)
       on conflict (dia,host,path,ref,disp) do update set n=pv_visitas.n+1`,
      [host, path, ref, disp],
    )
  } catch {}
  return new NextResponse(null, { status: 204, headers: cors })
}
