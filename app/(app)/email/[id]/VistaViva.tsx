"use client"
import { useEffect, useRef, useState } from "react"
import { emailConEstilo } from "@/lib/email-estilos"

type Estado = "listo" | "guardando" | "guardado" | "error"
const TEXTO: Record<Estado, string> = { listo: "Se guarda solo mientras escribís", guardando: "Guardando…", guardado: "Borrador guardado", error: "No se pudo guardar" }
const txt = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null

/** Vista previa que se arma mientras se escribe (sin ir al servidor) y borrador que se guarda solo. Va dentro del formulario de la campaña. */
export default function VistaViva({ inicial, nombre, autoguardar, editable }: { inicial: string; nombre: string; autoguardar: (fd: FormData) => Promise<void>; editable: boolean }) {
  const caja = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState(inicial)
  const [e, setE] = useState<Estado>("listo")
  useEffect(() => {
    const f = caja.current?.closest("form")
    if (!f || !editable) return
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>
    const cambio = () => {
      clearTimeout(t1)
      t1 = setTimeout(() => {
        const fd = new FormData(f)
        setHtml(emailConEstilo(String(fd.get("contenido") ?? ""), { estilo: txt(fd.get("estilo")), portada: txt(fd.get("portada")), preheader: txt(fd.get("preheader")), nombre, baja: "#" }))
      }, 200)
      clearTimeout(t2)
      t2 = setTimeout(async () => {
        setE("guardando")
        try { await autoguardar(new FormData(f)); setE("guardado") } catch { setE("error") }
      }, 1500)
    }
    f.addEventListener("input", cambio)
    f.addEventListener("change", cambio)
    return () => { f.removeEventListener("input", cambio); f.removeEventListener("change", cambio); clearTimeout(t1); clearTimeout(t2) }
  }, [autoguardar, editable, nombre])
  return (
    <div ref={caja} className="flex flex-col gap-3 lg:sticky lg:top-32">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow">Vista previa en vivo</span>
        {editable && <span className="guardado" data-e={e === "guardado" ? "listo" : e} role="status" aria-live="polite">{TEXTO[e]}</span>}
      </div>
      <iframe title="Vista previa del email" srcDoc={html} className="w-full h-[720px] rounded-2xl border border-[var(--borde)] bg-white" />
    </div>
  )
}
