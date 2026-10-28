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
  { name: "TSGroup", area: "Transformación digital y gestión", d: "Sumamos nuestra agilidad tecnológica a su experiencia en la gestión de proyectos a gran escala.", suma: ["Gestión de proyectos grandes", "Equipos para el sector público", "Implementación por etapas"], logo: "/images/tsg-logo.png", url: "https://tsgroup.com.ar/" },
  { name: "HighTech", area: "Ciberseguridad y arquitecturas", d: "Su especialización en ciberseguridad y cloud nos permite desarrollar proyectos seguros desde el diseño.", suma: ["Seguridad desde el diseño", "Arquitecturas en la nube", "Auditorías y buenas prácticas"], logo: "/images/hightech-logo.png", url: "https://hightech.ar/" },
  { name: "pmIT", area: "Tableros de control y BI", d: "Su experiencia en business intelligence nos permite construir tableros que convierten datos en decisiones.", suma: ["Business intelligence", "Tableros de gestión", "Datos para decidir"], logo: "/images/pmit-logo.png", url: "https://pmit.com.ar/" },
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

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            {PARTNERS.map((p) => (
              <article key={p.name} className="db-card grid md:grid-cols-[300px_1fr] rounded-2xl border border-[#E2E5EA] overflow-hidden">
                <div className="relative min-h-[160px] bg-[#0B0D12] flex items-center justify-center p-8">
                  <Image src={p.logo} alt={p.name} width={220} height={90} className="max-h-[80px] w-auto object-contain [filter:brightness(0)_invert(1)]" />
                </div>
                <div className="p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-start">
                  <div className="flex flex-col gap-2.5">
                    <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C8231F]">{p.area}</p>
                    <h2 className="m-0 font-tight text-2xl font-bold">{p.name}</h2>
                    <p className="m-0 text-[16px] leading-relaxed text-[#4A515C] max-w-[60ch]">{p.d}</p>
                    <ul className="m-0 p-0 list-none flex flex-wrap gap-2 pt-1">
                      {p.suma.map((x) => <li key={x} className="rounded-full bg-[#F5F6F8] border border-[#E2E5EA] px-3 py-1 text-sm font-semibold">{x}</li>)}
                    </ul>
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="self-start whitespace-nowrap rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 text-sm font-bold transition-colors">Visitar sitio ↗</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Cómo trabajamos con socios</p>
              <h2 className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.1] font-extrabold">Un solo responsable, especialistas en cada parte.</h2>
            </div>
            <ol className="m-0 p-0 list-none grid md:grid-cols-3 gap-4">
              {[["01", "Un interlocutor", "DEVISEBIT coordina el proyecto completo: vos hablás con una sola persona."], ["02", "El especialista indicado", "Sumamos al socio que mejor resuelve cada parte: seguridad, datos o gestión."], ["03", "Una sola entrega", "Alcance, plazos y precio por escrito, como en cualquier proyecto nuestro."]].map(([n, t, d]) => (
                <li key={n} className="rounded-2xl bg-white border border-[#E2E5EA] p-6 flex flex-col gap-2"><span className="font-tight text-2xl font-extrabold text-[#C8231F]">{n}</span><strong className="text-lg">{t}</strong><span className="text-[15px] text-[#4A515C]">{d}</span></li>
              ))}
            </ol>
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
