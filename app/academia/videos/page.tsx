import type { Metadata } from "next"
import { ultimosVideos, miniatura, linkVideo, YT_SUSCRIBIR, YT_URL } from "@/lib/youtube"
import VideoGaleria from "@/components/VideoGaleria"

export const revalidate = 1800
export const metadata: Metadata = { title: "Videos", description: "Guías en video, casos reales y tips de inteligencia artificial para pymes e instituciones." }

export default async function Videos() {
  const videos = await ultimosVideos(60)
  const cortos = videos.filter((v) => v.corto), largos = videos.filter((v) => !v.corto)
  const m = (l: typeof videos) => l.map((v) => ({ ...v, mini: miniatura(v), link: linkVideo(v) }))
  return (
    <main className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0 text-4xl font-extrabold">Videos</h1><p className="m-0 mt-2 text-lg text-[#4A515C]">Guías en video, casos reales y tips rápidos de IA para tu organización.</p></div>
        <div className="flex gap-2"><a href={YT_URL} target="_blank" rel="noopener noreferrer" className="btn-s">Ir al canal</a><a href={YT_SUSCRIBIR} target="_blank" rel="noopener noreferrer" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17]">▶ Suscribirme</a></div>
      </div>
      {largos.length > 0 && <section className="flex flex-col gap-4"><h2 className="m-0 text-2xl font-extrabold">Guías y casos</h2><VideoGaleria videos={m(largos)} /></section>}
      <section className="flex flex-col gap-4"><h2 className="m-0 text-2xl font-extrabold">Shorts</h2><VideoGaleria videos={m(cortos)} /></section>
    </main>
  )
}
