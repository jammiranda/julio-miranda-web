"use client"
import { useEffect, useState } from "react"
import { accionLote } from "@/lib/prospeccion-acciones"

/**
 * Barra de selección múltiple de Acercamientos: tildás varias tarjetas (o "todas las visibles", respetando el filtro)
 * y aplicás la misma acción a todas de una vez. Las casillas de cada tarjeta son <input form="lote" name="ids">.
 */
export default function Lote({ acciones, volver }: { acciones: { acc: string; t: string; p?: boolean }[]; volver: string }) {
  const [n, setN] = useState(0)
  const [total, setTotal] = useState(0)
  const casillas = () => Array.from(document.querySelectorAll<HTMLInputElement>('input[form="lote"][name="ids"]'))
  const visibles = () => casillas().filter((c) => c.closest("article")?.offsetParent !== null)
  useEffect(() => {
    const contar = () => { setN(casillas().filter((c) => c.checked).length); setTotal(visibles().length) }
    contar()
    document.addEventListener("change", contar)
    const t = setInterval(contar, 800) // el filtro de la pantalla oculta tarjetas sin evento de cambio
    return () => { document.removeEventListener("change", contar); clearInterval(t) }
  }, [])
  const todas = (v: boolean) => { casillas().forEach((c) => { c.checked = false }); if (v) visibles().forEach((c) => { c.checked = true }); setN(v ? visibles().length : 0) }
  return (
    <form id="lote" action={accionLote} className="sticky top-2 z-20 card !py-2.5 !px-3.5 flex flex-wrap items-center gap-2 shadow-md" aria-label="Acciones sobre los seleccionados">
      <input type="hidden" name="_volver" value={volver} />
      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
        <input type="checkbox" checked={n > 0 && n === total} onChange={(e) => todas(e.target.checked)} aria-label="Seleccionar todos los visibles" className="w-4 h-4" />
        {n ? `${n} seleccionado${n === 1 ? "" : "s"}` : `Seleccionar todos (${total})`}
      </label>
      {n > 0 && <button type="button" onClick={() => todas(false)} className="text-sm underline text-[var(--gris)]">Ninguno</button>}
      <div className="flex flex-wrap gap-1.5 ml-auto">
        {acciones.map((a) => (
          <button key={a.acc} name="_acc" value={a.acc} disabled={!n} className={`${a.p ? "btn-p" : "btn-s"} py-1.5 px-3 text-sm disabled:opacity-40`}>{a.t}{n ? ` (${n})` : ""}</button>
        ))}
      </div>
    </form>
  )
}
