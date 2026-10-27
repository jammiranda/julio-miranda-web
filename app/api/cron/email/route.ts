import { NextResponse, type NextRequest } from "next/server"
import { procesarCola } from "@/lib/email"
import { recordatoriosDelDia } from "@/lib/agenda"
import { asegurarPerfil } from "@/lib/waperfil"
import { generarAbonos } from "@/lib/cobros"
import { recordatoriosCobro } from "@/lib/pagos"
import { recordatoriosClases } from "@/lib/cursos"
export const dynamic = "force-dynamic"
export const maxDuration = 300
/** Lo llama Vercel Cron a las 8 de Argentina: recordatorios de reuniones, abonos del mes, avisos de pago, recordatorios de clases, perfil de WhatsApp y la tanda diaria de campañas. */
export async function GET(req: NextRequest) {
  const s = process.env.CRON_SECRET
  if (s && req.headers.get("authorization") !== `Bearer ${s}`) return NextResponse.json({ ok: false }, { status: 401 })
  const recordatorios = await recordatoriosDelDia().catch((e) => String(e))
  const wa = await asegurarPerfil().catch((e) => String(e))
  const abonos = await generarAbonos().catch((e) => String(e))
  const cobros = await recordatoriosCobro().catch((e) => String(e))
  const clases = await recordatoriosClases().catch((e) => String(e))
  const r = await procesarCola()
  return NextResponse.json({ ok: true, ...r, recordatorios, wa, abonos, cobros, clases })
}
