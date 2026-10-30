import { notFound } from "next/navigation"
import { one } from "@/lib/db"
export const dynamic = "force-dynamic"
export default async function Gracias({ params, searchParams }: { params: { token: string }; searchParams: { e?: string } }) {
  const o = await one<any>(
    `select o.*, coalesce(p.titulo, c.titulo) titulo, coalesce(p.servicio, false) servicio, c.slug curso_slug
     from am_ordenes o left join am_productos p on p.id=o.producto_id left join am_cursos c on c.id=o.curso_id where o.token=$1`, [params.token])
  if (!o) notFound()
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
      <div className="card flex flex-col gap-4 sm:p-8">
        {o.estado === "pagada" ? (<>
          <h1 className="acad-h2 m-0 font-extrabold">¡Gracias por tu compra! 🎉</h1>
          {o.curso_id ? (<>
            <p className="m-0 text-[#4A515C]">Ya estás inscripto en <strong>{o.titulo}</strong>. Te mandamos a {o.email} el acceso al aula (revisá también spam o promociones).</p>
            <p className="m-0 text-[#4A515C]">Entrás desde Mi cuenta con ese email: no hace falta contraseña. Ahí vas a encontrar las lecciones, los materiales, tu avance, la videollamada con quien lo enseña y, al terminar, tu certificado.</p>
            <a href={o.inscripcion_id ? `/mi-cuenta/cursos/${o.inscripcion_id}` : "/mi-cuenta"} className="btn-p min-h-[52px] text-base w-full sm:w-auto sm:self-start">Ir al aula</a>
          </>) : o.servicio ? (<>
            <p className="m-0 text-[#4A515C]">Recibimos el pago de <strong>{o.titulo}</strong>. En menos de 24 horas hábiles te escribimos a {o.email} para coordinar.</p>
            <a href="https://sistema.devisebit.com/agendar" className="btn-p min-h-[52px] text-base w-full sm:w-auto sm:self-start">Agendar la primera reunión</a>
          </>) : (<>
            <p className="m-0 text-[#4A515C]">{o.titulo} ya es tuyo. También te mandamos el link a {o.email}.</p>
            <a href={`/descarga/${o.token}`} className="btn-p min-h-[52px] text-base w-full sm:w-auto sm:self-start">Descargar ahora</a>
          </>)}
        </>) : searchParams.e ? (<>
          <h1 className="acad-h2 m-0 font-extrabold">El pago no se completó</h1>
          <p className="m-0 text-[#4A515C]">No se hizo ningún cargo. Podés volver a intentarlo cuando quieras.</p>
          <a href="/" className="btn-s min-h-[48px] w-full sm:w-auto sm:self-start">Volver a la Academia</a>
        </>) : (<>
          <h1 className="acad-h2 m-0 font-extrabold">Estamos confirmando tu pago</h1>
          <p className="m-0 text-[#4A515C]">En cuanto Mercado Pago lo acredite te llega la confirmación a {o.email}. Podés recargar esta página en unos minutos.</p>
          <a href="" className="btn-s min-h-[48px] w-full sm:w-auto sm:self-start">Actualizar estado</a>
        </>)}
      </div>
    </main>
  )
}
