"use client"
import { useState } from "react"

/** Filtra al instante las filas de la tabla o lista indicada (por su texto), sin ir al servidor. */
export default function BuscarVivo({ en, placeholder = "Buscar", inicial = "" }: { en: string; placeholder?: string; inicial?: string }) {
  const [b, setB] = useState(inicial)
  const [n, setN] = useState<number | null>(null)
  const filtrar = (v: string) => {
    setB(v)
    const t = v.trim().toLowerCase()
    let visibles = 0
    document.querySelectorAll<HTMLElement>(`${en} tbody tr, ${en} [data-fila]`).forEach((f) => {
      const ok = !t || (f.textContent ?? "").toLowerCase().includes(t)
      f.hidden = !ok
      if (ok) visibles++
    })
    setN(t ? visibles : null)
  }
  return (
    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
      <label className="sr-only" htmlFor="buscar-vivo">{placeholder}</label>
      <input id="buscar-vivo" type="search" value={b} onChange={(e) => filtrar(e.target.value)} placeholder={placeholder} className="inp !w-auto flex-1 min-w-[220px]" />
      <span className="text-xs text-[var(--gris)]" role="status">{n == null ? "" : n === 1 ? "1 resultado" : `${n} resultados`}</span>
    </div>
  )
}
