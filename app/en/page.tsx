import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbContactForm from "@/components/db-contact-form"
import Redes from "@/components/redes"
import Integracion from "@/components/integracion"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { WHATSAPP_EN as WHATSAPP } from "@/lib/marca"

export const metadata = pageMeta(
  "Custom Software & AI Development from Argentina · DEVISEBIT",
  "Custom software, WhatsApp AI assistants, CRM and dashboards built in Argentina. 17 years, 150+ production projects, fixed scope, date and price in writing.",
  "/en",
)

const STATS = [
  { n: "17", c: 17, pre: "", l: "years of systems in production" },
  { n: "150+", c: 150, pre: "+", l: "projects delivered" },
  { n: "12", c: 12, pre: "", l: "industries with proven solutions" },
  { n: "24/7", c: 0, pre: "", l: "system support and monitoring" },
]

const PRODUCTS = [
  { title: "Clinic management system", text: "Scheduling, health records, prescriptions and dashboard." },
  { title: "WhatsApp AI assistant", text: "24/7 support with handoff to a person." },
  { title: "Member and provider CRM", text: "One registry, approvals and full traceability." },
  { title: "Control dashboards", text: "Live indicators with alerts." },
  { title: "App and digital ID card", text: "Your institution on every member's phone." },
  { title: "Online academies", text: "Courses, payments and certificates." },
  { title: "Voting and access control", text: "Paperless elections and QR-code entry." },
  { title: "Document manager with e-signature", text: "Documents organized and signed online." },
]

const CASES = [
  { img: "https://julio.devisebit.com/media/trabajos/plataforma-academia.jpg", tag: "Community and academy", title: "USL Community · Academy", text: "An online community and academy: courses, enrollment, benefits and member registry in one panel. Over 1,000 people enrolled in a year." },
  { img: "/images/case-tigre-new.webp", tag: "Municipal government", title: "Municipality of Tigre · Soy Tigre app", text: "App development and support: participating businesses and issuance of the Soy Tigre and Soy Tigre Joven citizen cards." },
  { img: "/images/case-academia-new.webp", tag: "Government and education", title: "City of Buenos Aires · BA Emprende Academy", text: "Online course catalog for the city's entrepreneurs: WordPress and Moodle unified under a single login and connected to the CRM." },
]

const STEPS = [
  { n: "01", t: "Discovery", d: "We understand the problem before writing a line of code." },
  { n: "02", t: "Fixed proposal", d: "Scope, delivery date and fixed price, in writing." },
  { n: "03", t: "Short deliveries", d: "Every two weeks you see progress and test it with your team." },
  { n: "04", t: "Support and improvement", d: "We stay with the operation and keep adding improvements." },
]

const SECTORS = ["Healthcare", "Government", "Universities", "Unions and health plans", "Member-owned associations", "Media", "Education", "Companies"]

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"
const h2 = "m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold"

export default function HomeEnPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([], "en")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        {/* Hero */}
        <section id="home" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-20 md:pt-20 md:pb-24 flex flex-wrap gap-14 items-center">
            <div className="db-rise flex-[999_1_560px] min-w-0 flex flex-col gap-6">
              <p className={kicker + " text-[#FF6A63]"}><span className="db-live" />Software and AI since 2009 · systems in production</p>
              <h1 className="m-0 font-tight text-[40px] md:text-[64px] leading-[1.04] font-extrabold tracking-[-0.02em]">
                Custom software and AI that run your operation. <span className="text-[#FF6A63]">Fixed price, fixed date.</span>
              </h1>
              <p className="m-0 text-lg md:text-xl leading-relaxed text-[#C3C8D1] max-w-[640px]">
                We build software, apps and artificial intelligence for healthcare, government, universities, unions and companies. Before we start, you know what you will get, when, and what it costs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/en/contact" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Request a free intro call</Link>
                <Link href="/en/success-stories" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">See success stories</Link>
                <Link href="/en/digital-transformation" className="rounded-xl bg-white hover:bg-[#FDECEB] px-[22px] py-[14px] font-bold text-[17px] text-[#0B0D12] transition-colors">Digital transformation →</Link>
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

        {/* Digital transformation */}
        <section id="transformation" className="db-tech relative overflow-hidden bg-[#0B0D12] text-white border-t-4 border-[#C8231F]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
            <div className="flex flex-col gap-4">
              <p className={kicker + " text-[#FF6A63]"}>Digital transformation consulting</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[46px] leading-[1.08] font-extrabold">Get your organization in order with technology and strategy.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1] max-w-[620px]">We measure your digital maturity, build a staged roadmap and put it into motion with your team, including training and a certificate. We also help you find available funding for technology investment.</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/en/digital-transformation" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Explore the consulting →</Link>
              </div>
              <p className="m-0 text-[16px] text-[#C3C8D1]">Prefer a tech team by the hour or by the month? <Link href="/en/advisory" className="font-bold text-white underline underline-offset-4 decoration-[#FF6A63] hover:text-[#FF6A63]">See our technology and AI advisory →</Link></p>
            </div>
            <ol className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[["01", "Assessment", "Digital maturity across 4 areas and 4 levels."], ["02", "Roadmap", "Prioritized challenges, KPIs and timelines."], ["03", "Pilots", "Quick results before you invest big."], ["04", "Change and training", "Your team adopts the new tools, with a certificate."]].map(([n, t, d]) => (
                <li key={n} className="db-card db-dark rounded-2xl border border-[#262C37] bg-[#161A22] p-5 flex flex-col gap-1.5">
                  <span className="font-tight text-2xl font-extrabold text-[#FF6A63]">{n}</span>
                  <strong className="text-lg">{t}</strong>
                  <span className="text-[15px] text-[#C3C8D1]">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Needs */}
        <Integracion lang="en" />

        {/* Products */}
        <section id="products" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-wrap gap-12">
            <div className="flex-[1_1_340px] min-w-0 flex flex-col gap-3.5">
              <p className={kicker + " text-[#C8231F]"}>Products</p>
              <h2 className={h2}>Proven systems, ready to deploy.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">We do not start from zero. We adapt products already running in production. That shortens delivery and lowers risk.</p>
              <Link href="/en/products" className="self-start rounded-xl bg-[#0B0D12] hover:bg-[#1B2029] px-[22px] py-[14px] font-bold text-white transition-colors">See all products</Link>
            </div>
            <div className="db-tech flex-[999_1_560px] min-w-0 rounded-[24px] bg-[#0B0D12] p-4 md:p-6 grid sm:grid-cols-2 gap-3">
              {PRODUCTS.map((p, i) => (
                <Link key={p.title} href="/en/products" className="db-card group rounded-2xl border border-[#262C37] bg-[#161A22] p-5 flex gap-4 items-start text-white">
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

        {/* Cases */}
        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#C8231F]"}>Success stories</p>
                <h2 className={h2}>150+ projects in production.</h2>
              </div>
              <Link href="/en/success-stories" className="font-bold text-[#C8231F] hover:text-[#9E1A17]">See all stories →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {CASES.map((c) => (
                <Link key={c.title} href="/en/success-stories" className="db-card group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col text-[#0E1116]">
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

        {/* Development */}
        <section id="development" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-9">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Custom development</p>
              <h2 className={h2}>From idea to production in four clear steps.</h2>
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

        {/* Sectors */}
        <section className="bg-[#F5F6F8] overflow-hidden">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-6">
            <h2 className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">Sectors we work in</h2>
          </div>
          <div className="db-marquee pb-16" aria-label={SECTORS.join(", ")}>
            <div className="db-marquee-track" aria-hidden="true">
              {[...SECTORS, ...SECTORS, ...SECTORS, ...SECTORS].map((s, i) => (
                <span key={i} className="shrink-0 rounded-full border border-[#E2E5EA] bg-white px-6 py-3.5 font-semibold text-lg">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-wrap gap-12">
            <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-3.5">
              <p className={kicker + " text-[#C8231F]"}>Contact</p>
              <h2 className={h2}>Tell us about your project.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">The first 30-minute call is free. We reply within one business day with next steps.</p>
              <div className="flex flex-col gap-2 text-[17px]">
                <Link href="/en/contact" className="font-bold text-[#C8231F] hover:text-[#9E1A17]">Request a free intro call →</Link>
                <a href="mailto:info@devisebit.com" className="text-[#C8231F] hover:text-[#9E1A17]">info@devisebit.com</a>
                <span>Luna 24, 6th floor, Parque Patricios, Buenos Aires</span>
                <span>Av. de los Lagos 7008, Nordelta, Tigre (Greater Buenos Aires)</span>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] hover:text-[#9E1A17]">WhatsApp +54 9 11 7346-6490</a>
              </div>
              <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-[#4A515C]">Follow us</span><Redes oscuro={false} /></div>
            </div>
            <div className="flex-[999_1_520px] min-w-0">
              <DbContactForm lang="en" />
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
