import { NextResponse } from "next/server"
import { one } from "@/lib/db"
export const dynamic = "force-dynamic"
export async function GET(_r: Request, { params }: { params: { token: string } }) {
  const o = await one<any>("select o.estado, p.archivo_url from am_ordenes o join am_productos p on p.id=o.producto_id where o.token=$1", [params.token])
  if (!o || o.estado !== "pagada" || !o.archivo_url) return new NextResponse("Descarga no disponible. Escribinos a info@devisebit.com.", { status: 404 })
  return NextResponse.redirect(o.archivo_url, 302)
}
