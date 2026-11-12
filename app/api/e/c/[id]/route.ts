import { NextResponse, type NextRequest } from "next/server"
import { q, one } from "@/lib/db"
import { marcarBot } from "@/lib/depuracion"
import { firmaLinkOk } from "@/lib/email"
import { emailConEstilo } from "@/lib/email-estilos"
import { secret } from "@/lib/auth"
export const dynamic = "force-dynamic"

const INICIO = "https://www.devisebit.com"
const propio = (h: string) => h === "devisebit.com" || h.endsWith(".devisebit.com")

/**
 * A dónde se puede redirigir. Los links nuevos llevan la firma del destino (/c/<envío>-<firma>).
 * Los correos ya enviados no la tienen: para esos solo se acepta un destino https de devisebit.com
 * o un sitio que figure en el contenido de esa misma campaña. Cualquier otro va al inicio del sitio.
 */
async function destinoSeguro(id: number, firma: string, u: string) {
  let x: URL
  try { x = new URL(u) } catch { return INICIO }
  if (x.protocol !== "https:" && x.protocol !== "http:") return INICIO
  const host = x.hostname.toLowerCase()
  if (x.protocol === "https:" && propio(host)) return u
  if (!id) return INICIO
  try {
    if (firma && firmaLinkOk(id, u, firma, await secret())) return u
  } catch {}
  try {
    const k = await one<{ contenido: string; estilo: string | null; portada: string | null; preheader: string | null }>(
      "select k.contenido, k.estilo, k.portada, k.preheader from em_envios e join em_campanias k on k.id=e.campania_id where e.id=$1", [id])
    if (!k) return INICIO
    // El correo tal como salió (con el pie y las redes de la plantilla) y los sitios a los que enlaza
    const html = emailConEstilo(k.contenido, { estilo: k.estilo, portada: k.portada, preheader: k.preheader, baja: null, nombre: null })
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      try { if (new URL(m[1].replace(/&amp;/g, "&")).hostname.toLowerCase() === host) return u } catch {}
    }
  } catch {}
  return INICIO
}

/**
 * Clic medido (por envío y por link) y redirección al destino.
 * Los filtros antivirus de bancos, gobierno y empresas abren todos los links apenas llega el correo:
 * si un envío toca 3 links distintos o más en 2 minutos, es un robot y no se cuenta como persona.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = req.nextUrl.searchParams.get("u") ?? ""
  const [idTxt, firma = ""] = String(params.id).split("-")
  const id = /^\d{1,15}$/.test(idTxt) ? Number(idTxt) : 0
  const destino = await destinoSeguro(id, firma, u)
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
