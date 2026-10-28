import { NextResponse, type NextRequest } from "next/server"
import { one } from "@/lib/db"
import { URL_ACADEMIA } from "@/lib/academia"
import { capturarPayPal, paypalConfigurado } from "@/lib/paypal"
import { entregarOrden } from "@/lib/academia-entrega"
export const dynamic = "force-dynamic"

/** Vuelta de PayPal: cobra la orden aprobada y entrega el producto. ?t=<token de la orden>&token=<id de la orden en PayPal> */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? ""
  const ppId = req.nextUrl.searchParams.get("token") ?? ""
  const o = await one<any>("select * from am_ordenes where token=$1", [t]).catch(() => null)
  if (!o) return NextResponse.redirect(`${URL_ACADEMIA}/`)
  const gracias = `${URL_ACADEMIA}/gracias/${o.token}`
  if (o.estado === "pagada") return NextResponse.redirect(gracias)
  if (!ppId || !paypalConfigurado() || o.moneda !== "USD" || (o.mp_preferencia && o.mp_preferencia !== ppId)) return NextResponse.redirect(`${gracias}?e=1`)
  try {
    const cap = await capturarPayPal(ppId, o.id, Number(o.monto))
    if (!cap) return NextResponse.redirect(`${gracias}?e=1`)
    await entregarOrden(o.id, `PP-${cap}`, "paypal")
  } catch (e) {
    console.error("paypal", e)
    return NextResponse.redirect(`${gracias}?e=1`)
  }
  return NextResponse.redirect(gracias)
}
