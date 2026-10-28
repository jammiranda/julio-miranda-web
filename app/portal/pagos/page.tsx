import { redirect } from "next/navigation"
import { requerirCliente } from "@/lib/portal"
import { estadoCuenta, montos, plata, tipoCobro } from "@/lib/cobros"
import { linkPagoCobro, mpActivo, datosTransferencia } from "@/lib/pagos"
import { audit, q, one } from "@/lib/db"
import { registrarHito } from "@/lib/portal"
import { notificar } from "@/lib/push"
import { waitUntil } from "@vercel/functions"
import { fecha } from "@/lib/util"
import Link from "next/link"
import { pedirFactura, nroRecibo, formatoCuit, facturacionCompleta, type Facturacion } from "@/lib/comprobantes"

export const dynamic = "force-dynamic"

async function pagar(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const r = await linkPagoCobro(Number(fd.get("cobro")), c.id)
  await audit({ id: 0, usuario: `cliente:${c.id}` }, r.ok ? "portal_pago_inicia" : "portal_pago_error", "db_cobro", String(fd.get("cobro")), r.ok ? undefined : r.error)
  if (!r.ok) redirect(`/portal/pagos?err=${encodeURIComponent(r.error)}`)
  redirect(r.url)
}

async function informar(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const id = Number(fd.get("cobro"))
  const det = [String(fd.get("medio") ?? "Transferencia").slice(0, 40), String(fd.get("detalle") ?? "").trim().slice(0, 500)].filter(Boolean).join(" · ")
  const x = await one<any>("update db_cobros set informado_en=now(), informado_detalle=$1 where id=$2 and contacto_id=$3 and estado='pendiente' returning id, concepto, monto, moneda, proyecto_id", [det, id, c.id])
  if (!x) redirect("/portal/pagos")
  if (x.proyecto_id) await registrarHito(x.proyecto_id, { tipo: "cliente", titulo: `Informó el pago: ${x.concepto}`, detalle: det, autor: c.nombre })
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_informa_pago", "db_cobro", id, det)
  waitUntil(notificar(["gerente", "coordinacion"], "🧾 Cliente informó un pago", `${c.organizacion ?? c.nombre} · ${x.concepto} · ${plata(x.monto, x.moneda)} — ${det}. Confirmalo en Cobros.`, x.proyecto_id ? `/proyectos/${x.proyecto_id}#cobros` : `/contactos/${c.id}#portal`).catch(() => {}))
  redirect("/portal/pagos?inf=1")
}

async function factura(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const id = Number(fd.get("cobro"))
  const r = await pedirFactura(id, c.id)
  if (!r.ok && r.faltanDatos) redirect(`/portal/facturacion?cobro=${id}`)
  redirect(r.ok ? "/portal/pagos?fac=1" : "/portal/pagos")
}

export default async function Pagos({ searchParams }: { searchParams: { mp?: string; e?: string; err?: string; inf?: string; fac?: string; datos?: string } }) {
  const c = await requerirCliente(true)
  const [e, transf, k] = await Promise.all([estadoCuenta(c.id), datosTransferencia(), one<{ fact: Facturacion | null }>("select fact from db_contactos where id=$1", [c.id])])
  const fact = k?.fact ?? null
  const pagados = e.cobros.filter((x) => x.estado === "pagado").reverse()
  const mp = mpActivo()
  const Fila = ({ x }: { x: (typeof e.cobros)[number] }) => {
    const venc = x.estado === "pendiente" && (x.dias_atraso ?? 0) > 0
    return (
      <li className="flex flex-wrap items-center gap-3 py-3 border-b border-[#EEF0F3] last:border-0">
        <div className="flex-1 min-w-[200px]">
          <strong className="block text-sm">{x.concepto}</strong>
          <span className="text-xs text-[#4A515C]">{tipoCobro(x.tipo)}{x.proyecto ? ` · ${x.proyecto}` : ""} · {x.estado === "pagado" ? `Pagado el ${fecha(x.pagado_en)}${x.medio ? ` (${x.medio})` : ""}` : `Vence ${fecha(x.vence)}`}</span>
          {venc && <span className="block text-xs font-semibold text-rojo">Vencido hace {x.dias_atraso} {x.dias_atraso === 1 ? "día" : "días"}</span>}
        </div>
        <strong className="text-sm">{plata(x.monto, x.moneda)}</strong>
        {x.estado === "pendiente" && mp && x.moneda === "ARS" && (
          <form action={pagar}><input type="hidden" name="cobro" value={x.id} /><button className={venc ? "btn-p py-1.5" : "btn-s py-1.5"}>Pagar con Mercado Pago</button></form>
        )}
        {x.estado === "pagado" && <span className="chip bg-emerald-50 text-emerald-700">Pagado</span>}
        <div className="w-full flex flex-wrap items-center gap-2 text-sm">
          {x.estado === "pagado" && <Link href={`/portal/pagos/comprobante/${x.id}`} className="btn-s py-1 text-xs">Comprobante{x.recibo_nro ? ` N° ${nroRecibo(x.recibo_nro)}` : ""}</Link>}
          {x.factura_estado === "emitida" && x.factura_url && <a href={x.factura_url} target="_blank" rel="noopener noreferrer" className="btn-s py-1 text-xs">Descargar factura {x.factura_tipo ?? ""} {x.factura_nro} ↗</a>}
          {x.factura_estado === "pedida" && <span className="chip bg-sky-50 text-sky-700">Factura {x.factura_tipo ?? ""} pedida · la estamos preparando</span>}
          {!x.factura_estado && (
            <form action={factura}><input type="hidden" name="cobro" value={x.id} /><button className="text-xs underline text-[#4A515C] hover:text-[#C8231F]">Necesito factura</button></form>
          )}
        </div>
        {x.estado === "pendiente" && x.informado_en && <span className="chip bg-sky-50 text-sky-700">Pago informado · lo estamos confirmando</span>}
        {x.estado === "pendiente" && !x.informado_en && (
          <details className="w-full">
            <summary className="cursor-pointer text-sm underline text-[#4A515C]">Ya pagué: informar el pago</summary>
            <form action={informar} className="mt-2 flex flex-wrap gap-2 items-end">
              <input type="hidden" name="cobro" value={x.id} />
              <label className="lbl">Medio<select name="medio" className="inp py-1.5"><option>Transferencia</option><option>Depósito</option><option>Efectivo</option><option>Otro</option></select></label>
              <label className="lbl flex-1 min-w-[200px]">Fecha, número de operación o link al comprobante<input name="detalle" required maxLength={500} className="inp py-1.5" /></label>
              <button className="btn-s py-1.5">Informar</button>
            </form>
          </details>
        )}
      </li>
    )
  }
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="m-0">Pagos y facturas</h1><p className="m-0 mt-1 text-[#4A515C]">Tus cuotas, abonos, comprobantes y facturas con DEVISEBIT.</p></div>
      {searchParams.fac && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">Pedido de factura enviado. Te llega por email y la vas a poder descargar desde acá.</p>}
      {searchParams.datos && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">Datos de facturación guardados.</p>}
      {searchParams.mp && !searchParams.e && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">Si el pago se aprobó, en unos minutos lo vas a ver acá como pagado y te llega el comprobante por email.</p>}
      {searchParams.inf && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">¡Gracias! Avisamos al equipo: apenas lo confirmen, lo vas a ver como pagado y te llega el comprobante.</p>}
      {(searchParams.e || searchParams.err) && <p role="alert" className="m-0 card py-3 text-sm !bg-[#FDECEB] !border-[#F3B7B4]">{searchParams.err ?? "El pago no se completó. Podés intentar de nuevo o pagar por transferencia."}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`card ${e.vencidos.length ? "!border-[#C8231F]" : ""}`}><span className="text-xs text-[#4A515C]">Vencido</span><strong className={`block text-xl ${e.vencidos.length ? "text-rojo" : ""}`}>{e.vencidos.length ? montos(e.deudaVencida) : "Nada vencido"}</strong></div>
        <div className="card"><span className="text-xs text-[#4A515C]">Total pendiente</span><strong className="block text-xl">{e.pendientes.length ? montos(e.aPagar) : "—"}</strong></div>
        <div className="card"><span className="text-xs text-[#4A515C]">Próximo vencimiento</span><strong className="block text-xl">{e.proximo ? fecha(e.proximo.vence) : "—"}</strong>{e.proximo && <span className="text-xs text-[#4A515C]">{plata(e.proximo.monto, e.proximo.moneda)}</span>}</div>
      </div>

      <section className="card" aria-labelledby="t-pend">
        <h2 id="t-pend" className="m-0 text-base">Pendientes</h2>
        {!e.pendientes.length ? <p className="m-0 mt-2 text-sm text-[#4A515C]">No tenés pagos pendientes. ¡Gracias!</p> : <ul className="m-0 p-0 list-none">{e.pendientes.map((x) => <Fila key={x.id} x={x} />)}</ul>}
      </section>

      {(transf || !mp) && e.pendientes.length > 0 && (
        <section className="card" aria-labelledby="t-tr">
          <h2 id="t-tr" className="m-0 text-base">Pagar por transferencia</h2>
          <p className="m-0 mt-2 text-sm whitespace-pre-line">{transf || "Pedinos los datos bancarios por WhatsApp o respondé el último email."}</p>
          <p className="m-0 mt-2 text-xs text-[#4A515C]">Después de transferir, tocá «Ya pagué» en el cobro o mandanos el comprobante por <a target="_blank" rel="noopener noreferrer" className="underline" href="https://wa.me/5491173466490">WhatsApp</a> o a info@devisebit.com.</p>
        </section>
      )}

      <section className="card flex flex-wrap items-start justify-between gap-3" aria-labelledby="t-fact">
        <div>
          <h2 id="t-fact" className="m-0 text-base">Datos de facturación</h2>
          {facturacionCompleta(fact)
            ? <p className="m-0 mt-1 text-sm">{fact.razon} · {fact.doc_tipo} {fact.doc_tipo === "DNI" ? fact.doc : formatoCuit(fact.doc)} · {fact.iva}<span className="block text-xs text-[#4A515C]">{fact.domicilio}{fact.email ? ` · Facturas a ${fact.email}` : ""}</span></p>
            : <p className="m-0 mt-1 text-sm text-[#4A515C]">Cargalos una vez y pedí factura de cualquier cobro, pagado o por pagar.</p>}
        </div>
        <Link href="/portal/facturacion" className="btn-s py-1.5">{facturacionCompleta(fact) ? "Editar" : "Cargar datos"}</Link>
      </section>

      {pagados.length > 0 && (
        <section className="card" aria-labelledby="t-hist">
          <h2 id="t-hist" className="m-0 text-base">Pagos realizados y comprobantes</h2>
          <ul className="m-0 p-0 list-none">{pagados.map((x) => <Fila key={x.id} x={x} />)}</ul>
        </section>
      )}
    </div>
  )
}
