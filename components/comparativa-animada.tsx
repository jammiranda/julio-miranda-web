"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Comparativa "piezas sueltas vs. integrado": cada fila aparece en secuencia.
 * Aparece lo de la izquierda, se tacha, y lo de la derecha se escribe como si se tipeara.
 */
export default function ComparativaAnimada({ a, b, filas }: { a: string; b: string; filas: [string, string][] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fila, setFila] = useState(-1)      // fila en curso
  const [fase, setFase] = useState(0)       // 0 izquierda visible, 1 tachada, 2 tipeando derecha
  const [chars, setChars] = useState(0)
  const [todo, setTodo] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { setTodo(true); return }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setFila(0); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (fila < 0 || todo) return
    if (fila >= filas.length) { setTodo(true); return }
    setFase(0); setChars(0)
    const t1 = setTimeout(() => setFase(1), 650)
    const t2 = setTimeout(() => setFase(2), 1250)
    const largo = filas[fila][1].length
    let id: any
    const t3 = setTimeout(() => {
      let c = 0
      id = setInterval(() => { c += 2; setChars(c); if (c >= largo) { clearInterval(id); setTimeout(() => setFila((f) => f + 1), 450) } }, 28)
    }, 1250)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); if (id) clearInterval(id) }
  }, [fila, filas, todo])

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-white/10">
      <div className="grid grid-cols-2 text-sm md:text-[15px] font-bold uppercase tracking-wider">
        <div className="bg-[#1B2029] text-[#C3C8D1] px-4 md:px-6 py-3.5">{a}</div>
        <div className="bg-[#C8231F] text-white px-4 md:px-6 py-3.5">{b}</div>
      </div>
      {filas.map(([x, y], i) => {
        const alcanzada = todo || i <= fila
        const tachada = todo || i < fila || (i === fila && fase >= 1)
        const tipeando = todo || i < fila || (i === fila && fase >= 2)
        const visibleDer = todo || i < fila ? y : i === fila && fase >= 2 ? y.slice(0, chars) : ""
        return (
          <div key={i} className="grid grid-cols-2 border-t border-white/10 min-h-[78px]">
            <div className="px-4 md:px-6 py-4 text-[14.5px] md:text-[16px] leading-snug bg-white/[0.02] flex gap-2 transition-all duration-500" style={{ opacity: alcanzada ? (tachada ? 0.45 : 1) : 0, transform: alcanzada ? "none" : "translateY(8px)", color: "#9AA1AD" }}>
              <span aria-hidden="true">✕</span>
              <span style={{ textDecoration: tachada ? "line-through" : "none", textDecorationColor: "#FF6A63", textDecorationThickness: "2px" }}>{x}</span>
            </div>
            <div className="px-4 md:px-6 py-4 text-[14.5px] md:text-[16px] leading-snug font-semibold text-white bg-[#C8231F]/10 flex gap-2">
              {tipeando && <span aria-hidden="true" className="text-[#FF8E88]">✓</span>}
              <span aria-label={y}>{visibleDer}{i === fila && !todo && fase >= 2 && chars < y.length ? <span className="inline-block w-[2px] h-[1em] bg-[#FF6A63] align-middle ml-0.5 animate-pulse" /> : null}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
