"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

/** Sube la exportación de Analytics del perfil personal de Julio (linkedin.com/analytics/creator/content → Exportar). */
export default function SubirPerfil() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [seg, setSeg] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [res, setRes] = useState<any>(null)
  const ref = useRef<HTMLInputElement>(null)
  const router = useRouter()
  async function enviar() {
    if (!archivo) return
    setEnviando(true); setRes(null)
    const fd = new FormData()
    fd.append("archivo", archivo, archivo.name)
    if (seg.trim()) fd.append("seguidores_totales", seg.trim())
    try {
      const r = await fetch("/api/panel/linkedin/perfil", { method: "POST", body: fd, credentials: "same-origin" })
      const j = await r.json().catch(() => ({ ok: false, error: `El servidor respondió ${r.status}` }))
      setRes(j)
      if (j.ok) { setArchivo(null); setSeg(""); router.refresh() }
    } catch (e: any) { setRes({ ok: false, error: String(e?.message ?? e) }) } finally { setEnviando(false) }
  }
  return (
    <div className="pc-card">
      <div className="pc-ch"><h2>Subir exportación de tu perfil</h2><a className="pc-btn" href="https://www.linkedin.com/analytics/creator/content/" target="_blank" rel="noreferrer">Abrir Analytics del perfil</a></div>
      <p className="pc-sub" style={{ marginTop: 0, marginBottom: 12 }}>En LinkedIn: tu perfil → Analytics → Impresiones de publicaciones → <b>Exportar</b> (elegí 28 o 90 días). Es un .xlsx con impresiones, interacciones, seguidores y tus publicaciones principales. Volver a subir actualiza, no duplica.</p>
      <div className="pc-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button className="pc-btn" onClick={() => ref.current?.click()}>{archivo ? archivo.name : "Elegir archivo .xlsx"}</button>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); e.target.value = "" }} />
        <label className="pc-row" style={{ fontSize: 12.5, color: "var(--muted)" }}>Seguidores hoy (opcional)<input className="pc-inp" inputMode="numeric" value={seg} onChange={(e) => setSeg(e.target.value)} style={{ maxWidth: 120 }} /></label>
        <button className="pc-btn pri" disabled={!archivo || enviando} onClick={enviar}>{enviando ? "Importando…" : "Importar"}</button>
      </div>
      {res && (
        <div className="pc-note" style={{ marginTop: 12 }} aria-live="polite">
          {res.ok ? <b>Importación lista.</b> : <><b>No se importó nada.</b> {res.error}</>}
          {res.resultados?.map((r: any) => <div key={r.nombre} style={{ marginTop: 6 }}><span className="pc-mono">{r.nombre}</span>{r.guardado ? ` → ${r.guardado.dias} días y ${r.guardado.posts} publicaciones${r.desde ? ` (del ${r.desde} al ${r.hasta})` : ""}${r.seguidores != null ? ` · ${r.seguidores} seguidores` : ""}` : ""}{r.avisos?.length ? ` · ${r.avisos.join(" ")}` : ""}</div>)}
        </div>
      )}
    </div>
  )
}
