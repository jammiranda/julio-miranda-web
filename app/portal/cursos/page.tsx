import { q } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { misInscripciones, modalidad } from "@/lib/cursos"
import { URL_ACADEMIA } from "@/lib/academia"
import { TarjetasCursos, Certificados } from "@/components/aula/Aula"
import AvisoAula from "./AvisoAula"

export const dynamic = "force-dynamic"

export default async function MisCursos() {
  const c = await requerirCliente()
  const ins = await misInscripciones(c.id)
  const otros = await q<any>(
    `select slug, titulo, bajada, modalidad, horas, precio from am_cursos where estado='publicado'
       and id not in (select e.curso_id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where i.contacto_id=$1 and i.estado<>'baja')
     order by destacado desc, creado desc limit 3`, [c.id])
  return (
    <div className="flex flex-col gap-6">
      <AvisoAula />
      <div><h1 className="m-0">Mis cursos</h1><p className="m-0 mt-1 text-[#4A515C]">Tus clases, materiales, avance y certificados de la ACADEMIA DEVISEBIT.</p></div>

      {!ins.length && (
        <div className="card flex flex-col gap-3 items-start">
          <p className="m-0">Todavía no estás inscripto en ningún curso. En tu espacio de la Academia ves los cursos abiertos y te anotás con un clic.</p>
          <a href={`${URL_ACADEMIA}/mi-cuenta`} className="btn-p">Ir a la Academia</a>
        </div>
      )}

      <TarjetasCursos ins={ins} base="/portal/cursos" />
      <Certificados ins={ins} />

      {otros.length > 0 && (
        <section aria-labelledby="t-mas" className="flex flex-col gap-3">
          <h2 id="t-mas" className="m-0">Seguí aprendiendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otros.map((o) => (
              <a key={o.slug} href={`${URL_ACADEMIA}/cursos/${o.slug}`} className="card flex flex-col gap-1 hover:border-[#C8231F]">
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
