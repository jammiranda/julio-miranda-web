import { requerirAutor, videollamadasDe, temaDe, estadoVideo, ESTADOS_VIDEO } from "@/lib/autores"
import { videollamadaAutor } from "@/lib/autor-acciones"
import { fh } from "@/components/aula/Aula"
import { fecha } from "@/lib/util"
import { CabeceraAutor, Chip } from "../_ui"

export const dynamic = "force-dynamic"

/**
 * Videollamadas pedidas por alumnos de sus cursos. El pedido se registra en el aula (Pedí una videollamada):
 * queda una consulta en el CRM y el alumno elige día y hora en la agenda; acá se ve el turno y su link.
 */
export default async function VideollamadasAutor({ searchParams }: { searchParams: { ok?: string } }) {
  const a = await requerirAutor()
  const l = await videollamadasDe(a)
  const abiertas = l.filter((v) => ["pedida", "agendada", "pasada"].includes(estadoVideo(v)))
  return (
    <div className="flex flex-col gap-6">
      <CabeceraAutor a={a} activa="videollamadas" titulo="Videollamadas" bajada={l.length ? `${abiertas.length} abiertas de ${l.length} pedidas por tus alumnos.` : undefined} />
      {!l.length && <div className="card"><p className="m-0">Todavía ningún alumno pidió la videollamada incluida en tus cursos.</p></div>}
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {l.map((v) => {
          const k = estadoVideo(v)
          const e = ESTADOS_VIDEO[k]
          const tema = temaDe(v.mensaje)
          return (
            <li key={v.iid} id={`v${v.iid}`} className="card flex flex-col gap-3 scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong className="block">{v.nombre}</strong>
                  <span className="text-sm text-[#4A515C]">{v.titulo} · <a href={`mailto:${v.email}`} className="underline">{v.email}</a></span>
                </div>
                <Chip c={e.c}>{e.n}</Chip>
              </div>
              <div className="text-sm flex flex-col gap-1">
                <span>Pedida el {fecha(v.videollamada_en)}.{v.inicio ? <> Turno: <strong className="first-letter:uppercase">{fh(v.inicio)}</strong> ({v.modalidad === "llamada" ? "llamada telefónica: la coordina el equipo" : "videollamada"}).</> : " El alumno todavía no eligió día y horario en la agenda."}</span>
                {tema && <span><span className="text-[#4A515C]">Quiere hablar de:</span> {tema}</span>}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {v.link && ["agendada", "pasada"].includes(k) && <a href={v.link} target="_blank" rel="noopener noreferrer" className="btn-p py-1.5">Entrar a la videollamada</a>}
                {v.rid && ["pasada", "agendada", "realizada", "no_asistio"].includes(k) && (
                  <form action={videollamadaAutor} className="flex flex-wrap gap-2">
                    <input type="hidden" name="iid" value={v.iid} /><input type="hidden" name="rid" value={v.rid} />
                    {k !== "realizada" && <button name="estado" value="realizada" className="btn-s py-1.5">Marcar como realizada</button>}
                    {k !== "no_asistio" && <button name="estado" value="no_asistio" className="btn-s py-1.5">No asistió</button>}
                  </form>
                )}
              </div>
              <form action={videollamadaAutor} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="iid" value={v.iid} />
                <label className="lbl flex-1 min-w-[220px]">Tu nota (la ve Dirección, no el alumno)<input name="nota" maxLength={1000} defaultValue={v.videollamada_nota ?? ""} className="inp" placeholder="Qué se habló, próximos pasos…" /></label>
                <button className="btn-s">Guardar nota</button>
                {searchParams.ok === String(v.iid) && <span role="status" className="text-sm text-emerald-700">Guardado.</span>}
              </form>
            </li>
          )
        })}
      </ul>
      <p className="m-0 text-xs text-[#4A515C] border-t border-[#E2E5EA] pt-4">Si necesitás cambiar el día u horario de un turno, avisale a Dirección: la agenda la maneja el equipo.</p>
    </div>
  )
}
