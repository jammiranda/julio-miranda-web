import type { MetadataRoute } from "next"
import { headers } from "next/headers"
export default function robots(): MetadataRoute.Robots {
  const academia = (headers().get("host") ?? "").startsWith("academia.")
  return academia ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/descarga/", "/gracias/"] }], sitemap: "https://academia.devisebit.com/sitemap.xml" } : { rules: [{ userAgent: "*", disallow: "/" }] }
}
