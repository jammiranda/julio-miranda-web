import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
import { clienteActual } from "@/lib/portal"
import { materialDe } from "@/lib/cursos"

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
  if (!l || !/^https?:\/\//.test(l.archivo_url)) return NextResponse.redirect(ir(`/mi-cuenta/cursos/${iid}`))
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'descarga',$3)", [c.id, iid, params.lid]).catch(() => {})
  return NextResponse.redirect(l.archivo_url)
}
