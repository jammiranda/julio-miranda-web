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
    { href: "/pacientes", t: "Pacientes" },
    { href: "/agenda", t: "Agenda y visitas" },
    ...(u.rol !== "consulta" ? [{ href: "/cierre", t: "Cierre mensual" }, { href: "/importar", t: "Importar planilla" }] : []),
    ...(u.rol !== "consulta" ? [{ href: "/profesionales", t: "Profesionales" }] : []),
    ...(u.rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
  ]
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-[#E1E6E3] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/"><Marca chico /></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#4F5C69]">{u.nombre} · <strong className="text-[#0B7A3B]">{ROL_NOMBRE[u.rol]}</strong></span>
            <form action={salir}><button className="btn-s py-1.5">Salir</button></form>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#33414F] hover:bg-[#E3F2E8] whitespace-nowrap">{i.t}</Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-[#4F5C69] py-6">San Patricio Servicios de Salud · Sistema de gestión · Datos de salud protegidos (Ley 25.326) · Desarrollado por DEVISEBIT SRL</footer>
    </div>
  )
}
