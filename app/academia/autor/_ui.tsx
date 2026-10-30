import Link from "next/link"
import { salirCuenta } from "@/lib/ingreso"
import type { Autor } from "@/lib/autores"

const PESTANAS = [
  { k: "cursos", href: "/autor", t: "Mis cursos" },
  { k: "alumnos", href: "/autor/alumnos", t: "Mis alumnos" },
  { k: "videollamadas", href: "/autor/videollamadas", t: "Videollamadas" },
] as const

/** Encabezado común del panel de autor: quién es, pestañas y salir. */
export function CabeceraAutor({ a, activa, titulo, bajada }: { a: Autor; activa: (typeof PESTANAS)[number]["k"] | null; titulo: string; bajada?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT · Panel de autor</p>
          <h1 className="acad-h1-m m-0 mt-2 font-extrabold">{titulo}</h1>
          {bajada && <p className="acad-lead m-0 mt-2 text-[#4A515C]">{bajada}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#4A515C]">{a.nombre}</span>
          <form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button className="btn-s">Salir</button></form>
        </div>
      </div>
      <nav aria-label="Panel de autor" className="flex flex-wrap gap-1 border-b border-[#E2E5EA]">
        {PESTANAS.map((p) => (
          <Link key={p.k} href={p.href} aria-current={activa === p.k ? "page" : undefined}
            className={`px-4 min-h-[44px] inline-flex items-center no-underline font-semibold border-b-2 -mb-px ${activa === p.k ? "border-[#C8231F] text-[#0E1116]" : "border-transparent text-[#4A515C] hover:text-[#0E1116]"}`}>
            {p.t}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export const ESTADO_CURSO: Record<string, { n: string; c: string }> = {
  borrador: { n: "Borrador", c: "bg-slate-100 text-slate-700" },
  publicado: { n: "Publicado", c: "bg-emerald-50 text-emerald-800" },
  archivado: { n: "Archivado", c: "bg-slate-100 text-slate-500" },
}
export const Chip = ({ c, children }: { c: string; children: React.ReactNode }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>
