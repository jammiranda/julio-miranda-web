import { Header } from "@/components/header"
import { pageMeta } from "@/lib/seo"
import { Footer } from "@/components/footer"

export const metadata = pageMeta(
  "¡Gracias por tu consulta! · DEVISEBIT",
  "Recibimos tu consulta. Mientras te respondemos, mirá nuestros trabajos.",
  "/gracias", { robots: { index: false, follow: false } },
)

const LINKS = [
  { href: "https://www.instagram.com/devisebit", t: "Seguinos en Instagram", d: "Trabajos nuevos, tips de IA y novedades todas las semanas.", ext: true },
  { href: "/casos-de-exito", t: "Casos de éxito", d: "Sistemas, webs y bots que ya están funcionando." },
  { href: "https://sistema.devisebit.com/agendar", t: "Agendá una reunión", d: "Elegí día y horario para una videollamada sin costo.", ext: true },
  { href: "/novedades", t: "Novedades", d: "Notas sobre inteligencia artificial, webs y automatización." },
]

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[56px] flex flex-col gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E3F2E8] text-[#0B7A3B] flex items-center justify-center text-3xl font-extrabold" aria-hidden="true">✓</div>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold">¡Recibimos tu consulta!</h1>
            <p className="m-0 text-lg md:text-xl text-[#C3C8D1] max-w-2xl">Te respondemos en menos de 24 horas hábiles, por WhatsApp o email. Si es urgente, escribinos directo por WhatsApp.</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a href="https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20les%20acabo%20de%20mandar%20una%20consulta%20por%20la%20web" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white">Escribir por WhatsApp</a>
              <a href="https://www.instagram.com/devisebit" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/30 hover:bg-white/10 px-6 py-4 font-bold text-white">Ver Instagram</a>
            </div>
          </div>
        </section>
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[56px] flex flex-col gap-6">
          <h2 className="m-0 font-tight text-[28px] font-extrabold">Mientras tanto</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="rounded-[20px] border border-[#E2E5EA] p-6 flex flex-col gap-2 hover:border-[#C8231F] transition-colors">
                <span className="font-tight text-xl font-extrabold">{l.t} →</span>
                <span className="text-[16px] leading-relaxed text-[#4A515C]">{l.d}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
