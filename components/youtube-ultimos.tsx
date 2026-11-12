"use client"
import { useState } from "react"
import { Youtube } from "lucide-react"
import { YOUTUBE } from "@/lib/marca"

/** Últimos videos y shorts del canal (se actualiza solo) + botón para suscribirse.
 *  El reproductor de YouTube (más de 1 MB) se carga recién cuando la persona toca el recuadro. */
export default function YoutubeUltimos({ oscuro = true, titulo = "Lo último en nuestro canal" }: { oscuro?: boolean; titulo?: string }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <p className={`m-0 text-sm font-bold ${oscuro ? "text-[#C3C8D1]" : "text-[#4A515C]"}`}>{titulo}</p>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
        {ver ? (
          <iframe
            src={YOUTUBE.ultimos + "&autoplay=1"}
            title="Últimos videos de DEVISEBIT en YouTube"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <a
            href={YOUTUBE.canal}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); setVer(true) }}
            aria-label="Ver los últimos videos de DEVISEBIT en YouTube"
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-[15px] font-bold bg-[radial-gradient(circle_at_75%_15%,#3a0d10,#0B0D12_62%)]"
          >
            <span aria-hidden="true" className="flex items-center justify-center w-[68px] h-12 rounded-[14px] bg-[#CC0000] group-hover:scale-105 transition-transform">
              <span className="block w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white ml-1" />
            </span>
            Ver los últimos videos
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={YOUTUBE.suscribirse} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#CC0000] hover:bg-[#A30000] px-4 py-2.5 text-sm font-bold text-white transition-colors"><Youtube size={18} aria-hidden="true" /> Suscribirme al canal</a>
        <a href={YOUTUBE.shorts} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${oscuro ? "border-white/20 text-white hover:border-[#FF6A63]" : "border-[#C3C8D1] text-[#262C37] hover:border-[#C8231F]"}`}>Ver todos los shorts</a>
      </div>
    </div>
  )
}
