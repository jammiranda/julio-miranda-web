/** Se muestra al instante al cambiar de pantalla, mientras llegan los datos. */
export default function Cargando() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Cargando">
      <div className="esq h-8 w-56" />
      <div className="esq h-4 w-[min(100%,520px)]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="esq h-20" />)}</div>
      <div className="esq h-64" />
    </div>
  )
}
