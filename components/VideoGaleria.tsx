"use client"
import { useEffect, useRef, useState } from "react"
import type { Video } from "@/lib/youtube"

type V = Video & { mini: string; link: string }

/**
 * Videos de la Academia: al tocar una miniatura se abre el video ahí mismo, sin salir del sitio.
 * Separa siempre en dos filas: "Videos" (16:9, 3 por fila en escritorio) y "Shorts" (9:16, más chicos, 5 por fila;
 * en celular, carrusel horizontal). Cada fila tiene tarjetas de la misma altura y títulos de hasta 2 líneas.
 * El botón de play es chico, va en la esquina y no tapa el texto de la miniatura.
 * `limite`: cuántos de cada tipo mostrar (la home muestra 3 videos y 5 shorts). `titulos`: encabezados de cada fila.
 */
export default function VideoGaleria({ videos, limite, titulos = true }: { videos: V[]; limite?: { largos: number; cortos: number }; titulos?: boolean }) {
  const [abierto, setAbierto] = useState<V | null>(null)
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

  const abrir = (v: V, e: React.MouseEvent<HTMLButtonElement>) => {
    origen.current = e.currentTarget
    setAbierto(v)
  }

  const largos = videos.filter((v) => !v.corto).slice(0, limite?.largos ?? Infinity)
  const cortos = videos.filter((v) => v.corto).slice(0, limite?.cortos ?? Infinity)

  const Tarjeta = ({ v }: { v: V }) => (
    <button
      type="button"
      onClick={(e) => abrir(v, e)}
      aria-label={`Ver ${v.corto ? "short" : "video"}: ${v.titulo}`}
      className="acad-video group h-full w-full text-left rounded-2xl overflow-hidden bg-white border border-[#E2E5EA] hover:border-[#C8231F] transition-colors p-0 cursor-pointer flex flex-col"
    >
      <span className={`relative block w-full bg-[#0E1116] overflow-hidden ${v.corto ? "aspect-[9/16]" : "aspect-video"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.mini} alt="" loading="lazy" decoding="async" width={v.corto ? 360 : 480} height={v.corto ? 640 : 270} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform motion-reduce:transform-none" />
        <span aria-hidden="true" className="acad-play absolute right-2 bottom-2 w-9 h-9 rounded-full bg-[#C8231F]/85 text-white flex items-center justify-center text-sm shadow-md backdrop-blur-[2px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        </span>
      </span>
      <span className={`block p-3 font-semibold leading-snug text-[#0E1116] line-clamp-2 ${v.corto ? "text-sm min-h-[3.6rem]" : "text-[15px] min-h-[4rem]"}`}>{v.titulo}</span>
    </button>
  )

  return (
    <>
      <div className="flex flex-col gap-8">
        {largos.length > 0 && (
          <section aria-label="Videos" className="flex flex-col gap-3">
            {titulos && <h3 className="m-0 text-lg font-extrabold">Videos</h3>}
            <ul className="m-0 p-0 list-none grid grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {largos.map((v) => <li key={v.id} className="h-full"><Tarjeta v={v} /></li>)}
            </ul>
          </section>
        )}
        {cortos.length > 0 && (
          <section aria-label="Shorts" className="flex flex-col gap-3">
            {titulos && <h3 className="m-0 text-lg font-extrabold">Shorts</h3>}
            <ul className="acad-riel m-0 p-0 list-none -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-4 lg:grid-cols-5 sm:gap-4 sm:overflow-visible">
              {cortos.map((v) => <li key={v.id} className="h-full w-[42vw] max-w-[190px] sm:w-auto sm:max-w-none"><Tarjeta v={v} /></li>)}
            </ul>
          </section>
        )}
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
