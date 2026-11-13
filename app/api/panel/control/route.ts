import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { avisarCorte, cortes, diaValido, guardarCorte, limpiarIndicadores, MAX_INFO, MAX_PDF_B64 } from "@/lib/control"

export const dynamic = "force-dynamic"
export const maxDuration = 30

// Tareas programadas: la misma clave del informe diario (o el token del panel)
const autorizado = (k: string | null) => claveOk(k, "INFORME_INGESTA_KEY") || claveOk(k, "PANEL_TOKEN")
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/**
 * POST: la tarea del último día hábil del mes (o un avance) manda el corte.
 * { dia: "YYYY-MM-DD", numero, titulo, periodo, semaforo, resumen, indicadores: [{ k, v, meta? }], infografia_html?, pdf_base64?, pdf_nombre?, avisar?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  if (!diaValido(b.dia)) return NextResponse.json({ ok: false, error: "dia inválido (YYYY-MM-DD)" }, { status: 400 })
  const pdf = typeof b.pdf_base64 === "string" ? b.pdf_base64.replace(/\s+/g, "") : ""
  if (pdf && (pdf.length > MAX_PDF_B64 || !/^[A-Za-z0-9+/]+=*$/.test(pdf) || !pdf.startsWith("JVBERi"))) return NextResponse.json({ ok: false, error: "pdf_base64 inválido o demasiado grande" }, { status: 400 })
  const info = typeof b.infografia_html === "string" ? b.infografia_html : ""
  if (info.length > MAX_INFO) return NextResponse.json({ ok: false, error: "infografia_html demasiado grande" }, { status: 400 })
  if (!pdf && !info && !txt(b.resumen, 10)) return NextResponse.json({ ok: false, error: "falta contenido (pdf_base64, infografia_html o resumen)" }, { status: 400 })
  const c = {
    dia: b.dia as string, numero: Number.isInteger(b.numero) && b.numero >= 0 && b.numero < 1000 ? b.numero : 0,
    titulo: txt(b.titulo, 120), periodo: txt(b.periodo, 120), semaforo: String(b.semaforo ?? "amarillo"), resumen: txt(b.resumen, 2000),
    indicadores: limpiarIndicadores(b.indicadores), infografia: info, pdf_b64: pdf,
    pdf_nombre: (txt(b.pdf_nombre, 100).replace(/[^A-Za-z0-9._-]/g, "") || `Control-Ecosistema-JM-${b.dia}.pdf`),
  }
  await guardarCorte(c)
  const tg = b.avisar === false ? null : await avisarCorte(c)
  return NextResponse.json({ ok: true, dia: c.dia, numero: c.numero, pdf: !!pdf, infografia: !!info, indicadores: c.indicadores.length, telegram: tg ? { enviados: tg.enviados, error: tg.error ?? null } : null })
}

/** GET: lista de cortes guardados (sin los archivos), para que la tarea sepa qué número sigue. */
export async function GET(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  return NextResponse.json({ ok: true, cortes: await cortes() })
}
