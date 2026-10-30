import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { claveOk } from "@/lib/clave"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { leerArchivo, importar, type ArchivoLeido, type FilaDia, type FilaPost } from "@/lib/linkedin-export"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Importa la exportación de LinkedIn de la página de empresa (Followers / Visitors / Content .xls/.xlsx/.csv).
 *
 * Autenticación (cualquiera de las tres):
 * - Header x-api-key = ADS_INGESTA_KEY (la misma clave de la ingesta de anuncios; la usa la tarea programada).
 * - PANEL_TOKEN en el header x-panel-token o en ?k= (la misma clave de /api/panel).
 * - Sesión del sistema con rol Dirección o Comercial (pantalla "Subir exportación de LinkedIn" del Panel).
 *
 * Cuerpo:
 * - multipart/form-data con uno o varios archivos (cualquier nombre de campo, p. ej. "archivos").
 * - o JSON: { archivos?: [{ nombre, base64 }], diario?: FilaDia[], publicaciones?: FilaPost[], seguidores_totales?: number, fecha_seguidores?: "YYYY-MM-DD" }
 * Responde un resumen: archivos reconocidos, hojas, filas por tipo, período cubierto y lo que se guardó.
 */
function tokenPanel(k: string | null) {
  const t = process.env.PANEL_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function quien(req: NextRequest) {
  if (process.env.ADS_INGESTA_KEY && claveOk(req.headers.get("x-api-key"), "ADS_INGESTA_KEY")) return { origen: "api" as const, por: "tarea (ADS_INGESTA_KEY)", u: null }
  if (tokenPanel(req.headers.get("x-panel-token") ?? req.nextUrl.searchParams.get("k"))) return { origen: "api" as const, por: "tarea (PANEL_TOKEN)", u: null }
  const u = await usuarioActual().catch(() => null)
  if (u && ["gerente", "coordinacion"].includes(u.rol)) return { origen: "manual" as const, por: u.usuario, u }
  return null
}

const MAX = 15 * 1024 * 1024
const EXT = /\.(xls|xlsx|csv|ods)$/i

export async function POST(req: NextRequest) {
  const qn = await quien(req)
  if (!qn) return NextResponse.json({ ok: false, error: "no autorizado: mandá x-api-key (ADS_INGESTA_KEY) o x-panel-token (PANEL_TOKEN)" }, { status: 401 })
  const ct = req.headers.get("content-type") ?? ""
  const archivos: ArchivoLeido[] = []
  const rechazados: { nombre: string; motivo: string }[] = []
  let extra: { diario?: FilaDia[]; publicaciones?: FilaPost[]; seguidoresTotales?: number | null; fechaSeguidores?: string | null } = {}
  try {
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData()
      for (const [campo, v] of fd.entries()) {
        if (typeof v === "string") {
          if (campo === "seguidores_totales" && v.trim()) extra.seguidoresTotales = Number(v.replace(/\D/g, ""))
          if (campo === "fecha_seguidores") extra.fechaSeguidores = v.trim()
          continue
        }
        const nombre = v.name || campo
        if (v.size > MAX) { rechazados.push({ nombre, motivo: "supera 15 MB" }); continue }
        if (!EXT.test(nombre)) { rechazados.push({ nombre, motivo: "no es .xls, .xlsx, .csv ni .ods" }); continue }
        archivos.push(leerArchivo(nombre, new Uint8Array(await v.arrayBuffer())))
      }
    } else {
      const b: any = await req.json()
      for (const a of Array.isArray(b?.archivos) ? b.archivos : []) {
        const nombre = String(a?.nombre ?? a?.name ?? "archivo.xls")
        if (typeof a?.base64 !== "string") { rechazados.push({ nombre, motivo: "falta base64" }); continue }
        const buf = Buffer.from(a.base64.replace(/^data:[^,]+,/, ""), "base64")
        if (buf.length > MAX) { rechazados.push({ nombre, motivo: "supera 15 MB" }); continue }
        archivos.push(leerArchivo(nombre, buf))
      }
      extra = {
        diario: Array.isArray(b?.diario) ? b.diario.slice(0, 5000) : undefined,
        publicaciones: Array.isArray(b?.publicaciones) ? b.publicaciones.slice(0, 5000) : undefined,
        seguidoresTotales: b?.seguidores_totales != null ? Number(b.seguidores_totales) : null,
        fechaSeguidores: typeof b?.fecha_seguidores === "string" ? b.fecha_seguidores : null,
      }
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `no se pudo leer el envío: ${String(e?.message ?? e).slice(0, 200)}` }, { status: 400 })
  }
  try {
    const r = await importar(archivos, extra, { origen: qn.origen, por: qn.por })
    if (qn.u) await audit(qn.u, "importar", "linkedin", undefined, `${r.guardado.dias} días, ${r.guardado.publicaciones} publicaciones (${r.periodo.desde ?? "?"} a ${r.periodo.hasta ?? "?"})`)
    return NextResponse.json({ ...r, rechazados, origen: qn.origen }, { status: r.ok ? 200 : 422, headers: { "cache-control": "no-store" } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `error al guardar: ${String(e?.message ?? e).slice(0, 300)}`, rechazados }, { status: 500 })
  }
}
