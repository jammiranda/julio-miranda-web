import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Servicios · DEVISEBIT",
  description: "Desarrollo a medida, inteligencia artificial, tableros, gestión de proyectos IT, transformación digital y soporte. Un solo equipo, con alcance, fecha y precio fijo.",
}

const SERVICES = [
  {
    id: "desarrollo-a-medida",
    title: "Desarrollo a medida",
    text: "Software, apps y webs diseñados sobre tus procesos reales, con alcance, fecha y precio fijo.",
    items: ["Sistemas web de gestión", "Apps para iOS y Android", "Webs conectadas a tus sistemas", "Integraciones con lo que ya usás"],
    caso: "App Soy Tigre del Municipio de Tigre",
  },
  {
    id: "ia",
    title: "Inteligencia artificial aplicada",
    text: "Asistentes de WhatsApp, clasificación de consultas y resúmenes automáticos que ahorran horas.",
    items: ["Asistentes de WhatsApp 24 h", "Clasificación y derivación de consultas", "Extracción automática de datos de la web", "Resúmenes y reportes automáticos"],
    caso: "Web data extraction y chatbots para gestión pública y empresas",
  },
  {
    id: "tableros",
    title: "Tableros e inteligencia de negocio",
    text: "Indicadores al día, alertas y reportes automáticos para decidir con datos.",
    items: ["Tableros en Power BI o web", "Alertas de consumo, costos y ventas", "Reportes mensuales automáticos", "Datos de Excel convertidos en indicadores"],
    caso: "Seguimiento de proyectos de la Subsecretaría de Modernización de la UBA",
  },
  {
    id: "gestion-it",
    title: "Gestión de proyectos IT",
    text: "Dirección de proyectos con metodologías ágiles y un responsable único de punta a punta.",
    items: ["Relevamiento y documentación", "Planificación por entregas cortas", "Coordinación de proveedores", "Seguimiento con indicadores"],
    caso: "Red Federal de Monitoreo Ambiental",
  },
  {
    id: "transformacion",
    title: "Transformación digital",
    text: "Diagnóstico de madurez digital y hoja de ruta para ordenar la organización por etapas.",
    items: ["Diagnóstico de procesos", "Hoja de ruta por etapas", "Capacitación de equipos", "Academias online propias"],
    caso: "Academia BA Emprende del Gobierno de la Ciudad",
  },
  {
    id: "soporte",
    title: "Soporte y ciberseguridad",
    text: "Monitoreo de infraestructura, copias de seguridad y buenas prácticas de seguridad.",
    items: ["Monitoreo y alertas de servidores", "Copias de seguridad", "Mesa de ayuda", "Buenas prácticas y accesos seguros"],
    caso: "Sistemas de monitoreo desplegados en varios sitios",
  },
]

const STEPS = [
  { n: "01", t: "Relevamiento", d: "Entendemos el problema antes de escribir una línea de código." },
  { n: "02", t: "Propuesta cerrada", d: "Alcance, fecha de entrega y precio fijo, por escrito." },
  { n: "03", t: "Entregas cortas", d: "Cada dos semanas ves avances y los probás con tu equipo." },
  { n: "04", t: "Soporte y mejora", d: "Acompañamos la operación y sumamos mejoras continuas." },
]

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Servicios</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Todo lo que necesitás para digitalizar tu organización, en un solo equipo.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">Elegí el servicio y mirá qué incluye, cómo trabajamos y casos reales en producción.</p>
            <nav aria-label="Servicios" className="flex flex-wrap gap-2 mt-4">
              {SERVICES.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-full border border-white/15 hover:border-[#FF6A63] px-4 py-2.5 text-sm font-semibold text-[#D3D7DE] hover:text-white transition-colors">{s.title}</a>
              ))}
            </nav>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <article key={s.id} id={s.id} className="db-card scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-7 flex flex-col gap-3">
                <div className="w-11 h-1 rounded bg-[#C8231F]" />
                <h2 className="m-0 font-tight text-[23px] font-bold">{s.title}</h2>
                <p className="m-0 text-base leading-relaxed text-[#4A515C]">{s.text}</p>
                <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                  {s.items.map((i) => (
                    <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>
                  ))}
                </ul>
                <p className="m-0 mt-auto pt-2 text-sm text-[#4A515C]"><span className="font-bold text-[#0E1116]">Caso real:</span> {s.caso}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="desarrollo" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-9">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Cómo trabajamos</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">De la idea a producción, en cuatro pasos claros.</h2>
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

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold flex-[1_1_520px]">¿No sabés por dónde empezar? Te ayudamos a definirlo en una reunión de 30 minutos.</h2>
            <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Agendar reunión</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
