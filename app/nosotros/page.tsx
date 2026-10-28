import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"

export const metadata = {
  title: "Nosotros · DEVISEBIT",
  description: "Desde 2009 desarrollamos software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas. Conocé al equipo.",
}

const STATS = [
  { n: "17", l: "años en producción" },
  { n: "+150", l: "proyectos entregados" },
  { n: "12", l: "rubros" },
  { n: "29", l: "medios digitales creados" },
]

const HITOS = [
  { y: "2009", t: "Nace como Web y Graf", d: "Primeros sitios, portales de noticias y diarios digitales del NOA." },
  { y: "2016", t: "Gobierno y gestión pública", d: "Plataformas y tableros para organismos nacionales y de la Ciudad." },
  { y: "2021", t: "Universidad y educación", d: "Proyectos de modernización con la UBA y academias online." },
  { y: "2024", t: "Salud, gremios e IA", d: "Sistemas de gestión, academias y asistentes con inteligencia artificial." },
  { y: "Hoy", t: "DEVISEBIT SRL", d: "Software e IA para salud e instituciones, con dos equipos de desarrollo." },
]

const TEAM = [
  { name: "Julio", role: "Fundador y Director", d: "Más de 15 años liderando proyectos de software, datos y transformación digital en salud, gobierno y educación." },
  { name: "Bárbara", role: "Líder de Proyectos", d: "Coordina cada proyecto de punta a punta: alcance, tiempos, pruebas y experiencia de usuario." },
  { name: "Jonathan", role: "Líder de Desarrollo", d: "Conduce el equipo de desarrollo y la arquitectura de las plataformas que ponemos en producción." },
  { name: "Jime", role: "Líder de Diseño y Marketing", d: "Diseña la identidad, las interfaces y la comunicación digital de cada producto." },
]

const LOGOS = [
  { src: "/images/client-uthgra.png", alt: "UTHGRA" },
  { src: "/images/client-tigre-municipio.png", alt: "Municipio de Tigre" },
  { src: "/images/client-uba.png", alt: "Universidad de Buenos Aires" },
  { src: "/images/client-buenos-aires-ciudad.png", alt: "Gobierno de la Ciudad de Buenos Aires" },
  { src: "/images/client-ministerio-ambiente.png", alt: "Ministerio de Ambiente de la Nación" },
  { src: "/images/client-siben.webp", alt: "SIBEN · Sociedad Iberoamericana de Neonatología" },
  { src: "/images/client-fundacion-sodetec.png", alt: "Fundación SODETEC" },
  { src: "/images/client-academia-usl.png", alt: "Academia USL" },
  { src: "/images/client-academia-ba.png", alt: "Academia BA Emprende" },
  { src: "/images/client-uba-posgrado.png", alt: "UBA Posgrado" },
  { src: "/images/client-atm-misiones.png", alt: "ATM Misiones" },
  { src: "/images/client-cla-training.png", alt: "CLA Training" },
  { src: "/images/client-salud.png", alt: "Urobaires" },
]

const VALUES = [
  { t: "Eficiencia", d: "Convertimos tiempo y recursos en resultados medibles." },
  { t: "Trabajo en equipo", d: "Un equipo cohesionado que se hace cargo de punta a punta." },
  { t: "Seguridad", d: "Protegemos los datos de cada organización con buenas prácticas." },
  { t: "Confidencialidad", d: "Respetamos y cuidamos la información de nuestros clientes." },
  { t: "Innovación", d: "Sumamos tecnología nueva cuando resuelve un problema real." },
]

const SKILLS = ["Desarrollo web full stack", "Aplicaciones móviles", "Inteligencia artificial", "Machine learning", "Business intelligence", "Cloud computing", "DevOps", "Ciberseguridad", "Web data extraction", "Chatbots y WhatsApp"]

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
        <DbHero
          kicker="Quiénes somos"
          title="Tecnología que ordena organizaciones, desde 2009."
          sub="Somos un equipo de software e inteligencia artificial que trabaja con salud, gobierno, universidades, gremios y empresas. No entregamos proyectos y desaparecemos: acompañamos la operación como socios."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-[900px]">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-2xl border border-[#262C37] bg-[#161A22] p-5">
                <div className="font-tight text-4xl font-extrabold">{s.n}</div>
                <div className="text-[#C3C8D1] text-[15px]">{s.l}</div>
              </div>
            ))}
          </div>
        </DbHero>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-10">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Nuestra historia</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">17 años poniendo sistemas en producción.</h2>
            </div>
            <ol className="list-none m-0 p-0 grid md:grid-cols-5 gap-4">
              {HITOS.map((h) => (
                <li key={h.y} className="border-t-2 border-[#C8231F] pt-4 flex flex-col gap-1.5">
                  <span className="font-tight text-2xl font-extrabold text-[#C8231F]">{h.y}</span>
                  <strong className="text-[17px]">{h.t}</strong>
                  <span className="text-[15px] leading-relaxed text-[#4A515C]">{h.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="confian" className="bg-white border-t border-[#E2E5EA]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-col gap-8">
            <h2 id="confian" className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">Organizaciones que confiaron en nosotros</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {LOGOS.map((l) => (
                <div key={l.alt} className="db-card rounded-2xl border border-[#E2E5EA] bg-white h-28 relative w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(14.285%-14px)]">
                  <Image src={l.src} alt={l.alt} fill sizes="280px" className="object-contain p-6" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="equipo" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Nuestro equipo</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Las personas detrás de cada proyecto.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEAM.map((p) => (
                <article key={p.name} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B0D12] text-white font-tight text-2xl font-extrabold flex items-center justify-center" aria-hidden="true">{p.name[0]}</div>
                  <div>
                    <h3 className="m-0 font-tight text-xl font-bold">{p.name}</h3>
                    <p className="m-0 text-[#C8231F] font-semibold text-[15px]">{p.role}</p>
                  </div>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.d}</p>
                </article>
              ))}
            </div>
            <p className="m-0 text-[#4A515C] leading-relaxed max-w-[760px]">Y un equipo de analistas funcionales, desarrolladores, QA y soporte que acompaña cada proyecto, con dos equipos de desarrollo trabajando en paralelo.</p>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 grid md:grid-cols-2 gap-5">
            <div className="rounded-[20px] border border-[#262C37] bg-[#161A22] p-8 flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Misión</p>
              <p className="m-0 font-tight text-2xl md:text-[28px] leading-snug font-bold">Impulsar el crecimiento de empresas, emprendedores y gobiernos con soluciones tecnológicas eficientes y a medida.</p>
            </div>
            <div className="rounded-[20px] border border-[#262C37] bg-[#161A22] p-8 flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Visión</p>
              <p className="m-0 font-tight text-2xl md:text-[28px] leading-snug font-bold">Ser el referente en software, datos e inteligencia artificial para salud e instituciones, con excelencia en cada entrega.</p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <h2 className="m-0 font-tight text-[30px] md:text-[40px] font-extrabold">Nuestros valores</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {VALUES.map((v) => (
                <article key={v.t} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-2.5">
                  <div className="w-11 h-1 rounded bg-[#C8231F]" />
                  <h3 className="m-0 font-tight text-xl font-bold">{v.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{v.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-col gap-6">
            <h2 className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">En qué somos especialistas</h2>
            <div className="flex flex-wrap gap-2.5">
              {SKILLS.map((s) => (
                <span key={s} className="rounded-full border border-[#E2E5EA] bg-white px-5 py-3 font-semibold">{s}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold flex-[1_1_520px]">¿Querés conocer cómo trabajamos? Mirá los casos o escribinos.</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/casos-de-exito" className="rounded-xl border-2 border-[#0E1116] px-[22px] py-[14px] font-bold hover:bg-[#0E1116] hover:text-white transition-colors">Ver casos de éxito</Link>
              <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Contactar</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
