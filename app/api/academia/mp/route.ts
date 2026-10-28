import { NextResponse, type NextRequest } from "next/server"
import { entregarOrden } from "@/lib/academia-entrega"
import { pagoMPCobro } from "@/lib/pagos"
export const dynamic = "force-dynamic"

/** Aviso de Mercado Pago: se consulta el pago a la API (no se confía en el cuerpo) y, si está aprobado, se entrega el producto. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = b?.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? req.nextUrl.searchParams.get("id")
  const tipo = b?.type ?? req.nextUrl.searchParams.get("type") ?? req.nextUrl.searchParams.get("topic")
  if (!id || (tipo && tipo !== "payment") || !process.env.MP_ACCESS_TOKEN) return NextResponse.json({ ok: true })
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(id))}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } })
  if (!r.ok) return NextResponse.json({ ok: true })
  const p = await r.json()
  if (String(p.external_reference ?? "").startsWith("cobro:")) { await pagoMPCobro(p).catch((e) => console.error("mp cobro", e)); return NextResponse.json({ ok: true }) }
  const orden = Number(p.external_reference)
  if (!orden || p.status !== "approved") return NextResponse.json({ ok: true })
  await entregarOrden(orden, String(p.id), "mercadopago")
  return NextResponse.json({ ok: true })
}
export const GET = POST
