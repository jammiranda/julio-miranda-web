export default function Cargando() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando" style={{ display: "grid", gap: 14 }}>
      <div className="pc-sk" style={{ height: 34, width: "42%" }} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="pc-sk" style={{ height: 104 }} />)}
      </div>
      <div className="pc-sk" style={{ height: 260 }} />
    </div>
  )
}
