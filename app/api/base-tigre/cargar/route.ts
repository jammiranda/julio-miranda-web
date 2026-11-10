import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { cargarTanda, normalizarTanda } from "@/lib/base-tigre"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Carga una tanda (hasta 2.000 filas) de la Base Tigre. Solo Dirección (rol gerente). */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || u.rol !== "gerente") return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  try {
    const b = await req.json()
    const filas: unknown[][] = Array.isArray(b.filas) ? b.filas : []
    if (filas.length > 2000) return NextResponse.json({ ok: false, error: "Máximo 2.000 filas por tanda" }, { status: 400 })
    const { ok, omitidas } = normalizarTanda(filas)
    const r = ok.length ? await cargarTanda(ok, String(b.lote ?? "carga")) : { creados: 0, actualizados: 0 }
    if (b.ultima === true) await audit(u, "carga_base_tigre", "base_tigre", String(b.lote ?? ""), `lote ${b.lote ?? ""} cargado`)
    return NextResponse.json({ ok: true, ...r, omitidas })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
