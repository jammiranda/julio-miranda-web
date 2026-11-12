"use client"
import { useEffect, useState } from "react"

type Accion = { n: string; accion: (fd: FormData) => Promise<void>; principal?: boolean; confirmar?: string }

/**
 * Barra de acciones sobre varias filas marcadas (checkboxes con la clase `sel-fila` y el atributo form="<form>").
 * `acciones` son las constructivas (la principal va con el color de marca); `eliminar` va aparte, discreta y siempre con confirmación.
 */
export default function AccionesSeleccion({ form, singular, plural, aviso, acciones = [], eliminar }: { form: string; singular: string; plural: string; aviso?: string; acciones?: Accion[]; eliminar?: (fd: FormData) => Promise<void> }) {
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
  const cuantas = `${n} ${n === 1 ? singular : plural}`
  return (
    <div className="flex flex-col gap-2 px-5 py-3 border-b border-[#E2E5EA] bg-[#F8F9FB] text-sm">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 min-h-[44px] sm:min-h-0 cursor-pointer"><input type="checkbox" onChange={todas} className="w-5 h-5" /> Marcar todas</label>
        <span className="text-[#4A515C]" aria-live="polite">{n ? `${cuantas} marcada${n === 1 ? "" : "s"}` : "Marcá filas para actuar sobre varias a la vez"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {acciones.map((a) => (
          <button
            key={a.n}
            form={form}
            formAction={a.accion}
            disabled={!n}
            onClick={(e) => { if (a.confirmar && !window.confirm(`¿${a.n}: ${cuantas}? ${a.confirmar}`)) e.preventDefault() }}
            className={`${a.principal ? "btn-p" : "btn-s"} py-1.5 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {a.n}{n ? ` (${n})` : ""}
          </button>
        ))}
        {eliminar && (
          <button
            form={form}
            formAction={eliminar}
            disabled={!n}
            onClick={(e) => { if (!window.confirm(`¿Eliminar ${cuantas}? ${aviso ?? ""} No se puede deshacer.`)) e.preventDefault() }}
            className="btn ml-auto py-1.5 px-2 !font-normal text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
          >
            Eliminar{n ? ` (${n})` : ""}
          </button>
        )}
      </div>
    </div>
  )
}
