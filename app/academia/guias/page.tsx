import type { Metadata } from "next"
import { q } from "@/lib/db"
import { sembrar } from "@/lib/academia"
import GuiasLista from "./GuiasLista"
export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Guías", description: "Todas las guías gratis de la ACADEMIA DEVISEBIT: IA, automatización, WhatsApp, datos y seguridad." }

export default async function Guias({ searchParams }: { searchParams: { c?: string } }) {
  await sembrar()
  const todas = await q<any>("select slug, titulo, bajada, categoria, exclusiva from am_guias where publicada order by destacada desc, creado desc")
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="acad-h1-m m-0 font-extrabold">Guías</h1>
      <p className="acad-lead m-0 mt-2 text-[#4A515C] max-w-2xl">Prácticas, cortas y en castellano. Buscá por palabra o elegí un tema.</p>
      <GuiasLista guias={todas} inicial={searchParams.c} />
    </main>
  )
}
