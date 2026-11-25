import { NextResponse } from "next/server"
import { crearSesion } from "@/lib/auth"
import { one, DEMO } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Entrada directa a la demo en marca blanca: abre la sesión de Gerencia (datos ficticios). */
export async function GET(req: Request) {
  if (!DEMO) return NextResponse.redirect(new URL("/login", req.url))
  // La demo es privada: se entra con el link personal que manda DEVISEBIT (lleva la clave k)
  const clave = process.env.DEMO_KEY
  if (clave && new URL(req.url).searchParams.get("k") !== clave) return NextResponse.redirect("https://www.devisebit.com/demos?d=salud-digital#pedir")
  const u = await one<{ id: number; usuario: string; nombre: string; rol: "gerente" }>("select id, usuario, nombre, rol from usuarios where usuario='administrador'")
  if (u) await crearSesion(u)
  return NextResponse.redirect(new URL("/", req.url))
}
