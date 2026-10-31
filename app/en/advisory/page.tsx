import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb, servicio } from "@/lib/seo"
import { MessageCircle, CalendarClock } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import DbHero from "@/components/db-hero"

export const metadata = pageMeta(
  "Technology & AI Advisory, Hourly or Monthly · DEVISEBIT",
  "Technology and AI advisory for SMEs and institutions: single hours, hour banks or monthly retainers with one point of contact. Free first 30-minute call.",
  "/en/advisory",
)

const WA = "https://wa.me/5491173466490?text=Hello%20DEVISEBIT%2C%20I%27d%20like%20to%20learn%20about%20your%20technology%20and%20AI%20advisory"
const CONTACT = "/en/contact#formulario"

const RESUMEN = [
  { k: "Who it's for", t: "SMEs, institutions and leadership teams", d: "Organizations that must decide on software, vendors, AI, data or processes and have no technology lead to back them up." },
  { k: "What we solve", t: "Decisions, not just answers", d: "What to buy and what to skip, how to fix processes before automating them, how to use AI without exposing your data, how to measure whether it works." },
  { k: "How we work", t: "One accountable lead", d: "Every hour is logged with date, person and topic. You see it all in your client portal." },
  { k: "Track record", t: "Production systems since 2009", d: "We advise from what we run every day: our own CRM and dashboard, a WhatsApp AI assistant, an online academy and client portals." },
]

const FORMAS = [
  { n: "01", t: "Single hour", d: "One specific question: review a software quote, choose a vendor, unblock a problem.", precios: [["Technical hour", "USD 35"], ["Strategic hour", "USD 55"]], nota: "Pay as you go" },
  { n: "02", t: "Hour bank", d: "You will need input over the coming months, but not on a fixed schedule. Prepay at a lower hourly rate.", precios: [["10 hours · 90 days", "USD 420"], ["20 hours · 120 days", "USD 770"], ["40 hours · 180 days", "USD 1,410"]], nota: "Any profile on the team" },
  { n: "03", t: "Monthly retainer", d: "You want someone who knows your organization, with fixed meetings and one accountable lead at DEVISEBIT.", precios: [["From", "USD 250/month"]], nota: "Three tiers, detailed below" },
  { n: "04", t: "Annual plan", d: "You already know you will work with us all year: same retainer, bonus months and a frozen price.", precios: [["Pay for 10 months", "upfront"], ["or 12 installments", "10% less"]], nota: "Price frozen for 12 months" },
  { n: "05", t: "Licenses", d: "You want to use our products under your own brand, or have us manage your Google Workspace, AI and domain licenses.", precios: [["White label", "pricing on request"]], nota: "Details in the Licenses section" },
]

const ABONOS = [
  { horas: "6 h per month", t: "Advisor on call", precio: "USD 250", min: "3-month minimum", items: ["One meeting every two weeks", "WhatsApp questions that don't use up your hours", "Review of quotes and vendor proposals before you sign", "Monthly report on what was solved and what is pending"] },
  { horas: "16 h per month", t: "Part-time technology lead", precio: "USD 570", min: "6-month minimum", destacado: true, items: ["A technology lead without adding headcount", "Monthly committee with your leadership", "Systems plan and vendor follow-up", "Security, data and a KPI dashboard"] },
  { horas: "24 h per month", t: "Guided transformation", precio: "USD 830", min: "3-month minimum", items: ["We implement the roadmap with your team", "Short, measurable pilots", "Change management", "Training with DEVISEBIT Academy certificates and KPI tracking"] },
]
const SIEMPRE = ["Hours logged in your portal", "Monthly report", "Access to our practical guides", "Priority when quoting projects"]

const LICENCIAS = [
  { t: "Content dashboard · white label", d: "Social media, web, ads and contacts in one dashboard under your brand, with updates and support.", v: "Setup fee + monthly fee", n: "Pricing on request · 6-month minimum" },
  { t: "Academy, member registry, health plans, CRM", d: "The subscription in our current price list is your usage license.", v: "Pricing on request", n: "Annual, with 2 months free" },
  { t: "Third-party license management", d: "Sign-ups, users, payments and renewals for Google Workspace, AI tools, domains and similar services.", v: "License cost + 15%", n: "Monthly minimum applies" },
]

const DIRECCION = [
  { area: "Leadership", titulo: "Technology and AI strategy", d: "Architecture, vendors and large budgets. Handled by DEVISEBIT's leadership." },
  { area: "Digital transformation", titulo: "Assessment and roadmap", d: "Digital maturity assessment, roadmap and change management. Handled by our digital transformation team." },
]
const AREAS = [
  { t: "Coordination", d: "Scheduling, follow-up and reports for your retainer." },
  { t: "Analysis and projects", d: "Process mapping, functional analysis and project management." },
  { t: "Development", d: "Integrations, and reviews of systems and third-party code." },
  { t: "Design and marketing", d: "Brand, social media, content and ads." },
  { t: "Quality and support", d: "Testing, technical support and monitoring." },
]

const CONDICIONES = [
  ["Logging", "every hour is recorded with date, person and topic, and you see it in your portal."],
  ["Minimum increment", "30 minutes. Short WhatsApp questions within a retainer don't use up hours."],
  ["Unused retainer hours", "roll over to the next month once."],
  ["Extra hours", "billed at the rate in your proposal, always with advance notice."],
  ["Hour banks", "a strategic hour uses 1.5 hours of the bank. In retainers there is no difference: your lead decides who covers each topic."],
  ["Pricing", "reviewed every quarter. The annual plan is frozen for 12 months."],
  ["Cancellation", "after the minimum term, with 30 days' notice."],
  ["Payment", "agreed in your written proposal. Single hours and hour banks are paid in advance; retainers one month ahead."],
  ["Invoicing", "issued by DEVISEBIT SRL, under a contract."],
]

const PREGUNTAS = [
  { q: "Is it a one-off question or something ongoing?", a: [["One-off", "single hour"], ["Ongoing", "hour bank or retainer"]] },
  { q: "Do you need someone to decide and guide, or hours to consult when something comes up?", a: [["Decide and guide", "retainer"], ["Consult", "hour bank"]] },
  { q: "Do you have a technology person in your organization?", a: [["No", "Part-time technology lead"], ["Yes", "Advisor on call to back them up"]] },
]

const EMPEZAR = [
  { n: "01", t: "Free first meeting", d: "Book a 30-minute call at no cost and tell us about your situation. We listen, ask questions and give you a straight view." },
  { n: "02", t: "Written proposal", d: "Format, hours, accountable lead and price." },
  { n: "03", t: "Portal access", d: "From there you see hours, reports and payments." },
]

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"
const h2 = "m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold"

export default function AdvisoryPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Technology & AI Advisory", "/en/advisory"]], "en")} />
      <JsonLd data={servicio("Technology & AI Advisory", "A technology and AI team for your organization, by the hour or by the month, with one accountable lead and every hour logged in your client portal.", "/en/advisory", "Technology and artificial intelligence consulting")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Technology & AI advisory"
          title={<>A technology and AI team for your organization, <span className="text-[#FF6A63]">by the hour or by the month.</span></>}
          sub="Make sound technology decisions without building an IT department. Choose how we work together: a quick consult, a bank of hours or a monthly retainer with one accountable lead and everything logged in your portal."
        >
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Link href={CONTACT} className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Request a free intro call</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Message us on WhatsApp</a>
          </div>
          <nav aria-label="On this page" className="flex flex-wrap gap-2 mt-3">
            {[["#formas", "Ways to work together"], ["#abonos", "Retainers"], ["#licencias", "Licenses"], ["#equipo", "Who you work with"], ["#elegir", "How to choose"]].map(([h, t]) => (
              <a key={h} href={h} className="rounded-full border border-white/15 hover:border-[#FF6A63] px-4 py-2 text-sm font-semibold text-[#D3D7DE] hover:text-white transition-colors">{t}</a>
            ))}
          </nav>
        </DbHero>

        {/* At a glance */}
        <section aria-labelledby="t-res" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>At a glance</p>
              <h2 id="t-res" className={h2}>A technology expert on your side, without adding headcount.</h2>
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

        {/* Five ways */}
        <section id="formas" aria-labelledby="t-for" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Five ways to work together</p>
              <h2 id="t-for" className={h2}>From a quick consult to year-round support.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Start with one and switch to another whenever you need to. Prices are in US dollars.</p>
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
              <strong className="text-sm uppercase tracking-[0.14em] text-[#FF6A63]">First meeting is free</strong>
              <p className="m-0 text-[16px] leading-relaxed text-[#E6E8EC]">Your first meeting is free and lasts 30 minutes. Tell us about your situation and what you need to decide. We will tell you which format fits, or whether we are the right team at all.</p>
            </div>
          </div>
        </section>

        {/* Retainers */}
        <section id="abonos" aria-labelledby="t-abo" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Retainers in detail</p>
              <h2 id="t-abo" className={h2}>Three tiers, depending on how much support you need.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Every tier includes one accountable lead and a monthly report. Prices are in US dollars, for clients paying from abroad.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {ABONOS.map((a) => (
                <article key={a.t} className={"db-card rounded-2xl bg-white p-7 flex flex-col gap-3 " + (a.destacado ? "border-2 border-[#C8231F]" : "border border-[#E2E5EA]")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#C8231F]">{a.horas}</span>
                    {a.destacado && <span className="rounded-full bg-[#C8231F] px-3 py-1 text-xs font-bold text-white">No in-house IT team?</span>}
                  </div>
                  <h3 className="m-0 font-tight text-[23px] font-bold leading-snug">{a.t}</h3>
                  <div><span className="font-tight text-3xl font-extrabold">{a.precio}</span><span className="text-[15px] font-semibold text-[#4A515C]"> /month</span><span className="block text-sm text-[#4A515C]">{a.min}</span></div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                    {a.items.map((i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>)}
                  </ul>
                  <Link href={CONTACT} className="mt-auto rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 text-center font-bold text-white transition-colors">Ask about this retainer</Link>
                </article>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h3 className="m-0 text-lg font-bold">Always included</h3>
                <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-2">
                  {SIEMPRE.map((s) => <li key={s} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{s}</li>)}
                </ul>
                <p className="m-0 text-sm text-[#4A515C]"><strong className="text-[#0E1116]">Annual plan:</strong> any retainer for 12 months. Pay for 10 months upfront, or pay 10% less in 12 installments.</p>
              </div>
              <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h3 className="m-0 text-lg font-bold">What is not included</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">Software development, design and ad campaigns. If the advisory uncovers a project, we quote it separately, with scope, timeline and price in writing. If you hire us for it within 60 days, 50% of that month&apos;s advisory hours are credited to the project.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Licenses */}
        <section id="licencias" aria-labelledby="t-lic" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Licenses</p>
              <h2 id="t-lic" className={h2}>Our products under your brand, or your licenses in order.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Use our products without paying for custom development, or hand off the administration of your licenses.</p>
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
            <p className="m-0 text-[15px] text-[#4A515C]">Want a quote for a license? <Link href={CONTACT} className="font-bold text-[#C8231F] underline underline-offset-2">Tell us what you need</Link>.</p>
          </div>
        </section>

        {/* Who you work with */}
        <section id="equipo" aria-labelledby="t-eq" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>Who you work with</p>
              <h2 id="t-eq" className={h2}>One accountable lead coordinates your account.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Each hour is delivered by the team member who knows the topic best.</p>
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

        {/* How to choose and how to start */}
        <section id="elegir" aria-labelledby="t-ele" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid lg:grid-cols-[1.25fr_1fr] gap-10 items-start">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <p className={kicker + " text-[#C8231F]"}>How to choose</p>
                <h2 id="t-ele" className={h2}>Three questions are enough.</h2>
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
                <p className={kicker + " text-[#C8231F]"}>How to get started</p>
                <h2 className="m-0 font-tight text-[28px] md:text-[34px] leading-[1.12] font-extrabold">Getting started is simple.</h2>
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

        {/* Terms */}
        <section aria-labelledby="t-con" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Terms</p>
              <h2 id="t-con" className="m-0 font-tight text-[28px] md:text-[34px] leading-[1.12] font-extrabold">Everything clear from the start.</h2>
            </div>
            <ul className="m-0 p-0 list-none grid md:grid-cols-2 gap-x-8 gap-y-3">
              {CONDICIONES.map(([k, v]) => (
                <li key={k} className="flex gap-2.5 text-[15px] leading-relaxed"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span><span><strong>{k}:</strong> {v}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">Ready to start with a free first meeting?</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Tell us what you need to decide. We will propose the format, the hours and the accountable lead, in writing.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> WhatsApp</a>
              <Link href={CONTACT} className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Request a free intro call</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
