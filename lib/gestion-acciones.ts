"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { ENTIDADES, ESTADOS_MOD, numero, siguiente, isoD } from "@/lib/gestion"

const volverA = (fd: FormData, def: string) => {
  const v = String(fd.get("_volver") ?? def)
  return v.startsWith("/") && !v.startsWith("//") ? v : def
}
const quitarParam = (url: string, ...ks: string[]) => {
  const [p, qs] = url.split("?")
  const sp = new URLSearchParams(qs ?? "")
  ks.forEach((k) => sp.delete(k))
  const s = sp.toString()
  return s ? `${p}?${s}` : p
}

/** Alta o edición de cualquier registro de gestión. Solo se guardan los campos declarados en lib/gestion.ts. */
export async function guardarRegistro(fd: FormData) {
  const u = await requerir()
  const clave = String(fd.get("_ent") ?? "")
  const ent = ENTIDADES[clave]
  if (!ent) throw new Error("Registro desconocido")
  if (!ent.edita.includes(u.rol)) redirect("/")
  const id = Number(fd.get("_id") ?? 0) || null
  const volver = volverA(fd, "/gestion")

  const cols: string[] = []
  const vals: unknown[] = []
  for (const c of ent.campos) {
    const raw = fd.get(c.k)
    let v: unknown
    if (c.t === "bool") v = raw === "on"
    else {
      const t = (raw ?? "").toString().trim()
      if (!t) v = null
      else if (c.t === "num") v = numero(t)
      else if (c.t === "ref") v = Number(t) || null
      else if (c.t === "sel") v = c.ops?.some((o) => o.v === t) ? t : null
      else if (c.t === "url") v = /^https?:\/\//i.test(t) ? t : `https://${t}`
      else v = t
    }
    if (v == null && c.def != null) v = c.def
    if (c.req && (v == null || v === "")) redirect(`${quitarParam(volver, "ok")}${volver.includes("?") ? "&" : "?"}error=${encodeURIComponent(`Falta completar: ${c.n}`)}`)
    cols.push(c.k)
    vals.push(v)
  }

  let nuevoId = id
  if (id) {
    const antes = await one<any>(`select * from ${ent.tabla} where id=$1`, [id])
    await q(`update ${ent.tabla} set ${cols.map((k, i) => `${k}=$${i + 1}`).join(", ")}, actualizado=now() where id=$${cols.length + 1}`, [...vals, id])
    // Vencimientos que se repiten: al marcarlos hechos se crea el próximo
    const r = Object.fromEntries(cols.map((k, i) => [k, vals[i]])) as any
    if (clave === "vencimientos" && antes?.estado !== "hecho" && r.estado === "hecho" && r.recurrencia !== "unica" && r.vence) {
      const prox = siguiente(String(r.vence), r.recurrencia)
      const ya = await one("select id from g_vencimientos where titulo=$1 and vence=$2", [r.titulo, prox])
      if (!ya) await q("insert into g_vencimientos(titulo,area,vence,recurrencia,estado,monto,responsable,nota,creado_por) values ($1,$2,$3,$4,'pendiente',$5,$6,$7,$8)", [r.titulo, r.area, prox, r.recurrencia, r.monto, r.responsable, r.nota, u.usuario])
    }
    await audit(u, "editar", ent.tabla, id)
  } else {
    const r = await one<{ id: number }>(`insert into ${ent.tabla}(${cols.join(",")},creado_por) values (${cols.map((_, i) => `$${i + 1}`).join(",")},$${cols.length + 1}) returning id`, [...vals, u.usuario])
    nuevoId = r?.id ?? null
    await audit(u, "crear", ent.tabla, nuevoId ?? undefined)
  }
  revalidatePath("/", "layout")
  const base = quitarParam(volver, "editar", "nuevo", "error", "ok")
  redirect(`${base}${base.includes("?") ? "&" : "?"}ok=${encodeURIComponent(id ? "Cambios guardados" : `${ent.uno[0].toUpperCase()}${ent.uno.slice(1)} cargado`)}`)
}

export async function borrarRegistro(fd: FormData) {
  const u = await requerir()
  const clave = String(fd.get("_ent") ?? "")
  const ent = ENTIDADES[clave]
  if (!ent || !ent.edita.includes(u.rol)) redirect("/")
  const id = Number(fd.get("_id") ?? 0)
  if (fd.get("_confirmo") !== "si") return
  await q(`delete from ${ent.tabla} where id=$1`, [id])
  await audit(u, "borrar", ent.tabla, id)
  revalidatePath("/", "layout")
  const base = quitarParam(volverA(fd, "/gestion"), "editar", "nuevo", "error", "ok")
  redirect(`${base}${base.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Registro borrado")}`)
}

/** Marca un movimiento pendiente como pagado hoy, o un vencimiento como hecho, con un clic. */
export async function resolverRapido(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const clave = String(fd.get("_ent") ?? "")
  const id = Number(fd.get("_id") ?? 0)
  if (clave === "movimientos") {
    await q("update g_movimientos set estado='pagado', fecha=coalesce(fecha, current_date), actualizado=now() where id=$1 and estado='pendiente'", [id])
  } else if (clave === "vencimientos") {
    const v = await one<any>("select * from g_vencimientos where id=$1", [id])
    if (v && v.estado !== "hecho") {
      await q("update g_vencimientos set estado='hecho', actualizado=now() where id=$1", [id])
      if (v.recurrencia !== "unica") {
        const prox = siguiente(isoD(v.vence)!, v.recurrencia)
        const ya = await one("select id from g_vencimientos where titulo=$1 and vence=$2", [v.titulo, prox])
        if (!ya) await q("insert into g_vencimientos(titulo,area,vence,recurrencia,estado,monto,responsable,nota,creado_por) values ($1,$2,$3,$4,'pendiente',$5,$6,$7,$8)", [v.titulo, v.area, prox, v.recurrencia, v.monto, v.responsable, v.nota, u.usuario])
      }
    }
  }
  await audit(u, "resolver", clave, id)
  revalidatePath("/", "layout")
  redirect(quitarParam(volverA(fd, "/gestion"), "ok", "error"))
}

/** Tablero de módulos: estado, próximo paso, fecha y bloqueo de cada área. */
export async function guardarModulo(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const codigo = String(fd.get("codigo") ?? "")
  const estado = String(fd.get("estado") ?? "")
  const t = (k: string) => (fd.get(k) ?? "").toString().trim() || null
  if (!ESTADOS_MOD.some((e) => e.v === estado)) return
  await q("update g_modulos set estado=$2, proximo=$3, fecha=$4, bloqueo=$5, actualizado=now(), actualizado_por=$6 where codigo=$1", [codigo, estado, t("proximo"), t("fecha"), t("bloqueo"), u.nombre])
  await audit(u, "modulo", "g_modulos", codigo, estado)
  revalidatePath("/", "layout")
  redirect(`/modulos?ok=${encodeURIComponent("Módulo actualizado")}#${codigo}`)
}
