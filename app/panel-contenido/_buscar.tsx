"use client"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CUENTAS, GRUPOS } from "./_secciones"

type Item = { id: string; t: string; sub: string; href: string; grupo: string; claves: string }

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/** Buscador del panel: abre con Ctrl+K (⌘K en Mac) o con "/". Lleva a secciones, cuentas y filtros; y busca texto en las publicaciones. */
export default function Buscar({ base, oficina }: { base: string; oficina: boolean }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const [sel, setSel] = useState(0)
  const [mac, setMac] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const volver = useRef<HTMLElement | null>(null)

  useEffect(() => { setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)) }, [])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    for (const g of GRUPOS.filter((x) => oficina || !x.soloGerente)) {
      for (const s of g.items) out.push({ id: `s-${s.s || "inicio"}`, t: s.t, sub: g.g, href: `${base}/${s.s}`.replace(/\/$/, "") || "/", grupo: "Sección", claves: s.claves })
    }
    for (const [id, nombre] of CUENTAS) {
      out.push({ id: `a-${id}`, t: `Análisis · ${nombre}`, sub: "Qué funciona en esta cuenta", href: `${base}/analisis?cuenta=${id}#que-funciona`, grupo: "Cuenta", claves: `analisis cuenta ${id} rendimiento formato día horario` })
      out.push({ id: `p-${id}`, t: `Publicaciones · ${nombre}`, sub: "Historial de esta cuenta", href: `${base}/publicaciones?red=${id}`, grupo: "Cuenta", claves: `publicaciones posts historial ${id}` })
    }
    for (const d of [7, 30, 90]) out.push({ id: `d-${d}`, t: `Análisis · últimos ${d} días`, sub: "Comparado con el período anterior", href: `${base}/analisis?dias=${d}`, grupo: "Período", claves: `analisis periodo semana mes trimestre ${d} dias` })
    out.push({ id: "f-top", t: "Publicaciones con más interacciones", sub: "Ordenadas de mayor a menor", href: `${base}/publicaciones?orden=int`, grupo: "Filtro", claves: "mejores top publicaciones interacciones" })
    out.push({ id: "f-12m", t: "Publicaciones de los últimos 12 meses", sub: "Historial largo", href: `${base}/publicaciones?periodo=365`, grupo: "Filtro", claves: "publicaciones historial año 12 meses" })
    out.push({ id: "f-esp", t: "Consultas que esperan a una persona", sub: "CRM y ventas", href: `${base}/crm`, grupo: "Filtro", claves: "consultas esperan humano atender pendientes" })
    return out
  }, [base, oficina])

  const resultados = useMemo<Item[]>(() => {
    const t = texto.trim()
    const palabras = norm(t).split(/\s+/).filter(Boolean)
    let r = items
    if (palabras.length) {
      r = items
        .map((it) => {
          const campo = norm(`${it.t} ${it.sub} ${it.claves}`)
          if (!palabras.every((w) => campo.includes(w))) return null
          const tit = norm(it.t)
          return { it, p: (tit.startsWith(palabras[0]) ? 0 : tit.includes(palabras[0]) ? 1 : 2) }
        })
        .filter((x): x is { it: Item; p: number } => x != null)
        .sort((a, b) => a.p - b.p)
        .map((x) => x.it)
    } else {
      r = items.filter((it) => it.grupo === "Sección")
    }
    if (t.length >= 2) r = [...r.slice(0, 12), { id: "q", t: `Buscar «${t}» en las publicaciones`, sub: "Todo el historial, todas las redes", href: `${base}/publicaciones?q=${encodeURIComponent(t)}&periodo=todo`, grupo: "Buscar", claves: "" }]
    return r.slice(0, 13)
  }, [texto, items, base])

  const abrir = useCallback(() => { volver.current = document.activeElement as HTMLElement | null; setTexto(""); setSel(0); setAbierto(true) }, [])
  const cerrar = useCallback((devolverFoco = true) => { setAbierto(false); if (devolverFoco) volver.current?.focus?.() }, [])
  const ir = useCallback((it: Item) => { cerrar(false); router.push(it.href) }, [cerrar, router])

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (abierto) cerrar(); else abrir(); return }
      const el = e.target as HTMLElement | null
      const escribiendo = !!el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable)
      if (!abierto && e.key === "/" && !escribiendo && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); abrir() }
    }
    window.addEventListener("keydown", f)
    return () => window.removeEventListener("keydown", f)
  }, [abierto, abrir, cerrar])

  useEffect(() => {
    if (!abierto) return
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [abierto])

  useEffect(() => { setSel(0) }, [texto])
  useEffect(() => { if (abierto) document.getElementById(`pc-bus-${sel}`)?.scrollIntoView({ block: "nearest" }) }, [sel, abierto])

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); cerrar() }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); const it = resultados[sel]; if (it) ir(it) }
  }

  return (
    <>
      <button type="button" className="pc-find" onClick={abrir} aria-label="Buscar en el panel" aria-keyshortcuts="Control+K Meta+K">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span>Buscar…</span>
        <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      {abierto && (
        <div className="pc-bus" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar() }}>
          <div className="pc-bus-box" role="dialog" aria-modal="true" aria-label="Buscar en el panel" onKeyDown={teclas}>
            <input
              ref={inputRef} className="pc-bus-in" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ir a una sección, una cuenta o buscar en las publicaciones"
              role="combobox" aria-expanded="true" aria-controls="pc-bus-lista" aria-activedescendant={resultados[sel] ? `pc-bus-${sel}` : undefined} aria-autocomplete="list" autoComplete="off" spellCheck={false}
            />
            <ul id="pc-bus-lista" className="pc-bus-lista" role="listbox" aria-label="Resultados">
              {resultados.length ? resultados.map((it, i) => (
                <li key={it.id} id={`pc-bus-${i}`} role="option" aria-selected={i === sel} className={i === sel ? "on" : undefined} onMouseMove={() => setSel(i)} onClick={() => ir(it)}>
                  <span className="t">{it.t}<small>{it.sub}</small></span>
                  <span className="g">{it.grupo}</span>
                </li>
              )) : <li className="vacio" role="presentation">Sin resultados. Probá con otra palabra.</li>}
            </ul>
            <div className="pc-bus-pie"><span>↑↓ moverte</span><span>Enter abrir</span><span>Esc cerrar</span></div>
          </div>
        </div>
      )}
    </>
  )
}
