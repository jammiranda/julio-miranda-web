import SkipLink from "@/components/skip-link"
import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight, Playfair_Display } from "next/font/google"
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
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
    <html lang="es-AR" className={`${inter.variable} ${interTight.variable} ${playfair.variable} antialiased`}>
      <body>
        <JsonLd data={ORGANIZACION} />
        <JsonLd data={SITIO_WEB} />
        <SkipLink />
        <I18nProvider>{children}</I18nProvider>
        <WhatsappFloat />
        <Attribution />
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-10953063902" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'AW-10953063902');`}</Script>
        <Script src="https://sistema.devisebit.com/v.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
