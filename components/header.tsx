"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import DbMotion from "./db-motion"
import { equivalente } from "@/lib/rutas"

export type Lang = "es" | "en"

const EN = {
  main: [{ href: "/en", label: "Home" }, { href: "/en/services", label: "Services" }, { href: "/en/products", label: "Products" }],
  servicios: [
    { href: "/en/services", label: "All services" },
    { href: "/en/digital-transformation", label: "Digital transformation", desc: "Consulting, workshops and assessment" },
    { href: "/en/advisory", label: "Technology & AI advisory", desc: "By the hour or on a monthly retainer" },
  ],
  nosotros: [
    { href: "/en/about", label: "About us" },
    { href: "/en/success-stories", label: "Success stories" },
    { href: "/en/contact", label: "Contact" },
  ],
  labels: { services: "Services", about: "About", contact: "Contact", cta: "Get a proposal", consulting: "Consulting", aboutMenu: "About us", openMenu: "Open menu", closeMenu: "Close menu", nav: "Main", home: "DEVISEBIT, home", other: "Español", otherCode: "ES" },
}
const ES_LABELS = { services: "Servicios", about: "Nosotros", contact: "Contacto", cta: "Pedí tu propuesta", consulting: "Consultoría", aboutMenu: "Nosotros", openMenu: "Abrir menú", closeMenu: "Cerrar menú", nav: "Principal", home: "DEVISEBIT, inicio", other: "English", otherCode: "EN" }

const MAIN = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/productos", label: "Productos" },
  { href: "/novedades", label: "Novedades" },
]
const AUTODIAG = "/diagnostico"

const SERVICIOS = [
  { href: "/servicios", label: "Todos los servicios" },
  { href: "/transformacion-digital", label: "Transformación digital", desc: "Consultoría, talleres y diagnóstico" },
  { href: "/asesoria", label: "Asesoría en tecnología e IA", desc: "Por horas o con abono mensual" },
  { href: "/kit-digital", label: "Kits DEVISEBIT", desc: "Tecnología con alcance cerrado y ayuda de financiamiento" },
  { href: "/kit-4-0", label: "Kit 4.0 para pymes", desc: "Guía del programa de cofinanciamiento" },
  { href: AUTODIAG, label: "Autodiagnóstico gratis", desc: "3 niveles: madurez, procesos e IA", plain: true },
]

const NOSOTROS = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/nosotros#equipo", label: "Nuestro equipo" },
  { href: "/casos-de-exito", label: "Casos de éxito" },
  { href: "/alianzas-estrategicas", label: "Alianzas estratégicas" },
  { href: "/trabaja-con-nosotros", label: "Trabajá con nosotros" },
  { href: "https://academia.devisebit.com", label: "Academia DEVISEBIT", external: true },
]

export default function Header({ lang = "es" }: { lang?: Lang } = {}) {
  const pathname = usePathname() || "/"
  const en = lang === "en"
  const L = en ? EN.labels : ES_LABELS
  const homeHref = en ? "/en" : "/"
  const otraHref = equivalente(pathname) ?? (en ? "/" : "/en")
  const MAINL = en ? EN.main : MAIN
  const SERV = en ? EN.servicios : SERVICIOS
  const NOS = en ? EN.nosotros : NOSOTROS
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  const show = (id: string) => { if (timer.current) clearTimeout(timer.current); setDrop(id) }
  const hideSoon = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setDrop(null), 250) }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setDrop(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrop(null); setOpen(false) } }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [])

  useEffect(() => { setOpen(false); setDrop(null) }, [pathname])

  const isActive = (href: string) => en ? (href === "/en" ? pathname === "/en" : pathname.startsWith(href)) : (href === "/" ? pathname === "/" : href === "/servicios" ? ["/servicios", "/transformacion-digital", "/asesoria"].some((p) => pathname.startsWith(p)) : href === "/nosotros" ? ["/nosotros", "/casos-de-exito", "/alianzas-estrategicas", "/trabaja-con-nosotros"].some((p) => pathname.startsWith(p)) : pathname.startsWith(href))
  const linkCls = (href: string) =>
    "px-2.5 xl:px-3 py-3 rounded-lg text-[14px] xl:text-[15px] whitespace-nowrap transition-colors " +
    (isActive(href) ? "text-white font-semibold bg-white/10" : "text-[#D3D7DE] font-medium hover:text-white hover:bg-white/5")

  return (
    <>
    <DbMotion />
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0D12]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 h-[72px] flex items-center gap-4 xl:gap-6">
        <Link href={homeHref} className="flex items-center gap-2.5 text-white shrink-0" aria-label={L.home}>
          <Image src="/images/devisebit-icon-transparent.png" alt="" width={32} height={32} className="w-8 h-8" />
          <span className="font-tight font-extrabold text-[22px] tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
        </Link>

        <nav ref={navRef} aria-label={L.nav} className="hidden lg:flex items-center gap-1 ml-auto">
          <Link href={homeHref} className={linkCls(homeHref)}>{en ? "Home" : "Inicio"}</Link>
          <div className="relative" onMouseEnter={() => show("servicios")} onMouseLeave={hideSoon}>
            <button type="button" aria-haspopup="true" aria-expanded={drop === "servicios"} onClick={() => setDrop((v) => (v === "servicios" ? null : "servicios"))} className={"flex items-center gap-1 " + linkCls("/servicios")}>
              {L.services} <ChevronDown size={16} className={"transition-transform " + (drop === "servicios" ? "rotate-180" : "")} />
            </button>
            {drop === "servicios" && (
              <div className="absolute top-full left-0 pt-2" onMouseEnter={() => show("servicios")} onMouseLeave={hideSoon}>
                <div className="min-w-[300px] rounded-2xl border border-white/10 bg-[#11141B] shadow-2xl shadow-black/50 p-2" onClick={() => setDrop(null)}>
                  {SERV.map((l) => {
                    const inner = (<><span className="block text-[15px] text-white font-semibold">{l.label}</span>{l.desc && <span className="block text-[13px] text-[#9AA1AD] mt-0.5">{l.desc}</span>}</>)
                    return (l as any).plain
                      ? <a key={l.href} href={l.href} className="block rounded-lg px-4 py-3 hover:bg-white/5">{inner}</a>
                      : <Link key={l.href} href={l.href} className="block rounded-lg px-4 py-3 hover:bg-white/5">{inner}</Link>
                  })}
                </div>
              </div>
            )}
          </div>
          {MAINL.filter((l) => l.href !== "/" && l.href !== "/en" && l.href !== "/servicios" && l.href !== "/en/services" && !(en && l.href === "/en/products" && false)).map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
          ))}
          <div className="relative" onMouseEnter={() => show("nosotros")} onMouseLeave={hideSoon}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={drop === "nosotros"}
              onClick={() => setDrop((v) => (v === "nosotros" ? null : "nosotros"))}
              className={"flex items-center gap-1 " + linkCls("/nosotros")}
            >
              {L.about} <ChevronDown size={16} className={"transition-transform " + (drop === "nosotros" ? "rotate-180" : "")} />
            </button>
            {drop === "nosotros" && (
              <div className="absolute top-full right-0 pt-2" onMouseEnter={() => show("nosotros")} onMouseLeave={hideSoon}>
                <div className="min-w-[260px] rounded-2xl border border-white/10 bg-[#11141B] shadow-2xl shadow-black/50 p-2" onClick={() => setDrop(null)}>
                  {NOS.map((l) =>
                    (l as any).external ? (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-4 py-3 text-[15px] text-[#D3D7DE] hover:text-white hover:bg-white/5">{l.label}</a>
                    ) : (
                      <Link key={l.href} href={l.href} className="block rounded-lg px-4 py-3 text-[15px] text-[#D3D7DE] hover:text-white hover:bg-white/5">{l.label}</Link>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
          <Link href={en ? "/en/contact" : "/contacto"} className={linkCls(en ? "/en/contact" : "/contacto")}>{L.contact}</Link>
          <Link href={otraHref} hrefLang={en ? "es-AR" : "en"} lang={en ? "es" : "en"} className="px-2.5 py-2 rounded-lg border border-white/20 text-[13px] font-bold tracking-[0.08em] text-[#D3D7DE] hover:text-white hover:border-white/50" aria-label={L.other} title={L.other}>{L.otherCode}</Link>
          <Link href={en ? "/en/contact" : "/contacto"} className="ml-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 xl:px-5 py-3 text-[14px] xl:text-[15px] font-bold text-white whitespace-nowrap transition-colors">{L.cta}</Link>
        </nav>

        <button
          type="button"
          className="lg:hidden ml-auto w-12 h-12 rounded-xl border border-white/20 text-white flex items-center justify-center"
          aria-label={open ? L.closeMenu : L.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav aria-label={L.nav} className="lg:hidden border-t border-white/10 bg-[#0B0D12] max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="px-4 py-4 flex flex-col gap-1">
            {MAINL.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
            ))}
            <p className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{L.consulting}</p>
            {en ? (
              <>
                <Link href="/en/digital-transformation" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Digital transformation</Link>
                <Link href="/en/advisory" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Technology &amp; AI advisory</Link>
              </>
            ) : (
              <>
                <Link href="/transformacion-digital" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Transformación digital</Link>
                <Link href="/asesoria" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Asesoría en tecnología e IA</Link>
                <Link href="/kit-digital" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Kits DEVISEBIT</Link>
                <Link href="/kit-4-0" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Kit 4.0 para pymes</Link>
                <a href={AUTODIAG} className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">Autodiagnóstico gratis</a>
              </>
            )}
            <p className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{L.aboutMenu}</p>
            {NOS.map((l) =>
              (l as any).external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">{l.label}</a>
              ) : (
                <Link key={l.href} href={l.href} className="px-3 py-3 rounded-lg text-[15px] text-[#D3D7DE] hover:text-white">{l.label}</Link>
              ),
            )}
            <Link href={en ? "/en/contact" : "/contacto"} className={linkCls(en ? "/en/contact" : "/contacto")}>{L.contact}</Link>
            <Link href={otraHref} hrefLang={en ? "es-AR" : "en"} lang={en ? "es" : "en"} className="px-3 py-3 rounded-lg text-[15px] font-bold text-[#D3D7DE] hover:text-white">{L.other}</Link>
            <Link href={en ? "/en/contact" : "/contacto"} className="mt-3 rounded-xl bg-[#C8231F] px-5 py-4 text-center font-bold text-white">{L.cta}</Link>
          </div>
        </nav>
      )}
    </header>
    </>
  )
}

export { Header }
