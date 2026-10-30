import Link from "next/link"
import type { Metadata } from "next"
import { q } from "@/lib/db"
import { modalidad, pesos, dolares } from "@/lib/cursos"
import { sembrar } from "@/lib/academia"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Cursos", description: "Cursos de inteligencia artificial, automatización y transformación digital para pymes, instituciones y profesionales. Con certificado.", alternates: { canonical: "/cursos" } }

export default async function Cursos() {
  await sembrar()
  const cursos = await q<any>(
    `select c.slug, c.titulo, c.bajada, c.categoria, c.modalidad, c.horas, c.precio, c.precio_usd, c.cuotas, c.moneda, c.imagen, c.certifica, c.docente, c.nuevo, c.videollamada,
       (select min(e.inicio) from am_ediciones e where e.curso_id=c.id and e.estado in ('inscripcion','en_curso') and (e.inicio is null or e.inicio >= current_date - 30)) proxima,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado<>'baja') alumnos
     from am_cursos c where c.estado='publicado' order by c.nuevo desc, (c.precio is null) desc, c.destacado desc, c.creado desc`)
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT</p>
      <h1 className="acad-h1-m m-0 mt-2 font-extrabold">Cursos</h1>
      <p className="acad-lead m-0 mt-2 text-[#4A515C] max-w-2xl">Aprendé con quienes implementan tecnología e inteligencia artificial en organizaciones reales. A tu ritmo, con ejercicios, plantillas, seguimiento de tu avance y certificado verificable.</p>
      <ul className="m-0 mt-4 p-0 list-none flex flex-wrap gap-2 text-sm">
        {["Empezás cuando quieras", "Certificado de ACADEMIA DEVISEBIT", "Videollamada de 30 min con el docente en los cursos pagos", "Pesos en cuotas o dólares desde el exterior"].map((t) => <li key={t} className="chip !text-[13px] bg-white border border-[#E2E5EA] text-[#262C37]">✓ {t}</li>)}
      </ul>
      {!cursos.length && <p className="card mt-8">Estamos preparando los primeros cursos. Suscribite a la newsletter desde la <Link href="/" className="underline text-[#C8231F]">portada</Link> y te avisamos apenas abran las inscripciones.</p>}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursos.map((c) => (
          <Link key={c.slug} href={`/cursos/${c.slug}`} className="card p-0 overflow-hidden flex flex-col no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
            {c.imagen
              ? <img src={c.imagen} alt="" width={640} height={360} loading="lazy" decoding="async" className="w-full h-auto aspect-[16/7] object-cover" />
              : <div aria-hidden="true" className="relative w-full aspect-[16/7] flex items-end justify-between gap-2 p-4" style={{ background: "radial-gradient(circle at 85% 15%, rgba(200,35,31,.6), #0E1116 62%)" }}>
                  <span className="text-white/85 text-xs font-bold uppercase tracking-[0.2em]">{c.categoria ?? "Curso"}</span>
                  {c.horas && <span className="text-white/70 text-xs font-semibold">{Number(c.horas)} h</span>}
                </div>}
            <div className="p-5 flex flex-col gap-2 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                {c.nuevo && <span className="chip bg-[#C8231F] text-white">Nuevo</span>}
                {!c.precio && <span className="chip bg-emerald-50 text-emerald-800">Gratis</span>}
                <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""}</span>
              </span>
              <span className="text-lg font-bold leading-snug">{c.titulo}</span>
              {c.bajada && <span className="text-[15px] leading-snug text-[#4A515C] line-clamp-3">{c.bajada}</span>}
              {c.docente && <span className="text-sm text-[#262C37]">Docente: <strong>{c.docente}</strong></span>}
              <span className="mt-auto pt-3 border-t border-[#EEF0F3] flex flex-wrap items-end justify-between gap-2">
                {c.precio
                  ? <span className="flex flex-col"><strong className="text-xl leading-none">{pesos(c.precio)}</strong><span className="text-xs text-[#4A515C] mt-1">{c.precio_usd ? `${dolares(c.precio_usd)} desde el exterior` : ""}{c.cuotas > 1 ? `${c.precio_usd ? " · " : ""}${c.cuotas} cuotas sin interés` : ""}</span></span>
                  : <strong className="text-xl leading-none text-emerald-700">Gratis</strong>}
                <span className="text-sm font-bold text-[#C8231F]">{c.precio ? "Ver curso →" : "Inscribirme →"}</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
