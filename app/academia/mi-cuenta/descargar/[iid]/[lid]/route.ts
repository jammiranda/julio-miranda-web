import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
import { clienteActual } from "@/lib/portal"
import { materialDe } from "@/lib/cursos"
import { esCifrado, abrirCifrado, tipoArchivo, extension } from "@/lib/archivo-cifrado"

export const dynamic = "force-dynamic"

/** Descarga de materiales desde el aula de la Academia (misma regla que el portal: inscripto y con la cuenta al día). */
export async function GET(req: NextRequest, { params }: { params: { iid: string; lid: string } }) {
  const iid = Number(params.iid)
  // URLs relativas al dominio público (req.url trae la ruta interna /academia/… después de la reescritura)
  const ir = (p: string) => new URL(p, `${req.nextUrl.protocol}//${req.headers.get("host") ?? req.nextUrl.host}`)
  const c = await clienteActual()
  if (!c) return NextResponse.redirect(ir(`/mi-cuenta/entrar?a=/mi-cuenta/cursos/${iid}`))
  if (c.acceso !== "ok") return NextResponse.redirect(ir(`/mi-cuenta/cursos/${iid}`))
  const l = await materialDe(c.id, iid, Number(params.lid))
  if (!l || !(/^https?:\/\//.test(l.archivo_url) || esCifrado(l.archivo_url))) return NextResponse.redirect(ir(`/mi-cuenta/cursos/${iid}`))
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'descarga',$3)", [c.id, iid, params.lid]).catch(() => {})
  // Material cifrado en el repositorio (por ejemplo, la plantilla del curso del panel): se descifra y se entrega solo a inscriptos.
  if (esCifrado(l.archivo_url)) {
    const datos = await abrirCifrado(l.archivo_url)
    if (!datos) return NextResponse.redirect(ir(`/mi-cuenta/cursos/${iid}`))
    const nombre = l.archivo_url.replace(/^enc:.*\//, "").replace(/\.(zip|pdf)?\.enc$/, "")
    return new NextResponse(datos, { headers: { "Content-Type": tipoArchivo(l.archivo_url), "Content-Disposition": `attachment; filename="${nombre}.${extension(l.archivo_url)}"`, "Cache-Control": "private, no-store" } })
  }
  return NextResponse.redirect(l.archivo_url)
}
