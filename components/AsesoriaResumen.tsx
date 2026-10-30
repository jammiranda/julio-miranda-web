import type { ReactNode } from "react"
import { descuenta, fmtDuracion, fmtHoras, HORA_EXTRA, type Hora, type Plan, type Saldo } from "@/lib/asesoria"
import { fecha, nombrePeriodo } from "@/lib/util"

/** Saldo y detalle de horas de asesoría. Lo usan el equipo (proyecto) y el cliente (portal). */
export default function AsesoriaResumen({ planes, horas, saldos, cliente = false, accion }: { planes: Plan[]; horas: Hora[]; saldos: Saldo[]; cliente?: boolean; accion?: (h: Hora) => ReactNode }) {
  const planDe = (id: number | null) => planes.find((p) => p.id === id) ?? null
  const activos = saldos.filter((s) => s.plan.activo)
  const otros = saldos.filter((s) => !s.plan.activo)
  return (
    <div className="flex flex-col gap-4">
      {!planes.length && <p className="m-0 text-sm text-[#4A515C]">{cliente ? "Todavía no tenés una bolsa ni un abono de asesoría. Las horas sueltas aparecen abajo." : "Sin bolsa ni abono cargado: las horas quedan como horas sueltas."}</p>}
      {activos.length > 0 && (
        <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-3">
          {activos.map((s) => <Tarjeta key={s.plan.id} s={s} cliente={cliente} />)}
        </ul>
      )}
      {otros.length > 0 && <p className="m-0 text-xs text-[#4A515C]">Planes anteriores: {otros.map((s) => `${s.plan.nombre} (${fecha(s.plan.inicio)})`).join(" · ")}</p>}

      <div>
        <h3 className="m-0 mb-2 text-sm font-bold">Detalle de horas ({horas.length})</h3>
        {!horas.length ? <p className="m-0 text-sm text-[#4A515C]">Todavía no hay horas registradas.</p> : (
          <>
          <ul className="md:hidden m-0 p-0 list-none flex flex-col divide-y divide-[#EEF0F3] border-y border-[#EEF0F3]">
            {horas.map((h) => {
              const p = planDe(h.plan_id)
              return (
                <li key={h.id} className="py-2.5 flex flex-col gap-0.5">
                  <div className="flex justify-between gap-2 text-xs text-[#4A515C]"><span>{fecha(h.fecha)} · {h.tipo === "estrategica" ? "Estratégica" : "Técnica"}</span><span className="whitespace-nowrap font-semibold text-[#0E1116]">{fmtDuracion(h.minutos)}{p && descuenta(p, h) * 60 !== h.minutos ? ` (descuenta ${fmtHoras(descuenta(p, h))})` : ""}</span></div>
                  <span className="text-sm">{h.tema}</span>
                  <div className="flex justify-between gap-2 text-xs text-[#4A515C]"><span>{h.persona} · {p ? p.nombre : "Hora suelta"}</span>{accion && accion(h)}</div>
                </li>
              )
            })}
          </ul>
          <div className="hidden md:block overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Fecha</th><th>Tema</th><th>Persona</th><th>Tipo</th><th className="text-right">Duración</th><th className="text-right">Descuenta</th>{accion && <th></th>}</tr></thead>
              <tbody>
                {horas.map((h) => {
                  const p = planDe(h.plan_id)
                  return (
                    <tr key={h.id}>
                      <td className="whitespace-nowrap">{fecha(h.fecha)}</td>
                      <td className="min-w-[180px]">{h.tema}<span className="block text-xs text-[#4A515C]">{p ? p.nombre : "Hora suelta"}</span></td>
                      <td>{h.persona}</td>
                      <td>{h.tipo === "estrategica" ? "Estratégica" : "Técnica"}</td>
                      <td className="text-right whitespace-nowrap">{fmtDuracion(h.minutos)}</td>
                      <td className="text-right whitespace-nowrap">{p ? fmtHoras(descuenta(p, h)) : "—"}</td>
                      {accion && <td className="text-right">{accion(h)}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  )
}

function Tarjeta({ s, cliente }: { s: Saldo; cliente: boolean }) {
  const p = s.plan
  const color = s.pct >= 100 ? "bg-[#C8231F]" : s.pct >= 80 ? "bg-amber-500" : "bg-[#0E1116]"
  return (
    <li className="rounded-xl border border-[#E2E5EA] bg-white p-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <strong className="block leading-snug">{p.nombre}</strong>
          <span className="text-xs text-[#4A515C]">
            {p.tipo === "bolsa"
              ? <>Bolsa de {fmtHoras(p.horas)} · desde {fecha(p.inicio)}{p.vence ? ` · vence ${fecha(p.vence)}` : ""}</>
              : <>Abono de {fmtHoras(p.horas)} por mes · {nombrePeriodo(s.periodo)}</>}
          </span>
        </div>
        {s.vencida ? <span className="chip bg-slate-100 text-slate-600">{p.tipo === "bolsa" ? "Vencida" : "Terminado"}</span>
          : s.pct >= 100 ? <span className="chip bg-red-50 text-rojo">{p.tipo === "bolsa" ? "Agotada" : "Cupo del mes usado"}</span>
          : s.pct >= 80 ? <span className="chip bg-amber-50 text-amber-700">{s.pct}% usado</span> : null}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold">{fmtHoras(s.restante)}<span className="text-sm font-normal text-[#4A515C]"> {p.tipo === "bolsa" ? "disponibles" : "disponibles este mes"}</span></span>
        <span className="text-sm text-[#4A515C]">usadas {fmtHoras(s.usado)} de {fmtHoras(s.total)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#E2E5EA] overflow-hidden" role="progressbar" aria-label={`Horas usadas de ${p.nombre}`} aria-valuenow={Math.min(100, s.pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
      </div>
      {p.tipo === "abono" && (() => {
        const m = s.meses.find((x) => x.periodo === s.periodo)
        return m ? <span className="text-xs text-[#4A515C]">{m.horas} h del mes{m.arrastre ? ` + ${fmtHoras(m.arrastre)} que pasaron del mes anterior` : ""}. Lo que no uses pasa al mes siguiente una sola vez.</span> : null
      })()}
      {p.tipo === "bolsa" && !s.vencida && s.diasParaVencer != null && <span className="text-xs text-[#4A515C]">Faltan {s.diasParaVencer} días para el vencimiento. Una hora estratégica descuenta 1,5 h.</span>}
      {s.excedente > 0 && <span className="text-xs font-semibold text-rojo">{fmtHoras(s.excedente)} por encima de lo disponible{p.tipo === "abono" ? ` · hora extra $${HORA_EXTRA.toLocaleString("es-AR")}${cliente ? ", te avisamos antes de cobrarla" : " (avisar al cliente)"}` : ""}.</span>}
      {!cliente && p.tipo === "abono" && s.meses.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer underline text-[#4A515C]">Meses anteriores</summary>
          <ul className="m-0 mt-1 pl-4">{s.meses.slice().reverse().filter((m) => m.periodo !== s.periodo).map((m) => <li key={m.periodo}>{nombrePeriodo(m.periodo)}: usó {fmtHoras(m.usado)} de {fmtHoras(m.disponible)}{m.excedente ? ` · ${fmtHoras(m.excedente)} extra` : ""}</li>)}</ul>
        </details>
      )}
    </li>
  )
}
