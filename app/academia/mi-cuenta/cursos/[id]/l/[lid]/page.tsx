import { notFound } from "next/navigation"
import { q } from "@/lib/db"
import { requerirAlumno } from "@/lib/portal"
import { inscripcionDe, leccionesDe } from "@/lib/cursos"
import { AulaLeccion } from "@/components/aula/Aula"

export const dynamic = "force-dynamic"

export default async function LeccionAcademia({ params }: { params: { id: string; lid: string } }) {
  const c = await requerirAlumno()
  const i = await inscripcionDe(c.id, Number(params.id))
  if (!i) notFound()
  const lecciones = await leccionesDe(i.curso_id, i.id)
  const k = lecciones.findIndex((l) => l.id === Number(params.lid))
  if (k < 0) notFound()
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [i.id])
  return <AulaLeccion base="/mi-cuenta/cursos" i={i} lecciones={lecciones} k={k} />
}
