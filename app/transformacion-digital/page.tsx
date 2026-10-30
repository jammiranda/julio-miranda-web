import Link from "next/link"
import { pageMeta } from "@/lib/seo"
import { MessageCircle, CalendarClock, FileText, Award } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"
import Redes from "@/components/redes"
import YoutubeUltimos from "@/components/youtube-ultimos"
import { ACADEMIA } from "@/lib/marca"

export const metadata = pageMeta(
  "Consultoría de Transformación Digital · DEVISEBIT",
  "Diagnóstico de madurez digital, hoja de ruta, pilotos y capacitación con certificado para pymes, empresas familiares, gremios y organismos públicos.",
  "/transformacion-digital",
)

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20info%20sobre%20la%20consultor%C3%ADa%20de%20transformaci%C3%B3n%20digital"

const PILARES = [
  { t: "Estrategia", d: "Objetivos claros y un modelo de negocio que la tecnología ayuda a cumplir. La tecnología es la herramienta, no el objetivo." },
  { t: "Cultura y personas", d: "Equipos preparados, liderazgo que acompaña y gestión del cambio. La cultura es la causa más común de que un proyecto digital falle." },
  { t: "Tecnología y datos", d: "Procesos digitalizados, información en tiempo real, nube y ciberseguridad, elegidos según lo que la organización necesita." },
]

const ETAPAS = [
  { n: "01", t: "Diagnóstico de madurez digital", d: "Medimos dónde está la organización en cuatro ejes: liderazgo y estrategia, relación con el cliente, integración del negocio y gestión interna. Cada eje en cuatro niveles." },
  { n: "02", t: "Análisis interno y del entorno", d: "Cadena de valor, procesos clave, recursos y competencia. Usamos herramientas probadas: Canvas de modelo de negocio, PEST y fuerzas de Porter." },
  { n: "03", t: "Hoja de ruta", d: "Retos priorizados, indicadores medibles, recursos y plazos. Incluye las líneas de financiamiento disponibles para pymes cuando aplican." },
  { n: "04", t: "Pilotos y producto mínimo viable", d: "Probamos con poco esfuerzo antes de invertir en grande: demos, landings, prototipos y entregas cortas con metodologías ágiles (Lean, Design Thinking, Scrum)." },
  { n: "05", t: "Gestión del cambio y capacitación", d: "Acompañamos a los equipos en la adopción, con talleres y cursos de la Academia DEVISEBIT, y medimos el avance con los indicadores definidos." },
]

const ACAD = "https://academia.devisebit.com/productos/"
const AGENDAR = "https://sistema.devisebit.com/agendar"
const FORMATOS = [
  { t: "Guía práctica en PDF", precio: "$40.000", nota: "o USD 29 desde el exterior · descarga inmediata · español e inglés", d: "Autodiagnóstico, hoja de ruta en 14 pasos, gestión del cambio, indicadores y el Programa Kit 4.0. Incluye bonus.", items: ["Planilla de autodiagnóstico editable", "Reunión de 30 minutos sin cargo", "Su valor se descuenta del taller"], href: ACAD + "guia-transformacion-digital", cta: "Comprar la guía" },
  { t: "Taller básico", precio: "$290.000", nota: "Hasta 5 personas · 3 horas", d: "Una jornada para directivos y equipos chicos: conceptos, casos reales y autodiagnóstico en vivo.", items: ["Virtual o presencial (CABA y GBA)", "Certificado de la ACADEMIA DEVISEBIT", "La guía para cada asistente"], href: ACAD + "taller-transformacion-digital", cta: "Comprar el taller" },
  { t: "Taller para equipos", precio: "A cotizar", nota: "Más de 5 personas · in company", d: "El mismo taller adaptado a tu organización, con ejemplos de tu sector y más tiempo de trabajo en grupo.", items: ["Para áreas o toda la empresa", "Presencial o virtual", "Certificado para cada participante"], href: WA, cta: "Asesorate" },
  { t: "Diagnóstico y hoja de ruta", precio: "A cotizar", nota: "Según el tamaño de la organización", d: "Relevamos la organización y entregamos el nivel de madurez, los retos priorizados y el plan por etapas.", items: ["Entrevistas y relevamiento de procesos", "Informe, tablero e indicadores", "Financiamiento aplicable (Kit 4.0 y otros)"], href: AGENDAR, cta: "Agendá una reunión" },
  { t: "Programa de acompañamiento", precio: "A medida", nota: "Abono mensual · mínimo 3 meses", d: "Implementamos la hoja de ruta con tu equipo: pilotos, sistemas, capacitación y seguimiento mensual.", items: ["Responsable único de DEVISEBIT", "Entregas cortas y medibles", "Capacitación con certificado"], href: WA, cta: "Asesorate" },
]

const PARA = ["Directores y gerentes", "Pymes y empresas familiares", "Gremios, mutuales y obras sociales", "Organismos públicos y municipios", "Universidades e institutos", "Emprendedores en crecimiento"]

export default function TransformacionDigitalPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Consultoría de Transformación Digital"
          title="Tecnología con estrategia, para que tu organización crezca."
          sub="La transformación digital no es comprar un sistema: es un proceso continuo que combina estrategia, cultura y tecnología. Te ayudamos a medir dónde estás, definir a dónde ir y recorrer el camino por etapas."
        >
          <div className="flex flex-wrap gap-2.5 mt-2">
            <a href="/diagnostico" className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><Award size={19} aria-hidden="true" /> Hacé el autodiagnóstico gratis</a>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Consultar por WhatsApp</a>
            <a href="https://sistema.devisebit.com/agendar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Agendar una reunión</a>
            <Link href="/contacto#formulario" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><FileText size={19} aria-hidden="true" /> Dejar mis datos</Link>
          </div>
        </DbHero>

        <section aria-labelledby="t-pil" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Tres pilares</p>
              <h2 id="t-pil" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Lo que hace que la transformación funcione.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {PILARES.map((p) => (
                <article key={p.t} className="db-card rounded-2xl border border-[#E2E5EA] p-7 flex flex-col gap-3">
                  <div className="w-11 h-1 rounded bg-[#C8231F]" />
                  <h3 className="m-0 font-tight text-[23px] font-bold">{p.t}</h3>
                  <p className="m-0 text-base leading-relaxed text-[#4A515C]">{p.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="t-eta" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Cómo trabajamos</p>
              <h2 id="t-eta" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Cinco etapas, con resultados en cada una.</h2>
            </div>
            <ol className="m-0 p-0 list-none grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {ETAPAS.map((e) => (
                <li key={e.n} className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-3xl font-extrabold text-[#FF6A63]">{e.n}</span>
                  <h3 className="m-0 text-lg font-bold leading-snug">{e.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{e.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="t-for" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Formatos</p>
              <h2 id="t-for" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Empezá por donde te sirva.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">La guía y el taller básico se compran online con Mercado Pago. Lo demás lo armamos según tu organización: te asesoramos sin cargo.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FORMATOS.map((f) => (
                <article key={f.t} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-7 flex flex-col gap-3">
                  <h3 className="m-0 font-tight text-[21px] font-bold leading-snug">{f.t}</h3>
                  <div><span className="font-tight text-3xl font-extrabold">{f.precio}</span><span className="block text-sm text-[#4A515C]">{f.nota}</span></div>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{f.d}</p>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                    {f.items.map((i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>)}
                  </ul>
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className="mt-auto rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 text-center font-bold text-white transition-colors">{f.cta}</a>
                </article>
              ))}
              <article className="rounded-2xl border-2 border-dashed border-[#C3C8D1] bg-white p-7 flex flex-col gap-3 justify-center">
                <h3 className="m-0 font-tight text-[21px] font-bold leading-snug">¿Preferís horas o un abono de asesoría?</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">Si lo que necesitás es alguien de tecnología e IA a disposición, sin un proyecto cerrado: hora suelta, bolsa de horas o abono mensual con un responsable único.</p>
                <Link href="/asesoria" className="self-start rounded-xl border-2 border-[#0E1116] hover:bg-[#0E1116] hover:text-white px-5 py-3 font-bold transition-colors">Ver la asesoría en tecnología e IA →</Link>
              </article>
            </div>
          </div>
        </section>

        <section aria-labelledby="t-kit" className="bg-white border-b border-[#E2E5EA]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-[1fr_1.2fr] gap-10 items-start">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Financiamiento</p>
              <h2 id="t-kit" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">Programa Kit 4.0: hasta el 50% cofinanciado.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">El programa nacional Kit 4.0 cofinancia la transformación digital de las mipymes. Desde septiembre de 2026 alcanza a todos los sectores económicos. En el diagnóstico te decimos si tu organización califica y qué kit del catálogo oficial conviene.</p>
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-3">
              {[["Qué cubre", "Hasta el 50% del valor de un kit de soluciones digitales del catálogo oficial."], ["Cómo se paga", "La pyme paga su parte; el Estado cubre el resto con crédito fiscal al proveedor."], ["Quiénes", "Mipymes con certificado MiPyME, dos años de actividad y sin deudas exigibles."], ["Ojo", "Rige hasta agotar el cupo y las condiciones cambian: lo verificamos en el sitio oficial antes de empezar."]].map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-[#E2E5EA] p-5 flex flex-col gap-1.5"><strong>{t}</strong><span className="text-[15px] text-[#4A515C]">{d}</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="t-cert" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-4">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Capacitación con certificado</p>
              <h2 id="t-cert" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">Tu equipo aprende mientras transforma.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Los talleres y cursos se dictan en la Academia DEVISEBIT: clases en vivo, material descargable, evaluación y certificado digital verificable para cada participante que aprueba.</p>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">La metodología se apoya en la formación de nuestro equipo en la Diplomatura en Transformación Digital de la Universidad de Belgrano y en programas de transformación digital e industria 4.0 dictados para pymes junto a fundaciones de educación para el trabajo.</p>
              <div className="flex items-center gap-3 rounded-2xl border border-[#E2E5EA] p-4"><Award size={28} className="text-[#C8231F] shrink-0" aria-hidden="true" /><span className="text-[15px]">Certificado con código único, verificable en <a href={`${ACADEMIA.url}/cursos`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#C8231F] underline">academia.devisebit.com</a>.</span></div>
              <div>
                <h3 className="m-0 mb-2 text-base font-bold">Para quién es</h3>
                <ul className="m-0 p-0 list-none flex flex-wrap gap-2">{PARA.map((p) => <li key={p} className="rounded-full border border-[#C3C8D1] px-3.5 py-1.5 text-sm font-semibold">{p}</li>)}</ul>
              </div>
            </div>
            <div className="db-tech rounded-[20px] bg-[#0B0D12] text-white p-7">
              <YoutubeUltimos titulo="Mirá casos y charlas en nuestro canal" />
            </div>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_560px] flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">¿Empezamos con un diagnóstico?</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Contanos cómo trabaja hoy tu organización y te proponemos el primer paso, con alcance y fecha por escrito.</p>
              <Redes />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors">WhatsApp</a>
              <Link href="/contacto#formulario" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Pedí tu propuesta</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
