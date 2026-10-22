import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { one } from "@/lib/db"
import { avisos } from "@/lib/avisos"
import Avatar from "@/components/Avatar"
import ActivarAvisos from "@/components/ActivarAvisos"
import Marca from "@/components/Marca"

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requerir()
  const [perfil, av] = await Promise.all([one<{ foto: string | null }>("select foto from usuarios where id=$1", [u.id]).catch(() => null), avisos(u)])
  const total = av.reduce((a, x) => a + x.n, 0)
  const altas = av.filter((x) => x.nivel === "alta").length
  const items = [
    { href: "/", t: "Tablero" },
    { href: "/consultas", t: "Consultas · CRM" },
    { href: "/pacientes", t: "Pacientes" },
    { href: "/agenda", t: "Agenda y visitas" },
    ...(u.rol !== "consulta" ? [{ href: "/cierre", t: "Cierre mensual" }, { href: "/importar", t: "Importar planilla" }] : []),
    ...(u.rol !== "consulta" ? [{ href: "/profesionales", t: "Profesionales" }] : []),
    ...(u.rol === "gerente" || u.rol === "coordinacion" ? [{ href: "/bot", t: "Bot · Conocimiento" }] : []),
    ...(u.rol === "gerente" ? [{ href: "/devisebit", t: "DEVISEBIT · CRM" }] : []),
    ...(u.rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
    { href: "/ayuda", t: "Ayuda" },
  ]
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-[#E1E6E3] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/"><Marca chico /></Link>
          <div className="flex items-center gap-2 text-sm">
            <details className="relative group">
              <summary className="list-none cursor-pointer relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E3F2E8] [&::-webkit-details-marker]:hidden" aria-label={`Avisos: ${av.length}`} title="Avisos importantes">
                <span className="text-xl" aria-hidden="true">🔔</span>
                {av.length > 0 && <span className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center ${altas ? "bg-red-600 animate-pulse" : "bg-amber-500"}`}>{av.length}</span>}
              </summary>
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] card p-0 shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E1E6E3] flex justify-between items-center"><strong>Avisos importantes</strong><span className="text-xs text-[#4F5C69]">{total} pendientes</span></div>
                <ul className="m-0 p-0 list-none max-h-[60vh] overflow-auto">
                  {av.map((x, i) => (
                    <li key={i}><Link href={x.href} className="flex gap-3 px-4 py-3 hover:bg-[#F7FAF8] border-b border-[#EEF1EF]">
                      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${x.nivel === "alta" ? "bg-red-600" : "bg-amber-500"}`} />
                      <span className="flex-1"><span className="font-semibold text-[#26323E]">{x.t}</span><span className="block text-xs text-[#4F5C69]">{x.d}</span></span>
                      <span className="font-extrabold text-[#26323E]">{x.n}</span>
                    </Link></li>
                  ))}
                  {!av.length && <li className="px-4 py-6 text-center text-sm text-[#4F5C69]">✅ Todo al día. No hay avisos pendientes.</li>}
                </ul>
                <div className="px-4 py-3 border-t border-[#E1E6E3] bg-[#F7FAF8]"><ActivarAvisos compacto /></div>
              </div>
            </details>
            <details className="relative">
              <summary className="list-none cursor-pointer flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-[#E3F2E8] [&::-webkit-details-marker]:hidden" title="Mi perfil">
                <Avatar nombre={u.nombre} foto={perfil?.foto} />
                <span className="hidden sm:flex flex-col leading-tight"><span className="font-semibold text-[#26323E]">{u.nombre}</span><span className="text-xs text-[#0B7A3B] font-semibold">{ROL_NOMBRE[u.rol]}</span></span>
                <span className="text-[#4F5C69] text-xs" aria-hidden="true">▾</span>
              </summary>
              <div className="absolute right-0 mt-2 w-60 card p-2 shadow-xl z-40 flex flex-col">
                <div className="flex items-center gap-3 px-2 py-2 border-b border-[#E1E6E3] mb-1"><Avatar nombre={u.nombre} foto={perfil?.foto} size={44} /><div><div className="font-semibold">{u.nombre}</div><div className="text-xs text-[#4F5C69]">@{u.usuario} · {ROL_NOMBRE[u.rol]}</div></div></div>
                <Link href="/cuenta" className="px-3 py-2 rounded-lg hover:bg-[#F3F5F4]">👤 Mi perfil y foto</Link>
                <Link href="/cuenta#clave" className="px-3 py-2 rounded-lg hover:bg-[#F3F5F4]">🔒 Cambiar contraseña</Link>
                <Link href="/ayuda" className="px-3 py-2 rounded-lg hover:bg-[#F3F5F4]">📘 Manual del sistema</Link>
                <form action={salir}><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-rojo">↩ Salir</button></form>
              </div>
            </details>
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
