import { NextResponse, type NextRequest } from "next/server"
import { chatVinculado, hiloDe, responder, secretoOk, vincularChat } from "@/lib/telegram"
import { responderDesdeCRM } from "@/lib/bot"
import { q } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Webhook del bot de Telegram. Telegram manda el secreto en x-telegram-bot-api-secret-token (se fija al conectar el bot en Agenda y avisos).
 * El bot manda avisos y entiende /start, /vincular CÓDIGO y las respuestas a un aviso de conversación (le escriben a la persona)
 * (antes: solo /start y /vincular CÓDIGO (el código lo genera Julio en el sistema y vence en 15 minutos).
 */
export async function POST(req: NextRequest) {
  if (!(await secretoOk(req.headers.get("x-telegram-bot-api-secret-token")))) return NextResponse.json({ ok: false }, { status: 401 })
  const u: any = await req.json().catch(() => null)
  const m = u?.message
  const chat = m?.chat?.id
  const texto = String(m?.text ?? "").trim()
  if (!chat || !texto) return NextResponse.json({ ok: true })
  const privado = m.chat.type === "private"

  // Respuesta a un aviso de conversación: el texto le llega a la persona (chat web) y el bot queda en pausa. /bit devuelve la charla a Bit.
  const rep = Number(m?.reply_to_message?.message_id)
  if (rep && (await chatVinculado(chat))) {
    const waId = await hiloDe(chat, rep)
    if (waId) {
      if (/^\/(bit|bot)(@\w+)?$/i.test(texto)) {
        await q("update wa_chats set bot_pausado_hasta=null, pausa_motivo=null where empresa='devisebit' and wa_id=$1", [waId])
        await responder(chat, "🤖 Listo: Bit retoma esa conversación.")
      } else {
        const r = await responderDesdeCRM("devisebit", waId, texto.slice(0, 3000), String(m?.from?.first_name ?? "Julio").slice(0, 40)).catch((e) => ({ ok: false, error: String(e).slice(0, 120) }))
        await responder(chat, r.ok ? "✅ Enviado. Bit queda en pausa en esa conversación; cuando la persona conteste te llega acá." : `⚠️ No se pudo enviar: ${(r as any).error ?? "error"}. Abrí la conversación en el sistema.`)
      }
      return NextResponse.json({ ok: true })
    }
  }

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
  if (await chatVinculado(chat)) await responder(chat, "Para contestarle a una persona, respondé al aviso de su conversación (deslizá el mensaje y escribí). El resto de los avisos se abren con su link.")
  return NextResponse.json({ ok: true })
}
