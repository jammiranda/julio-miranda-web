"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Marca from "@/components/Marca"

/** Dos sistemas separados en la misma app: Comercial y Academia. El menú cambia según la ruta. */
export type Espacio = "comercial" | "academia"
const INICIO: Record<Espacio, string> = { comercial: "/", academia: "/academia-admin" }
const NOMBRE: Record<Espacio, string> = { comercial: "Sistema comercial", academia: "Sistema Academia" }

function deRuta(p: string): Espacio | null {
  if (/^\/(academia-admin|cursos)(\/|$)/.test(p)) return "academia"
  if (/^\/(email|cuenta|ayuda|usuarios)(\/|$)/.test(p)) return null
  return "comercial"
}

function useEspacio(inicial: Espacio, espacios: Espacio[]) {
  const p = usePathname() ?? "/"
  const [ultimo, setUltimo] = useState<Espacio>(inicial)
  const r = deRuta(p)
  useEffect(() => { if (r) setUltimo(r) }, [r])
  const e = r ?? ultimo
  return { ruta: p, espacio: espacios.includes(e) ? e : espacios[0] }
}

type Props = { inicial: Espacio; espacios: Espacio[]; rol: string }

export function EspacioCabecera({ inicial, espacios }: Omit<Props, "rol">) {
  const { espacio, ruta } = useEspacio(inicial, espacios)
  const router = useRouter()
  const r = deRuta(ruta)
  // Si alguien sin acceso llega a una sección del otro sistema, lo llevamos a su inicio
  useEffect(() => { if (r && !espacios.includes(r)) router.replace(INICIO[espacios[0]]) }, [r, espacios, router])
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={INICIO[espacio]}><Marca chico sub={espacio === "academia" ? "SISTEMA ACADEMIA" : "SISTEMA COMERCIAL"} /></Link>
      {espacios.length > 1 && (
        <nav aria-label="Cambiar de sistema" className="flex rounded-full bg-[#F1F3F6] p-1 text-sm font-semibold">
          {(["comercial", "academia"] as Espacio[]).map((e) => (
            <Link key={e} href={INICIO[e]} aria-current={e === espacio ? "page" : undefined} className={`px-3.5 py-1.5 rounded-full transition-colors ${e === espacio ? "bg-white shadow-sm " + (e === "academia" ? "text-[#0F766E]" : "text-[#C8231F]") : "text-[#4A515C] hover:text-[#0E1116]"}`}>{e === "comercial" ? "Comercial" : "Academia"}</Link>
          ))}
        </nav>
      )}
    </div>
  )
}

function itemsDe(espacio: Espacio, rol: string) {
  const edita = rol === "gerente" || rol === "coordinacion"
  return espacio === "academia"
    ? [
        { href: "/academia-admin", t: "Inicio" },
        { href: "/academia-admin/alumnos", t: "Alumnos y suscriptos" },
        ...(edita ? [{ href: "/cursos", t: "Cursos" }, { href: "/academia-admin#guias", t: "Guías" }, { href: "/academia-admin#productos", t: "Productos y ventas" }, { href: "/email", t: "Envíos de email" }] : []),
        ...(rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }] : []),
        { href: "/ayuda", t: "Ayuda" },
      ]
    : [
        { href: "/", t: "Resumen" },
        { href: "/consultas", t: "Conversaciones" },
        { href: "/contactos", t: "Contactos" },
        { href: "/proyectos", t: "Proyectos" },
        { href: "/servicios", t: "Servicios" },
        ...(edita ? [{ href: "/precios", t: "Precios" }, { href: "/portal-admin", t: "Portal y accesos" }, { href: "/email", t: "Envíos de email" }] : []),
        ...(edita ? [{ href: "/demos-admin", t: "Demos" }, { href: "/bot", t: "Bot · Conocimiento" }, { href: "/agenda", t: "Agenda y avisos" }, { href: "/whatsapp-business", t: "WhatsApp Business" }] : []),
        ...(rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
        { href: "/ayuda", t: "Ayuda" },
      ]
}

const activo = (ruta: string, href: string) => (href === "/" ? ruta === "/" : href.includes("#") ? false : ruta === href || (ruta.startsWith(href + "/") && !(href === "/academia-admin" && ruta.startsWith("/academia-admin/alumnos"))))

export function EspacioMenu({ inicial, espacios, rol }: Props) {
  const { espacio, ruta } = useEspacio(inicial, espacios)
  const acento = espacio === "academia" ? "#0F766E" : "#C8231F"
  return (
    <nav aria-label={NOMBRE[espacio]} className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
      {itemsDe(espacio, rol).map((i) => {
        const on = activo(ruta, i.href)
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${espacio === "academia" ? "hover:bg-[#E6F4F1]" : "hover:bg-[#FDECEB]"} ${on ? "text-white" : "text-[#262C37]"}`} style={on ? { background: acento } : undefined}>{i.t}</Link>
        )
      })}
    </nav>
  )
}

export function EspacioRapidos({ inicial, espacios }: Omit<Props, "rol">) {
  const { espacio } = useEspacio(inicial, espacios)
  const acento = espacio === "academia" ? "#0F766E" : "#C8231F"
  const r = espacio === "academia"
    ? [{ href: "/academia-admin", t: "Inicio", i: "▦" }, { href: "/academia-admin/alumnos", t: "Alumnos", i: "☺" }, { href: "/cursos", t: "Cursos", i: "▤" }, { href: "/email", t: "Envíos", i: "✉" }]
    : [{ href: "/", t: "Resumen", i: "▦" }, { href: "/consultas", t: "Chats", i: "✉" }, { href: "/contactos", t: "Contactos", i: "☺" }, { href: "/proyectos", t: "Proyectos", i: "▤" }]
  return (
    <nav aria-label="Accesos rápidos" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E5EA] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {r.map((i) => (
        <Link key={i.href} href={i.href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-[#262C37] active:bg-[#F1F3F6]"><span className="text-lg leading-none" style={{ color: acento }} aria-hidden="true">{i.i}</span>{i.t}</Link>
      ))}
    </nav>
  )
}

export function EspacioPie({ inicial, espacios }: Omit<Props, "rol">) {
  const { espacio } = useEspacio(inicial, espacios)
  return <>DEVISEBIT SRL · {NOMBRE[espacio]} · Datos personales protegidos (Ley 25.326)</>
}
