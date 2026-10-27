/** Canal de YouTube de DEVISEBIT: últimos videos por el feed público (sin claves). */
export const YT_CANAL_ID = "UC390RZKG-NZ6xU3tbOGInCA"
export const YT_URL = "https://www.youtube.com/@devisebitsrl"
export const YT_SUSCRIBIR = `${YT_URL}?sub_confirmation=1`

export type Video = { id: string; titulo: string; fecha: string; corto: boolean }

export async function ultimosVideos(n = 6): Promise<Video[]> {
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
