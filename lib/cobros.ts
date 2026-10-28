import { q, one } from "./db"
import { hoyISO } from "./util"

/**
 * Cobros de clientes: anticipos, cuotas, saldo y abono mensual por proyecto.
 * Son la base para el estado de cuenta del portal y para suspender el acceso por deuda.
 */

export const TIPOS_COBRO = [
  { v: "anticipo", n: "Anticipo" },
  { v: "cuota", n: "Cuota" },
  { v: "saldo", n: "Saldo final" },
  { v: "abono", n: "Abono mensual" },
  { v: "otro", n: "Otro" },
] as const
export const tipoCobro = (v: string) => TIPOS_COBRO.find((t) => t.v === v)?.n ?? v

export type Cobro = {
  id: number; contacto_id: number; proyecto_id: number | null; tipo: string; concepto: string; monto: string; moneda: string
  vence: string; periodo: string | null; estado: "pendiente" | "pagado" | "anulado"; pagado_en: string | null; medio: string | null; nota: string | null
  informado_en?: string | null; informado_detalle?: string | null
  recibo_nro?: number | null; factura_estado?: string | null; factura_tipo?: string | null; factura_nro?: string | null; factura_url?: string | null; factura_datos?: any
  proyecto?: string | null; dias_atraso?: number
}

export const plata = (monto: number | string, moneda = "ARS") =>
  `${moneda === "ARS" ? "$" : moneda + " "}${Number(monto).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`

// ── Configuración (tabla config) ──
export async function config(clave: string, def: string) {
  return (await one<{ valor: string }>("select valor from config where clave=$1", [clave]))?.valor ?? def
}
export async function guardarConfig(clave: string, valor: string) {
  await q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [clave, valor])
}
/** Días de atraso después de los cuales se suspende el portal (0 = nunca automático). */
export const diasBloqueo = async () => Math.max(0, Number(await config("portal_bloqueo_dias", "15")) || 0)

/** Cobros del contacto con días de atraso calculados (hora de Argentina). */
export async function cobrosDe(contactoId: number, incluirAnulados = false) {
  return await q<Cobro>(
    `select c.*, to_char(c.vence,'YYYY-MM-DD') vence, p.nombre proyecto,
       greatest(0, ((now() at time zone 'America/Argentina/Buenos_Aires')::date - c.vence))::int dias_atraso
     from db_cobros c left join db_proyectos p on p.id=c.proyecto_id
     where c.contacto_id=$1 ${incluirAnulados ? "" : "and c.estado<>'anulado'"} order by c.vence, c.id`,
    [contactoId],
  )
}

/** Resumen de cuenta: deuda vencida por moneda, próximo vencimiento y atraso máximo. */
export async function estadoCuenta(contactoId: number) {
  const cobros = await cobrosDe(contactoId)
  const pend = cobros.filter((c) => c.estado === "pendiente")
  const vencidos = pend.filter((c) => (c.dias_atraso ?? 0) > 0)
  const suma = (l: Cobro[]) => l.reduce<Record<string, number>>((a, c) => ((a[c.moneda] = (a[c.moneda] ?? 0) + Number(c.monto)), a), {})
  return {
    cobros,
    pendientes: pend,
    vencidos,
    deudaVencida: suma(vencidos),
    aPagar: suma(pend),
    atrasoMax: vencidos.reduce((m, c) => Math.max(m, c.dias_atraso ?? 0), 0),
    proximo: pend.find((c) => (c.dias_atraso ?? 0) === 0) ?? null,
  }
}
export const montos = (m: Record<string, number>) => Object.entries(m).map(([mon, v]) => plata(v, mon)).join(" + ") || "—"

/**
 * Acceso efectivo al portal según el sistema comercial:
 * - "bloqueado" a mano → no entra.
 * - "habilitado" a mano → entra aunque deba.
 * - "auto" → entra, salvo deuda vencida hace más de N días (queda suspendido y ve solo su estado de cuenta).
 */
export async function accesoDe(contactoId: number): Promise<{ estado: "ok" | "bloqueado" | "deuda"; atraso: number; deuda: string }> {
  const c = await one<{ portal_acceso: string }>("select portal_acceso from db_contactos where id=$1", [contactoId])
  if (c?.portal_acceso === "bloqueado") return { estado: "bloqueado", atraso: 0, deuda: "" }
  const dias = await diasBloqueo()
  const e = await estadoCuenta(contactoId)
  if (c?.portal_acceso !== "habilitado" && dias > 0 && e.atrasoMax > dias) return { estado: "deuda", atraso: e.atrasoMax, deuda: montos(e.deudaVencida) }
  return { estado: "ok", atraso: e.atrasoMax, deuda: montos(e.deudaVencida) }
}

/** Genera el abono del mes en curso de cada proyecto con abono activo (lo llama el cron diario; no duplica). */
export async function generarAbonos() {
  const hoy = hoyISO()
  const periodo = hoy.slice(0, 7)
  const r = await q<{ id: number }>(
    `insert into db_cobros(contacto_id, proyecto_id, tipo, concepto, monto, moneda, vence, periodo, creado_por)
     select p.contacto_id, p.id, 'abono', 'Abono mensual ' || $1 || ' · ' || p.nombre, p.abono_monto, p.abono_moneda,
            make_date(split_part($1,'-',1)::int, split_part($1,'-',2)::int, least(greatest(coalesce(p.abono_dia,10),1),28)), $1, 'automático'
     from db_proyectos p
     where p.contacto_id is not null and p.abono_monto > 0 and p.estado not in ('cancelado','pausado')
       and coalesce(p.abono_desde, '2000-01-01') <= $2::date and (p.abono_hasta is null or p.abono_hasta >= $2::date)
     on conflict (proyecto_id, periodo) where tipo='abono' and estado<>'anulado' do nothing returning id`,
    [periodo, hoy],
  )
  return r.length
}
