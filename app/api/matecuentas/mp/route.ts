import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
export const dynamic = "force-dynamic"

/**
 * Puente de Mercado Pago para MateCuentas (matecuentas.devisebit.com), igual que el de MateBot.
 * MateCuentas no tiene el token de MP: le pide a este sistema que cree, consulte y cancele sus suscripciones.
 * Solo atiende pedidos con la clave interna MATECUENTAS_MP_KEY y solo toca suscripciones "MateCuentas Pro"
 * (external_reference "matecuentas:<id>"). Devuelve lo mínimo necesario, nunca datos de la cuenta.
 */
const API = "https://api.mercadopago.com"

function autorizado(req: NextRequest) {
  const k = process.env.MATECUENTAS_MP_KEY || ""
  const h = req.headers.get("x-matecuentas-key") || ""
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

const esMateCuentas = (p: any) => String(p?.external_reference ?? "").startsWith("matecuentas:")
const resumen = (p: any) => ({
  id: p.id, status: p.status, external_reference: p.external_reference, init_point: p.init_point,
  next_payment_date: p.next_payment_date ?? null,
  amount: p.auto_recurring?.transaction_amount ?? null,
})

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  if (!process.env.MP_ACCESS_TOKEN) return NextResponse.json({ error: "mp inactivo" }, { status: 503 })
  const b = await req.json().catch(() => ({}))

  if (b.accion === "crear") {
    const usuario = String(b.usuario || ""), monto = Number(b.monto)
    if (!/^u[\w-]{4,40}$/.test(usuario) || !monto || monto > 50000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email || ""))) {
      return NextResponse.json({ error: "datos inválidos" }, { status: 400 })
    }
    const r = await mp("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: "MateCuentas Pro — membresía mensual",
        external_reference: `matecuentas:${usuario}`,
        payer_email: String(b.email),
        back_url: "https://matecuentas.devisebit.com/app#pro",
        status: "pending",
        auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: monto, currency_id: "ARS" },
      }),
    })
    if (!r.ok) return NextResponse.json({ error: r.j?.message || `mp ${r.status}` }, { status: 502 })
    return NextResponse.json(resumen(r.j))
  }

  if (b.accion === "ver" && b.id) {
    const r = await mp(`/preapproval/${encodeURIComponent(String(b.id))}`)
    if (!r.ok || !esMateCuentas(r.j)) return NextResponse.json({ error: "no encontrada" }, { status: 404 })
    return NextResponse.json(resumen(r.j))
  }

  if (b.accion === "cancelar" && b.id) {
    const v = await mp(`/preapproval/${encodeURIComponent(String(b.id))}`)
    if (!v.ok || !esMateCuentas(v.j)) return NextResponse.json({ error: "no encontrada" }, { status: 404 })
    const r = await mp(`/preapproval/${encodeURIComponent(String(b.id))}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) })
    if (!r.ok) return NextResponse.json({ error: r.j?.message || `mp ${r.status}` }, { status: 502 })
    return NextResponse.json(resumen(r.j))
  }

  // Gastos de la cuenta (pagos hechos como pagador) desde una fecha, para la carga automática en MateCuentas.
  // Devuelve solo lo necesario para anotar cada gasto: id, fecha, descripción, monto, medio y cuotas.
  if (b.accion === "movimientos") {
    const desde = String(b.desde || "")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return NextResponse.json({ error: "desde inválido" }, { status: 400 })
    const me = await mp("/users/me")
    if (!me.ok || !me.j?.id) return NextResponse.json({ error: "mp sin cuenta" }, { status: 502 })
    const out: any[] = []
    const fin = new Date().toISOString()
    for (let offset = 0; offset < 1000; offset += 100) {
      const qs = new URLSearchParams({
        "payer.id": String(me.j.id), range: "date_created", begin_date: `${desde}T00:00:00.000-03:00`, end_date: fin,
        sort: "date_created", criteria: "asc", limit: "100", offset: String(offset),
      })
      const r = await mp(`/v1/payments/search?${qs}`)
      if (!r.ok) return NextResponse.json({ error: r.j?.message || `mp ${r.status}` }, { status: 502 })
      const res: any[] = r.j?.results ?? []
      for (const p of res) {
        if (!["approved", "authorized"].includes(p.status)) continue
        if (p.collector_id && String(p.collector_id) === String(me.j.id)) continue
        out.push({
          id: String(p.id), creado: p.date_created, detalle: String(p.description || p.statement_descriptor || "").slice(0, 120),
          monto: Number(p.transaction_amount) || 0, moneda: p.currency_id, tipo: p.payment_type_id, cuotas: p.installments || 1,
        })
      }
      if (res.length < 100) break
    }
    return NextResponse.json({ movimientos: out })
  }

  return NextResponse.json({ error: "acción desconocida" }, { status: 400 })
}
