"use client"
import { useEffect, useState } from "react"

/** Botón flotante "volver arriba" y barra de progreso de lectura para las guías. */
export default function VolverArriba() {
  const [visible, setVisible] = useState(false)
  const [progreso, setProgreso] = useState(0)
  useEffect(() => {
    let raf = 0
    const f = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const h = document.documentElement
        const max = h.scrollHeight - h.clientHeight
        setVisible(h.scrollTop > h.clientHeight * 1.2)
        setProgreso(max > 0 ? Math.min(1, h.scrollTop / max) : 0)
      })
    }
    f()
    window.addEventListener("scroll", f, { passive: true })
    window.addEventListener("resize", f)
    return () => { window.removeEventListener("scroll", f); window.removeEventListener("resize", f); cancelAnimationFrame(raf) }
  }, [])
  const subir = () => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reducir ? "auto" : "smooth" })
    document.getElementById("contenido")?.focus({ preventScroll: true })
  }
  return (
    <>
      <div aria-hidden="true" className="fixed left-0 right-0 top-14 md:top-16 z-30 h-[3px] bg-transparent pointer-events-none">
        <div className="h-full bg-[#C8231F] origin-left" style={{ transform: `scaleX(${progreso})` }} />
      </div>
      <button
        type="button"
        onClick={subir}
        aria-label="Volver arriba"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`fixed z-30 right-4 w-12 h-12 rounded-full bg-[#0E1116] text-white shadow-lg flex items-center justify-center transition-opacity ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 1rem))", right: "max(1rem, env(safe-area-inset-right))" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
      </button>
    </>
  )
}
