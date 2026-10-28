import { redirect } from "next/navigation"
import { q, one, audit } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { CONDICIONES_IVA, TIPOS_DOC, cuitValido, pedirFactura, type Facturacion } from "@/lib/comprobantes"

export const dynamic = "force-dynamic"

const t = (v: FormDataEntryValue | null, n = 160) => String(v ?? "").trim().slice(0, n)

async function guardar(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const cobro = Number(fd.get("cobro")) || 0
  const doc_tipo = TIPOS_DOC.includes(t(fd.get("doc_tipo")) as any) ? t(fd.get("doc_tipo")) : "CUIT"
  const doc = t(fd.get("doc"), 20).replace(/\D/g, "")
  const iva = (CONDICIONES_IVA as readonly string[]).includes(t(fd.get("iva"))) ? t(fd.get("iva")) : ""
  const f: Facturacion = { razon: t(fd.get("razon")), doc_tipo, doc, iva, domicilio: t(fd.get("domicilio"), 240), email: t(fd.get("email")).toLowerCase() }
  const vuelta = `/portal/facturacion${cobro ? `?cobro=${cobro}&` : "?"}`
  if (!f.razon || !f.domicilio || !f.iva) redirect(`${vuelta}e=faltan`)
  if (doc_tipo === "DNI" ? !/^\d{7,8}$/.test(doc) : !cuitValido(doc)) redirect(`${vuelta}e=doc`)
  if (doc_tipo === "DNI" && iva !== "Consumidor Final") redirect(`${vuelta}e=dni`)
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) redirect(`${vuelta}e=email`)
  await q("update db_contactos set fact=$1, actualizado=now() where id=$2", [JSON.stringify(f), c.id])
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_datos_facturacion", "db_contacto", c.id)
  if (cobro) {
    const r = await pedirFactura(cobro, c.id)
    redirect(r.ok ? `/portal/pagos?fac=1` : "/portal/pagos")
  }
  redirect("/portal/pagos?datos=1")
}

const ERR: Record<string, string> = {
  faltan: "Completá razón social, domicilio fiscal y condición frente al IVA.",
  doc: "Revisá el número: el CUIT/CUIL tiene 11 dígitos y uno verificador; el DNI, 7 u 8.",
  dni: "Con DNI solo se puede facturar como Consumidor Final. Si sos empresa o monotributista, usá tu CUIT.",
  email: "Revisá el email para recibir facturas.",
}

export default async function DatosFacturacion({ searchParams }: { searchParams: { cobro?: string; e?: string } }) {
  const c = await requerirCliente(true)
  const k = await one<{ fact: Partial<Facturacion> | null; email: string | null }>("select fact, email from db_contactos where id=$1", [c.id])
  const f = k?.fact ?? {}
  const cobro = Number(searchParams.cobro) || 0
  const pend = cobro ? await one<{ concepto: string }>("select concepto from db_cobros where id=$1 and contacto_id=$2", [cobro, c.id]) : null
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <a href="/portal/pagos" className="text-sm underline text-[#4A515C] self-start">← Pagos y facturas</a>
      <div>
        <h1 className="m-0">Datos de facturación</h1>
        <p className="m-0 mt-1 text-[#4A515C]">{pend ? <>Para emitir la factura de <strong>{pend.concepto}</strong> necesitamos estos datos. Se guardan para las próximas.</> : "Los usamos para tus facturas. Podés cambiarlos cuando quieras; las facturas ya emitidas no cambian."}</p>
      </div>
      {searchParams.e && <p role="alert" className="m-0 card py-3 text-sm !bg-[#FDECEB] !border-[#F3B7B4]">{ERR[searchParams.e] ?? "Revisá los datos."}</p>}
      <form action={guardar} className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="hidden" name="cobro" value={cobro || ""} />
        <label className="lbl sm:col-span-2">Razón social o nombre completo *<input name="razon" required defaultValue={f.razon ?? c.organizacion ?? c.nombre} className="inp" autoComplete="organization" /></label>
        <label className="lbl">Tipo de documento<select name="doc_tipo" defaultValue={f.doc_tipo ?? "CUIT"} className="inp">{TIPOS_DOC.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className="lbl">Número *<input name="doc" required inputMode="numeric" defaultValue={f.doc ?? ""} className="inp" placeholder="30-12345678-9" /></label>
        <label className="lbl sm:col-span-2">Condición frente al IVA *<select name="iva" required defaultValue={f.iva ?? ""} className="inp"><option value="" disabled>Elegí una opción</option>{CONDICIONES_IVA.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="lbl sm:col-span-2">Domicilio fiscal *<input name="domicilio" required defaultValue={f.domicilio ?? ""} className="inp" placeholder="Calle 123, Localidad, Provincia" autoComplete="street-address" /></label>
        <label className="lbl sm:col-span-2">Email para recibir facturas<input name="email" type="email" defaultValue={f.email ?? ""} placeholder={k?.email ?? ""} className="inp" /><span className="text-xs font-normal text-[#4A515C]">Si lo dejás vacío, usamos {k?.email ?? "tu email"}.</span></label>
        <div className="sm:col-span-2"><button className="btn-p">{pend ? "Guardar y pedir la factura" : "Guardar datos"}</button></div>
      </form>
    </div>
  )
}
