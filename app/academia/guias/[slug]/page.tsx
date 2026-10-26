import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import { q, one } from "@/lib/db"
import { mdWeb } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = await one<any>("select titulo, bajada from am_guias where slug=$1 and publicada", [params.slug]).catch(() => null)
  return g ? { title: g.titulo, description: g.bajada, openGraph: { title: g.titulo, description: g.bajada, siteName: "Academia DEVISEBIT", locale: "es_AR", type: "article", images: [{ url: "https://desarrollo.devisebit.com/og/og-academia.jpg", width: 1200, height: 630 }] } } : {}
}

export default async function Guia({ params }: { params: { slug: string } }) {
  const g = await one<any>("select * from am_guias where slug=$1 and publicada", [params.slug])
  if (!g) notFound()
  await q("update am_guias set vistas=vistas+1 where id=$1", [g.id]).catch(() => {})
  const abierta = !g.exclusiva || cookies().get("acad")?.value === "1"
  const html = mdWeb(g.contenido)
  const previa = mdWeb(g.contenido.split("\n## ").slice(0, 2).join("\n## "))
  const otras = await q<any>("select slug, titulo, categoria from am_guias where publicada and id<>$1 order by random() limit 3", [g.id])
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: g.titulo, description: g.bajada, author: { "@type": "Organization", name: "DEVISEBIT SRL" }, publisher: { "@type": "Organization", name: "DEVISEBIT SRL" }, datePublished: new Date(g.creado).toISOString() }
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="ficha-head bg-[#0E1116] text-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link href="/guias" className="text-sm text-white/60 hover:text-white">← Guías</Link>
          <p className="m-0 mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6A63]">{g.categoria}</p>
          <h1 className="m-0 mt-2 text-3xl sm:text-5xl leading-tight font-extrabold text-white">{g.titulo}</h1>
          <p className="m-0 mt-4 text-lg text-white/80">{g.bajada}</p>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-4 py-10">
        {abierta ? (
          <div className="prosa" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <>
            <div className="prosa relative max-h-[420px] overflow-hidden" dangerouslySetInnerHTML={{ __html: previa }} />
            <div className="-mt-24 relative pt-24 bg-gradient-to-t from-[#F5F6F8] via-[#F5F6F8] to-transparent">
              <div className="card border-2 border-[#C8231F] flex flex-col gap-3">
                <p className="m-0 text-xl font-extrabold">Seguí leyendo gratis</p>
                <p className="m-0 text-[#4A515C]">Dejanos tu email y se abre la guía completa. Además, cada semana te llega una nueva.</p>
                <Suscribir tag={`guia-${g.slug}`.slice(0, 40)} desbloquea boton="Abrir la guía" />
              </div>
            </div>
          </>
        )}
        {abierta && (
          <section id="suscribirme" className="mt-12 card flex flex-col gap-3 scroll-mt-24">
            <p className="m-0 text-xl font-extrabold">¿Te sirvió? Recibí una guía nueva cada semana</p>
            <Suscribir />
          </section>
        )}
        {otras.length > 0 && (
          <section className="mt-10"><h2 className="m-0 text-lg font-bold">Seguí aprendiendo</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">{otras.map((o) => <Link key={o.slug} href={`/guias/${o.slug}`} className="card no-underline text-[#0E1116] hover:border-[#C8231F]"><span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{o.categoria}</span><p className="m-0 mt-1 font-bold leading-snug">{o.titulo}</p></Link>)}</div>
          </section>
        )}
      </article>
    </main>
  )
}
