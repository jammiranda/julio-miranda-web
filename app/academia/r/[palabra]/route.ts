import { NextResponse, type NextRequest } from "next/server"
import { recurso, sumarUso } from "@/lib/recursos"
import { URL_ACADEMIA } from "@/lib/academia"
export const dynamic = "force-dynamic"

/** Link corto de un recurso: academia.devisebit.com/r/<palabra>. Cuenta el clic y lleva al recurso con UTM. */
export async function GET(req: NextRequest, { params }: { params: { palabra: string } }) {
  const r = await recurso(params.palabra).catch(() => null)
  if (!r) return NextResponse.redirect(`${URL_ACADEMIA}/guias`)
  await sumarUso(r.palabra)
  const u = new URL(r.url)
  const medio = req.nextUrl.searchParams.get("utm_medium") ?? "dm"
  if (!u.searchParams.has("utm_source")) {
    u.searchParams.set("utm_source", req.nextUrl.searchParams.get("utm_source") ?? "instagram")
    u.searchParams.set("utm_medium", medio)
    u.searchParams.set("utm_campaign", `recurso-${r.palabra.toLowerCase()}`)
  }
  return NextResponse.redirect(u.toString())
}
