"use server"
import { redirect } from "next/navigation"
import { q, one } from "./db"
import { requerirCliente, requerirAlumno } from "./portal"
import { inscripcionDe, evaluar, esBaseAula } from "./cursos"

/** Marca (o desmarca) una lección como vista. Sirve igual desde el portal y desde la Academia (`base`). */
export async function completarLeccion(fd: FormData) {
  const b = fd.get("base")
  const base = esBaseAula(b) ? b : "/portal/cursos"
  const c = base === "/mi-cuenta/cursos" ? await requerirAlumno() : await requerirCliente()
  const iid = Number(fd.get("iid")), lid = Number(fd.get("lid"))
  const i = await inscripcionDe(c.id, iid)
  if (!i || !(await one("select 1 from am_lecciones where id=$1 and curso_id=$2 and publicada", [lid, i.curso_id]))) redirect(base)
  const deshacer = fd.get("op") === "deshacer"
  if (deshacer) await q("delete from am_progreso where inscripcion_id=$1 and leccion_id=$2", [iid, lid])
  else {
    await q("insert into am_progreso(inscripcion_id, leccion_id) values ($1,$2) on conflict do nothing", [iid, lid])
    await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'leccion',$3)", [c.id, iid, String(lid)])
  }
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [iid])
  const aprobado = await evaluar(iid)
  const sig = Number(fd.get("siguiente") ?? 0)
  redirect(aprobado ? `${base}/${iid}?aprobado=1` : sig && !deshacer ? `${base}/${iid}/l/${sig}` : `${base}/${iid}/l/${lid}`)
}
