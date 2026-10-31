import Link from "next/link"
import Image from "next/image"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"

export const metadata = pageMeta(
  "About DEVISEBIT: Software & AI Since 2009",
  "DEVISEBIT is an Argentine software and AI company. Since 2009 we build production systems for healthcare, government, universities, unions and companies.",
  "/en/about",
)

const STATS = [
  { n: "17", l: "years in production" },
  { n: "150+", l: "projects delivered" },
  { n: "12", l: "industries" },
  { n: "29", l: "digital media outlets built" },
]

const HITOS = [
  { y: "2009", t: "Founded as Web y Graf", d: "First websites, news portals and digital newspapers in northwestern Argentina." },
  { y: "2016", t: "Government and public management", d: "Platforms and dashboards for national and city agencies." },
  { y: "2021", t: "Universities and education", d: "Modernization projects with the University of Buenos Aires and online academies." },
  { y: "2024", t: "Healthcare, unions and AI", d: "Management systems, academies and AI assistants." },
  { y: "Today", t: "DEVISEBIT SRL", d: "Software and AI for healthcare and institutions, with two development teams." },
]

const LOGOS = [
  { src: "/images/client-tigre-municipio.png", alt: "Municipality of Tigre" },
  { src: "/images/client-uba.png", alt: "University of Buenos Aires" },
  { src: "/images/client-buenos-aires-ciudad.png", alt: "Government of the City of Buenos Aires" },
  { src: "/images/client-ministerio-ambiente.png", alt: "National Ministry of Environment of Argentina" },
  { src: "/images/client-siben.webp", alt: "SIBEN · Ibero-American Society of Neonatology" },
  { src: "/images/client-fundacion-sodetec.png", alt: "SODETEC Foundation" },
  { src: "/images/client-academia-usl.png", alt: "USL Academy" },
  { src: "/images/client-academia-ba.png", alt: "BA Emprende Academy" },
  { src: "/images/client-uba-posgrado.png", alt: "UBA Graduate School" },
  { src: "/images/client-atm-misiones.png", alt: "ATM Misiones" },
  { src: "/images/client-cla-training.png", alt: "CLA Training" },
  { src: "/images/client-salud.webp", alt: "Urobaires" },
]

const VALUES = [
  { t: "Efficiency", d: "We turn time and resources into measurable results." },
  { t: "Teamwork", d: "A close-knit team that owns the work from start to finish." },
  { t: "Security", d: "We protect every organization's data with proven practices." },
  { t: "Confidentiality", d: "We respect and safeguard our clients' information." },
  { t: "Innovation", d: "We bring in new technology when it solves a real problem." },
]

const SKILLS = ["Full-stack web development", "Mobile apps", "Artificial intelligence", "Machine learning", "Business intelligence", "Cloud computing", "DevOps", "Cybersecurity", "Web data extraction", "Chatbots and WhatsApp"]

const EQUIPO_EN = [
  { role: "Founder and Director", d: "15+ years leading software, data and digital transformation projects in healthcare, government and education." },
  { role: "General Coordinator", d: "Runs operations and every project end to end: scope, timelines, testing and user experience." },
  { role: "Project Manager and Lead Analyst", d: "Maps each client's processes, turns them into clear requirements and tracks the work plan." },
  { role: "Development Lead", d: "Leads the development team and the architecture of the platforms we put into production." },
  { role: "Design and Marketing Lead", d: "Designs the brand, interfaces and digital communication of every product." },
  { role: "QA and Testing Lead", d: "Tests every delivery before it reaches the client: features, bugs and behavior across devices." },
  { role: "Technical Support Lead", d: "Supports clients day to day: questions, incidents, maintenance and system monitoring." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["About", "/en/about"]], "en")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Who we are"
          title="Technology that brings order to organizations, since 2009."
          sub="We are a software and artificial intelligence team working with healthcare providers, government, universities, unions and companies. We don't deliver a project and disappear. We stay on as your partner in operations."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-[900px]">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-2xl border border-[#262C37] bg-[#161A22] p-5">
                <div className="font-tight text-4xl font-extrabold">{s.n}</div>
                <div className="text-[#C3C8D1] text-[15px]">{s.l}</div>
              </div>
            ))}
          </div>
        </DbHero>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-10">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Our story</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">17 years putting systems into production.</h2>
            </div>
            <ol className="list-none m-0 p-0 grid md:grid-cols-5 gap-4">
              {HITOS.map((h) => (
                <li key={h.y} className="border-t-2 border-[#C8231F] pt-4 flex flex-col gap-1.5">
                  <span className="font-tight text-2xl font-extrabold text-[#C8231F]">{h.y}</span>
                  <strong className="text-[17px]">{h.t}</strong>
                  <span className="text-[15px] leading-relaxed text-[#4A515C]">{h.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="confian" className="bg-white border-t border-[#E2E5EA]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-col gap-8">
            <h2 id="confian" className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">Organizations that have trusted us</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {LOGOS.map((l) => (
                <div key={l.alt} className="db-card rounded-2xl border border-[#E2E5EA] bg-white h-28 relative w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(14.285%-14px)]">
                  <Image src={l.src} alt={l.alt} fill sizes="280px" className="object-contain p-6" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="t-fund" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16">
            <div className="rounded-[20px] border border-[#E2E5EA] p-6 md:p-8 flex flex-col gap-2.5">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Who leads DEVISEBIT</p>
              <h2 id="t-fund" className="m-0 font-tight text-[26px] md:text-[30px] font-extrabold leading-tight">A founder with 15+ years in software, data and digital transformation</h2>
              <p className="m-0 text-[16px] leading-relaxed text-[#4A515C] max-w-[820px]">Our founder and director has led technology platforms at national scale. He coordinated federal platforms at Argentina&apos;s National Ministry of Environment and directed the Metropolitan Design Center and the BA Tech Lab for the City of Buenos Aires. He founded the company in 2009 as Web y Graf, which today is DEVISEBIT SRL.</p>
            </div>
          </div>
        </section>

        <section id="equipo" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Our team</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Leaders with their own teams behind every project.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EQUIPO_EN.map((p) => (
                <article key={p.role} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B0D12] text-white font-tight text-2xl font-extrabold flex items-center justify-center" aria-hidden="true">{p.role[0]}</div>
                  <h3 className="m-0 font-tight text-xl font-bold text-[#C8231F]">{p.role}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.d}</p>
                </article>
              ))}
            </div>
            <p className="m-0 text-[#4A515C] leading-relaxed max-w-[760px]">Each leader runs their own team: analysis, development, design, quality and support work in parallel on every project. Every client gets a point person for each topic, and no one depends on a single individual.</p>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 grid md:grid-cols-2 gap-5">
            <div className="rounded-[20px] border border-[#262C37] bg-[#161A22] p-8 flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Mission</p>
              <p className="m-0 font-tight text-2xl md:text-[28px] leading-snug font-bold">To drive the growth of companies, entrepreneurs and governments with efficient, custom technology solutions.</p>
            </div>
            <div className="rounded-[20px] border border-[#262C37] bg-[#161A22] p-8 flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Vision</p>
              <p className="m-0 font-tight text-2xl md:text-[28px] leading-snug font-bold">To be the go-to partner for software, data and artificial intelligence in healthcare and institutions, with excellence in every delivery.</p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-8">
            <h2 className="m-0 font-tight text-[30px] md:text-[40px] font-extrabold">Our values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {VALUES.map((v) => (
                <article key={v.t} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-2.5">
                  <div className="w-11 h-1 rounded bg-[#C8231F]" />
                  <h3 className="m-0 font-tight text-xl font-bold">{v.t}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{v.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-col gap-6">
            <h2 className="m-0 font-tight text-[28px] md:text-[32px] font-extrabold">What we specialize in</h2>
            <div className="flex flex-wrap gap-2.5">
              {SKILLS.map((s) => (
                <span key={s} className="rounded-full border border-[#E2E5EA] bg-white px-5 py-3 font-semibold">{s}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold flex-[1_1_520px]">Want to see how we work? Browse our cases or get in touch.</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/en/success-stories" className="rounded-xl border-2 border-[#0E1116] px-[22px] py-[14px] font-bold hover:bg-[#0E1116] hover:text-white transition-colors">See success stories</Link>
              <Link href="/en/contact" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Request a free intro call</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
