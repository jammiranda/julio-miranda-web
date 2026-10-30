import { redirect } from "next/navigation"
import { clienteActual, verAcceso, rutaSegura } from "@/lib/portal"
import { ConfirmarLink } from "@/components/aula/Ingreso"

export const dynamic = "force-dynamic"

/** Link del email para entrar a la Academia: se confirma con un botón y vuelve a ?a=/ruta (por defecto /mi-cuenta). */
export default async function AccesoAcademia({ params, searchParams }: { params: { token: string }; searchParams: { a?: string } }) {
  const a = rutaSegura(searchParams.a, "/mi-cuenta")
  const ver = await verAcceso(params.token)
  const yo = await clienteActual()
  if (yo && (!ver || yo.id === ver.contacto_id)) redirect(a)
  if (!ver) redirect(`/mi-cuenta/entrar?vencido=1${a !== "/mi-cuenta" ? `&a=${encodeURIComponent(a)}` : ""}`)
  return (
    <div className="min-h-[55vh] flex items-center justify-center">
      <ConfirmarLink sitio="academia" tok={params.token} a={a} nombre={ver.nombre} />
    </div>
  )
}
