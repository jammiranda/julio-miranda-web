"use client"

/** Botón de envío (rojo) que pide confirmación antes de ejecutar la acción del formulario. */
export default function BotonConfirmar({ mensaje, children }: { mensaje: string; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => { if (!window.confirm(mensaje)) e.preventDefault() }}
      className="btn-s w-full !border-red-300 text-red-700 hover:!border-red-600"
    >
      {children}
    </button>
  )
}
