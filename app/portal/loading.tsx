/** Mi cuenta: se muestra al instante al cambiar de sección, mientras llegan los datos (el menú queda a la vista). */
export default function Cargando() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Cargando">
      <div className="esq h-8 w-48" />
      <div className="esq h-4 w-[min(100%,420px)]" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="esq h-24" />)}</div>
      <div className="esq h-56" />
    </div>
  )
}
