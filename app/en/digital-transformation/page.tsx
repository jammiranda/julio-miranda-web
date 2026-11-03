import CasosRelacionados from "@/components/casos-relacionados"
import Integracion from "@/components/integracion"
import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb, servicio } from "@/lib/seo"
import { MessageCircle, FileText, Award } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import DbHero from "@/components/db-hero"
import { ACADEMIA } from "@/lib/marca"

export const metadata = pageMeta(
  "Digital Transformation Consulting for SMEs · DEVISEBIT",
  "Digital maturity assessment, roadmap, pilots and certified training for SMEs, family businesses, unions and public agencies. Book a free 30-minute intro call.",
  "/en/digital-transformation",
)

const WA = "https://wa.me/5491173466490?text=Hello%20DEVISEBIT%2C%20I%27d%20like%20to%20learn%20about%20your%20digital%20transformation%20consulting"
const CONTACT = "/en/contact#formulario"

const PILARES = [
  { t: "Strategy", d: "Clear goals and a business model that technology helps you deliver. Technology is the tool, not the goal." },
  { t: "Culture and people", d: "Prepared teams, leaders who back the change, and change management. Culture is the most common reason a digital project fails." },
  { t: "Technology and data", d: "Digitized processes, real-time information, cloud and cybersecurity, chosen for what the organization actually needs." },
]

const ETAPAS = [
  { n: "01", t: "Digital maturity assessment", d: "We measure where the organization stands on four axes: leadership and strategy, customer relationship, business integration and internal management. Each axis has four levels." },
  { n: "02", t: "Internal and market analysis", d: "Value chain, key processes, resources and competition. We use proven tools: Business Model Canvas, PEST and Porter's Five Forces." },
  { n: "03", t: "Roadmap", d: "Prioritized challenges, measurable indicators, resources and timelines. It also covers the funding options available to SMEs, where they apply." },
  { n: "04", t: "Pilots and minimum viable product", d: "We test with little effort before investing big: demos, landing pages, prototypes and short deliveries using agile methods (Lean, Design Thinking, Scrum)." },
  { n: "05", t: "Change management and training", d: "We support your teams through adoption with workshops and courses from DEVISEBIT Academy, and track progress against the agreed indicators." },
]

const FORMATOS = [
  { t: "Introductory workshop", precio: "Pricing on request", nota: "Up to 5 people · 3 hours", d: "One session for executives and small teams: core concepts, real cases and a live self-assessment.", items: ["Virtual, or in person in Buenos Aires", "DEVISEBIT Academy certificate", "Practical guide for every attendee"], href: CONTACT, cta: "Ask about the workshop" },
  { t: "Workshop for teams", precio: "Custom quote", nota: "More than 5 people · in-house", d: "The same workshop adapted to your organization, with examples from your industry and more time for group work.", items: ["For one department or the whole company", "In person or virtual", "Certificate for every participant"], href: CONTACT, cta: "Request a quote" },
  { t: "Assessment and roadmap", precio: "Custom quote", nota: "Depends on organization size", d: "We map your organization and deliver your maturity level, prioritized challenges and a staged plan.", items: ["Interviews and process mapping", "Report, dashboard and indicators", "Funding options, where applicable"], href: CONTACT, cta: "Request a free intro call" },
  { t: "Support program", precio: "Tailored", nota: "Monthly retainer · 3-month minimum", d: "We implement the roadmap with your team: pilots, systems, training and monthly follow-up.", items: ["One accountable lead at DEVISEBIT", "Short, measurable deliveries", "Training with certificates"], href: CONTACT, cta: "Tell us about your project" },
]

const PARA = ["Executives and managers", "SMEs and family businesses", "Unions, mutual associations and health plans", "Public agencies and municipalities", "Universities and institutes", "Growing startups"]

export default function DigitalTransformationPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Digital Transformation Consulting", "/en/digital-transformation"]], "en")} />
      <JsonLd data={servicio("Digital Transformation Consulting", "Digital maturity assessment, roadmap, pilots and certified training for SMEs, family businesses, unions and public agencies.", "/en/digital-transformation", "Digital transformation consulting")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Digital transformation consulting"
          title="Technology with a strategy, so your organization can grow."
          sub="Digital transformation is not buying a system. It is an ongoing process that combines strategy, culture and technology. We help you measure where you are, decide where to go and get there in stages."
        >
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Link href={CONTACT} className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><FileText size={19} aria-hidden="true" /> Request a free intro call</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Message us on WhatsApp</a>
          </div>
        </DbHero>
        <Integracion lang="en" compacta />

        <section aria-labelledby="t-pil" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Three pillars</p>
              <h2 id="t-pil" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">What makes transformation work.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {PILARES.map((p) => (
                <article key={p.t} className="db-card rounded-2xl border border-[#E2E5EA] p-7 flex flex-col gap-3">
                  <div className="w-11 h-1 rounded bg-[#C8231F]" />
                  <h3 className="m-0 font-tight text-[23px] font-bold">{p.t}</h3>
                  <p className="m-0 text-base leading-relaxed text-[#4A515C]">{p.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="t-eta" className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF8E88]">How we work</p>
              <h2 id="t-eta" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Five stages, with results at each one.</h2>
            </div>
            <ol className="m-0 p-0 list-none grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {ETAPAS.map((e) => (
                <li key={e.n} className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-3xl font-extrabold text-[#FF8E88]">{e.n}</span>
                  <h3 className="m-0 text-lg font-bold leading-snug">{e.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{e.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="t-for" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Formats</p>
              <h2 id="t-for" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Start where it makes sense for you.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">We tailor every engagement to your organization. Tell us about your situation and we will advise you at no cost.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FORMATOS.map((f) => (
                <article key={f.t} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-7 flex flex-col gap-3">
                  <h3 className="m-0 font-tight text-[21px] font-bold leading-snug">{f.t}</h3>
                  <div><span className="font-tight text-2xl font-extrabold">{f.precio}</span><span className="block text-sm text-[#4A515C]">{f.nota}</span></div>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{f.d}</p>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                    {f.items.map((i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>)}
                  </ul>
                  <Link href={f.href} className="mt-auto rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 text-center font-bold text-white transition-colors">{f.cta}</Link>
                </article>
              ))}
              <article className="rounded-2xl border-2 border-dashed border-[#C3C8D1] bg-white p-7 flex flex-col gap-3 justify-center">
                <h3 className="m-0 font-tight text-[21px] font-bold leading-snug">Prefer hours or a retainer?</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">If you need a technology and AI expert on call rather than a fixed project: single hours, hour banks or a monthly retainer with one accountable lead.</p>
                <Link href="/en/advisory" className="self-start rounded-xl border-2 border-[#0E1116] hover:bg-[#0E1116] hover:text-white px-5 py-3 font-bold transition-colors">See technology &amp; AI advisory →</Link>
              </article>
            </div>
          </div>
        </section>

        <section aria-labelledby="t-cert" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col gap-4">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Certified training</p>
              <h2 id="t-cert" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">Your team learns while it transforms.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Workshops and courses run through DEVISEBIT Academy: live classes, downloadable material, an assessment and a verifiable digital certificate for every participant who passes.</p>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Our method draws on our team&apos;s training in the Digital Transformation diploma program at Belgrano University (Buenos Aires), and on digital transformation and Industry 4.0 programs we have delivered to SMEs together with vocational-training foundations.</p>
              <div className="flex items-center gap-3 rounded-2xl border border-[#E2E5EA] p-4"><Award size={28} className="text-[#C8231F] shrink-0" aria-hidden="true" /><span className="text-[15px]">Certificates carry a unique code and can be verified at <a href={`${ACADEMIA.url}/cursos`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#C8231F] underline">academia.devisebit.com</a> (in Spanish).</span></div>
            </div>
            <div className="db-tech rounded-[20px] bg-[#0B0D12] text-white p-7 flex flex-col gap-4">
              <h3 className="m-0 font-tight text-[24px] font-bold">Who it&apos;s for</h3>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-2">{PARA.map((p) => <li key={p} className="rounded-full border border-white/25 px-3.5 py-1.5 text-sm font-semibold">{p}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_560px] flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">Shall we start with an assessment?</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">Tell us how your organization works today. We will propose a first step, with scope and dates in writing. Your first 30-minute meeting is free.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors">WhatsApp</a>
              <Link href={CONTACT} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Tell us about your project</Link>
            </div>
          </div>
        </section>
        <CasosRelacionados ids={[1, 2, 9]} lang="en" />
      </main>
      <Footer lang="en" />
    </div>
  )
}
