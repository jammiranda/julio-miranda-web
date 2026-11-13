"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type Fila = {
  id: number; organizacion: string | null; nombre: string; cargo: string | null; email: string | null; telefono: string | null
  etapa: string; etapaN: string; etapaC: string; sector: string | null; proximo: string | null; proximoF: string | null; proyectos: number
  claseN?: string | null; claseC?: string | null; linkedin?: string | null
}

/** Tabla de contactos con selección múltiple: cambiar etapa, sector o próximo paso, o eliminar varios a la vez. */
export default function ContactosTabla({ filas, etapas, sectores, editar, accion, clases = [] }: {
  filas: Fila[]
  clases?: { v: string; n: string }[]
  etapas: { v: string; n: string }[]
  sectores: string[]
  editar: boolean
  accion: (fd: FormData) => Promise<void>
}) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const todo = useRef<HTMLInputElement>(null)
  const ids = useMemo(() => filas.map((f) => f.id), [filas])
  const todos = sel.size > 0 && sel.size === ids.length
  const algunos = sel.size > 0 && !todos

  useEffect(() => { if (todo.current) todo.current.indeterminate = algunos }, [algunos])
  useEffect(() => { setSel(new Set()) }, [ids])

  const alternar = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const alternarTodos = () => setSel(todos ? new Set() : new Set(ids))

  function confirmar(e: React.FormEvent<HTMLFormElement>) {
    const op = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value")
    if (op === "eliminar" && !window.confirm(`¿Eliminar ${sel.size} contacto${sel.size === 1 ? "" : "s"}? Sus proyectos y reuniones quedan, pero sin contacto asociado. No se puede deshacer.`)) { e.preventDefault(); return }
    if (op === "editar") {
      const fd = new FormData(e.currentTarget)
      if (!["clase", "etapa", "sector", "proximo", "proximo_fecha"].some((k) => String(fd.get(k) ?? "").trim())) { e.preventDefault(); window.alert("Elegí al menos un dato para cambiar."); return }
    }
    setEnviando(true)
  }

  return (
    <>
      {editar && sel.size > 0 && (
        <form action={accion} onSubmit={confirmar} className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-[#E2E5EA] bg-[#FDECEB]">
          <input type="hidden" name="ids" value={Array.from(sel).join(",")} />
          <div className="text-sm font-semibold self-center mr-1">{sel.size} seleccionado{sel.size === 1 ? "" : "s"}</div>
          {clases.length > 0 && <label className="text-xs font-semibold flex flex-col gap-1">Mover a lista
            <select name="clase" defaultValue="" className="inp py-1.5 w-40"><option value="">Sin cambios</option>{clases.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}<option value="__ninguna">Volver a «Por clasificar»</option></select>
          </label>}
          <label className="text-xs font-semibold flex flex-col gap-1">Etapa
            <select name="etapa" defaultValue="" className="inp py-1.5 w-40"><option value="">Sin cambios</option>{etapas.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select>
          </label>
          <label className="text-xs font-semibold flex flex-col gap-1">Sector
            <select name="sector" defaultValue="" className="inp py-1.5 w-36"><option value="">Sin cambios</option>{sectores.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </label>
          <label className="text-xs font-semibold flex flex-col gap-1">Próximo paso
            <input name="proximo" placeholder="Sin cambios" className="inp py-1.5 w-48" />
          </label>
          <label className="text-xs font-semibold flex flex-col gap-1">Fecha
            <input name="proximo_fecha" type="date" className="inp py-1.5 w-40" />
          </label>
          <button name="op" value="editar" disabled={enviando} className="btn-p py-1.5">Aplicar cambios</button>
          <button name="op" value="eliminar" disabled={enviando} className="btn-s py-1.5 !border-red-300 text-red-700 hover:!border-red-600">Eliminar</button>
          <button type="button" onClick={() => setSel(new Set())} className="text-sm underline text-[#4A515C] self-center">Cancelar</button>
        </form>
      )}
      <div>
        <table className="tbl tbl-movil table-fixed">
          <colgroup>{editar && <col className="w-11" />}<col /><col className="w-[27%]" /><col className="w-[15%]" /><col className="w-[21%]" /></colgroup>
          <thead><tr>
            {editar && <th><input ref={todo} type="checkbox" checked={todos} onChange={alternarTodos} aria-label="Seleccionar todos los contactos de la lista" className="w-4 h-4 accent-[#C8231F]" /></th>}
            <th>Contacto</th><th>Cómo contactarlo</th><th>Etapa</th><th>Próximo paso</th>
          </tr></thead>
          <tbody>
            {filas.map((c) => {
              const sub = [c.cargo, c.organizacion && c.organizacion !== c.nombre ? c.organizacion : null].filter(Boolean).join(" · ")
              const extra = [c.sector, c.proyectos ? `${c.proyectos} proyecto${c.proyectos === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")
              return (
                <tr key={c.id} className={sel.has(c.id) ? "bg-[#FDF3F2]" : "hover:bg-[#F8F9FB]"}>
                  {editar && <td className="td-sel"><input type="checkbox" checked={sel.has(c.id)} onChange={() => alternar(c.id)} aria-label={`Seleccionar ${c.nombre}`} className="w-4 h-4 accent-[#C8231F]" /></td>}
                  <td className="break-words">
                    <Link href={`/contactos/${c.id}`} className="font-semibold hover:underline">{c.nombre || c.organizacion || "Sin nombre"}</Link>
                    {sub && <div className="text-xs text-[#4A515C]">{sub}</div>}
                    {extra && <div className="text-xs text-[#4A515C]">{extra}</div>}
                  </td>
                  <td className="break-all text-[13px]">
                    {c.email && <a href={`mailto:${c.email}`} className="block hover:underline">{c.email}</a>}
                    {c.telefono && <a href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="block hover:underline">{c.telefono}</a>}
                    {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="block font-semibold text-[var(--ac-texto,#C8231F)] hover:underline break-normal">Perfil de LinkedIn ↗</a>}
                    {!c.email && !c.telefono && !c.linkedin && <span className="text-[#4A515C]">Sin datos</span>}
                  </td>
                  <td><span className={`chip ${c.etapaC}`}>{c.etapaN}</span>{c.claseN && <span className={`chip ${c.claseC} block w-fit mt-1`}>{c.claseN}</span>}</td>
                  <td className="break-words">{c.proximo ?? <span className="text-[#4A515C]">—</span>}{c.proximoF && <div className="text-xs text-[#4A515C]">{c.proximoF}</div>}</td>
                </tr>
              )
            })}
            {!filas.length && <tr><td colSpan={editar ? 5 : 4} className="text-center text-[#4A515C] py-6">No hay contactos con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
