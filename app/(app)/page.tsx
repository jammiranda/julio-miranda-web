import Link from "next/link"
import { q } from "@/lib/db"
import { ETAPAS, etapa, estadoProy } from "@/lib/crm"
import { fecha, hoyISO, pesos } from "@/lib/util"
import { local, calendarioConectado } from "@/lib/agenda"

export const dynamic = "force-dynamic"

export default async function Resumen({ searchParams }: { searchParams: { dias?: string } }) {
  const dias = [30, 90, 365].includes(Number(searchParams.dias)) ? Number(searchParams.dias) : 30
  const [cuenta, proximos, activos, sinPasar, fuentes, reuniones] = await Promise.all([
    q<{ etapa: string; n: number }>("select etapa, count(*)::int n from db_contactos where clase in ('oportunidad','cliente') group by etapa"),
    q<any>("select id, nombre, organizacion, etapa, proximo, proximo_fecha from db_contactos where coalesce(clase,'') not in ('descartado') and etapa not in ('ganado','perdido') and (proximo is not null or proximo_fecha is not null) order by proximo_fecha nulls last limit 12"),
    q<any>(`select p.id, p.nombre, p.estado, p.entrega, p.monto, c.organizacion, c.nombre contacto
            from db_proyectos p left join db_contactos c on c.id=p.contacto_id
            where p.estado in ('planificado','en_curso','pausado') order by p.entrega nulls last limit 12`),
    q<any>(`select k.id, k.nombre, k.organizacion, k.motivo, k.creado from consultas k
            where k.empresa='devisebit' and k.estado not in ('descartada') and not exists (select 1 from db_contactos c where c.consulta_id=k.id)
            order by k.creado desc limit 8`),
    q<{ fuente: string; leads: number; atendidas: number; contactos: number; ganados: number; campanias: string | null }>(
      `select coalesce(k.fuente,'Sin dato') fuente, count(*)::int leads,
              count(*) filter (where k.estado <> 'nueva')::int atendidas,
              count(c.id)::int contactos,
              count(c.id) filter (where c.etapa='ganado')::int ganados,
              string_agg(distinct k.campania, ' · ') campanias
       from consultas k left join db_contactos c on c.consulta_id=k.id
       where k.creado > now() - make_interval(days => $1)
       group by 1 order by leads desc`, [dias]),
    q<any>("select r.*, k.organizacion from db_reuniones r left join consultas k on k.id=r.consulta_id where r.estado='confirmada' and r.fin > now() order by r.inicio limit 10"),
  ])
  const totLeads = fuentes.reduce((a, f) => a + f.leads, 0)
  const n = Object.fromEntries(cuenta.map((c) => [c.etapa, c.n]))
  const hoy = hoyISO()
  const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : null)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
      <header className="pag-cab">
        <div><div className="eyebrow">Ventas</div><h1 className="m-0">Resumen comercial</h1><p>Embudo, próximos pasos y proyectos en curso.</p></div>
        <div className="pag-acc"><Link href="/proyectos/nuevo" className="btn-s">+ Proyecto</Link><Link href="/contactos/nuevo" className="btn-p">+ Contacto</Link></div>
      </header>
      <section aria-label="Embudo comercial" className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {ETAPAS.map((e) => (
          <Link key={e.v} href={`/contactos?etapa=${e.v}`} className="card card-link p-4 flex flex-col justify-between gap-3 min-h-[104px] transition-shadow">
            <span className={`chip self-start ${e.c}`}>{e.n}</span>
            <span className="text-3xl font-extrabold tabular-nums text-[#0E1116]">{n[e.v] ?? 0}</span>
          </Link>
        ))}
      </section>

      <section className="card flex flex-col gap-3" aria-label="Próximas reuniones">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-base">📅 Próximas reuniones</h2>{!(await calendarioConectado()) && <span className="text-xs text-[#4A515C]">Google Calendar sin conectar: las reuniones se ven acá y en los avisos.</span>}</div>
        {reuniones.length ? (
          <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[#EEF0F3]">{reuniones.map((r: any) => (
            <li key={r.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
              <div><Link href={`/consultas/${r.consulta_id}`} className="font-semibold hover:underline first-letter:uppercase">{local(new Date(r.inicio)).texto}</Link><div className="text-sm text-[#4A515C]">{r.nombre ?? "Cliente"}{r.organizacion ? ` · ${r.organizacion}` : ""} · {r.modalidad}</div></div>
              {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1 px-3 text-xs">Entrar</a>}
            </li>
          ))}</ul>
        ) : <p className="vacio">No hay reuniones agendadas. El bot las ofrece en cada conversación y el cliente las reserva solo.</p>}
      </section>

      <section className="card flex flex-col gap-3" aria-label="De dónde llegan los clientes">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="m-0 text-base">De dónde llegan</h2><p className="m-0 text-xs text-[#4A515C]">Consultas por origen: publicidad (Google Ads, Meta Ads), orgánico y directo.</p></div>
          <div className="flex gap-1">{[30, 90, 365].map((d) => <Link key={d} href={`/?dias=${d}`} className={`chip text-xs px-3 py-1 border ${dias === d ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{d === 365 ? "12 meses" : `${d} días`}</Link>)}</div>
        </div>
        {fuentes.length ? (
          <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
            <table className="tbl">
              <thead><tr><th>Origen</th><th className="text-right">Consultas</th><th>Participación</th><th className="text-right">Atendidas</th><th className="text-right">Al CRM</th><th className="text-right">Ganadas</th><th>Campañas</th></tr></thead>
              <tbody>{fuentes.map((f) => (
                <tr key={f.fuente}>
                  <td className={`font-semibold ${/Ads/.test(f.fuente) ? "text-[#C8231F]" : ""}`}>{f.fuente}</td>
                  <td className="text-right font-semibold">{f.leads}</td>
                  <td className="min-w-[120px]"><div className="h-2 rounded-full bg-[#EEF0F3] overflow-hidden"><div className="h-full bg-[#C8231F]" style={{ width: `${totLeads ? (100 * f.leads) / totLeads : 0}%` }} /></div></td>
                  <td className="text-right">{f.atendidas}</td><td className="text-right">{f.contactos}</td><td className="text-right">{f.ganados}</td>
                  <td className="text-xs text-[#4A515C] max-w-[260px] truncate" title={f.campanias ?? ""}>{f.campanias ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="vacio">Todavía no entraron consultas en este período.</p>}
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
          ) : <p className="vacio">Sin próximos pasos cargados. Cargalos en cada contacto.</p>}
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
          ) : <p className="vacio">No hay proyectos en curso.</p>}
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
