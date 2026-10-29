import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"

/**
 * Webhook de Brevo (envíos transaccionales): entregas, rebotes, spam y bajas.
 * Se configura en Brevo → Transaccional → Configuración → Webhooks con la URL
 * https://sistema.devisebit.com/api/e/brevo?k=<BREVO_WEBHOOK_KEY>
 * Un rebote duro o una queja de spam sacan al contacto de los próximos envíos.
 */
export async function POST(req: NextRequest) {
  const clave = process.env.BREVO_WEBHOOK_KEY
  if (!clave || req.nextUrl.searchParams.get("k") !== clave) return NextResponse.json({ ok: false }, { status: 401 })
  const body = await req.json().catch(() => null)
  const eventos: any[] = Array.isArray(body) ? body : body ? [body] : []
  for (const ev of eventos) {
    const tipo = String(ev.event ?? "").toLowerCase()
    const email = String(ev.email ?? "").toLowerCase()
    const mid = String(ev["message-id"] ?? ev.messageId ?? "")
    if (!email) continue
    const donde = mid ? "proveedor_id=$1" : "lower(email)=$1 and estado='enviado'"
    const arg = mid || email
    if (tipo === "delivered") await q(`update em_envios set entregado_en=coalesce(entregado_en, now()) where ${donde}`, [arg]).catch(() => {})
    else if (["hard_bounce", "invalid_email", "blocked", "soft_bounce", "spam", "complaint", "unsubscribed"].includes(tipo)) {
      await q(`update em_envios set rebote=$2, baja=(baja or $2 in ('spam','complaint','unsubscribed')) where ${donde}`, [arg, tipo]).catch(() => {})
      if (["hard_bounce", "invalid_email", "blocked"].includes(tipo)) await q("update db_contactos set email_estado='rebotado' where lower(email)=$1 and email_estado='activo'", [email]).catch(() => {})
      if (["spam", "complaint", "unsubscribed"].includes(tipo)) await q("update db_contactos set email_estado='baja', baja_en=now() where lower(email)=$1 and email_estado='activo'", [email]).catch(() => {})
    }
    await q("insert into em_log(tipo,email) values ($1,$2)", ["brevo_" + tipo, email]).catch(() => {})
  }
  return NextResponse.json({ ok: true, n: eventos.length })
}
