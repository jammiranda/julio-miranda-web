import Link from "next/link"
import type { Metadata } from "next"
import { q } from "@/lib/db"
import { sembrar } from "@/lib/academia"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Descargas",
  description: "Kit IA para pymes, guías con plantillas y materiales descargables de ACADEMIA DEVISEBIT.",
  alternates: { canonical: "/descargas" },
}

/**
 * Descargas: reúne lo que se baja (productos digitales como el Kit IA y la Guía de Transformación Digital)
 * y las guías con plantillas o checklists para copiar. Los productos siguen en /productos/<slug>.
 */
export default async function Descargas() {
  await sembrar()
  const [productos, guias] = await Promise.all([
    q<any>(`select slug, titulo, bajada, precio, precio_usd, estado, servicio from am_productos
            where estado<>'oculto' and not servicio and slug<>'prueba-de-pago' order by estado='venta' desc, id`),
    q<any>(`select slug, titulo, bajada, categoria, exclusiva from am_guias
            where publicada and (exclusiva or contenido ~* '(plantilla|checklist|para copiar)') order by destacada desc, creado desc limit 9`),
  ])
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-10">
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT</p>
        <h1 className="acad-h1-m m-0 mt-2 font-extrabold">Descargas</h1>
        <p className="acad-lead m-0 mt-2 text-[#4A515C] max-w-2xl">Kits, guías en PDF, planillas y checklists listos para usar en tu organización.</p>
      </div>

      {productos.length > 0 && (
        <section aria-labelledby="t-kits" className="flex flex-col gap-4">
          <h2 id="t-kits" className="m-0 text-2xl font-extrabold">Kits y guías para descargar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productos.map((p) => (
              <Link key={p.slug} href={`/productos/${p.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${p.estado === "venta" ? "bg-emerald-50 text-emerald-800" : "bg-[#FDECEB] text-[#9E1A17]"}`}>{p.estado === "venta" ? "Disponible" : "Próximamente"}</span>
                  {p.estado === "venta" && p.precio && <span className="text-sm font-semibold text-[#262C37]">$ {Number(p.precio).toLocaleString("es-AR")}{p.precio_usd ? ` · USD ${Number(p.precio_usd)}` : ""}</span>}
                </span>
                <span className="text-xl font-bold leading-snug">{p.titulo}</span>
                {p.bajada && <span className="text-[15px] leading-snug text-[#4A515C]">{p.bajada}</span>}
                <span className="mt-auto pt-2 font-semibold text-[#C8231F]">{p.estado === "venta" ? "Ver y descargar →" : "Anotarme a la lista →"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {guias.length > 0 && (
        <section aria-labelledby="t-plant" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="t-plant" className="m-0 text-2xl font-extrabold">Guías con plantillas y checklists</h2><Link href="/guias" className="inline-flex items-center min-h-[44px] font-semibold text-[#C8231F]">Todas las guías →</Link></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {guias.map((g) => (
              <Link key={g.slug} href={`/guias/${g.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{g.categoria}{g.exclusiva ? " · Gratis con tu email" : " · Gratis"}</span>
                <span className="text-lg font-bold leading-snug">{g.titulo}</span>
                <span className="text-[15px] leading-snug text-[#4A515C] line-clamp-3">{g.bajada}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white border border-[#E2E5EA] p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <p className="m-0 text-[15px] text-[#4A515C]"><strong className="text-[#0E1116]">¿Hiciste un curso?</strong> Los materiales de cada curso (plantillas, planillas y archivos) se descargan desde el aula, en tu cuenta.</p>
        <Link href="/mi-cuenta" className="btn-s min-h-[48px] shrink-0">Ir a Mi cuenta</Link>
      </section>
    </main>
  )
}
