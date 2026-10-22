"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/devisebit", t: "Resumen" },
  { href: "/devisebit/contactos", t: "Contactos" },
  { href: "/devisebit/proyectos", t: "Proyectos" },
  { href: "/devisebit/servicios", t: "Servicios" },
  { href: "/consultas?e=devisebit", t: "Consultas del bot" },
]

export default function DbTabs() {
  const p = usePathname()
  return (
    <nav aria-label="Secciones del CRM" className="flex gap-1 overflow-x-auto">
      {TABS.map((x) => {
        const on = x.href === "/devisebit" ? p === x.href : p.startsWith(x.href.split("?")[0]) && !x.href.includes("?")
        return (
          <Link key={x.href} href={x.href} aria-current={on ? "page" : undefined} className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${on ? "bg-[#26323E] text-white" : "text-[#33414F] hover:bg-[#E3F2E8]"}`}>{x.t}</Link>
        )
      })}
    </nav>
  )
}
