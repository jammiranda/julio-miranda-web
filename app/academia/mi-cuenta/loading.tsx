/** Espacio del alumno: se muestra al instante al cambiar de pantalla, mientras llegan los cursos o la lección. */
export default function Cargando() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Cargando">
      <div className="esq h-40" />
      <div className="esq h-6 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="esq h-40" />)}</div>
    </div>
  )
}
