import Link from "next/link"
import type { Metadata } from "next"
import { q } from "@/lib/db"
import { sembrar } from "@/lib/academia"
import TarjetaCurso from "../_ui/TarjetaCurso"
import Revelar from "../_ui/Revelar"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Cursos", description: "Cursos de inteligencia artificial, automatización y transformación digital para pymes, instituciones y profesionales. Con certificado.", alternates: { canonical: "/cursos" } }

export default async function Cursos() {
  await sembrar()
  const cursos = await q<any>(
    `select c.slug, c.titulo, c.bajada, c.categoria, c.modalidad, c.horas, c.precio, c.precio_usd, c.cuotas, c.moneda, c.imagen, c.certifica, c.docente, c.docente_slug, c.gratis_modulos, c.nuevo, c.videollamada,
       (select min(e.inicio) from am_ediciones e where e.curso_id=c.id and e.estado in ('inscripcion','en_curso') and (e.inicio is null or e.inicio >= current_date - 30)) proxima,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado<>'baja') alumnos
     from am_cursos c where c.estado='publicado' order by c.nuevo desc, (c.precio is null) desc, c.destacado desc, c.creado desc`)
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <span aria-hidden="true" className="block w-12 h-1.5 rounded-full bg-[#C8231F]" />
      <h1 className="acad-h1-m m-0 mt-4 font-extrabold tracking-tight">Cursos</h1>
      <p className="acad-lead m-0 mt-2 text-[#4A515C] max-w-2xl">Aprendé con quienes implementan tecnología e inteligencia artificial en organizaciones reales. A tu ritmo, con ejercicios, plantillas, seguimiento de tu avance y certificado verificable.</p>
      <ul className="m-0 mt-4 p-0 list-none flex flex-wrap gap-2 text-sm">
        {["Empezás cuando quieras", "Certificado de ACADEMIA DEVISEBIT", "Módulo 1 gratis en varios cursos", "Cursos pagos: acceso de por vida, PDF, plantillas y videollamada de 30 min", "Pesos en cuotas o dólares desde el exterior"].map((t) => <li key={t} className="chip !text-[13px] bg-white border border-[#E2E5EA] text-[#262C37]">✓ {t}</li>)}
      </ul>
      {!cursos.length && <p className="card mt-8">Estamos preparando los primeros cursos. Suscribite a la newsletter desde la <Link href="/" className="underline text-[#C8231F]">portada</Link> y te avisamos apenas abran las inscripciones.</p>}
      <ul className="m-0 mt-6 sm:mt-8 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {cursos.map((c, i) => <li key={c.slug}><TarjetaCurso c={c} conQuien i={i} /></li>)}
      </ul>
      <Revelar />
    </main>
  )
}
