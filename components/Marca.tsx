export default function Marca({ chico = false }: { chico?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${chico ? "w-9 h-9 text-base" : "w-12 h-12 text-xl"} rounded-xl bg-[#0B7A3B] text-white font-extrabold flex items-center justify-center`} aria-hidden="true">SP</div>
      <div className="leading-tight">
        <div className={`${chico ? "text-[15px]" : "text-lg"} font-extrabold tracking-wide text-[#26323E]`}>SAN PATRICIO</div>
        <div className="text-[10px] font-semibold tracking-[0.25em] text-[#0B7A3B]">SISTEMA DE GESTIÓN</div>
      </div>
    </div>
  )
}
