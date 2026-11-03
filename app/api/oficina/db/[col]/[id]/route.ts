import { NextResponse, type NextRequest } from "next/server"
import { actualizar, decidir, esCol, obtener, soloJulio } from "@/lib/oficina"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: { col: string; id: string } }) {
  if (!(await soloJulio())) return NextResponse.json({ ok: false }, { status: 401 })
  if (!esCol(params.col)) return NextResponse.json({ ok: false }, { status: 404 })
  const b = await req.json().catch(() => null)
  if (!b || typeof b !== "object") return NextResponse.json({ ok: false }, { status: 400 })
  if (params.col === "ordenes") {
    if (b.estado === "aprobada" || b.estado === "rechazada") {
      const r = await decidir(params.id, b.estado === "aprobada")
      return NextResponse.json(r, { status: r.ok ? 200 : 409 })
    }
    if (b.ejecutar) {
      const o = await obtener("ordenes", params.id)
      if (!o || o.data.estado !== "repartida") return NextResponse.json({ ok: false }, { status: 409 })
      return NextResponse.json({ ok: await actualizar("ordenes", params.id, { ejecutar: new Date().toISOString() }) })
    }
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  if (params.col === "agentes") {
    // Julio puede renombrar y cambiar el rol de cualquiera (las personas del equipo, sobre todo)
    const patch: Record<string, string> = {}
    if (typeof b.nombre === "string" && b.nombre.trim()) patch.nombre = b.nombre.trim().slice(0, 40)
    if (typeof b.rol === "string") patch.rol = b.rol.trim().slice(0, 120)
    if (typeof b.nohace === "string") patch.nohace = b.nohace.trim().slice(0, 200)
    if (!Object.keys(patch).length || !(await obtener("agentes", params.id))) return NextResponse.json({ ok: false }, { status: 400 })
    return NextResponse.json({ ok: await actualizar("agentes", params.id, patch) })
  }
  return NextResponse.json({ ok: false }, { status: 403 })
}
