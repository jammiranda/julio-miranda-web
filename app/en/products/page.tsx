import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WHATSAPP_EN as WHATSAPP } from "@/lib/marca"
import { PRODUCTS, PRODUCT_STEPS } from "@/lib/en/catalog"

export const metadata = pageMeta(
  "AI Products & Business Systems · DEVISEBIT",
  "Proven software you can deploy fast: WhatsApp AI assistant, clinic system, member CRM, dashboards, mobile apps, online academies, e-voting and e-signature.",
  "/en/products",
)

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Products", "/en/products"]], "en")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Products</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Proven systems, ready to deploy.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">We don&apos;t start from scratch. We adapt products that already run in production, which shortens the timeline and lowers the risk.</p>
            <div className="flex flex-wrap gap-2 mt-3"><Link href="/en/services#soluciones" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">See ready-to-launch packages</Link><Link href="/en/services#a-medida" className="rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3 font-bold text-white transition-colors">Custom services</Link></div>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCTS.map((p) => (
              <article key={p.id} id={p.id} className="db-card scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h2 className="m-0 font-tight text-xl font-bold">{p.title}</h2>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.text}</p>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5 border-t border-[#E2E5EA] pt-3">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2 text-sm"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-[#E2E5EA]">
                  <Link href={`/en/contact?tema=${encodeURIComponent("Demo: " + p.title)}#formulario`} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors">Request a demo</Link>
                  <span className="text-xs text-[#4A515C] text-center">We show it running in a free 30-minute video call. Pricing on request.</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="destacado" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-wrap gap-12">
            <div className="flex-[1_1_420px] min-w-0">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Featured product</p>
              <h2 id="destacado" className="mt-2 mb-3 font-tight text-[32px] md:text-[40px] leading-[1.1] font-extrabold">Customer service on WhatsApp, 24 hours a day. No extra headcount.</h2>
              <p className="m-0 mb-4 text-lg leading-relaxed text-[#4A515C]">An assistant that understands what customers write, books appointments and hands off to your team when needed. It goes live in weeks, at a fixed price.</p>
              {["Answers 24 hours a day, 7 days a week", "Books, confirms and reschedules appointments", "Hands off to a person when needed", "Saves every conversation in the CRM", "Sends automatic reminders", "Service metrics dashboard"].map((t) => (
                <div key={t} className="flex gap-3 items-start py-4 border-b border-[#E2E5EA]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span><span className="text-[17px]">{t}</span></div>
              ))}
            </div>
            <div className="db-tech flex-[1_1_420px] min-w-0 rounded-[20px] bg-[#0B0D12] p-7 flex flex-col gap-3 text-white">
              <div className="text-[13px] text-[#C3C8D1]"><span className="db-live" />Sample conversation</div>
              <div className="db-rise self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">Hi, do you have a physical therapy slot this week?</div>
              <div className="db-rise2 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">Hi! I have Thursday at 10:00 or Friday at 4:30 PM. Which works better for you?</div>
              <div className="db-rise3 self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">Thursday at 10</div>
              <div className="db-rise3 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">Done, you&apos;re booked. I&apos;ll send you a reminder the day before.</div>
              <div className="db-rise3 self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">Do you accept my health insurance?</div>
              <div className="db-rise3 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">To confirm your coverage, I&apos;m connecting you with Laura from admissions. I&apos;ve already passed along your question 👇</div>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
                <span className="text-[13px] text-[#C3C8D1]">Assistant dashboard · sample data</span>
                <div className="grid grid-cols-3 gap-2">
                  {[["312", "inquiries this month"], ["74%", "resolved automatically"], ["58", "appointments booked"]].map(([n, l]) => (
                    <div key={l} className="rounded-xl bg-[#161A22] border border-[#262C37] p-3"><strong className="block font-tight text-2xl">{n}</strong><span className="text-xs text-[#C3C8D1]">{l}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-7">
            <h2 className="m-0 font-tight text-[30px] md:text-[36px] font-extrabold">How we implement it</h2>
            <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCT_STEPS.map((s) => (
                <li key={s.n} className="db-card rounded-2xl border border-[#262C37] bg-[#161A22] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-[30px] font-extrabold text-[#FF6A63]">{s.n}</span>
                  <strong className="text-[19px]">{s.t}</strong>
                  <span className="text-[#C3C8D1] leading-normal">{s.d}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link href={`/en/contact?tema=${encodeURIComponent("Demo: WhatsApp AI assistant")}#formulario`} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Request a free intro call</Link>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-bold text-[17px] text-white transition-colors">Message us on WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
