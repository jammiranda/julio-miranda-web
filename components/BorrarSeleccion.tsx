"use client"
import { useEffect, useState } from "react"

/** Barra para eliminar varias filas marcadas (checkboxes con la clase `sel-fila` y el atributo form="<form>"). */
export default function BorrarSeleccion({ form, singular, plural, aviso }: { form: string; singular: string; plural: string; aviso?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const cuenta = () => setN(document.querySelectorAll<HTMLInputElement>(`input.sel-fila[form="${form}"]:checked`).length)
    document.addEventListener("change", cuenta)
    return () => document.removeEventListener("change", cuenta)
  }, [form])
  const todas = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.querySelectorAll<HTMLInputElement>(`input.sel-fila[form="${form}"]`).forEach((i) => { i.checked = e.target.checked })
    setN(e.target.checked ? document.querySelectorAll(`input.sel-fila[form="${form}"]`).length : 0)
  }
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-2 border-b border-[#E2E5EA] bg-[#FDECEB] text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" onChange={todas} /> Marcar todas</label>
      <button
        form={form}
        disabled={!n}
        onClick={(e) => { if (!window.confirm(`¿Eliminar ${n} ${n === 1 ? singular : plural}? ${aviso ?? ""} No se puede deshacer.`)) e.preventDefault() }}
        className="btn-s py-1.5 !border-red-300 text-red-700 hover:!border-red-600 disabled:opacity-40"
      >
        Eliminar{n ? ` (${n})` : ""}
      </button>
    </div>
  )
}
