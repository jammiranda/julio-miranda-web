import "./globals.css"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Sistema DEVISEBIT",
  description: "CRM, conversaciones del bot y proyectos · DEVISEBIT SRL",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "DEVISEBIT", statusBarStyle: "default" },
}
export const dynamic = "force-dynamic"
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0E1116" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
