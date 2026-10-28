import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"

export const metadata = {
  title: "Alianzas estratégicas · DEVISEBIT",
  description: "Trabajamos con socios especialistas en gestión, ciberseguridad y business intelligence para ofrecer un servicio integral.",
}

const PARTNERS = [
  { name: "TSGroup", area: "Transformación digital y gestión", d: "Sumamos nuestra agilidad tecnológica a su experiencia en la gestión de proyectos a gran escala.", logo: "/images/tsg-logo.png", url: "https://tsgroup.com.ar/" },
  { name: "HighTech", area: "Ciberseguridad y arquitecturas", d: "Su especialización en ciberseguridad y cloud nos permite desarrollar proyectos seguros desde el diseño.", logo: "/images/hightech-logo.png", url: "https://hightech.ar/" },
  { name: "pmIT", area: "Tableros de control y BI", d: "Su experiencia en business intelligence nos permite construir tableros que convierten datos en decisiones.", logo: "/images/pmit-logo.png", url: "https://pmit.com.ar/" },
]

export default function AlianzasPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
        <DbHero
          kicker="Alianzas estratégicas"
          title="Servicios y productos 360°, con socios especialistas."
          sub="Nos aliamos con referentes de cada área para ofrecer un servicio integral, sin costuras, de punta a punta."
        />

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-3 gap-5">
            {PARTNERS.map((p) => (
              <article key={p.name} className="db-card rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col">
                <div className="h-36 bg-white border-b border-[#E2E5EA] relative">
                  <Image src={p.logo} alt={p.name} fill sizes="360px" className="object-contain p-8" />
                </div>
                <div className="p-6 flex flex-col gap-2.5 flex-1">
                  <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C8231F]">{p.area}</p>
                  <h2 className="m-0 font-tight text-2xl font-bold">{p.name}</h2>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.d}</p>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-2 font-bold text-[#C8231F] hover:text-[#9E1A17]">Visitar sitio web →</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_560px] flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">Juntos ofrecemos más que un servicio: una garantía de excelencia.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Cada alianza nos permite resolver proyectos completos, con especialistas en cada aspecto. ¿Querés sumarte como socio?</p>
            </div>
            <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Hablemos</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
