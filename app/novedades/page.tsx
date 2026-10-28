import Link from "next/link"
import { pageMeta } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"
import { posts } from "@/lib/posts"

export const metadata = pageMeta(
  "Novedades · DEVISEBIT",
  "Notas semanales sobre software, inteligencia artificial y salud digital, siempre con sus fuentes. El blog de DEVISEBIT.",
  "/novedades",
)

export default function NovedadesPage() {
  const list = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))
  const [first, ...rest] = list
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <DbHero kicker="Novedades" title="Software, IA y salud digital." sub="Notas breves sobre lo que pasa en tecnología, siempre con sus fuentes. Una nueva cada semana." />

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            {first && (
              <Link href={`/novedades/${first.slug}`} className="db-card group rounded-[20px] border border-[#E2E5EA] bg-white p-7 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-end text-[#0E1116]">
                <div className="flex flex-col gap-3">
                  <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C8231F]">Última nota · {first.kicker} · {first.dateTxt}</p>
                  <h2 className="m-0 font-tight text-[28px] md:text-[38px] leading-[1.12] font-extrabold max-w-[900px]">{first.title}</h2>
                  <p className="m-0 text-lg leading-relaxed text-[#4A515C] max-w-[820px]">{first.desc}</p>
                </div>
                <span className="font-bold text-[#C8231F] group-hover:text-[#9E1A17] whitespace-nowrap">Leer nota →</span>
              </Link>
            )}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((p) => (
                  <Link key={p.slug} href={`/novedades/${p.slug}`} className="db-card rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-2.5 text-[#0E1116]">
                    <p className="m-0 text-xs font-bold uppercase tracking-widest text-[#C8231F]">{p.kicker} · {p.dateTxt}</p>
                    <h3 className="m-0 font-tight text-xl font-bold">{p.title}</h3>
                    <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.desc}</p>
                    <span className="mt-auto pt-2 font-bold text-[#C8231F]">Leer nota →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
