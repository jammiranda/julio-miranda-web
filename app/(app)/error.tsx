"use client"

/** Si una pantalla falla (la base o un servicio externo no respondió), el menú sigue a la vista y se puede reintentar. */
export default function ErrorPantalla({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card flex flex-col gap-3 max-w-xl" role="alert">
      <h1 className="m-0 text-xl">No pudimos cargar esta pantalla</h1>
      <p className="m-0 text-sm text-[#4A515C]">Puede ser un corte momentáneo de la base o de un servicio externo. Tus datos no se perdieron: probá de nuevo en unos segundos.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => reset()} className="btn-p">Reintentar</button>
        <a href="/" className="btn-s">Ir al inicio</a>
      </div>
      {error.digest && <p className="m-0 text-xs text-[#4A515C]">Código para soporte: {error.digest}</p>}
    </div>
  )
}
