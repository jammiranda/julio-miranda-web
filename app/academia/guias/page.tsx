import Link from "next/link"
import type { Metadata } from "next"
import { q } from "@/lib/db"
import { sembrar } from "@/lib/academia"
export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Guías", description: "Todas las guías gratis de la Academia DEVISEBIT: IA, automatización, WhatsApp, datos y seguridad." }

export default async function Guias({ searchParams }: { searchParams: { c?: string } }) {
  await sembrar()
  const todas = await q<any>("select slug, titulo, bajada, categoria, exclusiva from am_guias where publicada order by destacada desc, creado desc")
  const cats = Array.from(new Set(todas.map((g) => g.categoria).filter(Boolean))) as string[]
  const lista = searchParams.c ? todas.filter((g) => g.categoria === searchParams.c) : todas
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="m-0 text-4xl font-extrabold">Guías</h1>
      <p className="m-0 mt-2 text-lg text-[#4A515C]">Prácticas, cortas y en castellano. {todas.length} y contando.</p>
      <nav aria-label="Categorías" className="mt-6 flex flex-wrap gap-2">
        <Link href="/guias" className={`chip text-sm px-3 py-1 border ${!searchParams.c ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>Todas</Link>
        {cats.map((c) => <Link key={c} href={`/guias?c=${encodeURIComponent(c)}`} className={`chip text-sm px-3 py-1 border ${searchParams.c === c ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{c}</Link>)}
      </nav>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{g.categoria}{g.exclusiva ? " · Para suscriptores" : ""}</span>
            <span className="text-lg font-bold leading-snug">{g.titulo}</span>
            <span className="text-sm text-[#4A515C]">{g.bajada}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
