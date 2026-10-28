import { inicioSegunHost, espacioDelHost } from "@/lib/auth"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { one, audit } from "@/lib/db"
import { crearSesion, usuarioActual, type Usuario } from "@/lib/auth"
import { MarcaIcono } from "@/components/Marca"
import Redes from "@/components/Redes"

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
  redirect(inicioSegunHost())
}

export default async function Login({ searchParams }: { searchParams: { e?: string } }) {
  if (await usuarioActual()) redirect(inicioSegunHost())
  const espacio = espacioDelHost()
  const aca = espacio === "academia"
  return (
    <div data-espacio={espacio} className="min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panel de identidad: deja claro en qué sistema se entra */}
      <aside className={`login-panel relative overflow-hidden px-6 py-8 sm:px-10 lg:p-14 flex flex-col justify-between gap-8 ${aca ? "login-aca" : "login-com"}`}>
        <div className="relative flex items-center gap-3">
          <MarcaIcono academia={aca} tam={44} fondo={aca ? "#0B4F4A" : "#1B2029"} />
          <div className="leading-tight">
            {aca
              ? <div className="font-titulo text-xl font-semibold text-white">Academia <span className="font-sans text-base font-extrabold tracking-[0.06em] text-[#5EEAD4]">DEVISEBIT</span></div>
              : <div className="text-xl font-extrabold tracking-[0.05em] text-white">DEVISE<span className="text-[#FF6A63]">BIT</span></div>}
            <div className="text-[10px] font-semibold tracking-[0.25em] text-white/70">{aca ? "SISTEMA" : "SISTEMA COMERCIAL"}</div>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <h1 className={`m-0 text-white ${aca ? "font-titulo font-semibold text-[2.6rem] leading-[1.1]" : "text-[2.4rem] font-extrabold leading-[1.1] tracking-tight"}`}>{aca ? "Sistema Academia" : "Sistema comercial"}</h1>
          <p className="mt-3 mb-0 max-w-sm text-[15px] text-white/75">{aca ? "Alumnos, cursos, guías y envíos de la Academia DEVISEBIT." : "CRM, conversaciones del bot y proyectos de DEVISEBIT."}</p>
        </div>
        <div className="relative hidden lg:block text-xs text-white/60">DEVISEBIT SRL · Datos personales protegidos (Ley 25.326)</div>
      </aside>
      <main className="flex items-start lg:items-center justify-center px-4 py-8 sm:py-12">
        <form action={ingresar} className="card w-full max-w-[400px] flex flex-col gap-4 p-6 sm:p-8">
          <div>
            <h1 className="m-0 lg:hidden">{aca ? "Sistema Academia" : "Sistema comercial"}</h1>
            <h2 className="m-0 hidden lg:block text-2xl font-titulo-sis">Ingresar</h2>
            <p className="text-sm text-[var(--gris)] mt-1 mb-0">Ingresá con tu usuario. El acceso queda registrado.</p>
          </div>
          {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">Usuario o clave incorrectos.</p>}
          <label className="lbl">Usuario<input name="usuario" required autoComplete="username" autoCapitalize="none" className="inp" /></label>
          <label className="lbl">Clave<input name="clave" type="password" required autoComplete="current-password" className="inp" /></label>
          <button className="btn-p w-full">Ingresar</button>
          <a href="/recuperar" className="text-sm font-semibold text-[var(--ac-texto)] underline underline-offset-2 text-center py-1">¿Olvidaste tu clave?</a>
          <Redes className="justify-center pt-3 border-t border-[var(--borde-2)]" />
        </form>
      </main>
    </div>
  )
}
