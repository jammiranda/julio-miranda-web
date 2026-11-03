import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import KitSelector from "@/components/kit-selector"
import CasosRelacionados from "@/components/casos-relacionados"
import { KITS, TEXTO, type Lang } from "@/lib/kits"
import { SITE_URL, breadcrumb, servicio } from "@/lib/seo"

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"

export default function KitDigital({ lang }: { lang: Lang }) {
  const t = TEXTO[lang]
  const kits = KITS[lang]
  const path = lang === "en" ? "/en/digital-kit" : "/kit-digital"
  const WA = "https://wa.me/5491173466490?text=" + encodeURIComponent(lang === "en" ? "Hello DEVISEBIT, I would like to review which kit fits my organization" : "Hola DEVISEBIT, quiero revisar qué kit me conviene")
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([[t.kicker, path]], lang)} />
      <JsonLd data={servicio(t.kicker, t.sub, path, "Technology kits")} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: t.kicker, url: SITE_URL + path, itemListElement: kits.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: k.nombre, description: k.resuelve })) }} />
      <Header lang={lang} />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech relative overflow-hidden bg-[#0B0D12] text-white">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(800px 420px at 85% 0%, rgba(200,35,31,.4), transparent 70%)" }} />
          <div className="relative max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-14 flex flex-col gap-5">
            <p className={kicker + " text-[#FF8E88]"}>{t.kicker}</p>
            <h1 className="m-0 font-tight text-[36px] md:text-[54px] leading-[1.04] font-extrabold tracking-[-0.02em] max-w-[900px]">{t.h1}</h1>
            <p className="m-0 text-lg md:text-xl leading-relaxed text-[#C3C8D1] max-w-[720px]">{t.sub}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#kits" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">{t.eligeT}</a>
              <Link href={t.diagHref} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">{t.ctaDiag}</Link>
            </div>
          </div>
        </section>

        <section id="kits" aria-label={t.eligeT} className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-12 md:py-16 pb-24 lg:pb-16">
            <KitSelector kits={kits} textos={{ eligeT: t.eligeT, contratar: t.contratar, detalle: t.detalle, ocultar: t.ocultar, incluyeT: t.incluyeT, recibisT: t.recibisT, paraT: t.paraT, despuesT: t.despuesT, msg: t.armaMsg }} />
          </div>
        </section>

        <section aria-labelledby="k-sigue" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-14 md:py-16 flex flex-col gap-7">
            <div className="flex flex-col gap-2 max-w-[720px]">
              <h2 id="k-sigue" className="m-0 font-tight text-[28px] md:text-[40px] leading-[1.1] font-extrabold">{t.sigueH} <span className="text-[#C8231F]">{t.despuesT}.</span></h2>
              <p className="m-0 text-[17px] text-[#4A515C]">{t.sigueP}</p>
            </div>
            <ul className="m-0 p-0 list-none grid md:grid-cols-3 gap-4">
              {t.sigCards.map(([a, b, h]) => (
                <li key={a}><Link href={h} className="db-card group h-full rounded-2xl border border-[#E2E5EA] p-6 flex flex-col gap-1.5 hover:border-[#C8231F] transition-colors"><strong className="font-tight text-[20px]">{a} <span aria-hidden="true" className="text-[#C8231F] inline-block group-hover:translate-x-1 transition-transform">→</span></strong><span className="text-[15px] text-[#4A515C]">{b}</span></Link></li>
              ))}
            </ul>
          </div>
        </section>

        <section id="financiamiento" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10 flex flex-wrap gap-4 items-center justify-between">
            <p className="m-0 text-[17px] md:text-[18px] leading-snug max-w-[820px]"><strong className="text-[#FF8E88]">{t.finKicker}.</strong> {t.finCorto}</p>
            <Link href={t.guiaHref} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[12px] font-bold transition-colors">{t.finLink} →</Link>
          </div>
        </section>

        <CasosRelacionados ids={[2, 3, 9]} lang={lang} />

        <section aria-labelledby="k-faq" className="bg-white">
          <div className="max-w-[900px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            <h2 id="k-faq" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">{t.faqT}</h2>
            <div className="flex flex-col gap-3">
              {t.faq.map(([q, a]) => (
                <details key={q} className="rounded-2xl border border-[#E2E5EA] p-5 open:bg-[#F5F6F8]">
                  <summary className="cursor-pointer font-bold text-[17px]">{q}</summary>
                  <p className="mt-3 mb-0 text-[16px] leading-relaxed text-[#4A515C]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_560px] flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">{t.cierreH}</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">{t.cierreP}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors">{t.wa}</a>
              <Link href={t.diagHref} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">{t.ctaDiag}</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </div>
  )
}
