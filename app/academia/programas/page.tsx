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
        <div aria-hidden="true" className="absolute -right-40 -top-48 w-[520px] h-[520px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,184,61,.28), transparent 65%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-12 sm:py-16">
          <span className="inline-block rounded-full bg-[#F5B83D] text-[#0E1116] px-3 py-1 text-sm font-bold">Próximamente</span>
          <h1 className="acad-h1-m m-0 mt-4 font-extrabold text-white">Programas ejecutivos</h1>
          <p className="acad-lead m-0 mt-4 text-white/80 max-w-2xl">Formación de varias semanas para quienes conducen equipos y organizaciones: casos reales, práctica guiada y un proyecto aplicado a tu organización. Dejá tu email y te avisamos cuando abra la inscripción.</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
        <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PROGRAMAS.map((p) => (
            <li key={p.slug} id={p.slug} className="h-full flex flex-col rounded-2xl bg-white border border-[#E2E5EA] overflow-hidden scroll-mt-24 target:ring-4 target:ring-[#F5B83D]">
              <div className="bg-[#0E1116] text-white px-5 py-5 flex flex-col gap-3">
                <span className="self-start rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90">{p.tipo}</span>
                <span className="flex items-baseline gap-2"><span className="text-sm text-white/70">Inicio</span><strong className="text-3xl font-extrabold tracking-tight text-[#F5B83D] leading-none whitespace-nowrap">{p.cuando}</strong></span>
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <h2 className="t3 m-0 text-xl font-extrabold tracking-tight">{p.titulo}</h2>
                <p className="b3 m-0 text-[15px] text-[#4A515C]">{p.linea}</p>
                <p className="m-0 text-sm text-[#4A515C]">Inicio previsto: <strong className="text-[#0E1116]">{p.inicio}</strong></p>
                <div className="mt-auto pt-2"><Avisarme tag={p.tag} titulo={p.titulo} /></div>
              </div>
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
