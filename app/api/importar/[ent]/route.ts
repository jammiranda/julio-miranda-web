import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { COLUMNAS, importar, plantilla } from "@/lib/importar"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function permiso(ent: string) {
  if (!COLUMNAS[ent]) return { u: null, err: NextResponse.json({ ok: false, error: "Módulo inexistente" }, { status: 404 }) }
  const u = await usuarioActual()
  if (!u || !["gerente", "coordinacion"].includes(u.rol)) return { u: null, err: NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 }) }
  return { u, err: null }
}

export async function GET(_req: NextRequest, { params }: { params: { ent: string } }) {
  const { err } = await permiso(params.ent)
  if (err) return err
  return new NextResponse(plantilla(params.ent), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="plantilla-${params.ent}.csv"` } })
}

export async function POST(req: NextRequest, { params }: { params: { ent: string } }) {
  const { u, err } = await permiso(params.ent)
  if (err) return err
  try {
    const b = await req.json()
    const r = await importar(params.ent, Array.isArray(b.filas) ? b.filas : [], b.soloExistentes === true)
    await audit(u, "importar", params.ent, undefined, `${r.creados} nuevos, ${r.actualizados} actualizados, ${r.omitidos} omitidos`)
    return NextResponse.json({ ok: true, ...r })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
