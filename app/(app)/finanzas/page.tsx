import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { dinero, isoD, sumarDias } from "@/lib/gestion"
import { fecha, hoyISO, nombrePeriodo, periodoActual, periodosRecientes, rangoPeriodo } from "@/lib/util"
import { TablaRegistro, Aviso, Pestanias, Kpi } from "@/components/Registro"
import { importarMP, clasificar, cobrar } from "@/lib/finanzas-acciones"

export const dynamic = "force-dynamic"

type SP = { ver?: string; p?: string; tipo?: string; amb?: string; editar?: string; nuevo?: string; ok?: string; error?: string }

export default async function Finanzas({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir(["gerente", "coordinacion"])
  const ver = ["resumen", "movimientos", "proveedores"].includes(sp.ver ?? "") ? sp.ver! : "resumen"
  const per = /^\d{4}-\d{2}$/.test(sp.p ?? "") ? sp.p! : periodoActual()
  const { ini, fin } = rangoPeriodo(per)
  const hoy = hoyISO()
  const amb = ["laboral", "personal", "sin"].includes(sp.amb ?? "") ? sp.amb! : null
  const qs = new URLSearchParams({ ver, p: per, ...(sp.tipo ? { tipo: sp.tipo } : {}), ...(amb ? { amb } : {}) }).toString()
  const volver = `/finanzas?${qs}`
  const editar = Number(sp.editar) || null

  const [tot, serie, cats, cobros, pend, cant] = await Promise.all([
    q<{ moneda: string; ing: string; egr: string }>(
      `select m moneda,
        coalesce((select sum(monto) from db_cobros where estado='pagado' and moneda=m and (pagado_en at time zone 'America/Argentina/Buenos_Aires')::date between $1 and $2),0)
        + coalesce((select sum(monto) from g_movimientos where tipo='ingreso' and estado='pagado' and moneda=m and coalesce(fecha, (creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2),0) ing,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pagado' and moneda=m and coalesce(ambito,'')<>'personal' and coalesce(fecha, (creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2),0) egr
       from unnest(array['ARS','USD']) m`, [ini, fin]),
    q<{ p: string; ing: string; egr: string }>(
      `with m as (select to_char(d,'YYYY-MM') p from generate_series(date_trunc('month',$1::date)-interval '5 months', date_trunc('month',$1::date), interval '1 month') d)
       select m.p,
        coalesce((select sum(monto) from db_cobros where estado='pagado' and moneda='ARS' and to_char(pagado_en at time zone 'America/Argentina/Buenos_Aires','YYYY-MM')=m.p),0)
        + coalesce((select sum(monto) from g_movimientos where tipo='ingreso' and estado='pagado' and moneda='ARS' and to_char(coalesce(fecha, (creado at time zone 'America/Argentina/Buenos_Aires')::date),'YYYY-MM')=m.p),0) ing,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pagado' and moneda='ARS' and coalesce(ambito,'')<>'personal' and to_char(coalesce(fecha, (creado at time zone 'America/Argentina/Buenos_Aires')::date),'YYYY-MM')=m.p),0) egr
       from m order by m.p`, [ini]),
    q<{ categoria: string; total: string; n: number }>(
      "select coalesce(categoria,'Sin categoría') categoria, sum(monto) total, count(*)::int n from g_movimientos where tipo='egreso' and estado='pagado' and moneda='ARS' and coalesce(ambito,'')<>'personal' and coalesce(fecha, (creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2 group by 1 order by 2 desc", [ini, fin]),
    q<any>(
      `select k.*, c.organizacion, c.nombre contacto, p.nombre proyecto from db_cobros k
       join db_contactos c on c.id=k.contacto_id left join db_proyectos p on p.id=k.proyecto_id
       where k.estado<>'anulado' and ((k.estado='pagado' and (k.pagado_en at time zone 'America/Argentina/Buenos_Aires')::date between $1 and $2) or (k.estado='pendiente' and k.vence <= $2))
       order by k.estado desc, k.vence limit 60`, [ini, fin]),
    q<{ moneda: string; cobrar: string; cobrar_venc: string; pagar: string; pagar_15: string }>(
      `select m moneda,
        coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda=m),0) cobrar,
        coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda=m and vence < $1),0) cobrar_venc,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pendiente' and moneda=m and coalesce(ambito,'')<>'personal'),0) pagar,
        coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pendiente' and moneda=m and coalesce(ambito,'')<>'personal' and coalesce(vence,$1) <= $2),0) pagar_15
       from unnest(array['ARS','USD']) m`, [hoy, sumarDias(hoy, 15)]),
    q<{ movs: number; provs: number }>("select (select count(*) from g_movimientos)::int movs, (select count(*) from g_proveedores)::int provs"),
  ])
  const [lab] = await q<{ pagado: string; pagado_usd: string; pendiente: string; sin: number; publicidad: string }>(
    `select
      coalesce(sum(monto) filter (where estado='pagado' and moneda='ARS' and ambito='laboral' and coalesce(fecha,(creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2),0) pagado,
      coalesce(sum(monto) filter (where estado='pagado' and moneda='USD' and ambito='laboral' and coalesce(fecha,(creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2),0) pagado_usd,
      coalesce(sum(monto) filter (where estado='pendiente' and moneda='ARS' and ambito='laboral' and coalesce(vence,fecha) between $1 and $2),0) pendiente,
      (count(*) filter (where ambito is null and estado<>'anulado'))::int sin,
      coalesce(sum(monto) filter (where estado='pagado' and moneda='ARS' and ambito='laboral' and categoria='Publicidad' and coalesce(fecha,(creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2),0) publicidad
     from g_movimientos where tipo='egreso'`, [ini, fin])
  const ads = ver === "resumen" ? await q<{ medio: string; estado: string; total: string; n: number }>(
    `select coalesce(medio,'Sin medio') medio, estado, sum(monto) total, count(*)::int n from g_movimientos
     where tipo='egreso' and categoria='Publicidad' and moneda='ARS' and estado<>'anulado' and coalesce(ambito,'')<>'personal'
       and coalesce(fecha, vence, (creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2
     group by 1,2 order by 1, 2`, [ini, fin]) : []
  const sinClasificar = amb === "sin" ? await q<any>("select * from g_movimientos where tipo='egreso' and ambito is null and estado<>'anulado' order by coalesce(fecha, vence) desc nulls last, id desc limit 80") : []

  const [MES] = await q<{ cobrar: string; cobrar_venc: string; pagar: string }>(
    `select
      coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda='ARS' and (vence between $1 and $2 or ($3 and vence < $1))),0) cobrar,
      coalesce((select sum(monto) from db_cobros where estado='pendiente' and moneda='ARS' and vence < $4 and (vence between $1 and $2 or ($3 and vence < $1))),0) cobrar_venc,
      coalesce((select sum(monto) from g_movimientos where tipo='egreso' and estado='pendiente' and moneda='ARS' and coalesce(ambito,'')<>'personal' and (coalesce(vence,$2::date) between $1 and $2 or ($3 and vence < $1))),0) pagar`,
    [ini, fin, per === periodoActual(), hoy])
  const esActual = per === periodoActual()
  const TZ = "at time zone 'America/Argentina/Buenos_Aires'"
  // Todo lo que entra en el mes, en una sola lista: cobros a clientes (de cada proyecto) y otros ingresos
  const entradas = ver === "resumen" ? await q<any>(
    `select * from (
       select 'cobro' src, k.id, coalesce(c.organizacion, c.nombre) quien, k.concepto, k.tipo, k.periodo, k.estado, k.monto, k.moneda, k.proyecto_id, k.nota,
              coalesce((k.pagado_en ${TZ})::date, k.vence) f
       from db_cobros k join db_contactos c on c.id=k.contacto_id
       where k.estado<>'anulado' and ((k.estado='pagado' and (k.pagado_en ${TZ})::date between $1 and $2) or (k.estado='pendiente' and (k.vence between $1 and $2 or ($3 and k.vence < $1))))
       union all
       select 'mov', m.id, m.concepto, m.categoria, null, null, m.estado, m.monto, m.moneda, m.proyecto_id, m.nota,
              coalesce(m.fecha, m.vence, (m.creado ${TZ})::date)
       from g_movimientos m
       where m.tipo='ingreso' and m.estado<>'anulado' and (coalesce(m.fecha, m.vence, (m.creado ${TZ})::date) between $1 and $2 or ($3 and m.estado='pendiente' and m.vence < $1))
     ) x order by case estado when 'pagado' then 0 else 1 end, f, id`, [ini, fin, esActual]) : []
  // Lo que sale en el mes por categoría: pagado y por pagar (sin lo personal)
  const salidas = ver === "resumen" ? await q<{ categoria: string; pagado: string; pendiente: string; n: number }>(
    `select coalesce(categoria,'Sin categoría') categoria,
       coalesce(sum(monto) filter (where estado='pagado'),0) pagado, coalesce(sum(monto) filter (where estado='pendiente'),0) pendiente, count(*)::int n
     from g_movimientos
     where tipo='egreso' and moneda='ARS' and estado<>'anulado' and coalesce(ambito,'')<>'personal'
       and ((estado='pagado' and coalesce(fecha, (creado ${TZ})::date) between $1 and $2) or (estado='pendiente' and (coalesce(vence, $2::date) between $1 and $2 or ($3 and vence < $1))))
     group by 1 order by sum(monto) desc`, [ini, fin, esActual]) : []
  const abonos = ver === "resumen" ? await q<any>(
    `select p.id, coalesce(c.organizacion, c.nombre) cliente, p.abono_monto, p.abono_moneda, p.abono_desde, p.abono_hasta, p.notas,
            k.estado k_estado, k.monto k_monto, k.id k_id
     from db_proyectos p join db_contactos c on c.id=p.contacto_id
     left join db_cobros k on k.proyecto_id=p.id and k.tipo='abono' and k.periodo=$1 and k.estado<>'anulado'
     where p.abono_monto > 0 and p.estado not in ('cancelado') order by p.abono_monto desc`, [per]) : []
  const sumaARS = (l: any[], f: (x: any) => boolean) => l.filter((x) => (x.moneda ?? "ARS") === "ARS" && f(x)).reduce((a, x) => a + Number(x.monto), 0)
  const entro = sumaARS(entradas, (x) => x.estado === "pagado")
  const faltaCobrar = sumaARS(entradas, (x) => x.estado === "pendiente")
  const salio = salidas.reduce((a, x) => a + Number(x.pagado), 0)
  const faltaPagar = salidas.reduce((a, x) => a + Number(x.pendiente), 0)
  const conceptoLindo = (x: any) => (x.src === "cobro" && x.tipo === "abono" && x.periodo ? `Abono de ${nombrePeriodo(x.periodo).toLowerCase()}` : x.src === "mov" ? `Otro ingreso${x.concepto ? ` · ${x.concepto}` : ""}` : x.concepto)

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
      `select * from g_movimientos where (coalesce(fecha, case when estado='pendiente' then coalesce(vence,$2) end, (creado at time zone 'America/Argentina/Buenos_Aires')::date) between $1 and $2 or (estado='pendiente' and fecha is null and vence < $1)) and ($3::text is null or tipo=$3)
         and ($4::text is null or ($4='sin' and ambito is null) or ambito=$4)
       order by case estado when 'pendiente' then 0 else 1 end, coalesce(fecha, vence) desc nulls last, id desc`, [ini, fin, tipo, amb])
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
              {periodosRecientes(18, 4).map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
            </select>
            <button className="btn-s py-2">Ver</button>
          </form>
          <a href="/api/crm/movimientos?formato=csv" className="btn-s py-2" title="Todos los movimientos, para abrir en Excel">Exportar</a>
          <Link href={`/finanzas?ver=movimientos&p=${per}&nuevo=1`} className="btn-p">+ Movimiento</Link>
        </div>
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label={`Números de ${nombrePeriodo(per)}`} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi t={`Entró en ${nombrePeriodo(per).split(" ")[0].toLowerCase()}`} v={dinero(ars.ing)} d={usdLinea(usd.ing) ?? "Cobrado a clientes y otros ingresos"} tono="verde" />
        <Kpi t="Salió" v={dinero(ars.egr)} d={usdLinea(usd.egr) ?? (Number(lab.sin) ? `${lab.sin} gastos por clasificar` : "Gastos pagados, sin lo personal")} tono={Number(lab.sin) ? "ambar" : undefined} href={`/finanzas?ver=movimientos&p=${per}&tipo=egreso`} />
        <Kpi t="Quedó" v={dinero(res)} d="Lo que entró menos lo que salió" tono={res >= 0 ? "verde" : "rojo"} />
        <Kpi t="Falta cobrar" v={dinero(MES.cobrar)} d={Number(MES.cobrar_venc) ? `${dinero(MES.cobrar_venc)} vencido` : `Después de este mes: ${dinero(Math.max(0, Number(P.ARS?.cobrar ?? 0) - Number(MES.cobrar)))}`} tono={Number(MES.cobrar_venc) ? "rojo" : undefined} />
        <Kpi t="Falta pagar" v={dinero(MES.pagar)} d={`Después de este mes: ${dinero(Math.max(0, Number(P.ARS?.pagar ?? 0) - Number(MES.pagar)))}`} tono={Number(MES.pagar) ? "ambar" : undefined} href={`/finanzas?ver=movimientos&p=${per}&tipo=egreso`} />
      </section>

      <Pestanias base="/finanzas" actual={ver} items={[{ v: "resumen", n: "Resumen" }, { v: "movimientos", n: "Movimientos", cant: cant[0]?.movs }, { v: "proveedores", n: "Proveedores", cant: cant[0]?.provs }]} />

      {ver === "resumen" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <section className="card flex flex-col gap-3" aria-label="Ingresos del mes">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="m-0 text-base">Lo que entra · {nombrePeriodo(per)}</h2><p className="m-0 text-xs text-[var(--gris)]">Todos los ingresos del mes en un solo lugar: abonos y cobros de clientes, y cualquier otro ingreso.</p></div>
                <Link href={`/finanzas?ver=movimientos&p=${per}&nuevo=1`} className="btn-s py-1 px-3 text-xs">+ Otro ingreso</Link>
              </div>
              {entradas.length ? (
                <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
                  <table className="tbl"><thead><tr><th>De quién</th><th>Fecha</th><th>Estado</th><th className="text-right">Monto</th></tr></thead>
                    <tbody>{entradas.map((x) => { const f = isoD(x.f); const tarde = x.estado === "pendiente" && !!f && f < hoy; return (
                      <tr key={`${x.src}-${x.id}`}>
                        <td><span className="font-semibold">{x.src === "cobro" && x.proyecto_id ? <Link href={`/proyectos/${x.proyecto_id}#cobros`} className="hover:underline">{x.quien}</Link> : x.quien}</span>
                          <span className="block text-xs text-[var(--gris)]">{conceptoLindo(x)}{x.nota ? ` · ${x.nota}` : ""}</span></td>
                        <td className={`whitespace-nowrap ${tarde ? "text-rojo font-semibold" : ""}`}>{f ? fecha(f) : "—"}</td>
                        <td>{x.estado === "pagado" ? <span className="chip bg-emerald-50 text-emerald-700">Cobrado</span> : (
                          <span className="flex flex-wrap items-center gap-2"><span className={`chip ${tarde ? "bg-red-50 text-rojo" : "bg-amber-50 text-amber-700"}`}>{tarde ? "Vencido" : "Falta cobrar"}</span>
                            {x.src === "cobro" && <form action={cobrar}><input type="hidden" name="_volver" value={volver} /><input type="hidden" name="id" value={x.id} /><button className="btn-s py-1 px-2 text-xs">✓ Cobrado</button></form>}</span>)}</td>
                        <td className="text-right tabular-nums font-semibold whitespace-nowrap">{dinero(x.monto, x.moneda)}</td>
                      </tr>
                    ) })}</tbody>
                    <tfoot>
                      <tr><td colSpan={3} className="font-semibold">Entró</td><td className="text-right tabular-nums font-bold">{dinero(entro)}</td></tr>
                      {faltaCobrar > 0 && <tr><td colSpan={3} className="text-[var(--gris)]">Falta cobrar</td><td className="text-right tabular-nums">{dinero(faltaCobrar)}</td></tr>}
                    </tfoot></table>
                </div>
              ) : <p className="vacio">Sin ingresos cargados en {nombrePeriodo(per)}.</p>}
            </section>

            <section className="card flex flex-col gap-3" aria-label="Egresos del mes">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="m-0 text-base">Lo que sale · {nombrePeriodo(per)}</h2><p className="m-0 text-xs text-[var(--gris)]">Gastos de la empresa por rubro: lo ya pagado y lo que falta pagar este mes. No incluye lo personal.</p></div>
                <Link href={`/finanzas?ver=movimientos&p=${per}&tipo=egreso`} className="btn-s py-1 px-3 text-xs">Ver cada gasto</Link>
              </div>
              {salidas.length ? (
                <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
                  <table className="tbl"><thead><tr><th>Rubro</th><th className="text-right">Pagado</th><th className="text-right">Falta pagar</th></tr></thead>
                    <tbody>{salidas.map((c) => (
                      <tr key={c.categoria}><td className="font-semibold">{c.categoria}</td><td className="text-right tabular-nums">{Number(c.pagado) ? dinero(c.pagado) : "—"}</td><td className="text-right tabular-nums text-[var(--gris)]">{Number(c.pendiente) ? dinero(c.pendiente) : "—"}</td></tr>
                    ))}</tbody>
                    <tfoot><tr><td className="font-semibold">Total</td><td className="text-right tabular-nums font-bold">{dinero(salio)}</td><td className="text-right tabular-nums font-semibold">{dinero(faltaPagar)}</td></tr></tfoot></table>
                </div>
              ) : <p className="vacio">Sin gastos cargados en {nombrePeriodo(per)}.</p>}
              {Number(lab.sin) > 0 && <Link href={`/finanzas?ver=movimientos&p=${per}&amb=sin`} className="text-sm font-semibold hover:underline self-start">Hay {lab.sin} gastos por clasificar (laboral o personal)</Link>}
            </section>
          </div>

          <section className="card flex flex-col gap-3" aria-label="Clientes con abono">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="m-0 text-base">Clientes con abono mensual</h2><p className="m-0 text-xs text-[var(--gris)]">Lo que entra fijo todos los meses. El sistema crea solo el cobro de cada mes; acá ves cómo va {nombrePeriodo(per)}.</p></div>
              <Link href="/proyectos" className="btn-s py-1 px-3 text-xs">Ir a proyectos</Link>
            </div>
            {abonos.length ? (
              <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
                <table className="tbl"><thead><tr><th>Cliente</th><th className="text-right">Abono por mes</th><th>Vigencia</th><th>{nombrePeriodo(per)}</th></tr></thead>
                  <tbody>{abonos.map((a) => { const d = isoD(a.abono_desde), h = isoD(a.abono_hasta); const fuera = (d && d > fin) || (h && h < ini); return (
                    <tr key={a.id}>
                      <td><Link href={`/proyectos/${a.id}`} className="font-semibold hover:underline">{a.cliente}</Link>{a.notas ? <span className="block text-xs text-[var(--gris)] max-w-xl">{a.notas}</span> : null}</td>
                      <td className="text-right tabular-nums font-semibold whitespace-nowrap">{dinero(a.abono_monto, a.abono_moneda)}</td>
                      <td className="whitespace-nowrap text-sm">{d ? `Desde ${fecha(d)}` : "Hace tiempo"}{h ? ` hasta ${fecha(h)}` : ", sin fecha de fin"}</td>
                      <td>{a.k_estado === "pagado" ? <span className="chip bg-emerald-50 text-emerald-700">Cobrado {dinero(a.k_monto)}</span> : a.k_estado === "pendiente" ? <span className="chip bg-amber-50 text-amber-700">Falta cobrar {dinero(a.k_monto)}</span> : <span className="chip bg-slate-100 text-slate-600">{fuera ? "No corresponde" : "Sin cobro cargado"}</span>}</td>
                    </tr>
                  ) })}</tbody>
                  <tfoot><tr><td className="font-semibold">Total fijo por mes</td><td className="text-right tabular-nums font-bold">{dinero(abonos.reduce((s, a) => s + Number(a.abono_monto), 0))}</td><td colSpan={2} /></tr></tfoot></table>
              </div>
            ) : <p className="vacio">Sin clientes con abono. Cargá el abono en el proyecto de cada cliente.</p>}
          </section>

          <section className="card flex flex-col gap-3" aria-label="Publicidad del mes">
            <div><h2 className="m-0 text-base">Publicidad · {nombrePeriodo(per)}</h2><p className="m-0 text-xs text-[var(--gris)]">Separado por cómo se paga: el prepago de Google Ads (cuenta 1) es plata ya cargada que se va consumiendo. La Mastercard Galicia (cuenta 2 de Google) y la Mastercard prepaga de Mercado Pago (Meta) cobran a medida que se gasta.</p></div>
            {ads.length ? (
              <div className="overflow-x-auto -mx-5 border-y border-[var(--borde-2)]">
                <table className="tbl"><thead><tr><th>Medio</th><th>Estado</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>{ads.map((a) => (
                    <tr key={`${a.medio}-${a.estado}`}>
                      <td className="font-semibold">{a.medio}</td>
                      <td><span className={`chip ${a.estado === "pagado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{a.estado === "pagado" ? (a.medio === "Prepago Google Ads" ? "Consumido" : "Cobrado") : a.medio === "Prepago Google Ads" ? "Recarga a decidir" : "Falta cobrar"}</span></td>
                      <td className="text-right tabular-nums font-semibold">{dinero(a.total)}</td>
                    </tr>
                  ))}</tbody></table>
              </div>
            ) : <p className="vacio">Sin gastos de publicidad cargados en {nombrePeriodo(per)}.</p>}
            <Link href={`/finanzas?ver=movimientos&p=${per}&tipo=egreso&amb=laboral`} className="text-sm font-semibold hover:underline self-start">Ver el detalle de cada gasto laboral</Link>
          </section>

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
        </>
      )}

      {ver === "movimientos" && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--gris)]">Mostrar:</span>
            {[{ v: "", n: "Todo" }, { v: "egreso", n: "Egresos" }, { v: "ingreso", n: "Otros ingresos" }].map((t) => (
              <Link key={t.v} href={`/finanzas?ver=movimientos&p=${per}${t.v ? `&tipo=${t.v}` : ""}`} className={`chip px-3 py-1 border ${(sp.tipo ?? "") === t.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[var(--borde-fuerte)]"}`}>{t.n}</Link>
            ))}
            <span className="text-[var(--gris)] ml-2">Ámbito:</span>
            {[{ v: "", n: "Todos" }, { v: "laboral", n: "Laborales" }, { v: "personal", n: "Personales" }, { v: "sin", n: `Por clasificar${lab.sin ? ` (${lab.sin})` : ""}` }].map((t) => (
              <Link key={t.v} href={`/finanzas?ver=movimientos&p=${per}${sp.tipo ? `&tipo=${sp.tipo}` : ""}${t.v ? `&amb=${t.v}` : ""}`} className={`chip px-3 py-1 border ${(amb ?? "") === t.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[var(--borde-fuerte)]"}`}>{t.n}</Link>
            ))}
            <span className="text-xs text-[var(--gris)]">{nombrePeriodo(per)} y lo pendiente hasta fin de mes.</span>
          </div>

          <section className="card flex flex-col gap-3" aria-label="Importar Mercado Pago o banco">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-base">Importar movimientos de Mercado Pago o del banco</h2>
                <p className="m-0 text-xs text-[var(--gris)] max-w-2xl">Mercado Pago: Tu negocio → Reportes → Todas las transacciones (o Actividad → Descargar). Galicia: Office Banking → Cuentas → Movimientos → Descargar (Excel o CSV). Se cargan solo los gastos y no se duplican si subís el mismo archivo dos veces. Lo que reconocen las reglas queda clasificado solo, y el resto queda en Por clasificar.</p>
              </div>
              <form action={importarMP} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="_volver" value={volver} />
                <label htmlFor="imp-fuente" className="sr-only">De dónde viene el archivo</label>
                <select id="imp-fuente" name="fuente" defaultValue="mercadopago" className="inp !py-2 !w-auto">
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="galicia">Banco Galicia</option>
                  <option value="banco">Otro banco</option>
                </select>
                <label htmlFor="mp-archivo" className="sr-only">Archivo</label>
                <input id="mp-archivo" type="file" name="archivo" accept=".csv,.xlsx,.xls,.txt" required className="text-sm max-w-[16rem]" />
                <button className="btn-p py-2">Importar</button>
              </form>
            </div>
          </section>

          {amb === "sin" && (
            <section className="card flex flex-col gap-3" aria-label="Gastos por clasificar">
              <div><h2 className="m-0 text-base">Por clasificar · {sinClasificar.length}</h2><p className="m-0 text-xs text-[var(--gris)]">Marcá cada gasto. Si escribís una palabra del detalle (por ejemplo "canva"), se crea una regla y los próximos entran clasificados solos.</p></div>
              {sinClasificar.length ? (
                <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--borde-2)]">
                  {sinClasificar.map((m) => (
                    <li key={m.id} className="py-2.5 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[14rem]"><span className="font-semibold text-sm">{m.concepto}</span><span className="block text-xs text-[var(--gris)]">{fecha(isoD(m.fecha ?? m.vence)!)} · {m.medio ?? "Sin medio"}</span></div>
                      <span className="tabular-nums font-semibold">{dinero(m.monto, m.moneda)}</span>
                      <form action={clasificar} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="_volver" value={volver} /><input type="hidden" name="id" value={m.id} />
                        <label className="sr-only" htmlFor={`pat-${m.id}`}>Palabra para la regla</label>
                        <input id={`pat-${m.id}`} name="patron" placeholder="Regla (opcional)" className="inp !py-1.5 !w-36 text-sm" />
                        <button name="ambito" value="laboral" className="btn-p py-1.5 px-3 text-sm">Laboral</button>
                        <button name="ambito" value="personal" className="btn-s py-1.5 px-3 text-sm">Personal</button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : <p className="vacio">No queda nada por clasificar.</p>}
            </section>
          )}
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
