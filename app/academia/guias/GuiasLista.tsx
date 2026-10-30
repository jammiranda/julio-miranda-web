"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type Guia = { slug: string; titulo: string; bajada: string; categoria: string | null; exclusiva: boolean }

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Lista de guías con búsqueda y tema, filtrando al instante (sin recargar). */
export default function GuiasLista({ guias, inicial }: { guias: Guia[]; inicial?: string }) {
  const temas = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of guias) if (g.categoria) m.set(g.categoria, (m.get(g.categoria) ?? 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
  }, [guias])
  const [tema, setTema] = useState(inicial && temas.some(([t]) => t === inicial) ? inicial : "")
  const [busca, setBusca] = useState("")

  const lista = useMemo(() => {
    const b = sinTildes(busca.trim())
    return guias.filter((g) => (!tema || g.categoria === tema) && (!b || sinTildes(`${g.titulo} ${g.bajada} ${g.categoria ?? ""}`).includes(b)))
  }, [guias, tema, busca])

  const elegir = (t: string) => {
    setTema(t)
    try { const u = new URL(window.location.href); if (t) u.searchParams.set("c", t); else u.searchParams.delete("c"); window.history.replaceState(null, "", u) } catch {}
  }
  const hayFiltro = !!tema || !!busca.trim()

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
      {/* Filtros: arriba en celular, columna fija en compu */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <label className="relative block">
          <span className="sr-only">Buscar guías</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A919C]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar una guía…" enterKeyHint="search" autoComplete="off"
            className="inp !pl-11 !min-h-[48px] w-full bg-white" />
        </label>

        <label className="lg:hidden flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#4A515C]">Tema</span>
          <select value={tema} onChange={(e) => elegir(e.target.value)} className="inp !min-h-[48px] bg-white">
            <option value="">Todos los temas ({guias.length})</option>
            {temas.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
          </select>
        </label>

        <nav aria-label="Temas" className="hidden lg:flex flex-col gap-0.5 rounded-2xl bg-white border border-[#E2E5EA] p-2">
          <p className="m-0 px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#4A515C]">Temas</p>
          {[["", guias.length] as [string, number], ...temas].map(([t, n]) => {
            const activo = tema === t
            return (
              <button key={t || "todos"} type="button" onClick={() => elegir(t)} aria-pressed={activo}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 min-h-[44px] text-left text-[15px] transition-colors ${activo ? "bg-[#0B7462] text-white font-semibold" : "text-[#262C37] hover:bg-[#F5F6F8]"}`}>
                <span>{t || "Todas las guías"}</span>
                <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${activo ? "bg-white/15 text-white" : "bg-[#F5F6F8] text-[#4A515C]"}`}>{n}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <section aria-live="polite" aria-label="Resultados">
        <div className="flex items-center justify-between gap-3 min-h-[32px]">
          <p className="m-0 text-sm text-[#4A515C]">{lista.length === guias.length ? `${guias.length} guías` : `${lista.length} de ${guias.length} guías`}{tema ? <> en <strong className="text-[#0E1116]">{tema}</strong></> : null}</p>
          {hayFiltro && <button type="button" onClick={() => { setBusca(""); elegir("") }} className="text-sm font-semibold text-[#0B6657] underline underline-offset-2 min-h-[44px] px-1">Ver todas</button>}
        </div>
        {lista.length ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {lista.map((g) => (
              <Link key={g.slug} href={`/guias/${g.slug}`} className="levanta card group h-full flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#0B7462]">
                <span className="flex items-center gap-1.5 min-w-0">
                  {g.categoria && <span className="truncate rounded-md bg-[#E3F3EE] text-[#0B5D50] px-2 py-0.5 text-xs font-bold">{g.categoria}</span>}
                  {g.exclusiva && <span className="shrink-0 rounded-md bg-[#0E1116] text-white px-2 py-0.5 text-xs font-semibold">Suscriptores</span>}
                </span>
                <span className="t2 text-lg font-extrabold tracking-tight">{g.titulo}</span>
                <span className="b3 text-[15px] text-[#4A515C]">{g.bajada}</span>
                <span className="mt-auto pt-2 text-sm font-bold text-[#0B6657] group-hover:underline">Leer la guía →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card mt-3 flex flex-col items-start gap-2">
            <p className="m-0 font-bold">No encontramos guías con “{busca}”.</p>
            <p className="m-0 text-[15px] text-[#4A515C]">Probá con otra palabra o pedinos la guía que te falta: la escribimos.</p>
            <button type="button" onClick={() => { setBusca(""); elegir("") }} className="btn-s">Ver todas las guías</button>
          </div>
        )}
      </section>
    </div>
  )
}
