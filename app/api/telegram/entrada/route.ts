import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { gcalConfig } from "@/lib/agenda"
import { enviarTelegram, primeraVez } from "@/lib/telegram"

export const dynamic = "force-dynamic"

/**
 * Avisos que llegan de afuera del sistema (hoy: los correos nuevos que detecta el conector de Google).
 * Header x-token = la clave del conector de Google (la misma que ya trae el código de Apps Script).
 * Cuerpo: { titulo, cuerpo?, url?, id? } · con `id` el mismo aviso no se repite en 24 h.
 */
export async function POST(req: NextRequest) {
  const k = req.headers.get("x-token") ?? ""
  const { token } = await gcalConfig()
  if (!k || !token || k.length !== token.length || !timingSafeEqual(Buffer.from(k), Buffer.from(token))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => ({}))
  const titulo = String(b?.titulo ?? "").trim().slice(0, 200)
  if (!titulo) return NextResponse.json({ ok: false, error: "falta titulo" }, { status: 400 })
  if (b?.id && !(await primeraVez("ext:" + String(b.id), 1440))) return NextResponse.json({ ok: true, repetido: true })
  const url = typeof b?.url === "string" && /^https:\/\//.test(b.url) ? b.url : undefined
  const r = await enviarTelegram({ titulo, cuerpo: String(b?.cuerpo ?? "").slice(0, 900), url })
  return NextResponse.json({ ok: r.ok, enviados: r.enviados, error: r.error }, { status: r.ok ? 200 : 202 })
}
