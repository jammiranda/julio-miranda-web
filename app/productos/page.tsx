import CasosRelacionados from "@/components/casos-relacionados"
import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SOLUCIONES, SOLUCION_DE_PRODUCTO } from "@/lib/marca"
import { DEMO_DE_PRODUCTO, demoUrl } from "@/lib/demos"
import ProductosExplorador, { type ProductoFicha } from "@/components/productos-explorador"

export const metadata = pageMeta(
  "Productos de software listos para implementar · DEVISEBIT",
  "Sistemas probados para salud, gremios, obras sociales, gobierno y pymes: clínicas, asistente de WhatsApp con IA, padrón y afiliados, tableros, apps, academias online, votación, gestor documental y las apps gratis de la Familia Mate.",
  "/productos",
)

const INST = "Instituciones, salud y gremios"
const GEST = "Gestión y datos"

const BASE: Omit<ProductoFicha, "planes" | "demo">[] = [
  { id: "clinicas", grupo: INST, title: "Sistema para clínicas", vista: "clinicas", bajada: "Turnos, historia clínica, recetas y facturación de prestaciones en un solo sistema, con tablero para la dirección.", items: ["Agenda y turnos online", "Historia clínica electrónica", "Prestaciones y facturación", "Tablero de gestión"], prueba: "sistema de salud con historia clínica electrónica, en uso todos los días." },
  { id: "crm", grupo: INST, title: "Padrón, afiliados y obra social", vista: "crm", bajada: "Padrón único con grupos familiares, aportes, órdenes y autorizaciones en línea, prestadores y cartilla.", items: ["Padrón y grupos familiares", "Aportes y cuotas al día", "Órdenes y autorizaciones", "Prestadores y cartilla"], prueba: "gestión gremial y de obra social en San Luis (Comunidad USL)." },
  { id: "academias", grupo: INST, title: "Academias online", vista: "academias", bajada: "Cursos, clases en vivo, inscripciones, pagos y certificados verificables, con tu marca y tu dominio.", items: ["Cursos y clases en vivo", "Inscripciones y pagos", "Exámenes y asistencia", "Certificados verificables"], prueba: "Comunidad USL, con más de 1.000 inscriptos en un año." },
  { id: "app", grupo: INST, title: "App y credencial digital", vista: "app", bajada: "Tu institución en el celular de cada socio o vecino: credencial, beneficios, novedades y avisos.", items: ["Credencial digital", "Beneficios y comercios", "Novedades y avisos", "iOS y Android"], prueba: "app Soy Tigre del Municipio de Tigre, con más de 80.000 vecinos suscriptos." },
  { id: "votacion", grupo: INST, title: "Votación y control de acceso", vista: "votacion", bajada: "Elecciones sin papel con padrón de votantes y resultados al instante; acceso con QR y molinetes.", items: ["Votación electrónica", "Padrón de votantes", "Acceso con QR y molinetes", "Resultados al instante"], prueba: "votación implementada para un Consejo Superior y control de acceso con molinetes." },
  { id: "whatsapp", grupo: GEST, title: "Asistente de WhatsApp con IA", vista: "whatsapp", bajada: "Atiende las 24 horas, da y confirma turnos, califica consultas y deriva a una persona cuando hace falta.", items: ["Responde a toda hora", "Da y confirma turnos", "Deriva a tu equipo", "Registra todo en el CRM"], prueba: "Bit, el asistente de DEVISEBIT, atiende WhatsApp e Instagram todos los días." },
  { id: "tableros", grupo: GEST, title: "Tableros de control", vista: "tableros", bajada: "Los números de tu organización al día, con alertas, desde tus planillas o tus sistemas.", items: ["Indicadores en tiempo real", "Alertas automáticas", "Reportes para la dirección", "Desde Excel o tus sistemas"], prueba: "tableros y reportes para la Subsecretaría de Modernización de la UBA." },
  { id: "documental", grupo: GEST, title: "Gestor documental con firma digital", vista: "documental", bajada: "Expedientes digitales ordenados, con firma, permisos, vencimientos y el historial de cada cambio.", items: ["Expedientes digitales", "Firma digital", "Vencimientos y avisos", "Historial de cambios"], prueba: "gestor documental con firma digital en organizaciones con procesos propios." },
]

const PRODUCTOS: ProductoFicha[] = BASE.map((p) => {
  const sol = SOLUCIONES.find((x) => x.id === SOLUCION_DE_PRODUCTO[p.id])
  return { ...p, planes: sol?.href, demo: DEMO_DE_PRODUCTO[p.id] ? demoUrl(DEMO_DE_PRODUCTO[p.id]) : undefined }
})

const PYMES = [
  { tag: "Páginas web", title: "Web por Suscripción", text: "Tu negocio con web propia en 48 horas: modelos por rubro, dominio, WhatsApp y asistente. Sin costo de armado y sin permanencia.", href: "/webs", cta: "Ver los modelos" },
  { tag: "Marca blanca", title: "Panel de contenido", text: "Redes, web, anuncios y contactos en un solo panel con tu marca, con estadísticas al día.", href: "/demos?d=panel-de-contenido#pedir", cta: "Pedir la demo" },
  { tag: "Ventas", title: "CRM y ventas", text: "Contactos, oportunidades y seguimiento conectados a WhatsApp y al correo, con recordatorios y tablero.", href: "/sistemas", cta: "Planes y precios" },
]

const MATE = [
  { title: "MateBot", text: "Tu asistente personal por audio. Le hablás como a un amigo y te ordena turnos, recordatorios y listas, con un resumen cada mañana.", donde: "Telegram y WhatsApp", href: "https://matebot.devisebit.com", cta: "Probar MateBot" },
  { title: "MateCuentas", text: "Los gastos de la casa, la familia o la pareja: se cargan por audio, foto del ticket o desde MateBot, con cuotas, dólares y presupuesto.", donde: "Web, en el celular", href: "https://matecuentas.devisebit.com", cta: "Probar MateCuentas" },
]

const STEPS = [
  { n: "01", t: "Relevamos", d: "Entendemos cómo trabaja tu equipo y qué tiene que resolver el sistema." },
  { n: "02", t: "Configuramos", d: "Partimos del producto en producción y lo adaptamos a tu marca y tus reglas." },
  { n: "03", t: "Probamos", d: "Tu equipo lo usa con casos reales antes de abrirlo al público." },
  { n: "04", t: "Acompañamos", d: "Soporte, mejoras y un tablero para medir cómo se usa." },
]

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Productos", "/productos"]])} />
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-14 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
            <div className="flex flex-col gap-4">
              <p className={kicker + " text-[#FF6A63]"}>Productos DEVISEBIT</p>
              <h1 className="m-0 font-tight text-[38px] md:text-[56px] leading-[1.04] font-extrabold tracking-[-0.02em]">Software que ya funciona. <span className="text-[#FF6A63]">Adaptado a tu organización.</span></h1>
              <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[680px]">No empezamos de cero: partimos de productos propios en producción y los configuramos con tu marca y tus reglas. Menos plazo, menos riesgo y precio cerrado.</p>
              <nav aria-label="Secciones de productos" className="flex flex-wrap gap-2 pt-2">
                {[["#plataformas", "Para instituciones"], ["#pymes", "Para pymes y negocios"], ["#familia-mate", "Apps gratis · Familia Mate"]].map(([h, t]) => (
                  <a key={h} href={h} className="rounded-lg border border-white/15 hover:border-[#FF6A63] px-4 py-2.5 text-[15px] font-semibold text-white transition-colors">{t}</a>
                ))}
              </nav>
            </div>
            <dl className="m-0 grid grid-cols-3 lg:grid-cols-1 gap-3">
              {[["+80.000", "vecinos usan la app Soy Tigre"], ["+1.000", "inscriptos en un año en Comunidad USL"], ["17 años", "con sistemas en producción"]].map(([n, l]) => (
                <div key={l} className="border-l-2 border-[#C8231F] pl-4 py-1">
                  <dt className="font-tight text-[26px] md:text-[32px] font-extrabold leading-none">{n}</dt>
                  <dd className="m-0 mt-1 text-[14px] text-[#C3C8D1]">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section id="plataformas" aria-labelledby="t-plataformas" className="scroll-mt-[72px] bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#FF6A63]"}>Plataformas</p>
                <h2 id="t-plataformas" className="m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold">Elegí un producto y miralo por dentro.</h2>
              </div>
              <p className="m-0 text-[15px] text-[#9AA1AD] max-w-[360px]">Las vistas son de ejemplo. Las demos completas se piden con un email y te llegan para probarlas.</p>
            </div>
            <ProductosExplorador productos={PRODUCTOS} />
          </div>
        </section>

        <section id="pymes" aria-labelledby="t-pymes" className="scroll-mt-[72px] bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Para pymes y negocios</p>
              <h2 id="t-pymes" className="m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold">Listos para contratar, sin proyecto a medida.</h2>
            </div>
            <ul className="m-0 p-0 list-none grid md:grid-cols-3 gap-4">
              {PYMES.map((x) => (
                <li key={x.title}>
                  <Link href={x.href} className="db-card group h-full rounded-2xl border border-[#E2E5EA] bg-white hover:border-[#C8231F] p-7 flex flex-col gap-3 text-[#0E1116] transition-colors">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C8231F]">{x.tag}</span>
                    <strong className="font-tight text-[22px] leading-snug">{x.title}</strong>
                    <span className="text-[15px] leading-relaxed text-[#4A515C]">{x.text}</span>
                    <span className="mt-auto pt-3 font-bold text-[#C8231F]">{x.cta} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="familia-mate" aria-labelledby="t-mate" className="scroll-mt-[72px] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 grid lg:grid-cols-[1fr_1.5fr] gap-10 items-center">
            <div className="flex flex-col gap-4">
              <p className={kicker + " text-[#C8231F]"}>Familia Mate · apps gratis</p>
              <h2 id="t-mate" className="m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold">Apps para el día a día, hechas por DEVISEBIT. 🧉</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Productos propios, gratis para empezar y con un plan Plus opcional. Son la mejor muestra de cómo trabajamos: inteligencia artificial útil, simple y en producción.</p>
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-4">
              {MATE.map((m) => (
                <li key={m.title}>
                  <a href={m.href} target="_blank" rel="noopener noreferrer" className="db-card group h-full rounded-2xl bg-[#0B0D12] text-white p-7 flex flex-col gap-3 border border-[#0B0D12] hover:border-[#C8231F] transition-colors">
                    <span className="self-start rounded-md bg-[#C8231F] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest">Gratis</span>
                    <strong className="font-tight text-[26px]">{m.title}</strong>
                    <span className="text-[15px] leading-relaxed text-[#C3C8D1]">{m.text}</span>
                    <span className="text-[13px] text-[#9AA1AD]">{m.donde}</span>
                    <span className="mt-auto pt-3 font-bold text-[#FF8A85] group-hover:text-white">{m.cta} →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-[72px] flex flex-col gap-7">
            <h2 className="m-0 font-tight text-[30px] md:text-[36px] font-extrabold">Cómo lo implementamos</h2>
            <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="db-card rounded-2xl border border-[#262C37] bg-[#161A22] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-[30px] font-extrabold text-[#FF6A63]">{s.n}</span>
                  <strong className="text-[19px]">{s.t}</strong>
                  <span className="text-[#C3C8D1] leading-normal">{s.d}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link href="/demos" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Pedir una demo</Link>
              <Link href="/contacto" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-bold text-[17px] text-white transition-colors">Contanos tu proyecto</Link>
            </div>
          </div>
        </section>
        <CasosRelacionados ids={[5, 9, 3]} lang="es" />
      </main>
      <Footer />
    </div>
  )
}
