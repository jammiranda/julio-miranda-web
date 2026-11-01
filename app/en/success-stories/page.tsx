import Link from "next/link"
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
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-8 flex flex-col gap-4">
            <p className={kicker}>Success stories</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Success stories: real projects, running in production.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[780px]">
              150+ projects since 2009. Pick a sector on the map and see what we built, for whom and with what result.
            </p>
          </div>
        </section>

        <MapaProyectos lang="en" />

        <section aria-labelledby="t-lista" className="bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/en/success-stories/all" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">See every case in detail →</Link>
            </div>
            <details className="rounded-2xl border border-[#262C37] bg-[#161A22] p-5">
              <summary id="t-lista" className="cursor-pointer font-bold text-[17px]">I prefer a plain list</summary>
              <ul className="mt-4 mb-0 p-0 list-none grid md:grid-cols-2 gap-4">
                {CASOS_EN.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1">
                    <strong className="text-[16px]">{c.title}</strong>
                    <span className="text-sm text-[#FF9A95]">{c.client} · {sector(c.sector)}</span>
                    <span className="text-[15px] leading-relaxed text-[#C3C8D1]">{c.achievements}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        <section className="db-tech py-16 bg-[#0B0D12] border-t border-white/10">
          <div className="max-w-[900px] mx-auto px-4 text-center flex flex-col gap-5 items-center">
            <h2 className="m-0 font-tight text-3xl md:text-4xl font-extrabold text-white">Is your project the next success story?</h2>
            <p className="m-0 text-lg text-[#C3C8D1] max-w-2xl">Tell us what you need and we will show you how it connects to what you already run. The first 30-minute call is free.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/en/contact#formulario" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Request a free intro call</Link>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">Message us on WhatsApp</a>
            </div>
          </div>
        </section>
      </main>

      <Footer lang="en" />
    </div>
  )
}
