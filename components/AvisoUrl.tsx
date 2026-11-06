"use client"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/** Aviso de lo que pasó al eliminar (viene en la dirección): se muestra arriba y se puede cerrar. */
function Cuerpo() {
  const sp = useSearchParams()
  const ruta = usePathname()
  const router = useRouter()
  const ok = sp.get("eliminado"), mal = sp.get("noeliminado")
  if (!ok && !mal) return null
  const cerrar = () => { const p = new URLSearchParams(sp.toString()); p.delete("eliminado"); p.delete("noeliminado"); const s = p.toString(); router.replace(`${ruta}${s ? `?${s}` : ""}`, { scroll: false }) }
  return (
    <p role={mal ? "alert" : "status"} className={`mb-4 flex items-center justify-between gap-3 text-sm font-semibold rounded-xl px-4 py-3 border ${mal ? "text-red-800 bg-red-50 border-red-200" : "text-emerald-800 bg-emerald-50 border-emerald-200"}`}>
      <span>{mal ?? ok}</span><button type="button" onClick={cerrar} aria-label="Cerrar aviso" className="text-lg leading-none px-2">×</button>
    </p>
  )
}
export default function AvisoUrl() { return <Suspense fallback={null}><Cuerpo /></Suspense> }
