import Link from "next/link"
import { PlayCircle, MousePointerClick } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DEMOS, demoUrl } from "@/lib/demos"

export const metadata = {
  title: "Demos para probar · DEVISEBIT",
  description: "Probá nuestros productos sin registrarte: asistente de WhatsApp con IA, webs, sistemas a medida, padrón, obras sociales, plataforma de cursos, panel de contenido y autodiagnóstico digital.",
}

export default function Demos() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-16 flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Demos</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.05] font-extrabold max-w-[820px]">Probalo vos mismo, ahora.</h1>
            <p className="m-0 text-lg text-[#C3C8D1] max-w-[720px]">Cada demo funciona en tu navegador, sin registrarte, con datos de ejemplo. Podés tocar todo, o ver el recorrido guiado de un minuto.</p>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <ul className="m-0 list-none max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMOS.map((d) => (
              <li key={d.slug} id={d.slug} className="db-card scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h2 className="m-0 font-tight text-xl font-bold">{d.titulo}</h2>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{d.texto}</p>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A919C]">{d.para}</p>
                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-[#E2E5EA]">
                  <a href={demoUrl(d.slug)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 text-sm font-bold text-white transition-colors"><MousePointerClick size={16} aria-hidden="true" /> Probar la demo</a>
                  {d.video ? (
                    <a href={d.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 text-sm font-bold transition-colors"><PlayCircle size={16} aria-hidden="true" /> Ver el video</a>
                  ) : (
                    <a href={`${demoUrl(d.slug)}?tour=1`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 text-sm font-bold transition-colors"><PlayCircle size={16} aria-hidden="true" /> Ver el recorrido guiado</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-[640px]">
              <h2 className="m-0 font-tight text-[28px] md:text-[36px] font-extrabold leading-tight">¿Querés verlo con tus datos?</h2>
              <p className="m-0 mt-2 text-lg text-[#4A515C]">En una videollamada de 30 minutos te lo mostramos adaptado a tu organización. Si sos agencia o revendedor, también lo tenemos en marca blanca.</p>
            </div>
            <Link href="/contacto?tema=Quiero%20ver%20una%20demo#formulario" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-7 py-4 font-bold text-white text-[17px] transition-colors">Pedí una demo personalizada</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
