import Image from "next/image"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import MapaProyectos from "@/components/mapa-proyectos"
import { CASOS_EN, SECTORES_EN } from "@/lib/casos-datos-en"
import { WHATSAPP_EN as WHATSAPP } from "@/lib/marca"
import { SITE_URL, breadcrumb, pageMeta } from "@/lib/seo"

export const metadata = pageMeta(
  "Success Stories: 150+ Software & AI Projects · DEVISEBIT",
  "Real software and AI projects running in production for healthcare, government, universities, unions and companies. See the challenge, work and result.",
  "/en/success-stories",
)

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]"

const TECNOLOGIAS = [
  "React Native", "Firebase", "WordPress", "Moodle", "Microsoft Power BI", "Python", "JavaScript", "PHP",
  "PostgreSQL", ".NET Core", "Vue.js", "SSO", "CRM", "Agile Scrum", "UX/UI", "Cybersecurity", "Web scraping",
]

export default function SuccessStoriesPage() {
  const sector = (id: string) => SECTORES_EN.find((s) => s.id === id)?.name ?? ""
  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <JsonLd data={breadcrumb([["Success stories", "/en/success-stories"]], "en")} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "DEVISEBIT success stories",
          url: `${SITE_URL}/en/success-stories`,
          inLanguage: "en",
          description: "Real projects in production: systems, apps, academies, dashboards and media for healthcare, government, universities, unions and companies.",
          about: { "@id": `${SITE_URL}/#organization` },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: CASOS_EN.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, description: c.challenge })),
          },
        }}
      />
      <Header lang="en" />
      <main id="contenido">
        <section className="db-tech bg-[#0B0D12] text-white mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-10 flex flex-col gap-4">
            <p className={kicker}>Success stories</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Success stories: real projects, running in production.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[780px]">
              This is how we help healthcare providers, government agencies, universities, unions and companies run better with software. Explore the map, read the featured cases and see the scope of 150+ projects delivered since 2009.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href="#casos" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">See the featured cases</a>
              <Link href="/en/contact#formulario" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[18px] py-[10px] font-semibold text-white transition-colors">Tell us about your project</Link>
            </div>
          </div>
        </section>

        <MapaProyectos lang="en" />

        <section id="casos" aria-labelledby="t-casos" className="bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-10">
            <div className="flex flex-col gap-3 max-w-[820px]">
              <p className={kicker}>Featured cases</p>
              <h2 id="t-casos" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">The challenge, what we did and the result.</h2>
            </div>
            <div className="flex flex-col gap-8">
              {CASOS_EN.map((c, i) => (
                <article key={c.id} className="overflow-hidden rounded-2xl border border-[#262C37] bg-[#161A22] grid lg:grid-cols-[1fr_1.2fr]">
                  <div className="relative">
                    <Image
                      src={c.image}
                      alt={`${c.title}: ${c.industry}`}
                      width={1094}
                      height={600}
                      unoptimized
                      loading={i < 2 ? "eager" : "lazy"}
                      className="w-full h-full object-cover min-h-[220px]"
                    />
                    <span className="absolute left-4 bottom-4 rounded-full bg-[#C8231F] px-3 py-1 text-[12px] font-bold">{sector(c.sector)}</span>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col gap-4">
                    <div>
                      <p className="m-0 text-sm font-semibold text-[#FF9A95]">{c.client} · {c.industry}</p>
                      <h3 className="m-0 mt-1 font-tight text-[22px] md:text-[26px] leading-snug font-bold">{c.title}</h3>
                      <p className="m-0 mt-1 text-sm text-[#9AA1AD]">{c.category}</p>
                    </div>
                    <dl className="m-0 flex flex-col gap-3">
                      <div><dt className="text-sm font-bold text-white">Challenge</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.challenge}</dd></div>
                      <div><dt className="text-sm font-bold text-white">What we did</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.service}</dd></div>
                      <div><dt className="text-sm font-bold text-white">Result</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.achievements}</dd></div>
                    </dl>
                    <ul className="m-0 p-0 list-none flex flex-wrap gap-2 mt-auto">
                      {c.technologies.map((t) => <li key={t} className="rounded-full border border-[#FF6A63]/40 px-3 py-1 text-[13px] text-[#FFB4AF]">{t}</li>)}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="t-tech" className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            <div className="flex flex-col gap-3 max-w-[820px]">
              <p className={kicker}>Technology</p>
              <h2 id="t-tech" className="m-0 font-tight text-[28px] md:text-[36px] leading-[1.1] font-extrabold">Proven tools, chosen for the problem.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">We pick the stack that fits each project and each team, not the other way around. These are the technologies behind the cases above.</p>
            </div>
            <ul className="m-0 p-0 list-none flex flex-wrap gap-2.5">
              {TECNOLOGIAS.map((t) => <li key={t} className="rounded-full border border-white/20 px-4 py-2 text-[15px] font-semibold text-[#D3D7DE]">{t}</li>)}
            </ul>
          </div>
        </section>

        <section className="db-tech py-20 bg-[#0B0D12] border-t border-white/10">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-6">
              <TrendingUp className="w-16 h-16 text-red-500" aria-hidden="true" />
            </div>
            <h2 className="font-tight text-3xl md:text-4xl font-extrabold text-white mb-6">Is your project the next success story?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Join the organizations that already run on our software. The first 30-minute call is free.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/en/contact#formulario" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Request a free intro call</Link>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">Message us on WhatsApp</a>
              <Link href="/en/services" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">See our services</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer lang="en" />
    </div>
  )
}
