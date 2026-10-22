import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { ENTIDADES, exportarCSV, importar, type Entidad } from "@/lib/datos"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function permiso(ent: string) {
  const u = await usuarioActual()
  if (!(ent in ENTIDADES)) return { u: null, err: NextResponse.json({ ok: false, error: "Módulo inexistente" }, { status: 404 }) }
  if (!u || !ENTIDADES[ent as Entidad].roles.includes(u.rol)) return { u: null, err: NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 }) }
  return { u, err: null }
}

export async function GET(req: NextRequest, { params }: { params: { ent: string } }) {
  const { u, err } = await permiso(params.ent)
  if (err) return err
  const ent = params.ent as Entidad
  const hoy = new Date().toISOString().slice(0, 10)
  if (req.nextUrl.searchParams.get("plantilla")) {
    const csv = "﻿" + ENTIDADES[ent].cols.map((c) => c.n).join(";") + "\r\n"
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="plantilla-${ent}.csv"` } })
  }
  await audit(u, "exportar", ent)
  return new NextResponse(await exportarCSV(ent), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="sanpatricio-${ent}-${hoy}.csv"` } })
}

export async function POST(req: NextRequest, { params }: { params: { ent: string } }) {
  const { u, err } = await permiso(params.ent)
  if (err) return err
  const ent = params.ent as Entidad
  if (!ENTIDADES[ent].importa) return NextResponse.json({ ok: false, error: "Este módulo no se importa" }, { status: 400 })
  try {
    const b = await req.json()
    const r = await importar(ent, Array.isArray(b.filas) ? b.filas : [])
    await audit(u, "importar", ent, undefined, `${r.creados} nuevos, ${r.actualizados} actualizados, ${r.omitidos} omitidos`)
    return NextResponse.json({ ok: true, ...r })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
