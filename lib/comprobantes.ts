import { q, one, audit } from "./db"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { notificar } from "./push"
import { config, guardarConfig, plata } from "./cobros"
import { urlPortal, registrarHito } from "./portal"

/**
 * Comprobantes de pago (recibos no fiscales, numerados) y pedidos de factura.
 * La factura electrónica la emite DEVISEBIT en ARCA y la carga acá; el cliente la descarga desde su portal.
 */

export const CONDICIONES_IVA = ["Responsable Inscripto", "Monotributo", "Exento", "Consumidor Final"] as const
export const TIPOS_DOC = ["CUIT", "CUIL", "DNI"] as const

export type Empresa = { razon: string; cuit: string; iva: string; domicilio: string; iibb: string; inicio: string }
const EMPRESA_DEF: Empresa = { razon: "DEVISEBIT SRL", cuit: "", iva: "", domicilio: "Luna 24, Parque Patricios, Ciudad Autónoma de Buenos Aires", iibb: "", inicio: "" }

export async function empresa(): Promise<Empresa> {
  try { return { ...EMPRESA_DEF, ...JSON.parse(await config("empresa_datos", "{}")) } } catch { return EMPRESA_DEF }
}
export async function guardarEmpresa(e: Partial<Empresa>) {
  const limpio = Object.fromEntries(Object.entries({ ...(await empresa()), ...e }).map(([k, v]) => [k, String(v ?? "").trim().slice(0, 200)]))
  await guardarConfig("empresa_datos", JSON.stringify(limpio))
}

export type Facturacion = { razon: string; doc_tipo: string; doc: string; iva: string; domicilio: string; email: string }
export const facturacionCompleta = (f: Partial<Facturacion> | null | undefined): f is Facturacion => !!(f?.razon && f.doc && f.iva && f.domicilio)

/** Valida CUIT/CUIL con dígito verificador. */
export function cuitValido(v: string) {
  const d = v.replace(/\D/g, "")
  if (d.length !== 11) return false
  const m = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const s = m.reduce((a, x, i) => a + x * Number(d[i]), 0)
  let dv = 11 - (s % 11)
  if (dv === 11) dv = 0
  if (dv === 10) dv = 9
  return dv === Number(d[10])
}
export const formatoCuit = (v: string) => { const d = v.replace(/\D/g, ""); return d.length === 11 ? `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : v }

/** Tipo de factura según la condición de DEVISEBIT y la del cliente (null si falta cargar la de DEVISEBIT). */
export function tipoFactura(empresaIva: string, clienteIva: string): "A" | "B" | "C" | null {
  if (empresaIva === "Monotributo" || empresaIva === "Exento") return "C"
  if (empresaIva === "Responsable Inscripto") return clienteIva === "Responsable Inscripto" || clienteIva === "Monotributo" ? "A" : "B"
  return null
}

export const nroRecibo = (n: number | string | null | undefined) => (n ? `0001-${String(n).padStart(8, "0")}` : "—")

/** Le asigna número al comprobante de un cobro pagado (una sola vez, correlativo). */
export async function asegurarRecibo(cobroId: number) {
  await q("update db_cobros set recibo_nro=nextval('db_recibo_seq') where id=$1 and estado='pagado' and recibo_nro is null", [cobroId])
}

/** El cliente pide factura de un cobro (pagado o por pagar). Guarda una copia de sus datos fiscales del momento. */
export async function pedirFactura(cobroId: number, contactoId: number) {
  const k = await one<{ nombre: string; organizacion: string | null; email: string | null; fact: Facturacion | null }>("select nombre, organizacion, email, fact from db_contactos where id=$1", [contactoId])
  if (!facturacionCompleta(k?.fact)) return { ok: false as const, faltanDatos: true }
  const e = await empresa()
  const tipo = tipoFactura(e.iva, k!.fact!.iva)
  const c = await one<any>(
    `update db_cobros set factura_estado='pedida', factura_pedida_en=now(), factura_tipo=$1, factura_datos=$2
     where id=$3 and contacto_id=$4 and estado<>'anulado' and coalesce(factura_estado,'')<>'emitida' returning id, concepto, monto, moneda, proyecto_id, estado`,
    [tipo, JSON.stringify(k!.fact), cobroId, contactoId],
  )
  if (!c) return { ok: false as const }
  if (c.proyecto_id) await registrarHito(c.proyecto_id, { tipo: "cliente", titulo: `Pidió factura${tipo ? ` ${tipo}` : ""}: ${c.concepto}`, detalle: `${k!.fact!.razon} · ${k!.fact!.doc_tipo} ${k!.fact!.doc} · ${k!.fact!.iva}`, autor: k!.nombre, visible: true })
  await audit({ id: 0, usuario: `cliente:${contactoId}` }, "portal_pide_factura", "db_cobro", cobroId, tipo ?? undefined)
  await notificar(["gerente", "coordinacion"], `🧾 Pedido de factura${tipo ? ` ${tipo}` : ""}`, `${k!.organizacion ?? k!.nombre} · ${c.concepto} · ${plata(c.monto, c.moneda)} · ${k!.fact!.razon} (${k!.fact!.doc_tipo} ${k!.fact!.doc}, ${k!.fact!.iva})`, "/portal-admin#facturas").catch(() => {})
  return { ok: true as const, tipo }
}

/** El equipo carga la factura emitida (número + link al PDF) y se la manda al cliente. */
export async function cargarFactura(cobroId: number, o: { nro: string; url: string; tipo?: string | null; por: string }) {
  const c = await one<any>(
    `update db_cobros set factura_estado='emitida', factura_nro=$1, factura_url=$2, factura_tipo=coalesce($3, factura_tipo), factura_emitida_en=now()
     where id=$4 and estado<>'anulado' returning id, contacto_id, concepto, monto, moneda, proyecto_id, factura_tipo, factura_datos`,
    [o.nro.slice(0, 40), o.url.slice(0, 600), o.tipo || null, cobroId],
  )
  if (!c) return { ok: false as const, error: "No se encontró el cobro" }
  const k = await one<{ nombre: string; email: string | null }>("select nombre, email from db_contactos where id=$1", [c.contacto_id])
  const para = (c.factura_datos?.email as string | undefined) || k?.email
  if (c.proyecto_id) await registrarHito(c.proyecto_id, { tipo: "documento", titulo: `Factura ${c.factura_tipo ?? ""} ${o.nro}`.replace(/\s+/g, " "), detalle: `${c.concepto} · ${plata(c.monto, c.moneda)}`, url: o.url, autor: o.por })
  await audit({ id: 0, usuario: o.por }, "carga_factura", "db_cobro", cobroId, o.nro)
  if (para) {
    const md = `# Tu factura está disponible\n\nHola {{nombre}}, te enviamos la factura **${c.factura_tipo ?? ""} ${o.nro}** por **${c.concepto}** (${plata(c.monto, c.moneda)}).\n\n[[Descargar factura|${o.url}]]\n\nTambién la tenés siempre en tu cuenta, en Pagos y facturas.\n\n[[Ir a mi cuenta|${urlPortal("/pagos")}]]`
    await enviarBrevo({ email: para, name: k?.nombre }, `Factura ${c.factura_tipo ?? ""} ${o.nro} · DEVISEBIT`.replace(/\s+/g, " "), plantilla(aHtml(md), { nombre: k?.nombre ?? null, preheader: c.concepto })).catch(() => {})
  }
  return { ok: true as const }
}

// ── Importe en letras (para el comprobante) ──
const U = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"]
const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"]
function menosDeMil(n: number): string {
  if (n === 0) return ""
  if (n === 100) return "cien"
  const c = Math.floor(n / 100), r = n % 100
  const dec = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " y " + U[r % 10] : "")
  return [C[c], dec].filter(Boolean).join(" ")
}
export function enLetras(monto: number | string, moneda: string) {
  const v = Math.round(Number(monto) * 100)
  const ent = Math.floor(v / 100), cent = v % 100
  const partes: string[] = []
  const mill = Math.floor(ent / 1_000_000), miles = Math.floor((ent % 1_000_000) / 1000), resto = ent % 1000
  if (mill) partes.push(mill === 1 ? "un millón" : `${menosDeMil(mill).replace(/uno$/, "un")} millones`)
  if (miles) partes.push(miles === 1 ? "mil" : `${menosDeMil(miles).replace(/uno$/, "un")} mil`)
  if (resto) partes.push(menosDeMil(resto))
  const txt = partes.join(" ") || "cero"
  const mon = moneda === "USD" ? "dólares estadounidenses" : "pesos"
  const t = `${txt} ${mon}${cent ? ` con ${String(cent).padStart(2, "0")}/100` : ""}`
  return t.charAt(0).toUpperCase() + t.slice(1)
}
