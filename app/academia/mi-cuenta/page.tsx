import Link from "next/link"
import { q } from "@/lib/db"
import { requerirAlumno, urlPortal } from "@/lib/portal"
import { misInscripciones, proximasClasesDe, comprasDe, modalidad } from "@/lib/cursos"
import { salirCuenta } from "@/lib/ingreso"
import { TarjetasCursos, Certificados, fh } from "@/components/aula/Aula"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

/** Inicio del alumno en ACADEMIA DEVISEBIT: sus cursos con avance, próximas clases, certificados y lo que compró. */
export default async function MiCuentaAcademia() {
  const c = await requerirAlumno()
  const [ins, clases, compras] = await Promise.all([misInscripciones(c.id), proximasClasesDe(c.id), comprasDe(c.email)])
  const otros = await q<any>(
    `select slug, titulo, bajada, modalidad, horas, precio from am_cursos where estado='publicado'
       and id not in (select e.curso_id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where i.contacto_id=$1 and i.estado<>'baja')
     order by destacado desc, creado desc limit 3`, [c.id])
  const enCurso = ins.filter((x) => ["inscripto", "cursando"].includes(x.estado))
  const siguiente = enCurso[0]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT · Mi cuenta</p>
          <h1 className="acad-h1-m m-0 mt-2 font-extrabold">Hola, {c.nombre.split(" ")[0]}</h1>
          <p className="acad-lead m-0 mt-2 text-[#4A515C]">{ins.length ? `Tus cursos, clases en vivo y certificados. ${enCurso.length ? `Tenés ${enCurso.length} ${enCurso.length === 1 ? "curso" : "cursos"} en marcha.` : ""}` : "Acá vas a seguir tus cursos, clases y certificados. Elegí uno para empezar."}</p>
        </div>
        <form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button className="btn-s">Salir</button></form>
      </div>

      {siguiente && (
        <div className="card flex flex-wrap items-center justify-between gap-3 !border-[#C8231F]">
          <span><span className="block text-xs font-bold uppercase tracking-wider text-[#4A515C]">Seguí donde dejaste</span><strong className="text-lg">{siguiente.titulo}</strong></span>
          <Link href={`/mi-cuenta/cursos/${siguiente.id}`} className="btn-p">{siguiente.av.hechas ? "Continuar" : "Empezar"}</Link>
        </div>
      )}

      <section id="mis-cursos" aria-labelledby="t-cursos" className="flex flex-col gap-3 scroll-mt-24">
        <h2 id="t-cursos" className="m-0 text-2xl font-extrabold">Mis cursos</h2>
        {ins.length
          ? <TarjetasCursos ins={ins} base="/mi-cuenta/cursos" />
          : <div className="card flex flex-col gap-3 items-start"><p className="m-0">Todavía no estás inscripto en ningún curso.</p><Link href="/cursos" className="btn-p">Ver cursos abiertos</Link></div>}
      </section>

      {clases.length > 0 && (
        <section className="card flex flex-col gap-2" aria-labelledby="t-vivo">
          <h2 id="t-vivo" className="m-0 text-base">Próximas clases en vivo</h2>
          <ul className="m-0 p-0 list-none flex flex-col">
            {clases.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#EEF0F3] last:border-0">
                <span className="text-sm"><strong className="block">{fh(k.fecha)}</strong><Link href={`/mi-cuenta/cursos/${k.iid}`} className="underline text-[#4A515C]">{k.titulo}</Link>{k.tema ? ` · ${k.tema}` : ""}{k.lugar ? ` · ${k.lugar}` : ""}</span>
                {k.link && <a href={k.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Entrar a la clase</a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Certificados ins={ins} />

      {compras.length > 0 && (
        <section className="card" aria-labelledby="t-compras">
          <h2 id="t-compras" className="m-0 text-base">Mis guías y productos</h2>
          <ul className="m-0 mt-2 p-0 list-none flex flex-col">
            {compras.map((o) => (
              <li key={o.token} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#EEF0F3] last:border-0">
                <span><strong className="text-sm">{o.titulo}</strong><span className="block text-xs text-[#4A515C]">Comprado el {fecha(o.pagada_en ?? o.creado)}</span></span>
                {o.descarga && !o.servicio ? <a href={`/descarga/${o.token}`} className="btn-s py-1.5">Descargar</a> : <Link href={`/productos/${o.slug}`} className="btn-s py-1.5">Ver</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {otros.length > 0 && (
        <section aria-labelledby="t-mas" className="flex flex-col gap-3">
          <h2 id="t-mas" className="m-0 text-2xl font-extrabold">Seguí aprendiendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otros.map((o) => (
              <Link key={o.slug} href={`/cursos/${o.slug}`} className="card flex flex-col gap-1 no-underline text-[#0E1116] hover:border-[#C8231F]">
                <strong>{o.titulo}</strong>
                {o.bajada && <span className="text-sm text-[#4A515C]">{o.bajada}</span>}
                <span className="text-xs text-[#4A515C] mt-auto pt-2">{modalidad(o.modalidad)}{o.horas ? ` · ${Number(o.horas)} h` : ""} · {o.precio ? "Pago" : "Gratis"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="m-0 text-sm text-[#4A515C] border-t border-[#E2E5EA] pt-4">
        ¿Trabajás con DEVISEBIT en un proyecto? <a href={urlPortal()} className="underline">DEVISEBIT Mi cuenta (proyectos, pagos y facturas) ↗</a> · Es la misma cuenta, no tenés que volver a ingresar.
      </p>
    </div>
  )
}
