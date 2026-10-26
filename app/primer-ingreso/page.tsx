import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { one, q, audit } from "@/lib/db"
import { crearSesion, type Usuario } from "@/lib/auth"
import Marca from "@/components/Marca"

async function habilitado() {
  const r = await one<{ n: number }>("select count(*)::int n from usuarios where rol='gerente' and pass_hash is not null")
  return (r?.n ?? 0) === 0
}

async function crear(fd: FormData) {
  "use server"
  if (!(await habilitado())) redirect("/login")
  const c1 = String(fd.get("c1") ?? ""), c2 = String(fd.get("c2") ?? "")
  if (c1.length < 10 || c1 !== c2) redirect("/primer-ingreso?e=1")
  const hash = await bcrypt.hash(c1, 12)
  await q("update usuarios set pass_hash=$1 where usuario='administrador' and rol='gerente'", [hash])
  const u = await one<Usuario>("select id, usuario, nombre, rol from usuarios where usuario='administrador'")
  if (!u) redirect("/login")
  await audit(u, "primer_ingreso_gerencia")
  await crearSesion(u)
  redirect("/")
}

export default async function PrimerIngreso({ searchParams }: { searchParams: { e?: string } }) {
  if (!(await habilitado())) redirect("/login")
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form action={crear} className="card w-full max-w-sm flex flex-col gap-4">
        <Marca />
        <h1 className="m-0 text-xl">Primer ingreso · Gerencia</h1>
        <p className="text-sm text-[#4F5C69] m-0">Elegí la clave del usuario <strong>administrador</strong>. Esta pantalla se desactiva sola apenas la guardás.</p>
        {searchParams.e && <p role="alert" className="text-sm text-rojo m-0">La clave debe tener al menos 10 caracteres y coincidir.</p>}
        <label className="lbl">Nueva clave<input name="c1" type="password" required minLength={10} autoComplete="new-password" className="inp" /></label>
        <label className="lbl">Repetir clave<input name="c2" type="password" required minLength={10} autoComplete="new-password" className="inp" /></label>
        <button className="btn-p">Guardar e ingresar</button>
      </form>
    </main>
  )
}
