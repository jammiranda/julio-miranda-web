import type { MetadataRoute } from "next"
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema San Patricio",
    short_name: "San Patricio",
    description: "Gestión de internación domiciliaria",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F4",
    theme_color: "#0B5E31",
    lang: "es-AR",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  }
}
