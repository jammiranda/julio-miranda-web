import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { ESTADOS_MOD, dinero, isoD, sumarDias } from "@/lib/gestion"
import { fecha, hoyISO, nombrePeriodo, periodoActual, rangoPeriodo } from "@/lib/util"
import { Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type Item = { f: string; t: string; d: string; area: string; href: string; monto?: string }
const AREA_C: Record<string, string> = { Cobro: "bg-emerald-50 text-emerald-700", Pago: "bg-red-50 text-rojo", Legal: "bg-violet-50 text-violet-700", Contrato: "bg-violet-50 text-violet-700", Licitación: "bg-amber-50 text-amber-700", Proyecto: "bg-sky-50 text-sky-700", Módulo: "bg-slate-100 text-slate-700" }
const PUNTO: Record<string, string> = { sin_empezar: "#94A3B8", en_curso: "#D97706", trabado: "#DC2626", listo: "#059669" }

export default async function TableroDireccion() {
  const u = await requerir()
  const fin = u.rol === "gerente" || u.rol === "coordinacion"
  const hoy = hoyISO()
  const h30 = sumarDias(hoy, 30)
  const per = periodoActual()
  const { ini, fin: finMes } = rangoPeriodo(per)

  const [num, mods, agenda] = await Promise.all([
    q<any>(
      `select
        (select count(*) from db_contactos where etapa in ('conversando','reunion','propuesta') and coalesce(clase,'')<>'descartado')::int oportunidades,
        (select count(*) from db_contactos where etapa='propuesta' and coalesce(clase,'')<>'descartado')::int propuestas,
        (select count(*) from db_proyectos where estado in ('planificado','en_curso','pausado'))::int proyectos,
        (select count(*) from db_proyectos where estado in ('planificado','en_curso','pausado') and entrega < $1)::int proy_tarde,
        coalesce((select sum(monto) from db_cobros where estado='pagado' and moneda='ARS' and (pagado_en at time zone 'America/Argentina/Buenos_Aires')::date between $3 and $4),0)
          + coalesce((select sum(monto) from g_movimientos where tipo='ingreso' and estado='pagado' and moneda='ARS' and fecha between $3 and $4),0) ing,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pagado' and moneda='ARS' and fecha between $3 and $4),0) egr,
        coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda='ARS' and vence < $1),0) cobrar_venc,
        (select count(*) from g_contratos where estado='firmado' and vence between $1 and ($1::date + 60))::int contratos_vencen,
        (select count(*) from g_contratos where estado in ('borrador','en_revision'))::int contratos_firma,
        (select count(*) from g_vencimientos where estado='pendiente' and vence <= $2)::int venc_30,
        (select count(*) from g_vencimientos where estado='pendiente' and vence < $1)::int venc_tarde,
        (select count(*) from g_licitaciones where estado in ('detectada','analizando','preparando','presentada'))::int licitaciones,
        (select count(*) from g_documentos)::int documentos`, [hoy, h30, ini, finMes]),
    q<any>("select * from g_modulos order by orden"),
    q<Item>(
      `select * from (
        select k.vence::text f, k.concepto t, coalesce(c.organizacion,c.nombre) d, 'Cobro' area, '/proyectos/'||coalesce(k.proyecto_id::text,'') href, k.monto::text||' '||k.moneda monto
          from db_cobros k join db_contactos c on c.id=k.contacto_id where k.estado='pendiente' and k.vence <= $2
        union all select coalesce(m.vence,m.fecha)::text, m.concepto, coalesce(p.nombre, m.categoria, 'Gasto'), 'Pago', '/finanzas?ver=movimientos&editar='||m.id, m.monto::text||' '||m.moneda
          from g_movimientos m left join g_proveedores p on p.id=m.proveedor_id where m.tipo='egreso' and m.estado='pendiente' and coalesce(m.vence,m.fecha,$1) <= $2
        union all select v.vence::text, v.titulo, coalesce(v.responsable,''), 'Legal', '/legales?ver=vencimientos&editar='||v.id, v.monto::text||' ARS'
          from g_vencimientos v where v.estado='pendiente' and v.vence <= $2
        union all select g.vence::text, g.titulo, coalesce(g.contraparte,''), 'Contrato', '/legales?ver=contratos&editar='||g.id, null
          from g_contratos g where g.estado='firmado' and g.vence <= ($1::date + 60)
        union all select l.apertura::text, l.objeto, l.organismo, 'Licitación', '/licitaciones?editar='||l.id, l.monto_estimado::text||' '||l.moneda
          from g_licitaciones l where l.estado in ('detectada','analizando','preparando','presentada') and l.apertura <= $2
        union all select p.entrega::text, 'Entrega: '||p.nombre, coalesce(c.organizacion,c.nombre,''), 'Proyecto', '/proyectos/'||p.id, null
          from db_proyectos p left join db_contactos c on c.id=p.contacto_id where p.estado in ('planificado','en_curso','pausado') and p.entrega <= $2
        union all select m.fecha::text, m.nombre||': '||coalesce(m.proximo,''), m.responsable, 'Módulo', '/modulos#'||m.codigo, null
          from g_modulos m where m.estado<>'listo' and m.fecha <= $2
      ) x where f is not null order by f limit 40`, [hoy, h30]),
  ])
  const n = num[0]
  const res = Number(n.ing) - Number(n.egr)
  const trabados = mods.filter((m) => m.estado === "trabado")
  const visibles = fin ? agenda : agenda.filter((a) => !["Cobro", "Pago"].includes(a.area))
  const montoTxt = (m?: string) => { if (!m) return null; const [v, mon] = m.split(" "); return v && v !== "null" ? dinero(v, mon) : null }

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Dirección</div><h1 className="m-0">Tablero de dirección</h1><p>Toda la empresa en una pantalla: ventas, plata, legales, licitaciones y el estado de los 10 módulos. {nombrePeriodo(per)}.</p></div>
        <div className="pag-acc"><Link href="/modulos" className="btn-s">Actualizar módulos</Link>{fin && <Link href="/finanzas" className="btn-p">Ver finanzas</Link>}</div>
      </header>

      <section aria-label="Indicadores" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fin && <Kpi t="Resultado del mes" v={dinero(res)} d={`${dinero(n.ing)} entró · ${dinero(n.egr)} salió`} tono={res >= 0 ? "verde" : "rojo"} href="/finanzas" />}
        {fin && <Kpi t="Cobros vencidos" v={dinero(n.cobrar_venc)} d={Number(n.cobrar_venc) ? "Reclamar esta semana" : "Nada vencido"} tono={Number(n.cobrar_venc) ? "rojo" : "verde"} href="/finanzas" />}
        <Kpi t="Oportunidades abiertas" v={n.oportunidades} d={`${n.propuestas} con propuesta enviada`} href="/contactos" />
        <Kpi t="Proyectos activos" v={n.proyectos} d={n.proy_tarde ? `${n.proy_tarde} con entrega vencida` : "Entregas al día"} tono={n.proy_tarde ? "rojo" : undefined} href="/proyectos" />
        {fin && <Kpi t="Legales" v={n.venc_30} d={n.venc_tarde ? `${n.venc_tarde} vencidos sin resolver` : `vencimientos en 30 días · ${n.contratos_firma} contratos a firmar`} tono={n.venc_tarde ? "rojo" : n.venc_30 ? "ambar" : undefined} href="/legales?ver=vencimientos" />}
        <Kpi t="Licitaciones abiertas" v={n.licitaciones} href="/licitaciones" />
        <Kpi t="Módulos trabados" v={trabados.length} d={trabados.length ? trabados.map((t) => t.nombre).join(", ") : "Nada trabado"} tono={trabados.length ? "rojo" : "verde"} href="/modulos" />
        <Kpi t="Documentos" v={n.documentos} d="En el repositorio" href="/documentos" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
        <section className="card flex flex-col gap-3" aria-label="Lo que viene">
          <div><h2 className="m-0 text-base">Lo que viene · próximos 30 días</h2><p className="m-0 text-xs text-[var(--gris)]">Cobros, pagos, vencimientos legales, contratos, aperturas de licitaciones, entregas y próximos pasos de cada módulo, en un solo orden.</p></div>
          {visibles.length ? (
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--borde-2)]">
              {visibles.map((a, i) => {
                const f = isoD(a.f)!
                const tarde = f < hoy
                const m = fin ? montoTxt(a.monto) : null
                return (
                  <li key={i}>
                    <Link href={a.href.endsWith("/") ? "/finanzas" : a.href} className="py-2.5 flex items-center gap-3 hover:bg-[var(--sup-2)] -mx-2 px-2 rounded-lg">
                      <span className={`w-[86px] shrink-0 text-xs font-semibold tabular-nums ${tarde ? "text-rojo" : "text-[var(--gris)]"}`}>{tarde ? "Vencido" : fecha(f).slice(0, 5)}<span className="block font-normal">{tarde ? fecha(f).slice(0, 5) : ""}</span></span>
                      <span className={`chip shrink-0 ${AREA_C[a.area]}`}>{a.area}</span>
                      <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{a.t}</span>{a.d && <span className="block text-xs text-[var(--gris)] truncate">{a.d}</span>}</span>
                      {m && <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{m}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : <p className="vacio">Nada con fecha en los próximos 30 días. A medida que cargues cobros, gastos, vencimientos y licitaciones, aparecen acá.</p>}
        </section>

        <section className="card flex flex-col gap-3" aria-label="Módulos">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Los 10 módulos</h2><Link href="/modulos" className="btn-s py-1 px-3 text-xs">Abrir</Link></div>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {mods.map((m, i) => {
              const e = ESTADOS_MOD.find((x) => x.v === m.estado)!
              return (
                <li key={m.codigo}>
                  <Link href={`/modulos#${m.codigo}`} className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-[var(--sup-2)]">
                    <span className="text-[11px] font-bold tabular-nums text-[var(--ac-texto)] w-5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PUNTO[m.estado] }} aria-hidden="true" />
                    <span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{m.nombre}</span>{(m.bloqueo || m.proximo) && <span className={`block text-xs truncate ${m.bloqueo ? "text-rojo" : "text-[var(--gris)]"}`}>{m.bloqueo ? `Trabado: ${m.bloqueo}` : m.proximo}</span>}</span>
                    <span className="text-xs text-[var(--gris)] shrink-0">{e.n}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
