import { NextResponse } from "next/server"
import { usuarioActual, puede } from "@/lib/auth"
import { one, audit } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const u = await usuarioActual()
  if (!u || !puede.verHC(u)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const a = await one<{ nombre: string; mime: string; datos: string; paciente_id: number }>("select nombre, mime, encode(datos,'base64') datos, paciente_id from adjuntos where id=$1", [Number(params.id)])
  if (!a) return NextResponse.json({ error: "No existe" }, { status: 404 })
  await audit(u, "ver_documento_hc", "adjunto", params.id, `paciente ${a.paciente_id}`)
  const buf = Buffer.from(a.datos.replace(/\s/g, ""), "base64")
  return new NextResponse(buf, { headers: { "Content-Type": a.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(a.nombre ?? "documento")}"`, "Cache-Control": "private, no-store" } })
}
