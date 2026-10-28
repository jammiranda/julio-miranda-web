import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight, Playfair_Display } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n/context"
import WhatsappFloat from "@/components/whatsapp-float"
import Attribution from "@/components/attribution"

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
  title: "DEVISEBIT · Software e IA para salud e instituciones",
  description:
    "Desarrollamos software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas. Más de 150 proyectos desde 2009, con alcance, fecha y precio fijo.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/lp-assets/favicon-32.png", type: "image/png", sizes: "32x32" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "DEVISEBIT · Software e IA para salud e instituciones",
    description: "Más de 150 proyectos en producción desde 2009. Software, apps e IA con alcance, fecha y precio fijo.",
    url: "https://www.devisebit.com",
    siteName: "DEVISEBIT",
    locale: "es_AR",
    type: "website",
    images: [{ url: "https://julio.devisebit.com/media/og/og-devisebit.jpg", width: 1200, height: 630, alt: "DEVISEBIT · Software e inteligencia artificial para salud e instituciones" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DEVISEBIT · Software e IA para salud e instituciones",
    description: "Más de 150 proyectos en producción desde 2009. Software, apps e IA con alcance, fecha y precio fijo.",
    images: ["https://julio.devisebit.com/media/og/og-devisebit.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${interTight.variable} ${playfair.variable} antialiased`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <WhatsappFloat />
        <Attribution />
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-10953063902" strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'AW-10953063902');`}</Script>
      </body>
    </html>
  )
}
