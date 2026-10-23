import { NextResponse } from "next/server"
import { one } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Estado del sistema para la revisión semanal automática (sin datos personales). */
export async function GET() {
  const t0 = Date.now()
  try {
    const r = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='cliente' and empresa='sanpatricio'")
    const b = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='bot' and empresa='sanpatricio'")
    return NextResponse.json({
      ok: true, db_ms: Date.now() - t0,
      horas_desde_ultimo_mensaje_cliente: r?.h != null ? Math.round(r.h) : null,
      horas_desde_ultima_respuesta_bot: b?.h != null ? Math.round(b.h) : null,
      whatsapp_configurado: !!(process.env.WA_SP_PHONE_ID || process.env.YC_SP_API_KEY) && !!(process.env.WA_SP_TOKEN || process.env.YC_SP_API_KEY),
      instagram_configurado: !!(process.env.IG_SP_USER_ID),
      ia_configurada: !!process.env.ANTHROPIC_API_KEY,
      firma_webhook_configurada: !!process.env.WA_APP_SECRETS,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 })
  }
}
