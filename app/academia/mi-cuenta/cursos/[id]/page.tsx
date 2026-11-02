import { notFound } from "next/navigation"
import { requerirAlumno } from "@/lib/portal"
import { aulaDe } from "@/lib/cursos"
import { CursoAlumno } from "@/components/aula/AulaAcademia"

export const dynamic = "force-dynamic"

export default async function AulaAcademia({ params, searchParams }: { params: { id: string }; searchParams: { aprobado?: string } }) {
  const c = await requerirAlumno()
  const d = await aulaDe(c.id, Number(params.id))
  if (!d) notFound()
  return <CursoAlumno {...d} aprobadoRecien={!!searchParams.aprobado} />
}
