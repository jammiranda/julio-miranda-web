import { NextResponse } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Temporal: exporta lo que quedó guardado de DEVISEBIT para llevarlo a sistema.devisebit.com. */
export async function GET() {
  const u = await usuarioActual()
  if (u?.rol !== "gerente") return NextResponse.json({ ok: false }, { status: 401 })
  const [consultas, wa_chats, wa_mensajes, bot_conocimiento, db_contactos, db_proyectos, modo] = await Promise.all([
    q("select * from consultas where empresa='devisebit' order by id"),
    q("select * from wa_chats where empresa='devisebit'"),
    q("select * from wa_mensajes where empresa='devisebit' order by id"),
    q("select * from bot_conocimiento where empresa='devisebit' order by id"),
    q("select * from db_contactos order by id").catch(() => []),
    q("select p.*, s.nombre servicio from db_proyectos p left join db_servicios s on s.id=p.servicio_id order by p.id").catch(() => []),
    one<{ valor: string }>("select valor from config where clave='bot_modo_devisebit'"),
  ])
  await audit(u, "exportar_devisebit", "sistema")
  return new NextResponse(JSON.stringify({ consultas, wa_chats, wa_mensajes, bot_conocimiento, db_contactos, db_proyectos, bot_modo: modo?.valor ?? null }), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="devisebit-desde-sanpatricio.json"` },
  })
}
