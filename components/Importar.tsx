"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

/** Importar Excel o CSV: lo lee en el navegador, muestra una vista previa y lo manda en tandas. */
export default function Importar({ ent, ayuda }: { ent: string; ayuda?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [filas, setFilas] = useState<unknown[][] | null>(null)
  const [nombre, setNombre] = useState("")
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const [avance, setAvance] = useState<string | null>(null)
  const router = useRouter()

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setMsg(null)
    const XLSX = await import("xlsx")
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array" })
    // Toma la primera hoja que tenga datos (saltea portadas tipo "Leeme")
    let v: unknown[][] = []
    for (const n of wb.SheetNames) {
      const s = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: false, defval: "" })
      if (s.length > v.length && !/leeme|readme|fuentes|resumen/i.test(n)) v = s
    }
    setFilas(v.filter((r) => r.some((x) => String(x ?? "").trim())))
    setNombre(f.name)
  }

  async function subir() {
    if (!filas) return
    const [h, ...cuerpo] = filas
    const tot = { creados: 0, actualizados: 0, omitidos: 0 }
    for (let i = 0; i < cuerpo.length; i += 800) {
      setAvance(`Importando ${Math.min(i + 800, cuerpo.length)} de ${cuerpo.length}…`)
      const r = await fetch(`/api/importar/${ent}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filas: [h, ...cuerpo.slice(i, i + 800)] }) })
      const j = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))
      if (!j.ok) { setAvance(null); setMsg({ ok: false, t: j.error }); return }
      tot.creados += j.creados; tot.actualizados += j.actualizados; tot.omitidos += j.omitidos
    }
    setAvance(null)
    setMsg({ ok: true, t: `Listo: ${tot.creados} nuevos, ${tot.actualizados} actualizados${tot.omitidos ? `, ${tot.omitidos} omitidos (sin nombre o repetidos)` : ""}.` })
    setFilas(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv,.ods" onChange={leer} className="hidden" />
      <button type="button" onClick={() => ref.current?.click()} className="btn-s py-1.5" title="Subir un Excel o CSV">⬆ Importar</button>
      {filas && (
        <div className="card w-[min(92vw,760px)] text-left flex flex-col gap-3 shadow-lg">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <strong>{nombre} · {Math.max(0, filas.length - 1)} filas</strong>
            <a href={`/api/importar/${ent}`} className="text-xs underline text-[#4A515C]">Descargar plantilla</a>
          </div>
          <div className="overflow-x-auto max-h-56 border border-[#E2E5EA] rounded-xl">
            <table className="tbl text-xs"><tbody>{filas.slice(0, 6).map((r, i) => <tr key={i} className={i === 0 ? "font-semibold bg-[#F5F6F8]" : ""}>{r.slice(0, 10).map((c, j) => <td key={j} className="whitespace-nowrap">{String(c ?? "")}</td>)}</tr>)}</tbody></table>
          </div>
          <p className="m-0 text-xs text-[#4A515C]">{ayuda ?? "Reconozco las columnas por su nombre. Si el registro ya existe, se completa con lo nuevo; si no, se crea."}</p>
          <div className="flex gap-2 items-center"><button type="button" disabled={!!avance} onClick={subir} className="btn-p disabled:opacity-60">{avance ?? "Importar ahora"}</button>{!avance && <button type="button" onClick={() => setFilas(null)} className="btn-s">Cancelar</button>}</div>
        </div>
      )}
      {msg && <p role="status" className={`m-0 text-sm ${msg.ok ? "text-emerald-700" : "text-rojo"}`}>{msg.t}</p>}
    </div>
  )
}
