import { NextResponse, type NextRequest } from "next/server"
import { chatVinculado, responder, secretoOk, vincularChat } from "@/lib/telegram"

export const dynamic = "force-dynamic"

/**
 * Webhook del bot de Telegram. Telegram manda el secreto en x-telegram-bot-api-secret-token (se fija al conectar el bot en Agenda y avisos).
 * El bot solo manda avisos; lo único que entiende es /start y /vincular CÓDIGO (el código lo genera Julio en el sistema y vence en 15 minutos).
 */
export async function POST(req: NextRequest) {
  if (!(await secretoOk(req.headers.get("x-telegram-bot-api-secret-token")))) return NextResponse.json({ ok: false }, { status: 401 })
  const u: any = await req.json().catch(() => null)
  const m = u?.message
  const chat = m?.chat?.id
  const texto = String(m?.text ?? "").trim()
  if (!chat || !texto) return NextResponse.json({ ok: true })
  const privado = m.chat.type === "private"

  if (/^\/vincular(@\w+)?\s+\S+/i.test(texto)) {
    if (!privado) { await responder(chat, "Por seguridad, vinculá el bot desde un chat privado conmigo."); return NextResponse.json({ ok: true }) }
    const ok = await vincularChat(texto.split(/\s+/)[1], chat)
    await responder(chat, ok ? "✅ Listo. Desde ahora te llegan acá los avisos de DEVISEBIT: consultas, WhatsApp, correos, tareas y Oficina." : "El código no es válido o ya venció. Generá uno nuevo en el sistema: Agenda y avisos → Telegram.")
    return NextResponse.json({ ok: true })
  }
  if (/^\/(start|ayuda|help)(@\w+)?$/i.test(texto)) {
    await responder(chat, (await chatVinculado(chat)) ? "Este chat ya recibe los avisos de DEVISEBIT. Por acá solo mando avisos; para responder o decidir abrí el link de cada uno." : "Hola, soy el bot de avisos de DEVISEBIT. Para vincular este chat, generá un código en el sistema (Agenda y avisos → Telegram) y mandame: /vincular CÓDIGO")
    return NextResponse.json({ ok: true })
  }
  if (await chatVinculado(chat)) await responder(chat, "Por acá solo mando avisos. Para responder abrí el link de cada aviso.")
  return NextResponse.json({ ok: true })
}
