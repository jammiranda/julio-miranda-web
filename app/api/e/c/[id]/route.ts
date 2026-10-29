import { NextResponse, type NextRequest } from "next/server"
import { q, one } from "@/lib/db"
import { marcarBot } from "@/lib/depuracion"
export const dynamic = "force-dynamic"
/**
 * Clic medido (por envío y por link) y redirección al destino.
 * Los filtros antivirus de bancos, gobierno y empresas abren todos los links apenas llega el correo:
 * si un envío toca 3 links distintos o más en 2 minutos, es un robot y no se cuenta como persona.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = req.nextUrl.searchParams.get("u") ?? ""
  const destino = /^https?:\/\//.test(u) ? u : "https://www.devisebit.com"
  const id = Number(params.id)
  if (id) {
    try {
      const e = await one<{ bot: boolean; reciente: boolean }>("select bot, (bot_en > now() - interval '10 minutes') reciente from em_envios where id=$1", [id])
      if (e?.bot && e.reciente) await q("update em_envios set bot_clics=bot_clics+1 where id=$1", [id])
      else {
        await q("insert into em_clics(envio_id, campania_id, url) select id, campania_id, $2 from em_envios where id=$1", [id, destino.slice(0, 600)])
        await q("update em_envios set clics=clics+1, clic_en=coalesce(clic_en, now()), abierto_en=coalesce(abierto_en, now()) where id=$1", [id])
        const r = await one<{ n: number }>("select count(distinct url)::int n from em_clics where envio_id=$1 and creado > now() - interval '2 minutes'", [id])
        if ((r?.n ?? 0) >= 3) await marcarBot(id)
      }
    } catch {}
  }
  return NextResponse.redirect(destino, 302)
}
