import "./globals.css"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Sistema San Patricio",
  description: "Gestión de internación domiciliaria · San Patricio Servicios de Salud",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "San Patricio", statusBarStyle: "default" },
}
export const dynamic = "force-dynamic"
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B5E31" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
