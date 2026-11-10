import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit, q } from "@/lib/db"
import { BANDAS, CONFIANZAS, TIPOS_EMAIL } from "@/lib/base-tigre"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const celda = (v: unknown) => { const t = String(v ?? ""); return /[",\n\r;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }

/** Exporta un segmento de la Base Tigre en CSV (banda, tipo de email y confianza opcionales). Solo Dirección; queda en Auditoría. */
export async function GET(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || u.rol !== "gerente") return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  const p = req.nextUrl.searchParams
  const cond = ["estado='activo'"], args: unknown[] = []
  const banda = p.get("banda"), tipo = p.get("tipo"), conf = p.get("confianza")
  if (banda) { if (!(BANDAS as readonly string[]).includes(banda)) return NextResponse.json({ ok: false, error: "Banda inválida" }, { status: 400 }); args.push(banda); cond.push(`banda=$${args.length}`) }
  if (tipo) { if (!(TIPOS_EMAIL as readonly string[]).includes(tipo)) return NextResponse.json({ ok: false, error: "Tipo inválido" }, { status: 400 }); args.push(tipo); cond.push(`tipo_email=$${args.length}`) }
  if (conf) { if (!(CONFIANZAS as readonly string[]).includes(conf)) return NextResponse.json({ ok: false, error: "Confianza inválida" }, { status: 400 }); args.push(conf); cond.push(`confianza=$${args.length}`) }
  const filas = await q<any>(`select email,nombre,apellido,banda,edad_aprox,confianza,tipo_email from base_tigre where ${cond.join(" and ")} order by id`, args)
  const csv = "﻿" + ["email,nombre,apellido,banda,edad_aprox,confianza,tipo_email", ...filas.map((r) => [r.email, r.nombre, r.apellido, r.banda, r.edad_aprox, r.confianza, r.tipo_email].map(celda).join(","))].join("\r\n")
  await audit(u, "exporta_base_tigre", "base_tigre", undefined, `${filas.length} filas · ${[banda, tipo, conf].filter(Boolean).join(" / ") || "todo"}`)
  const nombre = ["base-tigre", banda, tipo, conf].filter(Boolean).join("-").replace(/[^a-z0-9+\-]/gi, "_")
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}.csv"` } })
}
