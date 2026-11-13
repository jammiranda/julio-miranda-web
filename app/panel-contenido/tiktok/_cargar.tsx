"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

type Fila = { link: string; fecha: string; texto: string; vistas: string; me_gusta: string; comentarios: string; compartidos: string }
type Res = { ok: boolean; error?: string; cuenta?: { dia: string; seguidores: number | null; me_gusta: number | null } | null; videos?: number; avisos?: string[] }
const VACIA: Fila = { link: "", fecha: "", texto: "", vistas: "", me_gusta: "", comentarios: "", compartidos: "" }
const NUMS: [keyof Fila, string][] = [["vistas", "Reproducciones"], ["me_gusta", "Me gusta"], ["comentarios", "Comentarios"], ["compartidos", "Compartidos"]]

/** Carga a mano de TikTok: números de la cuenta, videos uno por uno y, si se prefiere, una planilla con varios videos. */
export default function CargarTikTok({ hoy, perfil }: { hoy: string; perfil: string }) {
  const [dia, setDia] = useState(hoy)
  const [seg, setSeg] = useState("")
  const [mg, setMg] = useState("")
  const [filas, setFilas] = useState<Fila[]>([{ ...VACIA }])
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [res, setRes] = useState<Res | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const cambiar = (i: number, k: keyof Fila, v: string) => setFilas((a) => a.map((f, j) => (j === i ? { ...f, [k]: v } : f)))
  const conLink = filas.filter((f) => f.link.trim())
  const sinLink = filas.filter((f) => !f.link.trim() && Object.values(f).some((v) => v.trim())).length
  const hayAlgo = !!seg.trim() || !!mg.trim() || conLink.length > 0 || !!archivo

  async function enviar() {
    if (!hayAlgo) return
    setEnviando(true); setRes(null)
    const fd = new FormData()
    fd.append("dia", dia)
    if (seg.trim()) fd.append("seguidores", seg.trim())
    if (mg.trim()) fd.append("me_gusta", mg.trim())
    if (conLink.length) fd.append("videos", JSON.stringify(conLink))
    if (archivo) fd.append("archivo", archivo, archivo.name)
    try {
      const r = await fetch("/api/panel/tiktok", { method: "POST", body: fd, credentials: "same-origin" })
      const j: Res = await r.json().catch(() => ({ ok: false, error: `El servidor respondió ${r.status}` }))
      setRes(j)
      if (j.ok) { setSeg(""); setMg(""); setFilas([{ ...VACIA }]); setArchivo(null); router.refresh() }
    } catch (e: any) { setRes({ ok: false, error: String(e?.message ?? e) }) } finally { setEnviando(false) }
  }

  return (
    <div className="pc-card" id="cargar">
      <div className="pc-ch"><h2>Cargar datos de TikTok</h2><a className="pc-btn" href={perfil} target="_blank" rel="noreferrer">Abrir el perfil</a></div>
      <p className="pc-sub" style={{ marginTop: 0, marginBottom: 14 }}>TikTok no tiene conexión automática con el panel, así que los números se copian a mano. Abrí el perfil: arriba están los <b>seguidores</b> y los <b>me gusta</b> de la cuenta. Para cada video, abrilo, copiá el link y los números que muestra. Completá solo lo que tengas: lo que quede vacío no se guarda como cero.</p>

      <div className="pc-k" style={{ marginBottom: 8 }}>1 · Números de la cuenta</div>
      <div className="pc-row" style={{ gap: 12, alignItems: "flex-end" }}>
        <label className="pc-lbl" style={{ flex: "0 1 170px" }}>Fecha del dato<input className="pc-inp" type="date" value={dia} max={hoy} onChange={(e) => setDia(e.target.value)} /></label>
        <label className="pc-lbl" style={{ flex: "0 1 170px" }}>Seguidores<input className="pc-inp" inputMode="numeric" placeholder="como figura en el perfil" value={seg} onChange={(e) => setSeg(e.target.value)} /></label>
        <label className="pc-lbl" style={{ flex: "0 1 170px" }}>Me gusta de la cuenta<input className="pc-inp" inputMode="numeric" placeholder="como figura en el perfil" value={mg} onChange={(e) => setMg(e.target.value)} /></label>
      </div>

      <div className="pc-k" style={{ margin: "20px 0 8px" }}>2 · Videos</div>
      {filas.map((f, i) => (
        <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : undefined, padding: i ? "12px 0 0" : 0, marginBottom: 12 }}>
          <div className="pc-row" style={{ gap: 12, alignItems: "flex-end" }}>
            <label className="pc-lbl" style={{ flex: "2 1 320px" }}>Link del video<input className="pc-inp" type="url" placeholder="https://www.tiktok.com/@devisebit/video/…" value={f.link} onChange={(e) => cambiar(i, "link", e.target.value)} /></label>
            <label className="pc-lbl" style={{ flex: "0 1 170px" }}>Fecha de publicación<input className="pc-inp" type="date" max={hoy} value={f.fecha} onChange={(e) => cambiar(i, "fecha", e.target.value)} /></label>
            <label className="pc-lbl" style={{ flex: "3 1 320px" }}>Título o descripción<input className="pc-inp" value={f.texto} maxLength={300} onChange={(e) => cambiar(i, "texto", e.target.value)} /></label>
          </div>
          <div className="pc-row" style={{ gap: 12, alignItems: "flex-end", marginTop: 10 }}>
            {NUMS.map(([k, t]) => <label key={k} className="pc-lbl" style={{ flex: "1 1 120px" }}>{t}<input className="pc-inp" inputMode="numeric" value={f[k]} onChange={(e) => cambiar(i, k, e.target.value)} /></label>)}
            {filas.length > 1 && <button type="button" className="pc-btn" onClick={() => setFilas((a) => a.filter((_, j) => j !== i))}>Quitar</button>}
          </div>
        </div>
      ))}
      <div className="pc-row" style={{ gap: 8 }}>
        <button type="button" className="pc-btn" onClick={() => setFilas((a) => [...a, { ...VACIA }])}>Agregar otro video</button>
        <button type="button" className="pc-btn" onClick={() => ref.current?.click()}>{archivo ? archivo.name : "O subir una planilla con varios videos"}</button>
        {archivo && <button type="button" className="pc-btn" onClick={() => setArchivo(null)}>Quitar planilla</button>}
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); e.target.value = "" }} />
      </div>
      <p className="pc-sub" style={{ marginTop: 10 }}>Si no cargás la fecha, se usa la que trae el propio link del video. La planilla (.xlsx o .csv) lleva un video por renglón, con estos encabezados: <b>Link, Fecha, Descripción, Reproducciones, Me gusta, Comentarios, Compartidos</b>. Volver a cargar un video con el mismo link actualiza sus números, no lo duplica.</p>

      <div className="pc-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
        <span className="pc-muted" style={{ fontSize: 12.5 }}>{sinLink ? `Hay ${sinLink} video${sinLink === 1 ? "" : "s"} sin link: sin el link no se puede${sinLink === 1 ? "" : "n"} guardar.` : ""}</span>
        <button type="button" className="pc-btn pri" disabled={enviando || !hayAlgo} onClick={enviar}>{enviando ? "Guardando…" : "Guardar"}</button>
      </div>
      {res && (
        <div className="pc-note" style={{ marginTop: 12 }} aria-live="polite">
          {res.ok ? (
            <><b>Guardado.</b> {res.cuenta ? `Números de la cuenta del ${res.cuenta.dia.split("-").reverse().join("/")}` : "Sin números de la cuenta"} · {res.videos ?? 0} video{res.videos === 1 ? "" : "s"}.</>
          ) : <><b>No se guardó nada.</b> {res.error}</>}
          {res.ok && res.avisos?.map((a, i) => <div key={i} style={{ marginTop: 6 }}>{a}</div>)}
        </div>
      )}
    </div>
  )
}
