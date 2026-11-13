import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { guardarTikTok, leerPlanillaTikTok, type VideoTT } from "@/lib/tiktok"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Carga a mano de TikTok para el Panel de Contenido (no hay conexión automática con TikTok).
 * Autenticación: sesión con rol Dirección o Comercial, o x-api-key = REDES_INGESTA_KEY.
 * Cuerpo, como formulario (multipart) o como JSON:
 * - dia: "YYYY-MM-DD" del dato de la cuenta (por defecto, hoy) · seguidores · me_gusta (me gusta totales de la cuenta)
 * - videos: [{ link, fecha, texto, vistas, me_gusta, comentarios, compartidos }] (en el formulario va como texto JSON)
 * - archivo(s): planilla .xlsx o .csv con un video por renglón (columnas Link, Fecha, Descripción, Reproducciones, Me gusta, Comentarios, Compartidos)
 */
export async function POST(req: NextRequest) {
  const porClave = claveOk(req.headers.get("x-api-key"), "REDES_INGESTA_KEY")
  const u = porClave ? null : await usuarioActual().catch(() => null)
  if (!porClave && !(u && ["gerente", "coordinacion"].includes(u.rol))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })

  let dia: string | null = null, seguidores: unknown = null, meGusta: unknown = null
  let videos: VideoTT[] = []
  const avisos: string[] = []
  let dePlanilla = 0
  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    const b: any = await req.json().catch(() => null)
    if (!b) return NextResponse.json({ ok: false, error: "el cuerpo no es JSON válido" }, { status: 400 })
    dia = b.dia ?? null; seguidores = b.seguidores ?? null; meGusta = b.me_gusta ?? null
    if (Array.isArray(b.videos)) videos = b.videos
  } else {
    const fd = await req.formData().catch(() => null)
    if (!fd) return NextResponse.json({ ok: false, error: "mandá los datos como formulario o como JSON" }, { status: 400 })
    for (const [campo, v] of fd.entries()) {
      if (typeof v === "string") {
        if (campo === "dia") dia = v.trim() || null
        else if (campo === "seguidores") seguidores = v
        else if (campo === "me_gusta") meGusta = v
        else if (campo === "videos") { try { const x = JSON.parse(v); if (Array.isArray(x)) videos.push(...x) } catch { avisos.push("No se pudieron leer los videos escritos.") } }
        continue
      }
      if (!/\.(xlsx|xls|csv)$/i.test(v.name) || v.size > 15 * 1024 * 1024) { avisos.push(`${v.name}: no es una planilla .xlsx o .csv, o supera 15 MB.`); continue }
      try {
        const l = leerPlanillaTikTok(new Uint8Array(await v.arrayBuffer()))
        videos.push(...l.videos); dePlanilla += l.videos.length
        avisos.push(...l.avisos.map((a) => `${v.name}: ${a}`))
      } catch { avisos.push(`${v.name}: no se pudo leer la planilla.`) }
    }
  }
  videos = videos.filter((v) => v && typeof v === "object" && String(v.link ?? "").trim())
  const r = await guardarTikTok({ dia, seguidores, me_gusta: meGusta, videos }, dePlanilla ? "planilla" : porClave ? "ingesta" : "carga a mano")
  const todos = [...avisos, ...r.avisos]
  if (u) await audit(u, "cargar_tiktok", "panel", undefined, JSON.stringify({ cuenta: r.cuenta, videos: r.videos, avisos: todos.length }).slice(0, 900)).catch(() => {})
  return NextResponse.json({ ok: r.ok, cuenta: r.cuenta, videos: r.videos, avisos: todos, error: r.ok ? undefined : [...avisos, r.error].filter(Boolean).join(" ") })
}
