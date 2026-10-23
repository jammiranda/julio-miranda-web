import Link from "next/link"
import { q } from "@/lib/db"
import { ESTADOS_PROY } from "@/lib/crm"
import { fecha, hoyISO, pesos } from "@/lib/util"

export const dynamic = "force-dynamic"

export default async function Proyectos({ searchParams }: { searchParams: { cerrados?: string } }) {
  const ver = searchParams.cerrados ? ESTADOS_PROY : ESTADOS_PROY.filter((e) => e.v !== "cancelado")
  const rows = await q<any>(
    `select p.*, c.organizacion, c.nombre contacto, s.nombre servicio from db_proyectos p
     left join db_contactos c on c.id=p.contacto_id left join db_servicios s on s.id=p.servicio_id
     where p.estado = any($1) order by p.entrega nulls last, p.creado desc`,
    [ver.map((e) => e.v)],
  )
  const hoy = hoyISO()
  const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : null)
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="m-0">Proyectos</h1><p className="m-0 text-sm text-[#4A515C]">Lo vendido, en ejecución y entregado.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={searchParams.cerrados ? "/proyectos" : "/proyectos?cerrados=1"} className="text-sm underline text-[#4A515C]">{searchParams.cerrados ? "Ocultar cancelados" : "Ver también cancelados"}</Link>
        <div className="flex gap-2"><a href="/api/proyectos?formato=csv" className="btn-s py-1.5">Exportar</a><Link href="/proyectos/nuevo" className="btn-p py-1.5">+ Nuevo proyecto</Link></div>
      </div>
      <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-2">
        {ver.map((e) => {
          const col = rows.filter((r) => r.estado === e.v)
          return (
            <section key={e.v} aria-label={e.n} className="rounded-2xl bg-[#F5F6F8] p-3 flex flex-col gap-2 min-h-[160px]">
              <h2 className="m-0 text-sm flex items-center justify-between"><span className={`chip ${e.c}`}>{e.n}</span><span className="text-[#4A515C]">{col.length}</span></h2>
              {col.map((p) => {
                const f = iso(p.entrega)
                const tarde = f && f < hoy && !["terminado", "cancelado"].includes(p.estado)
                return (
                  <Link key={p.id} href={`/proyectos/${p.id}`} className="card p-3 flex flex-col gap-1 hover:border-[#C8231F]">
                    <strong className="text-sm">{p.nombre}</strong>
                    <span className="text-xs text-[#4A515C]">{p.organizacion ?? p.contacto ?? "Sin cliente"}{p.servicio ? ` · ${p.servicio}` : ""}</span>
                    <span className="flex flex-wrap gap-2 text-xs">
                      {f && <span className={tarde ? "text-rojo font-semibold" : "text-[#4A515C]"}>Entrega {fecha(f)}</span>}
                      {p.monto && <span className="text-[#4A515C]">{pesos(p.monto)}</span>}
                      {p.trello_url && <span className="text-sky-700">Trello</span>}
                    </span>
                  </Link>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
