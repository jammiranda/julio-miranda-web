import { NextResponse } from "next/server"
import { one } from "@/lib/db"
import { diagnosticoBrevo } from "@/lib/email"
import { asegurarPerfil, estadoPerfil } from "@/lib/waperfil"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Estado del sistema para la revisión semanal automática (sin datos personales). */
export async function GET() {
  const t0 = Date.now()
  try {
    const r = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='cliente'")
    const b = await one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='bot'")
    const em = await one<{ pend: number; err: number; env: number }>("select count(*) filter (where estado='pendiente')::int pend, count(*) filter (where estado='error')::int err, count(*) filter (where estado='enviado')::int env from em_envios").catch(() => null)
    const ultErr = await one<{ error: string }>("select error from em_envios where estado='error' and error is not null order by id desc limit 1").catch(() => null)
    const brevo = await diagnosticoBrevo().catch(() => null)
    // Perfil de WhatsApp: se carga una sola vez por versión (después solo informa el estado)
    await asegurarPerfil().catch(() => null)
    const wa = await estadoPerfil().catch(() => null)
    return NextResponse.json({
      ok: true, db_ms: Date.now() - t0,
      email: { cola: em?.pend ?? null, errores: em?.err ?? null, enviados: em?.env ?? null, ultimo_error: ultErr?.error ?? null, brevo_ok: brevo?.ok ?? null, brevo_problemas: brevo?.problemas ?? [] },
      horas_desde_ultimo_mensaje_cliente: r?.h != null ? Math.round(r.h) : null,
      horas_desde_ultima_respuesta_bot: b?.h != null ? Math.round(b.h) : null,
      whatsapp_configurado: !!(process.env.WA_PHONE_ID || process.env.WA_DB_PHONE_ID) && !!(process.env.WA_TOKEN || process.env.WA_DB_TOKEN),
      whatsapp_perfil: wa ? { perfil: wa.perfil ?? null, foto: wa.foto ?? null, plantillas: wa.plantillas ?? null } : null,
      instagram_configurado: !!(process.env.IG_USER_ID || process.env.IG_DB_USER_ID),
      ia_configurada: !!process.env.ANTHROPIC_API_KEY,
      firma_webhook_configurada: !!process.env.WA_APP_SECRETS,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 })
  }
}
