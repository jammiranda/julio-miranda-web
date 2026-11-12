import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { avisarTelegram, diaValido, edicionesDe, guardarEdicion, hoyAR, limpiarSecciones, notaDe, tildesDe } from "@/lib/informe"

export const dynamic = "force-dynamic"

// Tareas programadas: INFORME_INGESTA_KEY (propia) o las claves de ingesta del panel que ya existen
const autorizado = (k: string | null) => claveOk(k, "INFORME_INGESTA_KEY") || claveOk(k, "REDES_INGESTA_KEY") || claveOk(k, "PANEL_TOKEN")

/**
 * POST: la tarea de las 8:27 o la de las 18:57 manda su edición.
 * { edicion: "manana"|"cierre", dia?: "YYYY-MM-DD", semaforo, resumen, secciones: [{ id, titulo, tipo?: "decisiones", items: [{ t, d?, nivel?, url?, hora? }] }], avisar?: boolean }
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => ({}))
  if (b.edicion !== "manana" && b.edicion !== "cierre") return NextResponse.json({ ok: false, error: "edicion debe ser manana o cierre" }, { status: 400 })
  const dia = b.dia === undefined ? hoyAR() : b.dia
  if (!diaValido(dia)) return NextResponse.json({ ok: false, error: "dia inválido (YYYY-MM-DD)" }, { status: 400 })
  const secciones = limpiarSecciones(b.secciones)
  if (!secciones.length) return NextResponse.json({ ok: false, error: "secciones vacías" }, { status: 400 })
  const e = { dia, edicion: b.edicion as "manana" | "cierre", semaforo: String(b.semaforo ?? "verde"), resumen: String(b.resumen ?? ""), secciones }
  await guardarEdicion(e)
  const tg = b.avisar === false ? null : await avisarTelegram(e)
  return NextResponse.json({ ok: true, dia, edicion: e.edicion, secciones: secciones.length, telegram: tg ? { enviados: tg.enviados, error: tg.error ?? null } : null })
}

/** GET ?dia=YYYY-MM-DD: lo que dejó Julio (decisiones tildadas y nota) y las ediciones guardadas, para que los agentes lo lean al día siguiente. */
export async function GET(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const d = req.nextUrl.searchParams.get("dia") ?? hoyAR()
  if (!diaValido(d)) return NextResponse.json({ ok: false, error: "dia inválido" }, { status: 400 })
  const [ediciones, tildes, nota] = await Promise.all([edicionesDe(d), tildesDe(d), notaDe(d)])
  return NextResponse.json({ ok: true, dia: d, ediciones, tildes, nota: nota?.texto ?? "" })
}
