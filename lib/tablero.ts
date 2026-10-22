import { q, one } from "./db"
import { rangoPeriodo, hoyISO } from "./util"

export type PacMes = {
  id: number
  apellido_nombre: string
  localidad: string | null
  estado: string
  modulo: string | null
  op_estado: string | null
  fecha_vencimiento: string | null
  enf: number
  kin: number
  med: number
  otras: number
  sin_app: number
  equipos: number
  sub: number
}

/** Pacientes con OP activa en el período + sus visitas realizadas. */
export async function datosMes(periodo: string) {
  const { ini, fin } = rangoPeriodo(periodo)
  const tar = Object.fromEntries((await q<{ clave: string; valor: string }>("select clave, valor from tarifas")).map((t) => [t.clave, Number(t.valor)]))
  const rows = await q<PacMes>(
    `with op as (
       select distinct on (paciente_id) paciente_id, modulo, estado, fecha_vencimiento
       from ordenes
       where fecha_inicio <= $2 and (fecha_vencimiento is null or fecha_vencimiento >= $1) and estado <> 'baja'
       order by paciente_id, fecha_inicio desc
     ), v as (
       select paciente_id,
         count(*) filter (where tipo='enfermeria')::int enf,
         count(*) filter (where tipo='kinesiologia')::int kin,
         count(*) filter (where tipo='medico')::int med,
         count(*) filter (where tipo in ('fonoaudiologia','cuidador'))::int otras,
         count(*) filter (where not app_pami)::int sin_app
       from visitas where estado='realizada' and fecha between $1 and $2 group by paciente_id
     ), e as (
       select paciente_id, count(*)::int equipos from equipamiento
       where (fecha_entrega is null or fecha_entrega <= $2) and (fecha_retiro is null or fecha_retiro >= $1) group by paciente_id
     )
     select p.id, p.apellido_nombre, p.localidad, p.estado, op.modulo, op.estado op_estado, op.fecha_vencimiento,
       coalesce(v.enf,0) enf, coalesce(v.kin,0) kin, coalesce(v.med,0) med, coalesce(v.otras,0) otras, coalesce(v.sin_app,0) sin_app,
       coalesce(e.equipos,0) equipos
     from pacientes p join op on op.paciente_id=p.id
     left join v on v.paciente_id=p.id left join e on e.paciente_id=p.id
     order by p.apellido_nombre`,
    [ini, fin],
  )
  for (const r of rows) r.sub = r.enf * (tar.enfermeria ?? 0) + r.kin * (tar.kinesiologia ?? 0) + r.med * (tar.medico ?? 0)
  const cierre = await one<{ factura_real: string | null; cobra_en: string | null; cerrado: boolean }>("select * from cierres where periodo=$1", [periodo])
  const hist = await one<{ padron: number; facturacion: string; enf: number; kin: number; med: number; cobra_en: string }>("select * from historico where periodo=$1", [periodo])
  return { rows, tarifas: tar, cierre, hist }
}

export async function resumen(periodo: string) {
  const { rows, tarifas, cierre, hist } = await datosMes(periodo)
  const hoy = hoyISO()
  const en7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  const tot = rows.reduce(
    (a, r) => ({ enf: a.enf + r.enf, kin: a.kin + r.kin, med: a.med + r.med, otras: a.otras + r.otras, sinApp: a.sinApp + r.sin_app, sub: a.sub + r.sub, equipos: a.equipos + (r.equipos > 0 ? 1 : 0) }),
    { enf: 0, kin: 0, med: 0, otras: 0, sinApp: 0, sub: 0, equipos: 0 },
  )
  const usarHist = rows.length === 0 && hist
  const padron = usarHist ? hist!.padron : rows.length
  const visitas = usarHist ? hist!.enf + hist!.kin + hist!.med : tot.enf + tot.kin + tot.med + tot.otras
  const mix: Record<string, number> = {}
  for (const r of rows) mix[r.modulo ?? "—"] = (mix[r.modulo ?? "—"] ?? 0) + 1
  const factura = cierre?.factura_real != null ? Number(cierre.factura_real) : usarHist ? Number(hist!.facturacion) : null
  const vencen = await q<{ id: number; apellido_nombre: string; modulo: string; fecha_vencimiento: string }>(
    `select p.id, p.apellido_nombre, o.modulo, o.fecha_vencimiento from ordenes o join pacientes p on p.id=o.paciente_id
     where o.estado='vigente' and p.estado='activo' and o.fecha_vencimiento between $1 and $2 order by o.fecha_vencimiento`,
    [hoy, en7],
  )
  const vencidas = await q<{ id: number; apellido_nombre: string; modulo: string; fecha_vencimiento: string }>(
    `select p.id, p.apellido_nombre, o.modulo, o.fecha_vencimiento from ordenes o join pacientes p on p.id=o.paciente_id
     where o.estado='vigente' and p.estado='activo' and o.fecha_vencimiento < $1 order by o.fecha_vencimiento`,
    [hoy],
  )
  const sinVisita = await q<{ id: number; apellido_nombre: string; ultima: string | null }>(
    `select p.id, p.apellido_nombre, max(v.fecha) ultima from pacientes p
     join ordenes o on o.paciente_id=p.id and o.estado='vigente'
     left join visitas v on v.paciente_id=p.id and v.estado='realizada'
     where p.estado='activo' group by p.id, p.apellido_nombre
     having max(v.fecha) is null or max(v.fecha) < $1 order by ultima nulls first`,
    [new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)],
  )
  const hoyAgenda = await one<{ prog: number; real: number }>(
    "select count(*) filter (where estado='programada')::int prog, count(*) filter (where estado='realizada')::int real from visitas where fecha=$1",
    [hoy],
  )
  const porLocalidad: Record<string, number> = {}
  for (const r of rows) porLocalidad[r.localidad ?? "Sin dato"] = (porLocalidad[r.localidad ?? "Sin dato"] ?? 0) + 1
  return {
    periodo, rows, tarifas, padron, visitas, tot: usarHist ? { ...tot, enf: hist!.enf, kin: hist!.kin, med: hist!.med } : tot,
    mix, factura, estimado: tot.sub, cobraEn: cierre?.cobra_en ?? hist?.cobra_en ?? null, cerrado: !!cierre?.cerrado,
    vencen, vencidas, sinVisita, hoyAgenda: hoyAgenda ?? { prog: 0, real: 0 }, porLocalidad, desdeHistorico: !!usarHist,
    appPct: visitas > 0 && !usarHist ? Math.round(((visitas - tot.sinApp) / visitas) * 100) : null,
  }
}

export async function serie(periodos: string[]) {
  const out: { periodo: string; padron: number; facturacion: number | null; visitas: number }[] = []
  for (const p of [...periodos].reverse()) {
    const r = await resumen(p)
    if (r.padron > 0 || r.factura) out.push({ periodo: p, padron: r.padron, facturacion: r.factura, visitas: r.visitas })
  }
  return out
}
