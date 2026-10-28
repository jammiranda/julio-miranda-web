import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbContactForm from "@/components/db-contact-form"
import Redes from "@/components/redes"
import { SOLUCIONES, WHATSAPP, ACADEMIA } from "@/lib/marca"
import YoutubeUltimos from "@/components/youtube-ultimos"

const STATS = [
  { n: "17", c: 17, pre: "", l: "años de proyectos en producción" },
  { n: "+150", c: 150, pre: "+", l: "proyectos entregados" },
  { n: "12", c: 12, pre: "", l: "rubros con soluciones propias" },
  { n: "24/7", c: 0, pre: "", l: "soporte y monitoreo de sistemas" },
]

const NEEDS = [
  { num: "01", title: "Atender más sin sumar personal", text: "Asistente de WhatsApp con IA que da turnos y responde las 24 horas.", href: "/whatsapp" },
  { num: "02", title: "Ordenar una clínica o centro", text: "Turnos, historia clínica electrónica y facturación en un solo sistema.", href: "/productos#clinicas" },
  { num: "03", title: "Ver los números al día", text: "Tableros de control con alertas de consumo, costos y ventas.", href: "/productos#tableros" },
  { num: "04", title: "Gestionar afiliados y clientes", text: "CRM a medida con padrón, autorizaciones y embudo de ventas.", href: "/productos#crm" },
  { num: "05", title: "Capacitar a mucha gente", text: "Academia online con pagos, app y certificados.", href: "/comunidad" },
  { num: "06", title: "Tener una web que trabaje", text: "Sitios con turnos, formularios y WhatsApp conectados a tus sistemas.", href: "/webs" },
  { num: "07", title: "Crecer en redes y anuncios", text: "Reels, placas y campañas en Meta y Google, todas las semanas.", href: "/redes" },
  { num: "08", title: "Transformar la organización", text: "Consultoría de transformación digital: diagnóstico, hoja de ruta y capacitación con certificado.", href: "/transformacion-digital" },
  { num: "09", title: "Ordenar un gremio o comunidad", text: "Padrón, beneficios, app y academia con tu marca.", href: "/comunidad" },
]

const PRODUCTS = [
  { title: "Sistema para clínicas", text: "Turnos, historia clínica, recetas y tablero." },
  { title: "Asistente de WhatsApp con IA", text: "Atención 24 h con derivación a personas." },
  { title: "CRM de afiliados y prestadores", text: "Padrón único, autorizaciones y trazabilidad." },
  { title: "Tableros de control", text: "Indicadores al día con alertas." },
  { title: "App y credencial digital", text: "Tu institución en el celular de cada afiliado." },
  { title: "Academias online", text: "Cursos, pagos y certificados." },
  { title: "Votación y control de acceso", text: "Elecciones sin papel y acceso con QR." },
  { title: "Gestor documental con firma digital", text: "Documentos ordenados y firmados en línea." },
]

const PRODUCT_IDS = ["clinicas", "whatsapp", "crm", "tableros", "app", "academias", "votacion", "documental"]

const CASES = [
  { img: "https://julio.devisebit.com/media/trabajos/plataforma-academia.jpg", tag: "Comunidad y academia", title: "Comunidad USL · Academia", text: "Comunidad y academia online: cursos, inscripciones, beneficios y padrón en un solo panel. Más de 1.000 inscriptos en un año." },
  { img: "/images/case-tigre-new.png", tag: "Gobierno municipal", title: "Municipio de Tigre · app Soy Tigre", text: "Desarrollo y soporte de la app: comercios adheridos y alta de las tarjetas Soy Tigre y Soy Tigre Joven." },
  { img: "/images/case-academia-new.png", tag: "Gobierno y educación", title: "GCBA · Academia BA Emprende", text: "Oferta académica online para emprendedores de la Ciudad: WordPress y Moodle unificados con un solo ingreso y conexión al CRM." },
]

const STEPS = [
  { n: "01", t: "Relevamiento", d: "Entendemos el problema antes de escribir una línea de código." },
  { n: "02", t: "Propuesta cerrada", d: "Alcance, fecha de entrega y precio fijo, por escrito." },
  { n: "03", t: "Entregas cortas", d: "Cada dos semanas ves avances y los probás con tu equipo." },
  { n: "04", t: "Soporte y mejora", d: "Acompañamos la operación y sumamos mejoras continuas." },
]

const SECTORS = ["Salud", "Gobierno", "Universidades", "Gremios y obras sociales", "Mutuales", "Medios", "Educación", "Empresas"]



const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"
const h2 = "m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
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
                <a href="#planes" className="rounded-xl bg-white hover:bg-[#FDECEB] px-[22px] py-[14px] font-bold text-[17px] text-[#0B0D12] transition-colors">Planes y precios →</a>
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

        {/* Planes con precio publicado */}
        <section id="planes" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#C8231F]"}>Planes con precio publicado</p>
                <h2 className={h2}>Elegí tu solución y arrancá esta semana.</h2>
                <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Precio fijo por escrito, hasta 3 cuotas sin interés y 10% de descuento por transferencia.</p>
              </div>
              <a href="/precios" target="_blank" rel="noopener noreferrer" className="font-bold text-[#C8231F] hover:text-[#9E1A17]">Ver la lista de precios completa →</a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {SOLUCIONES.map((p) => (
                <a key={p.href} href={p.href} className="db-card group rounded-2xl border border-[#262C37] bg-[#0B0D12] text-white p-6 flex flex-col gap-3 min-h-[250px] hover:border-[#C8231F] transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF6A63]">{p.tag}</span>
                  <span className="font-tight text-[21px] font-bold leading-tight">{p.title}</span>
                  <span className="text-[15px] leading-normal text-[#C3C8D1]">{p.text}</span>
                  <span className="mt-auto font-tight text-2xl font-extrabold">{p.price}</span>
                  <span className="text-sm font-bold text-[#FF6A63] group-hover:translate-x-1 transition-transform">Ver planes →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Necesidades */}
        <section id="servicios" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>¿Qué necesitás resolver?</p>
              <h2 className={h2}>Elegí tu problema y te mostramos la solución.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {NEEDS.map((n) => (
                <Link key={n.num} href={n.href} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-7 flex flex-col gap-3 min-h-[180px] text-[#0E1116]">
                  <div className="w-11 h-11 rounded-xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center font-extrabold text-lg">{n.num}</div>
                  <div className="font-tight text-[22px] font-bold">{n.title}</div>
                  <div className="text-base leading-normal text-[#4A515C]">{n.text}</div>
                  <div className="mt-auto text-[15px] font-bold text-[#C8231F]">Ver cómo funciona →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Productos */}
        <section id="productos" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-wrap gap-12">
            <div className="flex-[1_1_340px] min-w-0 flex flex-col gap-3.5">
              <p className={kicker + " text-[#C8231F]"}>Productos</p>
              <h2 className={h2}>Sistemas probados, listos para implementar.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">No empezamos de cero: adaptamos productos que ya funcionan en producción. Eso baja el plazo y el riesgo.</p>
              <Link href="/productos" className="self-start rounded-xl bg-[#0B0D12] hover:bg-[#1B2029] px-[22px] py-[14px] font-bold text-white transition-colors">Ver todos los productos</Link>
            </div>
            <div className="db-tech flex-[999_1_560px] min-w-0 rounded-[24px] bg-[#0B0D12] p-4 md:p-6 grid sm:grid-cols-2 gap-3">
              {PRODUCTS.map((p, i) => (
                <Link key={p.title} href={"/productos#" + PRODUCT_IDS[i]} className="db-card group rounded-2xl border border-[#262C37] bg-[#161A22] p-5 flex gap-4 items-start text-white">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#C8231F] font-tight font-extrabold flex items-center justify-center group-hover:scale-110 transition-transform">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-col gap-1 min-w-0">
                    <span className="font-tight text-lg font-bold leading-snug group-hover:text-[#FF6A63] transition-colors">{p.title}</span>
                    <span className="text-[15px] leading-normal text-[#C3C8D1]">{p.text}</span>
                  </span>
                </Link>
              ))}
            </div>
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
              <Link href="/casos-de-exito" className="font-bold text-[#C8231F] hover:text-[#9E1A17]">Ver todos los casos →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {CASES.map((c) => (
                <Link key={c.title} href="/casos-de-exito" className="db-card group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col text-[#0E1116]">
                  <div className="aspect-[16/10] overflow-hidden bg-[#0B0D12]">
                    <img src={c.img} alt={c.title} loading="lazy" className="db-kb w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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

        {/* Desarrollo */}
        <section id="desarrollo" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-9">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Desarrollo a medida</p>
              <h2 className={h2}>De la idea a producción, en cuatro pasos claros.</h2>
            </div>
            <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="db-card rounded-2xl border border-[#262C37] bg-[#161A22] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-[32px] font-extrabold text-[#FF6A63]">{s.n}</span>
                  <strong className="text-[19px]">{s.t}</strong>
                  <span className="text-[#C3C8D1] leading-normal">{s.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Sectores */}
        <section className="bg-[#F5F6F8] overflow-hidden">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-6">
            <h2 className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">Sectores donde trabajamos</h2>
          </div>
          <div className="db-marquee pb-16" aria-label={SECTORS.join(", ")}>
            <div className="db-marquee-track" aria-hidden="true">
              {[...SECTORS, ...SECTORS, ...SECTORS, ...SECTORS].map((s, i) => (
                <span key={i} className="shrink-0 rounded-full border border-[#E2E5EA] bg-white px-6 py-3.5 font-semibold text-lg">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Academia DEVISEBIT */}
        <section id="academia" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20">
            <div className="db-tech rounded-[20px] bg-[#0B0D12] text-white p-7 md:p-10 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-center">
              <div className="flex flex-col gap-4">
                <p className={kicker + " text-[#FF6A63]"}>Academia DEVISEBIT</p>
                <h2 className="m-0 font-tight text-[30px] md:text-[40px] leading-[1.12] font-extrabold">Cursos de tecnología e IA aplicada, con certificado.</h2>
                <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Para equipos de salud, gestión y administración. También armamos la academia online de tu organización.</p>
                <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <li><a href={ACADEMIA.kit} target="_blank" rel="noopener noreferrer" className="h-full flex flex-col gap-1 rounded-xl border border-white/15 hover:border-[#FF6A63] p-3.5 transition-colors"><strong className="text-[15px]">Kit IA para pymes</strong><span className="text-[13px] text-[#C3C8D1]">50 prompts y 10 automatizaciones paso a paso. Próximamente</span></a></li>
                  <li><a href={ACADEMIA.guias} target="_blank" rel="noopener noreferrer" className="h-full flex flex-col gap-1 rounded-xl border border-white/15 hover:border-[#FF6A63] p-3.5 transition-colors"><strong className="text-[15px]">Guías gratis</strong><span className="text-[13px] text-[#C3C8D1]">Automatizaciones, CRM, ciberseguridad y más</span></a></li>
                  <li><a href={ACADEMIA.cursos} target="_blank" rel="noopener noreferrer" className="h-full flex flex-col gap-1 rounded-xl border border-white/15 hover:border-[#FF6A63] p-3.5 transition-colors"><strong className="text-[15px]">Cursos</strong><span className="text-[13px] text-[#C3C8D1]">Con clases en vivo y certificado verificable</span></a></li>
                </ul>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a href={ACADEMIA.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#FF6A63] hover:bg-[#ff8a85] px-[22px] py-[12px] font-extrabold text-[#0B0D12] transition-colors">Entrar a la Academia →</a>
                  <a href="/transformacion-digital" className="rounded-xl border-2 border-white/20 hover:border-[#FF6A63] px-[22px] py-[10px] font-bold transition-colors">Capacitación para empresas</a>
                </div>
              </div>
              <YoutubeUltimos titulo="Lo último en YouTube: videos y shorts" />
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
