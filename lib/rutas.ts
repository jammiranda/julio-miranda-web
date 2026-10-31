/** Páginas con versión en español e inglés: [español, inglés]. Alimenta el selector de idioma, hreflang y el sitemap. */
export const PARES: [string, string][] = [
  ["/", "/en"],
  ["/servicios", "/en/services"],
  ["/productos", "/en/products"],
  ["/transformacion-digital", "/en/digital-transformation"],
  ["/asesoria", "/en/advisory"],
  ["/casos-de-exito", "/en/success-stories"],
  ["/nosotros", "/en/about"],
  ["/contacto", "/en/contact"],
]

export const esEn = (p: string) => p === "/en" || p.startsWith("/en/")
const limpia = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p)

/** Ruta equivalente en el otro idioma (o null si la página no está traducida). */
export function equivalente(path: string): string | null {
  const p = limpia(path.split("#")[0].split("?")[0])
  for (const [es, en] of PARES) { if (p === es) return en; if (p === en) return es }
  return null
}
