"use client"
import { useRef, useState } from "react"

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
  const guardar = async () => {
    const f = form.current
    if (!f || !f.reportValidity()) return
    setE("guardando")
    try { await accion(new FormData(f)); setE("guardado") } catch { setE("error") }
  }
  return (
    <form ref={form} className={className} onInput={() => setE("pendiente")} onChange={guardar} onSubmit={(ev) => { ev.preventDefault(); guardar() }}>
      {children}
      <div className="flex flex-wrap items-center gap-3 min-h-[44px]">
        <span className="guardado" data-e={e === "guardado" ? "listo" : e === "pendiente" ? "guardando" : e} role="status" aria-live="polite">{TEXTO[e]}</span>
        {(e === "pendiente" || e === "error") && <button className="btn-p py-1.5 px-3 text-sm">Guardar ahora</button>}
      </div>
    </form>
  )
}
