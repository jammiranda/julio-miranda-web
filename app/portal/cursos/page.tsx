import Link from "next/link"
import { q } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { misInscripciones, estadoInsc, modalidad, urlCertificado } from "@/lib/cursos"
import { URL_ACADEMIA } from "@/lib/academia"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

const Barra = ({ pct, label }: { pct: number; label: string }) => (
  <div>
    <div className="flex justify-between text-xs text-[#4A515C]"><span>{label}</span><span>{pct}%</span></div>
    <div className="h-2 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#C8231F] rounded-full" style={{ width: `${pct}%` }} /></div>
  </div>
)

export default async function MisCursos() {
  const c = await requerirCliente()
  const ins = await misInscripciones(c.id)
  const otros = await q<any>(
    `select slug, titulo, bajada, modalidad, horas, precio from am_cursos where estado='publicado'
       and id not in (select e.curso_id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where i.contacto_id=$1 and i.estado<>'baja')
     order by destacado desc, creado desc limit 3`, [c.id])
  const certs = ins.filter((x) => x.certificado)
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="m-0">Mis cursos</h1><p className="m-0 mt-1 text-[#4A515C]">Tus clases, materiales, avance y certificados de la ACADEMIA DEVISEBIT.</p></div>

      {!ins.length && (
        <div className="card flex flex-col gap-3 items-start">
          <p className="m-0">Todavía no estás inscripto en ningún curso.</p>
          <a target="_blank" rel="noopener noreferrer" href={URL_ACADEMIA} className="btn-p">Ir a la Academia</a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ins.map((x) => {
          const e = estadoInsc(x.estado)
          return (
            <Link key={x.id} href={`/portal/cursos/${x.id}`} className="card flex flex-col gap-3 hover:border-[#C8231F]">
              <div className="flex items-start justify-between gap-2">
                <div><strong className="block text-[17px]">{x.titulo}</strong><span className="text-sm text-[#4A515C]">{modalidad(x.modalidad)} · {x.edicion}</span></div>
                <span className={`chip ${e.c} shrink-0`}>{e.n}</span>
              </div>
              {x.av.lecciones > 0 && <Barra pct={x.av.pctLecciones} label={`Lecciones: ${x.av.hechas} de ${x.av.lecciones}`} />}
              {x.av.clases > 0 && <Barra pct={x.av.pctAsistencia} label={`Asistencia: ${x.av.presentes} de ${x.av.clases} clases`} />}
              <div className="flex flex-wrap gap-x-4 text-xs text-[#4A515C]">
                {x.inicio && <span>Inicio {fecha(x.inicio)}</span>}
                {x.horario && <span>{x.horario}</span>}
                {x.certificado && <span className="font-semibold text-emerald-700">Certificado disponible</span>}
              </div>
            </Link>
          )
        })}
      </div>

      {certs.length > 0 && (
        <section className="card" aria-labelledby="t-cert">
          <h2 id="t-cert" className="m-0 text-base">Mis certificados</h2>
          <ul className="m-0 mt-2 p-0 list-none flex flex-col">
            {certs.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#EEF0F3] last:border-0">
                <span><strong className="text-sm">{x.titulo}</strong><span className="block text-xs text-[#4A515C]">Código {x.certificado} · {fecha(x.aprobado_en)}</span></span>
                <a href={urlCertificado(x.certificado)} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Ver y descargar</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {otros.length > 0 && (
        <section aria-labelledby="t-mas" className="flex flex-col gap-3">
          <h2 id="t-mas" className="m-0">Seguí aprendiendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otros.map((o) => (
              <a target="_blank" rel="noopener noreferrer" key={o.slug} href={`${URL_ACADEMIA}/cursos/${o.slug}`} className="card flex flex-col gap-1 hover:border-[#C8231F]">
                <strong>{o.titulo}</strong>
                {o.bajada && <span className="text-sm text-[#4A515C]">{o.bajada}</span>}
                <span className="text-xs text-[#4A515C] mt-auto pt-2">{modalidad(o.modalidad)}{o.horas ? ` · ${Number(o.horas)} h` : ""} · {o.precio ? "Pago" : "Gratis"}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
