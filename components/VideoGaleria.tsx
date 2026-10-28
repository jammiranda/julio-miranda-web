"use client"
import { useEffect, useRef, useState } from "react"
import type { Video } from "@/lib/youtube"

/**
 * Grilla de miniaturas: al tocar una se abre el video ahí mismo, sin salir de la academia.
 * `carrusel`: en celular se muestra como fila deslizable (scroll-snap); desde sm, grilla.
 */
export default function VideoGaleria({ videos, carrusel = false }: { videos: (Video & { mini: string; link: string })[]; carrusel?: boolean }) {
  const [abierto, setAbierto] = useState<(Video & { link: string }) | null>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const origen = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    cerrarRef.current?.focus()
    const k = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(null)
    window.addEventListener("keydown", k)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", k)
      origen.current?.focus()
    }
  }, [abierto])

  const abrir = (v: Video & { link: string }, e: React.MouseEvent<HTMLButtonElement>) => {
    origen.current = e.currentTarget
    setAbierto(v)
  }

  const contenedor = carrusel
    ? "acad-riel -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4 sm:overflow-visible"
    : "grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"

  return (
    <>
      <div className={contenedor}>
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={(e) => abrir(v, e)}
            aria-label={`Ver video: ${v.titulo}`}
            className={`group text-left rounded-2xl overflow-hidden bg-white border border-[#E2E5EA] hover:border-[#C8231F] transition-colors p-0 cursor-pointer flex flex-col ${carrusel ? (v.corto ? "w-[44vw] max-w-[200px] sm:w-auto sm:max-w-none" : "w-[78vw] max-w-[320px] sm:w-auto sm:max-w-none") : ""}`}
          >
            <div className={`relative w-full bg-[#0E1116] ${v.corto ? "aspect-[9/16]" : "aspect-video"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.mini} alt="" loading="lazy" decoding="async" width={v.corto ? 360 : 480} height={v.corto ? 640 : 270} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform motion-reduce:transform-none" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-14 h-14 rounded-full bg-[#C8231F]/90 text-white flex items-center justify-center text-2xl shadow-lg" aria-hidden>▶</span>
              </span>
              {v.corto && <span className="absolute top-2 left-2 chip bg-black/75 text-white">Short</span>}
            </div>
            <p className="m-0 p-3 text-[15px] sm:text-sm font-semibold leading-snug text-[#0E1116] line-clamp-3">{v.titulo}</p>
          </button>
        ))}
      </div>
      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={abierto.titulo}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          style={{ padding: "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))" }}
          onClick={() => setAbierto(null)}
        >
          <div className="w-full max-w-4xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between gap-3 mb-2" style={{ maxWidth: abierto.corto ? "max(380px, 50%)" : undefined }}>
              <a href={abierto.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] text-white underline text-[15px] whitespace-nowrap">Ver en YouTube ↗</a>
              <button ref={cerrarRef} type="button" onClick={() => setAbierto(null)} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white/15 text-white hover:bg-white/25 text-[15px] font-semibold">Cerrar <span aria-hidden="true">✕</span></button>
            </div>
            <div
              className={`w-full ${abierto.corto ? "aspect-[9/16]" : "aspect-video"}`}
              style={{ maxWidth: abierto.corto ? "min(380px, calc((100dvh - 6rem) * 9 / 16))" : "min(56rem, calc((100dvh - 6rem) * 16 / 9))" }}
            >
              <iframe src={`https://www.youtube-nocookie.com/embed/${abierto.id}?autoplay=1&rel=0&playsinline=1`} title={abierto.titulo} allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen" allowFullScreen className="w-full h-full border-0 rounded-2xl bg-black" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
