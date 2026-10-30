"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/** Anotar una decisión o una nota en la bitácora de la campaña. */
export default function Anotar({ campaniaId }: { campaniaId: string }) {
  const [texto, setTexto] = useState("")
  const [tipo, setTipo] = useState<"decision" | "nota">("decision")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function guardar() {
    if (!texto.trim()) return
    setEnviando(true); setError("")
    try {
      const r = await fetch("/api/panel/ads/seguimiento", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ accion: tipo, campania_id: campaniaId, texto }) })
      const j = await r.json().catch(() => ({ ok: false, error: `El servidor respondió ${r.status}` }))
      if (!j.ok) setError(j.error ?? "No se pudo guardar")
      else { setTexto(""); router.refresh() }
    } catch (e: any) { setError(String(e?.message ?? e)) } finally { setEnviando(false) }
  }

  return (
    <div className="pc-row" style={{ marginTop: 10, alignItems: "flex-start" }}>
      <select className="pc-inp" value={tipo} onChange={(e) => setTipo(e.target.value as "decision" | "nota")} style={{ maxWidth: 130 }} aria-label="Tipo">
        <option value="decision">Decisión</option>
        <option value="nota">Nota</option>
      </select>
      <input className="pc-inp" placeholder="Ej.: subimos presupuesto al anuncio DIAGNOSTICO" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardar() }} style={{ flex: "1 1 260px" }} aria-label="Texto" />
      <button className="pc-btn pri" disabled={enviando || !texto.trim()} onClick={guardar}>{enviando ? "Guardando…" : "Anotar"}</button>
      {error && <span className="pc-muted" style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</span>}
    </div>
  )
}
