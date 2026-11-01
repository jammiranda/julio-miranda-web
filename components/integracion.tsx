import Link from "next/link"
import ComparativaAnimada from "@/components/comparativa-animada"

type Lang = "es" | "en"

const T = {
  es: {
    kicker: "Lo que nos diferencia",
    h2a: "Cualquiera arma piezas sueltas.",
    h2b: "Lo difícil es que todo funcione junto.",
    p: "Hoy con IA cualquiera levanta un bot, una web o una automatización en una tarde. El problema llega después: datos duplicados, sistemas que no se hablan, nadie que responda cuando algo se rompe. DEVISEBIT hace lo que no se ve y es lo que decide si un proyecto funciona: integrar.",
    centro: "Tu operación",
    nodos: ["WhatsApp", "Web", "CRM", "Pagos", "Facturación", "Tableros", "IA", "Tus sistemas"],
    cmpT: "La diferencia, fila por fila",
    cmpA: "Piezas sueltas",
    cmpB: "Integrado por DEVISEBIT",
    filas: [
      ["Cada herramienta guarda su propia versión de los datos", "Un dato único que viaja entre todos los sistemas"],
      ["Cuando algo falla, cada proveedor señala al otro", "Un responsable único que responde de punta a punta"],
      ["Se descubre el error cuando el cliente se queja", "Alertas y registro: se detecta antes de que se note"],
      ["Funciona en la demo y se rompe con datos reales", "Probado con tus datos reales antes de salir"],
    ],
    pruebaT: "No es teoría: lo hacemos desde 2009",
    pruebas: [
      ["+150", "proyectos en producción"],
      ["17", "años integrando sistemas"],
      ["1", "responsable por proyecto"],
    ],
    caso: "Academia BA Emprende (Gobierno de la Ciudad): WordPress, Moodle y CRM unificados con un solo ingreso. Municipio de Tigre: app, comercios y tarjetas conectados en una sola gestión.",
    garT: "Nuestro método de integración",
    gar: [
      ["Mapa", "Antes de tocar nada, relevamos qué sistemas, datos y personas intervienen y qué se conecta con qué."],
      ["Conexión", "Unimos WhatsApp, web, CRM, pagos, facturación, tableros y tus sistemas actuales."],
      ["Prueba", "Cada integración se valida con datos reales, no con ejemplos de demo."],
      ["Control", "Alertas, registro de eventos y tablero para ver que todo siga funcionando."],
      ["Entrega", "Documentación y capacitación para que tu equipo lo opere con autonomía."],
    ],
    cta: "Pedí tu mapa de integración",
    href: "/diagnostico",
    cta2: "Cómo trabajamos",
    href2: "/asesoria",
  },
  en: {
    kicker: "What sets us apart",
    h2a: "Anyone can build loose pieces.",
    h2b: "The hard part is making everything work together.",
    p: "With AI, anyone can spin up a bot, a site or an automation in an afternoon. The trouble comes later: duplicated data, systems that do not talk to each other, nobody answering when something breaks. DEVISEBIT does the part you do not see and that decides whether a project works: integration.",
    centro: "Your operation",
    nodos: ["WhatsApp", "Web", "CRM", "Payments", "Billing", "Dashboards", "AI", "Your systems"],
    cmpT: "The difference, row by row",
    cmpA: "Loose pieces",
    cmpB: "Integrated by DEVISEBIT",
    filas: [
      ["Every tool keeps its own version of the data", "One source of data that flows across all systems"],
      ["When something fails, each vendor blames the other", "One accountable lead, end to end"],
      ["The error shows up when the customer complains", "Alerts and logging: caught before anyone notices"],
      ["Works in the demo, breaks with real data", "Tested with your real data before go-live"],
    ],
    pruebaT: "This is not theory: we have done it since 2009",
    pruebas: [
      ["150+", "projects in production"],
      ["17", "years integrating systems"],
      ["1", "accountable lead per project"],
    ],
    caso: "Academia BA Emprende (City of Buenos Aires): WordPress, Moodle and CRM unified behind a single sign-on. Municipality of Tigre: app, merchants and cards connected in one operation.",
    garT: "Our integration method",
    gar: [
      ["Map", "Before touching anything, we map the systems, data and people involved and what connects to what."],
      ["Connect", "We link WhatsApp, web, CRM, payments, billing, dashboards and your existing systems."],
      ["Test", "Every integration is validated with real data, not demo examples."],
      ["Monitor", "Alerts, event logging and a dashboard to confirm everything keeps working."],
      ["Hand over", "Documentation and training so your team can run it on its own."],
    ],
    cta: "Get your integration map",
    href: "/en/contact",
    cta2: "How we work",
    href2: "/en/advisory",
  },
}

/** Diagrama: la operación del cliente al centro y ocho sistemas conectados por líneas con pulso. */
function Hub({ centro, nodos }: { centro: string; nodos: string[] }) {
  const cx = 300, cy = 210, rx = 235, ry = 150
  const pts = nodos.map((_, i) => {
    const a = (-90 + (360 / nodos.length) * i) * (Math.PI / 180)
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })
  return (
    <svg viewBox="0 0 600 420" role="img" aria-label={centro + ": " + nodos.join(", ")} className="w-full h-auto">
      {pts.map((p, i) => (
        <line key={"l" + i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#FF6A63" strokeWidth="2" className="int-flow" style={{ animationDelay: i * 0.18 + "s" }} />
      ))}
      <circle cx={cx} cy={cy} r="62" fill="#C8231F" />
      <circle cx={cx} cy={cy} r="62" fill="none" stroke="#FF6A63" strokeWidth="2" className="int-pulse" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">{centro.split(" ")[0]}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">{centro.split(" ").slice(1).join(" ")}</text>
      {pts.map((p, i) => (
        <g key={"n" + i}>
          <rect x={p.x - 52} y={p.y - 17} width="104" height="34" rx="17" fill="#161A22" stroke="#3A404B" />
          <text x={p.x} y={p.y + 5} textAnchor="middle" fill="#fff" fontSize="13.5" fontWeight="700">{nodos[i]}</text>
        </g>
      ))}
    </svg>
  )
}

export default function Integracion({ lang = "es", compacta = false }: { lang?: Lang; compacta?: boolean; oscuro?: boolean }) {
  const t = T[lang]
  return (
    <section aria-labelledby={"integ-" + lang} className="db-tech relative overflow-hidden bg-[#0B0D12] text-white">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(900px 480px at 80% 0%, rgba(200,35,31,.35), transparent 70%), radial-gradient(700px 400px at 0% 100%, rgba(200,35,31,.18), transparent 70%)" }} />
      <div className="relative max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col gap-14">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="flex flex-col gap-5">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{t.kicker}</p>
            <h2 id={"integ-" + lang} className="m-0 font-tight text-[34px] md:text-[56px] leading-[1.04] font-extrabold tracking-[-0.02em]">
              {t.h2a} <span className="text-[#FF6A63]">{t.h2b}</span>
            </h2>
            <p className="m-0 text-[17px] md:text-lg leading-relaxed text-[#C3C8D1] max-w-[560px]">{t.p}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={t.href} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">{t.cta} →</Link>
              {!compacta && <Link href={t.href2} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">{t.cta2}</Link>}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 md:p-6"><Hub centro={t.centro} nodos={t.nodos} /></div>
        </div>

        {!compacta && (
          <div className="flex flex-col gap-5">
            <h3 className="m-0 font-tight text-[24px] md:text-[30px] font-extrabold">{t.cmpT}</h3>
            <ComparativaAnimada a={t.cmpA} b={t.cmpB} filas={t.filas as [string, string][]} />
          </div>
        )}
      </div>
    </section>
  )
}
