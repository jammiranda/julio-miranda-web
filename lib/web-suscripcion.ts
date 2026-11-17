import { q, one, audit } from "./db"
import { notificar } from "./push"
import { primeraVez } from "./telegram"
import { aHtml, plantilla, enviarBrevo } from "./email"

/**
 * Web por Suscripción (tuweb.devisebit.com): seguimiento de las suscripciones de Mercado Pago.
 *
 * Mercado Pago avisa a /api/academia/mp cada vez que una suscripción cambia
 * (tipo subscription_preapproval) o se intenta un cobro mensual
 * (tipo subscription_authorized_payment). Nunca se confía en el cuerpo del aviso:
 * se consulta el dato a la API con MP_ACCESS_TOKEN y recién ahí se registra.
 *
 * Qué hace:
 *  - Alta: guarda la suscripción, crea el contacto en el CRM si no existe y avisa.
 *  - Cancelación o pausa: actualiza el estado y avisa en el momento.
 *  - Cobro rechazado: lo anota y avisa.
 */

const API = "https://api.mercadopago.com"
/** Código de referencia cargado en el plan de Mercado Pago. */
export const REFERENCIA = "web-suscripcion"
const NOMBRE_PLAN = "web por suscripci"

const mp = async (ruta: string) => {
  const r = await fetch(`${API}${ruta}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }, cache: "no-store", signal: AbortSignal.timeout(10000) })
  return r.ok ? ((await r.json()) as any) : null
}

const esDeEstePlan = (p: any) =>
  String(p?.external_reference ?? "") === REFERENCIA || String(p?.reason ?? "").toLowerCase().includes(NOMBRE_PLAN)

const plata = (n: unknown) => `$${Number(n ?? 0).toLocaleString("es-AR")}`

const ESTADOS: Record<string, string> = {
  authorized: "activa",
  paused: "pausada",
  cancelled: "cancelada",
  pending: "pendiente",
}

async function contactoPara(email: string | null) {
  if (!email) return null
  const ya = await one<{ id: number }>("select id from db_contactos where lower(email)=lower($1) order by id limit 1", [email])
  if (ya) return ya.id
  const n = await one<{ id: number }>(
    "insert into db_contactos(nombre, email, etapa, origen, notas) values ($1,$2,'ganado','web-suscripcion','Alta por suscripción de Mercado Pago (Web por Suscripción).') returning id",
    [email.split("@")[0], email],
  )
  return n?.id ?? null
}

/** Correo de bienvenida al que se acaba de suscribir: qué datos mandar y por dónde. */
async function bienvenida(email: string) {
  const wa = "https://wa.me/5491173466490?text=" + encodeURIComponent("Hola, ya me suscribí a Web por Suscripción. Les paso los datos de mi negocio: ")
  const md = `# ¡Ya arrancamos con tu web!

Recibimos tu suscripción a **Web por Suscripción DEVISEBIT**. En 48 horas desde que tengamos tus datos, tu web está publicada.

Para armarla necesitamos que nos mandes por WhatsApp:

- Nombre del negocio, rubro y ciudad
- Qué modelo elegiste (los ves en tuweb.devisebit.com)
- Servicios o productos, con precios si querés mostrarlos
- Horarios, dirección y teléfono o WhatsApp de contacto
- Fotos y logo, si tenés (si no, arrancamos con fotos de tu rubro)

[[Mandar los datos por WhatsApp|${wa}]]

Si preferís, respondé este correo con los datos. Cualquier duda, estamos en el 11 7346-6490.`
  return enviarBrevo({ email }, "Tu web ya está en marcha: mandanos los datos de tu negocio", plantilla(aHtml(md), { preheader: "Qué necesitamos para publicar tu web en 48 horas" }))
}

/** Aviso de alta, cambio o cancelación de una suscripción. */
export async function avisoSuscripcion(id: string) {
  const p = await mp(`/preapproval/${encodeURIComponent(id)}`)
  if (!p || !esDeEstePlan(p)) return { ok: true, propia: false }
  const estado = ESTADOS[String(p.status)] ?? String(p.status)
  const email = p.payer_email ? String(p.payer_email) : null
  const antes = await one<{ estado: string }>("select estado from web_suscripciones where mp_id=$1", [String(p.id)])
  const contactoId = antes ? null : await contactoPara(email).catch(() => null)
  await q(
    `insert into web_suscripciones(mp_id, plan_id, referencia, email, pagador_id, concepto, monto, estado, proximo_cobro, alta, contacto_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (mp_id) do update set estado=excluded.estado, proximo_cobro=excluded.proximo_cobro, email=coalesce(excluded.email, web_suscripciones.email), monto=excluded.monto, actualizado=now()`,
    [String(p.id), p.preapproval_plan_id ?? null, p.external_reference ?? null, email, p.payer_id ? String(p.payer_id) : null, p.reason ?? null,
     p.auto_recurring?.transaction_amount ?? null, estado, p.next_payment_date ?? null, p.date_created ?? null, contactoId],
  )
  if (antes?.estado === estado) return { ok: true, propia: true, cambio: false }
  await audit({ id: 0, usuario: "Mercado Pago" }, "web_suscripcion_" + estado, "web_suscripcion", String(p.id), `${email ?? "sin email"} · ${plata(p.auto_recurring?.transaction_amount)}`)
  const quien = email ?? "Cliente sin email"
  const monto = plata(p.auto_recurring?.transaction_amount)
  if (!antes && estado === "activa" && email) await bienvenida(email).catch((e) => console.error("bienvenida web", e))
  if (!antes && estado === "activa")
    await notificar(["gerente", "coordinacion"], "🟢 Nueva suscripción de web", `${quien} se suscribió a Web por Suscripción (${monto} por mes). Ya se le mandó el correo pidiendo los datos. Falta armar el sitio.`, "/crm").catch(() => {})
  else if (estado === "cancelada")
    await notificar(["gerente", "coordinacion"], "🔴 Canceló una suscripción de web", `${quien} canceló su Web por Suscripción (${monto} por mes). Revisar si corresponde dar de baja el sitio.`, "/crm").catch(() => {})
  else if (estado === "pausada")
    await notificar(["gerente", "coordinacion"], "🟠 Suscripción de web en pausa", `${quien} tiene la suscripción en pausa: Mercado Pago no le está cobrando.`, "/crm").catch(() => {})
  else if (estado === "activa")
    await notificar(["gerente", "coordinacion"], "🟢 Suscripción de web reactivada", `${quien} volvió a tener activa su Web por Suscripción.`, "/crm").catch(() => {})
  return { ok: true, propia: true, cambio: true, estado }
}

/** Aviso de un cobro mensual: se anota y, si fue rechazado, se avisa una vez por día. */
export async function avisoCobroSuscripcion(id: string) {
  const c = await mp(`/authorized_payments/${encodeURIComponent(id)}`)
  if (!c?.preapproval_id) return { ok: true, propia: false }
  const s = await one<{ mp_id: string; email: string | null }>("select mp_id, email from web_suscripciones where mp_id=$1", [String(c.preapproval_id)])
  if (!s) {
    // Puede llegar el cobro antes que el alta: se registra la suscripción y se sigue
    const r = await avisoSuscripcion(String(c.preapproval_id))
    if (!r.propia) return { ok: true, propia: false }
  }
  const pago = String(c.payment?.status ?? c.status ?? "")
  await q("update web_suscripciones set ultimo_pago_estado=$1, ultimo_pago_en=now(), actualizado=now() where mp_id=$2", [pago, String(c.preapproval_id)])
  const rechazado = pago === "rejected" || String(c.status) === "recycling"
  if (rechazado && (await primeraVez(`web-susc-rechazo:${c.preapproval_id}`, 1440)))
    await notificar(["gerente", "coordinacion"], "⚠️ Cobro rechazado de una web", `${s?.email ?? "Un cliente"}: Mercado Pago no pudo cobrar la cuota de ${plata(c.transaction_amount)}. Va a reintentar; si no se regulariza en 15 días, corresponde suspender el sitio.`, "/crm").catch(() => {})
  return { ok: true, propia: true, pago }
}

/**
 * Chequeo sin datos sensibles: dice si el token del sistema ve el plan de
 * Web por Suscripción (o sea, si es de la misma cuenta de Mercado Pago) y
 * cuántas suscripciones hay registradas.
 */
export async function estadoSuscripciones() {
  if (!process.env.MP_ACCESS_TOKEN) return { token: false, plan: false, registradas: 0 }
  const b = await mp(`/preapproval_plan/search?limit=50`)
  const plan = !!(b?.results ?? []).find((x: any) => esDeEstePlan(x))
  const n = await one<{ n: string }>("select count(*)::text n from web_suscripciones").catch(() => null)
  const activas = await one<{ n: string }>("select count(*)::text n from web_suscripciones where estado='activa'").catch(() => null)
  return { token: true, consulta: !!b, plan, registradas: Number(n?.n ?? 0), activas: Number(activas?.n ?? 0) }
}

/**
 * Respaldo del aviso: le pregunta a Mercado Pago por las últimas suscripciones y
 * registra las que el sistema todavía no tiene o cambiaron de estado. Lo llaman la
 * página de "gracias" al terminar la compra y el cron diario.
 */
export async function sincronizarSuscripciones() {
  if (!process.env.MP_ACCESS_TOKEN) return { ok: false, vistas: 0, cambios: 0 }
  const b = await mp(`/preapproval/search?limit=50&sort=date_created:desc`)
  const propias = ((b?.results ?? []) as any[]).filter(esDeEstePlan)
  let cambios = 0
  for (const p of propias) {
    const ya = await one<{ estado: string }>("select estado from web_suscripciones where mp_id=$1", [String(p.id)])
    if (ya && ya.estado === (ESTADOS[String(p.status)] ?? String(p.status))) continue
    const r = await avisoSuscripcion(String(p.id)).catch(() => null)
    if (r && (r as any).cambio !== false) cambios++
  }
  return { ok: !!b, vistas: propias.length, cambios }
}
