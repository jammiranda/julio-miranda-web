import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { TIPOS_ACTIVO, dinero, isoD, sumarDias } from "@/lib/gestion"
import { fecha, hoyISO } from "@/lib/util"
import { TablaRegistro, Aviso, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type SP = { tipo?: string; cliente?: string; b?: string; editar?: string; nuevo?: string; ok?: string; error?: string; bajas?: string }

export default async function Activos({ searchParams: sp }: { searchParams: SP }) {
  await requerir(["gerente", "coordinacion"])
  const hoy = hoyISO()
  const tipo = TIPOS_ACTIVO.some((t) => t.v === sp.tipo) ? sp.tipo! : null
  const cliente = (sp.cliente ?? "").trim() || null
  const b = (sp.b ?? "").trim()
  const [filas, resumen, clientes, proximos] = await Promise.all([
    q<any>(
      `select * from g_activos where ($1::text is null or tipo=$1) and ($2::text is null or coalesce(cliente,'Sin asignar')=$2)
       and ($3::text='' or nombre ilike '%'||$3||'%' or coalesce(notas,'') ilike '%'||$3||'%') and ($4::bool or estado<>'dado_de_baja')
       order by case estado when 'dado_de_baja' then 1 else 0 end, vence nulls last, tipo, nombre`, [tipo, cliente, b, !!sp.bajas]),
    q<{ tipo: string; n: number }>("select tipo, count(*)::int n from g_activos where estado<>'dado_de_baja' group by 1"),
    q<{ cliente: string; n: number; anual: string; cobra: number }>(
      `select coalesce(cliente,'Sin asignar') cliente, count(*)::int n,
              coalesce(sum(case when periodicidad='mensual' then costo*12 else costo end) filter (where moneda='ARS'),0) anual,
              count(*) filter (where se_cobra)::int cobra
       from g_activos where estado<>'dado_de_baja' group by 1 order by 3 desc, 2 desc`),
    q<any>("select * from g_activos where estado<>'dado_de_baja' and vence is not null and vence <= $1 order by vence limit 8", [sumarDias(hoy, 90)]),
  ])
  const N = Object.fromEntries(resumen.map((r) => [r.tipo, r.n]))
  const anual = clientes.reduce((a, c) => a + Number(c.anual), 0)
  const deTerceros = clientes.filter((c) => !/propio/i.test(c.cliente)).reduce((a, c) => a + Number(c.anual), 0)
  const sinAsignar = clientes.find((c) => c.cliente === "Sin asignar")?.n ?? 0
  const en60 = proximos.filter((p) => isoD(p.vence)! <= sumarDias(hoy, 60)).length
  const params = new URLSearchParams({ ...(tipo ? { tipo } : {}), ...(cliente ? { cliente } : {}), ...(b ? { b } : {}), ...(sp.bajas ? { bajas: "1" } : {}) }).toString()
  const volver = `/activos${params ? `?${params}` : ""}`
  const con = (k: string, v: string | null) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); const s = p.toString(); return `/activos${s ? `?${s}` : ""}` }

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Gestión</div><h1 className="m-0">Activos digitales</h1><p>Dominios, hosting, certificados SSL y casillas que DEVISEBIT administra, propios y de clientes: a quién pertenecen, cuándo vencen y cuánto cuestan.</p></div>
        <div className="pag-acc"><Link href={`${volver}${params ? "&" : "?"}nuevo=1`} className="btn-p">+ Activo</Link></div>
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Resumen" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi t="Costo anual estimado" v={dinero(anual)} d={`${dinero(deTerceros)} corresponde a clientes`} />
        <Kpi t="Vencen en 60 días" v={en60} d={proximos[0] ? `Próximo: ${proximos[0].nombre} · ${fecha(isoD(proximos[0].vence))}` : "Nada próximo"} tono={en60 ? "ambar" : "verde"} />
        <Kpi t="Dominios · SSL · hosting" v={`${N.dominio ?? 0} · ${N.ssl ?? 0} · ${N.hosting ?? 0}`} d="Activos vigentes" />
        <Kpi t="Sin cliente asignado" v={sinAsignar} d={sinAsignar ? "Asignalos para poder cobrarlos" : "Todo asignado"} tono={sinAsignar ? "ambar" : undefined} href={con("cliente", "Sin asignar")} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-5">
        <section className="card flex flex-col gap-3" aria-label="Por cliente">
          <h2 className="m-0 text-base">Por cliente · costo anual</h2>
          <ul className="m-0 p-0 list-none flex flex-col">
            {clientes.map((c) => (
              <li key={c.cliente}>
                <Link href={con("cliente", cliente === c.cliente ? null : c.cliente)} className={`flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--sup-2)] ${cliente === c.cliente ? "bg-[var(--ac-suave)]" : ""}`}>
                  <span className="min-w-0"><span className="block font-semibold truncate">{c.cliente}</span><span className="text-xs text-[var(--gris)]">{c.n} activos{c.cobra ? ` · ${c.cobra} se cobran` : ""}</span></span>
                  <span className="text-sm font-semibold tabular-nums whitespace-nowrap">{dinero(c.anual)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card flex flex-col gap-3" aria-label="Próximas renovaciones">
          <h2 className="m-0 text-base">Próximas renovaciones · 90 días</h2>
          {proximos.length ? (
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--borde-2)]">
              {proximos.map((p) => { const v = isoD(p.vence)!; return (
                <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                  <span className="min-w-0"><span className="block font-semibold truncate">{p.nombre}</span><span className="text-xs text-[var(--gris)]">{p.cliente ?? "Sin asignar"} · {p.proveedor}{p.periodicidad === "mensual" ? " · mensual" : ""}</span></span>
                  <span className="text-right shrink-0"><span className={`block text-sm font-semibold ${v < hoy ? "text-rojo" : ""}`}>{fecha(v)}</span>{p.costo && <span className="text-xs text-[var(--gris)] tabular-nums">{dinero(p.costo, p.moneda)}</span>}</span>
                </li>
              ) })}
            </ul>
          ) : <p className="vacio">Nada vence en los próximos 90 días.</p>}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={con("tipo", null)} className={`chip px-3 py-1 border ${!tipo ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[var(--borde-fuerte)]"}`}>Todos</Link>
        {TIPOS_ACTIVO.filter((t) => N[t.v]).map((t) => <Link key={t.v} href={con("tipo", t.v)} className={`chip px-3 py-1 border ${tipo === t.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[var(--borde-fuerte)]"}`}>{t.n} · {N[t.v]}</Link>)}
        <form action="/activos" className="flex gap-2 ml-auto">
          {tipo && <input type="hidden" name="tipo" value={tipo} />}{cliente && <input type="hidden" name="cliente" value={cliente} />}
          <label htmlFor="b" className="sr-only">Buscar</label>
          <input id="b" name="b" defaultValue={b} placeholder="Buscar dominio o cuenta" className="inp !py-2 !w-auto" />
          <button className="btn-s py-2">Buscar</button>
        </form>
      </div>
      {cliente && <p className="m-0 text-sm">Mostrando <strong>{cliente}</strong> · <Link href={con("cliente", null)} className="underline">ver todos</Link></p>}

      <TablaRegistro clave="activos" filas={filas} volver={volver} editar={Number(sp.editar) || null} nuevo={!!sp.nuevo} puedeEditar
        abierto={(r) => r.estado !== "dado_de_baja"} vacio="No hay activos con ese filtro." />
      <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--gris)]">
        <span>Importado del panel de Donweb (cliente 22783467) el 28/10/2026. Las cuentas de hosting están incluidas en el plan revendedor mensual.</span>
        <Link href={con("bajas", sp.bajas ? null : "1")} className="underline">{sp.bajas ? "Ocultar dados de baja" : "Ver también dados de baja"}</Link>
      </div>
    </div>
  )
}
