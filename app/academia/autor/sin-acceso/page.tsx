import Link from "next/link"
import { autorActual } from "@/lib/autores"
import { salirCuenta } from "@/lib/ingreso"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/** Sesión válida pero sin permiso de autor (403). */
export default async function SinAccesoAutor() {
  const a = await autorActual()
  if (a && a !== "no") redirect("/autor")
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">403 · Panel de autor</p>
      <h1 className="m-0 text-2xl font-extrabold">Esta cuenta no tiene acceso de autor</h1>
      <p className="m-0 max-w-lg text-[#4A515C]">El panel de autor es para los docentes de ACADEMIA DEVISEBIT. Si sos docente y no podés entrar, pedile a Dirección que te dé de alta con el email que usaste.</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Link href="/mi-cuenta" className="btn-p">Ir a Mi cuenta</Link>
        {a === "no" && <form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button className="btn-s">Entrar con otro email</button></form>}
      </div>
    </div>
  )
}
