import { NextResponse } from "next/server"
import { one } from "@/lib/db"
import { readFile } from "fs/promises"
import path from "path"
import { createDecipheriv } from "crypto"
export const dynamic = "force-dynamic"

/**
 * Descarga de un producto pagado. archivo_url puede ser un link o "enc:private/archivo.enc":
 * un archivo cifrado (AES-256-GCM) que vive en el repositorio público pero solo se puede abrir
 * con la clave ACADEMIA_ARCHIVOS_KEY cargada en Vercel.
 */
export async function GET(_r: Request, { params }: { params: { token: string } }) {
  const o = await one<any>("select o.estado, p.archivo_url, p.slug from am_ordenes o join am_productos p on p.id=o.producto_id where o.token=$1", [params.token])
  if (!o || o.estado !== "pagada" || !o.archivo_url) return new NextResponse("Descarga no disponible. Escribinos a info@devisebit.com.", { status: 404 })
  if (String(o.archivo_url).startsWith("enc:")) {
    const clave = process.env.ACADEMIA_ARCHIVOS_KEY
    try {
      if (!clave) throw new Error("sin clave")
      const buf = await readFile(path.join(process.cwd(), String(o.archivo_url).slice(4)))
      const d = createDecipheriv("aes-256-gcm", Buffer.from(clave, "base64"), buf.subarray(0, 12))
      d.setAuthTag(buf.subarray(12, 28))
      const pdf = Buffer.concat([d.update(buf.subarray(28)), d.final()])
      const zip = String(o.archivo_url).endsWith(".zip.enc")
      return new NextResponse(pdf, { headers: { "Content-Type": zip ? "application/zip" : "application/pdf", "Content-Disposition": `attachment; filename="${o.slug}-devisebit.${zip ? "zip" : "pdf"}"`, "Cache-Control": "private, no-store" } })
    } catch {
      return new NextResponse("Descarga no disponible por el momento. Escribinos a info@devisebit.com y te la mandamos.", { status: 503 })
    }
  }
  return NextResponse.redirect(o.archivo_url, 302)
}
