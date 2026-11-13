"use client"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type Item = { id: string; t: string }

/**
 * Barra fija de la pantalla: índice de secciones (sale solo de los títulos), buscador que filtra al instante y botón para volver arriba.
 * Pensada para pantallas largas: se llega a cualquier parte con un clic, sin recorrer todo.
 * - `sel`: qué títulos forman el índice (dentro de <main>).
 * - `filtra`: qué elementos se ocultan cuando no coinciden con lo que se escribe.
 */
export default function Indice({ sel = "h2", filtra, placeholder = "Buscar en esta pantalla" }: { sel?: string; filtra?: string; placeholder?: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [activo, setActivo] = useState("")
  const [b, setB] = useState("")
  const [n, setN] = useState<number | null>(null)
  const [arriba, setArriba] = useState(false)
  const barra = useRef<HTMLElement>(null)

  const titulos = () => Array.from(document.querySelectorAll<HTMLElement>(`main ${sel}`)).filter((h) => !h.closest("[data-indice], aside, .lp-panel, details:not([open]), [hidden]"))

  useEffect(() => {
    const leer = () => {
      const hs = titulos()
      hs.forEach((h, i) => { if (!h.id) h.id = `sec-${i + 1}`; h.style.scrollMarginTop = "176px" })
      setItems(hs.map((h) => ({ id: h.id, t: (h.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 44) })).filter((x) => x.t))
    }
    leer()
    const t = setTimeout(leer, 900) // contenido que llega después (listas que cargan aparte)
    const mover = () => {
      setArriba(window.scrollY > 500)
      let act = ""
      for (const h of titulos()) { if (h.getBoundingClientRect().top < 200) act = h.id; else break }
      setActivo(act)
    }
    mover()
    window.addEventListener("scroll", mover, { passive: true })
    return () => { clearTimeout(t); window.removeEventListener("scroll", mover) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const filtrar = (v: string) => {
    setB(v)
    if (!filtra) return
    const t = v.trim().toLowerCase()
    let visibles = 0
    const els = Array.from(document.querySelectorAll<HTMLElement>(`main ${filtra}`)).filter((e) => !e.closest("[data-indice], aside, .lp-panel"))
    els.forEach((e) => { const ok = !t || (e.textContent ?? "").toLowerCase().includes(t); e.hidden = !ok; if (ok) visibles++ })
    // Las secciones que quedan sin nada visible también se ocultan
    titulos().concat(Array.from(document.querySelectorAll<HTMLElement>(`main ${sel}`))).forEach((h) => {
      const s = h.closest("section") as HTMLElement | null
      if (!s || els.includes(s)) return
      const suyos = els.filter((e) => s.contains(e))
      if (suyos.length) s.hidden = !!t && suyos.every((e) => e.hidden)
    })
    setN(t ? visibles : null)
  }

  const ir = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }) }

  if (items.length < 2 && !filtra) return null
  return (
    <>
      <nav ref={barra} data-indice aria-label="En esta pantalla" className="indice no-print">
        {filtra && (
          <div className="flex items-center gap-2 min-w-0">
            <label htmlFor="indice-buscar" className="sr-only">{placeholder}</label>
            <input id="indice-buscar" type="search" value={b} onChange={(e) => filtrar(e.target.value)} placeholder={placeholder} className="inp !py-1.5 !w-[min(100%,260px)]" />
            <span className="text-xs text-[var(--gris)] whitespace-nowrap" role="status">{n == null ? "" : n === 1 ? "1 resultado" : `${n} resultados`}</span>
          </div>
        )}
        {items.length >= 2 && (items.length > 9 ? (
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--gris)]">Ir a
            <select className="inp !py-1.5 !w-auto max-w-[min(70vw,420px)]" value={activo} onChange={(e) => ir(e.target.value)} aria-label="Ir a una sección">
              <option value="" disabled>Elegí una sección ({items.length})</option>
              {items.map((x) => <option key={x.id} value={x.id}>{x.t}</option>)}
            </select>
          </label>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-wrap items-center gap-1.5">
            {items.map((x) => (
              <li key={x.id}><button type="button" onClick={() => ir(x.id)} aria-current={activo === x.id ? "true" : undefined} className={`chip text-xs px-3 py-1.5 border cursor-pointer ${activo === x.id ? "bg-[var(--tinta)] text-white border-[var(--tinta)]" : "bg-[var(--sup)] border-[var(--borde-fuerte)] hover:border-[var(--ac)]"}`}>{x.t}</button></li>
            ))}
          </ul>
        ))}
      </nav>
      {arriba && createPortal(<button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="indice-arriba no-print" aria-label="Volver arriba">↑ Arriba</button>, document.body)}
    </>
  )
}
