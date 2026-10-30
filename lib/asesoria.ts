import { q, one, audit } from "./db"
import { hoyISO, nombrePeriodo } from "./util"
import { notificar } from "./push"

/**
 * Horas de asesoría por proyecto.
 * - Bolsa: N horas que vencen a los X días. Una hora estratégica descuenta 1,5 h.
 * - Abono: N horas por mes. Lo no usado de un mes pasa al siguiente una sola vez (se consume primero lo que pasó).
 *   Lo que supera lo disponible es hora extra ($65.000, con aviso previo).
 * Al llegar al 80% y al 100% se avisa al equipo (una vez por plan y por mes, o por bolsa).
 */
export const FORMATOS = [
  { v: "bolsa10", n: "Bolsa de 10 horas", tipo: "bolsa", horas: 10, dias: 90 },
  { v: "bolsa20", n: "Bolsa de 20 horas", tipo: "bolsa", horas: 20, dias: 120 },
  { v: "bolsa40", n: "Bolsa de 40 horas", tipo: "bolsa", horas: 40, dias: 180 },
  { v: "cabecera", n: "Asesor de cabecera", tipo: "abono", horas: 6, dias: 0 },
  { v: "parcial", n: "Tecnología a tiempo parcial", tipo: "abono", horas: 16, dias: 0 },
  { v: "transformacion", n: "Transformación acompañada", tipo: "abono", horas: 24, dias: 0 },
  { v: "bolsa", n: "Bolsa a medida", tipo: "bolsa", horas: 0, dias: 90 },
  { v: "abono", n: "Abono a medida", tipo: "abono", horas: 0, dias: 0 },
] as const
export const formato = (v: string) => FORMATOS.find((f) => f.v === v)
export const HORA_EXTRA = 65000
export const FACTOR_ESTRATEGICA = 1.5
export const UMBRALES = [80, 100] as const

export type Plan = { id: number; proyecto_id: number; formato: string; nombre: string; tipo: "bolsa" | "abono"; horas: number; inicio: string; vence: string | null; fin: string | null; activo: boolean }
export type Hora = { id: number; proyecto_id: number; plan_id: number | null; fecha: string; persona: string; tema: string; minutos: number; tipo: "tecnica" | "estrategica"; cargado_por: string | null }
export type Mes = { periodo: string; horas: number; arrastre: number; disponible: number; usado: number; excedente: number; pasa: number }
export type Saldo = {
  plan: Plan; total: number; usado: number; restante: number; excedente: number; pct: number; periodo: string
  vencida: boolean; diasParaVencer: number | null; meses: Mes[]
}

const n = (x: unknown) => Number(x ?? 0)
const r2 = (x: number) => Math.round(x * 100) / 100
const mesDe = (d: string) => d.slice(0, 7)
function sumarMes(p: string, k: number) {
  const [y, m] = p.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + k, 1))
  return d.toISOString().slice(0, 7)
}
const dias = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000)

/** Horas que descuenta cada carga (en bolsa, la estratégica pesa 1,5). */
export const descuenta = (p: Pick<Plan, "tipo"> | null, h: Pick<Hora, "minutos" | "tipo">) => (h.minutos / 60) * (p?.tipo === "bolsa" && h.tipo === "estrategica" ? FACTOR_ESTRATEGICA : 1)

export const fmtHoras = (h: number) => {
  const v = r2(h)
  return `${v.toLocaleString("es-AR", { maximumFractionDigits: 2 })} h`
}
export const fmtDuracion = (min: number) => (min % 60 ? `${Math.floor(min / 60) ? `${Math.floor(min / 60)} h ` : ""}30 min` : `${min / 60} h`)

/** Saldo de un plan. En abonos, `periodo` es el mes que se mira (por defecto, el actual o el último del plan). */
export function saldo(plan: Plan, horas: Hora[], periodo?: string): Saldo {
  const hoy = hoyISO()
  const mias = horas.filter((h) => h.plan_id === plan.id)
  if (plan.tipo === "bolsa") {
    const usado = r2(mias.reduce((a, h) => a + descuenta(plan, h), 0))
    const total = n(plan.horas)
    return {
      plan, total, usado, restante: r2(Math.max(0, total - usado)), excedente: r2(Math.max(0, usado - total)), pct: total ? Math.round((100 * usado) / total) : 0,
      periodo: "bolsa", vencida: !!plan.vence && hoy > plan.vence, diasParaVencer: plan.vence ? dias(hoy, plan.vence) : null, meses: [],
    }
  }
  // Abono: se recorre mes a mes desde el inicio para calcular lo que pasa de un mes al otro
  const ini = mesDe(plan.inicio)
  const ultimo = [mesDe(hoy), ...(plan.fin ? [mesDe(plan.fin)] : []), ...mias.map((h) => mesDe(h.fecha))].reduce((a, b) => (b > a ? b : a), ini)
  const hasta = plan.fin && mesDe(plan.fin) < ultimo ? mesDe(plan.fin) : ultimo
  const meses: Mes[] = []
  let arrastre = 0
  for (let p = ini, i = 0; p <= hasta && i < 240; p = sumarMes(p, 1), i++) {
    const cupo = n(plan.horas)
    const usado = r2(mias.filter((h) => mesDe(h.fecha) === p).reduce((a, h) => a + descuenta(plan, h), 0))
    const disponible = r2(cupo + arrastre)
    const propias = Math.max(0, usado - arrastre) // primero se usa lo que pasó del mes anterior
    const pasa = r2(Math.max(0, cupo - propias))
    meses.push({ periodo: p, horas: cupo, arrastre, disponible, usado, excedente: r2(Math.max(0, usado - disponible)), pasa })
    arrastre = pasa
  }
  const per = periodo ?? (mesDe(hoy) <= hasta ? (mesDe(hoy) >= ini ? mesDe(hoy) : ini) : hasta)
  const m = meses.find((x) => x.periodo === per) ?? { periodo: per, horas: n(plan.horas), arrastre: 0, disponible: n(plan.horas), usado: 0, excedente: 0, pasa: 0 }
  return {
    plan, total: m.disponible, usado: m.usado, restante: r2(Math.max(0, m.disponible - m.usado)), excedente: m.excedente,
    pct: m.disponible ? Math.round((100 * m.usado) / m.disponible) : 0, periodo: per, vencida: !!plan.fin && hoy > plan.fin, diasParaVencer: null, meses,
  }
}

export async function planesDe(pid: number) {
  return (await q<any>("select a.*, to_char(a.inicio,'YYYY-MM-DD') inicio, to_char(a.vence,'YYYY-MM-DD') vence, to_char(a.fin,'YYYY-MM-DD') fin from as_planes a where a.proyecto_id=$1 order by a.activo desc, a.inicio desc, a.id desc", [pid]))
    .map((p) => ({ ...p, horas: n(p.horas) })) as Plan[]
}
export async function horasDe(pid: number) {
  return await q<Hora>("select h.*, to_char(h.fecha,'YYYY-MM-DD') fecha from as_horas h where h.proyecto_id=$1 order by h.fecha desc, h.id desc", [pid])
}

/** Todo lo de asesoría de un proyecto: planes con su saldo y horas (para el equipo y para el portal). */
export async function asesoriaDe(pid: number) {
  const [planes, horas] = await Promise.all([planesDe(pid), horasDe(pid)])
  return { planes, horas, saldos: planes.map((p) => saldo(p, horas)) }
}

/** Plan que corresponde a una fecha: el activo cuyo período la incluye (si hay varios, el más nuevo). */
export function planPara(planes: Plan[], fecha: string) {
  return planes.find((p) => p.activo && p.inicio <= fecha && (p.tipo === "bolsa" ? !p.vence || fecha <= p.vence : !p.fin || fecha <= p.fin)) ?? null
}

export function venceBolsa(inicio: string, d: number) {
  const x = new Date(inicio + "T12:00:00Z")
  x.setUTCDate(x.getUTCDate() + d)
  return x.toISOString().slice(0, 10)
}

/** Avisa al equipo cuando el plan llega al 80% o al 100% (una vez por umbral y por mes/bolsa). */
export async function revisarUmbrales(planId: number, periodo?: string, quien?: { id: number; usuario: string }) {
  const plan = (await q<any>("select a.*, to_char(a.inicio,'YYYY-MM-DD') inicio, to_char(a.vence,'YYYY-MM-DD') vence, to_char(a.fin,'YYYY-MM-DD') fin, p.nombre proyecto, coalesce(c.organizacion, c.nombre) cliente from as_planes a join db_proyectos p on p.id=a.proyecto_id left join db_contactos c on c.id=p.contacto_id where a.id=$1", [planId]))[0]
  if (!plan) return []
  plan.horas = n(plan.horas)
  const s = saldo(plan, await horasDe(plan.proyecto_id), plan.tipo === "abono" ? periodo : undefined)
  const enviados: number[] = []
  for (const u of UMBRALES) {
    if (s.pct < u) continue
    const nuevo = await one("insert into as_avisos(plan_id,periodo,umbral) values ($1,$2,$3) on conflict do nothing returning umbral", [plan.id, s.periodo, u])
    if (!nuevo) continue
    enviados.push(u)
    const cuando = plan.tipo === "abono" ? ` en ${nombrePeriodo(s.periodo)}` : ""
    const extra = u >= 100
      ? plan.tipo === "abono" ? ` Lo que exceda se cobra como hora extra ($${HORA_EXTRA.toLocaleString("es-AR")}) con aviso previo al cliente.` : " Ofrecele otra bolsa o un abono."
      : ""
    await notificar(["gerente", "coordinacion"], `⏱️ Asesoría al ${u}%`, `${plan.cliente ?? plan.proyecto} · ${plan.nombre}: usó ${fmtHoras(s.usado)} de ${fmtHoras(s.total)}${cuando}.${extra}`, `/proyectos/${plan.proyecto_id}#asesoria`).catch(() => {})
    await audit(quien ?? null, "asesoria_aviso", "as_plan", plan.id, `${u}% ${s.periodo}`)
  }
  return enviados
}

/** Para Avisos: planes activos que pasaron el 80% este mes (abonos) o en la bolsa vigente. */
export async function planesEnAlerta() {
  const per = hoyISO().slice(0, 7)
  return await q<{ plan_id: number; proyecto_id: number; umbral: number }>(
    `select a.plan_id, p.proyecto_id, max(a.umbral)::int umbral from as_avisos a join as_planes p on p.id=a.plan_id
     where p.activo and ((p.tipo='bolsa' and a.periodo='bolsa' and (p.vence is null or p.vence >= (now() at time zone 'America/Argentina/Buenos_Aires')::date)) or (p.tipo='abono' and a.periodo=$1))
     group by a.plan_id, p.proyecto_id order by umbral desc`,
    [per],
  )
}

/** ¿El cliente tiene asesoría (planes u horas) en alguno de sus proyectos? */
export async function tieneAsesoria(cid: number) {
  const r = await one<{ ok: boolean }>("select exists(select 1 from db_proyectos p where p.contacto_id=$1 and p.estado<>'cancelado' and (exists(select 1 from as_planes a where a.proyecto_id=p.id) or exists(select 1 from as_horas h where h.proyecto_id=p.id))) ok", [cid])
  return !!r?.ok
}
