import { NextResponse, type NextRequest } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { waitUntil } from "@vercel/functions"
import { empresaPorYC } from "@/lib/whatsapp"
import { procesar, ecoDelEquipo } from "@/lib/bot"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Firma YCloud-Signature: t=TIMESTAMP,s=HMAC_SHA256(secret, `${t}.${cuerpo}`) en hex. */
function firmaOk(cuerpo: string, h: string | null) {
  const secretos = (process.env.YC_WEBHOOK_SECRETS ?? "").split(",").map((x) => x.trim()).filter(Boolean)
  if (!secretos.length || !h) return false
  const p = Object.fromEntries(h.split(",").map((x) => x.split("=").map((y) => y.trim())))
  if (!p.t || !p.s || Math.abs(Date.now() / 1000 - Number(p.t)) > 600) return false
  const rec = Buffer.from(p.s, "hex")
  return secretos.some((sec) => { const c = createHmac("sha256", sec).update(`${p.t}.${cuerpo}`).digest(); return c.length === rec.length && timingSafeEqual(c, rec) })
}

export async function POST(req: NextRequest) {
  const cuerpo = await req.text()
  if (!firmaOk(cuerpo, req.headers.get("ycloud-signature"))) return new NextResponse("firma inválida", { status: 401 })
  let j: any
  try { j = JSON.parse(cuerpo) } catch { return new NextResponse("ok") }
  if (j.type === "whatsapp.inbound_message.received") {
    const m = j.whatsappInboundMessage ?? {}
    const e = empresaPorYC(String(m.to ?? ""))
    if (e) {
      const texto = m.type === "text" ? m.text?.body : m.type === "button" ? m.button?.text : m.type === "interactive" ? (m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title) : (m[m.type]?.caption ?? null)
      waitUntil(procesar(e, String(m.from).replace(/\D/g, ""), m.customerProfile?.name ?? null, texto ?? null, ["interactive", "button"].includes(m.type) ? "text" : m.type, `yc_${m.wamid ?? m.id}`).catch((err) => console.error("bot yc", err)))
    }
  } else if (j.type === "whatsapp.smb.message.echoes") {
    // Lo que el equipo responde desde la app del celular: se guarda en el CRM y el bot se corre
    const m = j.whatsappMessage ?? {}
    const e = empresaPorYC(String(m.from ?? ""))
    if (e) waitUntil(ecoDelEquipo(e, String(m.to).replace(/\D/g, ""), m.type === "text" ? m.text?.body ?? null : `(${m.type})`, `yc_${m.wamid ?? m.id}`).catch((err) => console.error("eco yc", err)))
  }
  return new NextResponse("ok")
}
