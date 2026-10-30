import Link from "next/link"
import { requerirAutor, cursosDe, alumnosDe } from "@/lib/autores"
import { estadoInsc } from "@/lib/cursos"
import { fecha } from "@/lib/util"
import { CabeceraAutor, Chip } from "../_ui"

export const dynamic = "force-dynamic"

/**
 * Alumnos de los cursos del autor. Ley 25.326 (minimización de datos personales): solo nombre, email y avance.
 * No se muestran teléfono, organización, pagos ni datos del CRM.
 */
export default async function AlumnosAutor({ searchParams }: { searchParams: { curso?: string } }) {
  const a = await requerirAutor()
  const cursos = await cursosDe(a)
  const sel = cursos.find((c) => c.id === Number(searchParams.curso))?.id ?? null
  const alumnos = await alumnosDe(a, sel)
  const grupos = new Map<number, { titulo: string; l: any[] }>()
  for (const x of alumnos) {
    if (!grupos.has(x.curso_id)) grupos.set(x.curso_id, { titulo: x.titulo, l: [] })
    grupos.get(x.curso_id)!.l.push(x)
  }
  return (
    <div className="flex flex-col gap-6">
      <CabeceraAutor a={a} activa="alumnos" titulo="Mis alumnos" bajada="Quién cursa tus cursos y cuánto avanzó." />
      {cursos.length > 1 && (
        <nav aria-label="Filtrar por curso" className="flex flex-wrap gap-2">
          <Link href="/autor/alumnos" aria-current={!sel ? "page" : undefined} className={`btn-s py-1.5 ${!sel ? "!border-[#C8231F]" : ""}`}>Todos</Link>
          {cursos.map((c) => <Link key={c.id} href={`/autor/alumnos?curso=${c.id}`} aria-current={sel === c.id ? "page" : undefined} className={`btn-s py-1.5 ${sel === c.id ? "!border-[#C8231F]" : ""}`}>{c.titulo} ({c.alumnos})</Link>)}
        </nav>
      )}
      {!alumnos.length && <div className="card"><p className="m-0">Todavía no hay alumnos inscriptos{sel ? " en este curso" : " en tus cursos"}.</p></div>}
      {[...grupos.entries()].map(([id, g]) => {
        const aprobados = g.l.filter((x) => x.estado === "aprobado").length
        return (
          <section key={id} className="card p-0 overflow-hidden" aria-labelledby={`t-c${id}`}>
            <div className="px-4 py-3 border-b border-[#EEF0F3] flex flex-wrap justify-between gap-2">
              <h2 id={`t-c${id}`} className="m-0 text-base">{g.titulo}</h2>
              <span className="text-sm text-[#4A515C]">{g.l.length} {g.l.length === 1 ? "alumno" : "alumnos"} · {aprobados} {aprobados === 1 ? "aprobado" : "aprobados"}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Alumno</th><th>Email</th><th>Avance</th><th>Estado</th><th>Última actividad</th></tr></thead>
                <tbody>
                  {g.l.map((x) => {
                    const pct = x.lecciones ? Math.round((100 * x.hechas) / x.lecciones) : 0
                    const e = estadoInsc(x.estado)
                    return (
                      <tr key={x.id}>
                        <td className="font-semibold">{x.nombre}</td>
                        <td><a href={`mailto:${x.email}`} className="underline">{x.email}</a></td>
                        <td className="min-w-[140px]">
                          <span className="text-xs text-[#4A515C]">{x.hechas}/{x.lecciones} lecciones · {pct}%</span>
                          <div className="h-1.5 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-label={`Avance de ${x.nombre}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#C8231F]" style={{ width: `${pct}%` }} /></div>
                        </td>
                        <td><Chip c={e.c}>{e.n}</Chip>{x.aprobado_en && <span className="block text-xs text-[#4A515C] mt-1">{fecha(x.aprobado_en)}{x.certificado ? " · con certificado" : ""}</span>}</td>
                        <td>{fecha(x.ultima_actividad ?? x.creado)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
      <p className="m-0 text-xs text-[#4A515C] border-t border-[#E2E5EA] pt-4">
        Estos datos personales son de los alumnos de ACADEMIA DEVISEBIT (Ley 25.326): usalos solo para acompañarlos en el curso. No los copies a otras bases ni los compartas.
      </p>
    </div>
  )
}
