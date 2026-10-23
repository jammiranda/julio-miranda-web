import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { randomBytes } from "crypto"
import { q, one, audit } from "@/lib/db"
import { enviarMail } from "@/lib/mail"
import Marca from "@/components/Marca"

export const dynamic = "force-dynamic"

async function pedir(fd: FormData) {
  "use server"
  const dato = String(fd.get("dato") ?? "").trim().toLowerCase()
  if (!dato) redirect("/recuperar")
  const u = await one<{ id: number; usuario: string; nombre: string; email: string | null }>(
    "select id, usuario, nombre, email from usuarios where activo and (lower(usuario)=$1 or lower(email)=$1)",
    [dato],
  )
  if (u?.email) {
    const tok = randomBytes(24).toString("base64url")
    await q("update usuarios set invite_token=$1, invite_expira=now() + interval '2 hours' where id=$2", [tok, u.id])
    const link = `https://${headers().get("host")}/activar/${tok}`
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
            <label className="lbl">Tu usuario o email<input name="dato" required autoComplete="username" className="inp" /></label>
            <button className="btn-p">Enviarme el enlace</button>
            <a href="/login" className="text-sm text-[#4A515C] underline text-center">Volver</a>
          </form>
        )}
      </div>
    </main>
  )
}
