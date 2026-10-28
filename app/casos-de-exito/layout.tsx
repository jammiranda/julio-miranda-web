import type React from "react"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta(
  "Casos de éxito · DEVISEBIT",
  "Más de 150 proyectos en producción desde 2009: sistemas, apps, academias, tableros y redes para salud, gobierno, universidades, gremios y empresas.",
  "/casos-de-exito",
)

export default function CasosLayout({ children }: { children: React.ReactNode }) {
  return children
}
