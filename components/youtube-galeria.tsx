import { YOUTUBE } from "@/lib/marca"

/**
 * Últimos videos del canal con su miniatura real (feed público de YouTube, se renueva cada hora).
 * Cada tarjeta abre el video en YouTube: la página no carga el reproductor (más rápida).
 */
type Video = { id: string; titulo: string; short: boolean }

const CANAL_ID = "UC390RZKG-NZ6xU3tbOGInCA"

async function ultimos(n: number): Promise<Video[]> {
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_ID}`, { next: { revalidate: 3600 } })
    if (!r.ok) return []
    const xml = await r.text()
    const out: Video[] = []
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const e = m[1]
      const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
      const titulo = (e.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ""
      if (id) out.push({ id, titulo, short: link.includes("/shorts/") })
      if (out.length >= n) break
    }
    return out
  } catch {
    return []
  }
}

export default async function YoutubeGaleria({ cantidad = 6, oscuro = true, columnas = 3 }: { cantidad?: number; oscuro?: boolean; columnas?: 2 | 3 }) {
  const videos = await ultimos(cantidad)
  const txt = oscuro ? "text-white" : "text-[#0E1116]"
  return (
    <div className="flex flex-col gap-5">
      {videos.length > 0 ? (
        <ul className={`m-0 p-0 list-none grid grid-cols-2 ${columnas === 3 ? "lg:grid-cols-3" : ""} gap-3 md:gap-4`}>
          {videos.map((v) => (
            <li key={v.id}>
              <a href={v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className={`group flex flex-col gap-2 ${txt}`}>
                <span className="relative block aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#161A22]">
                  <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                    <span className="w-12 h-12 rounded-full bg-[#C8231F]/90 grid place-items-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                  {v.short && <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">Short</span>}
                </span>
                <span className="text-[14px] leading-snug font-semibold line-clamp-2">{v.titulo}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <a href={YOUTUBE.canal} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/15 p-6 text-white font-bold">Ver los videos en YouTube →</a>
      )}
      <div className="flex flex-wrap gap-2.5">
        <a href={YOUTUBE.suscribirse} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Suscribirme al canal</a>
        <a href={YOUTUBE.canal} target="_blank" rel="noopener noreferrer" className={`rounded-xl border-2 ${oscuro ? "border-white/20 text-white" : "border-[#0E1116] text-[#0E1116]"} hover:border-[#FF6A63] px-[18px] py-[10px] font-bold transition-colors`}>Ver todo el canal</a>
      </div>
    </div>
  )
}
