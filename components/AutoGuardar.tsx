"use client"
import { useEffect, useRef, useState } from "react"

type Estado = "listo" | "pendiente" | "guardando" | "guardado" | "error"
const TEXTO: Record<Estado, string> = {
  listo: "Los cambios se guardan solos al salir de cada campo",
  pendiente: "Cambios sin guardar",
  guardando: "Guardando…",
  guardado: "Guardado",
  error: "No se pudo guardar. Revisá la conexión y probá de nuevo.",
}

/**
 * Formulario que se guarda solo, sin recargar la pantalla. Guarda cuando se termina un campo (al salir de él, al elegir una
 * opción o con Enter), nunca a mitad de escritura: así un precio a medio tipear no llega a la lista pública ni al bot.
 * La acción no debe redirigir (solo guardar y revalidar).
 */
export default function AutoGuardar({ accion, children, className }: { accion: (fd: FormData) => Promise<unknown>; children: React.ReactNode; className?: string }) {
  const form = useRef<HTMLFormElement>(null)
  const [e, setE] = useState<Estado>("listo")
  const sucio = useRef(false)
  const ref = useRef(accion)
  ref.current = accion
  const guardar = async () => {
    const f = form.current
    if (!f || !sucio.current || !f.reportValidity()) return
    sucio.current = false
    setE("guardando")
    try { await ref.current(new FormData(f)); setE(sucio.current ? "pendiente" : "guardado") } catch { sucio.current = true; setE("error") }
  }
  // Evento "change" nativo del navegador: en un campo de texto llega al salir del campo, no en cada tecla
  // (el onChange de React se dispara con cada letra, por eso no se usa acá).
  useEffect(() => {
    const f = form.current
    if (!f) return
    const alCambiar = () => { sucio.current = true; guardar() }
    f.addEventListener("change", alCambiar)
    return () => f.removeEventListener("change", alCambiar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <form ref={form} className={className} onInput={() => { sucio.current = true; setE("pendiente") }} onSubmit={(ev) => { ev.preventDefault(); sucio.current = true; guardar() }}>
      {children}
      <div className="flex flex-wrap items-center gap-3 min-h-[44px]">
        <span className="guardado" data-e={e === "guardado" ? "listo" : e === "pendiente" ? "guardando" : e} role="status" aria-live="polite">{TEXTO[e]}</span>
        {(e === "pendiente" || e === "error") && <button className="btn-p py-1.5 px-3 text-sm">Guardar ahora</button>}
      </div>
    </form>
  )
}
