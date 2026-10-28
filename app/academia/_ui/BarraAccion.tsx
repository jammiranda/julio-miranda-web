"use client"
import { useEffect, useState } from "react"

/**
 * CTA fijo inferior para celular y tablet vertical (se oculta desde `desde`, donde el formulario ya queda a la vista).
 * Se esconde cuando el destino (formulario de compra/inscripción) está a la vista.
 */
export default function BarraAccion({ destino, precio, etiqueta, detalle, desde = "lg", tambien }: { destino: string; precio: string; etiqueta: string; detalle?: string; desde?: "md" | "lg"; tambien?: string }) {
  const ocultarEn = desde === "md" ? "md:hidden" : "lg:hidden"
  const [oculta, setOculta] = useState(false)
  useEffect(() => {
    // Se oculta mientras se ve el formulario o el CTA de arriba (`tambien`), para no duplicar botones.
    const els = [destino, tambien].map((id) => (id ? document.getElementById(id) : null)).filter(Boolean) as HTMLElement[]
    if (!els.length || !("IntersectionObserver" in window)) return
    const vistos = new Map<Element, boolean>()
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => vistos.set(e.target, e.isIntersecting))
      setOculta(Array.from(vistos.values()).some(Boolean))
    }, { rootMargin: "-72px 0px -15% 0px" }) // arriba: alto del header fijo
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [destino, tambien])

  function ir(e: React.MouseEvent) {
    const el = document.getElementById(destino)
    if (!el) return
    e.preventDefault()
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" })
    const campo = el.querySelector<HTMLElement>("input:not([type=hidden]):not([type=radio]):not([tabindex='-1']), button")
    setTimeout(() => campo?.focus({ preventScroll: true }), reducir ? 0 : 450)
  }

  return (
    <>
      {/* Reserva lugar para que la barra no tape el final de la página */}
      <div aria-hidden="true" className={`${ocultarEn} h-20`} />
      <div
        className={`acad-barra ${ocultarEn} fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-[#E2E5EA] shadow-[0_-6px_20px_rgba(14,17,22,.08)] transition-transform duration-200 ${oculta ? "translate-y-full" : ""}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden={oculta}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-extrabold leading-none text-[#0E1116]">{precio}</span>
            {detalle && <span className="text-sm text-[#4A515C] truncate">{detalle}</span>}
          </div>
          <a href={`#${destino}`} onClick={ir} tabIndex={oculta ? -1 : 0} className="btn-p ml-auto min-h-[48px] px-5 text-base whitespace-nowrap">{etiqueta}</a>
        </div>
      </div>
    </>
  )
}
