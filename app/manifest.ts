import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema DEVISEBIT",
    short_name: "DEVISEBIT",
    description: "CRM, conversaciones y proyectos de DEVISEBIT SRL",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#0E1116",
    lang: "es-AR",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  }
}
