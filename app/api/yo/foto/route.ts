import { usuarioActual } from "@/lib/auth"
import { one } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Foto de perfil del usuario en sesión. La URL lleva ?v=<versión>, así el navegador la guarda y no vuelve a pedirla. */
export async function GET() {
  const u = await usuarioActual()
  if (!u) return new Response(null, { status: 401 })
  const r = await one<{ foto: string | null }>("select foto from usuarios where id=$1", [u.id])
  const m = r?.foto?.match(/^data:(image\/jpeg);base64,(.+)$/)
  if (!m) return new Response(null, { status: 404 })
  return new Response(Buffer.from(m[2], "base64"), { headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=31536000, immutable" } })
}
