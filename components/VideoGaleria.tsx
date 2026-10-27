"use client"
import { useEffect, useState } from "react"
import type { Video } from "@/lib/youtube"

/** Grilla de miniaturas: al tocar una se abre el video ahí mismo, sin salir de la academia. */
export default function VideoGaleria({ videos }: { videos: (Video & { mini: string; link: string })[] }) {
  const [abierto, setAbierto] = useState<(Video & { link: string }) | null>(null)
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(null)
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {videos.map((v) => (
          <button key={v.id} type="button" onClick={() => setAbierto(v)} className="group text-left rounded-2xl overflow-hidden bg-white border border-[#E2E5EA] hover:border-[#C8231F] transition-colors p-0 cursor-pointer">
            <div className={`relative bg-[#0E1116] ${v.corto ? "aspect-[9/16]" : "aspect-video"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.mini} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-14 h-14 rounded-full bg-[#C8231F]/90 text-white flex items-center justify-center text-2xl shadow-lg" aria-hidden>▶</span>
              </span>
              {v.corto && <span className="absolute top-2 left-2 chip bg-black/70 text-white text-[11px]">Short</span>}
            </div>
            <p className="m-0 p-3 text-sm font-semibold leading-snug text-[#0E1116]">{v.titulo}</p>
          </button>
        ))}
      </div>
      {abierto && (
        <div role="dialog" aria-modal="true" aria-label={abierto.titulo} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setAbierto(null)}>
          <div className={abierto.corto ? "w-full max-w-[380px] aspect-[9/16]" : "w-full max-w-4xl aspect-video"} onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${abierto.id}?autoplay=1&rel=0`} title={abierto.titulo} allow="autoplay; encrypted-media; picture-in-picture; web-share" allowFullScreen className="w-full h-full border-0 rounded-2xl" />
            <div className="mt-3 flex justify-between gap-3 text-sm">
              <a href={abierto.link} target="_blank" rel="noopener noreferrer" className="text-white underline">Ver en YouTube</a>
              <button type="button" onClick={() => setAbierto(null)} className="text-white/80 hover:text-white">Cerrar ✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
