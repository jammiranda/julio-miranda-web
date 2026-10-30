import Link from "next/link"
import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { MessageCircle, CalendarClock, Download, Tag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"
import Redes from "@/components/redes"
import { ASESORIA } from "@/lib/marca"

const TITULO = "Asesoría y consultoría en tecnología e IA · DEVISEBIT"
const DESCRIPCION = "Un equipo de tecnología e IA a disposición de tu organización, por horas o por mes: horas sueltas, bolsas de horas, abonos con responsable único, plan anual y licencias."
const OG = { url: "/images/landings/og-asesoria.jpg", width: 1200, height: 630, alt: "Asesoría y consultoría en tecnología e IA · DEVISEBIT" }
const base = pageMeta(TITULO, DESCRIPCION, "/asesoria")
export const metadata: Metadata = {
  ...base,
  openGraph: { ...base.openGraph, images: [OG] },
  twitter: { ...base.twitter, images: [OG.url] },
}

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20info%20sobre%20la%20asesor%C3%ADa%20en%20tecnolog%C3%ADa%20e%20IA"
const LISTA = "https://sistema.devisebit.com/lista-precios"
const TEST = "/diagnostico"

const RESUMEN = [
  { k: "Para quién", t: "Pymes, instituciones y equipos directivos", d: "Que tienen que decidir sobre software, proveedores, IA, datos o procesos, y no tienen a alguien de tecnología que los respalde." },
  { k: "Qué resolvemos", t: "Decisiones, no solo respuestas", d: "Qué comprar y qué no, cómo ordenar procesos antes de automatizar, cómo usar IA sin exponer datos, cómo medir si funciona." },
  { k: "Cómo trabajamos", t: "Un responsable único", d: "Cada hora queda registrada con fecha, persona y tema, y la ves en tu portal (portal.devisebit.com)." },
  { k: "Respaldo", t: "Sistemas en producción desde 2009", d: "Asesoramos con lo que usamos todos los días: CRM y panel propio, asistente de WhatsApp con IA, academia online, portales de clientes." },
]

const FORMAS = [
  { n: "01", t: "Hora suelta", d: "Una duda puntual: revisar un presupuesto de software, elegir un proveedor, destrabar un problema.", precios: [["Hora técnica", "$55.000"], ["Hora estratégica", "$85.000"]], nota: "USD 35 y USD 55 desde el exterior" },
  { n: "02", t: "Bolsa de horas", d: "Vas a necesitar consultas a lo largo de los meses, pero sin agenda fija. Pagás por adelantado a menor valor por hora.", precios: [["10 horas · 90 días", "$650.000"], ["20 horas · 120 días", "$1.200.000"], ["40 horas · 180 días", "$2.200.000"]], nota: "Cualquier perfil del equipo" },
  { n: "03", t: "Abono mensual", d: "Querés a alguien que conozca tu organización, con reuniones fijas y un responsable de DEVISEBIT.", precios: [["Desde", "$390.000/mes"]], nota: "Tres niveles, abajo en detalle" },
  { n: "04", t: "Plan anual", d: "Ya sabés que vas a trabajar el año entero con nosotros: mismo abono, con meses bonificados y precio congelado.", precios: [["Pagás 10 meses", "por adelantado"], ["o 12 cuotas", "10% menos"]], nota: "Precio congelado por 12 meses" },
  { n: "05", t: "Licencias", d: "Querés usar nuestros productos con tu marca, o que administremos tus licencias de Google Workspace, IA y dominios.", precios: [["Marca blanca", "desde $79.000/mes"]], nota: "Detalle en la sección Licencias" },
]

const ABONOS = [
  { horas: "6 h por mes", t: "Asesor de cabecera", precio: "$390.000", usd: "USD 250", min: "Mínimo 3 meses", items: ["Una reunión cada 15 días", "Consultas por WhatsApp sin descontar horas", "Revisión de presupuestos y propuestas de proveedores antes de firmar", "Informe mensual con lo resuelto y lo pendiente"] },
  { horas: "16 h por mes", t: "Tecnología a tiempo parcial", precio: "$890.000", usd: "USD 570", min: "Mínimo 6 meses", destacado: true, items: ["Un responsable de tecnología sin sumarlo a la planta", "Comité mensual con la dirección", "Plan de sistemas y seguimiento de proveedores", "Seguridad, datos y tablero de indicadores"] },
  { horas: "24 h por mes", t: "Transformación acompañada", precio: "$1.290.000", usd: "USD 830", min: "Mínimo 3 meses", items: ["Implementamos la hoja de ruta con tu equipo", "Pilotos cortos y medibles", "Gestión del cambio", "Capacitación con certificado de ACADEMIA DEVISEBIT y seguimiento de indicadores"] },
]
const SIEMPRE = ["Horas registradas en tu portal", "Informe mensual", "Acceso a las guías de la Academia", "Prioridad para cotizar proyectos"]

const LICENCIAS = [
  { t: "Panel de contenido · marca blanca", d: "Redes, web, anuncios y contactos en un solo panel con tu marca, con actualizaciones y soporte.", v: "$190.000 de puesta en marcha + $79.000/mes", n: "Mínimo 6 meses" },
  { t: "Academia, padrón, obras sociales, CRM", d: "El abono de la lista de precios vigente es la licencia de uso.", v: "Según lista de precios", n: "Anual con 2 meses bonificados" },
  { t: "Gestión de licencias de terceros", d: "Altas, usuarios, pagos y renovaciones de Google Workspace, herramientas de IA, dominios y similares.", v: "Costo de la licencia + 15%", n: "Mínimo $15.000/mes" },
]

const DIRECCION = [
  { area: "Dirección", titulo: "Estrategia de tecnología e IA", d: "Arquitectura, proveedores y presupuestos grandes. Lo atiende la dirección de DEVISEBIT." },
  { area: "Transformación digital", titulo: "Diagnóstico y hoja de ruta", d: "Diagnóstico de madurez digital, hoja de ruta, gestión del cambio y Programa Kit 4.0. Lo atiende el equipo de transformación digital." },
]
const AREAS = [
  { t: "Coordinación", d: "Agenda, seguimiento e informes de tu abono." },
  { t: "Análisis y proyectos", d: "Relevamiento de procesos, análisis funcional y gestión de proyectos." },
  { t: "Desarrollo", d: "Integraciones, revisión de sistemas y de código de terceros." },
  { t: "Diseño y marketing", d: "Marca, redes, contenido y anuncios." },
  { t: "Calidad y soporte", d: "Pruebas, soporte técnico y monitoreo." },
]

const CONDICIONES = [
  ["Registro", "cada hora se carga con fecha, persona y tema, y la ves en tu portal."],
  ["Fracción mínima", "30 minutos. Las consultas cortas por WhatsApp dentro de un abono no descuentan horas."],
  ["Horas no usadas del abono", "pasan al mes siguiente una sola vez."],
  ["Horas extra", "a $65.000 la hora, siempre con aviso previo."],
  ["Bolsas de horas", "una hora estratégica descuenta 1,5 horas del paquete. En los abonos no hay diferencia: el responsable decide quién atiende cada tema."],
  ["Precios", "se revisan cada trimestre. El plan anual queda congelado por 12 meses."],
  ["Baja", "cumplido el mínimo, con 30 días de aviso."],
  ["Pago", "transferencia a DEVISEBIT SRL con 10% de descuento, o tarjeta hasta 3 cuotas sin interés. Horas sueltas y bolsas, por adelantado; abonos, mes adelantado."],
  ["Factura", "de DEVISEBIT SRL, con contrato."],
  ["Financiamiento", "el diagnóstico y el acompañamiento pueden encuadrarse en el Programa Kit 4.0 si tu organización califica; lo verificamos con vos antes de empezar."],
]

const PREGUNTAS = [
  { q: "¿Es una duda puntual o algo que va a seguir?", a: [["Puntual", "hora suelta"], ["Sigue", "bolsa o abono"]] },
  { q: "¿Necesitás a alguien que decida y acompañe, o horas para consultar cuando surja?", a: [["Decidir y acompañar", "abono"], ["Consultar", "bolsa de horas"]] },
  { q: "¿Tenés a alguien de tecnología en tu organización?", a: [["No", "Tecnología a tiempo parcial"], ["Sí", "Asesor de cabecera para respaldarlo"]] },
]

const EMPEZAR = [
  { n: "01", t: "Primera reunión gratuita", d: "Hacé el autodiagnóstico gratis y, con tu resultado, pedí la reunión de 30 minutos sin costo." },
  { n: "02", t: "Propuesta por escrito", d: "Formato, horas, responsable y valor." },
  { n: "03", t: "Alta en tu portal", d: "Desde ahí ves las horas, los informes y los pagos." },
]

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"
const h2 = "m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold"
const btnSec = "inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"

export default function AsesoriaPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Asesoría y consultoría en tecnología e IA"
          title={<>Un equipo de tecnología e IA a disposición de tu organización, <span className="text-[#FF6A63]">por horas o por mes.</span></>}
          sub="Tomá buenas decisiones de tecnología sin tener un área de sistemas propia. Elegís cómo trabajar con nosotros: una consulta puntual, un paquete de horas o un abono mensual con un responsable único y todo registrado en tu portal."
        >
          <div className="flex flex-wrap gap-2.5 mt-2">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Consultar por WhatsApp</a>
            <Link href={TEST} className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Hacé el test gratis y pedí tu reunión</Link>
            <a href={ASESORIA.pdf} download className={btnSec}><Download size={19} aria-hidden="true" /> Descargar el PDF</a>
          </div>
          <nav aria-label="En esta página" className="flex flex-wrap gap-2 mt-3">
            {[["#formas", "Formas de contratar"], ["#abonos", "Abonos"], ["#licencias", "Licencias"], ["#equipo", "Quién te atiende"], ["#elegir", "Cómo elegir"]].map(([h, t]) => (
              <a key={h} href={h} className="rounded-full border border-white/15 hover:border-[#FF6A63] px-4 py-2 text-sm font-semibold text-[#D3D7DE] hover:text-white transition-colors">{t}</a>
            ))}
          </nav>
        </DbHero>

        {/* En una página */}
        <section aria-labelledby="t-res" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>En una página</p>
              <h2 id="t-res" className={h2}>Alguien de tecnología de tu lado, sin sumarlo a la planta.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {RESUMEN.map((r) => (
                <article key={r.k} className="db-card rounded-2xl border border-[#E2E5EA] p-6 flex flex-col gap-2.5">
                  <div className="w-11 h-1 rounded bg-[#C8231F]" />
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#C8231F]">{r.k}</p>
                  <h3 className="m-0 font-tight text-[20px] font-bold leading-snug">{r.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{r.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cinco formas */}
        <section id="formas" aria-labelledby="t-for" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Cinco formas de contratar</p>
              <h2 id="t-for" className={h2}>De la consulta puntual al acompañamiento de todo el año.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Podés empezar por una y pasar a otra cuando lo necesites.</p>
            </div>
            <ol className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {FORMAS.map((f) => (
                <li key={f.n} className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-3xl font-extrabold text-[#FF6A63]">{f.n}</span>
                  <h3 className="m-0 text-lg font-bold leading-snug">{f.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{f.d}</p>
                  <dl className="m-0 mt-auto pt-3 border-t border-white/10 flex flex-col gap-1.5">
                    {f.precios.map(([k, v]) => (
                      <div key={k} className="flex flex-col text-[14px] leading-snug"><dt className="text-[#9AA1AD]">{k}</dt><dd className="m-0 font-bold text-[15px]">{v}</dd></div>
                    ))}
                  </dl>
                  <span className="text-[13px] text-[#9AA1AD]">{f.nota}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-[#C8231F]/60 bg-[#C8231F]/10 p-5 md:p-6 flex flex-col gap-1.5">
              <strong className="text-sm uppercase tracking-[0.14em] text-[#FF6A63]">Primera reunión sin costo</strong>
              <p className="m-0 text-[16px] leading-relaxed text-[#E6E8EC]">La primera reunión es gratuita y dura 30 minutos. Para aprovecharla, antes hacés el autodiagnóstico de madurez digital (10 minutos, gratis): así llegamos con tus datos a la reunión y vamos directo a lo que necesitás decidir.</p>
            </div>
          </div>
        </section>

        {/* Abonos */}
        <section id="abonos" aria-labelledby="t-abo" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Los abonos, en detalle</p>
              <h2 id="t-abo" className={h2}>Tres niveles según cuánto acompañamiento necesitás.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">En los tres tenés un responsable único y un informe mensual. Valores finales en pesos, vigentes al 1/11/2026; referencia en dólares para quien paga desde el exterior.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {ABONOS.map((a) => (
                <article key={a.t} className={"db-card rounded-2xl bg-white p-7 flex flex-col gap-3 " + (a.destacado ? "border-2 border-[#C8231F]" : "border border-[#E2E5EA]")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#C8231F]">{a.horas}</span>
                    {a.destacado && <span className="rounded-full bg-[#C8231F] px-3 py-1 text-xs font-bold text-white">Si no tenés área de sistemas</span>}
                  </div>
                  <h3 className="m-0 font-tight text-[23px] font-bold leading-snug">{a.t}</h3>
                  <div><span className="font-tight text-3xl font-extrabold">{a.precio}</span><span className="text-[15px] font-semibold text-[#4A515C]"> /mes</span><span className="block text-sm text-[#4A515C]">{a.usd} · {a.min}</span></div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                    {a.items.map((i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>)}
                  </ul>
                  <a href={WA} target="_blank" rel="noopener noreferrer" className="mt-auto rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 text-center font-bold text-white transition-colors">Consultar este abono</a>
                </article>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h3 className="m-0 text-lg font-bold">Lo que siempre incluye</h3>
                <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-2">
                  {SIEMPRE.map((s) => <li key={s} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{s}</li>)}
                </ul>
                <p className="m-0 text-sm text-[#4A515C]"><strong className="text-[#0E1116]">Plan anual:</strong> cualquier abono por 12 meses. Pagás 10 meses por adelantado, o 10% menos en 12 cuotas.</p>
              </div>
              <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h3 className="m-0 text-lg font-bold">Qué no incluye</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">Desarrollo de software, diseño y campañas. Si la asesoría detecta un proyecto, lo cotizamos aparte con alcance, plazos y precio por escrito. El 50% de las horas usadas ese mes se descuenta del proyecto si lo contratás dentro de los 60 días.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Licencias */}
        <section id="licencias" aria-labelledby="t-lic" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Licencias</p>
              <h2 id="t-lic" className={h2}>Nuestros productos con tu marca, o tus licencias en orden.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Usá nuestros productos sin pagar un desarrollo a medida, o delegá la administración de tus licencias.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {LICENCIAS.map((l) => (
                <article key={l.t} className="db-card rounded-2xl border border-[#E2E5EA] p-6 flex flex-col gap-2.5">
                  <h3 className="m-0 font-tight text-[20px] font-bold leading-snug">{l.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{l.d}</p>
                  <div className="mt-auto pt-3 border-t border-[#E2E5EA]"><strong className="block text-[16px]">{l.v}</strong><span className="text-sm text-[#4A515C]">{l.n}</span></div>
                </article>
              ))}
            </div>
            <p className="m-0 text-[15px] text-[#4A515C]">Los abonos de cada producto están en la <a href={LISTA} target="_blank" rel="noopener noreferrer" className="font-bold text-[#C8231F] underline underline-offset-2">lista de precios vigente</a>.</p>
          </div>
        </section>

        {/* Quién te atiende */}
        <section id="equipo" aria-labelledby="t-eq" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Quién te atiende</p>
              <h2 id="t-eq" className={h2}>Un responsable único coordina tu cuenta.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Las horas las da la persona del equipo que mejor conoce cada tema.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {DIRECCION.map((p) => (
                <article key={p.area} className="rounded-2xl border border-[#262C37] bg-[#161A22] p-6 md:p-7 flex flex-col gap-2">
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#FF6A63]">{p.area}</p>
                  <h3 className="m-0 font-tight text-[24px] font-bold">{p.titulo}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{p.d}</p>
                </article>
              ))}
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {AREAS.map((a) => (
                <li key={a.t} className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 flex flex-col gap-1.5">
                  <strong className="text-[16px]">{a.t}</strong>
                  <span className="text-[14px] leading-relaxed text-[#C3C8D1]">{a.d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cómo elegir y cómo empezar */}
        <section id="elegir" aria-labelledby="t-ele" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid lg:grid-cols-[1.25fr_1fr] gap-10 items-start">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <p className={kicker + " text-[#C8231F]"}>Cómo elegir</p>
                <h2 id="t-ele" className={h2}>Tres preguntas alcanzan.</h2>
              </div>
              <ol className="m-0 p-0 list-none flex flex-col gap-3">
                {PREGUNTAS.map((p, i) => (
                  <li key={p.q} className="rounded-2xl border border-[#E2E5EA] p-5 flex gap-4">
                    <span className="shrink-0 w-10 h-10 rounded-xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center font-extrabold">{i + 1}</span>
                    <div className="flex flex-col gap-2 min-w-0">
                      <strong className="text-[17px] leading-snug">{p.q}</strong>
                      <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                        {p.a.map(([k, v]) => <li key={k} className="rounded-full bg-[#F5F6F8] px-3 py-1.5 text-sm"><span className="font-bold">{k}:</span> {v}</li>)}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <p className={kicker + " text-[#C8231F]"}>Cómo empezar</p>
                <h2 className="m-0 font-tight text-[28px] md:text-[34px] leading-[1.12] font-extrabold">Empezar es simple.</h2>
              </div>
              <ol className="m-0 p-0 list-none flex flex-col gap-3">
                {EMPEZAR.map((e) => (
                  <li key={e.n} className="db-card rounded-2xl border border-[#E2E5EA] bg-[#F5F6F8] p-5 flex gap-4 items-start">
                    <span className="font-tight text-2xl font-extrabold text-[#C8231F]">{e.n}</span>
                    <div className="flex flex-col gap-1"><strong className="text-[17px]">{e.t}</strong><span className="text-[15px] text-[#4A515C]">{e.d}</span></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Condiciones */}
        <section aria-labelledby="t-con" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Condiciones</p>
              <h2 id="t-con" className="m-0 font-tight text-[28px] md:text-[34px] leading-[1.12] font-extrabold">Todo claro desde el principio.</h2>
            </div>
            <ul className="m-0 p-0 list-none grid md:grid-cols-2 gap-x-8 gap-y-3">
              {CONDICIONES.map(([k, v]) => (
                <li key={k} className="flex gap-2.5 text-[15px] leading-relaxed"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span><span><strong>{k}:</strong> {v}</span></li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <a href={ASESORIA.pdf} download className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0E1116] hover:bg-[#0E1116] hover:text-white px-5 py-3 font-bold transition-colors"><Download size={18} aria-hidden="true" /> Descargar el PDF con todos los valores</a>
              <a href={LISTA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C3C8D1] hover:border-[#C8231F] px-5 py-3 font-bold transition-colors"><Tag size={18} aria-hidden="true" /> Ver la lista de precios</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">¿Arrancamos con una primera reunión gratuita?</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Hacé el autodiagnóstico, contanos qué tenés que decidir y te proponemos el formato, las horas y el responsable, por escrito.</p>
              <Redes />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> WhatsApp</a>
              <Link href={TEST} className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Hacé el test gratis y pedí tu reunión</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
