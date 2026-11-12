"use client"

/** Si una pantalla del Panel falla (YouTube, Instagram o la base no respondieron), el menú sigue a la vista y se puede reintentar. */
export default function ErrorPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="pc-card" role="alert" style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <h2 style={{ margin: 0 }}>No pudimos cargar esta pantalla</h2>
      <p className="pc-muted" style={{ margin: 0 }}>Puede ser un corte momentáneo de la base o de una red social. Probá de nuevo en unos segundos.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => reset()} className="pc-btn pri">Reintentar</button>
      </div>
      {error.digest && <p className="pc-muted" style={{ margin: 0, fontSize: 12 }}>Código para soporte: {error.digest}</p>}
    </div>
  )
}
