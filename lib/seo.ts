import type { Metadata } from "next"

export const SITE_URL = "https://www.devisebit.com"
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "DEVISEBIT · Software e IA. Desde 2009" }

/** Título, descripción, canónica y Open Graph de cada página, con la imagen de marca. */
export function pageMeta(title: string, description: string, path: string, extra: Partial<Metadata> = {}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "DEVISEBIT", locale: "es_AR", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    ...extra,
  }
}
