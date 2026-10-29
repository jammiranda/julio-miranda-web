import { q, one } from "./db"
import { BORRAR_EMAILS } from "./email"

/**
 * Depuración de la base (pedido de Julio, 29/10/2026): que las campañas dejen la base "verdadera",
 * aunque sea chica, con correos que existen y gente que responde.
 *  1. Borrados a pedido: se eliminan; si un contacto tiene historia (proyectos, cobros) queda en Descartados.
 *  2. Rebotes, bajas y spam que Brevo ya bloqueó: el contacto queda rebotado o dado de baja (sin necesitar webhook).
 *  3. Sin respuesta: quien recibió 3 envíos o más y nunca abrió ni hizo clic puede pasarse a Descartados (botón, no automático).
 */

export async function aplicarBorrados() {
  let borrados = 0, descartados = 0
  await q("update em_envios set estado='omitido', error='Borrado de la base' where estado='pendiente' and lower(email) = any($1)", [BORRAR_EMAILS]).catch(() => {})
  const ids = await q<{ id: number }>("select id from db_contactos where lower(email) = any($1)", [BORRAR_EMAILS]).catch(() => [])
  for (const { id } of ids) {
    try {
      await q("update em_envios set contacto_id=null where contacto_id=$1", [id])
      await q("delete from db_contactos where id=$1", [id])
      borrados++
    } catch {
      await q("update db_contactos set clase='descartado', email_estado='baja', baja_en=coalesce(baja_en, now()), clasificado_en=now(), clasificado_por='Borrado a pedido (tiene historia)', tags=array(select distinct unnest(tags || '{borrar}'::text[])) where id=$1", [id]).catch(() => {})
      descartados++
    }
  }
  return { borrados, descartados }
}

const MOTIVO: Record<string, "rebotado" | "baja"> = { hardBounce: "rebotado", adminBlocked: "rebotado", contactFlaggedAsSpam: "baja", unsubscribedViaEmail: "baja", unsubscribedViaApi: "baja", unsubscribedViaMA: "baja" }

/** Trae de Brevo los contactos bloqueados (rebote duro, spam, baja) y los marca en la base. */
export async function sincronizarBloqueadosBrevo() {
  const key = process.env.BREVO_API_KEY
  if (!key) return { marcados: 0, motivo: "sin Brevo" }
  let marcados = 0, offset = 0
  for (let pagina = 0; pagina < 20; pagina++) {
    const r = await fetch(`https://api.brevo.com/v3/smtp/blockedContacts?limit=100&offset=${offset}&sort=desc`, { headers: { "api-key": key, accept: "application/json" }, cache: "no-store" }).catch(() => null)
    if (!r?.ok) break
    const j = await r.json().catch(() => ({}))
    const lista = (j.contacts ?? []) as { email: string; reason?: { code?: string } }[]
    for (const c of lista) {
      const estado = MOTIVO[c.reason?.code ?? ""] ?? null
      if (!estado || !c.email) continue
      const x = await q("update db_contactos set email_estado=$2, baja_en=case when $2='baja' then coalesce(baja_en, now()) else baja_en end where lower(email)=lower($1) and email_estado='activo' returning id", [c.email, estado]).catch(() => [])
      await q(`update em_envios set rebote=coalesce(rebote, $2) where lower(email)=lower($1) and estado='enviado'`, [c.email, c.reason?.code === "hardBounce" ? "hard_bounce" : c.reason?.code === "contactFlaggedAsSpam" ? "spam" : c.reason?.code === "adminBlocked" ? "blocked" : "unsubscribed"]).catch(() => {})
      await q("update em_envios set estado='omitido', error='Bloqueado por Brevo' where lower(email)=lower($1) and estado='pendiente'", [c.email]).catch(() => {})
      marcados += x.length
    }
    if (lista.length < 100) break
    offset += 100
  }
  return { marcados }
}

const SIN_RESPUESTA = `select c.id from db_contactos c join em_envios e on e.contacto_id=c.id and e.estado='enviado'
  where c.email_estado='activo' and coalesce(c.clase,'') not in ('descartado','cliente')
  group by c.id having count(*) >= $1 and max(e.abierto_en) is null and max(e.clic_en) is null and max(e.enviado_en) < now() - interval '7 days'`

export async function contarSinRespuesta(envios = 3) {
  return (await one<{ n: number }>(`select count(*)::int n from (${SIN_RESPUESTA}) x`, [envios]).catch(() => null))?.n ?? 0
}

/** Pasa a Descartados a quien no respondió nunca (los clientes nunca se tocan). */
export async function depurarSinRespuesta(envios = 3, por = "Depuración") {
  const r = await q(`update db_contactos c set clase='descartado', clasificado_en=now(), clasificado_por=$2, tags=array(select distinct unnest(c.tags || '{sin-respuesta}'::text[])) where c.id in (${SIN_RESPUESTA}) returning c.id`, [envios, por])
  return r.length
}

/** Corre lo automático (borrados y bloqueados de Brevo). */
export async function depurarBase() {
  const b = await aplicarBorrados().catch(() => ({ borrados: 0, descartados: 0 }))
  const s = await sincronizarBloqueadosBrevo().catch(() => ({ marcados: 0 }))
  return { ...b, ...s }
}
