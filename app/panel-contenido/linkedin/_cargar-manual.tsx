"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/** Carga a mano una publicación del perfil personal de Julio (cuando publica directo en LinkedIn). */
export default function CargarManual() {
  const hoy = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10)
  const [url, setUrl] = useState("")
  const [fecha, setFecha] = useState(hoy)
  const [texto, setTexto] = useState("")
  const [imp, setImp] = useState("")
  const [reac, setReac] = useState("")
  const [seg, setSeg] = useState("")
  const [estado, setEstado] = useState<string | null>(null)
  const router = useRouter()
  const num = (s: string) => (s.trim() ? Number(s.replace(/\D/g, "")) || null : null)
  async function guardar() {
    if (!url.trim() && !texto.trim() && !seg.trim()) return
    setEstado("Guardando…")
    const id = (url.match(/urn:li:(?:activity|share|ugcPost):\d+/)?.[0]) ?? (url.trim().replace(/[?#].*$/, "") || `manual:${fecha}:${texto.slice(0, 40)}`)
    const body: any = { red: "linkedin_julio", origen: "carga manual" }
    if (url.trim() || texto.trim()) body.posts = [{ id, fecha: `${fecha}T12:00:00-03:00`, texto: texto.trim(), url: url.trim() || null, impresiones: num(imp), me_gusta: num(reac) }]
    if (seg.trim()) body.filas = [{ dia: hoy, seguidores: num(seg) }]
    try {
      const r = await fetch("/api/panel/redes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" })
      const j = await r.json().catch(() => ({ ok: false }))
      if (j.ok) { setEstado("Listo, cargado."); setUrl(""); setTexto(""); setImp(""); setReac(""); setSeg(""); router.refresh() }
      else setEstado(`No se guardó: ${j.error ?? r.status}`)
    } catch (e: any) { setEstado(`No se guardó: ${e?.message ?? e}`) }
  }
  return (
    <div className="pc-card">
      <div className="pc-ch"><h2>Cargar a mano una publicación</h2></div>
      <p className="pc-sub" style={{ marginTop: 0, marginBottom: 12 }}>Si publicaste directo en LinkedIn, pegá el link (botón ··· → Copiar enlace a la publicación) y listo. Impresiones y reacciones son opcionales; si cargás el mismo link otra vez, se actualizan los números. También la cargan sola las tareas de 9:31, 14:31 y 19:31.</p>
      <div className="pc-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <input className="pc-inp" placeholder="Link de la publicación" value={url} onChange={(e) => setUrl(e.target.value)} style={{ minWidth: 280, flex: 2 }} />
        <input className="pc-inp" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ maxWidth: 150 }} />
        <input className="pc-inp" placeholder="De qué trata (opcional)" value={texto} onChange={(e) => setTexto(e.target.value)} style={{ minWidth: 200, flex: 2 }} />
        <input className="pc-inp" inputMode="numeric" placeholder="Impresiones" value={imp} onChange={(e) => setImp(e.target.value)} style={{ maxWidth: 120 }} />
        <input className="pc-inp" inputMode="numeric" placeholder="Reacciones" value={reac} onChange={(e) => setReac(e.target.value)} style={{ maxWidth: 110 }} />
        <input className="pc-inp" inputMode="numeric" placeholder="Seguidores hoy" value={seg} onChange={(e) => setSeg(e.target.value)} style={{ maxWidth: 130 }} />
        <button className="pc-btn pri" onClick={guardar}>Guardar</button>
      </div>
      {estado && <div className="pc-note" style={{ marginTop: 10 }} aria-live="polite">{estado}</div>}
    </div>
  )
}
