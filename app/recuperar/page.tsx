import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { randomBytes } from "crypto"
import { q, one, audit } from "@/lib/db"
import { enviarMail } from "@/lib/mail"
import Marca from "@/components/Marca"
import { URL_SISTEMA } from "@/lib/brief"
import Enviar from "@/components/Enviar"

export const dynamic = "force-dynamic"

/** Dominios propios donde vive la pantalla de activación. El enlace nunca se arma con un dominio que no esté en esta lista. */
const DOMINIOS = ["sistema.devisebit.com", "academia.devisebit.com", "panel.devisebit.com", "oficina.devisebit.com"]
const LIM_USUARIO = 3 // pedidos por usuario cada 15 minutos
const LIM_IP = 10 // pedidos por IP cada 15 minutos

async function pedir(fd: FormData) {
  "use server"
  const dato = String(fd.get("dato") ?? "").trim().toLowerCase()
  if (!dato) redirect("/recuperar")
  const u = await one<{ id: number; usuario: string; nombre: string; email: string | null }>(
    "select id, usuario, nombre, email from usuarios where activo and (lower(usuario)=$1 or lower(email)=$1)",
    [dato],
  )
  // Límite por IP (cuenta todos los intentos) y por usuario (cuenta los enlaces enviados). Pasado el límite se responde igual, sin enviar nada.
  const h = headers()
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || null
  if (ip) {
    const n = await one<{ n: number }>("select count(*)::int n from auditoria where accion='recuperacion_intento' and detalle=$1 and ts > now() - interval '15 minutes'", [ip]).catch(() => null)
    if ((n?.n ?? 0) >= LIM_IP) redirect("/recuperar?enviado=1")
    await audit(null, "recuperacion_intento", "usuario", u?.id, ip)
  }
  if (u?.email) {
    const n = await one<{ n: number }>("select count(*)::int n from auditoria where accion='pedido_recuperacion' and usuario_id=$1 and ts > now() - interval '15 minutes'", [u.id]).catch(() => null)
    if ((n?.n ?? 0) >= LIM_USUARIO) redirect("/recuperar?enviado=1")
    const tok = randomBytes(24).toString("base64url")
    await q("update usuarios set invite_token=$1, invite_expira=now() + interval '2 hours' where id=$2", [tok, u.id])
    const host = (h.get("host") ?? "").toLowerCase()
    const link = `${DOMINIOS.includes(host) ? `https://${host}` : URL_SISTEMA}/activar/${tok}`
    await enviarMail(u.email, "Recuperar tu clave · Sistema DEVISEBIT",
      `<p>Hola ${u.nombre}:</p><p>Para elegir una clave nueva entrá a este enlace (vale 2 horas y se usa una sola vez):</p><p><a href="${link}">${link}</a></p><p>Si no lo pediste, ignorá este mail.</p>`)
    await audit({ id: u.id, usuario: u.usuario }, "pedido_recuperacion", "usuario", u.id)
  }
  redirect("/recuperar?enviado=1")
}

export default function Recuperar({ searchParams }: { searchParams: { enviado?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm flex flex-col gap-4">
        <Marca />
        <h1 className="m-0 text-xl">Recuperar la clave</h1>
        {searchParams.enviado ? (
          <>
            <p className="m-0 text-sm">Si el usuario tiene un email cargado, te llega un enlace para elegir una clave nueva. Revisá también spam.</p>
            <p className="m-0 text-sm text-[#4A515C]">¿No tenés email cargado? Pedile a Dirección un enlace nuevo: lo genera en un clic desde Usuarios.</p>
            <a href="/login" className="btn-s">Volver al ingreso</a>
          </>
        ) : (
          <form action={pedir} className="flex flex-col gap-4">
            <label className="lbl">Tu usuario o email<input name="dato" required autoComplete="username" autoCapitalize="none" spellCheck={false} className="inp" /></label>
            <Enviar>Enviarme el enlace</Enviar>
            <a href="/login" className="text-sm text-[#4A515C] underline text-center">Volver</a>
          </form>
        )}
      </div>
    </main>
  )
}
