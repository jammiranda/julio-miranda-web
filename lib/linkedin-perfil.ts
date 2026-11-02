import * as XLSX from "xlsx"
import { guardarPublicaciones, guardarRedDiario, type FilaRed } from "./publicaciones"

/**
 * LinkedIn PERSONAL de Julio a partir de la exportación de "Analytics de contenido" del perfil
 * (linkedin.com/analytics/creator/content → Exportar). Un .xlsx con hojas DISCOVERY, ENGAGEMENT, TOP POSTS, FOLLOWERS y DEMOGRAPHICS
 * (en español: DESCUBRIMIENTO, INTERACCIÓN, PUBLICACIONES PRINCIPALES, SEGUIDORES, DATOS DEMOGRÁFICOS).
 * Se guarda en pc_red_diario (red linkedin_julio) y en el historial de publicaciones.
 */
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()
const num = (v: unknown) => { if (v == null || v === "") return null; const x = Number(String(v).replace(/[^\d.-]/g, "")); return Number.isFinite(x) ? Math.round(x) : null }

/** Fecha de Excel, "11/1/2026", "1/11/2026" o "2026-11-01". `mdy` decide el orden cuando es ambiguo. */
function fecha(v: unknown, mdy: boolean): string | null {
  if (v == null || v === "") return null
  if (typeof v === "number" && v > 30000) { const d = XLSX.SSF.parse_date_code(v); return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : null }
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (!m) return null
  let [a, b] = [Number(m[1]), Number(m[2])]
  const [mes, dia] = a > 12 ? [b, a] : b > 12 ? [a, b] : mdy ? [a, b] : [b, a]
  return `${m[3]}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

export type LecturaPerfil = { dias: FilaRed[]; posts: { url: string; fecha: string | null; impresiones: number | null; interacciones: number | null }[]; seguidoresTotal: number | null; fechaTotal: string | null; impresionesPeriodo: number | null; alcancePeriodo: number | null; hojas: string[]; avisos: string[] }

export function leerExportPerfil(datos: ArrayBuffer | Uint8Array | Buffer): LecturaPerfil {
  const wb = XLSX.read(datos, { type: "array", cellDates: false })
  const out: LecturaPerfil = { dias: [], posts: [], seguidoresTotal: null, fechaTotal: null, impresionesPeriodo: null, alcancePeriodo: null, hojas: [], avisos: [] }
  // Orden de fechas: LinkedIn en inglés usa M/D/YYYY; en español D/M/YYYY
  const nombres = wb.SheetNames.map(norm)
  const mdy = nombres.some((x) => /discovery|engagement|followers|top posts/.test(x))
  const porDia = new Map<string, FilaRed>()
  const dia = (d: string) => { if (!porDia.has(d)) porDia.set(d, { dia: d }); return porDia.get(d)! }
  for (const nombre of wb.SheetNames) {
    const h = norm(nombre)
    const filas: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, raw: true, defval: "" })
    if (/discovery|descubrimiento/.test(h)) {
      for (const f of filas) {
        const k = norm(f[0])
        if (/^impressions|^impresiones/.test(k)) out.impresionesPeriodo = num(f[1])
        if (/members reached|miembros alcanzados|personas alcanzadas/.test(k)) out.alcancePeriodo = num(f[1])
      }
      out.hojas.push(nombre)
    } else if (/^engagement|interaccion/.test(h)) {
      const i = filas.findIndex((f) => /^(date|fecha)$/.test(norm(f[0])))
      if (i < 0) { out.avisos.push(`${nombre}: no encontré la columna Fecha`); continue }
      const cab = filas[i].map(norm)
      const ci = cab.findIndex((c) => /impressions|impresiones/.test(c)), ce = cab.findIndex((c) => /engagements|interacciones/.test(c))
      for (const f of filas.slice(i + 1)) { const d = fecha(f[0], mdy); if (!d) continue; const x = dia(d); x.impresiones = ci >= 0 ? num(f[ci]) : null; x.interacciones = ce >= 0 ? num(f[ce]) : null }
      out.hojas.push(nombre)
    } else if (/followers|seguidores/.test(h)) {
      for (const f of filas.slice(0, 4)) {
        const k = norm(f[0])
        if (/total followers|total de seguidores|seguidores totales/.test(k)) { out.seguidoresTotal = num(f[1]); out.fechaTotal = fecha(String(f[0]).match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)?.[0], mdy) }
      }
      const i = filas.findIndex((f) => /^(date|fecha)$/.test(norm(f[0])))
      if (i >= 0) for (const f of filas.slice(i + 1)) { const d = fecha(f[0], mdy); if (d) dia(d).nuevos = num(f[1]) }
      out.hojas.push(nombre)
    } else if (/top posts|publicaciones principales|principales publicaciones/.test(h)) {
      // Dos tablas lado a lado: por interacciones (A-C) y por impresiones (E-G)
      const i = filas.findIndex((f) => f.some((c) => /post url|url de la publicacion|enlace/.test(norm(c))))
      if (i < 0) { out.avisos.push(`${nombre}: no encontré las URL`); continue }
      const cab = filas[i].map(norm)
      const urls = cab.map((c, j) => (/post url|url de la publicacion|enlace/.test(c) ? j : -1)).filter((j) => j >= 0)
      const mapa = new Map<string, { url: string; fecha: string | null; impresiones: number | null; interacciones: number | null }>()
      for (const f of filas.slice(i + 1)) for (const j of urls) {
        const url = String(f[j] ?? "").trim(); if (!/^https?:/.test(url)) continue
        const p = mapa.get(url) ?? { url, fecha: fecha(f[j + 1], mdy), impresiones: null, interacciones: null }
        const v = num(f[j + 2]); const col = cab[j + 2] ?? ""
        if (/impressions|impresiones/.test(col)) p.impresiones = v; else p.interacciones = v
        mapa.set(url, p)
      }
      out.posts = [...mapa.values()]
      out.hojas.push(nombre)
    }
  }
  // Seguidores por día: hacia atrás desde el total
  const dias = [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia))
  if (out.seguidoresTotal != null) {
    let acc = out.seguidoresTotal
    for (let k = dias.length - 1; k >= 0; k--) { dias[k].seguidores = acc; acc -= dias[k].nuevos ?? 0 }
  }
  out.dias = dias
  if (!out.hojas.length) out.avisos.push("No parece una exportación de Analytics del perfil (faltan las hojas DISCOVERY / ENGAGEMENT / FOLLOWERS).")
  return out
}

export async function guardarExportPerfil(l: LecturaPerfil) {
  const dias = await guardarRedDiario("linkedin_julio", l.dias)
  const posts = await guardarPublicaciones(l.posts.map((p) => ({ red: "linkedin_julio", id: p.url.replace(/[?#].*$/, ""), fecha: p.fecha, texto: "", tipo: "Publicación", url: p.url, impresiones: p.impresiones, me_gusta: null, clics: null, alcance: null, compartidos: null, comentarios: null, vistas: null, votos: null, interacciones: p.interacciones })), "exportación del perfil")
  return { dias, posts }
}
