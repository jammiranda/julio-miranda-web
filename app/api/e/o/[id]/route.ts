import { q } from "@/lib/db"
export const dynamic = "force-dynamic"
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
/** Píxel de apertura. */
export async function GET(_r: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (id) await q("update em_envios set aperturas=aperturas+1, abierto_en=coalesce(abierto_en, now()) where id=$1", [id]).catch(() => {})
  return new Response(GIF, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" } })
}
