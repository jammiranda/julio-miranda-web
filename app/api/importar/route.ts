import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { usuarioActual } from "@/lib/auth"
import { importarMes, desdePlanilla } from "@/lib/importar"
import { emailGoogleAutorizado } from "@/lib/google"

export const dynamic = "force-dynamic"


/** Recibe { periodo, filas } o { periodo, valores } (la solapa cruda). Lo usa la pantalla Importar y el botón de la planilla de Drive. */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  const gmail = u ? null : await emailGoogleAutorizado(req.headers.get("x-google-id-token"))
  const porClave = claveOk(req.headers.get("x-import-key")) || !!gmail
  if (!porClave && (!u || !["gerente", "coordinacion"].includes(u.rol))) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  try {
    const b = await req.json()
    const filas = Array.isArray(b.filas) ? b.filas : desdePlanilla(b.valores ?? [])
    const r = await importarMes(String(b.periodo), filas, porClave ? String(b.origen ?? "Planilla de Drive") : "Archivo subido", u ?? { id: 0, usuario: gmail ? `drive:${gmail}` : "planilla-drive" })
    return NextResponse.json({ ok: true, ...r })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
