import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
export const dynamic = "force-dynamic"

/**
 * Puente de Mercado Pago para MateBot (matebot.devisebit.com).
 * MateBot no tiene el token de MP: le pide a este sistema que cree y consulte sus suscripciones.
 * Solo atiende pedidos con la clave interna MATEBOT_MP_KEY y solo toca suscripciones "MateBot Plus"
 * (external_reference "matebot:<id>"). Devuelve lo mínimo necesario, nunca datos de la cuenta.
 */
const API = "https://api.mercadopago.com"

function autorizado(req: NextRequest) {
  const k = process.env.MATEBOT_MP_KEY || ""
  const h = req.headers.get("x-matebot-key") || ""
  if (!k || h.length !== k.length) return false
  return timingSafeEqual(Buffer.from(h), Buffer.from(k))
}

async function mp(ruta: string, init?: RequestInit) {
  const r = await fetch(`${API}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  })
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, status: r.status, j }
}

// Productos de la familia Mate que cobran por este puente (todos viven en el proyecto de MateBot)
const PREFIJOS = ["matebot:", "mateturnos:", "mateeventos:"]
const esMateBot = (p: any) => PREFIJOS.some((x) => String(p?.external_reference ?? "").startsWith(x))
const SUSCRIPCION: Record<string, { reason: string; ref: string; back: string }> = {
  plus: { reason: "MateBot Plus", ref: "matebot", back: "https://matebot.devisebit.com/plus/gracias" },
  turnos: { reason: "MateTurnos Pro", ref: "mateturnos", back: "https://mateturnos.devisebit.com/app?pro=ok" },
}
const resumen = (p: any) => ({
  id: p.id, status: p.status, external_reference: p.external_reference, init_point: p.init_point,
  next_payment_date: p.next_payment_date ?? null,
  last_charged_date: p.summarized?.last_charged_date ?? null,
})

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  if (!process.env.MP_ACCESS_TOKEN) return NextResponse.json({ error: "mp inactivo" }, { status: 503 })
  const b = await req.json().catch(() => ({}))

  if (b.accion === "crear") {
    const usuario = Number(b.usuario), monto = Number(b.monto)
    const prod = SUSCRIPCION[String(b.producto || "plus")]
    if (!prod || !usuario || !monto || monto > 50000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email || ""))) {
      return NextResponse.json({ error: "datos inválidos" }, { status: 400 })
    }
    const r = await mp("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: prod.reason,
        external_reference: `${prod.ref}:${usuario}`,
        payer_email: String(b.email),
        back_url: prod.back,
        status: "pending",
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: monto, currency_id: "ARS" },
      }),
    })
    if (!r.ok) return NextResponse.json({ error: r.j?.message || `mp ${r.status}` }, { status: 502 })
    return NextResponse.json(resumen(r.j))
  }

  if (b.accion === "ver" && b.id) {
    const r = await mp(`/preapproval/${encodeURIComponent(String(b.id))}`)
    if (!r.ok || !esMateBot(r.j)) return NextResponse.json({ error: "no encontrada" }, { status: 404 })
    return NextResponse.json(resumen(r.j))
  }

  if (b.accion === "cobro" && b.id) {
    const r = await mp(`/authorized_payments/${encodeURIComponent(String(b.id))}`)
    if (!r.ok || !r.j?.preapproval_id) return NextResponse.json({ error: "no encontrado" }, { status: 404 })
    const p = await mp(`/preapproval/${encodeURIComponent(String(r.j.preapproval_id))}`)
    if (!p.ok || !esMateBot(p.j)) return NextResponse.json({ error: "no encontrado" }, { status: 404 })
    return NextResponse.json({ preapproval: resumen(p.j), status: r.j.status, payment_status: r.j.payment?.status ?? null, date: r.j.debit_date ?? r.j.date_created ?? null })
  }

  // Pago único (MateEventos Pro por evento): preferencia de Checkout Pro
  if (b.accion === "preferencia") {
    const evento = Number(b.evento), monto = Number(b.monto)
    if (!evento || !monto || monto > 500000) return NextResponse.json({ error: "datos inválidos" }, { status: 400 })
    const r = await mp("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: `mateeventos-${evento}`, title: `MateEventos Pro · ${String(b.titulo || "Evento").slice(0, 60)}`, quantity: 1, unit_price: monto, currency_id: "ARS" }],
        external_reference: `mateeventos:${evento}`,
        ...(b.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email)) ? { payer: { email: String(b.email) } } : {}),
        back_urls: { success: "https://mateeventos.devisebit.com/app?pro=ok", pending: "https://mateeventos.devisebit.com/app?pro=pendiente", failure: "https://mateeventos.devisebit.com/app?pro=error" },
        auto_return: "approved",
        notification_url: "https://sistema.devisebit.com/api/academia/mp",
        statement_descriptor: "MATEEVENTOS",
      }),
    })
    if (!r.ok) return NextResponse.json({ error: r.j?.message || `mp ${r.status}` }, { status: 502 })
    return NextResponse.json({ id: r.j.id, init_point: r.j.init_point })
  }

  if (b.accion === "pago" && b.id) {
    const r = await mp(`/v1/payments/${encodeURIComponent(String(b.id))}`)
    if (!r.ok || !String(r.j?.external_reference ?? "").startsWith("mateeventos:")) return NextResponse.json({ error: "no encontrado" }, { status: 404 })
    return NextResponse.json({ id: r.j.id, status: r.j.status, external_reference: r.j.external_reference, monto: r.j.transaction_amount })
  }

  return NextResponse.json({ error: "acción desconocida" }, { status: 400 })
}
