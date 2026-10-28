import { q, one, audit } from "./db"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { notificar } from "./push"
import { urlPortal, registrarHito } from "./portal"
import { plata, config } from "./cobros"

/** Pago online de cobros con Mercado Pago (solo pesos). El aviso de MP entra por /api/academia/mp. */
export const mpActivo = () => !!process.env.MP_ACCESS_TOKEN
export const datosTransferencia = () => config("datos_transferencia", "")

export async function linkPagoCobro(cobroId: number, contactoId: number) {
  const c = await one<any>("select c.*, k.email, k.nombre from db_cobros c join db_contactos k on k.id=c.contacto_id where c.id=$1 and c.contacto_id=$2 and c.estado='pendiente'", [cobroId, contactoId])
  if (!c) return { ok: false as const, error: "Ese cobro ya no está pendiente." }
  if (c.moneda !== "ARS") return { ok: false as const, error: "Este cobro es en otra moneda: pagalo por transferencia." }
  const vuelta = urlPortal(`/pagos?mp=${c.id}`)
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ id: `cobro-${c.id}`, title: c.concepto.slice(0, 120), quantity: 1, unit_price: Number(c.monto), currency_id: "ARS" }],
      payer: { email: c.email }, external_reference: `cobro:${c.id}`, statement_descriptor: "DEVISEBIT",
      back_urls: { success: vuelta, pending: vuelta, failure: `${vuelta}&e=1` }, auto_return: "approved",
      notification_url: "https://sistema.devisebit.com/api/academia/mp",
    }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok ? { ok: true as const, url: j.init_point as string } : { ok: false as const, error: j.message ?? `Mercado Pago respondió ${r.status}` }
}

/** Marca un cobro como pagado (desde MP o a mano), deja rastro en el proyecto y avisa. */
export async function registrarPago(cobroId: number, o: { medio: string; mpPago?: string | null; por: string; nota?: string | null }) {
  const c = await one<any>(
    "update db_cobros set estado='pagado', pagado_en=now(), medio=$1, mp_pago=coalesce($2,mp_pago), nota=coalesce($3,nota), recibo_nro=coalesce(recibo_nro, nextval('db_recibo_seq')) where id=$4 and estado='pendiente' returning *",
    [o.medio, o.mpPago ?? null, o.nota ?? null, cobroId],
  )
  if (!c) return null
  const k = await one<{ nombre: string; email: string | null; organizacion: string | null }>("select nombre, email, organizacion from db_contactos where id=$1", [c.contacto_id])
  if (c.proyecto_id) await registrarHito(c.proyecto_id, { tipo: "pago", titulo: `Pago recibido: ${c.concepto}`, detalle: `${plata(c.monto, c.moneda)} · ${o.medio}`, autor: o.por })
  await audit({ id: 0, usuario: o.por }, "cobro_pagado", "db_cobro", cobroId, `${c.moneda} ${c.monto} · ${o.medio}`)
  if (k?.email) {
    await enviarBrevo({ email: k.email, name: k.nombre }, `Recibimos tu pago · ${c.concepto}`, plantilla(aHtml(`# ¡Gracias, recibimos tu pago!\n\n**${c.concepto}**\n\nImporte: **${plata(c.monto, c.moneda)}** · Medio: ${o.medio}\n\nTu comprobante de pago N° ${String(c.recibo_nro).padStart(8, "0")} ya está disponible. Si necesitás factura, la podés pedir desde el mismo lugar.\n\n[[Ver mi comprobante|${urlPortal(`/pagos/comprobante/${c.id}`)}]]`), { nombre: k.nombre, preheader: "Comprobante de pago" })).catch(() => {})
  }
  await notificar(["gerente", "coordinacion"], "💰 Pago recibido", `${k?.organizacion ?? k?.nombre ?? "Cliente"} · ${c.concepto} · ${plata(c.monto, c.moneda)} (${o.medio})`, c.proyecto_id ? `/proyectos/${c.proyecto_id}#cobros` : "/portal-admin").catch(() => {})
  return c
}

/** Aviso de MP para un cobro: se valida contra la API (monto y estado) antes de marcarlo. */
export async function pagoMPCobro(p: any) {
  const id = Number(String(p.external_reference).replace("cobro:", ""))
  if (!id || p.status !== "approved") return
  const c = await one<{ monto: string }>("select monto from db_cobros where id=$1 and estado='pendiente'", [id])
  if (!c || Number(p.transaction_amount) + 0.01 < Number(c.monto)) return
  await registrarPago(id, { medio: "Mercado Pago", mpPago: String(p.id), por: "Mercado Pago" })
}

/** Recordatorio por email de cobros que vencen en 3 días o vencieron ayer (lo llama el cron diario). */
export async function recordatoriosCobro() {
  const l = await q<any>(
    `select c.*, to_char(c.vence,'DD/MM/YYYY') vence_txt, k.nombre, k.email,
       ((now() at time zone 'America/Argentina/Buenos_Aires')::date - c.vence) dias
     from db_cobros c join db_contactos k on k.id=c.contacto_id
     where c.estado='pendiente' and k.email is not null
       and ((now() at time zone 'America/Argentina/Buenos_Aires')::date - c.vence) in (-3, 1, 7)`,
  )
  let n = 0
  for (const c of l) {
    const venc = Number(c.dias) > 0
    const md = venc
      ? `# Tenés un pago vencido\n\nHola {{nombre}}, el pago **${c.concepto}** de **${plata(c.monto, c.moneda)}** venció el ${c.vence_txt}.\n\nPodés pagarlo desde tu portal o, si ya lo hiciste, respondé este correo con el comprobante.\n\n[[Pagar ahora|${urlPortal("/pagos")}]]`
      : `# Recordatorio de pago\n\nHola {{nombre}}, el ${c.vence_txt} vence **${c.concepto}** por **${plata(c.monto, c.moneda)}**.\n\n[[Ver y pagar|${urlPortal("/pagos")}]]`
    const r = await enviarBrevo({ email: c.email, name: c.nombre }, venc ? `Pago vencido · ${c.concepto}` : `Vence el ${c.vence_txt} · ${c.concepto}`, plantilla(aHtml(md), { nombre: c.nombre, preheader: c.concepto }))
    if (r.ok) n++
  }
  return n
}
