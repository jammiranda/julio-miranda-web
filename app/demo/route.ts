import { NextResponse } from "next/server"
import { crearSesion } from "@/lib/auth"
import { one, DEMO } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Entrada directa a la demo en marca blanca: abre la sesión de Gerencia (datos ficticios). */
export async function GET(req: Request) {
  if (!DEMO) return NextResponse.redirect(new URL("/login", req.url))
  // La demo es privada: se entra con el link personal que manda DEVISEBIT (lleva la clave k)
  const sp = new URL(req.url).searchParams
  const clave = process.env.DEMO_KEY
  let ok = !clave || sp.get("k") === clave
  const t = sp.get("t")
  if (!ok && t) {
    try {
      const r = await fetch(`https://sistema.devisebit.com/api/demos/validar?t=${encodeURIComponent(t)}&s=salud-digital`, { cache: "no-store" })
      ok = !!(await r.json())?.ok
    } catch {}
  }
  if (!ok) return NextResponse.redirect("https://www.devisebit.com/demos?d=salud-digital#pedir")
  const u = await one<{ id: number; usuario: string; nombre: string; rol: "gerente" }>("select id, usuario, nombre, rol from usuarios where usuario='administrador'")
  if (u) await crearSesion(u)
  return NextResponse.redirect(new URL("/", req.url))
}
