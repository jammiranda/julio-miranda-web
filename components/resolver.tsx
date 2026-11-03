"use client"
import { useMemo, useState } from "react"
import Link from "next/link"

type Item = { title: string; text: string; href: string; integra: string[]; kw: string }
type Lang = "es" | "en"

const T = {
  es: {
    kicker: "¿Qué necesitás resolver?",
    h2: "Contanos tu objetivo. Armamos la solución integrada.",
    sub: "Escribilo con tus palabras o elegí una opción. Te mostramos qué resolvemos y con qué sistemas lo dejamos conectado.",
    ph: "Ej.: quiero atender más pacientes sin sumar gente",
    chips: "O elegí un caso",
    integra: "Queda integrado con",
    cta: "Ver cómo funciona",
    talk: "Hablar con una persona",
    none: "No encontramos una coincidencia exacta: mirá todo lo que hacemos o escribinos.",
    all: "Ver todos los servicios",
    allHref: "/#productos",
    contact: "/#contacto",
    badge: "Sugerencia",
  },
  en: {
    kicker: "What do you need to solve?",
    h2: "Tell us your goal. We build the integrated solution.",
    sub: "Type it in your own words or pick an option. We show what we solve and which systems it ends up connected to.",
    ph: "E.g. I want to serve more patients without hiring",
    chips: "Or pick a case",
    integra: "Integrated with",
    cta: "See how it works",
    talk: "Talk to a person",
    none: "No exact match. See everything we do or write to us.",
    all: "See all services",
    allHref: "/en/services",
    contact: "/en/contact",
    badge: "Suggested",
  },
}

export const ITEMS_ES: Item[] = [
  { title: "Atender más sin sumar personal", text: "Asistente de WhatsApp con IA que da turnos y responde las 24 horas, y deriva a una persona cuando hace falta.", href: "/whatsapp", integra: ["Agenda y turnos", "CRM", "Historia clínica o padrón", "Pagos"], kw: "whatsapp atender turnos bot ia chat pacientes clientes atencion 24 horas personal" },
  { title: "Ordenar una clínica o centro", text: "Turnos, historia clínica electrónica y facturación en un solo sistema.", href: "/productos#clinicas", integra: ["Facturación", "Obras sociales", "Recetas", "Tablero"], kw: "clinica centro salud historia clinica turnos facturacion medico consultorio" },
  { title: "Ver los números al día", text: "Tableros con alertas de consumo, costos y ventas, alimentados desde tus sistemas.", href: "/productos#tableros", integra: ["Tus sistemas actuales", "Planillas", "Facturación", "Alertas por WhatsApp"], kw: "tablero numeros indicadores costos ventas datos reportes control metricas excel" },
  { title: "Gestionar afiliados y clientes", text: "CRM a medida con padrón, autorizaciones y embudo de ventas.", href: "/productos#crm", integra: ["WhatsApp", "Padrón", "Autorizaciones", "Cobranzas"], kw: "crm afiliados clientes padron autorizaciones ventas embudo obra social prestadores" },
  { title: "Capacitar a mucha gente", text: "Academia online con pagos, app y certificados verificables.", href: "/comunidad", integra: ["Medios de pago", "Certificados", "App", "CRM"], kw: "capacitar cursos academia online certificados alumnos formacion educacion" },
  { title: "Tener una web que trabaje", text: "Sitios con turnos, formularios y WhatsApp conectados a tus sistemas.", href: "/webs", integra: ["CRM", "WhatsApp", "Agenda", "Analítica"], kw: "web sitio pagina internet landing tienda formulario" },
  { title: "Crecer en redes y anuncios", text: "Reels, placas y campañas en Meta y Google, todas las semanas, con resultados medidos.", href: "/redes", integra: ["Meta y Google", "CRM", "WhatsApp", "Tablero de resultados"], kw: "redes instagram facebook anuncios marketing publicidad campañas reels contenido seguidores" },
  { title: "Transformar la organización", text: "Diagnóstico, hoja de ruta, pilotos y capacitación con certificado. Con orientación sobre el Kit 4.0.", href: "/transformacion-digital", integra: ["Tus procesos", "Tus sistemas", "Tu equipo", "Financiamiento Kit 4.0"], kw: "transformacion digital consultoria diagnostico hoja de ruta kit pyme digitalizar" },
  { title: "Ordenar un gremio o comunidad", text: "Padrón, beneficios, app y academia con tu marca, todo conectado.", href: "/comunidad", integra: ["Padrón", "App", "Academia", "Pagos"], kw: "gremio sindicato comunidad mutual afiliados beneficios padron app" },
  { title: "Decidir con alguien de tecnología al lado", text: "Asesoría en tecnología e IA por horas o con abono mensual, con un responsable único.", href: "/asesoria", integra: ["Tus proveedores", "Tus sistemas", "Tu presupuesto", "Informes mensuales"], kw: "asesoria asesor consultoria tecnologia proveedores decidir presupuesto cto ia horas" },
]

export const ITEMS_EN: Item[] = [
  { title: "Serve more people without hiring", text: "A WhatsApp AI assistant that books appointments and answers around the clock, and hands off to a person when needed.", href: "/en/products", integra: ["Scheduling", "CRM", "Health records or member registry", "Payments"], kw: "whatsapp serve support appointments bot ai chat patients customers 24 hours staff hiring" },
  { title: "Run a clinic or care center", text: "Scheduling, electronic health records and billing in one system.", href: "/en/products", integra: ["Billing", "Insurers", "Prescriptions", "Dashboard"], kw: "clinic center health records scheduling billing medical practice" },
  { title: "See your numbers daily", text: "Dashboards with alerts for usage, costs and sales, fed from your systems.", href: "/en/products", integra: ["Your current systems", "Spreadsheets", "Billing", "WhatsApp alerts"], kw: "dashboard numbers indicators costs sales data reports kpi metrics excel" },
  { title: "Manage members and customers", text: "A custom CRM with member registry, approvals and a sales pipeline.", href: "/en/products", integra: ["WhatsApp", "Member registry", "Approvals", "Collections"], kw: "crm members customers registry approvals sales pipeline providers" },
  { title: "Train a lot of people", text: "An online academy with payments, a mobile app and verifiable certificates.", href: "/en/products", integra: ["Payments", "Certificates", "Mobile app", "CRM"], kw: "train courses academy online certificates students learning education" },
  { title: "Have a website that works", text: "Sites with booking, forms and WhatsApp connected to your systems.", href: "/en/services", integra: ["CRM", "WhatsApp", "Calendar", "Analytics"], kw: "website site web page landing store form" },
  { title: "Grow on social media and ads", text: "Reels, graphics and Meta and Google campaigns every week, with measured results.", href: "/en/services", integra: ["Meta and Google", "CRM", "WhatsApp", "Results dashboard"], kw: "social instagram facebook ads marketing advertising campaigns reels content followers" },
  { title: "Transform the organization", text: "Assessment, roadmap, pilots and certified training. With guidance on Argentina's Kit 4.0 funding.", href: "/en/digital-transformation", integra: ["Your processes", "Your systems", "Your team", "Kit 4.0 funding"], kw: "digital transformation consulting assessment roadmap sme digitize" },
  { title: "Organize a union or member community", text: "Member registry, benefits, app and academy under your brand, all connected.", href: "/en/products", integra: ["Member registry", "App", "Academy", "Payments"], kw: "union community mutual members benefits registry app" },
  { title: "Decide with a tech expert beside you", text: "Technology and AI advisory by the hour or on a monthly plan, with one accountable lead.", href: "/en/advisory", integra: ["Your vendors", "Your systems", "Your budget", "Monthly reports"], kw: "advisory advisor consulting technology vendors decide budget cto ai hours" },
]

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export default function Resolver({ lang = "es" }: { lang?: Lang }) {
  const t = T[lang]
  const items = lang === "en" ? ITEMS_EN : ITEMS_ES
  const [q, setQ] = useState("")
  const [sel, setSel] = useState(0)

  const ranked = useMemo(() => {
    const words = norm(q).split(/[^a-z0-9]+/).filter((w) => w.length > 2)
    if (!words.length) return null
    const scored = items.map((it, i) => {
      const hay = norm(it.kw + " " + it.title + " " + it.text)
      return { i, s: words.reduce((a, w) => a + (hay.includes(w) ? 1 : 0), 0) }
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)
    return scored
  }, [q, items])

  const current = ranked ? (ranked.length ? items[ranked[0].i] : null) : items[sel]
  const others = ranked ? ranked.slice(1, 3).map((x) => items[x.i]) : []

  return (
    <div className="db-tech rounded-[24px] bg-[#0B0D12] text-white p-5 md:p-9 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-col gap-2.5">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF8E88]">{t.kicker}</p>
          <h2 className="m-0 font-tight text-[28px] md:text-[38px] leading-[1.1] font-extrabold">{t.h2}</h2>
          <p className="m-0 text-[16px] leading-relaxed text-[#C3C8D1]">{t.sub}</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-[#3A404B] focus-within:border-[#FF6A63] bg-[#161A22] px-4 py-3.5 transition-colors">
          <span aria-hidden="true" className="text-[#FF8E88] text-xl">✦</span>
          <span className="sr-only">{t.kicker}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.ph}
            className="w-full bg-transparent border-0 shadow-none ring-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none text-[16px] placeholder:text-[#7D8594]"
            maxLength={120}
          />
        </label>
        <div className="flex flex-col gap-2.5">
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C3C8D1]">{t.chips}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((it, i) => {
              const on = !ranked && sel === i
              return (
                <button
                  key={it.title}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setQ(""); setSel(i) }}
                  className={"rounded-full border px-3.5 py-2 text-[14px] text-left transition-colors " + (on ? "bg-[#C8231F] border-[#C8231F] text-white font-bold" : "border-[#3A404B] text-[#E2E5EA] hover:border-[#FF6A63]")}
                >
                  {it.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex flex-col gap-3" aria-live="polite">
        {current ? (
          <div className="rounded-2xl border border-[#262C37] bg-[#161A22] p-6 md:p-8 flex flex-col gap-5 h-full">
            {ranked && <span className="self-start rounded-full bg-[#FF6A63]/15 text-[#FF8E88] text-xs font-bold uppercase tracking-widest px-3 py-1">{t.badge}</span>}
            <h3 className="m-0 font-tight text-[26px] md:text-[32px] leading-[1.12] font-extrabold">{current.title}</h3>
            <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">{current.text}</p>
            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C3C8D1]">{t.integra}</p>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
                {current.integra.map((x) => (
                  <li key={x} className="rounded-lg border border-[#3A404B] bg-[#0B0D12] px-3 py-1.5 text-[14px] text-[#E2E5EA]">⇄ {x}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-auto pt-1">
              <Link href={current.href} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors">{t.cta} →</Link>
              <Link href={t.contact} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-5 py-3 font-semibold text-white transition-colors">{t.talk}</Link>
            </div>
            {others.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 text-[14px] text-[#C3C8D1]">
                {others.map((o) => <Link key={o.title} href={o.href} className="underline underline-offset-4 hover:text-white">{o.title}</Link>)}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#262C37] bg-[#161A22] p-6 md:p-8 flex flex-col gap-4 h-full justify-center">
            <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">{t.none}</p>
            <div className="flex flex-wrap gap-2.5">
              <Link href={t.allHref} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-5 py-3 font-semibold">{t.all}</Link>
              <Link href={t.contact} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold">{t.talk}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
