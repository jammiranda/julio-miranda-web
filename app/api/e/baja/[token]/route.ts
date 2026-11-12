import { NextResponse, type NextRequest } from "next/server"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"

/**
 * Baja en un clic (RFC 8058): Gmail, Yahoo y Outlook hacen un POST a la URL del encabezado List-Unsubscribe
 * cuando la persona toca «Cancelar suscripción». La página /baja/<token> no recibe POST, por eso existe esta ruta.
 * Hace lo mismo que el botón «Darme de baja» de esa página.
 */
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const tok = String(params.token ?? "")
  if (tok.length < 16 || tok.length > 80) return NextResponse.json({ ok: false }, { status: 404 })
  const r = await q<{ id: number }>("update db_contactos set email_estado='baja', baja_en=coalesce(baja_en, now()) where email_token=$1 returning id", [tok])
  if (!r.length) return NextResponse.json({ ok: false }, { status: 404 })
  await q("update em_envios set baja=true where contacto_id=$1 and estado='enviado'", [r[0].id]).catch(() => {})
  await q("insert into em_log(tipo,email) values ('baja_un_clic',(select email from db_contactos where id=$1))", [r[0].id]).catch(() => {})
  return NextResponse.json({ ok: true })
}

/** Si alguien abre la dirección en el navegador, va a la página de baja de siempre (que pide confirmar). */
export function GET(req: NextRequest, { params }: { params: { token: string } }) {
  return NextResponse.redirect(new URL(`/baja/${encodeURIComponent(params.token)}`, req.url), 302)
}
