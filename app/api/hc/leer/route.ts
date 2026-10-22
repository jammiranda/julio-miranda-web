import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { one, audit } from "@/lib/db"
import { iaActiva, leerDocumento } from "@/lib/ia"

export const dynamic = "force-dynamic"
export const maxDuration = 60
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]

/** Recibe una foto o PDF de un documento clínico: lo guarda como adjunto del paciente y, si la IA está activa, devuelve la transcripción sugerida. */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || !["gerente", "coordinacion", "profesional"].includes(u.rol)) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  const fd = await req.formData()
  const pid = Number(fd.get("paciente"))
  const f = fd.get("archivo")
  if (!pid || !(f instanceof File)) return NextResponse.json({ ok: false, error: "Falta el archivo" }, { status: 400 })
  if (!TIPOS.includes(f.type)) return NextResponse.json({ ok: false, error: "Formato no admitido: subí una foto (JPG/PNG) o un PDF" }, { status: 400 })
  if (f.size > 4 * 1024 * 1024) return NextResponse.json({ ok: false, error: "El archivo supera 4 MB" }, { status: 400 })
  const buf = Buffer.from(await f.arrayBuffer())
  const a = await one<{ id: number }>("insert into adjuntos(paciente_id,nombre,mime,tam,datos,creado_por_nombre) values ($1,$2,$3,$4,decode($5,'base64'),$6) returning id", [pid, f.name, f.type, f.size, buf.toString("base64"), u.nombre])
  await audit(u, "sube_documento_hc", "adjunto", a!.id, `paciente ${pid}`)
  if (!iaActiva()) return NextResponse.json({ ok: true, adjunto: a!.id, ia: false })
  try {
    const sugerido = await leerDocumento(f.type, buf.toString("base64"))
    await audit(u, "ia_lee_documento", "adjunto", a!.id)
    return NextResponse.json({ ok: true, adjunto: a!.id, ia: true, sugerido })
  } catch (e: any) {
    return NextResponse.json({ ok: true, adjunto: a!.id, ia: false, error: e?.message })
  }
}
