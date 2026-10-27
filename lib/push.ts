import webpush from "web-push"
import { q, one } from "./db"

/** Claves VAPID propias del sistema: se generan solas la primera vez y quedan en la base. */
async function vapid() {
  let pub = (await one<{ valor: string }>("select valor from config where clave='vapid_public'"))?.valor
  let priv = (await one<{ valor: string }>("select valor from config where clave='vapid_private'"))?.valor
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys()
    await q("insert into config(clave,valor) values ('vapid_public',$1),('vapid_private',$2) on conflict (clave) do nothing", [k.publicKey, k.privateKey])
    pub = (await one<{ valor: string }>("select valor from config where clave='vapid_public'"))!.valor
    priv = (await one<{ valor: string }>("select valor from config where clave='vapid_private'"))!.valor
  }
  return { pub, priv }
}
export async function clavePublica() { return (await vapid()).pub }

/** Manda una notificación al celular/compu de los usuarios de esos roles que la activaron, y también por email. */
export async function notificar(roles: string[], titulo: string, cuerpo: string, url = "/") {
  await porEmail(roles, titulo, cuerpo, url).catch((e) => console.error("aviso email", e))
  try {
    const { pub, priv } = await vapid()
    webpush.setVapidDetails("mailto:info@devisebit.com", pub, priv)
    const subs = await q<{ id: number; endpoint: string; p256dh: string; auth: string }>(
      "select s.id, s.endpoint, s.p256dh, s.auth from push_subs s join usuarios u on u.id=s.usuario_id where u.activo and u.rol = any($1)",
      [roles],
    )
    const payload = JSON.stringify({ titulo, cuerpo: cuerpo.slice(0, 180), url })
    await Promise.all(subs.map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 }) }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await q("delete from push_subs where id=$1", [s.id]) }
    }))
  } catch (e) { console.error("push", e) }
}

/**
 * Copia de cada aviso por email (Brevo) a los usuarios de esos roles que tengan email cargado y no lo hayan desactivado.
 * No repite el mismo aviso de la misma conversación durante 30 minutos.
 */
async function porEmail(roles: string[], titulo: string, cuerpo: string, url: string) {
  if (!process.env.BREVO_API_KEY) return
  const off = await one<{ valor: string }>("select valor from config where clave='avisos_email'").catch(() => null)
  if (off?.valor === "no") return
  const clave = `${url}|${titulo.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 60)}`
  const ya = await q<{ clave: string }>("insert into avisos_email(clave) values ($1) on conflict (clave) do update set enviado=now() where avisos_email.enviado < now() - interval '30 minutes' returning clave", [clave])
  if (!ya.length) return
  const users = await q<{ email: string; nombre: string }>("select email, nombre from usuarios where activo and rol = any($1) and email is not null and email <> ''", [roles])
  if (!users.length) return
  const { enviarBrevo } = await import("./email")
  const base = process.env.SISTEMA_URL ?? "https://sistema.devisebit.com"
  const link = url.startsWith("http") ? url : base + url
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const html = `<!doctype html><html><body style="margin:0;background:#F5F6F8;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0E1116;padding:16px 22px;color:#fff;font-weight:800;letter-spacing:.04em">DEVISE<span style="color:#FF6A63">BIT</span> · Sistema</td></tr>
<tr><td style="padding:22px"><p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0E1116">${esc(titulo)}</p><p style="margin:0 0 18px;font-size:15px;color:#262C37;line-height:1.5">${esc(cuerpo)}</p>
<a href="${link}" style="display:inline-block;background:#C8231F;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px">Abrir en el sistema</a></td></tr>
<tr><td style="padding:14px 22px;border-top:1px solid #EEF0F3;font-size:12px;color:#4A515C">Aviso automático del sistema comercial de DEVISEBIT. Se desactiva en Sistema → Agenda y avisos.</td></tr>
</table></td></tr></table></body></html>`
  for (const u of users) await enviarBrevo({ email: u.email, name: u.nombre }, `🔔 ${titulo.replace(/^[^\p{L}\p{N}]+/u, "")}`, html)
}
