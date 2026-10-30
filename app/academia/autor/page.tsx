import Link from "next/link"
import { requerirAutor, cursosDe } from "@/lib/autores"
import { modalidad } from "@/lib/cursos"
import { CabeceraAutor, ESTADO_CURSO, Chip } from "./_ui"

export const dynamic = "force-dynamic"

/** Mis cursos: solo los cursos cuyo docente es el autor. */
export default async function MisCursosAutor() {
  const a = await requerirAutor()
  const cursos = await cursosDe(a)
  return (
    <div className="flex flex-col gap-6">
      <CabeceraAutor a={a} activa="cursos" titulo={`Hola, ${a.nombre.split(" ")[0]}`} bajada="Editá el contenido de tus cursos, seguí a tus alumnos y atendé las videollamadas que te piden." />
      {!cursos.length && (
        <div className="card"><p className="m-0">Todavía no tenés cursos asignados. Cuando Dirección te asigne como docente de un curso, lo vas a ver acá.</p></div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cursos.map((c) => {
          const e = ESTADO_CURSO[c.estado] ?? ESTADO_CURSO.borrador
          return (
            <Link key={c.id} href={`/autor/cursos/${c.id}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F]">
              <div className="flex items-start justify-between gap-2">
                <strong className="text-[17px]">{c.titulo}</strong>
                <Chip c={e.c}>{e.n}</Chip>
              </div>
              {c.bajada && <span className="text-sm text-[#4A515C]">{c.bajada}</span>}
              <span className="text-xs text-[#4A515C]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""} · {c.visibles}/{c.lecciones} lecciones visibles</span>
              <span className="text-sm mt-auto pt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span><strong>{c.alumnos}</strong> {c.alumnos === 1 ? "alumno" : "alumnos"}</span><span><strong>{c.aprobados}</strong> {c.aprobados === 1 ? "aprobado" : "aprobados"}</span><span><strong>{c.videollamadas}</strong> {c.videollamadas === 1 ? "videollamada" : "videollamadas"}</span>
              </span>
              {(c.pendientes > 0 || c.pedido_estado) && (
                <span className="text-xs text-amber-800">{c.pedido_estado ? `Pediste pasarlo a «${ESTADO_CURSO[c.pedido_estado]?.n ?? c.pedido_estado}» · ` : ""}{c.pendientes} {c.pendientes === 1 ? "cambio" : "cambios"} en revisión de Dirección</span>
              )}
            </Link>
          )
        })}
      </div>
      <p className="m-0 text-sm text-[#4A515C] border-t border-[#E2E5EA] pt-4">
        Podés editar textos, lecciones, quiz y materiales. El precio, los docentes y la publicación del curso los maneja Dirección: si necesitás publicar o archivar un curso, pedilo desde el curso.
      </p>
    </div>
  )
}
