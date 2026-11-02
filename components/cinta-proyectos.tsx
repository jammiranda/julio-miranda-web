/** Cinta horizontal que corre sola (solo CSS). Estilo "Currently building" de Synflow, con proyectos y soluciones reales. */
export default function CintaProyectos({ etiqueta, items, oscura = true }: { etiqueta: string; items: [string, string][]; oscura?: boolean }) {
  const fila = (k: string) => (
    <ul key={k} aria-hidden={k === "b" ? "true" : undefined} className="cinta-fila m-0 p-0 list-none flex shrink-0 items-center gap-10 pr-10">
      {items.map(([tipo, nombre]) => (
        <li key={tipo + nombre} className="flex items-center gap-2 whitespace-nowrap text-[13px]">
          <span className={oscura ? "text-white/45" : "text-[#6B7280]"}>{tipo}</span>
          <strong className={oscura ? "text-white font-semibold" : "text-[#0E1116] font-semibold"}>{nombre}</strong>
        </li>
      ))}
    </ul>
  )
  return (
    <div className={"cinta flex items-center overflow-hidden border-t " + (oscura ? "border-white/10 bg-[#0B0D12] text-white" : "border-black/10 bg-white text-[#0E1116]")} role="region" aria-label={etiqueta}>
      <span className={"relative z-10 flex items-center gap-2 pl-4 md:pl-8 pr-4 py-3 text-[13px] font-bold shrink-0 " + (oscura ? "bg-[#0B0D12]" : "bg-white")}>
        <span className="w-2 h-2 rounded-full bg-[#5BE08A] shadow-[0_0_0_4px_rgba(91,224,138,.2)]" />{etiqueta}
      </span>
      <div className="cinta-carril flex overflow-hidden">
        <div className="cinta-pista flex">{fila("a")}{fila("b")}</div>
      </div>
    </div>
  )
}
