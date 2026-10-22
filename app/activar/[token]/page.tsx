import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { one, q, audit } from "@/lib/db"
import { crearSesion, type Usuario } from "@/lib/auth"
import Marca from "@/components/Marca"

async function buscar(token: string) {
  if (!token || token.length < 30) return null
  return one<Usuario>("select id, usuario, nombre, rol from usuarios where invite_token=$1 and invite_expira > now() and activo", [token])
}

async function activar(fd: FormData) {
  "use server"
  const token = String(fd.get("t") ?? "")
  const u = await buscar(token)
  if (!u) redirect("/login")
  const c1 = String(fd.get("c1") ?? ""), c2 = String(fd.get("c2") ?? "")
  if (c1.length < 8 || c1 !== c2) redirect(`/activar/${token}?e=1`)
  await q("update usuarios set pass_hash=$1, invite_token=null, invite_expira=null where id=$2", [await bcrypt.hash(c1, 12), u.id])
  await audit(u, "activacion_cuenta")
  await crearSesion(u)
  redirect("/")
}

export default async function Activar({ params, searchParams }: { params: { token: string }; searchParams: { e?: string } }) {
  const u = await buscar(params.token)
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm flex flex-col gap-4">
        <Marca />
        {!u ? (
          <p className="m-0">Este enlace ya se usó o venció. Pedile uno nuevo a la gerencia.</p>
        ) : (
          <form action={activar} className="flex flex-col gap-4">
            <input type="hidden" name="t" value={params.token} />
            <h1 className="m-0 text-xl">Hola, {u.nombre}</h1>
            <p className="text-sm text-[#4F5C69] m-0">Tu usuario es <strong>{u.usuario}</strong>. Elegí tu clave para ingresar al sistema.</p>
            {searchParams.e && <p role="alert" className="text-sm text-rojo m-0">La clave debe tener al menos 8 caracteres y coincidir.</p>}
            <label className="lbl">Clave<input name="c1" type="password" required minLength={8} autoComplete="new-password" className="inp" /></label>
            <label className="lbl">Repetir clave<input name="c2" type="password" required minLength={8} autoComplete="new-password" className="inp" /></label>
            <button className="btn-p">Activar mi cuenta</button>
          </form>
        )}
      </div>
    </main>
  )
}
