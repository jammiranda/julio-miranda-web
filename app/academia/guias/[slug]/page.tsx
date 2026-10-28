import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import { q, one } from "@/lib/db"
import { mdWeb } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
import VolverArriba from "../../_ui/VolverArriba"
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = await one<any>("select titulo, bajada from am_guias where slug=$1 and publicada", [params.slug]).catch(() => null)
  return g ? { title: g.titulo, description: g.bajada, openGraph: { title: g.titulo, description: g.bajada, siteName: "ACADEMIA DEVISEBIT", locale: "es_AR", type: "article", images: [{ url: "https://desarrollo.devisebit.com/og/og-academia.jpg", width: 1200, height: 630 }] } } : {}
}

/** Agrega ids a los h2 para armar el índice y poder enlazar secciones. */
function conIndice(html: string) {
  const usados = new Set<string>()
  const indice: { id: string; texto: string }[] = []
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, dentro: string) => {
    const texto = dentro.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    let id = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "seccion"
    while (usados.has(id)) id += "-2"
    usados.add(id)
    indice.push({ id, texto })
    return `<h2 id="${id}">${dentro}</h2>`
  })
  return { html: out, indice }
}

export default async function Guia({ params }: { params: { slug: string } }) {
  const g = await one<any>("select * from am_guias where slug=$1 and publicada", [params.slug])
  if (!g) notFound()
  await q("update am_guias set vistas=vistas+1 where id=$1", [g.id]).catch(() => {})
  const abierta = !g.exclusiva || cookies().get("acad")?.value === "1"
  const { html, indice } = conIndice(mdWeb(g.contenido))
  const minutos = Math.max(1, Math.round(String(g.contenido).split(/\s+/).length / 200))
  const conToc = abierta && indice.length >= 3
  const previa = mdWeb(g.contenido.split("\n## ").slice(0, 2).join("\n## "))
  const otras = await q<any>("select slug, titulo, categoria from am_guias where publicada and id<>$1 order by random() limit 3", [g.id])
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: g.titulo, description: g.bajada, author: { "@type": "Organization", name: "DEVISEBIT SRL" }, publisher: { "@type": "Organization", name: "DEVISEBIT SRL" }, datePublished: new Date(g.creado).toISOString() }
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="ficha-head bg-[#0E1116] text-white">
        <div className={conToc ? "max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12" : ""}>
        <div className={`max-w-3xl mx-auto pt-4 pb-8 sm:pt-8 sm:pb-12 ${conToc ? "w-full lg:mx-0 lg:justify-self-end" : "px-4"}`}>
          <nav aria-label="Ruta"><Link href="/guias" className="inline-flex items-center min-h-[44px] -ml-1 px-1 text-sm text-white/70 hover:text-white">← Guías</Link></nav>
          <p className="m-0 mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6A63]">{g.categoria}<span className="text-white/60 font-semibold normal-case tracking-normal"> · {minutos} min de lectura</span></p>
          <h1 className="acad-h1-m m-0 mt-2 font-extrabold text-white">{g.titulo}</h1>
          <p className="acad-lead m-0 mt-4 text-white/80">{g.bajada}</p>
        </div>
        </div>
      </header>
      <div className={conToc ? "max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12" : ""}>
      <article className={`max-w-3xl mx-auto py-8 sm:py-10 ${conToc ? "w-full lg:mx-0 lg:justify-self-end" : "px-4"}`}>
        {conToc && (
          <details className="lg:hidden mb-8 rounded-2xl bg-white border border-[#E2E5EA] group">
            <summary className="flex items-center justify-between gap-3 min-h-[52px] px-4 font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span>En esta guía <span className="font-normal text-[#4A515C]">· {indice.length} secciones</span></span>
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
            </summary>
            <ol className="m-0 px-4 pb-3 list-none flex flex-col border-t border-[#EEF0F3]">
              {indice.map((i, k) => <li key={i.id}><a href={`#${i.id}`} className="flex gap-3 py-3 min-h-[44px] text-[15px] leading-snug text-[#262C37] no-underline border-b border-[#EEF0F3] last:border-0"><span className="text-[#C8231F] font-bold tabular-nums">{k + 1}</span>{i.texto}</a></li>)}
            </ol>
          </details>
        )}
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
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{otras.map((o) => <Link key={o.slug} href={`/guias/${o.slug}`} className="card no-underline text-[#0E1116] hover:border-[#C8231F]"><span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{o.categoria}</span><p className="m-0 mt-1 font-bold leading-snug">{o.titulo}</p></Link>)}</div>
          </section>
        )}
      </article>
      {conToc && (
        <aside className="hidden lg:block py-10">
          <nav aria-label="En esta guía" className="sticky top-24">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-[#4A515C]">En esta guía</p>
            <ol className="m-0 mt-3 p-0 list-none flex flex-col gap-1 border-l-2 border-[#E2E5EA]">
              {indice.map((i) => <li key={i.id}><a href={`#${i.id}`} className="block py-2.5 pl-3 -ml-[2px] border-l-2 border-transparent hover:border-[#C8231F] text-sm leading-snug text-[#4A515C] hover:text-[#0E1116] no-underline">{i.texto}</a></li>)}
            </ol>
          </nav>
        </aside>
      )}
      </div>
      <VolverArriba />
    </main>
  )
}
