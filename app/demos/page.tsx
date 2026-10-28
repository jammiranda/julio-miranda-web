import Link from "next/link"
import { pageMeta } from "@/lib/seo"
import { Lock, Mail, PlayCircle, Gauge } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DemoPedidoForm from "@/components/demo-pedido-form"
import { DEMOS } from "@/lib/demos"

export const metadata = pageMeta(
  "Pedí una demo · DEVISEBIT",
  "Probá nuestros productos con datos de ejemplo: te mandamos un link personal por email. Asistente de WhatsApp con IA, webs, sistemas a medida, padrón, obras sociales, plataforma de cursos y panel de contenido.",
  "/demos",
)

export default function Demos() {
  const productos = DEMOS.filter((d) => d.slug !== "transformacion-digital")
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-16 flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Demos</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.05] font-extrabold max-w-[860px]">Probalo antes de decidir.</h1>
            <p className="m-0 text-lg text-[#C3C8D1] max-w-[720px]">Dejanos tu email y te mandamos un link personal para probar las demos en tu celular o compu, con datos de ejemplo. También incluye un video de un minuto de cada producto.</p>
            <ul className="m-0 mt-2 p-0 list-none flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-[#C3C8D1]">
              <li className="flex items-center gap-2"><Mail size={17} aria-hidden="true" className="text-[#FF6A63]" /> Llega al instante a tu correo</li>
              <li className="flex items-center gap-2"><PlayCircle size={17} aria-hidden="true" className="text-[#FF6A63]" /> Recorrido guiado y video</li>
              <li className="flex items-center gap-2"><Lock size={17} aria-hidden="true" className="text-[#FF6A63]" /> Link personal, sin registrarte</li>
            </ul>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[64px] grid gap-10 lg:grid-cols-[1fr_1.1fr] items-start">
            <div className="flex flex-col gap-4">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold leading-tight">Qué podés probar</h2>
              <ul className="m-0 p-0 list-none grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {productos.map((d) => (
                  <li key={d.slug} className="rounded-2xl border border-[#E2E5EA] bg-white p-5 flex flex-col gap-1.5">
                    <strong className="font-tight text-lg">{d.titulo}</strong>
                    <span className="text-[15px] text-[#4A515C] leading-relaxed">{d.texto}</span>
                  </li>
                ))}
              </ul>
              <p className="m-0 text-sm text-[#4A515C]">Las demos muestran las funciones básicas. El sistema completo tiene más módulos: los vemos juntos en una presentación.</p>
            </div>
            <div id="pedir" className="scroll-mt-24 flex flex-col gap-4">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold leading-tight">Pedí tu demo</h2>
              <DemoPedidoForm />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 grid gap-6 md:grid-cols-2 items-center">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Gratis y abierto</p>
              <h2 className="m-0 font-tight text-[28px] md:text-[36px] font-extrabold leading-tight">Autodiagnóstico de madurez digital</h2>
              <p className="m-0 text-lg text-[#4A515C]">12 preguntas, 5 minutos. Te dice en qué nivel está tu organización y por dónde empezar, y te llega el informe por email.</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <a href="/demos/transformacion-digital.html" className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-7 py-4 font-bold text-white text-[17px] transition-colors"><Gauge size={19} aria-hidden="true" /> Hacer el autodiagnóstico</a>
              <Link href="/contacto?tema=Quiero%20ver%20una%20demo#formulario" className="rounded-xl border-2 border-[#0E1116] px-[22px] py-[14px] font-bold text-[17px] hover:bg-[#0E1116] hover:text-white transition-colors">Pedir una presentación</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
