import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"
/** Clic medido (por envío y por link) y redirección al destino. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = req.nextUrl.searchParams.get("u") ?? ""
  const destino = /^https?:\/\//.test(u) ? u : "https://www.devisebit.com"
  const id = Number(params.id)
  if (id) {
    await q("update em_envios set clics=clics+1, clic_en=coalesce(clic_en, now()), abierto_en=coalesce(abierto_en, now()) where id=$1", [id]).catch(() => {})
    await q("insert into em_clics(envio_id, campania_id, url) select id, campania_id, $2 from em_envios where id=$1", [id, destino.slice(0, 600)]).catch(() => {})
  }
  return NextResponse.redirect(destino, 302)
}
