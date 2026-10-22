"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

/** Botones Exportar / Importar para cualquier módulo. Lee Excel o CSV en el navegador y lo manda al servidor. */
export default function BarraDatos({ ent, importa = true, exporta = true, etiqueta = "" }: { ent: string; importa?: boolean; exporta?: boolean; etiqueta?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [filas, setFilas] = useState<unknown[][] | null>(null)
  const [nombre, setNombre] = useState("")
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const router = useRouter()

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setMsg(null)
    const XLSX = await import("xlsx")
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array", cellDates: false })
    const hoja = wb.Sheets[wb.SheetNames[0]]
    const v = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, defval: "" })
    setFilas(v)
    setNombre(f.name)
    e.target.value = ""
  }

  async function subir() {
    if (!filas) return
    setOcupado(true)
    const r = await fetch(`/api/datos/${ent}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filas }) })
    const j = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))
    setOcupado(false)
    if (j.ok) {
      setMsg({ ok: true, t: `Listo: ${j.creados} nuevos, ${j.actualizados} actualizados${j.omitidos ? `, ${j.omitidos} omitidos` : ""}.${j.errores?.length ? " " + j.errores.slice(0, 3).join(" · ") : ""}` })
      setFilas(null)
      router.refresh()
    } else setMsg({ ok: false, t: j.error })
  }

  const vista = filas?.filter((r) => r.some((x) => String(x ?? "").trim())).slice(0, 6) ?? []
  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex flex-wrap gap-2 justify-end">
        {importa && (
          <>
            <input ref={ref} type="file" accept=".xlsx,.xls,.csv,.ods" onChange={leer} className="hidden" />
            <button type="button" onClick={() => ref.current?.click()} className="btn-s py-2" title="Subir un Excel o CSV">⬆ Importar{etiqueta && ` ${etiqueta}`}</button>
          </>
        )}
        {exporta && <a href={`/api/datos/${ent}`} className="btn-s py-2" title="Descargar en Excel (CSV)">⬇ Exportar{etiqueta && ` ${etiqueta}`}</a>}
      </div>
      {filas && (
        <div className="card w-full max-w-3xl text-left flex flex-col gap-3 shadow-lg">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <strong>{nombre} · {Math.max(0, filas.filter((r) => r.some((x) => String(x ?? "").trim())).length - 1)} filas</strong>
            <a href={`/api/datos/${ent}?plantilla=1`} className="text-xs underline text-[#4F5C69]">Descargar plantilla con las columnas</a>
          </div>
          <div className="overflow-x-auto max-h-56 border border-[#E1E6E3] rounded-xl">
            <table className="tbl text-xs"><tbody>{vista.map((r, i) => <tr key={i} className={i === 0 ? "font-semibold bg-[#F3F5F4]" : ""}>{r.slice(0, 10).map((c, j) => <td key={j} className="whitespace-nowrap">{String(c ?? "")}</td>)}</tr>)}</tbody></table>
          </div>
          <p className="m-0 text-xs text-[#4F5C69]">Reconozco las columnas por su nombre. Si el registro ya existe (mismo DNI o nombre), se actualiza; si no, se crea.</p>
          <div className="flex gap-2"><button type="button" disabled={ocupado} onClick={subir} className="btn-p disabled:opacity-60">{ocupado ? "Importando…" : "Importar ahora"}</button><button type="button" onClick={() => setFilas(null)} className="btn-s">Cancelar</button></div>
        </div>
      )}
      {msg && <p role="status" className={`m-0 text-sm ${msg.ok ? "text-[#0B5E31]" : "text-rojo"}`}>{msg.t}</p>}
    </div>
  )
}
