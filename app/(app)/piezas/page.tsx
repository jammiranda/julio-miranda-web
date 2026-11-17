import { requerir } from "@/lib/auth"
import { PIEZAS } from "@/lib/piezas"
import PiezaCard from "@/components/PiezaCard"
import Indice from "@/components/Indice"
import Copiar from "@/components/Copiar"
import { GRUPOS } from "@/lib/material"

export const dynamic = "force-dynamic"

const BIBLIOTECA = "https://www.devisebit.com/mv-8f92ddf28895/videos.html"
const TIKTOK = "https://www.devisebit.com/mv-8f92ddf28895/r2/tiktok.html"

export default async function Piezas() {
  await requerir(["gerente", "coordinacion", "profesional"])
  const feed = PIEZAS.filter((p) => p.formato === "feed")
  const hist = PIEZAS.filter((p) => p.formato === "historia")
  const placas = GRUPOS.find((g) => g.t === "Piezas para redes")?.items ?? []
  return (
    <div className="flex flex-col gap-6">
      <header className="pag-cab">
        <div><div className="eyebrow">Comunicación</div><h1 className="m-0">Piezas para redes</h1><p>Esta es la <b>biblioteca en vivo</b>: es la misma página donde se publican los reels, videos y carruseles nuevos, así que siempre está al día y no hay que cargar nada dos veces.</p></div>
        <div className="flex flex-wrap gap-2">
          <a className="btn" href={BIBLIOTECA} target="_blank" rel="noreferrer">Abrir la biblioteca</a>
          <a className="btn-s" href={TIKTOK} target="_blank" rel="noreferrer">Videos para TikTok</a>
        </div>
      </header>
      <iframe src={BIBLIOTECA} title="Biblioteca de contenidos DEVISEBIT" loading="lazy" className="w-full rounded-xl border border-[var(--borde)] bg-white" style={{ height: "80vh" }} />
      <details className="card">
        <summary className="cursor-pointer font-bold">Piezas viejas del sistema (placas fijas de octubre)</summary>
        <div className="flex flex-col gap-6 mt-4">
      <Indice filtra="article.card, li.card" placeholder="Buscar una pieza" />
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Feed ({feed.length})</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{feed.map((p) => <PiezaCard key={p.id} p={p} />)}</div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Historias ({hist.length})</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{hist.map((p) => <PiezaCard key={p.id} p={p} />)}</div>
      </section>
      {placas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div><h2 className="m-0 text-lg font-bold">Placas por producto ({placas.length})</h2><p className="m-0 text-sm text-[var(--gris)]">Placas 1080×1080 y carrusel 1080×1350, sin precios. Antes estaban mezcladas con el material de venta.</p></div>
          <ul className="m-0 p-0 list-none grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
            {placas.map((it) => (
              <li key={it.k} className="card !p-2.5 flex flex-col gap-2">
                {it.tipo === "png"
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={it.url} alt={it.titulo} loading="lazy" className="w-full aspect-square object-cover rounded-lg border border-[var(--borde)]" />
                  : <div className="flex items-center justify-center rounded-lg aspect-square text-lg font-extrabold bg-[#0E1116] text-[#FF6A63]" aria-hidden="true">ZIP</div>}
                <strong className="text-xs leading-snug">{it.titulo}</strong>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <a href={it.url} download className="btn-s !py-1 !px-3 !text-xs">Descargar</a>
                  <Copiar texto={it.url} etiqueta="Copiar link" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>
      </details>
    </div>
  )
}
