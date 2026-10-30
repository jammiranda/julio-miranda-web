import { NextResponse } from "next/server"
import { sesionCuenta } from "@/lib/portal"
import { usuarioActual } from "@/lib/auth"
import { slugsDe } from "@/lib/autores"

export const dynamic = "force-dynamic"

/**
 * Quién está mirando la Academia (para el header): alumno o cliente (cookie db_cuenta) y,
 * si además tiene la sesión del equipo (db_sesion) con el espacio Academia, el link al Sistema Academia.
 * Se pide desde el navegador para que las páginas públicas sigan siendo cacheables.
 */
export async function GET() {
  const [c, u] = await Promise.all([sesionCuenta().catch(() => null), usuarioActual().catch(() => null)])
  const autor = c ? (await slugsDe(c.email).catch(() => [])).length > 0 : false
  return NextResponse.json(
    { cuenta: c ? { nombre: c.nombre, email: c.email } : null, sistema: !!u?.espacios.includes("academia"), autor },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
