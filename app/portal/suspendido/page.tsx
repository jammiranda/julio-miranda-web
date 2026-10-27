import Link from "next/link"
import { redirect } from "next/navigation"
import { requerirCliente } from "@/lib/portal"

export const dynamic = "force-dynamic"

export default async function Suspendido() {
  const c = await requerirCliente(true)
  if (c.acceso === "ok") redirect("/portal")
  const deuda = c.acceso === "deuda"
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="card w-full max-w-lg flex flex-col gap-4">
        <h1 className="m-0">{deuda ? "Tu cuenta tiene pagos vencidos" : "Tu acceso está suspendido"}</h1>
        {deuda ? (
          <>
            <p className="m-0 text-[#262C37]">Hola {c.nombre.split(" ")[0]}, tenés <strong>{c.deuda}</strong> vencido hace {c.atraso} días. Mientras tanto, el acceso a proyectos y cursos queda en pausa.</p>
            <p className="m-0 text-sm text-[#4A515C]">Apenas se acredite el pago se reactiva solo, sin que tengas que hacer nada más.</p>
            <div className="flex flex-wrap gap-2"><Link href="/portal/pagos" className="btn-p">Ver y pagar</Link><a href="https://wa.me/5491173466490?text=Hola%2C%20quiero%20regularizar%20mi%20cuenta" className="btn-s">Hablar con el equipo</a></div>
          </>
        ) : (
          <>
            <p className="m-0 text-[#262C37]">Para reactivarlo, comunicate con el equipo de DEVISEBIT.</p>
            <div className="flex flex-wrap gap-2"><a href="https://wa.me/5491173466490?text=Hola%2C%20mi%20acceso%20est%C3%A1%20suspendido" className="btn-p">Escribir por WhatsApp</a><Link href="/portal/pagos" className="btn-s">Ver mi estado de cuenta</Link></div>
          </>
        )}
      </div>
    </div>
  )
}
