"use client"

/** Botón rojo que pide confirmación antes de ejecutar. Con `accion` usa esa acción del servidor (sin validar el resto del formulario). Con `clase` conserva el aspecto del botón o link que reemplaza. */
export default function BotonConfirmar({ mensaje, children, accion, chico, clase, etiqueta }: { mensaje: string; children: React.ReactNode; accion?: (fd: FormData) => Promise<void>; chico?: boolean; clase?: string; etiqueta?: string }) {
  return (
    <button
      type={accion ? "submit" : undefined}
      formAction={accion}
      formNoValidate={!!accion}
      onClick={(e) => { if (!window.confirm(mensaje)) e.preventDefault() }}
      aria-label={etiqueta}
      className={clase ?? `btn-s !border-red-300 text-red-700 hover:!border-red-600 ${chico ? "py-1.5 px-3 text-xs" : "w-full"}`}
    >
      {children}
    </button>
  )
}
