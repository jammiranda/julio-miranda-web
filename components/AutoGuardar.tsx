"use client"
import { useEffect, useRef, useState } from "react"

type Estado = "listo" | "guardando" | "guardado" | "error"
const TEXTO: Record<Estado, string> = { listo: "Los cambios se guardan solos", guardando: "Guardando…", guardado: "Guardado", error: "No se pudo guardar. Revisá la conexión y volvé a escribir." }

/**
 * Formulario que se guarda solo: al dejar de escribir llama a la acción del servidor, sin botón ni recarga.
 * La acción no debe redirigir (solo guardar y revalidar).
 */
export default function AutoGuardar({ accion, children, className, espera = 700 }: { accion: (fd: FormData) => Promise<unknown>; children: React.ReactNode; className?: string; espera?: number }) {
  const form = useRef<HTMLFormElement>(null)
  const reloj = useRef<ReturnType<typeof setTimeout>>()
  const [e, setE] = useState<Estado>("listo")
  const guardar = (ya = false) => {
    clearTimeout(reloj.current)
    reloj.current = setTimeout(async () => {
      const f = form.current
      if (!f || !f.checkValidity()) return
      setE("guardando")
      try { await accion(new FormData(f)); setE("guardado") } catch { setE("error") }
    }, ya ? 0 : espera)
  }
  useEffect(() => () => clearTimeout(reloj.current), [])
  return (
    <form ref={form} className={className} onInput={() => guardar()} onChange={() => guardar()} onSubmit={(ev) => { ev.preventDefault(); guardar(true) }}>
      {children}
      <span className="guardado" data-e={e === "guardado" ? "listo" : e} role="status" aria-live="polite">{TEXTO[e]}</span>
    </form>
  )
}
