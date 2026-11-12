"use client"
import { useEffect, useRef, useState } from "react"

/** Escalera de madurez digital: las barras suben al entrar en pantalla y un resaltado recorre los niveles. */
export default function EscaleraMadurez({ niveles }: { niveles: [string, string, string][] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visto, setVisto] = useState(false)
  const [activo, setActivo] = useState(-1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (quieto || !("IntersectionObserver" in window)) { setVisto(true); setActivo(niveles.length - 1); return }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setVisto(true); io.disconnect() } }, { threshold: 0.05, rootMargin: "0px 0px -8% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [niveles.length])

  useEffect(() => {
    if (!visto) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let i = -1
    const t0 = setTimeout(() => {
      const id = setInterval(() => { i = (i + 1) % (niveles.length + 1); setActivo(i === niveles.length ? -1 : i) }, 1100)
      ;(ref as any).current._id = id
    }, 1400)
    return () => { clearTimeout(t0); const id = (ref.current as any)?._id; if (id) clearInterval(id) }
  }, [visto, niveles.length])

  const colores = ["#E7B7B4", "#DB8C88", "#CF5F5A", "#C8231F"]
  return (
    <div ref={ref} className="flex items-end gap-1.5 sm:gap-3 h-[230px]" role="img" aria-label="Cuatro niveles de madurez digital, de inicial a optimizado">
      {niveles.map(([n, t, h], i) => {
        const on = activo === i
        return (
          <div key={n} className="flex-1 min-w-0 flex flex-col justify-end h-full">
            <div
              className="rounded-t-2xl px-2 py-3 sm:p-3 flex flex-col justify-between text-white relative"
              style={{
                height: visto ? h : "6%",
                background: colores[i] ?? "#C8231F",
                transition: `height .9s cubic-bezier(.2,.8,.2,1) ${i * 0.18}s, transform .35s, box-shadow .35s`,
                transform: on ? "translateY(-8px)" : "none",
                boxShadow: on ? "0 18px 30px -12px rgba(200,35,31,.6)" : "none",
              }}
            >
              <span className="font-tight text-2xl font-extrabold leading-none">{n}</span>
              <span className="text-[11px] sm:text-[13px] font-bold leading-tight">{t}</span>
              {on && <span aria-hidden="true" className="absolute -top-3 left-1/2 -translate-x-1/2 text-[20px]">▲</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
