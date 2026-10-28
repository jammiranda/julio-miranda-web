import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import { one, audit } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { plata, tipoCobro } from "@/lib/cobros"
import { linkPagoCobro, mpActivo, datosTransferencia } from "@/lib/pagos"
import { PAGO } from "@/lib/precios"
import { DESCUENTO_TRANSFERENCIA } from "@/lib/compras"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"

async function pagarMP(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const id = Number(fd.get("cobro"))
  const r = await linkPagoCobro(id, c.id)
  await audit({ id: 0, usuario: `cliente:${c.id}` }, r.ok ? "portal_pago_inicia" : "portal_pago_error", "db_cobro", id, r.ok ? undefined : r.error)
  if (!r.ok) redirect(`/portal/pagar/${id}?e=${encodeURIComponent(r.error)}`)
  redirect(r.url)
}

async function transferi(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const id = Number(fd.get("cobro"))
  const det = ["Transferencia", String(fd.get("detalle") ?? "").trim().slice(0, 500)].filter(Boolean).join(" · ")
  const x = await one<any>("update db_cobros set informado_en=now(), informado_detalle=$1 where id=$2 and contacto_id=$3 and estado='pendiente' returning id, concepto, monto, moneda", [det, id, c.id])
  if (!x) redirect("/portal/pagos")
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_informa_pago", "db_cobro", id, det)
  waitUntil(notificar(["gerente", "coordinacion"], "🧾 Cliente informó una transferencia", `${c.organizacion ?? c.nombre} · ${x.concepto} · ${det}. Confirmalo en Cobros.`, `/contactos/${c.id}#portal`).catch(() => {}))
  redirect("/portal/pagos?inf=1")
}

export default async function Pagar({ params, searchParams }: { params: { id: string }; searchParams: { e?: string } }) {
  const c = await requerirCliente(true)
  const x = await one<any>("select * from db_cobros where id=$1 and contacto_id=$2", [Number(params.id), c.id])
  if (!x) notFound()
  if (x.estado === "pagado") redirect(`/portal/pagos/comprobante/${x.id}`)
  if (x.estado !== "pendiente") redirect("/portal/pagos")
  const monto = Number(x.monto)
  const conDescuento = Math.round(monto * (1 - DESCUENTO_TRANSFERENCIA))
  const transf = (await datosTransferencia()) || `Titular: ${PAGO.titular}\nCUIT: ${PAGO.cuit}\n${PAGO.banco} · ${PAGO.cuenta}\nCBU: ${PAGO.cbu}\nAlias: ${PAGO.alias}`
  const mp = mpActivo() && x.moneda === "ARS"
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <Link href="/portal/servicios" className="text-sm underline text-[#4A515C]">← Servicios y productos</Link>
      <div>
        <h1 className="m-0">Pagar</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Elegí cómo pagar. Apenas se acredita, te llega el comprobante y el equipo arranca.</p>
      </div>
      {searchParams.e && <p role="alert" className="m-0 card py-3 text-sm !bg-[#FDECEB] !border-[#F3B7B4]">{searchParams.e}</p>}
      <section className="card flex flex-col gap-1">
        <span className="text-xs text-[#4A515C]">{tipoCobro(x.tipo)}</span>
        <strong className="text-lg">{x.concepto}</strong>
        <span className="text-3xl font-extrabold">{plata(monto, x.moneda)}</span>
        {x.nota && <p className="m-0 mt-1 text-sm text-[#4A515C]">{x.nota}</p>}
        {x.informado_en && <p className="m-0 mt-2 text-sm font-semibold text-emerald-700">Ya nos informaste este pago. Lo estamos confirmando.</p>}
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card flex flex-col gap-3" aria-labelledby="t-mp">
          <h2 id="t-mp" className="m-0 text-base">Mercado Pago</h2>
          <p className="m-0 text-sm text-[#4A515C]">Tarjeta de crédito o débito, dinero en cuenta. Hasta 3 cuotas sin interés.</p>
          <strong className="text-xl">{plata(monto, x.moneda)}</strong>
          {mp ? (
            <form action={pagarMP} className="mt-auto"><input type="hidden" name="cobro" value={x.id} /><button className="btn-p w-full">Pagar con Mercado Pago</button></form>
          ) : <p className="m-0 mt-auto text-sm text-[#4A515C]">Este cobro se paga por transferencia.</p>}
        </section>
        <section className="card flex flex-col gap-3" aria-labelledby="t-tr">
          <h2 id="t-tr" className="m-0 text-base">Transferencia · 10% off</h2>
          <strong className="text-xl">{plata(conDescuento, x.moneda)} <span className="text-sm font-normal text-[#4A515C] line-through">{plata(monto, x.moneda)}</span></strong>
          <p className="m-0 text-sm whitespace-pre-line rounded-lg bg-[#F5F6F8] p-3 font-mono">{transf}</p>
          <form action={transferi} className="mt-auto flex flex-col gap-2">
            <input type="hidden" name="cobro" value={x.id} />
            <label className="lbl font-normal text-xs">Número de operación o comentario (opcional)<input name="detalle" className="inp text-sm" /></label>
            <button className="btn-s">Ya transferí</button>
          </form>
        </section>
      </div>
      <p className="m-0 text-xs text-[#4A515C]">¿Dudas? Escribinos por <a href="https://wa.me/5491173466490" target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a> o a info@devisebit.com. La factura la pedís desde Pagos y facturas.</p>
    </div>
  )
}
