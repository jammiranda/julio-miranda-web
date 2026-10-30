import * as XLSX from "xlsx"
import { q } from "./db"

/**
 * LinkedIn de la página de empresa (/company/devisebit) a partir de la EXPORTACIÓN MANUAL de LinkedIn
 * (Página → Analytics → Exportar). No hay API de Community Management: Julio (o una tarea programada con su navegador)
 * baja los .xls una vez por mes y los sube a /api/panel/linkedin/importar.
 *
 * Tres tipos de archivo:
 * - Seguidores ("Followers"): hoja por día (patrocinados, orgánicos, auto-invitados, total) + hojas de demografía.
 * - Visitantes ("Visitors"): hoja por día (vistas de página y visitantes únicos) + demografía.
 * - Contenido ("Content"/"Updates"): hoja de métricas por día + hoja con todas las publicaciones.
 *
 * El parser es tolerante: busca la fila de encabezados en las primeras filas, entiende sinónimos en inglés y español
 * e ignora columnas que no conoce. Guardar es idempotente: upsert por fecha (li_diario) y por link de publicación (li_publicaciones).
 */

// ───────────────────────── Normalización de encabezados ─────────────────────────
const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[()\[\]_\-:/.,%#]+/g, " ").replace(/\s+/g, " ").trim()

const DISP = /desktop|mobile|movil|ordenador|computadora|escritorio|celular|sponsored|patrocinad|paid|pagad/
type Regla = RegExp | ((h: string) => boolean)

/** Campo interno → reglas en orden de prioridad (la primera que matchea gana). */
const CAMPOS: Record<string, Regla[]> = {
  fecha: [/^(date|fecha|dia|day)$/, /^(created date|creation date|fecha de creacion|fecha de publicacion|publicado el|date posted|posted on|created)$/],
  // Seguidores (por día)
  seg_patrocinados: [/^sponsored followers$|^seguidores patrocinados$|^seguidores pagados$/],
  seg_organicos: [/^organic followers$|^seguidores organicos$/],
  seg_auto: [/auto ?invited followers|seguidores (por |de )?invitacion|invitados automaticamente|seguidores auto ?invitados/],
  seg_total: [/^total followers$|^total de seguidores$|^seguidores totales$|^seguidores total$|^followers$|^seguidores$/],
  // Visitantes (por día)
  vistas_pagina: [
    (h) => /(page views|visualizaciones de (la )?pagina|vistas de (la )?pagina) en total/.test(h) && !DISP.test(h),
    (h) => /^total page views/.test(h) && !DISP.test(h),
    (h) => /^total (de )?(page views|visualizaciones de (la )?pagina|vistas de (la )?pagina|visitas a la pagina)( total)?$/.test(h),
    (h) => /(page views|visualizaciones de (la )?pagina|vistas de (la )?pagina)/.test(h) && !/overview|resumen|inicio|general/.test(h) && !DISP.test(h),
    (h) => /(page views|visualizaciones de (la )?pagina|vistas de (la )?pagina)/.test(h) && / total$/.test(h),
  ],
  visitantes_unicos: [
    (h) => /(unique visitors|visitantes unicos) en total/.test(h) && !DISP.test(h),
    (h) => /^total unique visitors/.test(h) && !DISP.test(h),
    (h) => /^total (de )?(unique visitors|visitantes unicos)( total)?$/.test(h),
    (h) => /(unique visitors|visitantes unicos)/.test(h) && !/overview|resumen|inicio|general/.test(h) && !DISP.test(h),
    (h) => /(unique visitors|visitantes unicos)/.test(h) && / total$/.test(h),
  ],
  // Contenido (por día y por publicación)
  impresiones_unicas: [/^unique impressions( organic| total)?$|^impresiones unicas( organicas| total)?$/],
  impresiones: [/^impressions total$|^impresiones total(es)?$|^total impressions$/, /^impressions$|^impresiones$/, /^impressions organic$|^impresiones organicas$/],
  clics: [/^clicks total$|^clics total(es)?$|^total clicks$/, /^clicks$|^clics$/, /^clicks organic$|^clics organicos$/],
  reacciones: [/^reactions total$|^reacciones total(es)?$/, /^reactions$|^reacciones$|^likes$|^me gusta$|^recomendaciones$/, /^reactions organic$|^reacciones organicas$/],
  comentarios: [/^comments total$|^comentarios total(es)?$/, /^comments$|^comentarios$/, /^comments organic$|^comentarios organicos$/],
  compartidos: [/^(reposts|shares) total$|^(compartidos|veces compartido|republicaciones|reposts) total(es)?$/, /^(reposts|shares|compartidos|veces compartido|republicaciones|contenido compartido)$/, /^(reposts|shares) organic$|^(compartidos|republicaciones) organic[oa]s$/],
  engagement: [/^engagement rate total$|^tasa de (interaccion|participacion|engagement) total$/, /^engagement rate$|^tasa de (interaccion|participacion|engagement)$|^engagement$/, /^engagement rate organic$|^tasa de (interaccion|participacion) organica$/],
  // Solo publicaciones
  link: [/^post link$|^update link$|^(enlace|link|url) (de |a )?(la )?(publicacion|actualizacion)$|^url$|^enlace$|^link$/],
  titulo: [/^post title$|^update title$|^titulo (de la )?(publicacion|actualizacion)$|^titulo$|^title$|^texto$/],
  tipo: [/^content type$|^tipo de contenido$/, /^post type$|^tipo (de )?publicacion$|^tipo$/],
  campania: [/^campaign name$|^nombre de (la )?campana$|^campana$/],
  autor: [/^posted by$|^publicado por$|^autor$/],
  audiencia: [/^audience$|^publico$|^audiencia$/],
  vistas: [/^views$|^visualizaciones$|^reproducciones$|^video views$/],
  ctr: [/^ctr$|^click through rate( ctr)?$|^porcentaje de clics( ctr)?$|^tasa de clics( ctr)?$/],
  seguimientos: [/^follows$|^seguimientos$|^nuevos seguidores$|^seguidores obtenidos$/],
}

function mapear(enc: unknown[]) {
  const hs = enc.map(norm)
  const m: Record<string, number> = {}
  const usadas = new Set<number>()
  for (const [campo, reglas] of Object.entries(CAMPOS)) {
    for (const r of reglas) {
      const i = hs.findIndex((h, j) => h && !usadas.has(j) && (typeof r === "function" ? r(h) : r.test(h)))
      if (i >= 0) { m[campo] = i; usadas.add(i); break }
    }
  }
  return m
}

// ───────────────────────── Valores ─────────────────────────
function num(v: unknown): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  let s = String(v).trim().replace(/%$/, "").replace(/\s/g, "")
  if (!s || s === "-" || s === "—") return null
  // "1.234,5" (es) o "1,234.5" (en)
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".")
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "")
  else s = s.replace(",", ".")
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
const entero = (v: unknown) => { const n = num(v); return n == null ? null : Math.round(n) }
/** Tasas: LinkedIn las da como fracción (0.034) o como texto con % ("3,4%"). Se guardan en porcentaje. */
function tasa(v: unknown): number | null {
  const n = num(v)
  if (n == null) return null
  const pct = typeof v === "string" && v.trim().endsWith("%")
  return Math.round((pct || n > 1 ? n : n * 100) * 10000) / 10000
}
const iso = (y: number, m: number, d: number) => (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null)

/** Lee las fechas de una columna entera para decidir si "03/04/2026" es día/mes o mes/día. */
function fechas(vals: unknown[], encabezado: string): (string | null)[] {
  const partes = vals.map((v) => (typeof v === "string" ? v.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/) : null))
  let dmy = /fecha|dia|creacion|publicacion|publicado/.test(norm(encabezado)) // español → día/mes
  if (partes.some((p) => p && Number(p[1]) > 12)) dmy = true
  else if (partes.some((p) => p && Number(p[2]) > 12)) dmy = false
  return vals.map((v, i) => {
    if (v == null || v === "") return null
    if (v instanceof Date && !isNaN(v.getTime())) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate())
    if (typeof v === "number" && v > 20000 && v < 80000) { const d = XLSX.SSF.parse_date_code(v); return d ? iso(d.y, d.m, d.d) : null }
    const s = String(v).trim()
    const a = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
    if (a) return iso(+a[1], +a[2], +a[3])
    const p = partes[i]
    if (p) { const y = +p[3] < 100 ? 2000 + +p[3] : +p[3]; return dmy ? iso(y, +p[2], +p[1]) : iso(y, +p[1], +p[2]) }
    const t = Date.parse(s)
    if (!isNaN(t)) { const d = new Date(t); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) }
    return null
  })
}

// ───────────────────────── Tipos ─────────────────────────
export type FilaDia = {
  fecha: string
  seg_organicos?: number | null; seg_patrocinados?: number | null; seg_auto?: number | null; seg_nuevos?: number | null; seg_total?: number | null; seg_acumulado?: number | null
  vistas_pagina?: number | null; visitantes_unicos?: number | null
  impresiones?: number | null; impresiones_unicas?: number | null; clics?: number | null; reacciones?: number | null; comentarios?: number | null; compartidos?: number | null; engagement?: number | null
}
export type FilaPost = {
  link?: string | null; titulo?: string | null; tipo?: string | null; campania?: string | null; autor?: string | null; fecha?: string | null; audiencia?: string | null
  impresiones?: number | null; vistas?: number | null; clics?: number | null; ctr?: number | null; reacciones?: number | null; comentarios?: number | null; compartidos?: number | null; seguimientos?: number | null; engagement?: number | null
}
export type FilaDemo = { fuente: string; dimension: string; categoria: string; valor: number }
export type TipoArchivo = "seguidores" | "visitantes" | "contenido" | "desconocido"
export type HojaLeida = { hoja: string; tipo: "seguidores_diario" | "visitantes_diario" | "contenido_diario" | "publicaciones" | "demografia" | "ignorada"; filas: number; columnas: string[] }
export type ArchivoLeido = { nombre: string; tipo: TipoArchivo; hojas: HojaLeida[]; diario: FilaDia[]; publicaciones: FilaPost[]; demografia: FilaDemo[]; avisos: string[] }

const DIMENSIONES: [RegExp, string][] = [
  [/location|ubicacion|region|pais|country|ciudad/, "ubicacion"],
  [/job function|funcion|funcion laboral|area/, "funcion"],
  [/seniority|antiguedad|nivel|cargo/, "nivel"],
  [/industry|industria|sector/, "industria"],
  [/company size|tamano (de la )?empresa|tamano/, "tamano_empresa"],
]
const dimension = (hoja: string) => { const h = norm(hoja); return DIMENSIONES.find(([r]) => r.test(h))?.[1] ?? h.slice(0, 40) }

function tipoPorNombre(nombre: string): TipoArchivo {
  const n = norm(nombre)
  if (/follower|seguidor/.test(n)) return "seguidores"
  if (/visitor|visitante|visita/.test(n)) return "visitantes"
  if (/content|update|contenido|actualizacion|publicacion|post/.test(n)) return "contenido"
  return "desconocido"
}

/** Busca la fila de encabezados entre las primeras 15 (la primera suele ser una descripción). */
function filaEncabezado(rows: unknown[][]) {
  let mejor = { i: -1, n: 0 }
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const m = mapear(rows[i] ?? [])
    const n = Object.keys(m).length
    if (n > mejor.n) mejor = { i, n }
  }
  return mejor
}

// ───────────────────────── Parser ─────────────────────────
export function leerArchivo(nombre: string, datos: ArrayBuffer | Uint8Array | Buffer): ArchivoLeido {
  const out: ArchivoLeido = { nombre, tipo: tipoPorNombre(nombre), hojas: [], diario: [], publicaciones: [], demografia: [], avisos: [] }
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(datos instanceof ArrayBuffer ? new Uint8Array(datos) : datos, { type: "array", cellDates: true, dense: false })
  } catch (e: any) {
    out.avisos.push(`No se pudo leer como planilla: ${String(e?.message ?? e).slice(0, 120)}`)
    return out
  }
  const demoPend: { hoja: string; rows: unknown[][] }[] = []
  for (const hoja of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[hoja], { header: 1, raw: true, defval: null, blankrows: false })
    if (!rows.length) { out.hojas.push({ hoja, tipo: "ignorada", filas: 0, columnas: [] }); continue }
    const { i: hi } = filaEncabezado(rows)
    const enc = hi >= 0 ? rows[hi] : []
    const m = hi >= 0 ? mapear(enc) : {}
    const cuerpo = hi >= 0 ? rows.slice(hi + 1).filter((r) => r.some((c) => c != null && c !== "")) : []
    const cols = Object.keys(m)
    const tiene = (...k: string[]) => k.some((x) => m[x] != null)
    const col = (k: string) => (m[k] != null ? cuerpo.map((r) => r[m[k]]) : [])

    // Publicaciones: hay link o título
    if (tiene("link", "titulo") && tiene("impresiones", "clics", "reacciones", "fecha")) {
      const fs = m.fecha != null ? fechas(col("fecha"), String(enc[m.fecha] ?? "")) : []
      const v = (r: unknown[], k: string) => (m[k] != null ? r[m[k]] : null)
      const txt = (r: unknown[], k: string, max: number) => { const x = v(r, k); return x == null || x === "" ? null : String(x).trim().slice(0, max) }
      let n = 0
      cuerpo.forEach((r, j) => {
        const p: FilaPost = {
          link: txt(r, "link", 500), titulo: txt(r, "titulo", 600), tipo: txt(r, "tipo", 60), campania: txt(r, "campania", 200), autor: txt(r, "autor", 120),
          fecha: fs[j] ?? null, audiencia: txt(r, "audiencia", 120),
          impresiones: entero(v(r, "impresiones")), vistas: entero(v(r, "vistas")), clics: entero(v(r, "clics")), ctr: tasa(v(r, "ctr")),
          reacciones: entero(v(r, "reacciones")), comentarios: entero(v(r, "comentarios")), compartidos: entero(v(r, "compartidos")),
          seguimientos: entero(v(r, "seguimientos")), engagement: tasa(v(r, "engagement")),
        }
        if (!p.link && !p.titulo) return
        out.publicaciones.push(p); n++
      })
      out.hojas.push({ hoja, tipo: "publicaciones", filas: n, columnas: cols })
      if (out.tipo === "desconocido") out.tipo = "contenido"
      continue
    }

    // Métricas por día
    if (tiene("fecha") && cuerpo.length) {
      const fs = fechas(col("fecha"), String(enc[m.fecha] ?? ""))
      const seg = tiene("seg_organicos", "seg_patrocinados", "seg_auto", "seg_total")
      const vis = tiene("vistas_pagina", "visitantes_unicos")
      const con = tiene("impresiones", "clics", "reacciones", "comentarios", "compartidos", "engagement", "impresiones_unicas")
      if (seg || vis || con) {
        const v = (r: unknown[], k: string) => (m[k] != null ? r[m[k]] : null)
        const filas: FilaDia[] = []
        cuerpo.forEach((r, j) => {
          const fecha = fs[j]
          if (!fecha) return
          const f: FilaDia = { fecha }
          if (seg) { f.seg_organicos = entero(v(r, "seg_organicos")); f.seg_patrocinados = entero(v(r, "seg_patrocinados")); f.seg_auto = entero(v(r, "seg_auto")); f.seg_total = entero(v(r, "seg_total")) }
          if (vis) { f.vistas_pagina = entero(v(r, "vistas_pagina")); f.visitantes_unicos = entero(v(r, "visitantes_unicos")) }
          if (con && !seg) {
            f.impresiones = entero(v(r, "impresiones")); f.impresiones_unicas = entero(v(r, "impresiones_unicas")); f.clics = entero(v(r, "clics"))
            f.reacciones = entero(v(r, "reacciones")); f.comentarios = entero(v(r, "comentarios")); f.compartidos = entero(v(r, "compartidos")); f.engagement = tasa(v(r, "engagement"))
          }
          filas.push(f)
        })
        if (seg) {
          // En la exportación de LinkedIn "Total followers" por día es la suma de los nuevos del día. Si no coincide con la suma
          // (o crece siempre y no hay desglose) es el total acumulado de la página.
          const conSuma = filas.filter((f) => f.seg_total != null && (f.seg_organicos != null || f.seg_patrocinados != null || f.seg_auto != null))
          const suma = (f: FilaDia) => (f.seg_organicos ?? 0) + (f.seg_patrocinados ?? 0) + (f.seg_auto ?? 0)
          let acumulado = false
          if (conSuma.length) acumulado = conSuma.filter((f) => Math.abs((f.seg_total ?? 0) - suma(f)) <= 1).length < conSuma.length / 2
          else {
            const t = filas.map((f) => f.seg_total).filter((x): x is number => x != null)
            acumulado = t.length >= 3 && t[0] >= 10 && t.every((x, k) => k === 0 || x >= t[k - 1])
          }
          for (const f of filas) {
            if (acumulado) { f.seg_acumulado = f.seg_total ?? null; f.seg_nuevos = f.seg_organicos != null || f.seg_patrocinados != null || f.seg_auto != null ? suma(f) : null }
            else f.seg_nuevos = f.seg_total ?? (f.seg_organicos != null || f.seg_patrocinados != null || f.seg_auto != null ? suma(f) : null)
            delete f.seg_total
          }
          if (acumulado) out.avisos.push(`"${hoja}": la columna de total se tomó como seguidores acumulados.`)
        }
        out.diario.push(...filas)
        const t = seg ? "seguidores_diario" : vis ? "visitantes_diario" : "contenido_diario"
        out.hojas.push({ hoja, tipo: t, filas: filas.length, columnas: cols })
        if (out.tipo === "desconocido") out.tipo = seg ? "seguidores" : vis ? "visitantes" : "contenido"
        continue
      }
    }
    demoPend.push({ hoja, rows })
  }

  // Demografía: hojas de dos columnas (categoría + número) sin fecha. La fuente depende del tipo de archivo.
  for (const { hoja, rows } of demoPend) {
    const datos = rows.filter((r) => r.length >= 2 && r[0] != null && String(r[0]).trim() && num(r.slice(1).find((c) => num(c) != null)) != null)
    // Saltea encabezado y descripción: la primera columna no debe ser un encabezado conocido
    const filas = datos.filter((r) => !/^(location|ubicacion|job function|funcion|seniority|antiguedad|industry|industria|company size|tamano)/.test(norm(r[0])) && num(r[0]) == null)
    if (!filas.length || out.tipo === "desconocido") { out.hojas.push({ hoja, tipo: "ignorada", filas: 0, columnas: [] }); continue }
    const dim = dimension(hoja)
    const vistas = new Set<string>()
    for (const r of filas) {
      const cat = String(r[0]).trim().slice(0, 160)
      const val = entero(r.slice(1).find((c) => num(c) != null))
      if (!cat || val == null || vistas.has(cat)) continue
      vistas.add(cat)
      out.demografia.push({ fuente: out.tipo, dimension: dim, categoria: cat, valor: val })
    }
    out.hojas.push({ hoja, tipo: "demografia", filas: vistas.size, columnas: [] })
  }
  if (!out.diario.length && !out.publicaciones.length && !out.demografia.length) out.avisos.push("No se reconoció ninguna hoja de LinkedIn en este archivo.")
  return out
}

// ───────────────────────── Guardado (idempotente) ─────────────────────────
const COLS_DIA = ["seg_organicos", "seg_patrocinados", "seg_auto", "seg_nuevos", "seg_acumulado", "vistas_pagina", "visitantes_unicos", "impresiones", "impresiones_unicas", "clics", "reacciones", "comentarios", "compartidos", "engagement"] as const
const TIPO_DIA: Record<string, string> = { engagement: "numeric" }

/** Une filas del mismo día que vienen de archivos distintos (seguidores + visitantes + contenido). */
function unirDias(filas: FilaDia[]) {
  const m = new Map<string, FilaDia>()
  for (const f of filas) {
    const a = m.get(f.fecha) ?? { fecha: f.fecha }
    for (const k of COLS_DIA) if (f[k] != null) (a as any)[k] = f[k]
    m.set(f.fecha, a)
  }
  return [...m.values()].sort((x, y) => x.fecha.localeCompare(y.fecha))
}

export async function guardarDiario(filas: FilaDia[]) {
  const u = unirDias(filas.filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.fecha)))
  for (let i = 0; i < u.length; i += 400) {
    const lote = u.slice(i, i + 400).map((f) => Object.fromEntries([["fecha", f.fecha], ...COLS_DIA.map((k) => [k, f[k] ?? null])]))
    await q(
      `insert into li_diario(fecha,${COLS_DIA.join(",")})
       select fecha,${COLS_DIA.join(",")} from jsonb_to_recordset($1::jsonb) as x(fecha date, ${COLS_DIA.map((k) => `${k} ${TIPO_DIA[k] ?? "int"}`).join(", ")})
       on conflict (fecha) do update set ${COLS_DIA.map((k) => `${k}=coalesce(excluded.${k}, li_diario.${k})`).join(", ")}, actualizado=now()`,
      [JSON.stringify(lote)],
    )
  }
  return u.length
}

/** Clave estable de una publicación: el link sin parámetros; si no hay link, fecha + título. */
export function clavePost(p: FilaPost) {
  if (p.link) {
    const l = p.link.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase()
    const urn = l.match(/urn:li:(activity|share|ugcpost):\d+/)
    return urn ? urn[0] : l
  }
  return `sin-link:${p.fecha ?? ""}:${norm(p.titulo).slice(0, 120)}`
}

const COLS_POST_TXT = ["link", "titulo", "tipo", "campania", "autor", "audiencia"] as const
const COLS_POST_NUM = ["impresiones", "vistas", "clics", "ctr", "reacciones", "comentarios", "compartidos", "seguimientos", "engagement"] as const

export async function guardarPublicaciones(filas: FilaPost[]) {
  const m = new Map<string, FilaPost & { clave: string }>()
  for (const p of filas) { if (!p.link && !p.titulo) continue; const c = clavePost(p); m.set(c, { ...(m.get(c) ?? {}), ...Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)), clave: c }) }
  const u = [...m.values()]
  const tipos = (k: string) => (k === "ctr" || k === "engagement" ? "numeric" : "int")
  for (let i = 0; i < u.length; i += 300) {
    const lote = u.slice(i, i + 300).map((p) => Object.fromEntries([["clave", p.clave], ["fecha", p.fecha ?? null], ...COLS_POST_TXT.map((k) => [k, p[k] ?? null]), ...COLS_POST_NUM.map((k) => [k, p[k] ?? null])]))
    const todas = [...COLS_POST_TXT, ...COLS_POST_NUM]
    await q(
      `insert into li_publicaciones(clave,fecha,${todas.join(",")})
       select clave,fecha,${todas.join(",")} from jsonb_to_recordset($1::jsonb) as x(clave text, fecha date, ${COLS_POST_TXT.map((k) => `${k} text`).join(", ")}, ${COLS_POST_NUM.map((k) => `${k} ${tipos(k)}`).join(", ")})
       on conflict (clave) do update set fecha=coalesce(excluded.fecha, li_publicaciones.fecha), ${todas.map((k) => `${k}=coalesce(excluded.${k}, li_publicaciones.${k})`).join(", ")}, actualizado=now()`,
      [JSON.stringify(lote)],
    )
  }
  return u.length
}

export async function guardarDemografia(filas: FilaDemo[]) {
  if (!filas.length) return 0
  const m = new Map(filas.map((f) => [`${f.fuente}|${f.dimension}|${f.categoria}`, f]))
  const u = [...m.values()]
  for (let i = 0; i < u.length; i += 500) {
    await q(
      `insert into li_demografia(fuente,dimension,categoria,valor) select fuente,dimension,categoria,valor from jsonb_to_recordset($1::jsonb) as x(fuente text, dimension text, categoria text, valor int)
       on conflict (fuente,dimension,categoria) do update set valor=excluded.valor, actualizado=now()`,
      [JSON.stringify(u.slice(i, i + 500))],
    )
  }
  return u.length
}

export type ResumenImportacion = {
  ok: boolean
  archivos: { nombre: string; tipo: TipoArchivo; hojas: HojaLeida[]; filas: { diario: number; publicaciones: number; demografia: number }; periodo: { desde: string | null; hasta: string | null }; avisos: string[] }[]
  filas_por_tipo: { seguidores_diario: number; visitantes_diario: number; contenido_diario: number; publicaciones: number; demografia: number }
  guardado: { dias: number; publicaciones: number; demografia: number; seguidores_totales: number | null }
  periodo: { desde: string | null; hasta: string | null }
  avisos: string[]
}

const rango = (fs: (string | null | undefined)[]) => { const v = fs.filter((x): x is string => !!x).sort(); return { desde: v[0] ?? null, hasta: v[v.length - 1] ?? null } }

/** Procesa archivos ya leídos + filas sueltas (JSON) y guarda todo. Devuelve el resumen para la tarea programada. */
export async function importar(
  archivos: ArchivoLeido[],
  extra: { diario?: FilaDia[]; publicaciones?: FilaPost[]; seguidoresTotales?: number | null; fechaSeguidores?: string | null } = {},
  quien: { origen: "api" | "manual"; por?: string | null } = { origen: "api" },
): Promise<ResumenImportacion> {
  const diario = [...archivos.flatMap((a) => a.diario), ...(extra.diario ?? [])]
  const pubs = [...archivos.flatMap((a) => a.publicaciones), ...(extra.publicaciones ?? [])]
  const demo = archivos.flatMap((a) => a.demografia)
  const avisos: string[] = []
  let segTot: number | null = null
  if (extra.seguidoresTotales != null && Number.isFinite(extra.seguidoresTotales) && extra.seguidoresTotales >= 0) {
    segTot = Math.round(extra.seguidoresTotales)
    const f = extra.fechaSeguidores && /^\d{4}-\d{2}-\d{2}$/.test(extra.fechaSeguidores) ? extra.fechaSeguidores : new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
    diario.push({ fecha: f, seg_acumulado: segTot })
  }
  const filasTipo = { seguidores_diario: 0, visitantes_diario: 0, contenido_diario: 0, publicaciones: 0, demografia: 0 }
  for (const a of archivos) for (const h of a.hojas) if (h.tipo in filasTipo) (filasTipo as any)[h.tipo] += h.filas
  filasTipo.publicaciones += extra.publicaciones?.length ?? 0
  filasTipo.contenido_diario += extra.diario?.length ?? 0

  const [dias, publicaciones, demografia] = [await guardarDiario(diario), await guardarPublicaciones(pubs), await guardarDemografia(demo)]
  if (!archivos.length && !diario.length && !pubs.length) avisos.push("No llegó ningún archivo ni dato para importar.")
  const resumen: ResumenImportacion = {
    ok: dias + publicaciones + demografia > 0,
    archivos: archivos.map((a) => ({
      nombre: a.nombre, tipo: a.tipo, hojas: a.hojas,
      filas: { diario: a.diario.length, publicaciones: a.publicaciones.length, demografia: a.demografia.length },
      periodo: rango([...a.diario.map((d) => d.fecha), ...a.publicaciones.map((p) => p.fecha)]),
      avisos: a.avisos,
    })),
    filas_por_tipo: filasTipo,
    guardado: { dias, publicaciones, demografia, seguidores_totales: segTot },
    periodo: rango([...archivos.flatMap((a) => a.diario.map((d) => d.fecha)), ...(extra.diario ?? []).map((d) => d.fecha), ...pubs.map((p) => p.fecha)]),
    avisos,
  }
  await q("insert into li_importaciones(origen,por,resumen) values ($1,$2,$3::jsonb)", [quien.origen, quien.por ?? null, JSON.stringify(resumen)]).catch(() => {})
  return resumen
}

// ───────────────────────── Lectura para el Panel ─────────────────────────
export type PostExport = { clave: string; link: string | null; titulo: string | null; tipo: string | null; fecha: string | null; impresiones: number | null; clics: number | null; ctr: number | null; reacciones: number | null; comentarios: number | null; compartidos: number | null; engagement: number | null }

/** Datos de LinkedIn de la exportación para un mes (YYYY-MM). Sin mes: el actual, o el último mes con datos. */
export async function linkedinExport(mes?: string | null) {
  const [ult, meses] = await Promise.all([
    q<{ creado: string; origen: string; por: string | null }>(`select to_char(creado at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') creado, origen, por from li_importaciones order by li_importaciones.creado desc limit 1`),
    q<{ mes: string }>(`select distinct to_char(fecha,'YYYY-MM') mes from (select fecha from li_diario union select fecha from li_publicaciones where fecha is not null) t order by 1 desc limit 24`),
  ])
  if (!ult.length && !meses.length) return null
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).slice(0, 7)
  const m = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : meses.some((x) => x.mes === hoy) ? hoy : meses[0]?.mes ?? hoy
  const desde = `${m}-01`
  const [tot, dias, posts, segAcum, segPrev] = await Promise.all([
    q<{ seg_nuevos: number | null; vistas: number | null; visitantes: number | null; impresiones: number | null; clics: number | null; reacciones: number | null; comentarios: number | null; compartidos: number | null; eng: number | null; dias: number; desde: string | null; hasta: string | null }>(
      `select sum(seg_nuevos)::int seg_nuevos, sum(vistas_pagina)::int vistas, sum(visitantes_unicos)::int visitantes, sum(impresiones)::int impresiones, sum(clics)::int clics,
              sum(reacciones)::int reacciones, sum(comentarios)::int comentarios, sum(compartidos)::int compartidos, avg(engagement)::float eng, count(*)::int dias,
              to_char(min(fecha),'YYYY-MM-DD') desde, to_char(max(fecha),'YYYY-MM-DD') hasta
       from li_diario where fecha >= $1::date and fecha < ($1::date + interval '1 month') and (seg_nuevos is not null or vistas_pagina is not null or impresiones is not null or visitantes_unicos is not null)`, [desde]),
    q<{ fecha: string; seg_nuevos: number | null; vistas: number | null; impresiones: number | null }>(
      `select to_char(fecha,'YYYY-MM-DD') fecha, seg_nuevos, vistas_pagina vistas, impresiones from li_diario where fecha >= $1::date and fecha < ($1::date + interval '1 month') order by fecha`, [desde]),
    q<PostExport>(
      `select clave, link, titulo, tipo, to_char(fecha,'YYYY-MM-DD') fecha, impresiones, clics, ctr::float ctr, reacciones, comentarios, compartidos, engagement::float engagement
       from li_publicaciones where fecha >= $1::date and fecha < ($1::date + interval '1 month') order by impresiones desc nulls last, fecha desc limit 100`, [desde]),
    q<{ fecha: string; seg: number }>(`select to_char(fecha,'YYYY-MM-DD') fecha, seg_acumulado seg from li_diario where seg_acumulado is not null and fecha < ($1::date + interval '1 month') order by fecha desc limit 1`, [desde]),
    q<{ fecha: string; seg: number }>(`select to_char(fecha,'YYYY-MM-DD') fecha, seg_acumulado seg from li_diario where seg_acumulado is not null and fecha < $1::date order by fecha desc limit 1`, [desde]),
  ])
  const t = tot[0]
  // Tasa de interacción del mes: (clics + reacciones + comentarios + compartidos) / impresiones; si no hay impresiones, el promedio diario de LinkedIn.
  const inter = t && t.impresiones ? Math.round((((t.clics ?? 0) + (t.reacciones ?? 0) + (t.comentarios ?? 0) + (t.compartidos ?? 0)) / t.impresiones) * 10000) / 100 : t?.eng != null ? Math.round(t.eng * 100) / 100 : null
  return {
    mes: m,
    meses: [...new Set([hoy, ...meses.map((x) => x.mes)])].sort().reverse(),
    ultimaImportacion: ult[0] ?? null,
    periodo: { desde: t?.desde ?? null, hasta: t?.hasta ?? null, dias: t?.dias ?? 0 },
    seguidores: { total: segAcum[0]?.seg ?? null, fechaTotal: segAcum[0]?.fecha ?? null, nuevos: t?.seg_nuevos ?? null, totalAnterior: segPrev[0]?.seg ?? null },
    visitas: { vistas: t?.vistas ?? null, visitantes: t?.visitantes ?? null },
    contenido: { impresiones: t?.impresiones ?? null, clics: t?.clics ?? null, reacciones: t?.reacciones ?? null, comentarios: t?.comentarios ?? null, compartidos: t?.compartidos ?? null, interaccion: inter },
    dias,
    posts,
  }
}
export type DatosLinkedinExport = NonNullable<Awaited<ReturnType<typeof linkedinExport>>>
