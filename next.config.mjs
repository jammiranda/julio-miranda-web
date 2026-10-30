/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Fotos del perfil de WhatsApp y archivos chicos desde formularios
  experimental: { serverActions: { bodySizeLimit: "5mb", allowedOrigins: ["panel.devisebit.com"] }, outputFileTracingIncludes: { "/academia/descarga/[token]": ["./private/**"], "/academia/mi-cuenta/descargar/[iid]/[lid]": ["./private/cursos/**"], "/portal/descargar/[iid]/[lid]": ["./private/cursos/**"], "/demo/[token]/[slug]": ["./private/demos/**"] } },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ] },
      // Piezas de marca (banner, avatar, videos) para cargar en redes
      { source: "/marca/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      // El sistema no se indexa; la academia sí
      { source: "/:path*", missing: [{ type: "host", value: "academia.devisebit.com" }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ]
  },
}
export default nextConfig
