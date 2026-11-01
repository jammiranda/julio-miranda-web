import Link from "next/link"

type Lang = "es" | "en"

const T = {
  es: {
    kicker: "Integración profesional",
    h2: "Hacer cosas sueltas es fácil. Que todo funcione junto, no.",
    p: "Hoy cualquiera arma una automatización, un bot o una web con IA. El problema aparece después: datos duplicados, sistemas que no se hablan, nadie responsable cuando algo falla. DEVISEBIT integra todo en un solo sistema que funciona, se mide y tiene un responsable.",
    pts: [
      ["Un mapa antes de tocar nada", "Relevamos qué sistemas, datos y personas intervienen, y qué se conecta con qué."],
      ["Conectado de punta a punta", "WhatsApp, web, CRM, pagos, facturación, tableros y tus sistemas actuales, hablando entre sí."],
      ["Probado antes de salir", "Cada integración se prueba con datos reales y se deja con alertas y registro."],
      ["Un responsable único", "Si algo falla, una persona responde. No tenés que ir de proveedor en proveedor."],
    ],
    cta: "Revisemos tus integraciones",
    href: "/asesoria",
  },
  en: {
    kicker: "Professional integration",
    h2: "Building loose pieces is easy. Making everything work together is not.",
    p: "Anyone can now spin up an automation, a bot or an AI-built site. The trouble comes later: duplicated data, systems that do not talk to each other, nobody accountable when something breaks. DEVISEBIT integrates everything into one system that works, is measured and has an owner.",
    pts: [
      ["A map before touching anything", "We map the systems, data and people involved and what connects to what."],
      ["Connected end to end", "WhatsApp, web, CRM, payments, billing, dashboards and your existing systems, talking to each other."],
      ["Tested before go-live", "Every integration is tested with real data and delivered with alerts and logging."],
      ["One accountable lead", "If something fails, one person answers. No chasing vendor after vendor."],
    ],
    cta: "Let's review your integrations",
    href: "/en/advisory",
  },
}

export default function Integracion({ lang = "es", oscuro = false }: { lang?: Lang; oscuro?: boolean }) {
  const t = T[lang]
  const bg = oscuro ? "db-tech bg-[#0B0D12] text-white" : "bg-white text-[#0E1116]"
  const mut = oscuro ? "text-[#C3C8D1]" : "text-[#4A515C]"
  const card = oscuro ? "border-[#262C37] bg-[#161A22]" : "border-[#E2E5EA] bg-[#F5F6F8]"
  return (
    <section aria-labelledby={"integ-" + lang} className={bg}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">{t.kicker}</p>
          <h2 id={"integ-" + lang} className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">{t.h2}</h2>
          <p className={"m-0 text-[17px] leading-relaxed " + mut}>{t.p}</p>
          <Link href={t.href} className="self-start rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">{t.cta} →</Link>
        </div>
        <ol className="m-0 p-0 list-none grid sm:grid-cols-2 gap-3">
          {t.pts.map(([a, b], i) => (
            <li key={a} className={"rounded-2xl border p-5 flex flex-col gap-1.5 " + card}>
              <span className="font-tight text-2xl font-extrabold text-[#C8231F]">{String(i + 1).padStart(2, "0")}</span>
              <strong className="text-[18px]">{a}</strong>
              <span className={"text-[15px] leading-normal " + mut}>{b}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
