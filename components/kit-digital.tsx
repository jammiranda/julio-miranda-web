import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import ArmaKit from "@/components/arma-kit"
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
          <div className="relative max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-20 flex flex-col gap-5">
            <p className={kicker + " text-[#FF6A63]"}>{t.kicker}</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[60px] leading-[1.04] font-extrabold tracking-[-0.02em] max-w-[900px]">{t.h1}</h1>
            <p className="m-0 text-lg md:text-xl leading-relaxed text-[#C3C8D1] max-w-[720px]">{t.sub}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#arma" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">{t.ctaPrincipal}</a>
              <Link href={t.diagHref} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">{t.ctaDiag}</Link>
            </div>
          </div>
        </section>

        <section aria-label={t.kicker} className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-2 gap-6">
            {kits.map((k, i) => (
              <article key={k.id} id={k.id} className="scroll-mt-[88px] rounded-3xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-5 shadow-[0_20px_50px_-30px_rgba(14,17,22,.25)]">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-12 h-12 rounded-2xl bg-[#C8231F] text-white font-tight font-extrabold text-lg flex items-center justify-center">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex flex-col gap-1">
                    <h2 className="m-0 font-tight text-[24px] md:text-[28px] leading-tight font-extrabold">{k.nombre}</h2>
                    <span className="text-[13px] font-bold uppercase tracking-widest text-[#C8231F]">{k.producto}</span>
                  </div>
                </div>
                <p className="m-0 text-[16.5px] leading-relaxed"><strong>{t.paraT}:</strong> <span className="text-[#4A515C]">{k.para}</span></p>
                <p className="m-0 text-[16.5px] leading-relaxed text-[#0E1116] font-semibold">{k.resuelve}</p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="m-0 text-sm font-extrabold uppercase tracking-widest text-[#0B0D12]">{t.incluyeT}</h3>
                    <ul className="m-0 pl-0 list-none flex flex-col gap-1.5">{k.incluye.map((x) => <li key={x} className="flex gap-2 text-[15px] leading-snug text-[#4A515C]"><span aria-hidden="true" className="text-[#C8231F] font-bold">✓</span>{x}</li>)}</ul>
                  </div>
                  <div className="flex flex-col gap-2 rounded-2xl bg-[#FFF4F2] p-4">
                    <h3 className="m-0 text-sm font-extrabold uppercase tracking-widest text-[#7E1512]">{t.recibisT}</h3>
                    <ul className="m-0 pl-0 list-none flex flex-col gap-1.5">{k.entregables.map((x) => <li key={x} className="flex gap-2 text-[15px] leading-snug text-[#3B424D]"><span aria-hidden="true" className="text-[#C8231F] font-bold">→</span>{x}</li>)}</ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="k-pasos" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <h2 id="k-pasos" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">{t.pasosT}</h2>
            <ol className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {t.pasos.map(([a, b], i) => (
                <li key={a} className="rounded-2xl border border-[#E2E5EA] p-6 flex flex-col gap-1.5">
                  <span className="font-tight text-[28px] font-extrabold text-[#C8231F]">{String(i + 1).padStart(2, "0")}</span>
                  <strong className="text-[18px]">{a}</strong>
                  <span className="text-[15px] leading-normal text-[#4A515C]">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="financiamiento" aria-labelledby="k-fin" className="db-tech relative overflow-hidden bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(700px 380px at 0% 100%, rgba(200,35,31,.3), transparent 70%)" }} />
          <div className="relative max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
            <div className="flex flex-col gap-4">
              <p className={kicker + " text-[#FF6A63]"}>{t.finKicker}</p>
              <h2 id="k-fin" className="m-0 font-tight text-[32px] md:text-[46px] leading-[1.08] font-extrabold tracking-[-0.02em]">{t.finH2}</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">{t.finP}</p>
              <Link href={t.guiaHref} className="self-start font-bold text-[#FF6A63] underline underline-offset-4">{t.guia} →</Link>
            </div>
            <div className="flex flex-col gap-3">
              <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-3">
                {t.finPts.map(([a, b]) => (
                  <li key={a} className="rounded-2xl border border-white/10 bg-[#161A22] p-5 flex flex-col gap-1.5">
                    <strong className="text-[17px]">{a}</strong>
                    <span className="text-[15px] leading-normal text-[#C3C8D1]">{b}</span>
                  </li>
                ))}
              </ul>
              <p className="m-0 text-[13.5px] leading-relaxed text-[#9AA1AD]">{t.finNota}</p>
            </div>
          </div>
        </section>

        <section id="arma" aria-label={t.armaT} className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-[72px]">
            <ArmaKit kits={kits} titulo={t.armaT} ayuda={t.armaP} boton={t.armaBtn} vacio={t.armaVacio} mensaje={t.armaMsg} />
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
