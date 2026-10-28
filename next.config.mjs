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
  async redirects() {
    return [
      { source: "/precios", destination: "https://sistema.devisebit.com/lista-precios", permanent: false },
      { source: "/lista-precios", destination: "https://sistema.devisebit.com/lista-precios", permanent: false },
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
