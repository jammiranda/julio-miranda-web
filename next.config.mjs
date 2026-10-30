/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    // Los videos de demos se pueden leer desde otras páginas (subida a YouTube Studio)
    return [{ source: "/dv-e96893d90d8d/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }]
  },
  async redirects() {
    return [
      { source: "/precios", destination: "https://sistema.devisebit.com/lista-precios", permanent: false },
      { source: "/lista-precios", destination: "https://sistema.devisebit.com/lista-precios", permanent: false },
      // El autodiagnóstico estático pasó a /diagnostico (3 niveles): los links publicados (YouTube, LinkedIn, emails, bot) siguen andando
      { source: "/demos/transformacion-digital.html", destination: "/diagnostico", permanent: true },
      { source: "/demos/transformacion-digital", destination: "/diagnostico", permanent: true },
      // Las demos de producto son privadas: los links viejos (QR, videos) llevan al pedido por email
      ...["whatsapp", "webs", "sistemas", "padron", "obras-sociales", "academia", "panel-de-contenido"].map((s) => ({ source: `/demos/${s}.html`, destination: `/demos?d=${s}#pedir`, permanent: false })),
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: "academia.devisebit.com" }], destination: "/academia" },
        // Landings de servicios: HTML estático en public/lp (antes en el proyecto devisebit-landings)
        ...["webs", "whatsapp", "redes", "sistemas", "comunidad"].map((s) => ({ source: `/${s}`, destination: `/lp/${s}.html` })),
      ],
    }
  },
}

export default nextConfig
