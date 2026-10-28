"use client"
import { useFormStatus } from "react-dom"

/** Botón de envío con estado de carga para los server actions (compra e inscripción). */
export default function BotonEnviar({ children, cargando = "Un momento…", className = "" }: { children: React.ReactNode; cargando?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`btn-p min-h-[52px] text-base disabled:opacity-70 disabled:cursor-wait ${className}`}>
      {pending ? (
        <>
          <span aria-hidden="true" className="acad-spin inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white" />
          {cargando}
        </>
      ) : children}
    </button>
  )
}
