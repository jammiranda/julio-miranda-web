import { redirect } from "next/navigation"
import { clienteActual, usarAcceso, verAcceso } from "@/lib/portal"

export const dynamic = "force-dynamic"

/**
 * El link del email abre esta página y el ingreso se confirma con un botón:
 * así los antivirus y vistas previas de correo que "abren" los links no gastan el acceso.
 */
async function entrar(fd: FormData) {
  "use server"
  const tok = String(fd.get("tok") ?? "")
  const ir = destino(String(fd.get("ir") ?? ""))
  if (!(await usarAcceso(tok))) redirect("/portal/entrar?vencido=1")
  redirect(ir)
}

const destino = (ir?: string) => (ir && /^\/portal\/(p\/\d+|cursos\/\d+|cursos|pagos)$/.test(ir) ? ir : "/portal")

export default async function Acceso({ params, searchParams }: { params: { token: string }; searchParams: { ir?: string } }) {
  const a = await verAcceso(params.token)
  // Si ya tiene la sesión abierta con ese mismo contacto, no gastamos el link.
  const yo = await clienteActual()
  if (yo && (!a || yo.id === a.contacto_id)) redirect(destino(searchParams.ir))
  if (!a) redirect("/portal/entrar?vencido=1")
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form action={entrar} className="card w-full max-w-md flex flex-col gap-4 text-center">
        <input type="hidden" name="tok" value={params.token} />
        <input type="hidden" name="ir" value={destino(searchParams.ir)} />
        <h1 className="m-0">Hola, {a.nombre.split(" ")[0]}</h1>
        <p className="m-0 text-sm text-[#4A515C]">Tocá el botón para entrar a tu portal. La sesión queda abierta 30 días en este dispositivo.</p>
        <button className="btn-p">Entrar a mi portal</button>
      </form>
    </div>
  )
}
