"use client"
import { useEffect, useId, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { salirCuenta } from "@/lib/ingreso"

type Yo = { cuenta: { nombre: string; email: string } | null; sistema: boolean }

const PORTAL = "https://portal.devisebit.com"

/** Quién mira la Academia (alumno y/o equipo). Se pide desde el navegador para que las páginas públicas sigan siendo cacheables. */
function useYo() {
  const [yo, setYo] = useState<Yo | null>(null)
  const ruta = usePathname()
  useEffect(() => {
    let vivo = true
    fetch("/api/academia/yo", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => vivo && setYo(j))
      .catch(() => {})
    return () => { vivo = false }
  }, [ruta])
  return yo
}

/** Primer nombre (nunca el email completo) e iniciales para el avatar. */
const primerNombre = (c: Yo["cuenta"]) => (c ? (c.nombre.trim().split(/\s+/)[0] || c.email.split("@")[0]).slice(0, 18) : "")
const iniciales = (c: Yo["cuenta"]) => {
  if (!c) return ""
  const p = c.nombre.trim().split(/\s+/).filter((x) => /^\p{L}/u.test(x))
  return ((p[0]?.[0] ?? c.email[0] ?? "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase()
}

const Avatar = ({ c, grande = false }: { c: Yo["cuenta"]; grande?: boolean }) => (
  <span aria-hidden="true" className={`${grande ? "w-10 h-10 text-sm" : "w-8 h-8 text-[13px]"} shrink-0 rounded-full bg-[#C8231F] text-white font-extrabold tracking-wide flex items-center justify-center ring-2 ring-white/20`}>{iniciales(c)}</span>
)

/** Opciones de la cuenta (desplegable de escritorio y grupo del menú móvil). */
function opciones(yo: Yo) {
  return [
    ...(yo.cuenta ? [
      { href: "/mi-cuenta", t: "Mi cuenta", d: "Inicio del alumno" },
      { href: "/mi-cuenta#mis-cursos", t: "Mis cursos", d: "Tu avance y el aula" },
      { href: "/mi-cuenta#certificados", t: "Certificados", d: "Verlos y descargarlos" },
    ] : []),
    ...(yo.sistema ? [{ href: "/sistema", t: "Sistema Academia", d: "Gestión interna (equipo)", equipo: true }] : []),
    ...(yo.cuenta ? [{ href: PORTAL, t: "DEVISEBIT Mi cuenta ↗", d: "Proyectos, pagos y facturas", secundario: true }] : []),
  ] as { href: string; t: string; d: string; equipo?: boolean; secundario?: boolean }[]
}

/**
 * Cuenta en el header de la Academia.
 * - Sin sesión: botón "Mi cuenta" (lleva a /mi-cuenta, donde se entra con el email).
 * - Con sesión: botón compacto con avatar de iniciales y primer nombre que abre un menú accesible
 *   (Mi cuenta, Mis cursos, Certificados, Sistema Academia si es del equipo, DEVISEBIT Mi cuenta y Salir).
 * - `movil`: en el header del celular solo el avatar (o "Mi cuenta"); las opciones están dentro del menú móvil (`menu`).
 */
export default function CuentaHeader({ movil = false, menu = false }: { movil?: boolean; menu?: boolean }) {
  const yo = useYo()
  if (menu) return yo && (yo.cuenta || yo.sistema) ? <OpcionesMenuMovil yo={yo} /> : null

  if (movil) {
    if (yo?.cuenta) return (
      <Link href="/mi-cuenta" aria-label={`Mi cuenta de ${primerNombre(yo.cuenta)}`} title={`Sesión de ${primerNombre(yo.cuenta)}`} className="inline-flex items-center justify-center w-11 h-11 rounded-full no-underline hover:bg-white/10">
        <Avatar c={yo.cuenta} />
      </Link>
    )
    return <Link href="/mi-cuenta" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] no-underline min-h-[40px] px-3">Mi cuenta</Link>
  }

  if (!yo?.cuenta) return (
    <div className="flex items-center gap-1">
      {yo?.sistema && <a href="/sistema" className="px-2.5 py-3 rounded-lg text-[#FF6A63] hover:text-white hover:bg-white/10 no-underline font-semibold">Sistema Academia</a>}
      <Link href="/mi-cuenta" title="Tus cursos, clases y certificados" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] no-underline ml-1 min-h-[44px]">Mi cuenta</Link>
    </div>
  )
  return <MenuCuenta yo={yo} />
}

function MenuCuenta({ yo }: { yo: Yo }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const id = useId()
  const ruta = usePathname()
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
    const items = Array.from(caja.current?.querySelectorAll<HTMLElement>("[data-item]") ?? [])
    if (!abierto) { setAbierto(true); requestAnimationFrame(() => caja.current?.querySelector<HTMLElement>("[data-item]")?.focus()); return }
    const k = items.indexOf(document.activeElement as HTMLElement)
    items[(k + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
  }
  const op = opciones(yo)
  const item = "flex flex-col gap-0.5 w-full text-left rounded-xl px-3 py-2.5 min-h-[44px] no-underline text-[#0E1116] hover:bg-[#FDECEB] focus-visible:bg-[#FDECEB] bg-transparent border-0 cursor-pointer font-[inherit]"
  return (
    <div ref={caja} className="relative ml-1" onKeyDown={mover} onBlur={(e) => { if (!caja.current?.contains(e.relatedTarget as Node)) setAbierto(false) }}>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={`Mi cuenta: ${primerNombre(yo.cuenta)}`}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-2 min-h-[44px] pl-1 pr-2.5 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 cursor-pointer font-[inherit] text-sm"
      >
        <Avatar c={yo.cuenta} />
        <span className="max-w-[9rem] truncate font-semibold">{primerNombre(yo.cuenta)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div id={id} hidden={!abierto} className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white text-[#0E1116] shadow-[0_18px_50px_rgba(14,17,22,.25)] border border-[#E2E5EA] p-2 whitespace-normal">
        <div className="flex items-center gap-3 px-3 pt-2 pb-3 border-b border-[#EEF0F3] mb-1">
          <Avatar c={yo.cuenta} grande />
          <span className="min-w-0"><strong className="block truncate">{yo.cuenta!.nombre}</strong><span className="block text-xs text-[#4A515C] truncate">Alumno de ACADEMIA DEVISEBIT</span></span>
        </div>
        <ul className="m-0 p-0 list-none flex flex-col">
          {op.map((o) => (
            <li key={o.href} className={o.secundario ? "border-t border-[#EEF0F3] mt-1 pt-1" : ""}>
              {o.href.startsWith("http") || o.equipo
                ? <a data-item href={o.href} className={item}><span className={`font-bold ${o.equipo ? "text-[#C8231F]" : o.secundario ? "text-[#262C37] font-semibold" : ""}`}>{o.t}</span><span className="text-[13px] text-[#4A515C]">{o.d}</span></a>
                : <Link data-item href={o.href} onClick={() => setAbierto(false)} className={item}><span className="font-bold">{o.t}</span><span className="text-[13px] text-[#4A515C]">{o.d}</span></Link>}
            </li>
          ))}
          <li className="border-t border-[#EEF0F3] mt-1 pt-1">
            <form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button data-item className={`${item} !flex-row items-center`}><span className="font-semibold text-[#4A515C]">Salir</span></button></form>
          </li>
        </ul>
      </div>
    </div>
  )
}

/** Dentro del menú hamburguesa: quién es y las mismas opciones que el desplegable de escritorio. */
function OpcionesMenuMovil({ yo }: { yo: Yo }) {
  return (
    <section aria-label="Tu cuenta" className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
      {yo.cuenta && (
        <div className="flex items-center gap-3 pb-3 mb-1 border-b border-white/10">
          <Avatar c={yo.cuenta} grande />
          <span className="min-w-0"><strong className="block text-white truncate">{yo.cuenta.nombre}</strong><span className="block text-xs text-white/60">Alumno de ACADEMIA DEVISEBIT</span></span>
        </div>
      )}
      {opciones(yo).map((o) => (
        <a key={o.href} href={o.href} className={`flex items-center justify-between min-h-[48px] no-underline font-semibold ${o.equipo ? "text-[#FF6A63]" : o.secundario ? "text-white/70 text-[15px]" : "text-white"}`}>
          {o.t}<span aria-hidden="true" className="text-white/40">›</span>
        </a>
      ))}
      {yo.cuenta && <form action={salirCuenta} className="mt-2"><input type="hidden" name="sitio" value="academia" /><button className="w-full min-h-[48px] rounded-xl border border-white/25 bg-transparent text-white font-semibold cursor-pointer">Salir de mi cuenta</button></form>}
    </section>
  )
}
