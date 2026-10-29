import { NextResponse, type NextRequest } from "next/server"
import { one, q } from "@/lib/db"
import { archivo, vigente } from "@/lib/biblioteca"

export const dynamic = "force-dynamic"

/** Archivo de un link personal: siempre la versión vigente del documento. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const e = await one<{ id: number; doc_id: number; expira: Date; revocado: boolean }>("select id, doc_id, expira, revocado from bib_envios where token=$1", [params.token])
  if (!e || e.revocado || new Date(e.expira) < new Date()) return NextResponse.redirect(new URL(`/doc/${encodeURIComponent(params.token)}`, req.url))
  const v = await vigente(e.doc_id)
  const buf = v ? await archivo(v.id) : null
  if (!v || !buf) return new NextResponse("El documento se está actualizando. Probá en unos minutos.", { status: 404 })
  const descargar = !!req.nextUrl.searchParams.get("descargar")
  if (descargar) await q("update bib_envios set descargas=descargas+1, ultima=now() where id=$1", [e.id])
  return new NextResponse(new Uint8Array(buf), { headers: {
    "content-type": v.mime, "content-disposition": `${descargar ? "attachment" : "inline"}; filename="${encodeURIComponent(v.nombre)}"`,
    "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow",
  } })
}
