import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salud Digital · Demo",
    short_name: "Salud Digital",
    description: "Gestión de internación domiciliaria",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F4",
    theme_color: "#0B5E31",
    lang: "es-AR",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  }
}
