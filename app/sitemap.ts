import type { MetadataRoute } from "next"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const B = "https://academia.devisebit.com"
  const g = await q<{ slug: string; actualizado: Date }>("select slug, actualizado from am_guias where publicada").catch(() => [])
  const p = await q<{ slug: string }>("select slug from am_productos where estado<>'oculto'").catch(() => [])
  return [{ url: B, priority: 1 }, { url: `${B}/guias`, priority: 0.9 }, ...g.map((x) => ({ url: `${B}/guias/${x.slug}`, lastModified: x.actualizado })), ...p.map((x) => ({ url: `${B}/productos/${x.slug}` }))]
}
