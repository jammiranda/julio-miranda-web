import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { hoyAR, diaValido } from "@/lib/informe"
import { guardarAcciones, guardarMetricas, limpiarAccion, resumenInteraccion } from "@/lib/interaccion"

export const dynamic = "force-dynamic"

const autorizado = (k: string | null) => claveOk(k, "INFORME_INGESTA_KEY") || claveOk(k, "REDES_INGESTA_KEY") || claveOk(k, "PANEL_TOKEN")

/**
 * POST: la tarea "Comentarios en redes DEVISEBIT" (o cualquier agente de redes) informa lo que hizo.
 * { dia?: "YYYY-MM-DD",
 *   acciones: [{ red: "linkedin"|"instagram"|"facebook"|"tiktok"|"x", tipo: "comentario"|"presentacion"|"grupo"|"seguir"|"reaccion"|"respuesta"|"mensaje",
 *                cuenta, tamano?, texto?, url?, estado?: "publicado"|"pendiente"|"rechazado"|"borrado", n?, clave? }],
 *   metricas?: [{ red: "linkedin_julio", metrica: "seguidores"|"visualizaciones_perfil"|"impresiones"|..., valor }] }
 * Reenviar la misma acción no la duplica (se actualiza estado, texto y link). Un grupo o una cuenta seguida se identifica por su nombre.
 */
export async function POST(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => ({}))
  const dia = b.dia === undefined ? hoyAR() : b.dia
  if (!diaValido(dia)) return NextResponse.json({ ok: false, error: "dia inválido (YYYY-MM-DD)" }, { status: 400 })
  const crudas = Array.isArray(b.acciones) ? b.acciones.slice(0, 200) : []
  const acciones = crudas.map((a: any) => limpiarAccion(a, dia)).filter(Boolean) as NonNullable<ReturnType<typeof limpiarAccion>>[]
  const metricas = Array.isArray(b.metricas) ? b.metricas.slice(0, 50) : []
  if (!acciones.length && !metricas.length) return NextResponse.json({ ok: false, error: "no hay acciones ni métricas válidas" }, { status: 400 })
  await guardarAcciones(acciones)
  await guardarMetricas(dia, metricas)
  return NextResponse.json({ ok: true, dia, acciones: acciones.length, descartadas: crudas.length - acciones.length, metricas: metricas.length })
}

/** GET: el resumen acumulado (lo usan el informe diario y la propia tarea para no repetir grupos ni cuentas). */
export async function GET(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  return NextResponse.json({ ok: true, ...(await resumenInteraccion()) })
}
