import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { guardarCampania, anotar, seguimientos } from "@/lib/ads-seguimiento"
import { ROLES_PANEL } from "@/app/panel-contenido/_ui"

export const dynamic = "force-dynamic"

/**
 * Seguimiento de campañas pagas (Panel → Anuncios). Solo con sesión de Dirección o Comercial.
 * POST { accion: "campania", campania: {...} }                         → crea o actualiza la ficha
 * POST { accion: "control", campania_id, texto, datos: { gasto, impresiones, alcance, resultados, frecuencia, por_anuncio } }
 * POST { accion: "decision" | "nota", campania_id, texto }               → suma a la bitácora
 * GET                                                                    → fichas con indicadores
 */
async function quien() {
  const u = await usuarioActual()
  return u && ROLES_PANEL.includes(u.rol) ? u : null
}

export async function GET() {
  if (!(await quien())) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  return NextResponse.json({ ok: true, campanias: await seguimientos() })
}

export async function POST(req: NextRequest) {
  const u = await quien()
  if (!u) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  try {
    if (b.accion === "campania" && b.campania?.campania_id && b.campania?.nombre) {
      await guardarCampania(b.campania)
      await audit(u, "ads_seguimiento_campania", "ads_seguimiento", String(b.campania.campania_id))
      return NextResponse.json({ ok: true })
    }
    if (["control", "decision", "nota"].includes(b.accion) && b.campania_id && typeof b.texto === "string" && b.texto.trim()) {
      const n = (v: unknown) => (v == null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v))
      const d = b.datos ?? {}
      const datos = b.accion === "control" ? {
        gasto: n(d.gasto), impresiones: n(d.impresiones), alcance: n(d.alcance), resultados: n(d.resultados), clics: n(d.clics), frecuencia: n(d.frecuencia),
        por_anuncio: Array.isArray(d.por_anuncio) ? d.por_anuncio.slice(0, 10).map((a: any) => ({ nombre: String(a.nombre ?? "").slice(0, 120), gasto: n(a.gasto), resultados: n(a.resultados), impresiones: n(a.impresiones) })) : undefined,
      } : undefined
      const e = await anotar(String(b.campania_id), { tipo: b.accion, texto: b.texto.trim(), por: b.por ? `${String(b.por).slice(0, 30)} · ${u.nombre}` : u.nombre, datos })
      await audit(u, `ads_seguimiento_${b.accion}`, "ads_seguimiento", String(b.campania_id))
      return NextResponse.json({ ok: true, entrada: e })
    }
    return NextResponse.json({ ok: false, error: "faltan datos" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e).slice(0, 200) }, { status: 400 })
  }
}
