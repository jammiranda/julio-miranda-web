import { NextResponse } from "next/server"
import { crearSesion } from "@/lib/auth"
import { one, DEMO } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Entrada directa a la demo en marca blanca: abre la sesión de Gerencia (datos ficticios). */
export async function GET(req: Request) {
  if (!DEMO) return NextResponse.redirect(new URL("/login", req.url))
  const u = await one<{ id: number; usuario: string; nombre: string; rol: "gerente" }>("select id, usuario, nombre, rol from usuarios where usuario='administrador'")
  if (u) await crearSesion(u)
  return NextResponse.redirect(new URL("/", req.url))
}
