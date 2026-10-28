"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import DbMotion from "./db-motion"

const MAIN = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/productos", label: "Productos" },
  { href: "/transformacion-digital", label: "Transformación digital" },
  { href: "/novedades", label: "Novedades" },
]
const AUTODIAG = "/demos/transformacion-digital.html"

const NOSOTROS = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/nosotros#equipo", label: "Nuestro equipo" },
  { href: "/casos-de-exito", label: "Casos de éxito" },
  { href: "/alianzas-estrategicas", label: "Alianzas estratégicas" },
  { href: "/trabaja-con-nosotros", label: "Trabajá con nosotros" },
  { href: "https://academia.devisebit.com", label: "Academia DEVISEBIT", external: true },
]

export default function Header() {
  const pathname = usePathname() || "/"
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  const show = () => { if (timer.current) clearTimeout(timer.current); setDrop(true) }
  const hideSoon = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setDrop(false), 250) }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDrop(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrop(false); setOpen(false) } }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [])

  useEffect(() => { setOpen(false); setDrop(false) }, [pathname])

  const isActive = (href: string) => (href === "/" ? pathname === "/" : href === "/nosotros" ? ["/nosotros", "/casos-de-exito", "/alianzas-estrategicas", "/trabaja-con-nosotros"].some((p) => pathname.startsWith(p)) : pathname.startsWith(href))
  const linkCls = (href: string) =>
    "px-2.5 xl:px-3 py-3 rounded-lg text-[14px] xl:text-[15px] whitespace-nowrap transition-colors " +
    (isActive(href) ? "text-white font-semibold bg-white/10" : "text-[#D3D7DE] font-medium hover:text-white hover:bg-white/5")

  return (
    <>
    <DbMotion />
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0D12]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 h-[72px] flex items-center gap-4 xl:gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-white shrink-0" aria-label="DEVISEBIT, inicio">
          <Image src="/images/devisebit-icon-transparent.png" alt="" width={32} height={32} className="w-8 h-8" />
          <span className="font-tight font-extrabold text-[22px] tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:flex items-center gap-1 ml-auto">
          {MAIN.filter((l) => l.href !== "/").map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
          ))}
          <div ref={dropRef} className="relative" onMouseEnter={show} onMouseLeave={hideSoon}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={drop}
              onClick={() => setDrop((v) => !v)}
              className={"flex items-center gap-1 " + linkCls("/nosotros")}
            >
              Nosotros <ChevronDown size={16} className={"transition-transform " + (drop ? "rotate-180" : "")} />
            </button>
            {drop && (
              <div className="absolute top-full right-0 pt-2" onMouseEnter={show} onMouseLeave={hideSoon}>
                <div className="min-w-[260px] rounded-2xl border border-white/10 bg-[#11141B] shadow-2xl shadow-black/50 p-2" onClick={() => setDrop(false)}>
                  {NOSOTROS.map((l) =>
                    l.external ? (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-4 py-3 text-[15px] text-[#D3D7DE] hover:text-white hover:bg-white/5">{l.label}</a>
                    ) : (
                      <Link key={l.href} href={l.href} className="block rounded-lg px-4 py-3 text-[15px] text-[#D3D7DE] hover:text-white hover:bg-white/5">{l.label}</Link>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
          <Link href="/contacto" className={linkCls("/contacto")}>Contacto</Link>
          <Link href="/contacto" className="ml-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 xl:px-5 py-3 text-[14px] xl:text-[15px] font-bold text-white whitespace-nowrap transition-colors">Pedí tu propuesta</Link>
        </nav>

        <button
          type="button"
          className="lg:hidden ml-auto w-12 h-12 rounded-xl border border-white/20 text-white flex items-center justify-center"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav aria-label="Principal" className="lg:hidden border-t border-white/10 bg-[#0B0D12] max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="px-4 py-4 flex flex-col gap-1">
            {MAIN.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
            ))}
            <a href={AUTODIAG} className="mt-1 px-3 py-3 rounded-lg text-[15px] font-semibold text-[#FF6A63] hover:text-white">Autodiagnóstico digital gratis →</a>
            <p className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Nosotros</p>
            {NOSOTROS.map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">{l.label}</a>
              ) : (
                <Link key={l.href} href={l.href} className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">{l.label}</Link>
              ),
            )}
            <Link href="/contacto" className={linkCls("/contacto")}>Contacto</Link>
            <Link href="/contacto" className="mt-3 rounded-xl bg-[#C8231F] px-5 py-4 text-center font-bold text-white">Pedí tu propuesta</Link>
          </div>
        </nav>
      )}
    </header>
    </>
  )
}

export { Header }
