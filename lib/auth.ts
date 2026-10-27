import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { randomBytes } from "crypto"
import { one, q } from "./db"

export type Rol = "gerente" | "coordinacion" | "consulta" | "profesional"
export type Usuario = { id: number; usuario: string; nombre: string; rol: Rol }

const COOKIE = "db_sesion"
/** Clave para firmar las sesiones: AUTH_SECRET si está en Vercel; si no, una propia generada al azar la primera vez y guardada en la base. */
let _secret: Uint8Array | null = null
export async function secret() {
  if (_secret) return _secret
  let s = process.env.AUTH_SECRET
  if (!s || s.length < 32) {
    await q("insert into config(clave,valor) values ('auth_secret',$1) on conflict (clave) do nothing", [randomBytes(48).toString("base64url")])
    s = (await one<{ valor: string }>("select valor from config where clave='auth_secret'"))!.valor
  }
  _secret = new TextEncoder().encode(s)
  return _secret
}

export async function crearSesion(u: Usuario) {
  const token = await new SignJWT({ uid: u.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(await secret())
  cookies().set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 })
}

export function cerrarSesion() {
  cookies().delete(COOKIE)
}

export async function usuarioActual(): Promise<Usuario | null> {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  try {
    const { payload } = await jwtVerify(t, await secret())
    const u = await one<Usuario & { activo: boolean }>("select id, usuario, nombre, rol, activo from usuarios where id=$1", [payload.uid])
    if (!u || !u.activo) return null
    return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol }
  } catch {
    return null
  }
}

export async function requerir(roles?: Rol[]): Promise<Usuario> {
  const u = await usuarioActual()
  if (!u) redirect("/login")
  if (roles && !roles.includes(u.rol)) redirect("/")
  return u
}

export const puede = {
  verFinanzas: (u: Usuario) => u.rol === "gerente",
  editar: (u: Usuario) => u.rol === "gerente" || u.rol === "coordinacion",
  registrarVisita: (u: Usuario) => u.rol !== "consulta",
  admin: (u: Usuario) => u.rol === "gerente",
  verHC: (u: Usuario) => u.rol !== "consulta",
}

export const ROL_NOMBRE: Record<Rol, string> = {
  gerente: "Dirección",
  coordinacion: "Comercial",
  consulta: "Solo lectura",
  profesional: "Desarrollo",
}
