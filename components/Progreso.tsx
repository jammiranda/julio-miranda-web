"use client"
import { Suspense, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/** Barra fina arriba de todo: aparece en el mismo instante del clic (link, filtro o búsqueda) y se va cuando llega la pantalla. */
function Barra() {
  const ruta = usePathname()
  const sp = useSearchParams()
  const [on, setOn] = useState(false)
  useEffect(() => { setOn(false) }, [ruta, sp])
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const ir = () => { setOn(true); clearTimeout(t); t = setTimeout(() => setOn(false), 10000) }
    const clic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      const u = new URL(a.href, location.href)
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return
      ir()
    }
    const envio = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement | null
      if (!e.defaultPrevented && f?.method?.toLowerCase() === "get") ir()
    }
    document.addEventListener("click", clic)
    document.addEventListener("submit", envio)
    return () => { document.removeEventListener("click", clic); document.removeEventListener("submit", envio); clearTimeout(t) }
  }, [])
  return on ? <div className="progreso" role="progressbar" aria-label="Cargando" /> : null
}

export default function Progreso() {
  return <Suspense fallback={null}><Barra /></Suspense>
}
