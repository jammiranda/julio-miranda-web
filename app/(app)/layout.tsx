import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { one } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { avisos, marcarAvisos, restaurarAvisos } from "@/lib/avisos"
import Avatar from "@/components/Avatar"
import ActivarAvisos from "@/components/ActivarAvisos"
import Marca from "@/components/Marca"

async function marcar(fd: FormData) {
  "use server"
  const u = await requerir()
  const op = String(fd.get("op") ?? "")
  const clave = String(fd.get("clave") ?? "") || undefined
  if (op === "restaurar") await restaurarAvisos(u)
  else await marcarAvisos(u, op === "borrar" ? "borrado" : "leido", clave)
  revalidatePath("/", "layout")
}

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requerir()
  const [perfil, av] = await Promise.all([one<{ foto: string | null }>("select foto from usuarios where id=$1", [u.id]).catch(() => null), avisos(u)])
  const nuevos = av.filter((x) => !x.leido)
  const total = nuevos.reduce((a, x) => a + x.n, 0)
  const altas = nuevos.filter((x) => x.nivel === "alta").length
  const items = [
    { href: "/", t: "Resumen" },
    { href: "/consultas", t: "Conversaciones" },
    { href: "/contactos", t: "Contactos" },
    { href: "/proyectos", t: "Proyectos" },
    { href: "/servicios", t: "Servicios" },
    ...(u.rol === "gerente" || u.rol === "coordinacion" ? [{ href: "/precios", t: "Precios" }] : []),
    ...(u.rol === "gerente" || u.rol === "coordinacion" ? [{ href: "/email", t: "Email marketing" }, { href: "/academia-admin", t: "Academia" }] : []),
    ...(u.rol === "gerente" || u.rol === "coordinacion" ? [{ href: "/bot", t: "Bot · Conocimiento" }, { href: "/agenda", t: "Agenda y avisos" }, { href: "/whatsapp-business", t: "WhatsApp Business" }] : []),
    ...(u.rol === "gerente" ? [{ href: "/usuarios", t: "Usuarios" }, { href: "/auditoria", t: "Auditoría" }] : []),
    { href: "/ayuda", t: "Ayuda" },
  ]
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-[#E2E5EA] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/"><Marca chico /></Link>
          <div className="flex items-center gap-2 text-sm">
            <details className="relative group">
              <summary className="list-none cursor-pointer relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#FDECEB] [&::-webkit-details-marker]:hidden" aria-label={`Avisos sin leer: ${nuevos.length}`} title="Avisos importantes">
                <span className="text-xl" aria-hidden="true">🔔</span>
                {nuevos.length > 0 && <span className={`absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center ${altas ? "bg-red-600 animate-pulse" : "bg-amber-500"}`}>{nuevos.length}</span>}
              </summary>
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] card p-0 shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E5EA] flex justify-between items-center gap-2"><strong>Avisos importantes</strong><span className="text-xs text-[#4A515C]">{total} pendientes</span></div>
                {av.length > 0 && (
                  <form action={marcar} className="px-4 py-2 border-b border-[#E2E5EA] flex flex-wrap gap-3 text-xs bg-[#F8F9FB]">
                    {nuevos.length > 0 && <button name="op" value="leer" className="font-semibold text-[#0E1116] hover:underline">✓ Marcar todas como leídas</button>}
                    <button name="op" value="borrar" className="font-semibold text-red-700 hover:underline">🗑 Borrar todas</button>
                  </form>
                )}
                <ul className="m-0 p-0 list-none max-h-[60vh] overflow-auto">
                  {av.map((x, i) => (
                    <li key={x.clave} className={`flex items-stretch border-b border-[#EEF0F3] ${x.leido ? "opacity-55" : ""}`}>
                      <Link href={x.href} className="flex flex-1 gap-3 pl-4 pr-2 py-3 hover:bg-[#F8F9FB]">
                        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${x.leido ? "bg-slate-300" : x.nivel === "alta" ? "bg-red-600" : "bg-amber-500"}`} />
                        <span className="flex-1"><span className="font-semibold text-[#0E1116]">{x.t}</span><span className="block text-xs text-[#4A515C]">{x.leido ? "Leído · " : ""}{x.d}</span></span>
                        <span className="font-extrabold text-[#0E1116]">{x.n}</span>
                      </Link>
                      <form action={marcar} className="flex flex-col justify-center gap-1 pr-3">
                        <input type="hidden" name="clave" value={x.clave} />
                        {!x.leido && <button name="op" value="leer" title="Marcar como leído" aria-label={`Marcar como leído: ${x.t}`} className="w-7 h-7 rounded-full text-sm hover:bg-emerald-50 text-emerald-700">✓</button>}
                        <button name="op" value="borrar" title="Borrar aviso" aria-label={`Borrar aviso: ${x.t}`} className="w-7 h-7 rounded-full text-sm hover:bg-red-50 text-red-700">✕</button>
                      </form>
                    </li>
                  ))}
                  {!av.length && <li className="px-4 py-6 text-center text-sm text-[#4A515C]">✅ Todo al día. No hay avisos pendientes.<form action={marcar} className="mt-2"><button name="op" value="restaurar" className="text-xs underline">Ver los avisos borrados de hoy</button></form></li>}
                </ul>
                <div className="px-4 py-3 border-t border-[#E2E5EA] bg-[#F8F9FB]"><ActivarAvisos compacto /></div>
              </div>
            </details>
            <details className="relative">
              <summary className="list-none cursor-pointer flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-[#FDECEB] [&::-webkit-details-marker]:hidden" title="Mi perfil">
                <Avatar nombre={u.nombre} foto={perfil?.foto} />
                <span className="hidden sm:flex flex-col leading-tight"><span className="font-semibold text-[#0E1116]">{u.nombre}</span><span className="text-xs text-[#C8231F] font-semibold">{ROL_NOMBRE[u.rol]}</span></span>
                <span className="text-[#4A515C] text-xs" aria-hidden="true">▾</span>
              </summary>
              <div className="absolute right-0 mt-2 w-60 card p-2 shadow-xl z-40 flex flex-col">
                <div className="flex items-center gap-3 px-2 py-2 border-b border-[#E2E5EA] mb-1"><Avatar nombre={u.nombre} foto={perfil?.foto} size={44} /><div><div className="font-semibold">{u.nombre}</div><div className="text-xs text-[#4A515C]">@{u.usuario} · {ROL_NOMBRE[u.rol]}</div></div></div>
                <Link href="/cuenta" className="px-3 py-2 rounded-lg hover:bg-[#F5F6F8]">👤 Mi perfil y foto</Link>
                <Link href="/cuenta#clave" className="px-3 py-2 rounded-lg hover:bg-[#F5F6F8]">🔒 Cambiar contraseña</Link>
                <Link href="/ayuda" className="px-3 py-2 rounded-lg hover:bg-[#F5F6F8]">📘 Manual del sistema</Link>
                <form action={salir}><button className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-rojo">↩ Salir</button></form>
              </div>
            </details>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#262C37] hover:bg-[#FDECEB] whitespace-nowrap">{i.t}</Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
      <nav aria-label="Accesos rápidos" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E5EA] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {[{ href: "/", t: "Resumen", i: "▦" }, { href: "/consultas", t: "Chats", i: "✉" }, { href: "/contactos", t: "Contactos", i: "☺" }, { href: "/proyectos", t: "Proyectos", i: "▤" }].map((i) => (
          <Link key={i.href} href={i.href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-[#262C37] active:bg-[#FDECEB]"><span className="text-lg leading-none text-[#C8231F]" aria-hidden="true">{i.i}</span>{i.t}</Link>
        ))}
      </nav>
      <footer className="text-center text-xs text-[#4A515C] py-6">DEVISEBIT SRL · Sistema comercial · Datos personales protegidos (Ley 25.326)</footer>
    </div>
  )
}
