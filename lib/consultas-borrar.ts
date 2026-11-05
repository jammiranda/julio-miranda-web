import { q } from "./db"

/**
 * Elimina consultas (conversaciones) con todo lo que cuelga de ellas: chat y mensajes de WhatsApp/Instagram,
 * reuniones agendadas y el enlace desde el contacto del CRM (el contacto queda, sin consulta asociada).
 * Pensado para limpiar pruebas. Devuelve cuántas consultas se eliminaron.
 */
export async function borrarConsultas(ids: number[]): Promise<number> {
  ids = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))]
  if (!ids.length) return 0
  // Chats vinculados a esas consultas, o con el mismo chat_id mientras no lo use otra consulta que queda.
  const chats = await q<{ empresa: string; wa_id: string }>(
    `select empresa, wa_id from wa_chats w
      where consulta_id = any($1::int[])
         or exists (select 1 from consultas c where c.id = any($1::int[]) and c.empresa = w.empresa and c.chat_id = w.wa_id
                    and not exists (select 1 from consultas o where o.empresa = c.empresa and o.chat_id = c.chat_id and o.id <> all($1::int[])))`,
    [ids],
  )
  for (const c of chats) {
    await q("delete from wa_mensajes where empresa=$1 and wa_id=$2", [c.empresa, c.wa_id])
    await q("delete from wa_chats where empresa=$1 and wa_id=$2", [c.empresa, c.wa_id])
  }
  await q("update wa_chats set consulta_id=null where consulta_id = any($1::int[])", [ids])
  await q("update db_contactos set consulta_id=null where consulta_id = any($1::int[])", [ids])
  await q("update am_inscripciones set videollamada_consulta=null where videollamada_consulta = any($1::int[])", [ids]).catch(() => {})
  await q("delete from db_reuniones where consulta_id = any($1::int[])", [ids])
  const r = await q<{ id: number }>("delete from consultas where id = any($1::int[]) returning id", [ids])
  return r.length
}
