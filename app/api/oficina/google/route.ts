import { NextResponse, type NextRequest } from "next/server"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

/** Inicio de "Entrar con Google" (solo si GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET están en Vercel). */
export async function GET(req: NextRequest) {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return new NextResponse("Entrar con Google todavía no está configurado.", { status: 503 })
  const state = randomBytes(24).toString("base64url")
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  u.search = new URLSearchParams({ client_id: id, redirect_uri: `${req.nextUrl.origin}/api/oficina/google/callback`, response_type: "code", scope: "openid email", state, prompt: "select_account" }).toString()
  const res = NextResponse.redirect(u)
  res.cookies.set("of_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 })
  return res
}
