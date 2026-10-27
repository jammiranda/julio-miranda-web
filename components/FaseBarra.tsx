import { FASES, faseIdx } from "@/lib/portal"

/** Recorrido del proyecto por fases. `detalle` muestra los nombres de cada fase (vista de proyecto). */
export default function FaseBarra({ fase, terminado = false, detalle = false }: { fase: string | null; terminado?: boolean; detalle?: boolean }) {
  const i = faseIdx(fase)
  const pct = terminado ? 100 : Math.round(((i + 0.5) / FASES.length) * 100)
  if (!detalle)
    return (
      <div>
        <div className="flex justify-between text-xs text-[#4A515C]"><span>{FASES[i].n}</span><span>Etapa {i + 1} de {FASES.length}</span></div>
        <div className="h-2 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-label="Avance por etapas" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[#C8231F] rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  return (
    <ol className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-7 gap-2" aria-label="Etapas del proyecto">
      {FASES.map((f, k) => {
        const hecho = terminado || k < i
        const actual = !terminado && k === i
        return (
          <li key={f.v} aria-current={actual ? "step" : undefined} className={`rounded-xl border p-2.5 flex sm:flex-col gap-2 sm:gap-1 items-start ${actual ? "border-[#C8231F] bg-[#FDECEB]" : hecho ? "border-[#E2E5EA] bg-white" : "border-dashed border-[#C3C8D1] bg-[#F8F9FB]"}`}>
            <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${hecho ? "bg-[#0E1116] text-white" : actual ? "bg-[#C8231F] text-white" : "bg-[#E2E5EA] text-[#4A515C]"}`}>{hecho ? "✓" : k + 1}</span>
            <span className="text-xs leading-snug"><strong className={`block ${actual ? "text-[#9E1A17]" : "text-[#0E1116]"}`}>{f.n}</strong>{actual && <span className="text-[#4A515C]">{f.d}</span>}</span>
          </li>
        )
      })}
    </ol>
  )
}
