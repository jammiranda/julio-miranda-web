import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { leerExportPerfil, guardarExportPerfil } from "@/lib/linkedin-perfil"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Importa la exportación de Analytics del PERFIL PERSONAL de Julio en LinkedIn (.xlsx).
 * Autenticación: sesión con rol Dirección o Comercial, o x-api-key = REDES_INGESTA_KEY.
 * Cuerpo: multipart/form-data con el archivo (cualquier nombre de campo) y opcional "seguidores_totales".
 */
export async function POST(req: NextRequest) {
  const porClave = claveOk(req.headers.get("x-api-key"), "REDES_INGESTA_KEY")
  const u = porClave ? null : await usuarioActual().catch(() => null)
  if (!porClave && !(u && ["gerente", "coordinacion"].includes(u.rol))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const fd = await req.formData().catch(() => null)
  if (!fd) return NextResponse.json({ ok: false, error: "mandá el archivo como formulario" }, { status: 400 })
  const resultados: any[] = []
  let total: number | null = null
  for (const [campo, v] of fd.entries()) {
    if (typeof v === "string") { if (campo === "seguidores_totales" && v.trim()) total = Number(v.replace(/\D/g, "")) || null; continue }
    if (!/\.(xlsx|xls|csv)$/i.test(v.name) || v.size > 15 * 1024 * 1024) { resultados.push({ nombre: v.name, error: "no es .xlsx o supera 15 MB" }); continue }
    const l = leerExportPerfil(new Uint8Array(await v.arrayBuffer()))
    if (total != null && l.seguidoresTotal == null) { l.seguidoresTotal = total; let acc = total; for (let k = l.dias.length - 1; k >= 0; k--) { l.dias[k].seguidores = acc; acc -= l.dias[k].nuevos ?? 0 } }
    const g = l.hojas.length ? await guardarExportPerfil(l) : { dias: 0, posts: 0 }
    resultados.push({ nombre: v.name, hojas: l.hojas, avisos: l.avisos, desde: l.dias[0]?.dia ?? null, hasta: l.dias[l.dias.length - 1]?.dia ?? null, seguidores: l.seguidoresTotal, impresiones: l.impresionesPeriodo, alcance: l.alcancePeriodo, guardado: g })
  }
  if (u) await audit(u, "importar_linkedin_perfil", "panel", undefined, JSON.stringify(resultados).slice(0, 900)).catch(() => {})
  const ok = resultados.some((r) => r.guardado && (r.guardado.dias || r.guardado.posts))
  return NextResponse.json({ ok, resultados, error: ok ? undefined : resultados.map((r) => r.error ?? r.avisos?.join(" ")).filter(Boolean).join(" · ") || "no se reconoció ningún archivo" })
}
