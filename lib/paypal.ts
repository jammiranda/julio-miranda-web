/**
 * PayPal Checkout (pagos desde el exterior, en dólares).
 * Claves que carga Julio en Vercel: PAYPAL_CLIENT_ID y PAYPAL_SECRET (de developer.paypal.com → Apps & Credentials, modo Live).
 * PAYPAL_ENV=sandbox para pruebas; sin esa variable usa la cuenta real.
 */
const BASE = () => (process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com")
export const paypalConfigurado = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET)

async function token() {
  const r = await fetch(`${BASE()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.access_token) throw new Error(`PayPal token ${r.status}`)
  return j.access_token as string
}

export async function crearOrdenPayPal(o: { orden: number; titulo: string; usd: number; token: string; volver: string; cancelar: string }) {
  try {
    const t = await token()
    const r = await fetch(`${BASE()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", "PayPal-Request-Id": `am-${o.orden}-${o.token.slice(0, 8)}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ reference_id: String(o.orden), custom_id: String(o.orden), description: o.titulo.slice(0, 120), amount: { currency_code: "USD", value: o.usd.toFixed(2) } }],
        application_context: { brand_name: "ACADEMIA DEVISEBIT", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", locale: "es-AR", return_url: o.volver, cancel_url: o.cancelar },
      }),
      cache: "no-store",
    })
    const j = await r.json().catch(() => ({}))
    const url = (j.links ?? []).find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href
    return r.ok && url ? { ok: true as const, id: j.id as string, url: url as string } : { ok: false as const, error: j.message ?? `Error ${r.status}` }
  } catch (e) {
    return { ok: false as const, error: String(e) }
  }
}

/** Cobra la orden aprobada por el comprador. Devuelve el id de la captura si quedó completa y coincide con la orden y el monto. */
export async function capturarPayPal(id: string, orden: number, usd: number) {
  const t = await token()
  const r = await fetch(`${BASE()}/v2/checkout/orders/${encodeURIComponent(id)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, cache: "no-store" })
  let j: any = await r.json().catch(() => ({}))
  // Si ya estaba capturada (recarga de la página), se consulta el estado.
  if (!r.ok && j?.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED") {
    const g = await fetch(`${BASE()}/v2/checkout/orders/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" })
    j = await g.json().catch(() => ({}))
  }
  const pu = j?.purchase_units?.[0]
  const cap = pu?.payments?.captures?.[0]
  const ok = j?.status === "COMPLETED" && cap?.status === "COMPLETED" && String(pu?.custom_id ?? pu?.reference_id) === String(orden)
    && cap?.amount?.currency_code === "USD" && Math.abs(Number(cap?.amount?.value) - usd) < 0.01
  return ok ? (cap.id as string) : null
}
