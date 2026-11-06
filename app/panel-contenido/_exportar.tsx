"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/** Exportar: elegir qué secciones de la página se llevan, con qué título y nota, y en qué formato (PDF, Excel o texto). Lee lo que ya está en pantalla, así lo exportado coincide con lo que se ve. */

type Grupo = { id: string; t: string; nodos: Element[] }
type Opc = { titulo: string; nota: string; ids: string[] | null; formato: "pdf" | "excel" | "texto"; horizontal: boolean; sinGraficos: boolean }
const CLAVE = "pc-exportar-v1"
const limpio = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim()

function grupos(): Grupo[] {
  const wrap = document.querySelector(".pc-wrap")
  if (!wrap) return []
  const out: Grupo[] = []
  let g: Grupo | null = null
  for (const n of Array.from(wrap.children)) {
    if (n.classList.contains("pc-sec")) { g = { id: n.id || `s${out.length}`, t: limpio(n.textContent), nodos: [n] }; out.push(g) }
    else if (g && !n.classList.contains("pc-print-hd")) g.nodos.push(n)
  }
  return out
}

type Bloque = { t: string; filas: string[][] }
function bloquesDe(g: Grupo): Bloque[] {
  const res: Bloque[] = []
  const SEL = ".pc-kt, .pc-al, table, .pc-flow, .pc-emb, .pc-list"
  const kpis: string[][] = [], avisos: string[][] = []
  for (const nodo of g.nodos) {
    const els = nodo.matches(SEL) ? [nodo] : Array.from(nodo.querySelectorAll(SEL))
    for (const el of els) {
      const tit = limpio(el.closest(".pc-card")?.querySelector(".pc-ch h2")?.textContent) || g.t
      if (el.matches(".pc-kt")) {
        const k = limpio(el.querySelector(".pc-k")?.textContent)
        const top = limpio(el.querySelector(".top")?.textContent).replace(k, "").trim()
        kpis.push([k, limpio(el.querySelector(".pc-big")?.textContent), top, limpio(el.querySelector(".pc-ft")?.textContent)])
      } else if (el.matches(".pc-al")) {
        const c = el.cloneNode(true) as Element
        c.querySelectorAll(".pc-sr, .ic, .go").forEach((x) => x.remove())
        avisos.push([limpio(c.querySelector("b")?.textContent), limpio(c.querySelector("small")?.textContent)])
      } else if (el.matches("table")) {
        const filas = Array.from(el.querySelectorAll("tr")).map((tr) => Array.from(tr.children).map((c) => limpio(c.textContent)))
        if (filas.length) res.push({ t: tit, filas })
      } else if (el.matches(".pc-flow")) {
        res.push({ t: tit, filas: Array.from(el.querySelectorAll(".pc-fr")).map((r) => [limpio(r.querySelector("span")?.textContent), limpio(r.querySelector("b")?.textContent)]) })
      } else if (el.matches(".pc-emb")) {
        res.push({ t: tit, filas: Array.from(el.querySelectorAll(".fila")).map((r) => [limpio(r.querySelector(".k")?.textContent), limpio(r.querySelector(".v b")?.textContent), limpio(r.querySelector(".v small")?.textContent)]) })
      } else if (el.matches(".pc-list")) {
        res.push({ t: tit, filas: Array.from(el.querySelectorAll(".pc-item")).map((r) => [limpio(r.querySelector(".t")?.textContent), limpio(r.querySelector(".m")?.textContent)]) })
      }
    }
  }
  const pre: Bloque[] = []
  if (kpis.length) pre.push({ t: `${g.t} · indicadores`, filas: [["Indicador", "Valor", "Variación", "Detalle"], ...kpis] })
  if (avisos.length) pre.push({ t: `${g.t} · hallazgos`, filas: [["Hallazgo", "Detalle"], ...avisos] })
  return [...pre, ...res.filter((b) => b.filas.length)]
}

const hoy = () => new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "long", year: "numeric" })
const stamp = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })

function descargar(nombre: string, mime: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: mime }))
  const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function Exportar() {
  const [abierto, setAbierto] = useState(false)
  const [gs, setGs] = useState<Grupo[]>([])
  const [o, setO] = useState<Opc>({ titulo: "Análisis DEVISEBIT", nota: "", ids: null, formato: "pdf", horizontal: false, sinGraficos: false })
  const [aviso, setAviso] = useState("")

  useEffect(() => {
    if (!abierto) return
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false) }
    window.addEventListener("keydown", f)
    return () => window.removeEventListener("keydown", f)
  }, [abierto])

  const abrir = () => {
    const lista = grupos(); setGs(lista); setAviso("")
    try { const g = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (g) setO((s) => ({ ...s, ...g })) } catch {}
    setAbierto(true)
  }
  const ids = o.ids ?? gs.map((g) => g.id)
  const marcadas = gs.filter((g) => ids.includes(g.id))
  const alternar = (id: string) => setO((s) => { const a = s.ids ?? gs.map((g) => g.id); return { ...s, ids: a.includes(id) ? a.filter((x) => x !== id) : gs.map((g) => g.id).filter((x) => x === id || a.includes(x)) } })

  const exportar = () => {
    if (!marcadas.length) { setAviso("Elegí al menos una sección."); return }
    try { localStorage.setItem(CLAVE, JSON.stringify({ titulo: o.titulo, nota: o.nota, ids: o.ids, formato: o.formato, horizontal: o.horizontal, sinGraficos: o.sinGraficos })) } catch {}
    const sub = limpio(document.querySelector(".pc-head .pc-sub")?.textContent)
    const nombre = `${(o.titulo || "analisis").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${stamp()}`
    if (o.formato === "pdf") {
      const raiz = document.querySelector(".pc") as HTMLElement, wrap = document.querySelector(".pc-wrap")!
      const hd = document.createElement("div"); hd.className = "pc-print-hd"
      const h = document.createElement("h1"); h.textContent = o.titulo || "Análisis"
      const p = document.createElement("p"); p.textContent = `DEVISEBIT · ${hoy()}${sub ? " · " + sub : ""}`
      hd.append(h, p)
      if (o.nota.trim()) { const n = document.createElement("div"); n.className = "nota"; n.textContent = o.nota.trim(); hd.append(n) }
      wrap.prepend(hd)
      const ocultos: Element[] = []
      for (const g of gs) if (!ids.includes(g.id)) { for (const n of g.nodos) { n.classList.add("pc-x-oculto"); ocultos.push(n) } }
      const est = document.createElement("style"); est.textContent = `@page { size: A4 ${o.horizontal ? "landscape" : "portrait"}; margin: 12mm; }`
      document.head.appendChild(est)
      raiz.classList.add("pc-exp"); if (o.sinGraficos) raiz.classList.add("pc-exp-sg")
      const limpiar = () => { hd.remove(); est.remove(); ocultos.forEach((n) => n.classList.remove("pc-x-oculto")); raiz.classList.remove("pc-exp", "pc-exp-sg"); window.removeEventListener("afterprint", limpiar) }
      window.addEventListener("afterprint", limpiar)
      setAbierto(false)
      setTimeout(() => window.print(), 150)
      return
    }
    const bl = marcadas.flatMap((g) => bloquesDe(g))
    if (o.formato === "excel") {
      const cel = (s: string) => `"${s.replace(/"/g, '""')}"`
      const filas: string[][] = [[o.titulo], [`DEVISEBIT · ${hoy()}${sub ? " · " + sub : ""}`]]
      if (o.nota.trim()) filas.push([o.nota.trim()])
      for (const b of bl) { filas.push([], [b.t], ...b.filas) }
      descargar(`${nombre}.csv`, "text/csv;charset=utf-8", "﻿" + filas.map((f) => f.map(cel).join(";")).join("\r\n"))
      setAbierto(false)
    } else {
      const txt = [o.titulo, `DEVISEBIT · ${hoy()}${sub ? " · " + sub : ""}`, o.nota.trim(), ...bl.flatMap((b) => ["", b.t.toUpperCase(), ...b.filas.map((f) => f.filter(Boolean).join(" · "))])].filter((x, i) => x !== "" || i > 2).join("\n")
      navigator.clipboard.writeText(txt).then(() => { setAviso("Copiado. Pegalo donde quieras."); }, () => { descargar(`${nombre}.txt`, "text/plain;charset=utf-8", txt); setAviso("Se descargó como archivo de texto.") })
    }
  }

  return (
    <>
      <button type="button" className="pc-btn" onClick={abrir}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
        Exportar
      </button>
      {abierto && createPortal(
        <div className="pc-bus" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setAbierto(false) }}>
          <div tabIndex={-1} className="pc-bus-box pc-pers" role="dialog" aria-modal="true" aria-label="Exportar análisis">
            <div className="pc-pers-hd"><h2>Exportar</h2><button type="button" className="pc-x" onClick={() => setAbierto(false)}>Cerrar</button></div>
            <div className="pc-pers-bd">
              <section>
                <h3>Título y nota</h3>
                <input className="pc-inp" value={o.titulo} onChange={(e) => setO({ ...o, titulo: e.target.value })} placeholder="Título del informe" aria-label="Título" />
                <textarea className="pc-inp" rows={2} value={o.nota} onChange={(e) => setO({ ...o, nota: e.target.value })} placeholder="Nota para quien lo lea (opcional)" aria-label="Nota" />
              </section>
              <section>
                <h3>Qué incluir <span className="pc-k" style={{ marginLeft: 8 }}>{marcadas.length} de {gs.length}</span></h3>
                <div className="pc-pers-op">
                  {gs.map((g) => <label key={g.id} className="pc-chk"><input type="checkbox" checked={ids.includes(g.id)} onChange={() => alternar(g.id)} />{g.t}</label>)}
                </div>
                <div className="pc-pers-add"><button type="button" className="pc-btn" onClick={() => setO({ ...o, ids: gs.map((g) => g.id) })}>Todas</button><button type="button" className="pc-btn" onClick={() => setO({ ...o, ids: [] })}>Ninguna</button></div>
              </section>
              <section>
                <h3>Formato</h3>
                <div className="pc-pers-op">
                  {([["pdf", "PDF (se abre la ventana de impresión: «Guardar como PDF»)"], ["excel", "Excel (archivo CSV con las tablas y cifras)"], ["texto", "Texto para copiar y pegar (mail, WhatsApp)"]] as const).map(([v, t]) => (
                    <label key={v} className="pc-chk"><input type="radio" name="fmt" checked={o.formato === v} onChange={() => setO({ ...o, formato: v })} />{t}</label>
                  ))}
                </div>
                {o.formato === "pdf" && (
                  <div className="pc-pers-op">
                    <label className="pc-chk"><input type="checkbox" checked={o.horizontal} onChange={() => setO({ ...o, horizontal: !o.horizontal })} />Hoja horizontal</label>
                    <label className="pc-chk"><input type="checkbox" checked={o.sinGraficos} onChange={() => setO({ ...o, sinGraficos: !o.sinGraficos })} />Sin gráficos (solo cifras y tablas)</label>
                  </div>
                )}
              </section>
            </div>
            <div className="pc-pers-ft">
              <span className="pc-k" role="status">{aviso}</span>
              <span style={{ flex: 1 }} />
              <button type="button" className="pc-btn" onClick={() => setAbierto(false)}>Cancelar</button>
              <button type="button" className="pc-btn pri" onClick={exportar}>{o.formato === "pdf" ? "Generar PDF" : o.formato === "excel" ? "Descargar Excel" : "Copiar texto"}</button>
            </div>
          </div>
        </div>,
        document.querySelector(".pc") ?? document.body,
      )}
    </>
  )
}
