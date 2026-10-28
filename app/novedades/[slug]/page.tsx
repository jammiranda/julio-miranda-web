import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { posts } from "@/lib/posts"
import NotaCta from "@/components/nota-cta"
import { pageMeta, OG_IMAGE } from "@/lib/seo"

const NUM: Record<number, string> = { 2: "Dos", 3: "Tres", 4: "Cuatro", 5: "Cinco", 6: "Seis" }

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = posts.find((x) => x.slug === slug)
  if (!p) return {}
  return pageMeta(`${p.title} · DEVISEBIT`, p.desc, `/novedades/${p.slug}`, {
    openGraph: { title: p.title, description: p.desc, url: `/novedades/${p.slug}`, siteName: "DEVISEBIT", locale: "es_AR", type: "article", publishedTime: p.date, images: [OG_IMAGE] },
  })
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = posts.find((x) => x.slug === slug)
  if (!p) notFound()
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[860px] mx-auto px-4 md:px-8 pt-14 pb-16 flex flex-col gap-4">
            <Link href="/novedades" className="self-start text-sm font-semibold text-[#FF6A63] hover:text-white">← Novedades</Link>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{p.kicker}</p>
            <h1 className="m-0 font-tight text-[32px] md:text-[46px] leading-[1.1] font-extrabold">{p.title}</h1>
            <p className="m-0 text-[#C3C8D1]">{p.dateTxt} · Equipo DEVISEBIT</p>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <article className="max-w-[860px] mx-auto px-4 md:px-8 py-14">
          <p className="m-0 mb-8 text-xl leading-relaxed text-[#4A515C] font-medium">{p.desc}</p>
          <div className="flex flex-col gap-5 text-lg leading-[1.75]">
            {p.body.map((t, i) => (<p key={i} className="m-0">{t}</p>))}
          </div>
          {p.box && (
            <div className="mt-10 rounded-[20px] bg-[#0B0D12] text-white p-7">
              <p className="m-0 mb-4 font-tight text-xl font-bold">{NUM[p.box.length] ?? p.box.length} preguntas para hacerte hoy</p>
              <ul className="m-0 p-0 list-none flex flex-col gap-3">
                {p.box.map((t, i) => (<li key={i} className="flex gap-3"><span className="text-[#FF6A63] font-extrabold" aria-hidden="true">{i + 1}.</span>{t}</li>))}
              </ul>
            </div>
          )}
          <NotaCta titulo={p.title} slug={p.slug} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Hablemos de tu proyecto</Link>
            <Link href="/novedades" className="rounded-xl border-2 border-[#0E1116] px-[22px] py-[14px] font-bold hover:bg-[#0E1116] hover:text-white transition-colors">Más novedades</Link>
          </div>
          <div className="mt-12 border-t border-[#E2E5EA] pt-6 text-[15px] text-[#4A515C]">
            <p className="m-0 mb-3 font-bold text-[#0E1116]">Fuentes</p>
            <ul className="m-0 pl-5 flex flex-col gap-2">
              {p.sources.map((s, i) => (<li key={i}><a href={s.u} target="_blank" rel="noopener noreferrer" className="underline text-[#4A515C] hover:text-[#C8231F]">{s.t}</a></li>))}
            </ul>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
