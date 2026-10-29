import { NextResponse } from "next/server"
import { one, q } from "@/lib/db"
import { linkedin } from "@/lib/linkedin"
import { diagnosticoBrevo } from "@/lib/email"
import { asegurarPerfil, estadoPerfil } from "@/lib/waperfil"
import { gcalConfig, probarGcal } from "@/lib/agenda"
import { diagnosticoGoogle } from "@/lib/integraciones"

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
    const gc = await gcalConfig().catch(() => null)
    const equipoCal = await one<{ n: number }>("select count(*)::int n from usuarios where activo and rol in ('gerente','coordinacion') and email is not null and email <> ''").catch(() => null)
    const gcPrueba = gc?.url ? await probarGcal().catch(() => null) : null
    const gdx = gc?.url ? await diagnosticoGoogle().catch(() => null) : null
    const li = await linkedin().catch((e) => ({ ok: false as const, error: String(e) }))
    const iaErr = await one<{ valor: string }>("select valor from config where clave='bot_ia_ultimo_error'").catch(() => null)
    const rech = await q<{ clave: string; valor: string }>("select clave, valor from config where clave like 'webhook_rechazo_%'").catch(() => [] as { clave: string; valor: string }[])
    return NextResponse.json({
      ok: true, db_ms: Date.now() - t0,
      email: { cola: em?.pend ?? null, errores: em?.err ?? null, enviados: em?.env ?? null, ultimo_error: ultErr?.error ?? null, brevo_ok: brevo?.ok ?? null, brevo_problemas: brevo?.problemas ?? [] },
      horas_desde_ultimo_mensaje_cliente: r?.h != null ? Math.round(r.h) : null,
      horas_desde_ultima_respuesta_bot: b?.h != null ? Math.round(b.h) : null,
      whatsapp_configurado: !!(process.env.WA_PHONE_ID || process.env.WA_DB_PHONE_ID) && !!(process.env.WA_TOKEN || process.env.WA_DB_TOKEN),
      whatsapp_perfil: wa ? { perfil: wa.perfil ?? null, foto: wa.foto ?? null, plantillas: wa.plantillas ?? null } : null,
      google_calendar: { equipo_con_email: equipoCal?.n ?? null, url_cargada: !!gc?.url, responde: gcPrueba?.ok ?? null, error: gcPrueba && !gcPrueba.ok ? gcPrueba.error : null, conector: gdx ? (gdx.ok ? { version: gdx.version } : { motivo: gdx.motivo }) : null },
      instagram_configurado: !!(process.env.IG_USER_ID || process.env.IG_DB_USER_ID),
      ia_configurada: !!process.env.ANTHROPIC_API_KEY,
      linkedin_buffer: li.ok ? { ok: true, publicaciones_30d: li.actual.posts, posts_leidos: li.posts.length } : { ok: false, error: li.error },
      ia_modelo_bot: process.env.CLAUDE_MODEL_BOT ?? "claude-haiku-4-5-20251001",
      ia_ultimo_error: iaErr?.valor ?? null,
      firma_webhook_configurada: !!process.env.WA_APP_SECRETS,
      // Diagnóstico sin exponer valores: cuántas claves hay y si cada una tiene el formato de Meta (32 caracteres hexadecimales)
      firma_claves: (process.env.WA_APP_SECRETS ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => ({ largo: x.length, formato_ok: /^[0-9a-f]{32}$/i.test(x) })),
      ultimo_rechazo_por_firma: Object.fromEntries(rech.map((x) => [x.clave.replace("webhook_rechazo_", ""), x.valor])),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 })
  }
}
