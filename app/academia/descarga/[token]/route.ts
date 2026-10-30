import { NextResponse } from "next/server"
import { one } from "@/lib/db"
import { esCifrado, abrirCifrado, tipoArchivo, extension } from "@/lib/archivo-cifrado"
export const dynamic = "force-dynamic"

/**
 * Descarga de un producto pagado. archivo_url puede ser un link o "enc:private/archivo.enc":
 * un archivo cifrado (AES-256-GCM) que vive en el repositorio público pero solo se puede abrir
 * con la clave ACADEMIA_ARCHIVOS_KEY cargada en Vercel.
 */
export async function GET(_r: Request, { params }: { params: { token: string } }) {
  const o = await one<any>("select o.estado, p.archivo_url, p.slug from am_ordenes o join am_productos p on p.id=o.producto_id where o.token=$1", [params.token])
  if (!o || o.estado !== "pagada" || !o.archivo_url) return new NextResponse("Descarga no disponible. Escribinos a info@devisebit.com.", { status: 404 })
  if (esCifrado(o.archivo_url)) {
    const datos = await abrirCifrado(String(o.archivo_url))
    if (!datos) return new NextResponse("Descarga no disponible por el momento. Escribinos a info@devisebit.com y te la mandamos.", { status: 503 })
    return new NextResponse(datos, { headers: { "Content-Type": tipoArchivo(o.archivo_url), "Content-Disposition": `attachment; filename="${o.slug}-devisebit.${extension(o.archivo_url)}"`, "Cache-Control": "private, no-store" } })
  }
  return NextResponse.redirect(o.archivo_url, 302)
}
