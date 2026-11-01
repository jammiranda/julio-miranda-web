"use client"
import { useState } from "react"
import Link from "next/link"
import type { Kit } from "@/lib/kits"

type Props = { kits: Kit[]; textos: { eligeT: string; contratar: string; detalle: string; ocultar: string; incluyeT: string; recibisT: string; paraT: string; despuesT: string; msg: string } }

/** Botonera de kits: un toque para elegir, el panel cambia con movimiento y el botón de contratar queda siempre a mano. */
export default function KitSelector({ kits, textos }: Props) {
  const [i, setI] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const k = kits[i]
  const wa = "https://wa.me/5491173466490?text=" + encodeURIComponent(textos.msg + k.nombre)

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={textos.eligeT} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kits.map((x, n) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={n === i}
            onClick={() => { setI(n); setAbierto(false) }}
            className={"group text-left rounded-2xl border-2 p-4 md:p-5 transition-all duration-300 flex flex-col gap-2 " + (n === i ? "border-[#C8231F] bg-[#C8231F] text-white -translate-y-1 shadow-[0_18px_40px_-18px_rgba(200,35,31,.7)]" : "border-[#E2E5EA] bg-white hover:border-[#C8231F]/60 hover:-translate-y-0.5")}
          >
            <span className="text-[28px] leading-none" aria-hidden="true">{x.icono}</span>
            <span className="font-tight text-[17px] md:text-[19px] leading-tight font-extrabold">{x.nombre}</span>
            <span className={"text-[12.5px] font-semibold uppercase tracking-wider " + (n === i ? "text-white/80" : "text-[#C8231F]")}>{x.producto}</span>
          </button>
        ))}
      </div>

      <div key={k.id} role="tabpanel" className="kit-panel rounded-3xl border border-[#E2E5EA] bg-white p-6 md:p-8 grid lg:grid-cols-[1.2fr_1fr] gap-8 shadow-[0_20px_50px_-30px_rgba(14,17,22,.25)]">
        <div className="flex flex-col gap-5">
          <h2 className="m-0 font-tight text-[26px] md:text-[34px] leading-[1.1] font-extrabold">{k.nombre}</h2>
          <p className="m-0 text-[18px] leading-snug text-[#0E1116] font-semibold">{k.corto}</p>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
            {k.chips.map((c, n) => (
              <li key={c} className="kit-chip rounded-full bg-[#FFF4F2] border border-[#F0C9C6] px-4 py-2 text-[15px] font-bold text-[#7E1512]" style={{ animationDelay: 0.08 * n + "s" }}>✓ {c}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-extrabold text-[17px] text-[#0B0D12] transition-colors">{textos.contratar}</a>
            <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="rounded-xl border-2 border-[#0B0D12] hover:bg-[#0B0D12] hover:text-white px-[22px] py-[14px] font-bold text-[16px] transition-colors">{abierto ? textos.ocultar : textos.detalle}</button>
          </div>
          {abierto && (
            <div className="kit-chip grid sm:grid-cols-2 gap-5 border-t border-[#E2E5EA] pt-5">
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-extrabold uppercase tracking-widest">{textos.incluyeT}</h3>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">{k.incluye.map((x) => <li key={x} className="text-[15px] leading-snug text-[#4A515C]"><span className="text-[#C8231F] font-bold">✓ </span>{x}</li>)}</ul>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-extrabold uppercase tracking-widest text-[#7E1512]">{textos.recibisT}</h3>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">{k.entregables.map((x) => <li key={x} className="text-[15px] leading-snug text-[#4A515C]"><span className="text-[#C8231F] font-bold">→ </span>{x}</li>)}</ul>
                <p className="m-0 mt-2 text-[14px] text-[#4A515C]"><b>{textos.paraT}:</b> {k.para}</p>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-[#0B0D12] text-white p-6 flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{textos.despuesT}</p>
            <p className="m-0 text-[16px] leading-relaxed text-[#C3C8D1]">{k.siguiente.texto}</p>
          </div>
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {k.siguiente.links.map((l) => (
              <li key={l.href}><Link href={l.href} className="flex items-center justify-between rounded-xl border border-white/15 hover:border-[#FF6A63] hover:bg-white/5 px-4 py-3 font-bold transition-colors">{l.t}<span aria-hidden="true" className="text-[#FF6A63]">→</span></Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra fija de contratación rápida en el celular */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-40 p-3 pr-[84px] bg-white/95 backdrop-blur border-t border-[#E2E5EA] flex items-center gap-3">
        <span className="flex-1 min-w-0 truncate text-[14px] font-bold">{k.nombre}</span>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-[#25D366] px-5 py-3 font-extrabold text-[#0B0D12]">{textos.contratar}</a>
      </div>
    </div>
  )
}
