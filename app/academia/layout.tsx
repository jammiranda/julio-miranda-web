import type { Metadata } from "next"
import Link from "next/link"
import Script from "next/script"

import { YT_URL, YT_SUSCRIBIR } from "@/lib/youtube"
import { urlPortal } from "@/lib/portal"

const OG_ACADEMIA = "https://sistema.devisebit.com/marca/og-academia.jpg"

export const metadata: Metadata = {
  metadataBase: new URL("https://academia.devisebit.com"),
  title: { default: "Academia DEVISEBIT · IA y tecnología aplicada para pymes e instituciones", template: "%s · Academia DEVISEBIT" },
  description: "Guías prácticas, gratis y en castellano para usar inteligencia artificial, automatizar tareas y digitalizar tu organización. Hechas por el equipo de DEVISEBIT, desde 2009.",
  openGraph: { siteName: "Academia DEVISEBIT", locale: "es_AR", type: "website", images: [{ url: OG_ACADEMIA, width: 1200, height: 630, alt: "Academia DEVISEBIT: IA y tecnología aplicada, explicada simple" }] },
  twitter: { card: "summary_large_image", images: [OG_ACADEMIA] },
  robots: { index: true, follow: true },
}

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia"

export default function AcademiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      <header className="ficha-head bg-[#0E1116] text-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-2 text-white no-underline" aria-label="Academia DEVISEBIT, inicio">
            <span className="text-lg font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Academia</span>
          </Link>
          <nav aria-label="Academia" className="flex items-center gap-1 text-sm">
            <Link href="/cursos" className="px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Cursos</Link>
            <Link href="/guias" className="px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Guías</Link>
            <a href="/videos" className="px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Videos</a>
            <Link href="/productos/kit-ia-pymes" className="hidden sm:inline-block px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Kit IA</Link>
            <a href="https://www.devisebit.com/servicios" className="hidden md:inline-block px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Servicios</a>
            <a href={urlPortal("/cursos")} className="hidden sm:inline-block px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10">Mi cuenta</a>
            <a href="/#suscribirme" className="ml-1 btn bg-[#C8231F] text-white hover:bg-[#9E1A17] py-2">Suscribirme</a>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      <footer className="ficha-head bg-[#0E1116] text-white/70 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div><p className="m-0 text-white font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> <span className="font-semibold text-white/60 tracking-[0.2em] text-xs uppercase">Academia</span></p><p className="m-0 mt-2">IA y tecnología aplicada, explicada simple. Desde 2009 haciendo software para salud, gobierno, universidades, gremios y empresas.</p></div>
          <div className="flex flex-col gap-1"><span className="text-white font-semibold">Aprender</span><Link href="/cursos" className="hover:text-white">Cursos con certificado</Link><a href={urlPortal("/cursos")} className="hover:text-white">Mi cuenta y certificados</a><Link href="/guias" className="hover:text-white">Todas las guías</Link><Link href="/productos/kit-ia-pymes" className="hover:text-white">Kit IA para pymes</Link><a href="/#suscribirme" className="hover:text-white">Newsletter</a><a href={YT_URL} className="hover:text-white">Canal de YouTube</a><a href={YT_SUSCRIBIR} className="hover:text-white">Suscribirme en YouTube</a></div>
          <div className="flex flex-col gap-1"><span className="text-white font-semibold">DEVISEBIT SRL</span><a href="https://www.devisebit.com" className="hover:text-white">devisebit.com</a><a href={WA} className="hover:text-white">WhatsApp +54 9 11 7346-6490</a><a href="https://www.devisebit.com/privacidad" className="hover:text-white">Privacidad</a></div>
        </div>
      </footer>
    </div>
  )
}
