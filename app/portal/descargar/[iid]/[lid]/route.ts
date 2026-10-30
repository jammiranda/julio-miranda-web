import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
import { clienteActual } from "@/lib/portal"
import { materialDe } from "@/lib/cursos"
import { esCifrado, abrirCifrado, tipoArchivo, extension } from "@/lib/archivo-cifrado"

export const dynamic = "force-dynamic"

/** Descarga de materiales: solo para inscriptos con la cuenta al día. Registra cada descarga (fidelización). */
export async function GET(req: NextRequest, { params }: { params: { iid: string; lid: string } }) {
  const c = await clienteActual()
  if (!c) return NextResponse.redirect(new URL(`/portal/entrar?a=/portal/cursos/${Number(params.iid)}`, req.url))
  if (c.acceso !== "ok") return NextResponse.redirect(new URL("/portal/suspendido", req.url))
  const l = await materialDe(c.id, Number(params.iid), Number(params.lid))
  if (!l || !(/^https?:\/\//.test(l.archivo_url) || esCifrado(l.archivo_url))) return NextResponse.redirect(new URL(`/portal/cursos/${Number(params.iid)}`, req.url))
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'descarga',$3)", [c.id, Number(params.iid), params.lid]).catch(() => {})
  // Material cifrado en el repositorio (por ejemplo, la plantilla del curso del panel): se descifra y se entrega solo a inscriptos.
  if (esCifrado(l.archivo_url)) {
    const datos = await abrirCifrado(l.archivo_url)
    if (!datos) return NextResponse.redirect(new URL(`/portal/cursos/${Number(params.iid)}`, req.url))
    const nombre = l.archivo_url.replace(/^enc:.*\//, "").replace(/\.(zip|pdf)?\.enc$/, "")
    return new NextResponse(datos, { headers: { "Content-Type": tipoArchivo(l.archivo_url), "Content-Disposition": `attachment; filename="${nombre}.${extension(l.archivo_url)}"`, "Cache-Control": "private, no-store" } })
  }
  return NextResponse.redirect(l.archivo_url)
}
