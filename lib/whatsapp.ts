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

export async function enviarTexto(e: Empresa, to: string, texto: string) {
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
  const { phoneId, token } = cuenta(e)
  if (!phoneId || !token) return
  await fetch(`https://graph.facebook.com/${process.env.WA_GRAPH_VERSION ?? "v23.0"}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  }).catch(() => {})
}
