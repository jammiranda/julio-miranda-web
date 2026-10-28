"use client"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type Fila = { id: number; nombre: string; organizacion: string | null; email: string | null; telefono: string | null; origen: string | null; etapaN: string; creado: string; sug: string | null; sugN: string | null; sugC: string | null; motivo: string }

/** Bandeja de contactos sin lista: seleccionar y ubicarlos (aceptando la sugerencia o eligiendo la lista). */
export default function ClasificarTabla({ filas, clases, accion, total, filtro }: {
  filas: Fila[]
  clases: { v: string; n: string; d: string }[]
  accion: (fd: FormData) => Promise<void>
  total: number
  filtro: Record<string, string>
}) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [todoFiltro, setTodoFiltro] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const todo = useRef<HTMLInputElement>(null)
  const ids = useMemo(() => filas.map((f) => f.id), [filas])
  const todos = sel.size > 0 && sel.size === ids.length
  useEffect(() => { if (todo.current) todo.current.indeterminate = sel.size > 0 && !todos }, [sel, todos])
  useEffect(() => { setSel(new Set()); setTodoFiltro(false) }, [ids])
  const alternar = (id: number) => { setTodoFiltro(false); setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  const cant = todoFiltro ? total : sel.size

  function confirmar(e: React.FormEvent<HTMLFormElement>) {
    const sub = (e.nativeEvent as SubmitEvent).submitter
    const op = sub?.getAttribute("value") ?? ""
    const destino = op === "sugerencia" ? "la lista sugerida de cada uno" : `«${clases.find((c) => `mover:${c.v}` === op)?.n ?? ""}»`
    if (cant > 50 && !window.confirm(`¿Ubicar ${cant} contactos en ${destino}?`)) { e.preventDefault(); return }
    setEnviando(true)
  }

  return (
    <>
      {sel.size > 0 && (
        <form action={accion} onSubmit={confirmar} className="sticky top-[104px] z-10 flex flex-col gap-2 px-5 py-3 border-b border-[#E2E5EA] bg-[#FDECEB]">
          <input type="hidden" name="ids" value={todoFiltro ? "" : Array.from(sel).join(",")} />
          <input type="hidden" name="alcance" value={todoFiltro ? "filtro" : "sel"} />
          {Object.entries(filtro).map(([k, v]) => <input key={k} type="hidden" name={`f_${k}`} value={v} />)}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <strong>{cant} seleccionado{cant === 1 ? "" : "s"}</strong>
            {todos && total > ids.length && !todoFiltro && <button type="button" onClick={() => setTodoFiltro(true)} className="underline">Elegir los {total} que coinciden con el filtro</button>}
            {todoFiltro && <button type="button" onClick={() => setTodoFiltro(false)} className="underline">Solo los {ids.length} de esta página</button>}
            <button type="button" onClick={() => { setSel(new Set()); setTodoFiltro(false) }} className="underline text-[#4A515C] ml-auto">Cancelar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button name="op" value="sugerencia" disabled={enviando} className="btn-p py-1.5">✓ Aceptar sugerencias</button>
            <span className="self-center text-xs text-[#4A515C]">o mover a:</span>
            {clases.map((c) => <button key={c.v} name="op" value={`mover:${c.v}`} disabled={enviando} title={c.d} className={`btn-s py-1.5 ${c.v === "descartado" ? "!border-red-300 text-red-700" : ""}`}>{c.n}</button>)}
          </div>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr>
            <th className="w-10"><input ref={todo} type="checkbox" checked={todos} onChange={() => { setTodoFiltro(false); setSel(todos ? new Set() : new Set(ids)) }} aria-label="Seleccionar todos los de esta página" className="w-4 h-4 accent-[#C8231F]" /></th>
            <th>Contacto</th><th>Origen</th><th>Sugerencia</th><th><span className="sr-only">Acciones</span></th>
          </tr></thead>
          <tbody>
            {filas.map((c) => (
              <tr key={c.id} className={sel.has(c.id) ? "bg-[#FDF3F2]" : "hover:bg-[#F8F9FB]"}>
                <td><input type="checkbox" checked={sel.has(c.id)} onChange={() => alternar(c.id)} aria-label={`Seleccionar ${c.organizacion ?? c.nombre}`} className="w-4 h-4 accent-[#C8231F]" /></td>
                <td><Link href={`/contactos/${c.id}`} className="font-semibold hover:underline">{c.organizacion ? `${c.organizacion} · ` : ""}{c.nombre}</Link><span className="block text-xs text-[#4A515C]">{[c.email, c.telefono].filter(Boolean).join(" · ") || "Sin email ni teléfono"}</span></td>
                <td className="text-xs">{c.origen ?? "—"}<span className="block text-[#4A515C]">{c.etapaN} · {c.creado}</span></td>
                <td>{c.sugN ? <span className={`chip ${c.sugC}`}>{c.sugN}</span> : <span className="text-xs text-[#4A515C]">—</span>}<span className="block text-xs text-[#4A515C] mt-1">{c.motivo}</span></td>
                <td>
                  {c.sug && (
                    <form action={accion} className="flex justify-end">
                      <input type="hidden" name="ids" value={c.id} /><input type="hidden" name="alcance" value="sel" />
                      <button name="op" value={`mover:${c.sug}`} className="btn-s py-1 px-2 text-xs whitespace-nowrap" title={`Mover a ${c.sugN}`}>✓ {c.sugN}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {!filas.length && <tr><td colSpan={5} className="text-center text-[#4A515C] py-8">🎉 No queda nada por clasificar con este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
