"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { MarcaIcono } from "@/components/Marca"

/**
 * Dos sistemas separados, cada uno en su dominio y con identidad propia:
 * - Comercial: sistema.devisebit.com (negro + rojo DEVISEBIT)
 * - Academia: academia.devisebit.com/sistema (crema + verde azulado, títulos en serif)
 * Cada sistema arma su menú por secciones; agregar o mover ítems es tocar MENU.
 */
export type Espacio = "comercial" | "academia"
const URL_ESPACIO: Record<Espacio, string> = { comercial: "https://sistema.devisebit.com", academia: "https://academia.devisebit.com/sistema" }
const NOMBRE: Record<Espacio, string> = { comercial: "Sistema comercial", academia: "Sistema Academia" }
const INICIO: Record<Espacio, string> = { comercial: "/", academia: "/sistema" }

type Props = { espacio: Espacio; espacios: Espacio[]; rol: string }

/* ---------- Íconos (trazos estilo lucide, inline para no sumar dependencias) ---------- */
const P: Record<string, JSX.Element> = {
  tablero: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  personas: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  maletin: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  demo: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m10 7 5 3-5 3z" /></>,
  paquete: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  etiqueta: <><path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></>,
  llave: <><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  bot: <><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2M20 14h2M15 13v2M9 13v2" /></>,
  whatsapp: <><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M9.5 9.5c0 2.5 2.5 5 5 5l1-1.5-1.8-.9-.7.7c-.9-.4-1.9-1.4-2.3-2.3l.7-.7-.9-1.8z" /></>,
  calendario: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  usuarios: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4" /><circle cx="18" cy="18" r="3" /><path d="M18 13.5V15M18 21v1.5M22.5 18H21M15 18h-1.5" /></>,
  escudo: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  ayuda: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  casa: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  birrete: <><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
  libro: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  guia: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8M16 17H8M10 9H8" /></>,
  bolsa: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M18 6 6 18M6 6l12 12" />,
  contraer: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></>,
  expandir: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" /></>,
  salir: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
}
export function Icono({ n, tam = 20, className = "" }: { n: keyof typeof P | string; tam?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">{P[n]}</svg>
  )
}

/* ---------- Menú por secciones. Permisos idénticos a los de antes ---------- */
type Item = { href: string; t: string; i: string }
type Seccion = { t: string | null; items: Item[] }

function seccionesDe(espacio: Espacio, rol: string): Seccion[] {
  const edita = rol === "gerente" || rol === "coordinacion"
  const gerente = rol === "gerente"
  const s: Seccion[] = espacio === "academia"
    ? [
        { t: "Academia", items: [
          { href: "/sistema", t: "Inicio", i: "casa" },
          { href: "/sistema/alumnos", t: "Alumnos y suscriptos", i: "birrete" },
          ...(edita ? [{ href: "/sistema/cursos", t: "Cursos", i: "libro" }, { href: "/sistema#guias", t: "Guías", i: "guia" }, { href: "/sistema#productos", t: "Productos y ventas", i: "bolsa" }] : []),
        ] },
        { t: "Comunicación", items: edita ? [{ href: "/email", t: "Envíos de email", i: "mail" }, { href: "/sistema/recursos", t: "Recursos con palabra clave", i: "etiqueta" }] : [] },
        { t: "Administración", items: gerente ? [{ href: "/usuarios", t: "Usuarios", i: "usuarios" }] : [] },
        { t: null, items: [{ href: "/ayuda", t: "Ayuda", i: "ayuda" }] },
      ]
    : [
        { t: "Ventas", items: [
          { href: "/", t: "Resumen", i: "tablero" },
          { href: "/consultas", t: "Conversaciones", i: "chat" },
          { href: "/contactos", t: "Contactos", i: "personas" },
          { href: "/proyectos", t: "Proyectos", i: "maletin" },
          ...(edita ? [{ href: "/demos-admin", t: "Demos", i: "demo" }, { href: "/material", t: "Material de venta", i: "guia" }] : []),
        ] },
        { t: "Oferta", items: [
          { href: "/servicios", t: "Servicios", i: "paquete" },
          ...(edita ? [{ href: "/precios", t: "Precios", i: "etiqueta" }, { href: "/portal-admin", t: "Portal y accesos", i: "llave" }] : []),
        ] },
        { t: "Comunicación", items: edita ? [
          { href: "/email", t: "Envíos de email", i: "mail" },
          { href: "/bot", t: "Bot · Conocimiento", i: "bot" },
          { href: "/whatsapp-business", t: "WhatsApp Business", i: "whatsapp" },
          { href: "/agenda", t: "Agenda y avisos", i: "calendario" },
        ] : [] },
        { t: "Administración", items: gerente ? [{ href: "/usuarios", t: "Usuarios", i: "usuarios" }, { href: "/auditoria", t: "Auditoría", i: "escudo" }] : [] },
        { t: null, items: [{ href: "/ayuda", t: "Ayuda", i: "ayuda" }] },
      ]
  return s.filter((x) => x.items.length)
}

const activo = (ruta: string, href: string, inicio: string) =>
  href.includes("#") ? false : href === inicio ? ruta === inicio : ruta === href || ruta.startsWith(href + "/")

function actual(espacio: Espacio, rol: string, ruta: string) {
  for (const s of seccionesDe(espacio, rol)) for (const i of s.items) if (activo(ruta, i.href, INICIO[espacio])) return { seccion: s.t, item: i }
  return null
}

/* ---------- Marca del sistema ---------- */
function MarcaSistema({ espacio, compacta = false }: { espacio: Espacio; compacta?: boolean }) {
  const aca = espacio === "academia"
  return (
    <Link href={INICIO[espacio]} className="sb-marca flex items-center gap-2.5 rounded-xl min-w-0" aria-label={aca ? "ACADEMIA DEVISEBIT · Sistema, ir al inicio" : "DEVISEBIT · Sistema comercial, ir al inicio"}>
      <MarcaIcono academia={aca} tam={36} fondo={aca ? "#0F766E" : "#1B2029"} />
      {!compacta && (
        <span className="leading-tight min-w-0">
          {aca ? (
            <span className="block font-titulo text-[17px] font-semibold tracking-[0.01em] text-[var(--sb-tinta)] whitespace-nowrap">ACADEMIA <span className="font-sans text-[13px] font-extrabold tracking-[0.06em] text-[var(--ac)]">DEVISEBIT</span></span>
          ) : (
            <span className="block text-[16px] font-extrabold tracking-[0.05em] text-[var(--sb-tinta)]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
          )}
          <span className="block text-[10px] font-semibold tracking-[0.24em] text-[var(--sb-dim)]">{aca ? "SISTEMA" : "SISTEMA COMERCIAL"}</span>
        </span>
      )}
    </Link>
  )
}

/* ---------- Lista de navegación (sidebar y drawer comparten la misma) ---------- */
function Navegacion({ espacio, rol, compacta = false, alElegir }: { espacio: Espacio; rol: string; compacta?: boolean; alElegir?: () => void }) {
  const ruta = usePathname() ?? "/"
  return (
    <nav aria-label={NOMBRE[espacio]} className="flex flex-col gap-3">
      {seccionesDe(espacio, rol).map((s, k) => (
        <div key={k} className="flex flex-col gap-0.5">
          {s.t && !compacta && <div className="sb-seccion px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.12em]">{s.t}</div>}
          {compacta && k > 0 && <div className="mx-3 mb-1 border-t border-[var(--sb-borde)]" aria-hidden="true" />}
          <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
            {s.items.map((i) => {
              const on = activo(ruta, i.href, INICIO[espacio])
              return (
                <li key={i.href}>
                  <Link href={i.href} onClick={alElegir} aria-current={on ? "page" : undefined} title={compacta ? i.t : undefined} aria-label={compacta ? i.t : undefined}
                    className={`sb-item ${compacta ? "justify-center px-0" : "px-3"}`}>
                    <Icono n={i.i} />
                    {!compacta && <span className="truncate">{i.t}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function CambioSistema({ espacio, espacios, compacta = false }: { espacio: Espacio; espacios: Espacio[]; compacta?: boolean }) {
  const otro: Espacio = espacio === "academia" ? "comercial" : "academia"
  if (!espacios.includes(otro)) return null
  return (
    <a href={URL_ESPACIO[otro]} className={`sb-cambio ${compacta ? "justify-center px-0" : "px-3"}`} title={compacta ? `Ir al ${NOMBRE[otro]}` : undefined} aria-label={compacta ? `Ir al ${NOMBRE[otro]}` : undefined}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: otro === "academia" ? "#14B8A6" : "#E5484D" }} aria-hidden="true" />
      {!compacta && <span className="truncate">Ir al {NOMBRE[otro]}</span>}
      {!compacta && <Icono n="salir" tam={14} className="ml-auto opacity-70" />}
    </a>
  )
}

/* ---------- Shell: sidebar fija (escritorio), barra superior y drawer (celular/tablet) ---------- */
export function EspacioShell({ espacio, espacios, rol, colapsado: colapsadoInicial = false, acciones, pie, children }: Props & { colapsado?: boolean; acciones: React.ReactNode; pie: React.ReactNode; children: React.ReactNode }) {
  const ruta = usePathname() ?? "/"
  const [colapsado, setColapsado] = useState(colapsadoInicial)
  const [abierto, setAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const aqui = actual(espacio, rol, ruta)

  const alternar = () => {
    const v = !colapsado
    setColapsado(v)
    try { document.cookie = `sb_colapsado=${v ? 1 : 0}; path=/; max-age=31536000; samesite=lax` } catch {}
  }
  const cerrar = useCallback(() => { setAbierto(false); boton.current?.focus() }, [])

  // Al cambiar de página se cierran el drawer y los menús desplegables (avisos, perfil)
  useEffect(() => {
    setAbierto(false)
    document.querySelectorAll("details.menu-pop[open]").forEach((d) => d.removeAttribute("open"))
  }, [ruta])

  // Menús desplegables de la barra superior: se cierran con clic afuera o Esc
  useEffect(() => {
    const fuera = (e: MouseEvent) => document.querySelectorAll("details.menu-pop[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.removeAttribute("open") })
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      document.querySelectorAll<HTMLDetailsElement>("details.menu-pop[open]").forEach((d) => { d.removeAttribute("open"); d.querySelector<HTMLElement>("summary")?.focus() })
    }
    document.addEventListener("click", fuera)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("click", fuera); document.removeEventListener("keydown", esc) }
  }, [])

  // Drawer: foco inicial, Esc para cerrar, foco atrapado y sin scroll de fondo
  useEffect(() => {
    if (!abierto) return
    const el = panel.current
    const foco = () => Array.from(el?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? [])
    foco()[0]?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); cerrar() }
      if (e.key === "Tab") {
        const f = foco(); if (!f.length) return
        const [a, z] = [f[0], f[f.length - 1]]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener("keydown", tecla)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = prev }
  }, [abierto, cerrar])

  return (
    <div data-espacio={espacio} className="app-fondo min-h-screen" style={{ ["--sbw" as string]: colapsado ? "76px" : "256px" }}>
      <a href="#contenido" className="saltar">Saltar al contenido</a>

      {/* Sidebar escritorio */}
      <aside className="sb no-print hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col transition-[width] duration-200" style={{ width: "var(--sbw)" }}>
        <div className={`h-16 flex items-center shrink-0 ${colapsado ? "justify-center px-2" : "px-4"}`}><MarcaSistema espacio={espacio} compacta={colapsado} /></div>
        <div className={`flex-1 overflow-y-auto py-3 ${colapsado ? "px-2" : "px-3"}`}><Navegacion espacio={espacio} rol={rol} compacta={colapsado} /></div>
        <div className={`shrink-0 border-t border-[var(--sb-borde)] py-3 flex flex-col gap-1 ${colapsado ? "px-2" : "px-3"}`}>
          <CambioSistema espacio={espacio} espacios={espacios} compacta={colapsado} />
          <button type="button" onClick={alternar} aria-expanded={!colapsado} aria-label={colapsado ? "Expandir menú" : "Contraer menú"} title={colapsado ? "Expandir menú" : "Contraer menú"} className={`sb-item ${colapsado ? "justify-center px-0" : "px-3"}`}>
            <Icono n={colapsado ? "expandir" : "contraer"} />{!colapsado && <span>Contraer menú</span>}
          </button>
        </div>
      </aside>

      {/* Drawer celular/tablet */}
      {abierto && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/45 drawer-velo" onClick={cerrar} aria-hidden="true" />
          <div ref={panel} id="menu-movil" role="dialog" aria-modal="true" aria-label={`Menú del ${NOMBRE[espacio]}`} className="sb drawer-panel absolute inset-y-0 left-0 w-[min(84vw,320px)] flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between gap-2 px-4 shrink-0">
              <MarcaSistema espacio={espacio} />
              <button type="button" onClick={cerrar} className="sb-icono" aria-label="Cerrar menú"><Icono n="cerrar" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3"><Navegacion espacio={espacio} rol={rol} alElegir={() => setAbierto(false)} /></div>
            <div className="shrink-0 border-t border-[var(--sb-borde)] px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"><CambioSistema espacio={espacio} espacios={espacios} /></div>
          </div>
        </div>
      )}

      <div className="lg:pl-[var(--sbw)] transition-[padding] duration-200 min-h-screen flex flex-col">
        <header className="topbar no-print sticky top-0 z-20">
          <div className="h-14 lg:h-16 px-3 sm:px-4 lg:px-8 flex items-center gap-2 sm:gap-3">
            <button ref={boton} type="button" onClick={() => setAbierto(true)} className="lg:hidden tb-icono" aria-label="Abrir menú" aria-expanded={abierto} aria-controls="menu-movil"><Icono n="menu" tam={22} /></button>
            <Link href={INICIO[espacio]} className="lg:hidden flex items-center gap-2 min-w-0" aria-label={`${NOMBRE[espacio]}, ir al inicio`}>
              <MarcaIcono academia={espacio === "academia"} tam={30} fondo={espacio === "academia" ? "#0F766E" : "#0E1116"} />
              <span className="leading-tight min-w-0">
                <span className={`block truncate text-[15px] font-bold text-[var(--tinta)] ${espacio === "academia" ? "font-titulo font-semibold" : ""}`}>{espacio === "academia" ? "Academia" : "Comercial"}</span>
                {aqui && <span className="block truncate text-[11px] text-[var(--gris)]">{aqui.item.t}</span>}
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-2 min-w-0 text-sm">
              <span className="tb-sistema"><span className="w-2 h-2 rounded-full" style={{ background: "var(--ac)" }} aria-hidden="true" />{NOMBRE[espacio]}</span>
              {aqui?.seccion && <><span className="text-[var(--gris)]" aria-hidden="true">/</span><span className="text-[var(--gris)]">{aqui.seccion}</span></>}
              {aqui && <><span className="text-[var(--gris)]" aria-hidden="true">/</span><span className="font-semibold text-[var(--tinta)] truncate">{aqui.item.t}</span></>}
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2 text-sm">{acciones}</div>
          </div>
        </header>
        <main id="contenido" tabIndex={-1} className="flex-1 w-full max-w-[1320px] mx-auto px-4 lg:px-8 py-5 lg:py-7 outline-none">{children}</main>
        <footer className="no-print flex flex-col items-center gap-2 text-center text-xs text-[var(--gris)] py-6 pb-24 md:pb-6">{pie}<EspacioPie espacio={espacio} /></footer>
      </div>
      <EspacioRapidos espacio={espacio} />
    </div>
  )
}

export function EspacioRapidos({ espacio }: { espacio: Espacio }) {
  const ruta = usePathname() ?? "/"
  const r = espacio === "academia"
    ? [{ href: "/sistema", t: "Inicio", i: "casa" }, { href: "/sistema/alumnos", t: "Alumnos", i: "birrete" }, { href: "/sistema/cursos", t: "Cursos", i: "libro" }, { href: "/email", t: "Envíos", i: "mail" }]
    : [{ href: "/", t: "Resumen", i: "tablero" }, { href: "/consultas", t: "Chats", i: "chat" }, { href: "/contactos", t: "Contactos", i: "personas" }, { href: "/proyectos", t: "Proyectos", i: "maletin" }]
  return (
    <nav aria-label="Accesos rápidos" className="rapidos no-print md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {r.map((i) => {
        const on = activo(ruta, i.href, INICIO[espacio])
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className="rapido flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-semibold"><Icono n={i.i} tam={22} />{i.t}</Link>
        )
      })}
    </nav>
  )
}

export function EspacioPie({ espacio }: { espacio: Espacio }) {
  return <>DEVISEBIT SRL · {NOMBRE[espacio]} · Datos personales protegidos (Ley 25.326)</>
}
