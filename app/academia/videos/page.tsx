import type { Metadata } from "next"
import { ultimosVideos, miniatura, linkVideo, YT_SUSCRIBIR, YT_URL } from "@/lib/youtube"
import VideoGaleria from "@/components/VideoGaleria"

export const revalidate = 1800
export const metadata: Metadata = { title: "Videos", description: "Guías en video, casos reales y tips de inteligencia artificial para pymes e instituciones." }

export default async function Videos() {
  const videos = await ultimosVideos(60)
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="acad-h1-m m-0 font-extrabold">Videos</h1><p className="acad-lead m-0 mt-2 text-[#4A515C]">Guías en video, casos reales y tips rápidos de IA para tu organización.</p></div>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto"><a href={YT_URL} target="_blank" rel="noopener noreferrer" className="btn-s">Ir al canal</a><a href={YT_SUSCRIBIR} target="_blank" rel="noopener noreferrer" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17]"><span aria-hidden="true">▶</span> Suscribirme</a></div>
      </div>
      <VideoGaleria videos={videos.map((v) => ({ ...v, mini: miniatura(v), link: linkVideo(v) }))} />
    </main>
  )
}
