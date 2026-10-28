import { randomBytes } from "crypto"
import { q, one, audit } from "./db"
import { precios, type Precio } from "./precios"
import { plata } from "./cobros"
import { notificar } from "./push"
import type { Cliente } from "./portal"

/**
 * Compras desde Mi cuenta: el cliente elige un producto de la lista de precios vigente
 * y se le genera el cobro para pagar en el momento (Mercado Pago o transferencia).
 * - Producto con precio de proyecto → seña del 50% (el saldo va contra entrega).
 * - Producto que es solo abono → primer mes del abono.
 */
export const SENA = 0.5
export const DESCUENTO_TRANSFERENCIA = 0.1

export function primerPago(p: Pick<Precio, "precio" | "abono" | "producto">) {
  if (p.precio) return { tipo: "anticipo" as const, monto: Math.round(p.precio * SENA), concepto: `Seña 50% · ${p.producto}`, detalle: `Seña del 50% sobre ${plata(p.precio)}. El saldo se paga contra entrega${p.abono ? ` y el abono de ${plata(p.abono)} por mes empieza con la entrega` : ""}.` }
  if (p.abono) return { tipo: "abono" as const, monto: Math.round(p.abono), concepto: `Primer mes · ${p.producto}`, detalle: `Primer mes del abono de ${plata(p.abono)}. Los meses siguientes se generan solos en tu cuenta.` }
  return null
}

export async function comprar(c: Cliente, precioId: number) {
  const p = (await precios(true)).find((x) => x.id === precioId)
  if (!p) return { ok: false as const, error: "Ese producto ya no está en la lista de precios." }
  const pp = primerPago(p)
  if (!pp) return { ok: false as const, error: "Este producto se cotiza a medida: pedí una propuesta." }
  // Si ya hay un cobro pendiente del mismo producto, se reutiliza (evita duplicados por doble clic)
  const ya = await one<{ id: number }>("select id from db_cobros where contacto_id=$1 and concepto=$2 and estado='pendiente' and creado > now() - interval '7 days' order by id desc limit 1", [c.id, pp.concepto])
  if (ya) return { ok: true as const, id: ya.id }
  const r = await one<{ id: number }>(
    `insert into db_cobros(contacto_id, tipo, concepto, monto, moneda, vence, nota, creado_por)
     values ($1,$2,$3,$4,'ARS',(now() at time zone 'America/Argentina/Buenos_Aires')::date + 3,$5,$6) returning id`,
    [c.id, pp.tipo, pp.concepto, pp.monto, pp.detalle, `cliente:${c.id}`],
  )
  await q("update db_contactos set proximo=$1, proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date, actualizado=now() where id=$2",
    [`Compró ${p.producto} desde Mi cuenta: confirmar pago y armar el proyecto`, c.id]).catch(() => {})
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_compra", "db_cobro", r!.id, `${p.producto} · ${plata(pp.monto)}`)
  await notificar(["gerente", "coordinacion"], "🛒 Compra desde Mi cuenta", `${c.organizacion ?? c.nombre} · ${p.producto} · ${pp.concepto} ${plata(pp.monto)}`, `/contactos/${c.id}#portal`).catch(() => {})
  return { ok: true as const, id: r!.id }
}

/** Consulta comercial del contacto (la crea si no tiene): la usan la agenda y el bot. */
export async function consultaDe(c: Cliente) {
  const k = await one<{ consulta_id: number | null; telefono: string | null }>("select consulta_id, telefono from db_contactos where id=$1", [c.id])
  if (k?.consulta_id) {
    const tok = randomBytes(9).toString("base64url")
    const x = await one<{ id: number; brief_token: string }>("update consultas set brief_token=coalesce(brief_token,$1) where id=$2 returning id, brief_token", [tok, k.consulta_id])
    if (x) return x
  }
  const tok = randomBytes(9).toString("base64url")
  const n = await one<{ id: number; brief_token: string }>(
    "insert into consultas(empresa,canal,nombre,telefono,email,organizacion,motivo,fuente,brief_token) values ('devisebit','portal',$1,$2,$3,$4,'Reunión pedida desde Mi cuenta','portal',$5) returning id, brief_token",
    [c.nombre, k?.telefono ?? null, c.email, c.organizacion, tok],
  )
  await q("update db_contactos set consulta_id=$1 where id=$2 and consulta_id is null", [n!.id, c.id])
  return n!
}
