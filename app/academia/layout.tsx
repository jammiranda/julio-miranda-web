import type { Metadata, Viewport } from "next"
import Link from "next/link"
import Script from "next/script"

import { YT_URL, YT_SUSCRIBIR } from "@/lib/youtube"
import { urlPortal } from "@/lib/portal"
import Redes from "@/components/Redes"
import MenuMovil from "./_ui/MenuMovil"

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

const MENU = [
  { href: "/cursos", label: "Cursos" },
  { href: "/guias", label: "Guías" },
  { href: "/videos", label: "Videos" },
  { href: "/equipo", label: "Equipo" },
  { href: "/productos/kit-ia-pymes", label: "Kit IA" },
  { href: "https://www.devisebit.com/demos/transformacion-digital.html", label: "Diagnóstico gratis" },
  { href: urlPortal("/cursos"), label: "Mi cuenta" },
]

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia"

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
          <nav aria-label="Academia" className="hidden md:flex items-center gap-1 text-sm">
            {MENU.map((i) => (
              <Link key={i.href} href={i.href} className="px-3 py-3 rounded-lg text-white/85 hover:text-white hover:bg-white/10 no-underline">{i.label}</Link>
            ))}
            <a href="/#suscribirme" className="ml-1 btn bg-[#C8231F] text-white hover:bg-[#9E1A17] min-h-[44px]">Suscribirme</a>
          </nav>
          <div className="md:hidden flex items-center gap-1">
            <a href="/#suscribirme" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] min-h-[40px] px-3">Suscribirme</a>
            <MenuMovil items={MENU} />
          </div>
        </div>
      </header>
      <div id="contenido" tabIndex={-1} className="flex-1 outline-none">{children}</div>
      <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      <footer className="ficha-head acad-pie bg-[#0E1116] text-white/75 text-[15px]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div><p className="m-0 text-white font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> <span className="font-semibold text-white/60 tracking-[0.2em] text-xs uppercase">Academia</span></p><p className="m-0 mt-2">IA y tecnología aplicada, explicada simple. Desde 2009 haciendo software para salud, gobierno, universidades, gremios y empresas.</p><Redes oscuro className="mt-3" /></div>
          <div className="flex flex-col"><span className="text-white font-semibold mb-1">Aprender</span><Link href="/cursos" className="hover:text-white">Cursos con certificado</Link><a href={urlPortal("/cursos")} className="hover:text-white">Mi cuenta y certificados</a><Link href="/guias" className="hover:text-white">Todas las guías</Link><Link href="/productos/kit-ia-pymes" className="hover:text-white">Kit IA para pymes</Link><a href="/#suscribirme" className="hover:text-white">Newsletter</a><a href="https://www.devisebit.com/demos/transformacion-digital.html" className="hover:text-white">Autodiagnóstico digital gratis</a><a href="https://www.devisebit.com/transformacion-digital" className="hover:text-white">Consultoría en transformación digital</a><a href={YT_URL} className="hover:text-white">Canal de YouTube</a><a href={YT_SUSCRIBIR} className="hover:text-white">Suscribirme en YouTube</a></div>
          <div className="flex flex-col"><span className="text-white font-semibold mb-1">DEVISEBIT SRL</span><a href="https://www.devisebit.com" className="hover:text-white">devisebit.com</a><a href={WA} className="hover:text-white">WhatsApp +54 9 11 7346-6490</a><a href="https://www.devisebit.com/privacidad" className="hover:text-white">Privacidad</a></div>
        </div>
      </footer>
    </div>
  )
}
