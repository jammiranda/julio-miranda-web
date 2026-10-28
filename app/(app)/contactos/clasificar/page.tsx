import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { q, audit } from "@/lib/db"
import { requerir } from "@/lib/auth"
import { CLASES, SQL_SUGERENCIA, SQL_MOTIVO, clase as claseDe, esClase, etapa } from "@/lib/crm"
import { fecha } from "@/lib/util"
import ClasificarTabla from "@/components/ClasificarTabla"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const POR_PAGINA = 100

/** Condición SQL de la bandeja según los filtros (siempre: sin lista). */
function where(f: { sug?: string; b?: string; origen?: string }) {
  const cond = ["c.clase is null"], args: unknown[] = []
  const add = (sql: string, v: unknown) => { args.push(v); cond.push(sql.replace("$?", `$${args.length}`)) }
  if (f.sug === "ninguna") cond.push(`(${SQL_SUGERENCIA}) is null`)
  else if (esClase(f.sug)) add(`(${SQL_SUGERENCIA}) = $?`, f.sug)
  if (f.origen) add("coalesce(c.origen, c.fuente, 'Sin origen') = $?", f.origen)
  if (f.b) { args.push(f.b); const i = args.length; cond.push(`(c.nombre ilike '%'||$${i}||'%' or c.organizacion ilike '%'||$${i}||'%' or c.email ilike '%'||$${i}||'%' or c.telefono ilike '%'||$${i}||'%')`) }
  return { sql: cond.join(" and "), args }
}

async function clasificar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const op = String(fd.get("op") ?? "")
  const filtro = { sug: String(fd.get("f_sug") ?? "") || undefined, b: String(fd.get("f_b") ?? "") || undefined, origen: String(fd.get("f_origen") ?? "") || undefined }
  const volver = `/contactos/clasificar?${new URLSearchParams(Object.entries(filtro).filter(([, v]) => v) as [string, string][]).toString()}`
  let objetivo: { sql: string; args: unknown[] }
  if (fd.get("alcance") === "filtro") objetivo = where(filtro)
  else {
    const ids = String(fd.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 5000)
    if (!ids.length) redirect(volver)
    objetivo = { sql: "c.clase is null and c.id = any($1::int[])", args: [ids] }
  }
  const n = objetivo.args.length
  let r: { id: number }[] = []
  if (op === "sugerencia") {
    r = await q<{ id: number }>(
      `update db_contactos c set clase=s.sug, clasificado_en=now(), clasificado_por=$${n + 1}, actualizado=now()
       from (select c.id, (${SQL_SUGERENCIA}) sug from db_contactos c where ${objetivo.sql}) s
       where c.id=s.id and s.sug is not null returning c.id`, [...objetivo.args, u.nombre])
  } else if (op.startsWith("mover:") && esClase(op.slice(6))) {
    r = await q<{ id: number }>(`update db_contactos c set clase=$${n + 1}, clasificado_en=now(), clasificado_por=$${n + 2}, actualizado=now() where ${objetivo.sql} returning c.id`, [...objetivo.args, op.slice(6), u.nombre])
  }
  await audit(u, "clasifica_contactos", "db_contacto", r.slice(0, 200).map((x) => x.id).join(","), `${r.length} → ${op}`)
  revalidatePath("/contactos")
  redirect(`${volver}${volver.endsWith("?") ? "" : "&"}hecho=${r.length}&a=${encodeURIComponent(op === "sugerencia" ? "su lista sugerida" : claseDe(op.slice(6))?.n ?? "")}`)
}

export default async function Clasificar({ searchParams }: { searchParams: { sug?: string; b?: string; origen?: string; p?: string; hecho?: string; a?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const f = { sug: searchParams.sug, b: (searchParams.b ?? "").trim() || undefined, origen: searchParams.origen || undefined }
  const pag = Math.max(0, Number(searchParams.p) || 0)
  const w = where(f)
  const base = where({})
  const [filas, tot, porSug, origenes, clasificados] = await Promise.all([
    q<any>(`select c.id, c.nombre, c.organizacion, c.email, c.telefono, coalesce(c.origen, c.fuente) origen, c.etapa, c.creado, (${SQL_SUGERENCIA}) sug, (${SQL_MOTIVO}) motivo
            from db_contactos c where ${w.sql} order by c.creado desc, c.id desc limit ${POR_PAGINA} offset ${pag * POR_PAGINA}`, w.args),
    q<{ n: number }>(`select count(*)::int n from db_contactos c where ${w.sql}`, w.args),
    q<{ sug: string | null; n: number }>(`select (${SQL_SUGERENCIA}) sug, count(*)::int n from db_contactos c where ${base.sql} group by 1 order by 2 desc`, base.args),
    q<{ o: string; n: number }>(`select coalesce(c.origen, c.fuente, 'Sin origen') o, count(*)::int n from db_contactos c where ${base.sql} group by 1 order by 2 desc limit 25`, base.args),
    q<{ n: number }>("select count(*)::int n from db_contactos where clase is not null"),
  ])
  const total = tot[0]?.n ?? 0
  const pendientes = porSug.reduce((a, x) => a + x.n, 0)
  const qs = (o: Record<string, string | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ ...f, ...o })) if (v) p.set(k, v); return `/contactos/clasificar?${p.toString()}` }
  const filtro = Object.fromEntries(Object.entries(f).filter(([, v]) => v)) as Record<string, string>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/contactos" className="text-sm underline text-[#4A515C]">← Contactos</Link>
          <h1 className="m-0 mt-1">Por clasificar <span className="text-[#4A515C] font-semibold">· {pendientes}</span></h1>
          <p className="m-0 text-sm text-[#4A515C] max-w-3xl">Acá entra todo lo que no tiene lista: la base anterior, lo importado y lo que llega sin datos claros. Ubicá cada contacto donde corresponde y desaparece de acá. El sistema sugiere una lista según lo que sabe de cada uno (proyectos, cobros, cursos, conversaciones). Mientras estén acá, no reciben email marketing.</p>
        </div>
        <span className="text-sm text-[#4A515C]">{clasificados[0]?.n ?? 0} ya clasificados</span>
      </div>

      {searchParams.hecho && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">Listo: {searchParams.hecho} contacto{searchParams.hecho === "1" ? "" : "s"} a {searchParams.a}.</p>}

      <section aria-label="Listas" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {CLASES.map((x) => <div key={x.v} className="rounded-xl border border-[#E2E5EA] bg-white p-3"><span className={`chip ${x.c}`}>{x.n}</span><p className="m-0 mt-1 text-xs text-[#4A515C]">{x.d}</p></div>)}
      </section>

      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-3 border-b border-[#E2E5EA]">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-semibold text-[#4A515C] mr-1">Sugerencia:</span>
            <Link href={qs({ sug: undefined, p: undefined })} className={`chip text-sm px-3 py-1 border ${!f.sug ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>Todas · {pendientes}</Link>
            {porSug.map((x) => {
              const v = x.sug ?? "ninguna"
              return <Link key={v} href={qs({ sug: v, p: undefined })} className={`chip text-sm px-3 py-1 border ${f.sug === v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{claseDe(x.sug)?.n ?? "Sin sugerencia"} · {x.n}</Link>
            })}
          </div>
          <form className="flex flex-wrap gap-2 items-center">
            {f.sug && <input type="hidden" name="sug" value={f.sug} />}
            <select name="origen" defaultValue={f.origen ?? ""} className="inp py-1.5 w-auto" aria-label="Origen"><option value="">Todos los orígenes</option>{origenes.map((o) => <option key={o.o} value={o.o}>{o.o} ({o.n})</option>)}</select>
            <input name="b" defaultValue={f.b ?? ""} placeholder="Buscar nombre, email, teléfono" className="inp py-1.5 w-60" />
            <button className="btn-s py-1.5">Filtrar</button>
            {(f.b || f.origen) && <Link href={qs({ b: undefined, origen: undefined, p: undefined })} className="text-sm underline text-[#4A515C]">Limpiar</Link>}
          </form>
          <p className="m-0 text-xs text-[#4A515C]">Tildá contactos (o el casillero del encabezado y después «Elegir los N que coinciden») y aceptá la sugerencia o elegí la lista. Con ✓ en cada fila, lo ubicás de a uno.</p>
        </div>
        <ClasificarTabla
          filas={filas.map((c) => ({ id: c.id, nombre: c.nombre, organizacion: c.organizacion, email: c.email, telefono: c.telefono, origen: c.origen, etapaN: etapa(c.etapa).n, creado: fecha(c.creado), sug: c.sug, sugN: claseDe(c.sug)?.n ?? null, sugC: claseDe(c.sug)?.c ?? null, motivo: c.motivo }))}
          clases={CLASES.map((x) => ({ v: x.v, n: x.n, d: x.d }))}
          accion={clasificar}
          total={total}
          filtro={filtro}
        />
        {total > POR_PAGINA && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E5EA] text-sm">
            <span className="text-[#4A515C]">{pag * POR_PAGINA + 1}–{Math.min(total, (pag + 1) * POR_PAGINA)} de {total}</span>
            <div className="flex gap-2">
              {pag > 0 && <Link href={qs({ p: String(pag - 1) })} className="btn-s py-1">← Anteriores</Link>}
              {(pag + 1) * POR_PAGINA < total && <Link href={qs({ p: String(pag + 1) })} className="btn-s py-1">Siguientes →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
