import { NextResponse } from "next/server"
import { usuarioActual } from "@/lib/auth"
export const dynamic = "force-dynamic"

/** Diagnóstico temporal (solo gerencia): qué fuentes de movimientos de Mercado Pago responde la cuenta. */
const API = "https://api.mercadopago.com"
async function mp(ruta: string, init?: RequestInit) {
  const r = await fetch(`${API}${ruta}`, { ...init, headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15000) })
  const t = await r.text()
  let j: any = null; try { j = JSON.parse(t) } catch { j = t.slice(0, 1500) }
  return { status: r.status, j }
}
export async function GET() {
  const u = await usuarioActual()
  if (u?.rol !== "gerente") return NextResponse.json({ error: "no" }, { status: 401 })
  const me = await mp("/users/me")
  const id = me.j?.id
  const pay = await mp(`/v1/payments/search?payer.id=${id}&sort=date_created&criteria=desc&limit=8`)
  const mov = await mp(`/mercadopago_account/movements/search?limit=8&sort=date_created&criteria=desc`)
  const rel = await mp(`/v1/account/release_report/list`)
  const set = await mp(`/v1/account/settlement_report/list`)
  const corta = (x: any) => Array.isArray(x) ? x.slice(0, 4) : x
  return NextResponse.json({
    me: { status: me.status, id, nickname: me.j?.nickname, site: me.j?.site_id },
    pagosComoPagador: { status: pay.status, total: pay.j?.paging?.total, muestra: (pay.j?.results ?? []).map((p: any) => ({ id: p.id, fecha: p.date_created, desc: p.description, monto: p.transaction_amount, estado: p.status, tipo: p.payment_type_id, op: p.operation_type, collector: p.collector_id })), error: pay.status >= 400 ? pay.j : undefined },
    movimientos: { status: mov.status, total: mov.j?.paging?.total, muestra: corta(mov.j?.results ?? mov.j) },
    releaseList: { status: rel.status, muestra: corta(rel.j) },
    settlementList: { status: set.status, muestra: corta(set.j) },
  })
}
