/**
 * Proyectos y soluciones en producción, en una fila quieta (sin movimiento automático).
 * Cada ítem lleva su contexto: el tipo de solución y el nombre del proyecto.
 */
export default function CintaProyectos({ etiqueta, items, oscura = true }: { etiqueta: string; items: [string, string][]; oscura?: boolean }) {
  return (
    <div className={"border-t " + (oscura ? "border-white/10 bg-[#0B0D12] text-white" : "border-black/10 bg-white text-[#0E1116]")} role="region" aria-label={etiqueta}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <span className="flex items-center gap-2 text-[13px] font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#5BE08A]" aria-hidden="true" />{etiqueta}
        </span>
        <ul className="m-0 p-0 list-none flex flex-wrap items-center gap-x-8 gap-y-2">
          {items.map(([tipo, nombre]) => (
            <li key={tipo + nombre} className="flex items-center gap-2 text-[13px]">
              <span className={oscura ? "text-[#C3C8D1]" : "text-[#4A515C]"}>{tipo}</span>
              <strong className={oscura ? "text-white font-semibold" : "text-[#0E1116] font-semibold"}>{nombre}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
