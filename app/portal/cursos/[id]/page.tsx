import { notFound } from "next/navigation"
import { requerirCliente } from "@/lib/portal"
import { aulaDe } from "@/lib/cursos"
import { AulaCurso } from "@/components/aula/Aula"
import AvisoAula from "../AvisoAula"

export const dynamic = "force-dynamic"

export default async function Aula({ params, searchParams }: { params: { id: string }; searchParams: { aprobado?: string } }) {
  const c = await requerirCliente()
  const d = await aulaDe(c.id, Number(params.id))
  if (!d) notFound()
  return (
    <div className="flex flex-col gap-5">
      <AvisoAula ruta={`/mi-cuenta/cursos/${d.i.id}`} />
      <AulaCurso base="/portal/cursos" {...d} volver={{ href: "/portal/cursos", t: "Mis cursos" }} aprobadoRecien={!!searchParams.aprobado} />
    </div>
  )
}
