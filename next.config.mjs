/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Fotos del perfil de WhatsApp y archivos chicos desde formularios
  // staleTimes: volver a una pantalla vista hace menos de 30 s es instantáneo (cualquier guardado la refresca igual)
  experimental: { staleTimes: { dynamic: 30, static: 180 }, serverActions: { bodySizeLimit: "5mb", allowedOrigins: ["panel.devisebit.com"] }, outputFileTracingIncludes: { "/academia/descarga/[token]": ["./private/**"], "/academia/mi-cuenta/descargar/[iid]/[lid]": ["./private/cursos/**"], "/portal/descargar/[iid]/[lid]": ["./private/cursos/**"], "/demo/[token]/[slug]": ["./private/demos/**"] } },
  async headers() {
    return [
      // La Oficina se muestra embebida en el panel (mismo origen)
      { source: "/api/oficina/vista", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      { source: "/:path((?!api/oficina/vista$).*)", headers: [
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
