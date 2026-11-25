import { NextResponse, type NextRequest } from "next/server"
import { entregarOrden } from "@/lib/academia-entrega"
import { pagoMPCobro } from "@/lib/pagos"
import { avisoSuscripcion, avisoCobroSuscripcion, estadoSuscripciones, sincronizarSuscripciones } from "@/lib/web-suscripcion"
export const dynamic = "force-dynamic"

/** Aviso de Mercado Pago: se consulta el pago a la API (no se confía en el cuerpo) y, si está aprobado, se entrega el producto. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = b?.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? req.nextUrl.searchParams.get("id")
  const tipo = b?.type ?? req.nextUrl.searchParams.get("type") ?? req.nextUrl.searchParams.get("topic")
  // Chequeo de Web por Suscripción: solo devuelve sí/no y cantidades, ningún dato de la cuenta
  if (req.nextUrl.searchParams.get("estado") === "sincronizar") {
    const r = await sincronizarSuscripciones().catch(() => ({ ok: false, vistas: 0, cambios: 0 }))
    return NextResponse.json(r, { headers: { "access-control-allow-origin": "*" } })
  }
  if (req.nextUrl.searchParams.get("estado") === "suscripciones") return NextResponse.json(await estadoSuscripciones().catch(() => ({ error: true })))
  // MateBot Plus: avisamos a MateBot, que vuelve a consultar por el puente /api/matebot/mp (no se reenvía ningún dato)
  if (id && process.env.MATEBOT_MP_KEY && ["subscription_preapproval", "preapproval", "subscription_authorized_payment", "authorized_payment"].includes(String(tipo))) {
    await fetch("https://matebot.devisebit.com/api/mp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-matebot-key": process.env.MATEBOT_MP_KEY },
      body: JSON.stringify({ type: tipo, data: { id: String(id) } }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {})
  }
  // Suscripciones (Web por Suscripción): altas, cancelaciones y cobros mensuales
  if (id && process.env.MP_ACCESS_TOKEN && (tipo === "subscription_preapproval" || tipo === "preapproval")) {
    await avisoSuscripcion(String(id)).catch((e) => console.error("mp suscripcion", e))
    return NextResponse.json({ ok: true })
  }
  if (id && process.env.MP_ACCESS_TOKEN && (tipo === "subscription_authorized_payment" || tipo === "authorized_payment")) {
    await avisoCobroSuscripcion(String(id)).catch((e) => console.error("mp cobro suscripcion", e))
    return NextResponse.json({ ok: true })
  }
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
