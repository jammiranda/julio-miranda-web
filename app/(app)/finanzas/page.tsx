import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { dinero, isoD, sumarDias } from "@/lib/gestion"
import { fecha, hoyISO, nombrePeriodo, periodoActual, periodosRecientes, rangoPeriodo } from "@/lib/util"
import { TablaRegistro, Aviso, Pestanias, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type SP = { ver?: string; p?: string; tipo?: string; editar?: string; nuevo?: string; ok?: string; error?: string }

export default async function Finanzas({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir(["gerente", "coordinacion"])
  const ver = ["resumen", "movimientos", "proveedores"].includes(sp.ver ?? "") ? sp.ver! : "resumen"
  const per = /^\d{4}-\d{2}$/.test(sp.p ?? "") ? sp.p! : periodoActual()
  const { ini, fin } = rangoPeriodo(per)
  const hoy = hoyISO()
  const qs = new URLSearchParams({ ver, p: per, ...(sp.tipo ? { tipo: sp.tipo } : {}) }).toString()
  const volver = `/finanzas?${qs}`
  const editar = Number(sp.editar) || null

  const [tot, serie, cats, cobros, pend, cant] = await Promise.all([
    q<{ moneda: string; ing: string; egr: string }>(
      `select m moneda,
        coalesce((select sum(monto) from db_cobros where estado='pagado' and moneda=m and (pagado_en at time zone 'America/Argentina/Buenos_Aires')::date between $1 and $2),0)
        + coalesce((select sum(monto) from g_movimientos where tipo='ingreso' and estado='pagado' and moneda=m and fecha between $1 and $2),0) ing,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pagado' and moneda=m and fecha between $1 and $2),0) egr
       from unnest(array['ARS','USD']) m`, [ini, fin]),
    q<{ p: string; ing: string; egr: string }>(
      `with m as (select to_char(d,'YYYY-MM') p from generate_series(date_trunc('month',$1::date)-interval '5 months', date_trunc('month',$1::date), interval '1 month') d)
       select m.p,
        coalesce((select sum(monto) from db_cobros where estado='pagado' and moneda='ARS' and to_char(pagado_en at time zone 'America/Argentina/Buenos_Aires','YYYY-MM')=m.p),0)
        + coalesce((select sum(monto) from g_movimientos where tipo='ingreso' and estado='pagado' and moneda='ARS' and to_char(fecha,'YYYY-MM')=m.p),0) ing,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pagado' and moneda='ARS' and to_char(fecha,'YYYY-MM')=m.p),0) egr
       from m order by m.p`, [ini]),
    q<{ categoria: string; total: string; n: number }>(
      "select coalesce(categoria,'Sin categoría') categoria, sum(monto) total, count(*)::int n from g_movimientos where tipo='egreso' and estado='pagado' and moneda='ARS' and fecha between $1 and $2 group by 1 order by 2 desc", [ini, fin]),
    q<any>(
      `select k.*, c.organizacion, c.nombre contacto, p.nombre proyecto from db_cobros k
       join db_contactos c on c.id=k.contacto_id left join db_proyectos p on p.id=k.proyecto_id
       where k.estado<>'anulado' and ((k.estado='pagado' and (k.pagado_en at time zone 'America/Argentina/Buenos_Aires')::date between $1 and $2) or (k.estado='pendiente' and k.vence <= $2))
       order by k.estado desc, k.vence limit 60`, [ini, fin]),
    q<{ moneda: string; cobrar: string; cobrar_venc: string; pagar: string; pagar_15: string }>(
      `select m moneda,
        coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda=m),0) cobrar,
        coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda=m and vence < $1),0) cobrar_venc,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pendiente' and moneda=m),0) pagar,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pendiente' and moneda=m and coalesce(vence,$1) <= $2),0) pagar_15
       from unnest(array['ARS','USD']) m`, [hoy, sumarDias(hoy, 15)]),
    q<{ movs: number; provs: number }>("select (select count(*) from g_movimientos)::int movs, (select count(*) from g_proveedores)::int provs"),
  ])

  const T = Object.fromEntries(tot.map((t) => [t.moneda, { ing: Number(t.ing), egr: Number(t.egr) }]))
  const P = Object.fromEntries(pend.map((t) => [t.moneda, t]))
  const ars = T.ARS ?? { ing: 0, egr: 0 }
  const usd = T.USD ?? { ing: 0, egr: 0 }
  const res = ars.ing - ars.egr
  const max = Math.max(1, ...serie.flatMap((s) => [Number(s.ing), Number(s.egr)]))
  const totCat = cats.reduce((a, c) => a + Number(c.total), 0)
  const usdLinea = (a: number, b?: number) => (a || b ? `+ ${dinero(a, "USD")}${b != null ? ` / ${dinero(b, "USD")}` : ""}` : undefined)

  let movs: any[] = []
  let provs: any[] = []
  if (ver === "movimientos") {
    const tipo = sp.tipo === "ingreso" || sp.tipo === "egreso" ? sp.tipo : null
    movs = await q<any>(
      `select * from g_movimientos where (fecha between $1 and $2 or (estado='pendiente' and fecha is null)) and ($3::text is null or tipo=$3)
       order by case estado when 'pendiente' then 0 else 1 end, coalesce(fecha, vence) desc nulls last, id desc`, [ini, fin, tipo])
  }
  if (ver === "proveedores") provs = await q<any>("select * from g_proveedores order by nombre")

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Gestión</div><h1 className="m-0">Finanzas</h1><p>Lo que entra (cobros a clientes y otros ingresos), lo que sale (gastos, sueldos, impuestos) y lo que queda pendiente.</p></div>
        <div className="pag-acc">
          <form className="flex items-center gap-2" action="/finanzas">
            <input type="hidden" name="ver" value={ver} />
            <label htmlFor="per" className="sr-only">Período</label>
            <select id="per" name="p" defaultValue={per} className="inp !py-2 !w-auto">
              {periodosRecientes(18).map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
            </select>
            <button className="btn-s py-2">Ver</button>
          </form>
          <Link href={`/finanzas?ver=movimientos&p=${per}&nuevo=1`} className="btn-p">+ Movimiento</Link>
        </div>
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label={`Números de ${nombrePeriodo(per)}`} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi t="Ingresos del mes" v={dinero(ars.ing)} d={usdLinea(usd.ing)} tono="verde" />
        <Kpi t="Egresos del mes" v={dinero(ars.egr)} d={usdLinea(usd.egr)} />
        <Kpi t="Resultado" v={dinero(res)} d={usd.ing || usd.egr ? `USD: ${dinero(usd.ing - usd.egr, "USD")}` : "Ingresos menos egresos pagados"} tono={res >= 0 ? "verde" : "rojo"} />
        <Kpi t="A cobrar" v={dinero(P.ARS?.cobrar ?? 0)} d={Number(P.ARS?.cobrar_venc ?? 0) ? `${dinero(P.ARS!.cobrar_venc)} vencido` : "Nada vencido"} tono={Number(P.ARS?.cobrar_venc ?? 0) ? "rojo" : undefined} />
        <Kpi t="A pagar" v={dinero(P.ARS?.pagar ?? 0)} d={`${dinero(P.ARS?.pagar_15 ?? 0)} en 15 días`} tono={Number(P.ARS?.pagar_15 ?? 0) ? "ambar" : undefined} href={`/finanzas?ver=movimientos&p=${per}&tipo=egreso`} />
      </section>

      <Pestanias base="/finanzas" actual={ver} items={[{ v: "resumen", n: "Resumen" }, { v: "movimientos", n: "Movimientos", cant: cant[0]?.movs }, { v: "proveedores", n: "Proveedores", cant: cant[0]?.provs }]} />

      {ver === "resumen" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
            <section className="card flex flex-col gap-4" aria-label="Últimos 6 meses">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="m-0 text-base">Ingresos y egresos · últimos 6 meses</h2><p className="m-0 text-xs text-[var(--gris)]">En pesos, solo lo cobrado y pagado.</p></div>
                <div className="flex gap-3 text-xs text-[var(--gris)]"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#0E1116]" />Ingresos</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C8231F]" />Egresos</span></div>
              </div>
              <div className="grid grid-cols-6 gap-2 items-end h-48" role="img" aria-label="Barras de ingresos y egresos por mes">
                {serie.map((s) => (
                  <div key={s.p} className="flex flex-col items-center gap-1.5 h-full min-w-0">
                    <div className="flex-1 w-full flex items-end justify-center gap-1">
                      <div className="w-1/3 max-w-[22px] rounded-t bg-[#0E1116]" style={{ height: `${(100 * Number(s.ing)) / max}%` }} title={`Ingresos ${dinero(s.ing)}`} />
                      <div className="w-1/3 max-w-[22px] rounded-t bg-[#C8231F]" style={{ height: `${(100 * Number(s.egr)) / max}%` }} title={`Egresos ${dinero(s.egr)}`} />
                    </div>
                    <span className={`text-[11px] font-semibold ${s.p === per ? "text-[var(--tinta)]" : "text-[var(--gris)]"}`}>{nombrePeriodo(s.p).slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto -mx-5 border-t border-[var(--borde-2)]">
                <table className="tbl"><thead><tr><th>Mes</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Resultado</th></tr></thead>
                  <tbody>{[...serie].reverse().map((s) => { const r = Number(s.ing) - Number(s.egr); return (
                    <tr key={s.p}><td><Link href={`/finanzas?p=${s.p}`} className="font-semibold hover:underline">{nombrePeriodo(s.p)}</Link></td><td className="text-right tabular-nums">{dinero(s.ing)}</td><td className="text-right tabular-nums">{dinero(s.egr)}</td><td className={`text-right tabular-nums font-semibold ${r < 0 ? "text-rojo" : ""}`}>{dinero(r)}</td></tr>
                  ) })}</tbody></table>
              </div>
            </section>

            <section className="card flex flex-col gap-3" aria-label="Egresos por categoría">
              <h2 className="m-0 text-base">En qué se fue la plata · {nombrePeriodo(per)}</h2>
              {cats.length ? (
                <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                  {cats.map((c) => (
                    <li key={c.categoria} className="flex flex-col gap-1">
                      <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{c.categoria}</span><span className="tabular-nums">{dinero(c.total)}</span></div>
                      <div className="h-2 rounded-full bg-[var(--borde-2)] overflow-hidden"><div className="h-full bg-[#C8231F]" style={{ width: `${(100 * Number(c.total)) / totCat}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="vacio">Sin egresos cargados en {nombrePeriodo(per)}. Cargá sueldos, servicios, impuestos y publicidad en Movimientos.</p>}
            </section>
          </div>

          <section className="card flex flex-col gap-3" aria-label="Cobros a clientes">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="m-0 text-base">Cobros a clientes</h2><p className="m-0 text-xs text-[var(--gris)]">Salen de cada proyecto (anticipos, cuotas y abonos). Los pagados del mes y los pendientes vencidos.</p></div>
              <Link href="/proyectos" className="btn-s py-1 px-3 text-xs">Ir a proyectos</Link>
            </div>
            {cobros.length ? (
              <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
                <table className="tbl"><thead><tr><th>Cliente</th><th>Concepto</th><th>Vence</th><th>Estado</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>{cobros.map((k) => { const v = isoD(k.vence)!; const tarde = k.estado === "pendiente" && v < hoy; return (
                    <tr key={k.id}>
                      <td className="font-semibold">{k.proyecto_id ? <Link href={`/proyectos/${k.proyecto_id}`} className="hover:underline">{k.organizacion ?? k.contacto}</Link> : <Link href={`/contactos/${k.contacto_id}`} className="hover:underline">{k.organizacion ?? k.contacto}</Link>}</td>
                      <td>{k.concepto}{k.proyecto ? <span className="block text-xs text-[var(--gris)]">{k.proyecto}</span> : null}</td>
                      <td className={tarde ? "text-rojo font-semibold whitespace-nowrap" : "whitespace-nowrap"}>{fecha(v)}</td>
                      <td><span className={`chip ${k.estado === "pagado" ? "bg-emerald-50 text-emerald-700" : tarde ? "bg-red-50 text-rojo" : "bg-amber-50 text-amber-700"}`}>{k.estado === "pagado" ? "Cobrado" : tarde ? "Vencido" : "Pendiente"}</span></td>
                      <td className="text-right tabular-nums font-semibold">{dinero(k.monto, k.moneda)}</td>
                    </tr>
                  ) })}</tbody></table>
              </div>
            ) : <p className="vacio">No hay cobros cobrados ni vencidos en {nombrePeriodo(per)}.</p>}
          </section>
        </>
      )}

      {ver === "movimientos" && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--gris)]">Mostrar:</span>
            {[{ v: "", n: "Todo" }, { v: "egreso", n: "Egresos" }, { v: "ingreso", n: "Otros ingresos" }].map((t) => (
              <Link key={t.v} href={`/finanzas?ver=movimientos&p=${per}${t.v ? `&tipo=${t.v}` : ""}`} className={`chip px-3 py-1 border ${(sp.tipo ?? "") === t.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[var(--borde-fuerte)]"}`}>{t.n}</Link>
            ))}
            <span className="text-xs text-[var(--gris)]">{nombrePeriodo(per)} y todo lo pendiente.</span>
          </div>
          <TablaRegistro clave="movimientos" filas={movs} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar
            abierto={(r) => r.estado === "pendiente"} rapido={{ etiqueta: "Pagado", si: (r) => r.estado === "pendiente" }}
            vacio={`Sin movimientos en ${nombrePeriodo(per)}. Los cobros a clientes se cargan en cada proyecto; acá van los gastos y otros ingresos.`} />
        </>
      )}

      {ver === "proveedores" && (
        <>
          <div className="flex justify-end"><Link href="/finanzas?ver=proveedores&nuevo=1" className="btn-s">+ Proveedor</Link></div>
          <TablaRegistro clave="proveedores" filas={provs} volver={`/finanzas?ver=proveedores`} editar={editar} nuevo={!!sp.nuevo} puedeEditar
            vacio="Sin proveedores cargados. Sumá hosting, software, contador, freelancers y cowork para asociarlos a cada gasto." />
        </>
      )}
      <p className="m-0 text-xs text-[var(--gris)]">{u.rol === "gerente" ? "Dirección" : "Coordinación"} ve y edita las finanzas. Las cifras en dólares se muestran aparte y no se convierten.</p>
    </div>
  )
}
