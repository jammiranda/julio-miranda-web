"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

type Resumen = {
  ok: boolean
  error?: string
  archivos?: { nombre: string; tipo: string; hojas: { hoja: string; tipo: string; filas: number }[]; periodo: { desde: string | null; hasta: string | null }; avisos: string[] }[]
  guardado?: { dias: number; publicaciones: number; demografia: number; seguidores_totales: number | null }
  periodo?: { desde: string | null; hasta: string | null }
  rechazados?: { nombre: string; motivo: string }[]
  avisos?: string[]
}

const TIPO: Record<string, string> = { seguidores: "Seguidores", visitantes: "Visitantes", contenido: "Contenido", desconocido: "No reconocido" }

export default function SubirLinkedin() {
  const [archivos, setArchivos] = useState<File[]>([])
  const [encima, setEncima] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [seg, setSeg] = useState("")
  const [res, setRes] = useState<Resumen | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const sumar = (fs: FileList | null) => { if (fs?.length) setArchivos((a) => [...a, ...Array.from(fs)].filter((f, i, x) => x.findIndex((y) => y.name === f.name && y.size === f.size) === i)) }

  async function enviar() {
    if (!archivos.length && !seg.trim()) return
    setEnviando(true); setRes(null)
    const fd = new FormData()
    archivos.forEach((f) => fd.append("archivos", f, f.name))
    if (seg.trim()) fd.append("seguidores_totales", seg.trim())
    try {
      const r = await fetch("/api/panel/linkedin/importar", { method: "POST", body: fd, credentials: "same-origin" })
      const j: Resumen = await r.json().catch(() => ({ ok: false, error: `El servidor respondió ${r.status}` }))
      setRes(j)
      if (j.ok) { setArchivos([]); setSeg(""); router.refresh() }
    } catch (e: any) {
      setRes({ ok: false, error: String(e?.message ?? e) })
    } finally { setEnviando(false) }
  }

  return (
    <div className="pc-card">
      <div className="pc-ch"><h2>Subir exportación de LinkedIn</h2><a className="pc-btn" href="https://www.linkedin.com/company/devisebit/admin/analytics/followers/" target="_blank" rel="noreferrer">Abrir Analytics de la página</a></div>
      <p className="pc-sub" style={{ marginTop: 0, marginBottom: 12 }}>En LinkedIn: página de DEVISEBIT → Analytics → Seguidores, Visitantes y Contenido → <b>Exportar</b> (rango: el mes). Arrastrá acá los tres archivos. Volver a subir el mismo período actualiza, no duplica.</p>
      <div
        role="button" tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ref.current?.click() } }}
        onDragOver={(e) => { e.preventDefault(); setEncima(true) }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); sumar(e.dataTransfer.files) }}
        style={{ border: `1.5px dashed ${encima ? "var(--red)" : "var(--line2)"}`, background: encima ? "var(--red-soft)" : "var(--panel2)", borderRadius: 10, padding: "26px 14px", textAlign: "center", cursor: "pointer", color: "var(--muted)", fontSize: 13 }}
      >
        <b style={{ color: "var(--fg)" }}>Arrastrá los archivos .xls / .xlsx</b> o tocá para elegirlos
        <input ref={ref} type="file" multiple accept=".xls,.xlsx,.csv,.ods" hidden onChange={(e) => { sumar(e.target.files); e.target.value = "" }} />
      </div>
      {archivos.length > 0 && (
        <div className="pc-list" style={{ marginTop: 10 }}>
          {archivos.map((f, i) => (
            <div key={f.name + i} className="pc-item" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <span className="t">{f.name}</span>
              <span className="pc-row"><span className="pc-muted pc-mono" style={{ fontSize: 11.5 }}>{Math.max(1, Math.round(f.size / 1024))} KB</span><button className="pc-btn" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setArchivos((a) => a.filter((_, j) => j !== i))}>Quitar</button></span>
            </div>
          ))}
        </div>
      )}
      <div className="pc-row" style={{ marginTop: 12, justifyContent: "space-between" }}>
        <label className="pc-row" style={{ fontSize: 12.5, color: "var(--muted)", flex: "1 1 260px" }}>
          Seguidores totales hoy (opcional)
          <input className="pc-inp" inputMode="numeric" placeholder="ej. 1250" value={seg} onChange={(e) => setSeg(e.target.value)} style={{ maxWidth: 140 }} />
        </label>
        <button className="pc-btn pri" disabled={enviando || (!archivos.length && !seg.trim())} onClick={enviar}>{enviando ? "Importando…" : "Importar"}</button>
      </div>
      {res && (
        <div className="pc-note" style={{ marginTop: 12 }} aria-live="polite">
          {res.ok ? (
            <>
              <b>Importación lista.</b> {res.guardado?.dias ?? 0} días, {res.guardado?.publicaciones ?? 0} publicaciones y {res.guardado?.demografia ?? 0} datos de demografía
              {res.periodo?.desde ? ` · del ${res.periodo.desde} al ${res.periodo.hasta}` : ""}.
            </>
          ) : <><b>No se importó nada.</b> {res.error ?? res.avisos?.join(" ")}</>}
          {res.archivos?.map((a) => (
            <div key={a.nombre} style={{ marginTop: 6 }}>
              <span className="pc-mono">{a.nombre}</span> → {TIPO[a.tipo] ?? a.tipo}: {a.hojas.filter((h) => h.tipo !== "ignorada").map((h) => `${h.hoja} (${h.filas})`).join(", ") || "ninguna hoja reconocida"}
              {a.avisos.length ? <span> · {a.avisos.join(" ")}</span> : null}
            </div>
          ))}
          {res.rechazados?.map((r) => <div key={r.nombre} style={{ marginTop: 6 }}><span className="pc-mono">{r.nombre}</span>: {r.motivo}</div>)}
        </div>
      )}
    </div>
  )
}
