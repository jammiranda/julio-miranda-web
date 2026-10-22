import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { usuarioActual } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { ETAPAS } from "@/lib/devisebit"

export const dynamic = "force-dynamic"

/**
 * API del CRM de DEVISEBIT.
 *  - Con sesión de gerencia (desde el sistema), o
 *  - Con encabezado "Authorization: Bearer <DB_API_KEY>" (para la web, Zapier, Make, etc.).
 * GET  /api/devisebit/contactos|proyectos|servicios   → JSON (o ?formato=csv)
 * POST /api/devisebit/contactos  {nombre, organizacion?, email?, telefono?, origen?, notas?, sector?}  → crea un contacto
 */
const SQL: Record<string, string> = {
  contactos: "select id, nombre, organizacion, cargo, email, telefono, sector, etapa, origen, proximo, proximo_fecha, notas, creado, actualizado from db_contactos order by actualizado desc",
  proyectos: `select p.id, p.nombre, c.organizacion cliente, s.nombre servicio, p.estado, p.inicio, p.entrega, p.monto, p.responsable, p.trello_url, p.notas, p.creado
              from db_proyectos p left join db_contactos c on c.id=p.contacto_id left join db_servicios s on s.id=p.servicio_id order by p.creado desc`,
  servicios: "select id, nombre, categoria, descripcion, precio_ref, activo from db_servicios order by nombre",
}

function claveOk(req: NextRequest) {
  const k = process.env.DB_API_KEY
  const h = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (!k || k.length < 16 || !h) return false
  const a = Buffer.from(h), b = Buffer.from(k)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function permiso(req: NextRequest) {
  if (claveOk(req)) return { ok: true, u: null }
  const u = await usuarioActual()
  return { ok: u?.rol === "gerente", u }
}

const celda = (v: unknown) => {
  if (v == null) return ""
  const t = v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export async function GET(req: NextRequest, { params }: { params: { ent: string } }) {
  const sql = SQL[params.ent]
  if (!sql) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 })
  const { ok, u } = await permiso(req)
  if (!ok) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  const rows = await q<Record<string, unknown>>(sql)
  if (req.nextUrl.searchParams.get("formato") === "csv") {
    await audit(u, "exportar", `devisebit_${params.ent}`)
    const cols = rows[0] ? Object.keys(rows[0]) : []
    const csv = "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => celda(r[c])).join(";"))].join("\r\n")
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="devisebit-${params.ent}-${new Date().toISOString().slice(0, 10)}.csv"` } })
  }
  return NextResponse.json({ ok: true, [params.ent]: rows })
}

export async function POST(req: NextRequest, { params }: { params: { ent: string } }) {
  if (params.ent !== "contactos") return NextResponse.json({ ok: false, error: "Solo se pueden crear contactos" }, { status: 405 })
  const { ok, u } = await permiso(req)
  if (!ok) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const t = (k: string, max = 300) => (typeof b[k] === "string" && (b[k] as string).trim() ? (b[k] as string).trim().slice(0, max) : null)
  const nombre = t("nombre", 120)
  if (!nombre) return NextResponse.json({ ok: false, error: "Falta nombre" }, { status: 400 })
  const etapa = ETAPAS.some((e) => e.v === b.etapa) ? (b.etapa as string) : "nuevo"
  const email = t("email", 160)
  // Si ya existe por email, actualiza en vez de duplicar
  const ya = email ? await one<{ id: number }>("select id from db_contactos where lower(email)=lower($1)", [email]) : null
  if (ya) {
    await q("update db_contactos set notas=concat_ws(E'\\n', notas, $1::text), actualizado=now() where id=$2", [t("notas", 2000), ya.id])
    return NextResponse.json({ ok: true, id: ya.id, existente: true })
  }
  const r = await one<{ id: number }>(
    "insert into db_contactos(nombre,organizacion,cargo,email,telefono,sector,etapa,origen,notas) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id",
    [nombre, t("organizacion", 160), t("cargo", 120), email, t("telefono", 40), t("sector", 60), etapa, t("origen", 60) ?? "API", t("notas", 2000)],
  )
  await audit(u, "crea_contacto_db_api", "db_contacto", r!.id)
  return NextResponse.json({ ok: true, id: r!.id })
}
