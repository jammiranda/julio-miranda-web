export default function Marca({ chico = false, sub = "SISTEMA COMERCIAL" }: { chico?: boolean; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${chico ? "w-9 h-9" : "w-12 h-12"} rounded-xl bg-[#0E1116] flex items-center justify-center`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className={chico ? "w-5 h-5" : "w-7 h-7"}><path d="M5 4h7a8 8 0 0 1 0 16H5z" fill="none" stroke="#FF6A63" strokeWidth="2.6" strokeLinejoin="round" /><rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" /></svg>
      </div>
      <div className="leading-tight">
        <div className={`${chico ? "text-[17px]" : "text-xl"} font-extrabold tracking-[0.04em] text-[#0E1116]`}>DEVISE<span className="text-[#C8231F]">BIT</span></div>
        <div className="text-[10px] font-semibold tracking-[0.25em] text-[#4A515C]">{sub}</div>
      </div>
    </div>
  )
}
