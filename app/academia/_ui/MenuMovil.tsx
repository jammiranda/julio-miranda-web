"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import CuentaHeader from "./CuentaHeader"

type Item = { href: string; label: string }

/** Menú hamburguesa de la Academia (solo celular/tablet vertical). Accesible: aria-expanded, Escape, foco y bloqueo de scroll. */
export default function MenuMovil({ items, cuenta = false }: { items: Item[]; cuenta?: boolean }) {
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const ruta = usePathname()

  useEffect(() => setAbierto(false), [ruta])
  useEffect(() => {
    if (!abierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panel.current?.querySelector<HTMLElement>("a")?.focus()
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setAbierto(false); boton.current?.focus() }
    }
    window.addEventListener("keydown", k)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", k) }
  }, [abierto])

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls="acad-menu"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setAbierto((v) => !v)}
        className="lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-white hover:bg-white/10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id="acad-menu"
        ref={panel}
        hidden={!abierto}
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-[#0E1116] border-t border-white/10 overflow-y-auto overscroll-contain"
        style={{ top: "calc(3.5rem + env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <nav aria-label="Menú de la Academia" className="px-4 pt-2 flex flex-col">
          {items.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setAbierto(false)} aria-current={ruta === i.href || ruta === "/academia" + i.href ? "page" : undefined} className="flex items-center justify-between min-h-[56px] text-lg font-semibold text-white border-b border-white/10 no-underline">
              {i.label}<span aria-hidden="true" className="text-white/40">›</span>
            </Link>
          ))}
          <a href="https://www.devisebit.com/demos/transformacion-digital.html" className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 no-underline text-white">
            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Gratis · 5 minutos</span>
            <span className="block mt-1 text-base font-semibold">Autodiagnóstico de transformación digital →</span>
          </a>
          <a href="/#suscribirme" onClick={() => setAbierto(false)} className="mt-4 min-h-[48px] inline-flex items-center justify-center rounded-xl border border-white/25 text-white font-semibold no-underline">Suscribirme a las guías</a>
          {cuenta && <CuentaHeader menu />}
        </nav>
      </div>
    </>
  )
}
