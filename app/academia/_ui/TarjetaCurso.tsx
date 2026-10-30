import Link from "next/link"
import { modalidad, pesos, dolares, textoGratis } from "@/lib/cursos"
import { portada, firmaCurso } from "@/lib/portadas"

export type CursoTarjeta = {
  slug: string; titulo: string; bajada: string | null; categoria?: string | null; modalidad: string; horas: number | string | null
  precio: number | string | null; precio_usd: number | string | null; cuotas?: number | null; imagen?: string | null; docente?: string | null; nuevo?: boolean
  docente_slug?: string | null; gratis_modulos?: number | null; videollamada?: boolean
}

/**
 * Tarjeta de curso (inicio y /cursos): portada, tema, título de 2 líneas, bajada de 3 y precio abajo,
 * todas con la misma altura por fila. En el inicio va sin el nombre de quien lo enseña.
 */
export default function TarjetaCurso({ c, conQuien = false, i = 0 }: { c: CursoTarjeta; conQuien?: boolean; i?: number }) {
  const img = portada(c)
  const pago = !!c.precio
  const gratisMod = pago ? Number(c.gratis_modulos ?? 0) : 0
  return (
    <Link href={`/cursos/${c.slug}`} data-revelar style={{ ["--i" as string]: i % 3 }}
      className="levanta group h-full flex flex-col rounded-2xl bg-white border border-[#E2E5EA] overflow-hidden no-underline text-[#0E1116] hover:border-[#C8231F]">
      <div className="relative overflow-hidden aspect-video bg-[#0E1116]">
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt="" width={1200} height={675} loading="lazy" decoding="async" className="zoom w-full h-full object-cover" />
          : <div aria-hidden="true" className="w-full h-full flex items-end p-4" style={{ background: "radial-gradient(circle at 85% 15%, rgba(200,35,31,.6), #0E1116 62%)" }}><span className="text-white/85 text-sm font-bold">{c.categoria ?? "Curso"}</span></div>}
        <span className="absolute right-3 top-3 flex gap-1.5">
          {c.nuevo && <span className="rounded-lg bg-[#C8231F] text-white px-2 py-1 text-xs font-bold shadow">Nuevo</span>}
          {!pago && <span className="rounded-lg bg-white text-[#0B6B3A] px-2 py-1 text-xs font-bold shadow">Gratis</span>}
          {gratisMod > 0 && <span className="rounded-lg bg-white text-[#0B6B3A] px-2 py-1 text-xs font-bold shadow">{textoGratis(gratisMod)}</span>}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <span className="text-sm font-semibold text-[#B91F1B]">{c.categoria ?? modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""}</span>
        <span className="t2 text-lg font-extrabold tracking-tight">{c.titulo}</span>
        <span className="b3 text-[15px] text-[#4A515C]">{c.bajada ?? ""}</span>
        {conQuien && c.docente && <span className="text-sm text-[#4A515C] truncate">{firmaCurso(c.docente_slug)} <strong className="text-[#0E1116]">{c.docente}</strong></span>}
        {pago && <span className="mt-auto text-[13px] leading-snug text-[#262C37]"><strong>Te lo quedás:</strong> acceso de por vida, apunte y cuaderno PDF, plantillas y certificado{c.videollamada === false ? "" : ", más videollamada"}</span>}
        <span className={`${pago ? "" : "mt-auto "}pt-3 border-t border-[#EEF0F3] flex items-end justify-between gap-3`}>
          {pago
            ? <span className="flex flex-col min-w-0"><strong className="text-xl leading-none">{pesos(c.precio)}</strong><span className="text-xs text-[#4A515C] mt-1 truncate">{c.precio_usd ? `${dolares(c.precio_usd)} desde el exterior` : (c.cuotas ?? 1) > 1 ? `${c.cuotas} cuotas sin interés` : "Pago único"}</span></span>
            : <span className="flex flex-col"><strong className="text-xl leading-none text-[#0B6B3A]">Gratis</strong><span className="text-xs text-[#4A515C] mt-1">Con certificado</span></span>}
          <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#FDECEB] text-[#9E1A17] px-3 min-h-[40px] text-sm font-bold group-hover:bg-[#C8231F] group-hover:text-white transition-colors">{gratisMod > 0 ? "Empezá gratis" : pago ? "Ver curso" : "Inscribirme"}</span>
        </span>
      </div>
    </Link>
  )
}
