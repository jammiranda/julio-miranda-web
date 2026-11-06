"use server"
import { revalidatePath } from "next/cache"
import { acceso } from "./_ui"
import { borrarPrefsDe, guardarPrefsDe, limpiar } from "@/lib/panel-prefs"

export async function guardarPrefs(raw: unknown) {
  const u = await acceso()
  if (!u) return { ok: false as const }
  await guardarPrefsDe(u.id, limpiar(raw))
  revalidatePath("/", "layout")
  return { ok: true as const }
}
export async function restablecerPrefs() {
  const u = await acceso()
  if (!u) return { ok: false as const }
  await borrarPrefsDe(u.id)
  revalidatePath("/", "layout")
  return { ok: true as const }
}
