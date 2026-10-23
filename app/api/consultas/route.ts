import { NextResponse, type NextRequest } from "next/server"
import { one, audit } from "@/lib/db"
import { claveOk } from "@/lib/clave"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"
const t = (v: unknown, n = 500) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))

/**
 * Alta de consulta desde el formulario de devisebit.com u otra integración.
 * Encabezado: x-api-key: <CONSULTAS_KEY>
 * Cuerpo: { nombre, email?, telefono?, organizacion?, motivo?, mensaje?, canal? }
 */
export async function POST(req: NextRequest) {
  if (!claveOk(req.headers.get("x-api-key"), "CONSULTAS_KEY")) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const nombre = t(b.nombre, 120)
  if (!nombre) return NextResponse.json({ ok: false, error: "Falta nombre" }, { status: 400 })
  const canal = ["web", "whatsapp", "instagram", "telefono", "email", "linkedin", "referido", "otro"].includes(b.canal) ? b.canal : "web"
  const r = await one<{ id: number }>(
    "insert into consultas(canal,nombre,telefono,organizacion,email,motivo,mensaje) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [canal, nombre, t(b.telefono ?? b.tel, 40), t(b.organizacion ?? b.org, 160), t(b.email, 160), t(b.motivo ?? b.tema, 120), t(b.mensaje ?? b.msg, 4000)],
  )
  await audit({ id: 0, usuario: "integracion-" + canal }, "alta_consulta", "consulta", r!.id)
  await notificar(["gerente", "coordinacion"], "🌐 Nueva consulta desde la web", `${nombre}${b.org || b.organizacion ? ` (${b.org ?? b.organizacion})` : ""}: ${t(b.motivo ?? b.tema, 80) ?? ""}`, `/consultas/${r!.id}`)
  return NextResponse.json({ ok: true, id: r!.id })
}
