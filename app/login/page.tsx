import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { one, audit } from "@/lib/db"
import { crearSesion, usuarioActual, type Usuario } from "@/lib/auth"
import Marca from "@/components/Marca"

async function ingresar(fd: FormData) {
  "use server"
  const usuario = String(fd.get("usuario") ?? "").trim().toLowerCase()
  const clave = String(fd.get("clave") ?? "")
  const u = await one<Usuario & { pass_hash: string | null; activo: boolean }>("select * from usuarios where usuario=$1", [usuario])
  if (!u || !u.activo || !u.pass_hash || !(await bcrypt.compare(clave, u.pass_hash))) {
    await audit(null, "login_fallido", "usuario", usuario)
    redirect("/login?e=1")
  }
  await crearSesion(u)
  await audit(u, "login")
  redirect("/")
}

export default async function Login({ searchParams }: { searchParams: { e?: string } }) {
  if (await usuarioActual()) redirect("/")
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form action={ingresar} className="card w-full max-w-sm flex flex-col gap-4">
        <Marca />
        <p className="text-sm text-[#4F5C69] m-0">Ingresá con tu usuario. El acceso queda registrado.</p>
        {searchParams.e && <p role="alert" className="text-sm text-rojo m-0">Usuario o clave incorrectos.</p>}
        <label className="lbl">Usuario<input name="usuario" required autoComplete="username" className="inp" /></label>
        <label className="lbl">Clave<input name="clave" type="password" required autoComplete="current-password" className="inp" /></label>
        <button className="btn-p">Ingresar</button>
        <a href="/primer-ingreso" className="text-xs text-[#4F5C69] underline text-center">Primer ingreso de gerencia</a>
      </form>
    </main>
  )
}
