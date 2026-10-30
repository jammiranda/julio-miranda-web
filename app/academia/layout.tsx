import type { Metadata, Viewport } from "next"
import Link from "next/link"
import Script from "next/script"

import MenuMovil from "./_ui/MenuMovil"
import MenuEscritorio from "./_ui/MenuEscritorio"
import CuentaHeader from "./_ui/CuentaHeader"
import Pie from "./_ui/Pie"

const OG_ACADEMIA = "https://sistema.devisebit.com/marca/og-academia.jpg"

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0E1116" }

export const metadata: Metadata = {
  metadataBase: new URL("https://academia.devisebit.com"),
  title: { default: "ACADEMIA DEVISEBIT · IA y tecnología aplicada para pymes e instituciones", template: "%s · ACADEMIA DEVISEBIT" },
  description: "Guías prácticas, gratis y en castellano para usar inteligencia artificial, automatizar tareas y digitalizar tu organización. Hechas por el equipo de DEVISEBIT, desde 2009.",
  openGraph: { siteName: "ACADEMIA DEVISEBIT", locale: "es_AR", type: "website", images: [{ url: OG_ACADEMIA, width: 1200, height: 630, alt: "ACADEMIA DEVISEBIT: IA y tecnología aplicada, explicada simple" }] },
  twitter: { card: "summary_large_image", images: [OG_ACADEMIA] },
  robots: { index: true, follow: true },
}

export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="acad min-h-screen bg-[#F5F6F8] flex flex-col">
      <a href="#contenido" className="acad-saltar">Saltar al contenido</a>
      <header className="ficha-head bg-[#0E1116] text-white sticky top-0 z-40" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-6xl mx-auto h-14 md:h-16 flex items-center justify-between gap-3" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
          <Link href="/" className="flex items-center gap-2 min-h-[44px] text-white no-underline shrink-0" aria-label="ACADEMIA DEVISEBIT, inicio">
            <span className="text-lg font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.22em] text-white/70">Academia</span>
          </Link>
          <nav aria-label="Academia" className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-sm whitespace-nowrap">
            <MenuEscritorio />
            <CuentaHeader />
          </nav>
          <div className="lg:hidden flex items-center gap-1">
            <CuentaHeader movil />
            <MenuMovil cuenta />
          </div>
        </div>
      </header>
      <div id="contenido" tabIndex={-1} className="flex-1 outline-none">{children}</div>
      <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      <Pie />
    </div>
  )
}
