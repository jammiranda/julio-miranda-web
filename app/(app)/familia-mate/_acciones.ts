"use server"
import { revalidatePath } from "next/cache"
import { soloJulio } from "@/lib/oficina"

/** Códigos de regalo de la familia Mate: se crean y se guardan en MateBot (que los valida para todos los productos). */
async function promo(body: Record<string, unknown>) {
  if (!(await soloJulio())) return { error: "Solo Julio puede manejar los códigos." }
  const key = process.env.STATS_KEY
  if (!key) return { error: "Falta la clave de MateBot." }
  const r = await fetch("https://matebot.devisebit.com/api/admin/promo", {
    method: "POST", headers: { "content-type": "application/json", "x-admin-key": key }, cache: "no-store", body: JSON.stringify(body),
  }).catch(() => null)
  const j = r ? await r.json().catch(() => ({})) : {}
  revalidatePath("/familia-mate")
  return r?.ok ? j : { error: j.error || "MateBot no respondió. Probá de nuevo." }
}
export async function crearCodigos(d: { producto: string; dias: number; cantidad: number; usos: number; nota: string }) {
  return promo(d) as Promise<{ codigos?: string[]; error?: string }>
}
export async function editarCodigo(d: { code: string; nota: string; dias: number; usos: number }) {
  return promo({ editar: d.code, nota: d.nota, dias: d.dias, usos: d.usos }) as Promise<{ ok?: boolean; error?: string }>
}
export async function borrarCodigo(code: string) {
  return promo({ borrar: code }) as Promise<{ ok?: boolean; error?: string }>
}
