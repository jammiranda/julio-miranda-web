import type { MetadataRoute } from "next"
import { posts } from "@/lib/posts"
import { SITE_URL } from "@/lib/seo"

// Solo páginas públicas. No se listan carpetas privadas ni demos de producto (se piden por email).
const PAGINAS: [string, number][] = [
  ["/", 1], ["/servicios", 0.9], ["/productos", 0.9], ["/transformacion-digital", 0.9], ["/casos-de-exito", 0.8],
  ["/webs", 0.8], ["/whatsapp", 0.8], ["/sistemas", 0.8], ["/redes", 0.8], ["/comunidad", 0.8],
  ["/demos", 0.7], ["/demos/transformacion-digital.html", 0.6], ["/nosotros", 0.7], ["/alianzas-estrategicas", 0.5],
  ["/trabaja-con-nosotros", 0.5], ["/contacto", 0.8], ["/novedades", 0.7], ["/privacidad", 0.3],
]

export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date()
  return [
    ...PAGINAS.map(([p, priority]) => ({ url: SITE_URL + p, lastModified: hoy, priority })),
    ...posts.map((p) => ({ url: `${SITE_URL}/novedades/${p.slug}`, lastModified: new Date(p.date), priority: 0.6 })),
  ]
}
