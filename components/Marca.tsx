/** Isotipo DEVISEBIT. `academia` cambia el trazo al verde azulado de la Academia; `fondo` permite usarlo sobre superficies oscuras o de color. */
export function MarcaIcono({ academia = false, tam = 36, fondo = "#0E1116", className = "" }: { academia?: boolean; tam?: number; fondo?: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`} style={{ width: tam, height: tam, background: fondo }} aria-hidden="true">
      <svg viewBox="0 0 24 24" style={{ width: tam * 0.56, height: tam * 0.56 }}><path d="M5 4h7a8 8 0 0 1 0 16H5z" fill="none" stroke={academia ? "#2DD4BF" : "#FF6A63"} strokeWidth="2.6" strokeLinejoin="round" /><rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" /></svg>
    </span>
  )
}

export default function Marca({ chico = false, sub = "SISTEMA DE GESTIÓN" }: { chico?: boolean; sub?: string }) {
  const aca = /ACADEMIA/i.test(sub)
  return (
    <div className="flex items-center gap-2.5">
      <MarcaIcono academia={aca} tam={chico ? 36 : 48} />
      <div className="leading-tight">
        <div className={`${chico ? "text-[17px]" : "text-xl"} font-extrabold tracking-[0.04em] text-[#0E1116]`}>DEVISE<span className={aca ? "text-[#0F766E]" : "text-[#C8231F]"}>BIT</span></div>
        <div className="text-[10px] font-semibold tracking-[0.25em] text-[#4A515C]">{sub}</div>
      </div>
    </div>
  )
}
