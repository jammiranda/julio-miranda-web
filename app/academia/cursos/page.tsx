import Link from "next/link"
import type { Metadata } from "next"
import { q } from "@/lib/db"
import { modalidad } from "@/lib/cursos"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Cursos", description: "Cursos de inteligencia artificial, automatización y transformación digital para pymes, instituciones y profesionales. Con certificado.", alternates: { canonical: "/cursos" } }

export default async function Cursos() {
  const cursos = await q<any>(
    `select c.slug, c.titulo, c.bajada, c.categoria, c.modalidad, c.horas, c.precio, c.moneda, c.imagen, c.certifica,
       (select min(e.inicio) from am_ediciones e where e.curso_id=c.id and e.estado in ('inscripcion','en_curso') and (e.inicio is null or e.inicio >= current_date - 30)) proxima,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado<>'baja') alumnos
     from am_cursos c where c.estado='publicado' order by c.destacado desc, c.creado desc`)
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT</p>
      <h1 className="acad-h1-m m-0 mt-2 font-extrabold">Cursos</h1>
      <p className="acad-lead m-0 mt-2 text-[#4A515C] max-w-2xl">Aprendé con quienes implementan tecnología e inteligencia artificial en organizaciones reales. Con materiales descargables, seguimiento de tu avance y certificado.</p>
      {!cursos.length && <p className="card mt-8">Estamos preparando los primeros cursos. Suscribite a la newsletter desde la <Link href="/" className="underline text-[#C8231F]">portada</Link> y te avisamos apenas abran las inscripciones.</p>}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursos.map((c) => (
          <Link key={c.slug} href={`/cursos/${c.slug}`} className="card p-0 overflow-hidden flex flex-col no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
            {c.imagen ? <img src={c.imagen} alt="" width={640} height={360} loading="lazy" decoding="async" className="w-full h-auto aspect-video object-cover" /> : <div aria-hidden="true" className="w-full aspect-video bg-[#0E1116] flex items-end p-4" style={{ background: "radial-gradient(circle at 80% 20%, rgba(200,35,31,.55), #0E1116 60%)" }}><span className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">{c.categoria ?? "Curso"}</span></div>}
            <div className="p-5 flex flex-col gap-2 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""}</span>
              <span className="text-lg font-bold leading-snug">{c.titulo}</span>
              {c.bajada && <span className="text-[15px] leading-snug text-[#4A515C]">{c.bajada}</span>}
              <span className="mt-auto pt-3 flex flex-wrap gap-2">
                <span className="chip bg-[#FDECEB] text-[#9E1A17]">{c.precio ? "Pago" : "Gratis"}</span>
                {c.certifica && <span className="chip bg-slate-100 text-slate-700">Con certificado</span>}
                {c.proxima && <span className="chip bg-sky-50 text-sky-800">Inicia {new Date(c.proxima).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" })}</span>}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
