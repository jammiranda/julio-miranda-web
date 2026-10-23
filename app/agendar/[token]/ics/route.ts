import { NextResponse } from "next/server"
import { one } from "@/lib/db"
import { ics } from "@/lib/agenda"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const r = await one<any>("select r.* from db_reuniones r join consultas c on c.id=r.consulta_id where c.brief_token=$1 and r.estado='confirmada' order by r.inicio desc limit 1", [params.token])
  if (!r) return new NextResponse("No hay reunión agendada", { status: 404 })
  return new NextResponse(ics(r), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="reunion-devisebit.ics"' } })
}
