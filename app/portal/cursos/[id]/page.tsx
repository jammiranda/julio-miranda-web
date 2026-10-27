import Link from "next/link"
import { notFound } from "next/navigation"
import { q } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { inscripcionDe, leccionesDe, avance, estadoInsc, modalidad, tipoLeccion, urlCertificado } from "@/lib/cursos"
import { mdWeb } from "@/lib/academia"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

const fh = (d: any) => new Date(d).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

export default async function Aula({ params }: { params: { id: string } }) {
  const c = await requerirCliente()
  const i = await inscripcionDe(c.id, Number(params.id))
  if (!i) notFound()
  const [lecciones, av, clases] = await Promise.all([
    leccionesDe(i.curso_id, i.id),
    avance(i.id),
    q<any>(`select cl.*, a.presente from am_clases cl left join am_asistencias a on a.clase_id=cl.id and a.inscripcion_id=$2 where cl.edicion_id=$1 order by cl.fecha`, [i.edicion_id, i.id]),
  ])
  const e = estadoInsc(i.estado)
  const siguiente = lecciones.find((l) => !l.completada)
  const proximas = clases.filter((k) => new Date(k.fecha) > new Date(Date.now() - 3 * 3600e3))
  const pasadas = clases.filter((k) => new Date(k.fecha) <= new Date(Date.now() - 3 * 3600e3))
  const modulos: { nombre: string; items: any[] }[] = []
  for (const l of lecciones) {
    const n = l.modulo || "Contenido"
    const m = modulos.find((x) => x.nombre === n)
    m ? m.items.push(l) : modulos.push({ nombre: n, items: [l] })
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/portal/cursos" className="text-sm underline text-[#4A515C] self-start">← Mis cursos</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="m-0">{i.titulo}</h1><p className="m-0 text-[#4A515C]">{modalidad(i.modalidad)} · {i.edicion}{i.docente ? ` · Docente: ${i.docente}` : ""}</p></div>
        <span className={`chip ${e.c}`}>{e.n}</span>
      </div>

      {i.certificado ? (
        <div className="card !border-emerald-300 !bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
          <span><strong>¡Aprobaste el curso!</strong> <span className="text-sm">Tu certificado tiene el código {i.certificado}.</span></span>
          <a href={urlCertificado(i.certificado)} target="_blank" rel="noopener noreferrer" className="btn-p py-1.5">Ver y descargar certificado</a>
        </div>
      ) : siguiente ? (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">Seguí por: <strong>{siguiente.titulo}</strong></span>
          <Link href={`/portal/cursos/${i.id}/l/${siguiente.id}`} className="btn-p py-1.5">{av.hechas ? "Continuar" : "Empezar"}</Link>
        </div>
      ) : null}

      <section className="card grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Tu avance">
        {av.lecciones > 0 && <div><span className="text-xs text-[#4A515C]">Lecciones</span><strong className="block text-xl">{av.hechas} / {av.lecciones}</strong><span className="text-xs text-[#4A515C]">Necesitás {i.req_lecciones}%</span></div>}
        {av.clases > 0 && <div><span className="text-xs text-[#4A515C]">Asistencia</span><strong className="block text-xl">{av.presentes} / {av.clases}</strong><span className="text-xs text-[#4A515C]">Necesitás {i.req_asistencia}%</span></div>}
        <div><span className="text-xs text-[#4A515C]">Fechas</span><strong className="block text-sm mt-1">{i.inicio ? `${fecha(i.inicio)}${i.fin ? ` al ${fecha(i.fin)}` : ""}` : "A tu ritmo"}</strong>{i.horario && <span className="text-xs text-[#4A515C]">{i.horario}</span>}</div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="card lg:col-span-2 flex flex-col gap-4" aria-labelledby="t-cont">
          <h2 id="t-cont" className="m-0 text-base">Contenido del curso</h2>
          {!lecciones.length && <p className="m-0 text-sm text-[#4A515C]">El contenido se habilita con el inicio de la cursada.</p>}
          {modulos.map((m) => (
            <div key={m.nombre}>
              <h3 className="m-0 mb-1 text-xs font-bold uppercase tracking-wider text-[#4A515C]">{m.nombre}</h3>
              <ul className="m-0 p-0 list-none">
                {m.items.map((l) => (
                  <li key={l.id}>
                    <Link href={`/portal/cursos/${i.id}/l/${l.id}`} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-[#F5F6F8]">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${l.completada ? "bg-[#0E1116] text-white" : "bg-[#F5F6F8] text-[#C8231F] border border-[#E2E5EA]"}`} aria-hidden="true">{l.completada ? "✓" : tipoLeccion(l.tipo).i}</span>
                      <span className="flex-1 text-sm"><strong className="font-semibold">{l.titulo}</strong><span className="block text-xs text-[#4A515C]">{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{l.completada ? " · Completada" : ""}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <aside className="flex flex-col gap-5">
          {(i.link || i.lugar || clases.length > 0) && (
            <section className="card flex flex-col gap-2" aria-labelledby="t-clases">
              <h2 id="t-clases" className="m-0 text-base">Clases</h2>
              {i.lugar && <p className="m-0 text-sm">Lugar: {i.lugar}</p>}
              {i.link && <a href={i.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Sala de clases en vivo</a>}
              {proximas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Próximas</h3>}
              {proximas.map((k) => (
                <div key={k.id} className="text-sm"><strong className="block">{fh(k.fecha)}</strong>{k.tema && <span className="text-[#4A515C]">{k.tema}</span>}{(k.link || i.link) && <> · <a href={k.link || i.link} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Entrar</a></>}</div>
              ))}
              {pasadas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Dadas</h3>}
              {pasadas.map((k) => (
                <div key={k.id} className="text-sm flex justify-between gap-2"><span>{fecha(k.fecha)}{k.tema ? ` · ${k.tema}` : ""}{k.grabacion && <> · <a href={k.grabacion} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Grabación</a></>}</span><span className={k.presente ? "text-emerald-700" : k.presente === false ? "text-rojo" : "text-[#4A515C]"}>{k.presente ? "Presente" : k.presente === false ? "Ausente" : "—"}</span></div>
              ))}
            </section>
          )}
          {i.descripcion && (
            <section className="card" aria-labelledby="t-acerca">
              <h2 id="t-acerca" className="m-0 text-base">Sobre el curso</h2>
              <div className="prosa !text-[15px] mt-2" dangerouslySetInnerHTML={{ __html: mdWeb(i.descripcion) }} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
