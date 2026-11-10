"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

/** Carga el CSV curado de la Base Tigre: lo lee en el navegador y lo manda en tandas de 1.500 filas. */
function parsear(t: string): string[][] {
  const out: string[][] = []
  let fila: string[] = [], c = "", q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++ } else q = false } else c += ch
    } else if (ch === '"') q = true
    else if (ch === ",") { fila.push(c); c = "" }
    else if (ch === "\n") { fila.push(c.replace(/\r$/, "")); out.push(fila); fila = []; c = "" }
    else c += ch
  }
  if (c !== "" || fila.length) { fila.push(c.replace(/\r$/, "")); out.push(fila) }
  return out
}

export default function BaseTigreCarga() {
  const ref = useRef<HTMLInputElement>(null)
  const [filas, setFilas] = useState<string[][] | null>(null)
  const [nombre, setNombre] = useState("")
  const [avance, setAvance] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const router = useRouter()

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setMsg(null)
    const t = (await f.text()).replace(/^﻿/, "")
    const v = parsear(t).filter((r) => r.some((x) => x.trim()))
    const h = (v[0] ?? []).map((x) => x.trim().toLowerCase())
    if (h[0] !== "email" || h[3] !== "banda") { setMsg({ ok: false, t: "El archivo no tiene el formato esperado (email, nombre, apellido, banda, edad, confianza, tipo_email)." }); return }
    setFilas(v.slice(1)); setNombre(f.name)
  }

  async function subir() {
    if (!filas) return
    const lote = "tigre-" + new Date().toISOString().slice(0, 10)
    const tot = { creados: 0, actualizados: 0, omitidas: 0 }
    const T = 1500
    for (let i = 0; i < filas.length; i += T) {
      setAvance(`Cargando ${Math.min(i + T, filas.length).toLocaleString("es-AR")} de ${filas.length.toLocaleString("es-AR")}…`)
      const r = await fetch("/api/base-tigre/cargar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filas: filas.slice(i, i + T), lote, ultima: i + T >= filas.length }) })
      const j = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))
      if (!j.ok) { setAvance(null); setMsg({ ok: false, t: `${j.error} (se cargaron ${(tot.creados + tot.actualizados).toLocaleString("es-AR")} antes de cortarse; podés repetir: no duplica)` }); return }
      tot.creados += j.creados; tot.actualizados += j.actualizados; tot.omitidas += j.omitidas
    }
    setAvance(null); setFilas(null)
    setMsg({ ok: true, t: `Listo: ${tot.creados.toLocaleString("es-AR")} nuevos, ${tot.actualizados.toLocaleString("es-AR")} actualizados${tot.omitidas ? `, ${tot.omitidas} omitidos (email inválido, banda desconocida o repetido)` : ""}.` })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <input ref={ref} id="base-tigre-archivo" type="file" accept=".csv,text/csv" onChange={leer} className="inp max-w-sm" aria-label="Archivo CSV curado de la Base Tigre" />
      {filas && (
        <div className="flex flex-wrap gap-2 items-center">
          <strong className="text-sm">{nombre} · {filas.length.toLocaleString("es-AR")} filas</strong>
          <button type="button" disabled={!!avance} onClick={subir} className="btn-p disabled:opacity-60">{avance ?? "Cargar ahora"}</button>
          {!avance && <button type="button" onClick={() => setFilas(null)} className="btn-s">Cancelar</button>}
        </div>
      )}
      {msg && <p role="status" className={`m-0 text-sm ${msg.ok ? "text-emerald-700" : "text-rojo"}`}>{msg.t}</p>}
    </div>
  )
}
