"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Frase enorme que se va "encendiendo" palabra por palabra mientras se baja la página.
 * Las palabras entre [corchetes] se pintan con el color de acento. Sin movimiento si se prefiere reducir animaciones.
 */
export default function Frase({ texto, kicker, acento = "#C8231F", base = "#0E1116", apagado = "#CDD1D8", fondo = "#FFFFFF" }: { texto: string; kicker?: string; acento?: string; base?: string; apagado?: string; fondo?: string }) {
  const palabras = texto.split(/\s+/).map((p) => ({ t: p.replace(/[\[\]]/g, ""), a: p.includes("[") || p.includes("]") }))
  const ref = useRef<HTMLElement | null>(null)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setProg(1); return }
    let raf = 0
    const calc = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const alto = window.innerHeight
      // empieza cuando el bloque entra por abajo y termina cuando su centro llega al 40% de la pantalla
      const p = (alto * 0.85 - r.top) / (r.height + alto * 0.25)
      setProg(Math.max(0, Math.min(1, p)))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const n = palabras.length
  return (
    <section ref={ref} style={{ background: fondo }} className="py-20 md:py-32">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8">
        {kicker && <p className="m-0 mb-5 text-sm font-bold uppercase tracking-[0.16em]" style={{ color: acento }}>{kicker}</p>}
        <p className="m-0 text-[32px] sm:text-[44px] md:text-[60px] leading-[1.12] font-extrabold tracking-[-0.02em]">
          {palabras.map((w, i) => {
            const on = prog * 1.15 >= (i + 1) / n
            return <span key={i} style={{ color: on ? (w.a ? acento : base) : apagado, transition: "color .35s ease" }}>{w.t}{" "}</span>
          })}
        </p>
      </div>
    </section>
  )
}
