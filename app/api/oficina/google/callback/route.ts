import { NextResponse, type NextRequest } from "next/server"
import { crearSesion, type Usuario } from "@/lib/auth"
import { q } from "@/lib/db"

export const dynamic = "force-dynamic"

const PERMITIDO = () => (process.env.OFICINA_EMAIL ?? "mirandajulioadrian@gmail.com").trim().toLowerCase()

/** Vuelta de Google: solo entra la cuenta de Julio (OFICINA_EMAIL) y se abre la sesión de su usuario gerente del sistema. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const volver = (m: string) => NextResponse.redirect(new URL(`/?error=${encodeURIComponent(m)}`, req.nextUrl.origin))
  if (!p.get("code") || !p.get("state") || p.get("state") !== req.cookies.get("of_state")?.value) return volver("sesion")
  const id = process.env.GOOGLE_CLIENT_ID, sec = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !sec) return volver("config")
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: p.get("code")!, client_id: id, client_secret: sec, redirect_uri: `${req.nextUrl.origin}/api/oficina/google/callback`, grant_type: "authorization_code" }),
  })
  const tj = await t.json().catch(() => ({}))
  if (!t.ok || !tj.access_token) return volver("google")
  const ui = await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tj.access_token}` } })).json().catch(() => ({}))
  if (!ui.email || ui.email_verified !== true || String(ui.email).toLowerCase() !== PERMITIDO()) return volver("cuenta")
  const rows = await q<{ id: number; usuario: string; nombre: string; rol: Usuario["rol"] }>(
    "select id, usuario, nombre, rol from usuarios where rol='gerente' and activo order by (lower(coalesce(email,''))=$1) desc, id asc limit 1",
    [PERMITIDO()],
  )
  const u = rows[0]
  if (!u) return volver("usuario")
  await crearSesion({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, espacios: ["comercial", "academia"] })
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin))
  res.cookies.delete("of_state")
  return res
}
