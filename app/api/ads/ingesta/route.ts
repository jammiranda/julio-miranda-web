import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { guardarFilas, type FilaAds } from "@/lib/ads"
import { q } from "@/lib/db"

const anotar = (v: object) => q("insert into config(clave,valor) values ('ads_ultima_ingesta',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ cuando: new Date().toISOString(), ...v })]).catch(() => {})

export const dynamic = "force-dynamic"

/**
 * Recibe los datos diarios de anuncios (lo usa el script de Google Ads).
 * Header x-api-key = ADS_INGESTA_KEY. Cuerpo: { plataforma: "google" | "meta", filas: [{ fecha, campania, campania_id, gasto, moneda, impresiones, clics, conversiones }] }
 */
export async function POST(req: NextRequest) {
  if (!process.env.ADS_INGESTA_KEY || !claveOk(req.headers.get("x-api-key"), "ADS_INGESTA_KEY")) { await anotar({ ok: false, motivo: "clave incorrecta o falta x-api-key" }); return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 }) }
  const b = await req.json().catch(() => ({}))
  const p = b.plataforma === "meta" ? "meta" : b.plataforma === "google" ? "google" : null
  if (!p || !Array.isArray(b.filas)) { await anotar({ ok: false, motivo: "faltan plataforma o filas" }) }
  if (!p || !Array.isArray(b.filas)) return NextResponse.json({ ok: false, error: "faltan plataforma o filas" }, { status: 400 })
  const n = await guardarFilas(p, (b.filas as FilaAds[]).slice(0, 5000))
  await anotar({ ok: true, plataforma: p, filas_recibidas: b.filas.length, guardadas: n })
  return NextResponse.json({ ok: true, guardadas: n })
}
