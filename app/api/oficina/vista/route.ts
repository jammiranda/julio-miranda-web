import { NextResponse } from "next/server"
import { soloJulio } from "@/lib/oficina"
import { OFICINA_HTML } from "@/lib/oficina-html"

export const dynamic = "force-dynamic"

/** La Oficina como pantalla embebible (módulo del panel). Solo Julio. */
export async function GET() {
  if (!(await soloJulio())) return new NextResponse("No autorizado", { status: 401, headers: { "content-type": "text/plain; charset=utf-8" } })
  return new NextResponse(OFICINA_HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "same-origin" } })
}
