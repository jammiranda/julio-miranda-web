import Link from "next/link"
import { requerirCliente, proyectosDe } from "@/lib/portal"
import { asesoriaDe } from "@/lib/asesoria"
import AsesoriaResumen from "@/components/AsesoriaResumen"

export const dynamic = "force-dynamic"

/** Mi cuenta → Asesoría: saldo de la bolsa o del abono y cada hora con fecha, persona y tema. */
export default async function AsesoriaCliente() {
  const c = await requerirCliente()
  const proys = await proyectosDe(c.id)
  const datos = (await Promise.all(proys.map(async (p) => ({ p, a: await asesoriaDe(p.id) })))).filter((x) => x.a.planes.length || x.a.horas.length)
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Asesoría</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Tus horas de asesoría en tecnología e IA: lo que tenés disponible y cada hora registrada con fecha, persona y tema.</p>
      </div>
      {!datos.length && (
        <section className="card flex flex-col gap-2">
          <p className="m-0">Todavía no tenés horas de asesoría registradas.</p>
          <p className="m-0 text-sm text-[#4A515C]">Podés contratar horas sueltas, una bolsa o un abono mensual desde <Link href="/portal/servicios#l-asesori-a-y-consultori-a" className="underline">Servicios y productos</Link>, o pedirnos una primera reunión.</p>
        </section>
      )}
      {datos.map(({ p, a }) => (
        <section key={p.id} aria-labelledby={`t-a${p.id}`} className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`t-a${p.id}`} className="m-0 text-base">{p.nombre}</h2>
            <Link href={`/portal/p/${p.id}`} className="text-sm underline text-[#4A515C]">Ver el proyecto</Link>
          </div>
          <AsesoriaResumen planes={a.planes} horas={a.horas} saldos={a.saldos} cliente />
        </section>
      ))}
      <p className="m-0 text-xs text-[#4A515C]">Fracción mínima 30 minutos. En las bolsas, una hora estratégica descuenta 1,5 horas. En los abonos, las horas no usadas pasan al mes siguiente una sola vez y las horas extra se cobran con aviso previo.</p>
    </div>
  )
}
