import { q, one, audit } from "./db"
import { MODULOS } from "./util"

export type Fila = {
  nombre: string; modulo?: string | null
  enf?: number; kin?: number; med?: number; fono?: number; cuidador?: number; insumos?: number
  equipos?: string[]; estado?: string | null
}

const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(x) && x > 0 ? Math.round(x) : 0 }

export async function importarMes(periodo: string, filas: Fila[], origen: string, user: { id: number; usuario: string } | null) {
  if (!/^\d{4}-\d{2}$/.test(periodo)) throw new Error("Período inválido")
  const limpias = filas
    .map((f) => ({ ...f, nombre: String(f.nombre ?? "").trim().replace(/\s+/g, " ").toUpperCase() }))
    .filter((f) => f.nombre.length > 2 && !/^TOTAL/.test(f.nombre))
  let nuevos = 0
  const ids: number[] = []
  for (const f of limpias) {
    let p = await one<{ id: number }>("select id from pacientes where upper(trim(apellido_nombre))=$1 limit 1", [f.nombre])
    const fallecido = /FALLECI/i.test(f.estado ?? "")
    if (!p) {
      p = await one<{ id: number }>("insert into pacientes(apellido_nombre, estado) values ($1,$2) returning id", [f.nombre, fallecido ? "fallecido" : "activo"])
      nuevos++
    } else if (fallecido) {
      await q("update pacientes set estado='fallecido' where id=$1", [p.id])
    }
    const mod = String(f.modulo ?? "").trim().toUpperCase()
    await q(
      `insert into carga_mensual(periodo,paciente_id,modulo,enf,kin,med,fono,cuidador,insumos,equipos,estado_obs,origen)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (periodo,paciente_id) do update set modulo=$3,enf=$4,kin=$5,med=$6,fono=$7,cuidador=$8,insumos=$9,equipos=$10,estado_obs=$11,origen=$12,importado=now()`,
      [periodo, p!.id, mod || null, n(f.enf), n(f.kin), n(f.med), n(f.fono), n(f.cuidador), n(f.insumos), (f.equipos ?? []).join(", ") || null, f.estado ?? null, origen],
    )
    ids.push(p!.id)
  }
  if (ids.length) await q("delete from carga_mensual where periodo=$1 and not (paciente_id = any($2::int[]))", [periodo, ids])
  const invalidos = limpias.filter((f) => f.modulo && !(MODULOS as readonly string[]).includes(String(f.modulo).trim().toUpperCase())).map((f) => `${f.nombre} (${f.modulo})`)
  await audit(user, "importar_mes", "carga_mensual", periodo, `${limpias.length} filas · ${nuevos} pacientes nuevos · ${origen}`)
  return { filas: limpias.length, nuevos, invalidos }
}

/** Convierte una solapa de la planilla de Débora (filas como arrays) en filas de importación. */
export function desdePlanilla(rows: unknown[][]): Fila[] {
  const hi = rows.findIndex((r) => r.some((c) => String(c ?? "").trim().toUpperCase() === "AFILIADO"))
  if (hi < 0) throw new Error("No encontré la fila de encabezados (AFILIADO, MODULO, ENF CANT…)")
  const H = rows[hi].map((c) => String(c ?? "").trim().toUpperCase())
  const col = (...names: string[]) => H.findIndex((h) => names.includes(h))
  const ci = {
    nombre: col("AFILIADO"), modulo: col("MODULO", "MÓDULO"), enf: col("ENF CANT", "ENFERMERIA", "ENFERMERÍA"), kin: col("KINE CANT", "KINESIOLOGIA", "KINESIOLOGÍA"),
    med: col("MED CANT", "MEDICO", "MÉDICO"), fono: col("FONO"), cuidador: col("CUIDADOR"), insumos: col("INSUMOS"), estado: H.findIndex((h) => h.startsWith("ESTADO")),
  }
  const EQ = ["CAMA", "COLCHON", "COLCHÓN", "SILLA DE RUEDAS", "CONCENTRADOR", "ANDADOR", "ELEVADOR"]
  const eqCols = H.map((h, i) => (EQ.includes(h) ? i : -1)).filter((i) => i >= 0)
  const g = (r: unknown[], i: number) => (i >= 0 ? r[i] : undefined)
  return rows.slice(hi + 1).filter((r) => String(g(r, ci.nombre) ?? "").trim()).map((r) => ({
    nombre: String(g(r, ci.nombre)), modulo: g(r, ci.modulo) as string, enf: g(r, ci.enf) as number, kin: g(r, ci.kin) as number, med: g(r, ci.med) as number,
    fono: g(r, ci.fono) as number, cuidador: g(r, ci.cuidador) as number, insumos: g(r, ci.insumos) as number,
    equipos: eqCols.filter((i) => Number(String(r[i] ?? "").replace(/[^\d]/g, "")) > 0).map((i) => H[i].charAt(0) + H[i].slice(1).toLowerCase()),
    estado: (g(r, ci.estado) as string) ?? null,
  }))
}
