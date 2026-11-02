"use client"
import { useEffect, useRef } from "react"
import { Gorro, Play, Certificado, ChipIA } from "./Flotantes"

type Est = [number, number] // [x en % del ancho, y en % del alto]
const OBJ: { k: string; Comp: typeof Gorro; w: number; est: Est[]; rot: number }[] = [
  { k: "r1", Comp: Gorro, w: 84, rot: -8, est: [[5, 62], [94, 30], [4, 38], [95, 66], [6, 24]] },
  { k: "r2", Comp: Play, w: 80, rot: 7, est: [[94, 14], [5, 46], [95, 72], [4, 22], [94, 52]] },
  { k: "r3", Comp: Certificado, w: 72, rot: -5, est: [[95, 44], [4, 72], [94, 20]] },
  { k: "r4", Comp: ChipIA, w: 70, rot: 6, est: [[4, 30], [95, 80], [5, 58], [94, 36]] },
]

/**
 * Capa fija (solo pantallas grandes): los objetos van bajando por los costados mientras se recorre la página
 * y aparecen en un lugar distinto cada vez, sin tapar el contenido.
 */
export default function RutaFlotante() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    const pintar = () => {
      raf = 0
      const alto = document.documentElement.scrollHeight - window.innerHeight
      const p = alto > 0 ? Math.max(0, Math.min(0.9999, window.scrollY / alto)) : 0
      OBJ.forEach((o, i) => {
        const el = refs.current[i]
        if (!el) return
        const n = o.est.length
        const seg = p * n
        const idx = Math.min(n - 1, Math.floor(seg))
        const t = seg - idx // 0..1 dentro de la estación
        const [x, y0] = o.est[idx]
        const y = y0 + t * 14 // baja un poco mientras se queda en la estación
        const op = quieto ? (t < .5 ? 1 : 0) : Math.min(1, t / 0.18, (1 - t) / 0.18)
        el.style.transform = `translate(${x}vw, ${y}vh) translate(-50%, -50%) rotate(${o.rot + t * 18}deg) scale(${0.85 + 0.15 * Math.min(1, t * 4)})`
        el.style.opacity = String(Math.max(0, op))
      })
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(pintar) }
    pintar()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf) }
  }, [])
  return (
    <div aria-hidden="true" className="hidden xl:block fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {OBJ.map((o, i) => (
        <div key={o.k} ref={(e) => { refs.current[i] = e }} className="absolute left-0 top-0 will-change-transform" style={{ width: o.w, opacity: 0, filter: "drop-shadow(0 16px 20px rgba(14,17,22,.28))", transition: "opacity .15s linear" }}>
          <o.Comp k={o.k} className="block w-full h-auto" />
        </div>
      ))}
    </div>
  )
}
