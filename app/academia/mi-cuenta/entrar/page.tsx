import { redirect } from "next/navigation"
import { clienteActual, rutaSegura } from "@/lib/portal"
import { PantallaIngreso, type SPIngreso } from "@/components/aula/Ingreso"

export const dynamic = "force-dynamic"

/** Ingreso sin salir de la Academia: email → código (o link). Con ?a=/ruta vuelve ahí al entrar. */
export default async function EntrarAcademia({ searchParams }: { searchParams: SPIngreso }) {
  const a = rutaSegura(searchParams.a, "")
  if (await clienteActual()) redirect(a || "/mi-cuenta")
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#C8231F]">ACADEMIA DEVISEBIT · Mi cuenta</p>
      <PantallaIngreso sitio="academia" a={a} sp={searchParams} />
    </div>
  )
}
