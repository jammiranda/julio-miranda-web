import type { Metadata } from "next"
import { headers } from "next/headers"

export const metadata: Metadata = { title: "No encontramos esa página · DEVISEBIT", robots: { index: false, follow: false } }

const WA = "https://wa.me/5491173466490"

/** 404 general (cualquier dirección que no existe, en todos los dominios). El botón principal depende del sitio. */
export default function NoEncontrada() {
  const host = (headers().get("host") ?? "").toLowerCase()
  const sitio = host.startsWith("academia.")
    ? { marca: "ACADEMIA", ir: "Ver los cursos", href: "/cursos", otro: "Ir al inicio de la Academia" }
    : host.startsWith("portal.")
      ? { marca: "MI CUENTA", ir: "Ir a Mi cuenta", href: "/", otro: "" }
      : { marca: "", ir: "Ir al inicio", href: "/", otro: "" }
  return (
    <main className="min-h-screen flex flex-col bg-[var(--fondo)]">
      <header className="bg-[var(--tinta)] text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-baseline gap-2">
          <a href="/" className="text-xl font-extrabold tracking-[0.04em] text-white no-underline" aria-label="DEVISEBIT, inicio">DEVISE<span className="text-[#FF6A63]">BIT</span></a>
          {sitio.marca && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{sitio.marca}</span>}
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card max-w-md w-full flex flex-col gap-3 text-center">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[var(--ac-texto)]">Error 404</p>
          <h1 className="m-0 text-2xl">No encontramos esa página</h1>
          <p className="m-0 text-[var(--gris)]">Puede que el link esté mal escrito, haya vencido o que la página se haya movido.</p>
          <a href={sitio.href} className="btn-p mt-2 min-h-[44px]">{sitio.ir}</a>
          {sitio.otro && <a href="/" className="btn-s min-h-[44px]">{sitio.otro}</a>}
          <p className="m-0 mt-1 text-sm text-[var(--gris)]">¿Necesitás ayuda? <a href={WA} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--ac-texto)] underline">Escribinos por WhatsApp</a></p>
        </div>
      </div>
    </main>
  )
}
