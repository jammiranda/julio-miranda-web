import { redirect } from "next/navigation"
import { clienteActual, rutaSegura } from "@/lib/portal"
import { PantallaIngreso, type SPIngreso } from "@/components/aula/Ingreso"

export const dynamic = "force-dynamic"

/** Ingreso al portal: email → código de 6 dígitos (o link). Con ?a=/ruta vuelve ahí al entrar. */
export default async function Entrar({ searchParams }: { searchParams: SPIngreso }) {
  const a = rutaSegura(searchParams.a, "")
  if (await clienteActual()) redirect(a || "/portal")
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <PantallaIngreso sitio="portal" a={a} sp={searchParams} />
    </div>
  )
}
