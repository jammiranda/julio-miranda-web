"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"

/**
 * Eliminar desde cualquier lista del sistema. Solo Dirección y Coordinación; queda en Auditoría.
 * Cada entidad dice qué borra y qué protege (por ejemplo, no se borra una venta pagada ni un producto con compras).
 */
const volverA = (v: unknown) => { const s = String(v ?? ""); return s.startsWith("/") && !s.startsWith("//") ? s : "/" }
const con = (url: string, k: string, v: string) => { const u = url.replace(/([?&])(eliminado|noeliminado)=[^&]*&?/g, "$1").replace(/[?&]$/, ""); return `${u}${u.includes("?") ? "&" : "?"}${k}=${encodeURIComponent(v)}` }

export async function eliminar(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const e = String(fd.get("e") ?? "")
  const id = String(fd.get("id") ?? "")
  const volver = volverA(fd.get("volver"))
  const n = Number(id)
  let msg = ""
  let error = ""
  try {
    if (e === "guia" && n) { await q("delete from am_guias where id=$1", [n]); msg = "Guía eliminada" }
    else if (e === "producto" && n) {
      const c = await one<{ n: number }>("select count(*)::int n from am_ordenes where producto_id=$1", [n])
      if ((c?.n ?? 0) > 0) error = "Ese producto tiene compras registradas. Pasalo a «Oculto» en vez de eliminarlo."
      else { await q("delete from am_productos where id=$1", [n]); msg = "Producto eliminado" }
    }
    else if (e === "orden" && n) {
      const o = await one<{ estado: string }>("select estado from am_ordenes where id=$1", [n])
      if (o?.estado === "pagada") error = "Una venta pagada no se elimina: queda como registro."
      else { await q("delete from am_ordenes where id=$1", [n]); msg = "Compra eliminada" }
    }
    else if (e === "inscripcion" && n) { await q("delete from am_inscripciones where id=$1", [n]); msg = "Inscripción eliminada (también su progreso y certificado)" }
    else if (e === "autor" && n) { await q("delete from am_autores where id=$1", [n]); msg = "Autor eliminado" }
    else if (e === "contacto" && n) {
      // Los proyectos, reuniones y envíos se conservan, sin contacto asociado.
      await q("update db_proyectos set contacto_id=null where contacto_id=$1", [n])
      await q("update db_reuniones set contacto_id=null where contacto_id=$1", [n])
      await q("update em_envios set contacto_id=null where contacto_id=$1", [n])
      await q("delete from db_contactos where id=$1", [n])
      msg = "Contacto eliminado"
    }
    else if (e === "publicacion") {
      const [red, pid] = id.split("|")
      if (red && pid) { await q("delete from pc_publicaciones where red=$1 and id=$2", [red, pid]); msg = "Publicación eliminada del panel" }
    }
    else error = "No se pudo eliminar: elemento desconocido."
  } catch {
    error = "No se pudo eliminar: tiene datos asociados que dependen de él."
  }
  if (msg) { await audit(u, "elimina", e, id); revalidatePath("/", "layout") }
  redirect(error ? con(volver, "noeliminado", error) : con(volver, "eliminado", msg || "Listo"))
}
