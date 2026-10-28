"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type Fila = {
  id: number; organizacion: string | null; nombre: string; cargo: string | null; email: string | null; telefono: string | null
  etapa: string; etapaN: string; etapaC: string; sector: string | null; proximo: string | null; proximoF: string | null; proyectos: number
  claseN?: string | null; claseC?: string | null
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
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr>
            {editar && <th className="w-10"><input ref={todo} type="checkbox" checked={todos} onChange={alternarTodos} aria-label="Seleccionar todos los contactos de la lista" className="w-4 h-4 accent-[#C8231F]" /></th>}
            <th>Organización</th><th>Contacto</th><th>Etapa</th><th>Sector</th><th>Próximo paso</th><th>Proyectos</th><th></th>
          </tr></thead>
          <tbody>
            {filas.map((c) => (
              <tr key={c.id} className={sel.has(c.id) ? "bg-[#FDF3F2]" : "hover:bg-[#F8F9FB]"}>
                {editar && <td><input type="checkbox" checked={sel.has(c.id)} onChange={() => alternar(c.id)} aria-label={`Seleccionar ${c.organizacion ?? c.nombre}`} className="w-4 h-4 accent-[#C8231F]" /></td>}
                <td className="font-semibold"><Link href={`/contactos/${c.id}`} className="hover:underline">{c.organizacion ?? "—"}</Link></td>
                <td>{c.nombre}<div className="text-xs text-[#4A515C]">{[c.cargo, c.email, c.telefono].filter(Boolean).join(" · ")}</div></td>
                <td><span className={`chip ${c.etapaC}`}>{c.etapaN}</span>{c.claseN && <span className={`chip ${c.claseC} block w-fit mt-1`}>{c.claseN}</span>}</td>
                <td>{c.sector ?? "—"}</td>
                <td>{c.proximo ?? "—"}{c.proximoF && <div className="text-xs text-[#4A515C]">{c.proximoF}</div>}</td>
                <td>{c.proyectos || "—"}</td>
                <td><Link href={`/contactos/${c.id}`} className="btn-s py-1 px-3 text-xs">Abrir</Link></td>
              </tr>
            ))}
            {!filas.length && <tr><td colSpan={editar ? 8 : 7} className="text-center text-[#4A515C] py-6">No hay contactos con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
