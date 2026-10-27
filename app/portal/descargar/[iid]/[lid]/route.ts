import { NextResponse, type NextRequest } from "next/server"
import { q, one } from "@/lib/db"
import { clienteActual } from "@/lib/portal"

export const dynamic = "force-dynamic"

/** Descarga de materiales: solo para inscriptos con la cuenta al día. Registra cada descarga (fidelización). */
export async function GET(req: NextRequest, { params }: { params: { iid: string; lid: string } }) {
  const c = await clienteActual()
  if (!c) return NextResponse.redirect(new URL("/portal/entrar", req.url))
  if (c.acceso !== "ok") return NextResponse.redirect(new URL("/portal/suspendido", req.url))
  const l = await one<{ archivo_url: string }>(
    `select l.archivo_url from am_lecciones l join am_ediciones e on e.curso_id=l.curso_id join am_inscripciones i on i.edicion_id=e.id
     where i.id=$1 and i.contacto_id=$2 and i.estado<>'baja' and l.id=$3 and l.publicada and l.archivo_url is not null`,
    [Number(params.iid), c.id, Number(params.lid)],
  )
  if (!l || !/^https?:\/\//.test(l.archivo_url)) return NextResponse.redirect(new URL(`/portal/cursos/${params.iid}`, req.url))
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'descarga',$3)", [c.id, Number(params.iid), params.lid]).catch(() => {})
  return NextResponse.redirect(l.archivo_url)
}
