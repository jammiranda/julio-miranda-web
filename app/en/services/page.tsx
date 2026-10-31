import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PACKAGES, SERVICES, SERVICE_STEPS, PRODUCT_NAME } from "@/lib/en/catalog"

export const metadata = pageMeta(
  "Software, AI & Digital Transformation Services · DEVISEBIT",
  "Custom software development, WhatsApp AI assistants, dashboards, tech advisory and digital transformation consulting from an Argentine team since 2009.",
  "/en/services",
)

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Services", "/en/services"]], "en")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Services</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Everything you need to digitize your organization, from one team.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">Start with a ready-to-launch package or build a custom service with us. Every offer rests on products already running in production.</p>
            <nav aria-label="Services" className="flex flex-wrap gap-2 mt-4">
              <a href="#soluciones" className="rounded-full bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 text-sm font-semibold text-white transition-colors">Ready-to-launch packages</a>
              {SERVICES.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-full border border-white/15 hover:border-[#FF6A63] px-4 py-2.5 text-sm font-semibold text-[#D3D7DE] hover:text-white transition-colors">{s.title}</a>
              ))}
            </nav>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section id="soluciones" aria-labelledby="t-sol" className="bg-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Ready-to-launch packages</p>
              <h2 id="t-sol" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">Pick a package and start this week.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Fixed price, in writing. Each package builds on products that already work in production. Tell us what you need and we will send a quote.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PACKAGES.map((x) => (
                <article key={x.id} className="db-card rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col">
                  <Link href={x.href} className="block group" aria-label={`${x.tag}: ${x.cta}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.img} alt="" width={1200} height={630} loading="lazy" className="w-full aspect-[1200/630] object-cover border-b border-[#E2E5EA] group-hover:opacity-90 transition-opacity" />
                  </Link>
                  <div className="p-6 flex flex-col gap-2.5 flex-1">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#C8231F]">{x.tag}</span>
                    <h3 className="m-0 font-tight text-[22px] font-bold leading-snug">{x.title}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{x.text}</p>
                    {x.productos.length > 0 && (
                      <p className="m-0 text-sm text-[#4A515C]">Built on: {x.productos.map((p, i) => <span key={p}>{i > 0 && " · "}<Link href={`/en/products#${p}`} className="underline underline-offset-2 hover:text-[#C8231F]">{PRODUCT_NAME[p]}</Link></span>)}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                      <strong className="font-tight text-lg">Pricing on request</strong>
                      <Link href={x.href} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 font-bold text-white text-[15px] transition-colors">{x.cta} →</Link>
                    </div>
                  </div>
                </article>
              ))}
              <article className="rounded-2xl border-2 border-dashed border-[#C3C8D1] p-6 flex flex-col gap-3 justify-center">
                <h3 className="m-0 font-tight text-[22px] font-bold">Need something different?</h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">We build it to order with our professional services, or start from one of our products.</p>
                <div className="flex flex-wrap gap-2"><a href="#a-medida" className="rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 font-semibold text-[15px]">Custom services</a><Link href="/en/products" className="rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 font-semibold text-[15px]">See products</Link></div>
              </article>
            </div>
          </div>
        </section>

        <section id="a-medida" aria-labelledby="t-med" className="bg-[#F5F6F8] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-[72px] flex flex-col gap-2.5 max-w-[760px]">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Custom professional services</p>
            <h2 id="t-med" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">One team for every stage.</h2>
          </div>
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-8 pb-[72px] grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <article key={s.id} id={s.id} className="db-card scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-7 flex flex-col gap-3">
                <div className="w-11 h-1 rounded bg-[#C8231F]" />
                <h2 className="m-0 font-tight text-[23px] font-bold">{s.title}</h2>
                <p className="m-0 text-base leading-relaxed text-[#4A515C]">{s.text}</p>
                <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                  {s.items.map((i) => (
                    <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>
                  ))}
                </ul>
                <p className="m-0 mt-auto pt-2 text-sm text-[#4A515C]"><span className="font-bold text-[#0E1116]">Real project:</span> {s.caso}</p>
                {(s.ver.length > 0 || s.productos.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E2E5EA]">
                    {s.ver.map((v) => <Link key={v.href} href={v.href} className="rounded-full bg-[#FDECEB] text-[#9E1A17] px-3 py-1 text-[13px] font-semibold hover:bg-[#C8231F] hover:text-white transition-colors">{v.t} →</Link>)}
                    {s.productos.map((p) => <Link key={p} href={`/en/products#${p}`} className="rounded-full border border-[#C3C8D1] px-3 py-1 text-[13px] font-semibold hover:border-[#C8231F]">{PRODUCT_NAME[p]}</Link>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="desarrollo" className="db-tech bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 flex flex-col gap-9">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">How we work</p>
              <h2 className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">From idea to production in four clear steps.</h2>
            </div>
            <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICE_STEPS.map((s) => (
                <li key={s.n} className="db-card rounded-2xl border border-[#262C37] bg-[#161A22] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-[32px] font-extrabold text-[#FF6A63]">{s.n}</span>
                  <strong className="text-[19px]">{s.t}</strong>
                  <span className="text-[#C3C8D1] leading-normal">{s.d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold flex-[1_1_520px]">Not sure where to start? Let&apos;s define it together in a free 30-minute call.</h2>
            <Link href="/en/contact" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Request a free intro call</Link>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
