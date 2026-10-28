import Link from "next/link"
import { q } from "@/lib/db"
import { ENTIDADES, dinero, isoD, op, type Campo } from "@/lib/gestion"
import { guardarRegistro, borrarRegistro, resolverRapido } from "@/lib/gestion-acciones"
import { fecha, hoyISO } from "@/lib/util"

type Refs = Record<string, { id: number; n: string }[]>

async function cargarRefs(campos: Campo[]): Promise<Refs> {
  const need = new Set(campos.filter((c) => c.t === "ref").map((c) => c.ref!))
  const r: Refs = {}
  if (need.has("contactos")) r.contactos = await q<any>("select id, coalesce(nullif(organizacion,''), nombre) n from db_contactos where coalesce(clase,'') in ('cliente','oportunidad','aliado') or etapa in ('propuesta','ganado') order by 2 limit 500")
  if (need.has("proyectos")) r.proyectos = await q<any>("select id, nombre n from db_proyectos order by creado desc limit 300")
  if (need.has("proveedores")) r.proveedores = await q<any>("select id, nombre n from g_proveedores order by nombre limit 500")
  return r
}

const conParam = (url: string, k: string, v: string) => {
  const [p, qs] = url.split("?")
  const sp = new URLSearchParams(qs ?? "")
  sp.set(k, v)
  return `${p}?${sp.toString()}`
}
const sinParams = (url: string, ...ks: string[]) => {
  const [p, qs] = url.split("?")
  const sp = new URLSearchParams(qs ?? "")
  ks.forEach((k) => sp.delete(k))
  const s = sp.toString()
  return s ? `${p}?${s}` : p
}

function Entrada({ c, valor, refs }: { c: Campo; valor: any; refs: Refs }) {
  const id = `f-${c.k}`
  const v = valor ?? c.def ?? ""
  const etiqueta = <span>{c.n}{c.req && <span className="text-rojo" aria-hidden="true"> *</span>}</span>
  const ayuda = c.ayuda ? <span className="text-xs font-normal text-[var(--gris)]">{c.ayuda}</span> : null
  if (c.t === "bool")
    return <label className={`flex items-center gap-2 text-sm font-semibold ${c.ancho ? "sm:col-span-2" : ""}`}><input type="checkbox" id={id} name={c.k} defaultChecked={!!valor} />{c.n}</label>
  return (
    <label className={`lbl ${c.ancho || c.t === "area" ? "sm:col-span-2" : ""}`} htmlFor={id}>
      {etiqueta}
      {c.t === "area" ? <textarea id={id} name={c.k} defaultValue={v} rows={3} className="inp" />
        : c.t === "sel" ? (
          <select id={id} name={c.k} defaultValue={v} required={c.req} className="inp">
            {!c.req && <option value="">—</option>}
            {c.ops!.map((o) => <option key={o.v} value={o.v}>{o.n}</option>)}
          </select>
        ) : c.t === "ref" ? (
          <select id={id} name={c.k} defaultValue={v ?? ""} className="inp">
            <option value="">—</option>
            {(refs[c.ref!] ?? []).map((o) => <option key={o.id} value={o.id}>{o.n}</option>)}
          </select>
        ) : (
          <input id={id} name={c.k} required={c.req} className="inp"
            type={c.t === "date" ? "date" : c.t === "url" ? "url" : "text"} inputMode={c.t === "num" ? "decimal" : undefined}
            defaultValue={c.t === "date" ? isoD(v) ?? "" : c.t === "num" && v !== "" && v != null ? String(Math.round(Number(v) * 100) / 100).replace(".", ",") : v}
            placeholder={c.t === "url" ? "https://…" : c.t === "num" ? "0" : undefined} />
        )}
      {ayuda}
    </label>
  )
}

/** Formulario de alta/edición de un registro de gestión. */
export async function FormRegistro({ clave, fila, volver }: { clave: string; fila?: any; volver: string }) {
  const ent = ENTIDADES[clave]
  const refs = await cargarRefs(ent.campos)
  return (
    <div className="flex flex-col gap-3">
      <form action={guardarRegistro} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="hidden" name="_ent" value={clave} />
        <input type="hidden" name="_volver" value={volver} />
        {fila && <input type="hidden" name="_id" value={fila.id} />}
        {ent.campos.map((c) => <Entrada key={c.k} c={c} valor={fila?.[c.k]} refs={refs} />)}
        <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
          <button className="btn-p">{fila ? "Guardar cambios" : `Cargar ${ent.uno}`}</button>
          <Link href={sinParams(volver, "editar", "nuevo")} className="btn-s">Cancelar</Link>
        </div>
      </form>
      {fila && (
        <details className="text-sm">
          <summary className="cursor-pointer text-rojo font-semibold w-fit">Borrar este {ent.uno}…</summary>
          <form action={borrarRegistro} className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="_ent" value={clave} /><input type="hidden" name="_id" value={fila.id} />
            <input type="hidden" name="_volver" value={volver} /><input type="hidden" name="_confirmo" value="si" />
            <span className="text-[var(--gris)]">No se puede deshacer.</span>
            <button className="btn-s !border-red-300 text-rojo py-1.5">Sí, borrar</button>
          </form>
        </details>
      )}
    </div>
  )
}

/** Celda según el tipo de campo. */
function Celda({ c, r, refs, abiertos }: { c: Campo; r: any; refs: Refs; abiertos: boolean }) {
  const v = r[c.k]
  if (v == null || v === "") return <span className="text-[var(--gris)]">—</span>
  if (c.t === "sel") { const o = c.ops?.find((x) => x.v === v); return o?.c ? <span className={`chip ${o.c}`}>{o.n}</span> : <span>{o?.n ?? v}</span> }
  if (c.t === "ref") return <span>{refs[c.ref!]?.find((x) => x.id === v)?.n ?? `#${v}`}</span>
  if (c.t === "num") return <span className="tabular-nums whitespace-nowrap font-semibold">{dinero(v, r.moneda ?? "ARS")}</span>
  if (c.t === "url") return <a href={v} target="_blank" rel="noopener noreferrer" className="text-[var(--ac-texto)] font-semibold underline underline-offset-2 whitespace-nowrap">Abrir ↗</a>
  if (c.t === "bool") return <span>{v ? "Sí" : "No"}</span>
  if (c.t === "date") {
    const d = isoD(v)!
    const tarde = abiertos && d < hoyISO()
    return <span className={`whitespace-nowrap ${tarde ? "text-rojo font-semibold" : ""}`}>{fecha(d)}{tarde ? " · vencido" : ""}</span>
  }
  return <span>{String(v)}</span>
}

/** Tabla de registros con edición en la misma página (?editar=ID) y alta (?nuevo=1). */
export async function TablaRegistro({ clave, filas, volver, editar, nuevo, puedeEditar, abierto, vacio, rapido }: {
  clave: string; filas: any[]; volver: string; editar?: number | null; nuevo?: boolean; puedeEditar: boolean
  abierto?: (r: any) => boolean; vacio: string; rapido?: { etiqueta: string; si: (r: any) => boolean }
}) {
  const ent = ENTIDADES[clave]
  const cols = ent.campos.filter((c) => c.lista)
  const refs = await cargarRefs(cols)
  const filaEditar = editar ? filas.find((f) => f.id === editar) ?? (await q<any>(`select * from ${ent.tabla} where id=$1`, [editar]))[0] ?? null : null
  return (
    <div className="flex flex-col gap-3">
      {puedeEditar && (nuevo || filaEditar) && (
        <section className="card border-[var(--ac)]" aria-label={filaEditar ? `Editar ${ent.uno}` : `Nuevo ${ent.uno}`}>
          <h2 className="m-0 mb-3 text-base">{filaEditar ? `Editar: ${filaEditar[ent.titulo]}` : `Nuevo ${ent.uno}`}</h2>
          <FormRegistro clave={clave} fila={filaEditar ?? undefined} volver={volver} />
        </section>
      )}
      {filas.length ? (
        <div className="card !p-0 overflow-x-auto">
          <table className="tbl">
            <thead><tr>{cols.map((c) => <th key={c.k} className={c.t === "num" ? "text-right" : ""}>{c.n}</th>)}{puedeEditar && <th className="w-px"><span className="sr-only">Acciones</span></th>}</tr></thead>
            <tbody>
              {filas.map((r) => {
                const ab = abierto ? abierto(r) : true
                return (
                  <tr key={r.id} className={editar === r.id ? "bg-[var(--ac-suave)]" : ""}>
                    {cols.map((c, i) => (
                      <td key={c.k} className={`${c.t === "num" ? "text-right" : ""} ${i === 0 ? "font-semibold min-w-[180px]" : ""}`}>
                        <Celda c={c} r={r} refs={refs} abiertos={ab} />
                      </td>
                    ))}
                    {puedeEditar && (
                      <td className="whitespace-nowrap text-right">
                        <span className="inline-flex gap-1.5">
                          {rapido && rapido.si(r) && (
                            <form action={resolverRapido}><input type="hidden" name="_ent" value={clave} /><input type="hidden" name="_id" value={r.id} /><input type="hidden" name="_volver" value={volver} />
                              <button className="btn-s py-1 px-2.5 text-xs">✓ {rapido.etiqueta}</button></form>
                          )}
                          <Link href={conParam(sinParams(volver, "nuevo", "ok", "error"), "editar", String(r.id))} className="btn-s py-1 px-2.5 text-xs" aria-label={`Editar ${r[ent.titulo]}`}>Editar</Link>
                        </span>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : <p className="vacio">{vacio}</p>}
    </div>
  )
}

export function Aviso({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null
  return <p role="status" className={`m-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${error ? "bg-red-50 text-rojo" : "bg-emerald-50 text-emerald-800"}`}>{error ?? ok}</p>
}

export function Pestanias({ base, actual, items }: { base: string; actual: string; items: { v: string; n: string; cant?: number }[] }) {
  return (
    <nav aria-label="Secciones" className="flex flex-wrap gap-1 border-b border-[var(--borde)]">
      {items.map((i) => {
        const on = i.v === actual
        return (
          <Link key={i.v} href={`${base}?ver=${i.v}`} aria-current={on ? "page" : undefined}
            className={`px-3.5 py-2 -mb-px text-sm font-semibold border-b-2 ${on ? "border-[var(--ac)] text-[var(--tinta)]" : "border-transparent text-[var(--gris)] hover:text-[var(--tinta)]"}`}>
            {i.n}{i.cant != null && <span className="ml-1.5 text-xs font-bold text-[var(--gris)] tabular-nums">{i.cant}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function Kpi({ t, v, d, tono, href }: { t: string; v: string | number; d?: string; tono?: "rojo" | "verde" | "ambar"; href?: string }) {
  const col = tono === "rojo" ? "text-rojo" : tono === "verde" ? "text-emerald-700" : tono === "ambar" ? "text-amber-700" : "text-[var(--tinta)]"
  const cuerpo = (
    <>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--gris)]">{t}</span>
      <span className={`text-2xl font-extrabold tabular-nums leading-tight ${col}`}>{v}</span>
      {d && <span className="text-xs text-[var(--gris)]">{d}</span>}
    </>
  )
  return href
    ? <Link href={href} className="card card-link !p-4 flex flex-col gap-1 min-w-0 transition-shadow">{cuerpo}</Link>
    : <div className="card !p-4 flex flex-col gap-1 min-w-0">{cuerpo}</div>
}

export { op }
