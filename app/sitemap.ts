import type { MetadataRoute } from "next"
import { q } from "@/lib/db"
import { EQUIPO } from "@/lib/equipo"
export const dynamic = "force-dynamic"
/** Mapa del sitio de academia.devisebit.com: portada, secciones, cursos publicados, guías, perfiles del equipo y productos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const B = "https://academia.devisebit.com"
  const g = await q<{ slug: string; actualizado: Date }>("select slug, actualizado from am_guias where publicada").catch(() => [])
  const p = await q<{ slug: string }>("select slug from am_productos where estado<>'oculto'").catch(() => [])
  const c = await q<{ slug: string; actualizado: Date }>("select slug, actualizado from am_cursos where estado='publicado'").catch(() => [])
  return [
    { url: B, priority: 1 },
    { url: `${B}/cursos`, priority: 0.9 },
    { url: `${B}/guias`, priority: 0.9 },
    ...["programas", "videos", "descargas", "equipo"].map((s) => ({ url: `${B}/${s}`, priority: 0.6 })),
    ...c.map((x) => ({ url: `${B}/cursos/${x.slug}`, lastModified: x.actualizado, priority: 0.8 })),
    ...g.map((x) => ({ url: `${B}/guias/${x.slug}`, lastModified: x.actualizado })),
    ...EQUIPO.map((x) => ({ url: `${B}/equipo/${x.slug}` })),
    ...p.map((x) => ({ url: `${B}/productos/${x.slug}` })),
  ]
}
