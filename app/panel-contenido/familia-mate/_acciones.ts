"use server"
import { revalidatePath } from "next/cache"
import { soloJulio } from "@/lib/oficina"

/** Códigos de regalo de la familia Mate: se crean y se guardan en MateBot (que los valida para todos los productos). */
export async function crearCodigos(fd: FormData) {
  if (!(await soloJulio())) return
  const key = process.env.STATS_KEY
  if (!key) return
  await fetch("https://matebot.devisebit.com/api/admin/promo", {
    method: "POST", headers: { "content-type": "application/json", "x-admin-key": key }, cache: "no-store",
    body: JSON.stringify({ producto: String(fd.get("producto") || "todos"), dias: Number(fd.get("dias") || 90), cantidad: Number(fd.get("cantidad") || 1), usos: Number(fd.get("usos") || 1), nota: String(fd.get("nota") || "") }),
  }).catch(() => null)
  revalidatePath("/panel-contenido/familia-mate")
}
export async function borrarCodigo(fd: FormData) {
  if (!(await soloJulio())) return
  const key = process.env.STATS_KEY
  if (!key) return
  await fetch("https://matebot.devisebit.com/api/admin/promo", { method: "POST", headers: { "content-type": "application/json", "x-admin-key": key }, cache: "no-store", body: JSON.stringify({ borrar: String(fd.get("code") || "") }) }).catch(() => null)
  revalidatePath("/panel-contenido/familia-mate")
}
