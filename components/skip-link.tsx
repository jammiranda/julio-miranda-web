"use client"

import { usePathname } from "next/navigation"
import { esEn } from "@/lib/rutas"

/** Enlace "saltar al contenido" en el idioma de la página. */
export default function SkipLink() {
  const en = esEn(usePathname() || "/")
  return <a href="#contenido" className="skip-link">{en ? "Skip to content" : "Saltar al contenido"}</a>
}
