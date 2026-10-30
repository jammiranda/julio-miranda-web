"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { salirCuenta } from "@/lib/ingreso"

type Yo = { cuenta: { nombre: string; email: string } | null; sistema: boolean }

/**
 * Botón "Mi cuenta" del header de la Academia. Siempre lleva a /mi-cuenta (sin salir de la Academia).
 * Con sesión muestra el nombre y "Salir"; si además es del equipo con el espacio Academia, "Sistema Academia".
 */
export default function CuentaHeader({ movil = false, menu = false }: { movil?: boolean; menu?: boolean }) {
  const [yo, setYo] = useState<Yo | null>(null)
  const ruta = usePathname()
  useEffect(() => {
    let vivo = true
    fetch("/api/academia/yo", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => vivo && setYo(j))
      .catch(() => {})
    return () => { vivo = false }
  }, [ruta])

  // Dentro del menú hamburguesa: quién es, Sistema Academia (si es del equipo) y Salir.
  if (menu) {
    if (!yo?.cuenta && !yo?.sistema) return null
    return (
      <div className="mt-6 flex flex-col gap-2">
        {yo.cuenta && <p className="m-0 text-sm text-white/70">Sesión de <strong className="text-white">{yo.cuenta.email}</strong></p>}
        {yo.sistema && <a href="/sistema" className="min-h-[48px] inline-flex items-center justify-center rounded-xl border border-[#FF6A63]/60 text-[#FF6A63] font-semibold no-underline">Sistema Academia</a>}
        {yo.cuenta && <form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button className="w-full min-h-[48px] rounded-xl border border-white/25 bg-transparent text-white font-semibold cursor-pointer">Salir de mi cuenta</button></form>}
      </div>
    )
  }

  const nombre = yo?.cuenta ? yo.cuenta.nombre.split(" ")[0] || yo.cuenta.email : null
  const boton = `btn bg-[#C8231F] text-white hover:bg-[#9E1A17] no-underline ${movil ? "min-h-[40px] px-3" : "ml-1 min-h-[44px]"}`
  return (
    <div className="flex items-center gap-1">
      {yo?.sistema && !movil && <a href="/sistema" className="px-2.5 py-3 rounded-lg text-[#FF6A63] hover:text-white hover:bg-white/10 no-underline font-semibold">Sistema Academia</a>}
      <Link href="/mi-cuenta" title={yo?.cuenta ? `Sesión de ${yo.cuenta.email}` : "Tus cursos, clases y certificados"} className={boton}>
        {nombre && !movil ? <span className="max-w-[12rem] truncate">Mi cuenta · {nombre}</span> : "Mi cuenta"}
      </Link>
      {yo?.cuenta && !movil && (
        <form action={salirCuenta}>
          <input type="hidden" name="sitio" value="academia" />
          <button className="px-2.5 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 bg-transparent border-0 cursor-pointer text-sm">Salir</button>
        </form>
      )}
    </div>
  )
}
