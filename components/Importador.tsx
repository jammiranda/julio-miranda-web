"use client"
import { useState } from "react"
import * as XLSX from "xlsx"

type Hoja = { nombre: string; valores: unknown[][] }

export default function Importador() {
  const [hojas, setHojas] = useState<Hoja[]>([])
  const [estado, setEstado] = useState<string>("")
  const [ocupado, setOcupado] = useState(false)

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array" })
    const hs = wb.SheetNames.filter((n) => /^\d{4}-\d{2}$/.test(n.trim())).map((n) => ({ nombre: n.trim(), valores: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: false, defval: "" }) }))
    setHojas(hs)
    setEstado(hs.length ? `Encontré ${hs.length} mes(es): ${hs.map((h) => h.nombre).join(", ")}.` : "No encontré solapas con nombre AAAA-MM (por ejemplo 2026-10).")
  }

  async function subir(h: Hoja) {
    setOcupado(true)
    setEstado(`Importando ${h.nombre}…`)
    const r = await fetch("/api/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periodo: h.nombre, valores: h.valores }) })
    const j = await r.json().catch(() => ({}))
    setOcupado(false)
    setEstado(j.ok ? `${h.nombre}: ${j.filas} pacientes importados (${j.nuevos} nuevos en el sistema).${j.invalidos?.length ? ` Revisar módulo: ${j.invalidos.join("; ")}` : ""}` : `Error: ${j.error ?? r.status}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="file" accept=".xlsx,.xls,.ods" onChange={leer} className="inp" />
      {estado && <p className="m-0 text-sm" role="status">{estado}</p>}
      <div className="flex flex-wrap gap-2">
        {hojas.map((h) => (
          <button key={h.nombre} disabled={ocupado} onClick={() => subir(h)} className="btn-p disabled:opacity-60">Importar {h.nombre}</button>
        ))}
      </div>
    </div>
  )
}
