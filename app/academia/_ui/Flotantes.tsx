/** Objetos "3D" flotando alrededor del título (SVG con degradados). Decorativos: no se leen ni reciben foco. */
const base = "absolute pointer-events-none select-none acad-flota"
export default function Flotantes() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* Gorro de graduación */}
      <svg viewBox="0 0 120 120" className={base + " w-[64px] sm:w-[92px] lg:w-[110px] left-[6%] top-[58%] sm:top-[62%]"} style={{ animationDelay: "-1s" }}>
        <defs><linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A80" /><stop offset="1" stopColor="#C8231F" /></linearGradient><linearGradient id="fg1b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB4AD" /><stop offset="1" stopColor="#E2453E" /></linearGradient></defs>
        <path d="M30 62v22c0 8 14 14 30 14s30-6 30-14V62L60 76 30 62z" fill="url(#fg1)" /><path d="M60 22 8 46l52 24 52-24L60 22z" fill="url(#fg1b)" /><path d="M60 22 8 46l52 24" fill="rgba(255,255,255,.22)" /><path d="M104 50v26" stroke="#FFD27A" strokeWidth="4" strokeLinecap="round" /><circle cx="104" cy="80" r="5" fill="#FFD27A" />
      </svg>
      {/* Play */}
      <svg viewBox="0 0 120 120" className={base + " w-[56px] sm:w-[84px] lg:w-[100px] right-[5%] top-[10%] sm:top-[14%]"} style={{ animationDelay: "-3s" }}>
        <defs><linearGradient id="fg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9B86FF" /><stop offset="1" stopColor="#5B3FE0" /></linearGradient></defs>
        <rect x="10" y="22" width="100" height="76" rx="20" fill="url(#fg2)" /><rect x="10" y="22" width="100" height="30" rx="20" fill="rgba(255,255,255,.2)" /><path d="M50 45v30l28-15-28-15z" fill="#fff" />
      </svg>
      {/* Certificado */}
      <svg viewBox="0 0 120 120" className={base + " w-[58px] sm:w-[86px] lg:w-[104px] left-[44%] top-[3%] hidden sm:block"} style={{ animationDelay: "-5s" }}>
        <defs><linearGradient id="fg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D8DEE9" /></linearGradient></defs>
        <rect x="14" y="26" width="92" height="66" rx="8" fill="url(#fg3)" /><rect x="26" y="40" width="46" height="6" rx="3" fill="#C8231F" /><rect x="26" y="54" width="68" height="4" rx="2" fill="#AAB2C0" /><rect x="26" y="64" width="54" height="4" rx="2" fill="#AAB2C0" /><circle cx="86" cy="80" r="12" fill="#FFB020" /><path d="M80 90l-4 16 10-5 10 5-4-16" fill="#E2453E" />
      </svg>
      {/* Chip de IA */}
      <svg viewBox="0 0 120 120" className={base + " w-[52px] sm:w-[78px] lg:w-[96px] right-[3%] bottom-[22%] sm:bottom-[26%]"} style={{ animationDelay: "-2s" }}>
        <defs><linearGradient id="fg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5FD7B8" /><stop offset="1" stopColor="#0B7462" /></linearGradient></defs>
        <g stroke="#9FE8D4" strokeWidth="5" strokeLinecap="round"><path d="M42 12v14M60 12v14M78 12v14M42 94v14M60 94v14M78 94v14M12 42h14M12 60h14M12 78h14M94 42h14M94 60h14M94 78h14" /></g>
        <rect x="26" y="26" width="68" height="68" rx="16" fill="url(#fg4)" /><rect x="26" y="26" width="68" height="26" rx="16" fill="rgba(255,255,255,.2)" /><text x="60" y="73" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">IA</text>
      </svg>
    </div>
  )
}
