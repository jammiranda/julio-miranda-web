"use client"
import { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"

/**
 * Botón de envío con estado de carga para los server actions (compra e inscripción).
 * Si el formulario tiene más de un botón (p. ej. "Empezá gratis" y "Comprar el curso completo", cada uno con su
 * `formAction`), solo el que se tocó muestra el "cargando". Ojo: React no deja ponerle `name` a un botón con
 * `formAction` función (lo pisa), así que cada opción va con su propio server action.
 */
export default function BotonEnviar({ children, cargando = "Un momento…", className = "", formAction, secundario = false }: {
  children: React.ReactNode; cargando?: string; className?: string; formAction?: (fd: FormData) => void | Promise<void>; secundario?: boolean
}) {
  const { pending } = useFormStatus()
  const [tocado, setTocado] = useState(false)
  useEffect(() => { if (!pending) setTocado(false) }, [pending])
  const mio = pending && tocado
  return (
    <button type="submit" formAction={formAction} onClick={() => setTocado(true)} disabled={pending} aria-busy={mio} className={`${secundario ? "btn-s" : "btn-p"} min-h-[52px] text-base disabled:opacity-70 disabled:cursor-wait ${className}`}>
      {mio ? (
        <>
          <span aria-hidden="true" className={`acad-spin inline-block w-4 h-4 rounded-full border-2 ${secundario ? "border-[#0E1116]/25 border-t-[#0E1116]" : "border-white/40 border-t-white"}`} />
          {cargando}
        </>
      ) : children}
    </button>
  )
}
