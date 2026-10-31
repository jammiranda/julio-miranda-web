import type React from "react"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta(
  "Casos de éxito: 150+ proyectos de software e IA · DEVISEBIT",
  "Más de 150 proyectos en producción desde 2009: sistemas, apps, academias, tableros y redes para salud, gobierno, universidades, gremios y empresas.",
  "/casos-de-exito",
)

export default function CasosLayout({ children }: { children: React.ReactNode }) {
  return children
}
