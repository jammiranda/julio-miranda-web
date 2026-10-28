import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { guardarFilas, type FilaAds } from "@/lib/ads"

export const dynamic = "force-dynamic"

/**
 * Recibe los datos diarios de anuncios (lo usa el script de Google Ads).
 * Header x-api-key = ADS_INGESTA_KEY. Cuerpo: { plataforma: "google" | "meta", filas: [{ fecha, campania, campania_id, gasto, moneda, impresiones, clics, conversiones }] }
 */
export async function POST(req: NextRequest) {
  if (!process.env.ADS_INGESTA_KEY || !claveOk(req.headers.get("x-api-key"), "ADS_INGESTA_KEY")) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const p = b.plataforma === "meta" ? "meta" : b.plataforma === "google" ? "google" : null
  if (!p || !Array.isArray(b.filas)) return NextResponse.json({ ok: false, error: "faltan plataforma o filas" }, { status: 400 })
  const n = await guardarFilas(p, (b.filas as FilaAds[]).slice(0, 5000))
  return NextResponse.json({ ok: true, guardadas: n })
}
