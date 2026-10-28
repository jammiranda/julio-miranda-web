import { Header } from "@/components/header"
import { pageMeta } from "@/lib/seo"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"
import DbCvForm from "@/components/db-cv-form"
import { MapPin, Mail } from "lucide-react"

export const metadata = pageMeta(
  "Trabajá con nosotros · DEVISEBIT",
  "Sumate al equipo de DEVISEBIT: desarrollo, datos, QA, diseño, proyectos y ciberseguridad.",
  "/trabaja-con-nosotros",
)

const WHY = [
  { t: "Tecnología actual", d: "Trabajamos con herramientas modernas, inteligencia artificial y metodologías ágiles." },
  { t: "Equipo colaborativo", d: "Cada idea cuenta y acompañamos tu crecimiento profesional." },
  { t: "Proyectos con impacto", d: "Sistemas que usan miles de personas en salud, gobierno, universidades y gremios." },
]

export default function TrabajaConNosotros() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Trabajá con nosotros"
          title="Sumate a un equipo que pone sistemas en producción."
          sub="Valoramos el talento y las ganas de aprender. Si te interesa la tecnología aplicada a problemas reales, queremos conocerte."
        />

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-3 gap-4">
            {WHY.map((w) => (
              <article key={w.t} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-7 flex flex-col gap-2.5">
                <div className="w-11 h-1 rounded bg-[#C8231F]" />
                <h2 className="m-0 font-tight text-[22px] font-bold">{w.t}</h2>
                <p className="m-0 text-base leading-relaxed text-[#4A515C]">{w.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-wrap gap-12">
            <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-5">
              <h2 className="m-0 font-tight text-[30px] md:text-[36px] font-extrabold">Postulate</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Completá tus datos y contanos tu experiencia. Revisamos cada postulación y te escribimos si hay una búsqueda que encaje con tu perfil.</p>
              <span className="flex items-start gap-3 text-[17px]"><MapPin size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> Luna 24, 6.º piso, Parque Patricios, CABA · Distrito Tecnológico</span>
              <a href="mailto:info@devisebit.com" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><Mail size={20} aria-hidden="true" /> info@devisebit.com</a>
            </div>
            <div className="flex-[999_1_520px] min-w-0">
              <DbCvForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
