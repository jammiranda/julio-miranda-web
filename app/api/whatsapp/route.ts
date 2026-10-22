import { NextResponse, type NextRequest } from "next/server"
import { waitUntil } from "@vercel/functions"
import { empresaPorPhoneId, firmaValida, marcarLeido } from "@/lib/whatsapp"
import { procesar } from "@/lib/bot"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Verificación del webhook (Meta llama con hub.challenge). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") && p.get("hub.verify_token") === process.env.WA_VERIFY_TOKEN) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 })
  }
  return new NextResponse("forbidden", { status: 403 })
}

/** Mensajes entrantes de WhatsApp Cloud API. */
export async function POST(req: NextRequest) {
  const cuerpo = await req.text()
  if (!firmaValida(cuerpo, req.headers.get("x-hub-signature-256"))) return new NextResponse("firma inválida", { status: 401 })
  let j: any
  try { j = JSON.parse(cuerpo) } catch { return new NextResponse("ok") }
  const tareas: Promise<unknown>[] = []
  for (const entry of j.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value ?? {}
    const e = empresaPorPhoneId(v.metadata?.phone_number_id)
    if (!e) continue
    const perfiles: Record<string, string> = Object.fromEntries((v.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]))
    for (const m of v.messages ?? []) {
      const texto = m.type === "text" ? m.text?.body : m.type === "button" ? m.button?.text : m.type === "interactive" ? (m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title) : (m[m.type]?.caption ?? null)
      tareas.push(marcarLeido(e, m.id))
      tareas.push(procesar(e, m.from, perfiles[m.from] ?? null, texto ?? null, m.type === "interactive" || m.type === "button" ? "text" : m.type, m.id).catch((err) => console.error("bot", err)))
    }
  }
  waitUntil(Promise.all(tareas))
  return new NextResponse("ok")
}
