import { randomBytes } from "crypto"
import { one, q } from "./db"

/** Clave del calendario de vencimientos (va en el link al que se suscribe Google Calendar). Se crea sola la primera vez. */
export async function claveIcs(): Promise<string> {
  const r = await one<{ valor: string }>("select valor from config where clave='ics_token'").catch(() => null)
  if (r?.valor) return r.valor.replace(/"/g, "")
  const t = randomBytes(18).toString("hex")
  await q("insert into config(clave,valor) values ('ics_token',$1) on conflict (clave) do nothing", [t])
  return (await one<{ valor: string }>("select valor from config where clave='ics_token'"))?.valor.replace(/"/g, "") ?? t
}
