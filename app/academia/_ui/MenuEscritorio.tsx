"use client"
import { useEffect, useId, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { MENU, esGrupo, activo, type ItemMenu } from "./menu"

const LINK = "px-2.5 xl:px-3 py-3 rounded-lg text-white/85 hover:text-white hover:bg-white/10 no-underline aria-[current=page]:text-white aria-[current=page]:bg-white/10"

/** Menú de escritorio: links y el grupo "Aprender" como desplegable accesible. */
export default function MenuEscritorio() {
  const ruta = usePathname()
  return (
    <>
      {MENU.map((e) =>
        esGrupo(e)
          ? <Desplegable key={e.label} label={e.label} hijos={e.hijos} ruta={ruta} />
          : <Link key={e.href} href={e.href} aria-current={activo(ruta, e.href) ? "page" : undefined} className={LINK}>{e.label}</Link>,
      )}
    </>
  )
}

/**
 * Botón con aria-expanded que abre un panel de links. Se cierra con Escape (devuelve el foco al botón), al hacer clic
 * o tocar afuera, al salir con Tab y al cambiar de página. Abre con clic o toque (no depende del hover).
 * El panel cuelga por debajo del header sticky (z-50, mayor que el header) para que no quede tapado.
 */
function Desplegable({ label, hijos, ruta }: { label: string; hijos: ItemMenu[]; ruta: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const id = useId()
  const dentro = hijos.some((h) => activo(ruta, h.href))

  useEffect(() => setAbierto(false), [ruta])
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false) }
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") { setAbierto(false); boton.current?.focus() } }
    document.addEventListener("pointerdown", fuera)
    document.addEventListener("keydown", tecla)
    return () => { document.removeEventListener("pointerdown", fuera); document.removeEventListener("keydown", tecla) }
  }, [abierto])

  const mover = (e: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return
    e.preventDefault()
    const links = Array.from(caja.current?.querySelectorAll<HTMLAnchorElement>("[data-item]") ?? [])
    if (!abierto) { setAbierto(true); requestAnimationFrame(() => caja.current?.querySelector<HTMLAnchorElement>("[data-item]")?.focus()); return }
    const k = links.indexOf(document.activeElement as HTMLAnchorElement)
    links[(k + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus()
  }

  return (
    <div ref={caja} className="relative" onKeyDown={mover} onBlur={(e) => { if (!caja.current?.contains(e.relatedTarget as Node)) setAbierto(false) }}>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
        className={`${LINK} inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer text-sm font-[inherit] ${dentro ? "text-white bg-white/10" : ""}`}
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div id={id} hidden={!abierto} className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white text-[#0E1116] shadow-[0_18px_50px_rgba(14,17,22,.25)] border border-[#E2E5EA] p-2 whitespace-normal">
        <ul className="m-0 p-0 list-none flex flex-col">
          {hijos.map((h) => (
            <li key={h.href}>
              <Link data-item href={h.href} onClick={() => setAbierto(false)} aria-current={activo(ruta, h.href) ? "page" : undefined} className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 min-h-[44px] no-underline text-[#0E1116] hover:bg-[#FDECEB] focus-visible:bg-[#FDECEB] aria-[current=page]:bg-[#F5F6F8]">
                <span className="font-bold">{h.label}</span>
                {h.detalle && <span className="text-[13px] text-[#4A515C]">{h.detalle}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
