"use server"
import { redirect } from "next/navigation"
import { audit } from "./db"
import { pedirLink, usarCodigo, usarAcceso, ipActual, rutaSegura, esSitio, cerrarSesionCliente, SITIOS, type Sitio } from "./portal"

/**
 * Acciones del ingreso sin contraseña, compartidas por el portal (portal.devisebit.com) y por la Academia
 * (academia.devisebit.com/mi-cuenta). El formulario manda `sitio` y `a` (a dónde volver al entrar).
 */

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const limpiarEmail = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase().slice(0, 160)
const sitioDe = (fd: FormData): Sitio => { const s = fd.get("sitio"); return esSitio(s) ? s : "portal" }

/** Arma la URL de la pantalla de ingreso conservando el destino. */
function pantalla(sitio: Sitio, a: string, p: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v != null && v !== "") u.set(k, String(v))
  if (a) u.set("a", a)
  const qs = u.toString()
  return `${SITIOS[sitio].entrar}${qs ? `?${qs}` : ""}`
}

/** Paso 1: el email. Si no existe y la regla lo permite, la cuenta se crea sola (origen portal o academia). */
export async function pedirIngreso(fd: FormData) {
  const sitio = sitioDe(fd)
  const a = rutaSegura(fd.get("a"), "")
  if (fd.get("website")) redirect(pantalla(sitio, a, { r: "enviado" }))
  const email = limpiarEmail(fd.get("email"))
  if (!emailValido(email)) redirect(pantalla(sitio, a, { e: "email" }))
  const r = await pedirLink(email, null, ipActual(), { sitio, a })
  await audit({ id: 0, usuario: `${sitio}:${email}` }, `portal_pedido_${r.resultado}`, sitio, email, r.detalle)
  redirect(pantalla(sitio, a, { r: r.resultado, m: email, nueva: r.nueva ? 1 : null }))
}

/** Paso 2: el código de 6 dígitos. Si es correcto, vuelve a donde iba. */
export async function validarIngreso(fd: FormData) {
  const sitio = sitioDe(fd)
  const a = rutaSegura(fd.get("a"), "")
  const email = limpiarEmail(fd.get("email"))
  const codigo = String(fd.get("codigo") ?? "").replace(/\D/g, "")
  if (!emailValido(email)) redirect(pantalla(sitio, a, { e: "email" }))
  if (codigo.length !== 6) redirect(pantalla(sitio, a, { r: "enviado", m: email, c: "formato" }))
  const r = await usarCodigo(email, codigo)
  await audit({ id: 0, usuario: `${sitio}:${email}` }, `portal_codigo_${r.resultado}`, sitio, email)
  if (r.resultado === "ok") redirect(a || SITIOS[sitio].inicio)
  if (r.resultado === "bloqueado") redirect(pantalla(sitio, a, { r: "bloqueado", m: email }))
  redirect(pantalla(sitio, a, { r: "enviado", m: email, c: r.resultado, q: r.quedan }))
}

/** Link mágico del email: se confirma con un botón (los antivirus que abren links no lo gastan). */
export async function entrarConLink(fd: FormData) {
  const sitio = sitioDe(fd)
  const a = rutaSegura(fd.get("a"), SITIOS[sitio].inicio)
  if (!(await usarAcceso(String(fd.get("tok") ?? "")))) redirect(pantalla(sitio, a === SITIOS[sitio].inicio ? "" : a, { vencido: 1 }))
  redirect(a)
}

/** Cerrar sesión (la misma cookie vale en portal y Academia, así que sale de los dos). */
export async function salirCuenta(fd: FormData) {
  cerrarSesionCliente()
  redirect(`${SITIOS[sitioDe(fd)].entrar}?salio=1`)
}
