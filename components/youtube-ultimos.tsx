import { Youtube } from "lucide-react"
import { YOUTUBE } from "@/lib/marca"

/** Últimos videos y shorts del canal (se actualiza solo) + botón para suscribirse. */
export default function YoutubeUltimos({ oscuro = true, titulo = "Lo último en nuestro canal" }: { oscuro?: boolean; titulo?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={`m-0 text-sm font-bold ${oscuro ? "text-[#C3C8D1]" : "text-[#4A515C]"}`}>{titulo}</p>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
        <iframe
          src={YOUTUBE.ultimos}
          title="Últimos videos de DEVISEBIT en YouTube"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={YOUTUBE.suscribirse} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] px-4 py-2.5 text-sm font-bold text-white transition-colors"><Youtube size={18} aria-hidden="true" /> Suscribirme al canal</a>
        <a href={YOUTUBE.shorts} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${oscuro ? "border-white/20 text-white hover:border-[#FF6A63]" : "border-[#C3C8D1] text-[#262C37] hover:border-[#C8231F]"}`}>Ver todos los shorts</a>
      </div>
    </div>
  )
}
