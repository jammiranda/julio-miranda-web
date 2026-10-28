"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Marca from "@/components/Marca"

/**
 * Dos sistemas separados, cada uno en su dominio:
 * - Comercial: sistema.devisebit.com
 * - Academia: academia.devisebit.com/sistema
 */
export type Espacio = "comercial" | "academia"
const URL_ESPACIO: Record<Espacio, string> = { comercial: "https://sistema.devisebit.com", academia: "https://academia.devisebit.com/sistema" }
const NOMBRE: Record<Espacio, string> = { comercial: "Sistema comercial", academia: "Sistema Academia" }
const INICIO: Record<Espacio, string> = { comercial: "/", academia: "/sistema" }

type Props = { espacio: Espacio; espacios: Espacio[]; rol: string }

export function EspacioCabecera({ espacio, espacios }: Omit<Props, "rol">) {
  const otro: Espacio = espacio === "academia" ? "comercial" : "academia"
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={INICIO[espacio]}><Marca chico sub={espacio === "academia" ? "SISTEMA ACADEMIA" : "SISTEMA COMERCIAL"} /></Link>
      {espacios.includes(otro) && (
        <a href={URL_ESPACIO[otro]} className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#E2E5EA] px-3 py-1 text-xs font-semibold text-[#4A515C] hover:text-[#0E1116] hover:border-[#C3C8D1]">
          Ir al {NOMBRE[otro]} ↗
        </a>
      )}
    </div>
  )
}

function itemsDe(espacio: Espacio, rol: string) {
  const edita = rol === "gerente" || rol === "coordinacion"
  return espacio === "academia"
    ? [
        { href: "/sistema", t: "Inicio" },
        { href: "/sistema/alumnos", t: "Alumnos y suscriptos" },
        ...(edita ? [{ href: "/sistema/cursos", t: "Cursos" }, { href: "/sistema#guias", t: "Guías" }, { href: "/sistema#productos", t: "Productos y ventas" }, { href: "/email", t: "Envíos de email" }] : []),
        ...(rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }] : []),
        { href: "/ayuda", t: "Ayuda" },
      ]
    : [
        { href: "/", t: "Resumen" },
        { href: "/consultas", t: "Conversaciones" },
        { href: "/contactos", t: "Contactos" },
        { href: "/proyectos", t: "Proyectos" },
        { href: "/servicios", t: "Servicios" },
        ...(edita ? [{ href: "/precios", t: "Precios" }, { href: "/portal-admin", t: "Portal y accesos" }, { href: "/demos-admin", t: "Demos" }, { href: "/email", t: "Envíos de email" }] : []),
        ...(edita ? [{ href: "/bot", t: "Bot · Conocimiento" }, { href: "/agenda", t: "Agenda y avisos" }, { href: "/whatsapp-business", t: "WhatsApp Business" }] : []),
        ...(rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
        { href: "/ayuda", t: "Ayuda" },
      ]
}

const activo = (ruta: string, href: string, inicio: string) =>
  href.includes("#") ? false : href === inicio ? ruta === inicio : ruta === href || ruta.startsWith(href + "/")

export function EspacioMenu({ espacio, rol }: Omit<Props, "espacios">) {
  const ruta = usePathname() ?? "/"
  const acento = espacio === "academia" ? "#0F766E" : "#C8231F"
  return (
    <nav aria-label={NOMBRE[espacio]} className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
      {itemsDe(espacio, rol).map((i) => {
        const on = activo(ruta, i.href, INICIO[espacio])
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${espacio === "academia" ? "hover:bg-[#E6F4F1]" : "hover:bg-[#FDECEB]"} ${on ? "text-white" : "text-[#262C37]"}`} style={on ? { background: acento } : undefined}>{i.t}</Link>
        )
      })}
    </nav>
  )
}

export function EspacioRapidos({ espacio }: { espacio: Espacio }) {
  const acento = espacio === "academia" ? "#0F766E" : "#C8231F"
  const r = espacio === "academia"
    ? [{ href: "/sistema", t: "Inicio", i: "▦" }, { href: "/sistema/alumnos", t: "Alumnos", i: "☺" }, { href: "/sistema/cursos", t: "Cursos", i: "▤" }, { href: "/email", t: "Envíos", i: "✉" }]
    : [{ href: "/", t: "Resumen", i: "▦" }, { href: "/consultas", t: "Chats", i: "✉" }, { href: "/contactos", t: "Contactos", i: "☺" }, { href: "/proyectos", t: "Proyectos", i: "▤" }]
  return (
    <nav aria-label="Accesos rápidos" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E5EA] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {r.map((i) => (
        <Link key={i.href} href={i.href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-[#262C37] active:bg-[#F1F3F6]"><span className="text-lg leading-none" style={{ color: acento }} aria-hidden="true">{i.i}</span>{i.t}</Link>
      ))}
    </nav>
  )
}

export function EspacioPie({ espacio }: { espacio: Espacio }) {
  return <>DEVISEBIT SRL · {NOMBRE[espacio]} · Datos personales protegidos (Ley 25.326)</>
}
