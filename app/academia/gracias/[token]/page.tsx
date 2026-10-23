import { notFound } from "next/navigation"
import { one } from "@/lib/db"
export const dynamic = "force-dynamic"
export default async function Gracias({ params, searchParams }: { params: { token: string }; searchParams: { e?: string } }) {
  const o = await one<any>("select o.*, p.titulo from am_ordenes o join am_productos p on p.id=o.producto_id where o.token=$1", [params.token])
  if (!o) notFound()
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="card flex flex-col gap-3">
        {o.estado === "pagada" ? (<>
          <h1 className="m-0 text-3xl font-extrabold">¡Gracias por tu compra! 🎉</h1>
          <p className="m-0 text-[#4A515C]">{o.titulo} ya es tuyo. También te mandamos el link a {o.email}.</p>
          <a href={`/descarga/${o.token}`} className="btn-p self-start">Descargar ahora</a>
        </>) : searchParams.e ? (<>
          <h1 className="m-0 text-3xl font-extrabold">El pago no se completó</h1>
          <p className="m-0 text-[#4A515C]">No se hizo ningún cargo. Podés volver a intentarlo cuando quieras.</p>
        </>) : (<>
          <h1 className="m-0 text-3xl font-extrabold">Estamos confirmando tu pago</h1>
          <p className="m-0 text-[#4A515C]">En cuanto Mercado Pago lo acredite te llega el link de descarga a {o.email}. Podés recargar esta página en unos minutos.</p>
        </>)}
      </div>
    </main>
  )
}
