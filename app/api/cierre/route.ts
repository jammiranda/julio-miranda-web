import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual, puede } from "@/lib/auth"
import { datosMes } from "@/lib/tablero"
import { audit } from "@/lib/db"

export const dynamic = "force-dynamic"
export async function GET(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || u.rol === "consulta") return new NextResponse("No autorizado", { status: 401 })
  const p = req.nextUrl.searchParams.get("p") ?? ""
  if (!/^\d{4}-\d{2}$/.test(p)) return new NextResponse("Período inválido", { status: 400 })
  const { rows } = await datosMes(p)
  const fin = puede.verFinanzas(u)
  const head = ["Paciente", "Localidad", "Modulo", "Vence OP", "Enfermeria", "Kinesiologia", "Medico", "Otras", "Equipos", "Sin APP PAMI", ...(fin ? ["Submodulos $"] : [])]
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const lines = [head, ...rows.map((r) => [r.apellido_nombre, r.localidad, r.modulo, r.fecha_vencimiento, r.enf, r.kin, r.med, r.otras, r.equipos, r.sin_app, ...(fin ? [r.sub] : [])])]
  await audit(u, "exportar_cierre", "cierre", p)
  return new NextResponse("﻿" + lines.map((l) => l.map(esc).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cierre-${p}.csv"` },
  })
}
