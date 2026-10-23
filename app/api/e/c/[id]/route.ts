import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"
/** Clic medido y redirección al destino. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = req.nextUrl.searchParams.get("u") ?? ""
  const destino = /^https?:\/\//.test(u) ? u : "https://www.devisebit.com"
  const id = Number(params.id)
  if (id) await q("update em_envios set clics=clics+1, clic_en=coalesce(clic_en, now()), abierto_en=coalesce(abierto_en, now()) where id=$1", [id]).catch(() => {})
  return NextResponse.redirect(destino, 302)
}
