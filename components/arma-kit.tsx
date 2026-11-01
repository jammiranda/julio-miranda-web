"use client"
import { useState } from "react"
import type { Kit } from "@/lib/kits"

/** Selector de kits: arma el mensaje de WhatsApp con lo elegido. Todo en el navegador. */
export default function ArmaKit({ kits, titulo, ayuda, boton, vacio, mensaje }: { kits: Kit[]; titulo: string; ayuda: string; boton: string; vacio: string; mensaje: string }) {
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const nombres = kits.filter((k) => sel[k.id]).map((k) => k.nombre)
  const href = "https://wa.me/5491173466490?text=" + encodeURIComponent(mensaje + nombres.join(", "))
  return (
    <div className="rounded-3xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 font-tight text-[24px] md:text-[30px] font-extrabold">{titulo}</h3>
        <p className="m-0 text-[16px] text-[#4A515C]">{ayuda}</p>
      </div>
      <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-3">
        {kits.map((k) => (
          <li key={k.id}>
            <label className={"flex gap-3 items-start rounded-2xl border-2 p-4 cursor-pointer transition-colors " + (sel[k.id] ? "border-[#C8231F] bg-[#FFF4F2]" : "border-[#E2E5EA] hover:border-[#C8231F]/50")}>
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[#C8231F]" checked={!!sel[k.id]} onChange={(e) => setSel({ ...sel, [k.id]: e.target.checked })} />
              <span className="flex flex-col gap-0.5"><strong className="text-[16px]">{k.nombre}</strong><span className="text-[13.5px] text-[#4A515C] leading-snug">{k.producto}</span></span>
            </label>
          </li>
        ))}
      </ul>
      {nombres.length ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="self-start rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors">{boton}</a>
      ) : (
        <span className="self-start rounded-xl bg-[#E2E5EA] px-6 py-4 font-bold text-[#6B7280]">{vacio}</span>
      )}
    </div>
  )
}
