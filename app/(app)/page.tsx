import Link from "next/link"
import { requerir, puede } from "@/lib/auth"
import { resumen, serie } from "@/lib/tablero"
import { pesos, fecha, nombrePeriodo, periodoActual, periodosRecientes } from "@/lib/util"
import { Barras, Torta } from "@/components/Graficos"

export const dynamic = "force-dynamic"

function Kpi({ t, v, sub, tono = "verde" }: { t: string; v: string | number; sub?: string; tono?: "verde" | "rojo" | "gris" }) {
  const c = tono === "rojo" ? "text-rojo" : tono === "gris" ? "text-[#33414F]" : "text-[#0B7A3B]"
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#4F5C69]">{t}</span>
      <span className={`text-3xl font-extrabold ${c}`}>{v}</span>
      {sub && <span className="text-xs text-[#4F5C69]">{sub}</span>}
    </div>
  )
}

export default async function Tablero({ searchParams }: { searchParams: { p?: string } }) {
  const u = await requerir()
  const periodo = /^\d{4}-\d{2}$/.test(searchParams.p ?? "") ? searchParams.p! : periodoActual()
  const r = await resumen(periodo)
  const fin = puede.verFinanzas(u)
  const basico = u.rol === "consulta"
  const ser = basico ? [] : await serie(periodosRecientes(6))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Tablero de control</h1>
          <p className="m-0 text-sm text-[#4F5C69]">Internación domiciliaria · {nombrePeriodo(periodo)}{r.desdeHistorico ? " · datos de la carga mensual histórica" : ""}</p>
        </div>
        <form className="flex items-center gap-2">
          <select name="p" defaultValue={periodo} className="inp w-auto">
            {periodosRecientes(12).map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
          </select>
          <button className="btn-s">Ver</button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi t="Padrón activo" v={r.padron} sub="pacientes con OP en el mes" />
        <Kpi t="Visitas realizadas" v={r.visitas} sub={`Enf. ${r.tot.enf} · Kin. ${r.tot.kin} · Méd. ${r.tot.med}`} />
        {fin ? (
          <Kpi t={r.factura != null ? "Facturación PAMI" : "Facturación estimada"} v={pesos(r.factura ?? r.estimado)} sub={r.cobraEn ? `Se cobra en ${r.cobraEn}` : r.factura != null ? "Factura real cargada" : "Submódulos registrados"} />
        ) : (
          <Kpi t="Hoy" v={`${r.hoyAgenda.real}/${r.hoyAgenda.prog + r.hoyAgenda.real}`} sub="visitas realizadas / del día" tono="gris" />
        )}
        <Kpi t="Registro en APP PAMI" v={r.appPct == null ? "—" : `${r.appPct}%`} sub="lo no registrado no se paga" tono={r.appPct != null && r.appPct < 100 ? "rojo" : "verde"} />
      </div>

      {!basico && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <h2 className="mt-0">OP vencidas <span className="chip bg-red-50 text-rojo">{r.vencidas.length}</span></h2>
            <Lista items={r.vencidas.map((x) => ({ id: x.id, t: x.apellido_nombre, d: `${x.modulo} · venció ${fecha(x.fecha_vencimiento)}` }))} vacio="Sin OP vencidas." />
          </div>
          <div className="card">
            <h2 className="mt-0">OP que vencen en 7 días <span className="chip bg-amber-50 text-amber-700">{r.vencen.length}</span></h2>
            <Lista items={r.vencen.map((x) => ({ id: x.id, t: x.apellido_nombre, d: `${x.modulo} · vence ${fecha(x.fecha_vencimiento)}` }))} vacio="Ninguna por vencer." />
          </div>
          <div className="card">
            <h2 className="mt-0">Sin visita hace 7+ días <span className="chip bg-amber-50 text-amber-700">{r.sinVisita.length}</span></h2>
            <Lista items={r.sinVisita.map((x) => ({ id: x.id, t: x.apellido_nombre, d: x.ultima ? `última ${fecha(x.ultima)}` : "sin visitas registradas" }))} vacio="Todos visitados." />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="mt-0">Mix de módulos</h2>
          {Object.keys(r.mix).length ? <Torta labels={Object.keys(r.mix)} data={Object.values(r.mix)} /> : <p className="text-sm text-[#4F5C69]">Sin pacientes con OP cargada en el mes.</p>}
        </div>
        <div className="card">
          <h2 className="mt-0">Pacientes por localidad</h2>
          {Object.keys(r.porLocalidad).length ? <Barras labels={Object.keys(r.porLocalidad)} series={[{ label: "Pacientes", data: Object.values(r.porLocalidad) }]} /> : <p className="text-sm text-[#4F5C69]">Sin datos.</p>}
        </div>
      </div>

      {!basico && ser.length > 0 && (
        <div className="card">
          <h2 className="mt-0">Evolución mensual</h2>
          <Barras labels={ser.map((s) => nombrePeriodo(s.periodo))} series={[{ label: "Padrón", data: ser.map((s) => s.padron) }, { label: "Visitas", data: ser.map((s) => s.visitas), color: "#A7D8B7" }]} />
          {fin && (
            <table className="tbl mt-4">
              <thead><tr><th>Mes</th><th>Padrón</th><th>Visitas</th><th className="text-right">Facturación</th><th className="text-right">Por paciente</th></tr></thead>
              <tbody>{ser.map((s) => (
                <tr key={s.periodo}><td><Link className="underline" href={`/?p=${s.periodo}`}>{nombrePeriodo(s.periodo)}</Link></td><td>{s.padron}</td><td>{s.visitas}</td><td className="text-right">{pesos(s.facturacion)}</td><td className="text-right">{s.facturacion && s.padron ? pesos(s.facturacion / s.padron) : "—"}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {!basico && (
        <div className="card">
          <h2 className="mt-0">Punto 8 PAMI · controles del circuito</h2>
          <ul className="m-0 pl-5 text-sm leading-relaxed text-[#33414F]">
            <li><strong>48 h hábiles</strong> para activar la OP en el SII desde su emisión.</li>
            <li><strong>Día 15 de N+1</strong>: límite para transmitir consumos en Efectores Web (meta interna: día 12).</li>
            <li><strong>Último día hábil de N+2</strong>: PAMI publica la liquidación; emitir la factura ese mismo día.</li>
            <li><strong>Código 230001</strong>: cargar la suspensión por internación de más de 24 h.</li>
            <li>Visitas sin registro en la APP PAMI Prestadores <strong>no se pagan</strong>.</li>
          </ul>
        </div>
      )}
    </div>
  )
}

function Lista({ items, vacio }: { items: { id: number; t: string; d: string }[]; vacio: string }) {
  if (!items.length) return <p className="text-sm text-[#4F5C69] m-0">{vacio}</p>
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-2 max-h-64 overflow-auto">
      {items.map((i) => (
        <li key={i.id}><Link href={`/pacientes/${i.id}`} className="font-semibold hover:underline">{i.t}</Link><div className="text-xs text-[#4F5C69]">{i.d}</div></li>
      ))}
    </ul>
  )
}
