import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { resumenAds } from "@/lib/ads"
import { panelWeb, panelMetricas, youtube, safe } from "@/lib/panel"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * KPIs para el Panel de Contenido DEVISEBIT (solo cifras agregadas, sin nombres, emails ni teléfonos).
 * Protegido con ?k=PANEL_TOKEN. Las mismas cifras las usa el panel propio en panel.devisebit.com (lib/panel.ts).
 */
function autorizado(k: string | null) {
  const t = process.env.PANEL_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  if (!autorizado(req.nextUrl.searchParams.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const t0 = Date.now()
  const [web, m, yt, anuncios] = await Promise.all([panelWeb(), panelMetricas(), safe(youtube()), safe(resumenAds())])
  return NextResponse.json(
    { ok: true, generado: new Date().toISOString(), ms: Date.now() - t0, web, visitas: m.visitas, crm: m.crm, usuarios: m.usuarios, youtube: yt, anuncios, academia: m.academia },
    { headers: { "cache-control": "no-store" } },
  )
}
