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

/** Manda una notificación al celular/compu de los usuarios de esos roles que la activaron. */
export async function notificar(roles: string[], titulo: string, cuerpo: string, url = "/") {
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
