"use server"
import { revalidatePath } from "next/cache"
import { soloJulio } from "@/lib/oficina"
import { diaValido, guardarNota, tildar } from "@/lib/informe"

export async function tildarDecision(fd: FormData) {
  if (!(await soloJulio())) return
  const dia = String(fd.get("dia")), clave = String(fd.get("clave") ?? "")
  if (!diaValido(dia) || !clave) return
  await tildar(dia, clave, fd.get("hecho") === "1")
  revalidatePath("/panel-contenido/tablero")
}
export async function dejarNota(fd: FormData) {
  if (!(await soloJulio())) return
  const dia = String(fd.get("dia"))
  if (!diaValido(dia)) return
  await guardarNota(dia, String(fd.get("texto") ?? ""))
  revalidatePath("/panel-contenido/tablero")
}
