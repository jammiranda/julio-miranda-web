/** Canal de YouTube de DEVISEBIT: últimos videos por el feed público (sin claves). */
export const YT_CANAL_ID = "UC390RZKG-NZ6xU3tbOGInCA"
export const YT_URL = "https://www.youtube.com/@devisebitsrl"
export const YT_SUSCRIBIR = `${YT_URL}?sub_confirmation=1`

export type Video = { id: string; titulo: string; fecha: string; corto: boolean }

/** Videos ya publicados (por si el feed de YouTube tarda en actualizarse). */
export const VIDEOS_BASE: Video[] = [
  { id: "BK8O-W7k8G0", titulo: "ACADEMIA DEVISEBIT: IA aplicada, explicada simple", fecha: "2026-10-27T18:00:00Z", corto: true },
  { id: "GcWRKI0NWIo", titulo: "Tu WhatsApp puede atender solo, las 24 horas", fecha: "2026-10-27T17:59:00Z", corto: true },
  { id: "elDufct2yhg", titulo: "Tu web, ¿vende o solo existe?", fecha: "2026-10-27T17:58:00Z", corto: true },
  { id: "6XGJ54kO0OI", titulo: "Dejá las planillas: sistemas a medida con módulos probados", fecha: "2026-10-27T17:57:00Z", corto: true },
  { id: "KP4vyTsYnDk", titulo: "Caso real: más de 1000 inscriptos en un año", fecha: "2026-10-27T17:56:00Z", corto: true },
]
export const miniatura = (v: Video) => `https://i.ytimg.com/vi/${v.id}/${v.corto ? "oar2" : "hqdefault"}.jpg`
export const linkVideo = (v: Video) => (v.corto ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`)

export async function ultimosVideos(n = 6): Promise<Video[]> {
  const feed = await deFeed(30)
  const todos = [...feed, ...VIDEOS_BASE.filter((b) => !feed.some((f) => f.id === b.id))]
  return todos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, n)
}

async function deFeed(n: number): Promise<Video[]> {
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CANAL_ID}`, { next: { revalidate: 1800 } })
    if (!r.ok) return []
    const xml = await r.text()
    const des = (t: string) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, n).map((m) => {
      const e = m[1]
      const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ""
      return { id: e.match(/<yt:videoId>([^<]+)/)?.[1] ?? "", titulo: des(e.match(/<title>([^<]*)/)?.[1] ?? ""), fecha: e.match(/<published>([^<]+)/)?.[1] ?? "", corto: link.includes("/shorts/") }
    }).filter((v) => v.id)
  } catch { return [] }
}
