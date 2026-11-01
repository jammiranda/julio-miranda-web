"use client"
import { useState } from "react"
import type { Pieza } from "@/lib/piezas"

/** Tarjeta de pieza pensada para el celular: ver, compartir la imagen, descargar y copiar el texto. */
export default function PiezaCard({ p }: { p: Pieza }) {
  const [idioma, setIdioma] = useState<"es" | "en">("es")
  const [aviso, setAviso] = useState("")
  const src = `/marca/piezas/${p.id}.png`
  const texto = idioma === "es" ? p.texto : p.en

  const dec = (m: string) => { setAviso(m); setTimeout(() => setAviso(""), 2200) }

  async function copiar() {
    try { await navigator.clipboard.writeText(texto); dec("Texto copiado") } catch {
      const t = document.getElementById("txt-" + p.id) as HTMLTextAreaElement | null
      if (t) { t.select(); document.execCommand("copy"); dec("Texto copiado") }
    }
  }
  async function compartir() {
    try {
      const r = await fetch(src); const blob = await r.blob()
      const file = new File([blob], p.id + ".png", { type: "image/png" })
      const nav: any = navigator
      if (nav.canShare && nav.canShare({ files: [file] })) { await nav.share({ files: [file], text: texto }); return }
      if (nav.share) { await nav.share({ text: texto, url: p.link }); return }
      dec("Tu navegador no comparte: usá Descargar")
    } catch { /* cancelado */ }
  }

  return (
    <article className="card flex flex-col gap-3 !p-3 sm:!p-4">
      <div className={"overflow-hidden rounded-xl bg-[#0B0D12] " + (p.formato === "historia" ? "aspect-[9/16] max-h-[460px] mx-auto" : "aspect-[4/5]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={p.titulo} loading="lazy" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col gap-0.5">
        <strong className="text-[16px]">{p.titulo}</strong>
        <span className="text-xs text-[var(--gris)]">{p.formato === "historia" ? "Historia 1080×1920" : "Feed 1080×1350"} · {p.donde}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={compartir} className="btn btn-p !min-h-[48px]">Compartir</button>
        <a href={src} download={p.id + ".png"} className="btn btn-s !min-h-[48px] text-center">Descargar</a>
      </div>
      <details className="rounded-xl border border-[var(--borde)] bg-[var(--sup-2)] p-3">
        <summary className="cursor-pointer text-sm font-semibold">Texto para publicar</summary>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => setIdioma("es")} className={"chip " + (idioma === "es" ? "!bg-[var(--ac)] !text-white" : "")}>Español</button>
            <button type="button" onClick={() => setIdioma("en")} className={"chip " + (idioma === "en" ? "!bg-[var(--ac)] !text-white" : "")}>English</button>
          </div>
          <textarea id={"txt-" + p.id} readOnly value={texto} rows={9} className="inp text-[15px]" />
          <button type="button" onClick={copiar} className="btn btn-s !min-h-[44px]">Copiar texto</button>
          <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--ac-texto)] underline break-all">{p.link}</a>
        </div>
      </details>
      {aviso && <span role="status" className="text-xs font-semibold text-[var(--ac-texto)]">{aviso}</span>}
    </article>
  )
}
