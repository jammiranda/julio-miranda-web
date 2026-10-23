import { NextResponse, type NextRequest } from "next/server"
import { one, audit } from "@/lib/db"
import { claveOk } from "@/lib/clave"
import { notificar } from "@/lib/push"
import { desdeUtm } from "@/lib/origen"
import { alCRM } from "@/lib/bot"

export const dynamic = "force-dynamic"
const t = (v: unknown, n = 500) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))

/**
 * Alta de consulta desde el formulario de devisebit.com (u otra integración).
 * Cuerpo: { nombre, email, telefono?, organizacion?, motivo?, mensaje?, canal?, utm_source?, utm_medium?, utm_campaign?, gclid?, fbclid?, landing?, referrer? }
 * Con x-api-key (CONSULTAS_KEY) no tiene límites; sin clave exige email válido y limita a 5 por IP por hora.
 */
const ORIGENES = ["https://www.devisebit.com", "https://devisebit.com"]
function cors(req: NextRequest): Record<string, string> {
  const o = req.headers.get("origin") ?? ""
  return ORIGENES.includes(o) ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {}
}
export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req) })
}

export async function POST(req: NextRequest) {
  const res = await alta(req)
  for (const [k, v] of Object.entries(cors(req))) res.headers.set(k, v)
  return res
}

async function alta(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (b.website) return NextResponse.json({ ok: true }) // trampa para bots
  const nombre = t(b.nombre, 120), email = t(b.email, 160)
  if (!nombre) return NextResponse.json({ ok: false, error: "Falta nombre" }, { status: 400 })
  const conClave = claveOk(req.headers.get("x-api-key"), "CONSULTAS_KEY")
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || null
  if (!conClave) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 })
    const n = await one<{ n: number }>("select count(*)::int n from consultas where canal='web' and origen_detalle->>'ip'=$1 and creado > now() - interval '1 hour'", [ip ?? ""])
    if ((n?.n ?? 0) >= 5) return NextResponse.json({ ok: false, error: "Demasiados envíos" }, { status: 429 })
  }
  const canal = ["web", "whatsapp", "instagram", "telefono", "email", "linkedin", "referido", "otro"].includes(b.canal) ? b.canal : "web"
  const og = desdeUtm(b)
  const r = await one<{ id: number }>(
    `insert into consultas(canal,nombre,telefono,organizacion,email,motivo,mensaje,fuente,campania,utm_source,utm_medium,utm_campaign,gclid,origen_detalle)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
    [canal, nombre, t(b.telefono ?? b.tel, 40), t(b.organizacion ?? b.org, 160), email, t(b.motivo ?? b.tema, 120), t(b.mensaje ?? b.msg, 4000),
      og.fuente, t(og.campania, 160), t(og.utm_source, 80), t(og.utm_medium, 80), t(og.utm_campaign, 160), t(og.gclid, 200), JSON.stringify({ ...og.detalle, ip })],
  )
  await alCRM(r!.id, "web").catch(() => {})
  await audit({ id: 0, usuario: "web" }, "alta_consulta", "consulta", r!.id, og.fuente)
  await notificar(["gerente", "coordinacion"], `🌐 Nueva consulta web · ${og.fuente}`, `${nombre}${b.org || b.organizacion ? ` (${b.org ?? b.organizacion})` : ""}: ${t(b.motivo ?? b.tema, 80) ?? ""}`, `/consultas/${r!.id}`)
  return NextResponse.json({ ok: true, id: r!.id })
}
