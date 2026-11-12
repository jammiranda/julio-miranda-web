import { q, one } from "./db"
import { alCRM } from "./bot"

/**
 * Pasa varias consultas al CRM de una vez, con la misma función que usan el bot, el brief y la agenda (alCRM):
 * crea el contacto como oportunidad o, si ya había uno con ese email, lo vincula. No toca el estado de la consulta: «pasó al CRM» se define por tener el contacto vinculado (PASO_AL_CRM en lib/consultas.ts).
 * Devuelve cuántas pasaron, cuántas ya estaban y cuántas no tienen datos suficientes (sin nombre ni teléfono, o sin nada más que eso).
 */
export async function pasarAlCRM(ids: number[]) {
  ids = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))]
  const r = { pasadas: 0, yaEstaban: 0, sinDatos: 0 }
  if (!ids.length) return r
  const filas = await q<{ id: number; chat_id: string | null; canal: string | null; contacto: number | null }>(
    "select k.id, k.chat_id, k.canal, (select d.id from db_contactos d where d.consulta_id=k.id limit 1) contacto from consultas k where k.id = any($1::int[]) and k.empresa='devisebit' order by k.id",
    [ids],
  )
  for (const f of filas) {
    if (f.contacto) { r.yaEstaban++; continue }
    await alCRM(f.id, f.chat_id?.startsWith("ig:") || f.canal === "instagram" ? "instagram" : f.chat_id || f.canal === "whatsapp" ? "whatsapp" : "web")
    if (await one("select 1 from db_contactos where consulta_id=$1", [f.id])) r.pasadas++
    // alCRM no duplica: si ya hay un contacto con ese email (vinculado a otra consulta), queda ese
    else if (await one("select 1 from db_contactos d join consultas k on lower(d.email)=lower(k.email) where k.id=$1", [f.id])) r.yaEstaban++
    else r.sinDatos++
  }
  return r
}
