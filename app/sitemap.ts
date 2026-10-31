import type { MetadataRoute } from "next"
import { posts } from "@/lib/posts"
import { SITE_URL } from "@/lib/seo"
import { PARES } from "@/lib/rutas"

// Solo páginas públicas. No se listan carpetas privadas ni demos de producto (se piden por email).
const PAGINAS: [string, number][] = [
  ["/", 1], ["/servicios", 0.9], ["/productos", 0.9], ["/transformacion-digital", 0.9], ["/kit-4-0", 0.8], ["/asesoria", 0.9], ["/casos-de-exito", 0.8],
  ["/webs", 0.8], ["/whatsapp", 0.8], ["/sistemas", 0.8], ["/redes", 0.8], ["/comunidad", 0.8],
  ["/demos", 0.7], ["/diagnostico", 0.7], ["/diagnostico/procesos", 0.5], ["/diagnostico/automatizacion", 0.5], ["/nosotros", 0.7], ["/alianzas-estrategicas", 0.5],
  ["/trabaja-con-nosotros", 0.5], ["/contacto", 0.8], ["/novedades", 0.7], ["/privacidad", 0.3],
]

// Sin lastModified en las páginas fijas: una fecha que cambia en cada deploy le quita valor al dato para Google.
// Las notas del blog sí llevan su fecha real de publicación.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGINAS.map(([p, priority]) => {
      const en = PARES.find(([es]) => es === p)?.[1]
      return { url: SITE_URL + p, priority, ...(en ? { alternates: { languages: { "es-AR": SITE_URL + p, en: SITE_URL + en } } } : {}) }
    }),
    ...PARES.map(([es, en]) => ({ url: SITE_URL + en, priority: es === "/" ? 0.9 : 0.8, alternates: { languages: { "es-AR": SITE_URL + es, en: SITE_URL + en } } })),
    ...posts.map((p) => ({ url: `${SITE_URL}/novedades/${p.slug}`, lastModified: new Date(p.date), priority: 0.6 })),
  ]
}
