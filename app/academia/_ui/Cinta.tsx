/** Cinta que corre sola (solo CSS) con lo que hay en la Academia. */
export default function Cinta({ etiqueta, items }: { etiqueta: string; items: [string, string][] }) {
  const fila = (k: string) => (
    <ul key={k} aria-hidden={k === "b" ? "true" : undefined} className="m-0 p-0 list-none flex shrink-0 items-center gap-10 pr-10">
      {items.map(([tipo, nombre], i) => (
        <li key={k + i} className="flex items-center gap-2 whitespace-nowrap text-[13px]"><span className="text-white/45">{tipo}</span><strong className="text-white font-semibold">{nombre}</strong></li>
      ))}
    </ul>
  )
  return (
    <div className="acad-cinta flex items-center overflow-hidden border-b border-white/10 bg-[#0E1116] text-white relative" role="region" aria-label={etiqueta}>
      <span className="relative z-10 flex items-center gap-2 pl-4 pr-4 py-2.5 text-[13px] font-bold shrink-0 bg-[#0E1116]"><span className="w-2 h-2 rounded-full bg-[#5BE08A] shadow-[0_0_0_4px_rgba(91,224,138,.2)]" />{etiqueta}</span>
      <div className="acad-carril flex overflow-hidden flex-1 min-w-0"><div className="acad-pista flex">{fila("a")}{fila("b")}</div></div>
    </div>
  )
}
