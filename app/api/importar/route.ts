import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { usuarioActual } from "@/lib/auth"
import { importarMes, desdePlanilla } from "@/lib/importar"

export const dynamic = "force-dynamic"

function claveOk(k: string | null) {
  const env = process.env.IMPORT_KEY
  if (!env || !k || env.length !== k.length) return false
  return timingSafeEqual(Buffer.from(env), Buffer.from(k))
}

/** Recibe { periodo, filas } o { periodo, valores } (la solapa cruda). Lo usa la pantalla Importar y el botón de la planilla de Drive. */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  const porClave = claveOk(req.headers.get("x-import-key"))
  if (!porClave && (!u || !["gerente", "coordinacion"].includes(u.rol))) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  try {
    const b = await req.json()
    const filas = Array.isArray(b.filas) ? b.filas : desdePlanilla(b.valores ?? [])
    const r = await importarMes(String(b.periodo), filas, porClave ? String(b.origen ?? "Planilla de Drive") : "Archivo subido", u ?? { id: 0, usuario: "planilla-drive" })
    return NextResponse.json({ ok: true, ...r })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
