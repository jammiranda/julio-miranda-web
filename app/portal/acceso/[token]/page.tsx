import { redirect } from "next/navigation"
import { clienteActual, verAcceso, rutaSegura } from "@/lib/portal"
import { ConfirmarLink } from "@/components/aula/Ingreso"

export const dynamic = "force-dynamic"

/**
 * El link del email abre esta página y el ingreso se confirma con un botón:
 * así los antivirus y vistas previas de correo que "abren" los links no gastan el acceso.
 * ?a=/ruta (o ?ir= en los emails viejos) es a dónde vuelve al entrar.
 */
export default async function Acceso({ params, searchParams }: { params: { token: string }; searchParams: { a?: string; ir?: string } }) {
  const a = rutaSegura(searchParams.a ?? searchParams.ir, "/portal")
  const ver = await verAcceso(params.token)
  // Si ya tiene la sesión abierta con ese mismo contacto, no gastamos el link.
  const yo = await clienteActual()
  if (yo && (!ver || yo.id === ver.contacto_id)) redirect(a)
  if (!ver) redirect(`/portal/entrar?vencido=1${a !== "/portal" ? `&a=${encodeURIComponent(a)}` : ""}`)
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <ConfirmarLink sitio="portal" tok={params.token} a={a} nombre={ver.nombre} />
    </div>
  )
}
