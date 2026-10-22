"use client"
import { useRef, useState } from "react"

type Sug = { fecha: string | null; tipo: string; profesional: string | null; texto: string; resumen?: Record<string, string | null>; legible?: boolean }
const TIPOS: [string, string][] = [["ingreso", "Ingreso / valoración inicial"], ["evolucion", "Evolución"], ["indicacion", "Indicación médica"], ["estudio", "Estudio / laboratorio"], ["interconsulta", "Interconsulta"], ["epicrisis", "Epicrisis / alta"], ["nota", "Nota"]]
const RES: [string, string][] = [["diagnostico", "Diagnóstico"], ["antecedentes", "Antecedentes"], ["alergias", "Alergias"], ["medicacion", "Medicación habitual"]]

async function achicar(f: File): Promise<Blob> {
  if (!f.type.startsWith("image/") || f.size < 1.5e6) return f
  const img = await createImageBitmap(f)
  const k = Math.min(1, 2200 / Math.max(img.width, img.height))
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((r) => c.toBlob((b) => r(b ?? f), "image/jpeg", 0.85))
}

/** Subir foto o PDF de un documento clínico → la IA lo transcribe → se revisa y se guarda como registro. */
export default function SubirDocumento({ paciente, accion, ia, hoy, profesional }: { paciente: number; accion: (fd: FormData) => void; ia: boolean; hoy: string; profesional: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<"" | "subiendo" | "listo">("")
  const [err, setErr] = useState("")
  const [adj, setAdj] = useState<number | null>(null)
  const [sug, setSug] = useState<Sug | null>(null)
  const [vista, setVista] = useState<string | null>(null)

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setErr(""); setSug(null); setAdj(null); setEstado("subiendo")
    const blob = await achicar(f)
    setVista(f.type.startsWith("image/") ? URL.createObjectURL(blob) : null)
    const fd = new FormData()
    fd.append("paciente", String(paciente))
    fd.append("archivo", new File([blob], blob === f ? f.name : f.name.replace(/\.\w+$/, "") + ".jpg", { type: blob === f ? f.type : "image/jpeg" }))
    const r = await fetch("/api/hc/leer", { method: "POST", body: fd })
    const j = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))
    if (!j.ok) { setErr(j.error); setEstado(""); return }
    setAdj(j.adjunto)
    setSug(j.sugerido ?? { fecha: hoy, tipo: "nota", profesional: profesional || null, texto: "" })
    if (j.error) setErr(`Se guardó el documento, pero la IA no pudo leerlo (${j.error}). Transcribilo a mano.`)
    setEstado("listo")
  }

  const resumen = sug?.resumen ? RES.filter(([k]) => sug.resumen?.[k]) : []
  return (
    <div className="flex flex-col gap-3">
      <input ref={ref} type="file" accept="image/*,application/pdf" onChange={elegir} className="hidden" />
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={() => ref.current?.click()} disabled={estado === "subiendo"} className="btn-p disabled:opacity-60">
          {estado === "subiendo" ? (ia ? "Leyendo el documento…" : "Subiendo…") : "📷 Subir foto o PDF"}
        </button>
        <span className="text-xs text-[#4F5C69]">{ia ? "La IA transcribe el documento; vos lo revisás antes de guardarlo." : "El documento queda guardado en la historia. La lectura automática con IA se activa cuando se configure."}</span>
      </div>
      {err && <p role="alert" className="m-0 text-sm text-rojo">{err}</p>}
      {sug && adj && (
        <form action={accion} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {vista && <img src={vista} alt="Documento subido" className="lg:col-span-2 w-full rounded-xl border border-[#E1E6E3] max-h-[520px] object-contain bg-[#F3F5F4]" />}
          <div className={`${vista ? "lg:col-span-3" : "lg:col-span-5"} grid grid-cols-1 md:grid-cols-3 gap-3 content-start`}>
            <input type="hidden" name="id" value={paciente} /><input type="hidden" name="adjunto" value={adj} />
            {sug.legible === false && <p className="m-0 md:col-span-3 text-sm text-amber-700">La IA marcó partes poco legibles: revisá con atención.</p>}
            <label className="lbl">Tipo<select name="tipo" defaultValue={sug.tipo} className="inp">{TIPOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
            <label className="lbl">Fecha<input name="fecha" type="date" defaultValue={sug.fecha ?? hoy} className="inp" /></label>
            <label className="lbl">Profesional<input name="profesional" defaultValue={sug.profesional ?? profesional} className="inp" /></label>
            <label className="lbl md:col-span-3">Transcripción (revisala)<textarea name="texto" required rows={10} defaultValue={sug.texto} className="inp font-[inherit]" /></label>
            {resumen.length > 0 && (
              <fieldset className="md:col-span-3 border border-[#E1E6E3] rounded-xl p-3 flex flex-col gap-2">
                <legend className="text-sm font-semibold px-1">La IA encontró datos para el resumen clínico</legend>
                {resumen.map(([k, n]) => <label key={k} className="lbl">{n}<input name={`r_${k}`} defaultValue={sug.resumen?.[k] ?? ""} className="inp" /></label>)}
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="aplicar_resumen" /> Agregarlos al resumen clínico</label>
              </fieldset>
            )}
            <div className="md:col-span-3 flex gap-2"><button className="btn-p">Guardar en la historia clínica</button><button type="button" onClick={() => { setSug(null); setAdj(null); setVista(null) }} className="btn-s">Descartar</button></div>
          </div>
        </form>
      )}
    </div>
  )
}
