import { createHmac, timingSafeEqual } from "crypto"
import type { Empresa } from "./bots/conocimiento"

/** Credenciales por empresa (variables de entorno en Vercel). */
export function cuenta(e: Empresa) {
  const p = e === "sanpatricio" ? "WA_SP" : "WA_DB"
  return { phoneId: process.env[`${p}_PHONE_ID`] ?? "", token: process.env[`${p}_TOKEN`] ?? "" }
}
export function empresaPorPhoneId(id: string): Empresa | null {
  if (id && id === process.env.WA_SP_PHONE_ID) return "sanpatricio"
  if (id && id === process.env.WA_DB_PHONE_ID) return "devisebit"
  return null
}

/** Valida la firma X-Hub-Signature-256 con cualquiera de los app secrets configurados (WA_APP_SECRETS, separados por coma). */
export function firmaValida(cuerpo: string, firma: string | null) {
  const secretos = (process.env.WA_APP_SECRETS ?? "").split(",").map((x) => x.trim()).filter(Boolean)
  if (!secretos.length) return false
  if (!firma?.startsWith("sha256=")) return false
  const recibida = Buffer.from(firma.slice(7), "hex")
  return secretos.some((s) => {
    const h = createHmac("sha256", s).update(cuerpo).digest()
    return h.length === recibida.length && timingSafeEqual(h, recibida)
  })
}

/** Instagram (mensajes directos): cuenta profesional conectada por empresa. */
export function cuentaIG(e: Empresa) {
  const p = e === "sanpatricio" ? "IG_SP" : "IG_DB"
  return { userId: process.env[`${p}_USER_ID`] ?? "", token: process.env[`${p}_TOKEN`] ?? "" }
}
export function empresaPorIG(id: string): Empresa | null {
  if (id && id === process.env.IG_SP_USER_ID) return "sanpatricio"
  if (id && id === process.env.IG_DB_USER_ID) return "devisebit"
  return null
}
export async function perfilIG(e: Empresa, igsid: string) {
  const { token } = cuentaIG(e)
  if (!token) return null
  try {
    const r = await fetch(`https://graph.instagram.com/${process.env.WA_GRAPH_VERSION ?? "v23.0"}/${igsid}?fields=name,username&access_token=${encodeURIComponent(token)}`)
    const j = await r.json()
    return j.name || (j.username ? `@${j.username}` : null)
  } catch { return null }
}
async function enviarIG(e: Empresa, igsid: string, texto: string) {
  const { userId, token } = cuentaIG(e)
  if (!userId || !token) return { ok: false, error: "Instagram no configurado" }
  const r = await fetch(`https://graph.instagram.com/${process.env.WA_GRAPH_VERSION ?? "v23.0"}/${userId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: igsid }, message: { text: texto.slice(0, 1000) } }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok ? { ok: true, id: j?.message_id as string | undefined } : { ok: false, error: j?.error?.message ?? `Error ${r.status}` }
}

/** YCloud (coexistencia con la app WhatsApp Business del celular). */
export function cuentaYC(e: Empresa) {
  const p = e === "sanpatricio" ? "YC_SP" : "YC_DB"
  return { apiKey: process.env[`${p}_API_KEY`] ?? "", from: (process.env[`${p}_FROM`] ?? "").replace(/[^\d+]/g, "") }
}
export function empresaPorYC(to: string): Empresa | null {
  const d = (x: string) => x.replace(/\D/g, "")
  for (const e of ["sanpatricio", "devisebit"] as Empresa[]) { const c = cuentaYC(e); if (c.from && d(c.from) === d(to)) return e }
  return null
}
async function enviarYC(e: Empresa, to: string, texto: string) {
  const { apiKey, from } = cuentaYC(e)
  const r = await fetch("https://api.ycloud.com/v2/whatsapp/messages/sendDirectly", {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from: from.startsWith("+") ? from : "+" + from, to: "+" + to.replace(/\D/g, ""), type: "text", text: { body: texto.slice(0, 4000), previewUrl: true } }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok ? { ok: true, id: (j?.wamid ?? j?.id) as string | undefined } : { ok: false, error: j?.error?.message ?? j?.message ?? `Error ${r.status}` }
}

/** Envía texto por el canal del chat: "ig:<id>" es Instagram; si la empresa usa YCloud, por YCloud; si no, WhatsApp Cloud API. */
export async function enviarTexto(e: Empresa, to: string, texto: string) {
  if (to.startsWith("ig:")) return enviarIG(e, to.slice(3), texto)
  if (cuentaYC(e).apiKey) return enviarYC(e, to, texto)
  const { phoneId, token } = cuenta(e)
  if (!phoneId || !token) return { ok: false, error: "WhatsApp no configurado" }
  const r = await fetch(`https://graph.facebook.com/${process.env.WA_GRAPH_VERSION ?? "v23.0"}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: true, body: texto.slice(0, 4000) } }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok ? { ok: true, id: j?.messages?.[0]?.id as string | undefined } : { ok: false, error: j?.error?.message ?? `Error ${r.status}` }
}

export async function marcarLeido(e: Empresa, messageId: string) {
  if (messageId.startsWith("ig") || messageId.startsWith("yc")) return
  const { phoneId, token } = cuenta(e)
  if (!phoneId || !token) return
  await fetch(`https://graph.facebook.com/${process.env.WA_GRAPH_VERSION ?? "v23.0"}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  }).catch(() => {})
}
