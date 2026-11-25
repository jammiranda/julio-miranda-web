import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbContactForm from "@/components/db-contact-form"
import Redes from "@/components/redes"
import EscaleraMadurez from "@/components/escalera-madurez"
import { WHATSAPP } from "@/lib/marca"
import ProductosExplorador from "@/components/productos-explorador"
import { PRODUCTOS } from "@/lib/productos-fichas"
import CintaProyectos from "@/components/cinta-proyectos"
import FraseGrande from "@/components/frase-grande"

const STATS = [
  { n: "17", c: 17, pre: "", l: "años de proyectos en producción" },
  { n: "+150", c: 150, pre: "+", l: "proyectos entregados" },
  { n: "12", c: 12, pre: "", l: "rubros con soluciones propias" },
  { n: "24/7", c: 0, pre: "", l: "soporte y monitoreo de sistemas" },
]

const CASES = [
  { img: "/images/case-tigre-new.webp", tag: "Gobierno municipal", title: "Municipio de Tigre · app Soy Tigre", text: "Más de 80.000 vecinos suscriptos. Desarrollo y soporte de la app municipal: más de 500 comercios adheridos y alta de las tarjetas Soy Tigre y Soy Tigre Joven." },
  { img: "/images/case-comunidad-usl.webp", tag: "Comunidad y academia", title: "Comunidad USL · Academia", text: "Comunidad y academia online: cursos, inscripciones, beneficios y padrón en un solo panel. Más de 1.000 inscriptos en un año." },
  { img: "/images/case-salud-marca-blanca.webp", tag: "Sistemas de salud · marca blanca", title: "Internación domiciliaria, con tu marca", text: "Pacientes, visitas, profesionales, prestaciones y facturación en un solo sistema que ya funciona todos los días. Lo adaptamos a tu institución, por abono mensual." },
]

const QUE_HACEMOS = [
  { tag: "Páginas web", title: "Tu web, lista para vender", text: "Por suscripción para negocios chicos o a medida para pymes y empresas.", href: "/webs" },
  { tag: "WhatsApp con IA", title: "Un asistente que atiende 24 h", text: "Responde, califica y da turnos por WhatsApp, y deriva a una persona.", href: "/whatsapp" },
  { tag: "Sistemas", title: "CRM, turnos y tableros", text: "Partimos de módulos probados: menos costo y menos tiempo.", href: "/sistemas" },
  { tag: "Redes y anuncios", title: "Redes y pauta, resueltas", text: "Reels, placas, historias y campañas en Meta y Google.", href: "/redes" },
  { tag: "Asesoría en tecnología e IA", title: "Un consultor tecnológico, por horas o por mes", text: "La primera reunión es sin costo. Después, horas sueltas, bolsas o abono.", href: "/asesoria" },
  { tag: "Gremios y comunidades", title: "Academia, padrón y obra social", text: "Plataformas con tu marca para gremios, asociaciones y obras sociales.", href: "/comunidad" },
]

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"
const h2 = "m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        {/* Hero */}
        <section id="inicio" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-20 md:pt-20 md:pb-24 flex flex-wrap gap-14 items-center">
            <div className="db-rise flex-[999_1_560px] min-w-0 flex flex-col gap-6">
              <p className={kicker + " text-[#FF6A63]"}><span className="db-live" />Software e IA. Desde 2009 · sistemas en producción</p>
              <h1 className="m-0 font-tight text-[40px] md:text-[64px] leading-[1.04] font-extrabold tracking-[-0.02em]">
                Sistemas que ordenan tu organización. <span className="text-[#FF6A63]">Con precio fijo y fecha de entrega.</span>
              </h1>
              <p className="m-0 text-lg md:text-xl leading-relaxed text-[#C3C8D1] max-w-[640px]">
                Desarrollamos software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas. Antes de empezar, sabés qué vas a recibir, cuándo y cuánto cuesta.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Contanos tu proyecto</a>
                <Link href="/casos-de-exito" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">Ver casos de éxito</Link>
                <Link href="/transformacion-digital" className="rounded-xl bg-white hover:bg-[#FDECEB] px-[22px] py-[14px] font-bold text-[17px] text-[#0B0D12] transition-colors">Transformación digital →</Link>
              </div>
            </div>
            <div className="db-rise2 flex-[1_1_360px] min-w-0 grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div key={s.l} className="db-card db-dark rounded-2xl border border-[#262C37] bg-[#161A22] p-5 md:p-6">
                  <div className="font-tight text-4xl md:text-[44px] font-extrabold" data-count={s.c || undefined} data-prefix={s.pre}>{s.n}</div>
                  <div className="text-[#C3C8D1] text-[15px]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <CintaProyectos etiqueta="En producción" items={[["Academia", "Comunidad USL"], ["App", "Soy Tigre · Municipio de Tigre"], ["Salud · marca blanca", "Internación domiciliaria"], ["Salud", "Sistema para clínicas"], ["IA", "Asistente de WhatsApp"], ["Gremios", "Padrón y obra social"], ["Firma", "Gestor documental"], ["Datos", "Tableros de control"]]} />
        <FraseGrande kicker="Por qué DEVISEBIT" texto="¿Por qué armar piezas sueltas si todo puede funcionar [junto]? Un solo equipo construye tu sistema, lo conecta con lo que ya usás y automatiza lo que hoy hacés a mano. Vos tenés un solo interlocutor." />
        {/* Qué hacemos: las mismas puertas de entrada que los anuncios de Google */}
        <section id="que-hacemos" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#C8231F]"}>Qué hacemos</p>
                <h2 className={h2}>Elegí por dónde empezar.</h2>
              </div>
              <Link href="/servicios" className="inline-flex items-center min-h-11 font-bold text-[#C8231F] hover:text-[#9E1A17]">Todos los servicios →</Link>
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUE_HACEMOS.map((x) => (
                <li key={x.href}>
                  <Link href={x.href} className="db-card group h-full rounded-2xl border border-[#E2E5EA] bg-[#F5F6F8] hover:border-[#C8231F] p-6 flex flex-col gap-2 text-[#0E1116] transition-colors">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C8231F]">{x.tag}</span>
                    <strong className="font-tight text-xl leading-snug">{x.title}</strong>
                    <span className="text-[15px] leading-relaxed text-[#4A515C]">{x.text}</span>
                    <span className="mt-auto pt-2 font-bold text-[#C8231F] group-hover:translate-x-0.5 transition-transform">Ver más →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Transformación digital (destacado, claro para cortar el ritmo oscuro) */}
        <section id="transformacion" className="relative overflow-hidden bg-[#FFF4F2]">
          <div aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-[#C8231F]/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
            <div className="flex flex-col gap-5">
              <p className="m-0 inline-flex self-start items-center gap-2 rounded-full bg-[#C8231F] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Consultoría de Transformación Digital</p>
              <h2 className="m-0 font-tight text-[36px] md:text-[54px] leading-[1.05] font-extrabold tracking-[-0.02em] text-[#0B0D12]">Tu organización, <span className="text-[#C8231F]">un nivel más arriba.</span></h2>
              <p className="m-0 text-lg leading-relaxed text-[#3B424D] max-w-[600px]">Medimos en qué nivel de madurez digital está tu organización, armamos la hoja de ruta por etapas y la ponemos en marcha con tu equipo, con capacitación y certificado. Y te ayudamos a conseguir financiamiento para hacerlo.</p>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                {["Diagnóstico en 4 ejes", "Hoja de ruta con indicadores", "Pilotos en semanas", "Capacitación con certificado", "Gestión de financiamiento"].map((x) => (
                  <li key={x} className="rounded-full border border-[#C8231F]/25 bg-white px-3.5 py-1.5 text-[14px] font-semibold text-[#7E1512]">{x}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/transformacion-digital" className="rounded-xl bg-[#0B0D12] hover:bg-[#1B2029] px-6 py-4 font-bold text-[17px] text-white transition-colors">Conocé la consultoría →</Link>
              </div>
              <p className="m-0 text-[16px] text-[#3B424D]">¿Preferís un equipo de tecnología por horas o por mes? <Link href="/asesoria" className="font-bold text-[#C8231F] underline underline-offset-4">Asesoría en tecnología e IA →</Link></p>
            </div>
            <div className="rounded-[28px] bg-white border border-[#F0C9C6] shadow-[0_30px_80px_-30px_rgba(200,35,31,.35)] p-4 sm:p-6 md:p-8 flex flex-col gap-5">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">Escalera de madurez digital</p>
              <EscaleraMadurez niveles={[["1", "Inicial", "28%"], ["2", "En orden", "52%"], ["3", "Integrado", "76%"], ["4", "Optimizado", "100%"]]} />
              <ol className="m-0 p-0 list-none grid grid-cols-2 gap-2.5">
                {[["Diagnóstico", "Dónde estás hoy"], ["Hoja de ruta", "Qué hacer y en qué orden"], ["Pilotos", "Resultados antes de invertir fuerte"], ["Capacitación", "Tu equipo adopta lo nuevo"]].map(([t, d], i) => (
                  <li key={t} className="rounded-xl bg-[#F5F6F8] p-3.5 flex flex-col gap-0.5">
                    <span className="text-[13px] font-extrabold text-[#C8231F]">{String(i + 1).padStart(2, "0")}</span>
                    <strong className="text-[15px] text-[#0B0D12]">{t}</strong>
                    <span className="text-[13.5px] text-[#4A515C] leading-snug">{d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Productos: el mismo explorador de /productos */}
        <section id="productos" aria-labelledby="t-productos" className="bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#FF6A63]"}>Productos</p>
                <h2 id="t-productos" className={h2}>Elegí un producto y miralo por dentro.</h2>
              </div>
              <Link href="/productos" className="inline-flex items-center min-h-11 font-bold text-[#FF8A85] hover:text-white">Todos los productos →</Link>
            </div>
            <ProductosExplorador productos={PRODUCTOS} />
          </div>
        </section>

        {/* Casos */}
        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#C8231F]"}>Casos de éxito</p>
                <h2 className={h2}>Más de 150 proyectos en producción.</h2>
              </div>
              <Link href="/casos-de-exito" className="inline-flex items-center min-h-11 font-bold text-[#C8231F] hover:text-[#9E1A17]">Ver todos los casos →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {CASES.map((c) => (
                <Link key={c.title} href="/casos-de-exito" className="db-card group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col text-[#0E1116]">
                  <div className="aspect-[16/10] overflow-hidden bg-[#0B0D12]">
                    <img src={c.img} alt={c.title} width={800} height={500} loading="lazy" decoding="async" className="db-kb w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-6 flex flex-col gap-2">
                    <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C8231F]">{c.tag}</p>
                    <h3 className="m-0 font-tight text-xl font-bold">{c.title}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{c.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-wrap gap-12">
            <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-3.5">
              <p className={kicker + " text-[#C8231F]"}>Contacto</p>
              <h2 className={h2}>Contanos tu proyecto.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Te respondemos en 24 horas hábiles con los próximos pasos.</p>
              <div className="flex flex-col gap-2 text-[17px]">
                <a href="mailto:info@devisebit.com" className="text-[#C8231F] hover:text-[#9E1A17]">info@devisebit.com</a>
                <span>Luna 24, 6.º piso, Parque Patricios, CABA</span>
                <span>Av. de los Lagos 7008, Nordelta, Tigre</span>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] hover:text-[#9E1A17]">WhatsApp +54 9 11 7346-6490</a>
              </div>
              <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-[#4A515C]">Seguinos</span><Redes oscuro={false} conTexto /></div>
            </div>
            <div className="flex-[999_1_520px] min-w-0">
              <DbContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
