import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { usuarioActual } from "@/lib/auth"
import { audit } from "@/lib/db"
import { claveCursos } from "@/lib/cifrado-gcm"
import { claveValida, iniciarSubida, guardarParte, cerrarSubida, listarArchivos, MAX_ARCHIVO_ACADEMIA, TROZO_ARCHIVO, PREFIJO_DB } from "@/lib/academia-archivos"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Materiales protegidos de la Academia (apuntes y cuadernos de los cursos). Solo equipo:
 * - sesión del sistema con rol gerente o coordinación, o
 * - header x-panel-token con PANEL_TOKEN (para subir desde un script; el token lo carga quien lo ejecuta).
 *
 * GET  → lista de archivos guardados (sin contenido).
 * POST → subida por partes, igual que Documentos de la empresa:
 *   { accion: "iniciar", clave: "cursos/<slug>/apunte.pdf", nombre, mime, tamano, sha256 } → { id, version, trozo, url }
 *   { accion: "parte", id, n, datos (base64 de hasta 2,5 MB) }  → el servidor la cifra con CURSOS_ARCHIVOS_KEY y la guarda
 *   { accion: "cerrar", id }                                    → verifica tamaño y SHA-256 y la deja vigente
 * La lección "descarga" del curso apunta a "enc:db:<clave>" y la entregan solo las rutas del aula (inscriptos al día).
 */
function tokenPanel(k: string | null) {
  const t = process.env.PANEL_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function quien(req: NextRequest) {
  if (tokenPanel(req.headers.get("x-panel-token"))) return { por: "tarea (PANEL_TOKEN)", u: null }
  const u = await usuarioActual().catch(() => null)
  if (u && ["gerente", "coordinacion"].includes(u.rol)) return { por: u.usuario, u }
  return null
}

const noAutorizado = () => NextResponse.json({ error: "No autorizado: entrá con tu usuario del sistema o mandá x-panel-token" }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!(await quien(req))) return noAutorizado()
  return NextResponse.json({ clave_cargada: !!claveCursos(), archivos: await listarArchivos() })
}

export async function POST(req: NextRequest) {
  const qn = await quien(req)
  if (!qn) return noAutorizado()
  if (!claveCursos()) return NextResponse.json({ error: "Falta CURSOS_ARCHIVOS_KEY en el servidor: sin clave no se guarda nada" }, { status: 503 })
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 })
  try {
    if (b.accion === "iniciar") {
      const clave = String(b.clave ?? "").trim()
      const tamano = Number(b.tamano) || 0
      if (!claveValida(clave)) return NextResponse.json({ error: "Clave inválida (ej.: cursos/mi-curso/apunte.pdf)" }, { status: 400 })
      if (tamano <= 0 || tamano > MAX_ARCHIVO_ACADEMIA) return NextResponse.json({ error: "El archivo tiene que pesar menos de 40 MB" }, { status: 400 })
      const sha = typeof b.sha256 === "string" && /^[a-f0-9]{64}$/.test(b.sha256) ? b.sha256 : null
      const nombre = String(b.nombre || clave.split("/").pop()).replace(/[^\w.\-]/g, "-").slice(0, 160)
      const mime = String(b.mime || "application/pdf").slice(0, 100)
      const r = await iniciarSubida({ clave, nombre, mime, tamano, sha256: sha, por: qn.por })
      return NextResponse.json({ id: r.id, version: r.version, trozo: TROZO_ARCHIVO, url: PREFIJO_DB + clave })
    }
    if (b.accion === "parte") {
      if (typeof b.datos !== "string") return NextResponse.json({ error: "Parte inválida" }, { status: 400 })
      await guardarParte(Number(b.id), Number(b.n), b.datos)
      return NextResponse.json({ ok: true })
    }
    if (b.accion === "cerrar") {
      const r = await cerrarSubida(Number(b.id))
      await audit(qn.u, "academia_archivo_subido", "am_archivos", Number(b.id), `v${r.version} · ${r.tamano} bytes · ${r.publicadas} lecciones publicadas`)
      return NextResponse.json({ ok: true, ...r })
    }
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 })
  }
  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
}
