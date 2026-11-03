export default function Cargando() {
  return (
    <div aria-busy="true" aria-label="Cargando" style={{ display: "grid", gap: 14 }}>
      <div style={{ height: 34, width: "42%", borderRadius: 10, background: "var(--pc-linea, #e2e5ea)", opacity: 0.6 }} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 96, borderRadius: 14, background: "var(--pc-linea, #e2e5ea)", opacity: 0.45 }} />)}
      </div>
      <div style={{ height: 260, borderRadius: 14, background: "var(--pc-linea, #e2e5ea)", opacity: 0.35 }} />
    </div>
  )
}
