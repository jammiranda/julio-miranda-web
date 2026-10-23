import Link from "next/link"
import { q } from "@/lib/db"
import { ETAPAS, etapa, estadoProy } from "@/lib/crm"
import { fecha, hoyISO, pesos } from "@/lib/util"

export const dynamic = "force-dynamic"

export default async function Resumen() {
  const [cuenta, proximos, activos, sinPasar] = await Promise.all([
    q<{ etapa: string; n: number }>("select etapa, count(*)::int n from db_contactos group by etapa"),
    q<any>("select id, nombre, organizacion, etapa, proximo, proximo_fecha from db_contactos where etapa not in ('ganado','perdido') and (proximo is not null or proximo_fecha is not null) order by proximo_fecha nulls last limit 12"),
    q<any>(`select p.id, p.nombre, p.estado, p.entrega, p.monto, c.organizacion, c.nombre contacto
            from db_proyectos p left join db_contactos c on c.id=p.contacto_id
            where p.estado in ('planificado','en_curso','pausado') order by p.entrega nulls last limit 12`),
    q<any>(`select k.id, k.nombre, k.organizacion, k.motivo, k.creado from consultas k
            where k.empresa='devisebit' and k.estado not in ('descartada') and not exists (select 1 from db_contactos c where c.consulta_id=k.id)
            order by k.creado desc limit 8`),
  ])
  const n = Object.fromEntries(cuenta.map((c) => [c.etapa, c.n]))
  const hoy = hoyISO()
  const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : null)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
      <div><h1 className="m-0">Resumen comercial</h1><p className="m-0 text-sm text-[#4A515C]">Embudo, próximos pasos y proyectos en curso.</p></div>
      <section aria-label="Embudo comercial" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ETAPAS.map((e) => (
          <Link key={e.v} href={`/contactos?etapa=${e.v}`} className="card flex flex-col gap-1 hover:border-[#C3C8D1]">
            <span className={`chip self-start ${e.c}`}>{e.n}</span>
            <span className="text-3xl font-extrabold text-[#0E1116]">{n[e.v] ?? 0}</span>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Próximos pasos</h2><Link href="/contactos/nuevo" className="btn-s py-1 px-3 text-xs">+ Contacto</Link></div>
          {proximos.length ? (
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[#EEF0F3]">
              {proximos.map((c) => {
                const f = iso(c.proximo_fecha)
                const vencido = f && f < hoy
                return (
                  <li key={c.id} className="py-2 flex items-start justify-between gap-3">
                    <div><Link href={`/contactos/${c.id}`} className="font-semibold hover:underline">{c.organizacion ?? c.nombre}</Link><div className="text-sm text-[#4A515C]">{c.proximo ?? "Sin detalle"}</div></div>
                    <div className="text-right shrink-0"><span className={`chip ${etapa(c.etapa).c}`}>{etapa(c.etapa).n}</span>{f && <div className={`text-xs mt-1 ${vencido ? "text-rojo font-semibold" : "text-[#4A515C]"}`}>{fecha(f)}</div>}</div>
                  </li>
                )
              })}
            </ul>
          ) : <p className="m-0 text-sm text-[#4A515C]">Sin próximos pasos cargados. Cargalos en cada contacto.</p>}
        </section>

        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Proyectos activos</h2><Link href="/proyectos/nuevo" className="btn-s py-1 px-3 text-xs">+ Proyecto</Link></div>
          {activos.length ? (
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[#EEF0F3]">
              {activos.map((p) => (
                <li key={p.id} className="py-2 flex items-start justify-between gap-3">
                  <div><Link href={`/proyectos/${p.id}`} className="font-semibold hover:underline">{p.nombre}</Link><div className="text-sm text-[#4A515C]">{p.organizacion ?? p.contacto ?? "Sin cliente"}{p.monto ? ` · ${pesos(p.monto)}` : ""}</div></div>
                  <div className="text-right shrink-0"><span className={`chip ${estadoProy(p.estado).c}`}>{estadoProy(p.estado).n}</span>{p.entrega && <div className="text-xs mt-1 text-[#4A515C]">Entrega {fecha(iso(p.entrega))}</div>}</div>
                </li>
              ))}
            </ul>
          ) : <p className="m-0 text-sm text-[#4A515C]">No hay proyectos en curso.</p>}
        </section>
      </div>

      {sinPasar.length > 0 && (
        <section className="card flex flex-col gap-3">
          <h2 className="m-0 text-base">Consultas del bot sin pasar a contacto</h2>
          <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[#EEF0F3]">
            {sinPasar.map((k) => (
              <li key={k.id} className="py-2 flex items-center justify-between gap-3">
                <div><span className="font-semibold">{k.organizacion ?? k.nombre ?? "Sin nombre"}</span><div className="text-sm text-[#4A515C]">{k.motivo ?? ""}</div></div>
                <Link href={`/consultas/${k.id}`} className="btn-s py-1 px-3 text-xs">Abrir</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
    </div>
  )
}
