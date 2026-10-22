import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { audit } from "@/lib/db"
import Marca from "@/components/Marca"

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requerir()
  const items = [
    { href: "/", t: "Tablero" },
    { href: "/consultas", t: "Consultas · CRM" },
    { href: "/pacientes", t: "Pacientes" },
    { href: "/agenda", t: "Agenda y visitas" },
    ...(u.rol !== "consulta" ? [{ href: "/cierre", t: "Cierre mensual" }, { href: "/importar", t: "Importar planilla" }] : []),
    ...(u.rol !== "consulta" ? [{ href: "/profesionales", t: "Profesionales" }] : []),
    ...(u.rol === "gerente" || u.rol === "coordinacion" ? [{ href: "/bot", t: "Bot · Conocimiento" }] : []),
    ...(u.rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
    { href: "/ayuda", t: "Ayuda" },
  ]
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-[#E1E6E3] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/"><Marca chico /></Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/cuenta" className="text-[#4F5C69] hover:underline" title="Mi cuenta y contraseña">{u.nombre} · <strong className="text-[#0B7A3B]">{ROL_NOMBRE[u.rol]}</strong></Link>
            <form action={salir}><button className="btn-s py-1.5">Salir</button></form>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#33414F] hover:bg-[#E3F2E8] whitespace-nowrap">{i.t}</Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
      <nav aria-label="Accesos rápidos" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E1E6E3] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {[{ href: "/", t: "Tablero", i: "▦" }, { href: "/consultas", t: "Consultas", i: "✉" }, { href: "/pacientes", t: "Pacientes", i: "♥" }, { href: "/agenda", t: "Agenda", i: "▤" }].map((i) => (
          <Link key={i.href} href={i.href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-[#33414F] active:bg-[#E3F2E8]"><span className="text-lg leading-none text-[#0B7A3B]" aria-hidden="true">{i.i}</span>{i.t}</Link>
        ))}
      </nav>
      <footer className="text-center text-xs text-[#4F5C69] py-6">San Patricio Servicios de Salud · Sistema de gestión · Datos de salud protegidos (Ley 25.326) · Desarrollado por DEVISEBIT SRL</footer>
    </div>
  )
}
