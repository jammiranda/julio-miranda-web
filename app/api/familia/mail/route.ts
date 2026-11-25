import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { proveedores, enviarCon } from "@/lib/email"
export const dynamic = "force-dynamic"

/**
 * Mails transaccionales de la familia Mate (MateCuentas, MateBot, MateTurnos, MateEventos):
 * códigos de ingreso y de recuperación. Las apps no tienen las claves de los proveedores de mail;
 * le piden a este sistema que mande, con la clave interna FAMILIA_MAIL_KEY.
 * Prueba los proveedores configurados en orden hasta que uno lo acepte.
 */
const APPS: Record<string, string> = { matecuentas: "MateCuentas", matebot: "MateBot", mateturnos: "MateTurnos", mateeventos: "MateEventos" }

function autorizado(req: NextRequest) {
  const k = process.env.FAMILIA_MAIL_KEY || ""
  const h = req.headers.get("x-familia-key") || ""
  return !!k && h.length === k.length && timingSafeEqual(Buffer.from(h), Buffer.from(k))
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160)
  const app = APPS[String(b.app || "")]
  const asunto = String(b.asunto || "").slice(0, 140)
  const html = String(b.html || "").slice(0, 60000)
  if (!app || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !asunto || !html) return NextResponse.json({ error: "datos" }, { status: 400 })
  const errores: string[] = []
  for (const p of proveedores()) {
    const r = await enviarCon(p.id, { email, name: b.nombre || null }, asunto, html, null)
    if (r.ok) return NextResponse.json({ ok: true, proveedor: p.id })
    errores.push(`${p.id}: ${r.error}`)
  }
  console.error("familia/mail", errores)
  return NextResponse.json({ error: "sin proveedor", detalle: errores.length }, { status: 502 })
}
