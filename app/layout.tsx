import SkipLink from "@/components/skip-link"
import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n/context"
import WhatsappFloat from "@/components/whatsapp-float"
import Attribution from "@/components/attribution"
import { SITE_URL, pageMeta, ORGANIZACION, SITIO_WEB } from "@/lib/seo"
import { JsonLd } from "@/components/json-ld"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-tight",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMeta(
    "DEVISEBIT · Software e IA para salud e instituciones",
    "Software e IA desde 2009. Desarrollamos software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas, con precio fijo.",
    "/",
  ),
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/lp-assets/favicon-32.png", type: "image/png", sizes: "32x32" }],
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${interTight.variable} antialiased`}>
      <body>
        <JsonLd data={ORGANIZACION} />
        <JsonLd data={SITIO_WEB} />
        <SkipLink />
        <I18nProvider>{children}</I18nProvider>
        <WhatsappFloat />
        <Attribution />
        {/* Medición (Google Ads, GA4 y Meta): etiquetas y eventos quedan en cola desde el inicio; las librerías (unos 650 kB)
            se bajan al primer toque o scroll, o 2 segundos después de terminar de cargar la página. */}
        <Script id="medicion" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function(){dataLayer.push(arguments);}; gtag('js', new Date()); gtag('config', 'AW-10953063902'); gtag('config', 'G-DPH6T7Z06S'); gtag('config', 'AW-18556479684'); gtag('event', 'conversion', { send_to: 'AW-18556479684/XsupCIzwlbIdEMTRtZBF', value: 1.0, currency: 'ARS' });
if(!window.fbq){var n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!window._fbq)window._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}fbq('init','1597635908717757');fbq('track','PageView');
(function(){var ok=false,ev=['pointerdown','touchstart','keydown','scroll'];function go(){if(ok)return;ok=true;ev.forEach(function(e){removeEventListener(e,go)});['https://www.googletagmanager.com/gtag/js?id=AW-10953063902','https://connect.facebook.net/en_US/fbevents.js'].forEach(function(u){var s=document.createElement('script');s.async=true;s.src=u;document.head.appendChild(s)})}ev.forEach(function(e){addEventListener(e,go,{passive:true})});function luego(){setTimeout(go,2000)}if(document.readyState==='complete')luego();else addEventListener('load',luego);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')go()})})();`}</Script>
        <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
