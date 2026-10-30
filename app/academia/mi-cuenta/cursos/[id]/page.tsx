import { notFound } from "next/navigation"
import { requerirAlumno } from "@/lib/portal"
import { aulaDe } from "@/lib/cursos"
import { AulaCurso } from "@/components/aula/Aula"

export const dynamic = "force-dynamic"

export default async function AulaAcademia({ params, searchParams }: { params: { id: string }; searchParams: { aprobado?: string } }) {
  const c = await requerirAlumno()
  const d = await aulaDe(c.id, Number(params.id))
  if (!d) notFound()
  return <AulaCurso base="/mi-cuenta/cursos" {...d} volver={{ href: "/mi-cuenta", t: "Mi cuenta" }} aprobadoRecien={!!searchParams.aprobado} />
}
