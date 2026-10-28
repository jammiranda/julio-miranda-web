import { notFound, redirect } from "next/navigation"
import { one } from "@/lib/db"
import { clienteActual } from "@/lib/portal"
import { usuarioActual } from "@/lib/auth"
import { empresa, asegurarRecibo, nroRecibo, enLetras, formatoCuit, type Facturacion } from "@/lib/comprobantes"
import { plata, tipoCobro } from "@/lib/cobros"
import Imprimir from "@/components/Imprimir"

export const dynamic = "force-dynamic"

const dia = (d: any) => new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })

/** Comprobante de pago (recibo no fiscal, numerado). Lo ve el cliente dueño del cobro o el equipo con sesión. */
export default async function Comprobante({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const [cli, equipo] = await Promise.all([clienteActual(), usuarioActual()])
  if (!cli && !equipo) redirect("/portal/entrar")
  await asegurarRecibo(id)
  const c = await one<any>(
    `select c.*, p.nombre proyecto, k.nombre cliente, k.organizacion, k.email, k.fact
     from db_cobros c join db_contactos k on k.id=c.contacto_id left join db_proyectos p on p.id=c.proyecto_id
     where c.id=$1 and c.estado='pagado' ${equipo ? "" : "and c.contacto_id=$2"}`,
    equipo ? [id] : [id, cli!.id],
  )
  if (!c) notFound()
  const e = await empresa()
  const f: Partial<Facturacion> = c.fact ?? {}
  const nro = nroRecibo(c.recibo_nro)
  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <a href="/portal/pagos" className="text-sm underline text-[#4A515C]">← Pagos y facturas</a>
        <Imprimir />
      </div>
      <article className="card !p-0 overflow-hidden bg-white max-w-3xl w-full mx-auto print:border-0" aria-label={`Comprobante de pago ${nro}`}>
        <header className="ficha-head grid grid-cols-[1fr_auto_1fr] border-b border-[#0E1116]">
          <div className="p-5 flex flex-col gap-0.5 text-sm">
            <span className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#C8231F]">BIT</span></span>
            <strong>{e.razon}</strong>
            <span className="text-[#4A515C]">{e.domicilio}</span>
            {e.iva && <span className="text-[#4A515C]">IVA: {e.iva}</span>}
          </div>
          <div className="border-x border-[#0E1116] px-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold leading-none">X</span>
            <span className="text-[10px] text-[#4A515C] text-center leading-tight mt-1">No válido<br />como factura</span>
          </div>
          <div className="p-5 flex flex-col gap-0.5 text-sm text-right">
            <strong className="text-base">COMPROBANTE DE PAGO</strong>
            <span>N° <strong>{nro}</strong></span>
            <span>Fecha: <strong>{dia(c.pagado_en)}</strong></span>
            {e.cuit && <span className="text-[#4A515C]">CUIT {formatoCuit(e.cuit)}</span>}
            {e.iibb && <span className="text-[#4A515C]">IIBB {e.iibb}</span>}
            {e.inicio && <span className="text-[#4A515C]">Inicio de actividades {e.inicio}</span>}
          </div>
        </header>
        <section className="p-5 border-b border-[#E2E5EA] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span>Recibimos de: <strong>{f.razon || c.organizacion || c.cliente}</strong></span>
          {f.doc ? <span>{f.doc_tipo ?? "CUIT"}: <strong>{f.doc_tipo === "DNI" ? f.doc : formatoCuit(f.doc)}</strong></span> : <span />}
          {f.iva && <span>Condición frente al IVA: {f.iva}</span>}
          {f.domicilio && <span>Domicilio: {f.domicilio}</span>}
          {!f.razon && c.organizacion && <span>Contacto: {c.cliente}</span>}
        </section>
        <section className="p-5 flex flex-col gap-3">
          <table className="tbl">
            <thead><tr><th>Concepto</th><th className="text-right">Importe</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>{c.concepto}</strong><span className="block text-xs text-[#4A515C]">{[tipoCobro(c.tipo), c.proyecto, c.periodo ? `Período ${c.periodo}` : null].filter(Boolean).join(" · ")}</span></td>
                <td className="text-right whitespace-nowrap font-semibold">{plata(c.monto, c.moneda)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-end"><div className="text-right"><span className="text-sm text-[#4A515C]">Total recibido</span><strong className="block text-2xl">{plata(c.monto, c.moneda)}</strong></div></div>
          <p className="m-0 text-sm">Son: <strong>{enLetras(c.monto, c.moneda)}</strong>.</p>
          <p className="m-0 text-sm">Medio de pago: <strong>{c.medio ?? "—"}</strong>{c.mp_pago ? ` · Operación Mercado Pago ${c.mp_pago}` : ""}</p>
          {c.factura_estado === "emitida" && <p className="m-0 text-sm">Factura asociada: <strong>{c.factura_tipo ? `${c.factura_tipo} ` : ""}{c.factura_nro}</strong></p>}
        </section>
        <div className="px-5 py-3 bg-[#F8F9FB] text-xs text-[#4A515C] flex flex-wrap justify-between gap-2">
          <span>Documento no válido como factura. Comprobante interno de pago emitido por el sistema de {e.razon}.</span>
          <span>ID {c.id}</span>
        </div>
      </article>
      <p className="no-print m-0 text-xs text-[#4A515C] text-center">Para guardarlo en PDF: «Imprimir / PDF» y elegí «Guardar como PDF».{c.factura_estado !== "emitida" ? " ¿Necesitás factura? Pedila desde Pagos y facturas." : ""}</p>
    </div>
  )
}
