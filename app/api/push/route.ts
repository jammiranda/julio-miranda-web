import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { q } from "@/lib/db"
import { clavePublica, notificar } from "@/lib/push"

export const dynamic = "force-dynamic"

export async function GET() {
  const u = await usuarioActual()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  return NextResponse.json({ clave: await clavePublica() })
}

export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const b = await req.json()
  if (b.prueba) { await notificar([u.rol], "Notificaciones activadas ✅", "Así te van a llegar los avisos del sistema.", "/"); return NextResponse.json({ ok: true }) }
  const s = b.sub
  if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
  await q("insert into push_subs(usuario_id,endpoint,p256dh,auth) values ($1,$2,$3,$4) on conflict (endpoint) do update set usuario_id=excluded.usuario_id, p256dh=excluded.p256dh, auth=excluded.auth", [u.id, s.endpoint, s.keys.p256dh, s.keys.auth])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const u = await usuarioActual()
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (b.endpoint) await q("delete from push_subs where endpoint=$1 and usuario_id=$2", [b.endpoint, u.id])
  return NextResponse.json({ ok: true })
}
