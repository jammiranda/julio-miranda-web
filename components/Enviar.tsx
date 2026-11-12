"use client"
import { useFormStatus } from "react-dom"

/**
 * Botón de envío para formularios con server action: mientras se envía queda deshabilitado (evita el doble envío)
 * y muestra un indicador. Usa las mismas clases que cualquier otro botón (`btn-p`, `btn-s`…).
 */
export default function Enviar({ children, cargando = "Enviando…", className = "btn-p" }: { children: React.ReactNode; cargando?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:opacity-70 disabled:cursor-wait`}>
      {pending ? (
        <>
          <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent opacity-80" style={{ animation: "acad-giro .8s linear infinite" }} />
          {cargando}
        </>
      ) : children}
    </button>
  )
}
