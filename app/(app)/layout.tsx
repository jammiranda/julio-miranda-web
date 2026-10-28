import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, cerrarSesion, ROL_NOMBRE, espacioDelHost, URL_ESPACIO, type Espacio } from "@/lib/auth"
import { one } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { avisos, marcarAvisos, restaurarAvisos } from "@/lib/avisos"
import Avatar from "@/components/Avatar"
import ActivarAvisos from "@/components/ActivarAvisos"
import { EspacioShell } from "@/components/EspacioNav"
import Redes from "@/components/Redes"

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
  // Dos sistemas separados por dominio: sistema.devisebit.com (Comercial) y academia.devisebit.com/sistema (Academia)
  const espacio: Espacio = espacioDelHost()
  if (!u.espacios.includes(espacio)) redirect(URL_ESPACIO[u.espacios[0]])
  const ep = { espacio, espacios: u.espacios }
  const colapsado = cookies().get("sb_colapsado")?.value === "1"
  const acciones = (
    <>
      <details className="relative menu-pop">
        <summary className="tb-icono list-none cursor-pointer relative [&::-webkit-details-marker]:hidden" aria-label={`Avisos sin leer: ${nuevos.length}`} title="Avisos importantes">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          {nuevos.length > 0 && <span className={`absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[var(--top-bg)] ${altas ? "bg-red-600" : "bg-amber-600"}`}>{nuevos.length}</span>}
        </summary>
        <div className="pop absolute right-0 mt-2 w-[min(92vw,380px)] card !p-0 z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--borde)] flex justify-between items-center gap-2"><strong>Avisos importantes</strong><span className="text-xs text-[var(--gris)]">{total} pendientes</span></div>
          {av.length > 0 && (
            <form action={marcar} className="px-4 py-2 border-b border-[var(--borde)] flex flex-wrap gap-3 text-xs bg-[var(--sup-2)]">
              {nuevos.length > 0 && <button name="op" value="leer" className="font-semibold text-[var(--tinta)] hover:underline">✓ Marcar todas como leídas</button>}
              <button name="op" value="borrar" className="font-semibold text-red-700 hover:underline">🗑 Borrar todas</button>
            </form>
          )}
          <ul className="m-0 p-0 list-none max-h-[60vh] overflow-auto">
            {av.map((x) => (
              <li key={x.clave} className={`flex items-stretch border-b border-[var(--borde-2)] ${x.leido ? "opacity-55" : ""}`}>
                <Link href={espacio === "academia" && !x.href.startsWith("/sistema") ? URL_ESPACIO.comercial + x.href : x.href} className="flex flex-1 gap-3 pl-4 pr-2 py-3 hover:bg-[var(--sup-2)]">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${x.leido ? "bg-slate-300" : x.nivel === "alta" ? "bg-red-600" : "bg-amber-500"}`} />
                  <span className="flex-1"><span className="font-semibold text-[var(--tinta)]">{x.t}</span><span className="block text-xs text-[var(--gris)]">{x.leido ? "Leído · " : ""}{x.d}</span></span>
                  <span className="font-extrabold text-[var(--tinta)]">{x.n}</span>
                </Link>
                <form action={marcar} className="flex flex-col justify-center gap-1 pr-3">
                  <input type="hidden" name="clave" value={x.clave} />
                  {!x.leido && <button name="op" value="leer" title="Marcar como leído" aria-label={`Marcar como leído: ${x.t}`} className="w-8 h-8 rounded-full text-sm hover:bg-emerald-50 text-emerald-700">✓</button>}
                  <button name="op" value="borrar" title="Borrar aviso" aria-label={`Borrar aviso: ${x.t}`} className="w-8 h-8 rounded-full text-sm hover:bg-red-50 text-red-700">✕</button>
                </form>
              </li>
            ))}
            {!av.length && <li className="px-4 py-6 text-center text-sm text-[var(--gris)]">✅ Todo al día. No hay avisos pendientes.<form action={marcar} className="mt-2"><button name="op" value="restaurar" className="text-xs underline">Ver los avisos borrados de hoy</button></form></li>}
          </ul>
          <div className="px-4 py-3 border-t border-[var(--borde)] bg-[var(--sup-2)]"><ActivarAvisos compacto /></div>
        </div>
      </details>
      <details className="relative menu-pop">
        <summary className="list-none cursor-pointer flex items-center gap-2 rounded-full p-1 sm:pr-3 min-h-[44px] hover:bg-[var(--ac-suave)] [&::-webkit-details-marker]:hidden" title="Mi perfil" aria-label={`Mi perfil: ${u.nombre}`}>
          <Avatar nombre={u.nombre} foto={perfil?.foto} />
          <span className="hidden sm:flex flex-col leading-tight"><span className="font-semibold text-[var(--tinta)]">{u.nombre}</span><span className="text-xs text-[var(--ac-texto)] font-semibold">{ROL_NOMBRE[u.rol]}</span></span>
          <span className="hidden sm:inline text-[var(--gris)] text-xs" aria-hidden="true">▾</span>
        </summary>
        <div className="pop absolute right-0 mt-2 w-64 card !p-2 z-40 flex flex-col">
          <div className="flex items-center gap-3 px-2 py-2 border-b border-[var(--borde)] mb-1"><Avatar nombre={u.nombre} foto={perfil?.foto} size={44} /><div><div className="font-semibold">{u.nombre}</div><div className="text-xs text-[var(--gris)]">@{u.usuario} · {ROL_NOMBRE[u.rol]}</div></div></div>
          <Link href="/cuenta" className="menu-op">👤 Mi perfil y foto</Link>
          <Link href="/cuenta#clave" className="menu-op">🔒 Cambiar contraseña</Link>
          <Link href="/ayuda" className="menu-op">📘 Manual del sistema</Link>
          <form action={salir}><button className="menu-op w-full text-left hover:!bg-red-50 text-rojo">↩ Salir</button></form>
        </div>
      </details>
    </>
  )
  return (
    <EspacioShell {...ep} rol={u.rol} colapsado={colapsado} acciones={acciones} pie={<Redes />}>
      {children}
    </EspacioShell>
  )
}
