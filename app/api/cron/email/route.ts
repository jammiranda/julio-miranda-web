import { NextResponse, type NextRequest } from "next/server"
import { procesarCola } from "@/lib/email"
import { recordatoriosDelDia } from "@/lib/agenda"
import { asegurarPerfil } from "@/lib/waperfil"
import { generarAbonos } from "@/lib/cobros"
import { recordatoriosCobro } from "@/lib/pagos"
import { recordatoriosClases } from "@/lib/cursos"
import { revisionSemanal } from "@/lib/revision"
import { sincronizarMeta } from "@/lib/ads"
import { sincronizarDrive } from "@/lib/integraciones"
import { registrarSeguidores } from "@/lib/instagram"
import { lanzarRelanzamientoSiCorresponde } from "@/lib/campania-relanzamiento"
import { depurarBase } from "@/lib/depuracion"
import { seguimientoDiagnosticos } from "@/lib/diagnosticos"
import { reenganchar, reengancharSiToca } from "@/lib/reenganche"
import { claveOk } from "@/lib/clave"
import { one } from "@/lib/db"
export const dynamic = "force-dynamic"
export const maxDuration = 300
/** Lo llama Vercel Cron a las 8 de Argentina: recordatorios de reuniones, abonos del mes, avisos de pago, recordatorios de clases, perfil de WhatsApp, los seguidores de Instagram del día, la tanda diaria de campañas, el recordatorio de los autodiagnósticos (a los 3 días, si no siguió con el nivel siguiente) y, los viernes, la revisión semanal del bot. */
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    // Con CRON_SECRET cargado en Vercel, solo entra quien lo trae (Vercel Cron lo manda solo)
    const a = req.headers.get("authorization") ?? ""
    if (!a.startsWith("Bearer ") || !claveOk(a.slice(7), "CRON_SECRET")) return NextResponse.json({ ok: false }, { status: 401 })
  } else {
    // Sin CRON_SECRET la URL es pública: el trabajo completo corre como mucho una vez cada 20 horas y solo en la franja
    // en la que lo llama Vercel Cron (11 a 13 UTC). El candado es atómico en la base, así que llamarla de más no repite nada.
    const h = new Date().getUTCHours()
    const toca = h >= 11 && h < 13 ? await one(
      `insert into config(clave,valor) values ('cron_diario_ultimo', now()::text)
       on conflict (clave) do update set valor=excluded.valor
         where config.valor::timestamptz < now() - interval '20 hours'
       returning 1`,
    ).catch((e) => { console.error("cron: candado", e); return null }) : null
    if (!toca) {
      // El seguimiento a quienes no contestaron tiene su propio candado (cada 10 minutos)
      await reengancharSiToca()
      return NextResponse.json({ ok: true, omitido: true })
    }
  }
  const recordatorios = await recordatoriosDelDia().catch((e) => String(e))
  const wa = await asegurarPerfil().catch((e) => String(e))
  const abonos = await generarAbonos().catch((e) => String(e))
  const cobros = await recordatoriosCobro().catch((e) => String(e))
  const clases = await recordatoriosClases().catch((e) => String(e))
  const revision = await revisionSemanal().catch((e) => String(e))
  const anuncios = await sincronizarMeta().catch((e) => String(e))
  const drive = await sincronizarDrive("cron").then((r) => r.mensaje).catch((e) => String(e))
  const instagram = await registrarSeguidores().catch((e) => String(e))
  const depuracion = await depurarBase().catch((e) => String(e))
  const diagnosticos = await seguimientoDiagnosticos().catch((e) => String(e))
  const relanzamiento = await lanzarRelanzamientoSiCorresponde().catch((e) => String(e))
  const reenganche = await reenganchar().catch((e) => String(e))
  const r = await procesarCola()
  return NextResponse.json({ ok: true, ...r, recordatorios, wa, abonos, cobros, clases, revision, anuncios, drive, instagram, relanzamiento, depuracion, diagnosticos, reenganche })
}
