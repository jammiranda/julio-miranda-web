import { notFound } from "next/navigation"
import { q } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { inscripcionDe, leccionesDe } from "@/lib/cursos"
import { AulaLeccion } from "@/components/aula/Aula"
import AvisoAula from "../../../AvisoAula"

export const dynamic = "force-dynamic"

export default async function Leccion({ params }: { params: { id: string; lid: string } }) {
  const c = await requerirCliente()
  const i = await inscripcionDe(c.id, Number(params.id))
  if (!i) notFound()
  const lecciones = await leccionesDe(i.curso_id, i.id)
  const k = lecciones.findIndex((l) => l.id === Number(params.lid))
  if (k < 0) notFound()
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [i.id])
  return (
    <div className="flex flex-col gap-4">
      <AvisoAula ruta={`/mi-cuenta/cursos/${i.id}/l/${lecciones[k].id}`} />
      <AulaLeccion base="/portal/cursos" i={i} lecciones={lecciones} k={k} />
    </div>
  )
}
