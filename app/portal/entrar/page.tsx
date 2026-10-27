import { redirect } from "next/navigation"
import { one, audit } from "@/lib/db"
import { clienteActual, enviarAcceso, puedePedirLink, tienePortal } from "@/lib/portal"

export const dynamic = "force-dynamic"

async function pedir(fd: FormData) {
  "use server"
  if (fd.get("website")) redirect("/portal/entrar?enviado=1")
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/portal/entrar?e=email")
  const c = await one<{ id: number }>("select id from db_contactos where lower(email)=$1", [email])
  // Siempre la misma respuesta: no revelamos si un email es cliente o no.
  if (c && (await tienePortal(c.id)) && (await puedePedirLink(c.id))) {
    const r = await enviarAcceso(c.id, "ingreso")
    await audit({ id: 0, usuario: `cliente:${c.id}` }, r.ok ? "portal_link_enviado" : "portal_link_error", "db_contacto", c.id, r.ok ? undefined : r.error)
  }
  redirect("/portal/entrar?enviado=1")
}

export default async function Entrar({ searchParams }: { searchParams: { enviado?: string; e?: string; salio?: string; vencido?: string } }) {
  if (await clienteActual()) redirect("/portal")
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card w-full max-w-md flex flex-col gap-4">
        <div>
          <h1 className="m-0">Tu portal de cliente</h1>
          <p className="m-0 mt-1 text-sm text-[#4A515C]">Seguí tu proyecto en un solo lugar: etapa, entregas, documentos, reuniones y aprobaciones.</p>
        </div>
        {searchParams.enviado ? (
          <div role="status" className="rounded-xl bg-[#FDECEB] p-4 text-sm">
            <strong className="block mb-1">Revisá tu correo</strong>
            Si tu email está registrado como cliente, en unos minutos te llega un link para entrar. Vale por 1 hora y se usa una sola vez. Mirá también en spam o promociones.
          </div>
        ) : (
          <form action={pedir} className="flex flex-col gap-3">
            {searchParams.salio && <p role="status" className="m-0 text-sm text-[#4A515C]">Cerraste la sesión.</p>}
            {searchParams.vencido && <p role="alert" className="m-0 text-sm text-rojo">Ese link ya se usó o venció. Pedí uno nuevo.</p>}
            {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">Revisá el email.</p>}
            <label className="lbl">Tu email<input name="email" type="email" required autoComplete="email" inputMode="email" className="inp" placeholder="nombre@empresa.com" /></label>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button className="btn-p">Enviarme el link de acceso</button>
            <p className="m-0 text-xs text-[#4A515C]">Sin contraseñas: te mandamos un link seguro al email que usás con DEVISEBIT.</p>
          </form>
        )}
        <p className="m-0 text-xs text-[#4A515C] border-t border-[#EEF0F3] pt-3">¿No te llega? Escribinos por <a className="underline" href="https://wa.me/5491173466490">WhatsApp</a> y te habilitamos el acceso.</p>
      </div>
    </div>
  )
}
