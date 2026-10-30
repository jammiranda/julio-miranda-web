import { q, one } from "./db"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { URL_ACADEMIA } from "./academia"
import { notificar } from "./push"
import { inscribirPorCompra } from "./cursos"

/**
 * Marca una orden de la Academia como pagada y entrega el producto (descarga o coordinación del servicio).
 * La usan Mercado Pago (pesos) y PayPal (dólares, pagos desde el exterior). Si la orden ya estaba pagada no hace nada.
 */
export async function entregarOrden(orden: number, pagoRef: string, pasarela: "mercadopago" | "paypal" | "prueba") {
  const o = await one<any>("update am_ordenes set estado='pagada', mp_pago=$1, pasarela=$3, pagada_en=now() where id=$2 and estado<>'pagada' returning *", [pagoRef, orden, pasarela])
  if (!o) return false
  // Curso a tu ritmo: la compra inscribe sola y el email de bienvenida lleva el acceso al aula.
  if (o.curso_id) {
    const c = await one<{ titulo: string }>("select titulo from am_cursos where id=$1", [o.curso_id])
    const iid = await inscribirPorCompra({ id: o.id, email: o.email, nombre: o.nombre, curso_id: o.curso_id, pasarela })
    await notificar(["gerente", "coordinacion"], "💰 Venta de curso", `${c?.titulo ?? "Curso"} · ${o.email} · ${o.moneda} ${o.monto} · ${pasarela === "paypal" ? "PayPal" : pasarela === "prueba" ? "Prueba" : "Mercado Pago"}${iid ? "" : " · NO SE PUDO INSCRIBIR, revisar"}`, "/sistema/cursos").catch(() => {})
    return true
  }
  const prod = await one<any>("select titulo, servicio from am_productos where id=$1", [o.producto_id])
  await q(`insert into db_contactos(nombre,email,etapa,origen,categoria,tags,consentimiento,clase) values (coalesce($1,split_part($2,'@',1)),$2,'ganado','Academia (compra)','Cliente academia',array['comprador']::text[],'Sí','alumno')
           on conflict (lower(email)) where email is not null do update set tags=(select array(select distinct unnest(db_contactos.tags || array['comprador']::text[]))), clase=coalesce(db_contactos.clase,'alumno'), actualizado=now()`, [o.nombre, o.email]).catch(() => {})
  const link = `${URL_ACADEMIA}/descarga/${o.token}`
  if (prod?.servicio) {
    await q("update db_contactos set clase=case when clase is null or clase in ('suscriptor','oportunidad','alumno') then 'cliente' else clase end, proximo=$1, proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date, actualizado=now() where lower(email)=lower($2)", [`Coordinar ${prod.titulo} (pagado online)`, o.email]).catch(() => {})
    await enviarBrevo({ email: o.email, name: o.nombre }, `Confirmamos tu compra: ${prod.titulo}`, plantilla(aHtml(`# ¡Gracias por tu compra!\n\nRecibimos el pago de **${prod.titulo}**.\n\nEn menos de 24 horas hábiles te escribimos para coordinar. Si querés adelantarte, elegí un horario:\n\n[[Agendar la primera reunión|https://sistema.devisebit.com/agendar]]\n\n¿Necesitás factura? Respondé este correo con tu razón social, CUIT y condición frente al IVA.`), { preheader: "Te escribimos en menos de 24 h" }))
  } else {
    await enviarBrevo({ email: o.email, name: o.nombre }, `Tu compra: ${prod?.titulo ?? "ACADEMIA DEVISEBIT"}`, plantilla(aHtml(`# ¡Gracias por tu compra!\n\nYa podés descargar **${prod?.titulo ?? "tu producto"}**.\n\n[[Descargar ahora|${link}]]\n\nSi tenés cualquier duda, respondé este correo.`), { preheader: "Tu descarga está lista" }))
  }
  await notificar(["gerente", "coordinacion"], "💰 Venta en la Academia", `${prod?.titulo ?? "Producto"} · ${o.email} · ${o.moneda} ${o.monto} · ${pasarela === "paypal" ? "PayPal" : "Mercado Pago"}`, "/sistema").catch(() => {})
  return true
}
