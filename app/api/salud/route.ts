import { NextResponse } from "next/server"
import { one } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Estado del sistema para la revisión semanal automática (sin datos personales). */
export async function GET() {
  const t0 = Date.now()
  try {
    const r = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='cliente'")
    const b = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='bot'")
    return NextResponse.json({
      ok: true, db_ms: Date.now() - t0,
      horas_desde_ultimo_mensaje_cliente: r?.h != null ? Math.round(r.h) : null,
      horas_desde_ultima_respuesta_bot: b?.h != null ? Math.round(b.h) : null,
      whatsapp_configurado: !!(process.env.WA_PHONE_ID || process.env.WA_DB_PHONE_ID) && !!(process.env.WA_TOKEN || process.env.WA_DB_TOKEN),
      instagram_configurado: !!(process.env.IG_USER_ID || process.env.IG_DB_USER_ID),
      ia_configurada: !!process.env.ANTHROPIC_API_KEY,
      firma_webhook_configurada: !!process.env.WA_APP_SECRETS,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 })
  }
}
