import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { requerir, ROL_NOMBRE } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import FotoPerfil from "@/components/FotoPerfil"
import ActivarAvisos from "@/components/ActivarAvisos"

export const dynamic = "force-dynamic"

async function cambiarClave(fd: FormData) {
  "use server"
  const u = await requerir()
  const actual = String(fd.get("actual") ?? ""), c1 = String(fd.get("c1") ?? ""), c2 = String(fd.get("c2") ?? "")
  const r = await one<{ pass_hash: string | null }>("select pass_hash from usuarios where id=$1", [u.id])
  if (!r?.pass_hash || !(await bcrypt.compare(actual, r.pass_hash))) redirect("/cuenta?e=actual")
  if (c1.length < 8 || c1 !== c2) redirect("/cuenta?e=nueva")
  await q("update usuarios set pass_hash=$1 where id=$2", [await bcrypt.hash(c1, 12), u.id])
  await audit(u, "cambio_clave", "usuario", u.id)
  redirect("/cuenta?ok=clave")
}

async function datos(fd: FormData) {
  "use server"
  const u = await requerir()
  const email = s(fd.get("email"))?.toLowerCase() ?? null
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/cuenta?e=email")
  await q("update usuarios set nombre=coalesce($1,nombre), email=$2, telefono=$3 where id=$4", [s(fd.get("nombre")), email, s(fd.get("telefono")), u.id])
  await audit(u, "edita_cuenta", "usuario", u.id)
  redirect("/cuenta?ok=datos")
}

async function foto(fd: FormData) {
  "use server"
  const u = await requerir()
  const f = String(fd.get("foto") ?? "")
  if (fd.get("quitar")) await q("update usuarios set foto=null where id=$1", [u.id])
  else if (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(f) && f.length < 400000) await q("update usuarios set foto=$1 where id=$2", [f, u.id])
  else redirect("/cuenta?e=foto")
  redirect("/cuenta?ok=foto")
}

const ERR: Record<string, string> = { actual: "La clave actual no es correcta.", nueva: "La clave nueva debe tener al menos 8 caracteres y coincidir en los dos campos.", email: "El email no es válido.", foto: "No se pudo guardar la foto. Probá con otra imagen." }

export default async function Cuenta({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const u = await requerir()
  const d = await one<{ email: string | null; telefono: string | null; foto: string | null }>("select email, telefono, foto from usuarios where id=$1", [u.id])
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div><h1 className="m-0">Mi cuenta</h1><p className="m-0 text-sm text-[#4A515C]">Usuario <strong>{u.usuario}</strong> · {ROL_NOMBRE[u.rol]}</p></div>
      {searchParams.ok === "clave" && <p role="status" className="m-0 text-sm text-[#9E1A17]">Listo, tu clave quedó cambiada.</p>}
      {searchParams.ok === "datos" && <p role="status" className="m-0 text-sm text-[#9E1A17]">Datos guardados.</p>}
      {searchParams.ok === "foto" && <p role="status" className="m-0 text-sm text-[#9E1A17]">Foto actualizada.</p>}
      <section className="card flex flex-col gap-3">
        <h2 className="m-0 text-base">Notificaciones</h2>
        <p className="m-0 text-sm text-[#4A515C]">Te avisamos al celular o a la compu, aunque no tengas el sistema abierto, cuando entra una consulta nueva por WhatsApp o Instagram, cuando alguien pide hablar con una persona y cuando escriben en un chat que está atendiendo el equipo. Activalo en cada dispositivo que uses.</p>
        <ActivarAvisos />
      </section>
      <section className="card flex flex-col gap-3">
        <h2 className="m-0 text-base">Tu foto</h2>
        <FotoPerfil accion={foto} actual={d?.foto} />
      </section>
      {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">{ERR[searchParams.e]}</p>}

      <form id="clave" action={cambiarClave} className="card flex flex-col gap-3 scroll-mt-28">
        <h2 className="m-0 text-base">Cambiar contraseña</h2>
        <label className="lbl">Clave actual<input name="actual" type="password" required autoComplete="current-password" className="inp" /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="lbl">Clave nueva<input name="c1" type="password" required minLength={8} autoComplete="new-password" className="inp" /></label>
          <label className="lbl">Repetir clave nueva<input name="c2" type="password" required minLength={8} autoComplete="new-password" className="inp" /></label>
        </div>
        <p className="m-0 text-xs text-[#4A515C]">Mínimo 8 caracteres. Conviene mezclar letras, números y algún símbolo: el sistema guarda datos de clientes y de la empresa.</p>
        <div><button className="btn-p">Cambiar contraseña</button></div>
      </form>

      <form action={datos} className="card flex flex-col gap-3">
        <h2 className="m-0 text-base">Mis datos</h2>
        <label className="lbl">Nombre<input name="nombre" defaultValue={u.nombre} className="inp" /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="lbl">Email (para recuperar la clave)<input name="email" type="email" defaultValue={d?.email ?? ""} className="inp" /></label>
          <label className="lbl">Celular<input name="telefono" defaultValue={d?.telefono ?? ""} className="inp" inputMode="tel" /></label>
        </div>
        <div><button className="btn-s">Guardar datos</button></div>
      </form>
    </div>
  )
}
