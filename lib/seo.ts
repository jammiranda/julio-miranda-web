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

// ── Datos estructurados (schema.org) ──
export const ORG_ID = `${SITE_URL}/#organization`

/** Organización: va en todas las páginas desde el layout. */
export const ORGANIZACION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: "DEVISEBIT",
  legalName: "DEVISEBIT SRL",
  alternateName: ["DEVISEBIT SRL", "Web y Graf"],
  url: SITE_URL,
  logo: `${SITE_URL}/images/devisebit-icon-transparent.png`,
  image: `${SITE_URL}/og.png`,
  description: "Software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas. Sistemas en producción desde 2009.",
  foundingDate: "2009",
  email: "info@devisebit.com",
  telephone: "+54 9 11 7346-6490",
  address: { "@type": "PostalAddress", addressLocality: "Buenos Aires", addressCountry: "AR" },
  areaServed: ["AR", "Latinoamérica"],
  knowsAbout: ["Desarrollo de software", "Inteligencia artificial", "Transformación digital", "Asistentes de WhatsApp", "Sistemas de gestión", "Academias online"],
  sameAs: [
    "https://www.instagram.com/devisebit",
    "https://www.linkedin.com/company/devisebit",
    "https://www.youtube.com/@devisebitsrl",
  ],
  contactPoint: [{ "@type": "ContactPoint", contactType: "ventas", telephone: "+54 9 11 7346-6490", email: "info@devisebit.com", availableLanguage: "es", areaServed: "AR" }],
}

export const SITIO_WEB = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "DEVISEBIT",
  inLanguage: "es-AR",
  publisher: { "@id": ORG_ID },
}

/** Migas de pan: [nombre, ruta]. La home se agrega sola. */
export function breadcrumb(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Inicio", "/"], ...items].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE_URL + (path === "/" ? "" : path) })),
  }
}

/** Servicio ofrecido por DEVISEBIT. */
export function servicio(name: string, description: string, path: string, serviceType: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url: SITE_URL + path,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Argentina" },
    availableChannel: { "@type": "ServiceChannel", serviceUrl: SITE_URL + path },
  }
}
