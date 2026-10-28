import { NextResponse, type NextRequest } from "next/server"
import { q, one } from "@/lib/db"
import { aHtml, plantilla, enviarBrevo } from "@/lib/email"
import { URL_ACADEMIA } from "@/lib/academia"
import { notificar } from "@/lib/push"
import { pagoMPCobro } from "@/lib/pagos"
export const dynamic = "force-dynamic"

/** Aviso de Mercado Pago: se consulta el pago a la API (no se confía en el cuerpo) y, si está aprobado, se entrega el producto. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = b?.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? req.nextUrl.searchParams.get("id")
  const tipo = b?.type ?? req.nextUrl.searchParams.get("type") ?? req.nextUrl.searchParams.get("topic")
  if (!id || (tipo && tipo !== "payment") || !process.env.MP_ACCESS_TOKEN) return NextResponse.json({ ok: true })
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(id))}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } })
  if (!r.ok) return NextResponse.json({ ok: true })
  const p = await r.json()
  if (String(p.external_reference ?? "").startsWith("cobro:")) { await pagoMPCobro(p).catch((e) => console.error("mp cobro", e)); return NextResponse.json({ ok: true }) }
  const orden = Number(p.external_reference)
  if (!orden || p.status !== "approved") return NextResponse.json({ ok: true })
  const o = await one<any>("update am_ordenes set estado='pagada', mp_pago=$1, pagada_en=now() where id=$2 and estado<>'pagada' returning *", [String(p.id), orden])
  if (o) {
    const prod = await one<any>("select titulo from am_productos where id=$1", [o.producto_id])
    await q(`insert into db_contactos(nombre,email,etapa,origen,categoria,tags,consentimiento,clase) values (coalesce($1,split_part($2,'@',1)),$2,'ganado','Academia (compra)','Cliente academia',array['comprador']::text[],'Sí','alumno')
             on conflict (lower(email)) where email is not null do update set tags=(select array(select distinct unnest(db_contactos.tags || array['comprador']::text[]))), clase=coalesce(db_contactos.clase,'alumno'), actualizado=now()`, [o.nombre, o.email]).catch(() => {})
    const link = `${URL_ACADEMIA}/descarga/${o.token}`
    await enviarBrevo({ email: o.email, name: o.nombre }, `Tu compra: ${prod?.titulo ?? "Academia DEVISEBIT"}`, plantilla(aHtml(`# ¡Gracias por tu compra!\n\nYa podés descargar **${prod?.titulo ?? "tu producto"}**.\n\n[[Descargar ahora|${link}]]\n\nSi tenés cualquier duda, respondé este correo.`), { preheader: "Tu descarga está lista" }))
    await notificar(["gerente", "coordinacion"], "💰 Venta en la Academia", `${prod?.titulo ?? "Producto"} · ${o.email} · ${o.moneda} ${o.monto}`, "/academia-admin").catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
export const GET = POST
