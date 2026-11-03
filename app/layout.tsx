import SkipLink from "@/components/skip-link"
import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight, Fraunces } from "next/font/google"
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

// Títulos: serif con carácter (Fraunces). Inter queda solo para texto corrido.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
})

// Solo para el logotipo escrito "DEVISEBIT" (se mantiene igual que antes).
const marca = Inter_Tight({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
  variable: "--font-marca",
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
    <html lang="es-AR" className={`${inter.variable} ${fraunces.variable} ${marca.variable} antialiased`}>
      <body>
        <JsonLd data={ORGANIZACION} />
        <JsonLd data={SITIO_WEB} />
        <SkipLink />
        <I18nProvider>{children}</I18nProvider>
        <WhatsappFloat />
        <Attribution />
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-10953063902" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'AW-10953063902'); gtag('config', 'G-DPH6T7Z06S');`}</Script>
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1597635908717757');fbq('track','PageView');`}</Script>
        <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
