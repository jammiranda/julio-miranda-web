import Link from "next/link"
import type { Metadata } from "next"
import { PROGRAMAS } from "@/lib/programas"
import Avisarme from "@/components/Avisarme"

export const metadata: Metadata = {
  title: "Programas ejecutivos",
  description: "Programas ejecutivos de ACADEMIA DEVISEBIT en IA conversacional, transformación digital e IA y salud digital. Dejá tu email y te avisamos cuando abra la inscripción.",
  alternates: { canonical: "/programas" },
}

/** Programas ejecutivos "en pendiente": título, una línea, inicio y "Quiero que me avisen" (sin precio ni temario por ahora). */
export default function Programas() {
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-40 -top-48 w-[520px] h-[520px] rounded-full" style={{ background: "radial-gradient(circle, rgba(200,35,31,.4), transparent 65%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-12 sm:py-16">
          <span className="chip bg-[#C8231F] text-white">Próximamente</span>
          <h1 className="acad-h1-m m-0 mt-4 font-extrabold text-white">Programas ejecutivos</h1>
          <p className="acad-lead m-0 mt-4 text-white/80 max-w-2xl">Formación de varias semanas para quienes conducen equipos y organizaciones: casos reales, práctica guiada y un proyecto aplicado a tu organización. Dejá tu email y te avisamos cuando abra la inscripción.</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
        <ul className="m-0 p-0 list-none grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PROGRAMAS.map((p) => (
            <li key={p.slug} id={p.slug} className="card flex flex-col gap-3 scroll-mt-24">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">{p.tipo}</span>
              <h2 className="m-0 text-xl font-extrabold leading-snug">{p.titulo}</h2>
              <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.linea}</p>
              <p className="m-0 mt-auto pt-2 flex items-center gap-2 text-[15px]"><span aria-hidden="true" className="w-8 h-8 rounded-full bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-sm">◷</span><span><span className="block text-xs text-[#4A515C]">Inicio</span><strong>{p.inicio}</strong></span></p>
              <div className="pt-1"><Avisarme tag={p.tag} titulo={p.titulo} /></div>
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border border-[#E2E5EA] bg-white p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="m-0 font-bold">Certificación de ACADEMIA DEVISEBIT</p>
            <p className="m-0 text-[15px] text-[#4A515C]">Cada programa termina con un certificado verificable en línea. Abierto a instituciones aliadas.</p>
          </div>
          <Link href="/cursos" className="btn-s min-h-[48px] shrink-0">Mientras tanto, mirá los cursos →</Link>
        </aside>
      </div>
    </main>
  )
}
