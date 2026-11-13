import * as XLSX from "xlsx"
import { unstable_cache } from "next/cache"
import { bufferGql, linkedinConfigurado } from "./linkedin"
import { q } from "./db"
import { guardarPublicaciones, guardarRedDiario, redDiario, type Publicacion } from "./publicaciones"

/**
 * TikTok de DEVISEBIT para el Panel de Contenido.
 * Los videos se traen solos desde Buffer (que es quien los publica): reproducciones, me gusta, comentarios, compartidos y alcance,
 * con la misma clave BUFFER_API_KEY que usa LinkedIn. Los seguidores y los totales diarios de la cuenta (y también los videos) llegan desde
 * Metricool con la tarea diaria del panel (POST /api/panel/redes, red "tiktok"). La carga a mano (pantalla TikTok) queda como respaldo.
 * Se guardan en las mismas tablas que las demás redes: pc_red_diario (red tiktok: seguidores y me gusta de la cuenta por día)
 * y pc_publicaciones (un renglón por video; volver a cargar el mismo link actualiza, no duplica).
 * Mientras no haya nada cargado no se muestra ningún número.
 */
export const TT_USUARIO = "devisebit"
export const TT_URL = `https://www.tiktok.com/@${TT_USUARIO}`
/** Día en que se creó la cuenta (y del primer video): no se aceptan datos anteriores. */
export const TT_CREADA = "2026-11-12"
export const TT_PRIMER_VIDEO = `https://www.tiktok.com/@${TT_USUARIO}/video/7707434976932810004`

const TZ = "America/Argentina/Buenos_Aires"
const diaAR = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
export const hoyAR = () => diaAR(new Date())
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()

/** "1.234", "1,2 mil", "12 K", "1.5M" → número entero. Vacío o ilegible → null (nunca 0 inventado). */
export function numero(v: unknown): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.round(v) : null
  const s = String(v).trim().toLowerCase().replace(/ /g, " ")
  const m = s.match(/^([\d.,]+)\s*(mil|k|m|mill\.?|millones)?$/)
  if (!m) return null
  if (m[2]) {
    const base = parseFloat(m[1].replace(",", "."))
    return Number.isFinite(base) ? Math.round(base * (m[2] === "mil" || m[2] === "k" ? 1e3 : 1e6)) : null
  }
  const x = Number(m[1].replace(/[.,]/g, ""))
  return Number.isFinite(x) ? x : null
}

/** Fecha de Excel, "2026-11-12" o "12/11/2026" (día/mes/año) → "YYYY-MM-DD". */
export function fechaDia(v: unknown): string | null {
  if (v == null || v === "") return null
  if (typeof v === "number" && v > 30000) { const d = XLSX.SSF.parse_date_code(v); return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : null }
  if (v instanceof Date) return diaAR(v)
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (!m) return null
  const a = Number(m[1]), b = Number(m[2])
  const [dia, mes] = b > 12 ? [b, a] : [a, b]
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

/** Número del video dentro de un link de TikTok (".../video/7707434976932810004"). Los links cortos no lo traen. */
export function idDeLink(link: unknown): string | null {
  return String(link ?? "").match(/tiktok\.com\/[^\s]*?\/video\/(\d{15,22})/)?.[1] ?? null
}
/** El número de cada video de TikTok lleva adentro el momento en que se subió (sus primeros 32 bits son la hora en segundos). */
function momentoDeId(id: string): Date | null {
  try {
    const seg = Number(BigInt(id) >> BigInt(32))
    const d = new Date(seg * 1000)
    return seg > 1.4e9 && d.getTime() < Date.now() + 864e5 ? d : null
  } catch { return null }
}

export type VideoTT = { link: string; fecha?: unknown; texto?: unknown; vistas?: unknown; me_gusta?: unknown; comentarios?: unknown; compartidos?: unknown }
export type CargaTT = { dia?: string | null; seguidores?: unknown; me_gusta?: unknown; videos?: VideoTT[] }
export type ResultadoTT = { ok: boolean; cuenta: { dia: string; seguidores: number | null; me_gusta: number | null } | null; videos: number; avisos: string[]; error?: string }

/** Lee una planilla (.xlsx o .csv) con un video por renglón. Encabezados que reconoce: link, fecha, descripción o título, reproducciones, me gusta, comentarios, compartidos. */
export function leerPlanillaTikTok(datos: ArrayBuffer | Uint8Array | Buffer): { videos: VideoTT[]; avisos: string[] } {
  const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos)
  // Excel (.xlsx empieza con "PK", .xls con D0 CF) se lee tal cual. Un .csv se lee como texto y sin interpretar nada:
  // si no, "12/11/2026" se tomaría como 11 de diciembre y los acentos de los encabezados se romperían.
  const esExcel = (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf)
  let texto = ""
  if (!esExcel) { try { texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes) } catch { texto = new TextDecoder("windows-1252").decode(bytes) } }
  const wb = esExcel ? XLSX.read(bytes, { type: "array", cellDates: false }) : XLSX.read(texto.replace(/^\ufeff/, ""), { type: "string", raw: true })
  const videos: VideoTT[] = [], avisos: string[] = []
  for (const nombre of wb.SheetNames) {
    const filas: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, raw: true, defval: "" })
    const i = filas.findIndex((f) => f.some((c) => /^(link|url|enlace)\b|video link|link del video/.test(norm(c))))
    if (i < 0) continue
    const cab = filas[i].map(norm)
    const col = (re: RegExp) => cab.findIndex((c) => re.test(c))
    const c = {
      link: col(/^(link|url|enlace)\b|video link|link del video/), fecha: col(/fecha|date|publicad|post time/), texto: col(/descripcion|titulo|title|description|caption|texto/),
      vistas: col(/reproduc|vistas|views|visualiz/), me_gusta: col(/me gusta|likes/), comentarios: col(/comentario|comments/), compartidos: col(/compartid|shares/),
    }
    const de = (f: unknown[], k: keyof typeof c) => (c[k] >= 0 ? f[c[k]] : undefined)
    for (const f of filas.slice(i + 1)) {
      const link = String(de(f, "link") ?? "").trim()
      if (!link) continue
      videos.push({ link, fecha: de(f, "fecha"), texto: de(f, "texto"), vistas: de(f, "vistas"), me_gusta: de(f, "me_gusta"), comentarios: de(f, "comentarios"), compartidos: de(f, "compartidos") })
    }
  }
  if (!videos.length) avisos.push("La planilla no tiene una columna «Link» con los links de los videos.")
  return { videos, avisos }
}

/** Guarda lo cargado. Solo guarda lo que vino escrito: un casillero vacío no pisa un número ya guardado ni se convierte en cero. */
export async function guardarTikTok(c: CargaTT, origen = "carga a mano"): Promise<ResultadoTT> {
  const avisos: string[] = []
  const hoy = hoyAR()
  let cuenta: ResultadoTT["cuenta"] = null
  const seg = numero(c.seguidores), mg = numero(c.me_gusta)
  const escrito = (v: unknown) => v != null && String(v).trim() !== ""
  if (escrito(c.seguidores) && seg == null) avisos.push("Seguidores: no es un número, no se guardó.")
  if (escrito(c.me_gusta) && mg == null) avisos.push("Me gusta de la cuenta: no es un número, no se guardó.")
  if (seg != null || mg != null) {
    const dia = fechaDia(c.dia) ?? hoy
    if (dia > hoy) avisos.push("La fecha del dato es posterior a hoy: no se guardaron los números de la cuenta.")
    else if (dia < TT_CREADA) avisos.push("La fecha del dato es anterior a la creación de la cuenta (12/11/2026): no se guardaron los números de la cuenta.")
    else { await guardarRedDiario("tiktok", [{ dia, seguidores: seg, me_gusta: mg }]); cuenta = { dia, seguidores: seg, me_gusta: mg } }
  }
  const pubs: Partial<Publicacion>[] = []
  for (const [k, v] of (c.videos ?? []).slice(0, 500).entries()) {
    const id = idDeLink(v.link)
    const n = k + 1
    if (!id) { avisos.push(`Video ${n}: el link no es el de un video de TikTok. Tiene que ser el link completo, el que termina en /video/ y un número largo.`); continue }
    const dada = fechaDia(v.fecha)
    if (escrito(v.fecha) && !dada) avisos.push(`Video ${n}: no entendí la fecha «${String(v.fecha).slice(0, 20)}»; se usó la del link.`)
    const subido = momentoDeId(id)
    // Si la fecha escrita coincide con el día que marca el link, se guarda con la hora exacta de subida; si no, manda la fecha escrita (al mediodía)
    const fecha = dada && (!subido || diaAR(subido) !== dada) ? `${dada}T12:00:00-03:00` : subido ? subido.toISOString() : null
    if (dada && dada > hoy) { avisos.push(`Video ${n}: la fecha es posterior a hoy, no se guardó.`); continue }
    if (dada && subido && diaAR(subido) !== dada) avisos.push(`Video ${n}: la fecha escrita no coincide con la que marca el link (${diaAR(subido).split("-").reverse().join("/")}); se guardó la escrita.`)
    const nums = { vistas: numero(v.vistas), me_gusta: numero(v.me_gusta), comentarios: numero(v.comentarios), compartidos: numero(v.compartidos) }
    for (const [campo, nombre] of [["vistas", "reproducciones"], ["me_gusta", "me gusta"], ["comentarios", "comentarios"], ["compartidos", "compartidos"]] as const) {
      if (escrito(v[campo]) && nums[campo] == null) avisos.push(`Video ${n}: «${String(v[campo]).slice(0, 20)}» en ${nombre} no es un número, ese dato no se guardó.`)
    }
    pubs.push({ red: "tiktok", id, fecha, texto: String(v.texto ?? "").trim(), tipo: "Video", url: `${TT_URL}/video/${id}`, ...nums })
  }
  const videos = await guardarPublicaciones(pubs, origen)
  const ok = !!cuenta || videos > 0
  return { ok, cuenta, videos, avisos, error: ok ? undefined : avisos.join(" ") || "No había nada para guardar: escribí al menos los seguidores, los me gusta o un video con su link." }
}

export type DatosTT = {
  /** false = todavía no se cargó nada (ni cuenta ni videos): no hay que mostrar números. */
  hay: boolean
  seguidores: number | null; seguidoresDia: string | null
  meGusta: number | null; meGustaDia: string | null
  serie: { dia: string; seguidores: number | null; me_gusta: number | null }[]
  videos: (Publicacion & { actualizado: string })[]
  /** Última vez que alguien cargó algo. */
  actualizado: string | null
}

/** Lo guardado de TikTok: últimos números de la cuenta, su evolución y los videos cargados. */
export async function tiktok(): Promise<DatosTT> {
  const [dias, videos] = await Promise.all([
    redDiario("tiktok", 400),
    q<Publicacion & { actualizado: string }>(
      `select red, id, to_char(fecha at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') fecha, texto, tipo, url, me_gusta, comentarios, compartidos, alcance, impresiones, vistas, clics, votos, interacciones, origen,
              to_char(actualizado at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') actualizado
       from pc_publicaciones where red='tiktok' order by fecha desc nulls last limit 500`,
    ),
  ])
  const serie = dias.filter((d) => d.seguidores != null || d.me_gusta != null)
  const uSeg = [...serie].reverse().find((d) => d.seguidores != null), uMg = [...serie].reverse().find((d) => d.me_gusta != null)
  const iso = (t: string) => { const d = new Date(t.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")); return Number.isNaN(d.getTime()) ? "" : d.toISOString() }
  const marcas = [...serie.map((d) => iso(d.actualizado)), ...videos.map((v) => iso(v.actualizado))].filter(Boolean).sort()
  return {
    hay: serie.length > 0 || videos.length > 0,
    seguidores: uSeg?.seguidores ?? null, seguidoresDia: uSeg?.dia ?? null,
    meGusta: uMg?.me_gusta ?? null, meGustaDia: uMg?.dia ?? null,
    serie: serie.map((d) => ({ dia: d.dia, seguidores: d.seguidores, me_gusta: d.me_gusta })),
    videos,
    actualizado: marcas[marcas.length - 1] ?? null,
  }
}

/** Canal de TikTok (@devisebit) en Buffer. */
const TT_CANAL_BUFFER = () => process.env.BUFFER_TIKTOK_CHANNEL ?? "6af64ecc62b70b94b0113f3d"
const TT_ORG_BUFFER = () => process.env.BUFFER_ORG_ID ?? "6ad77518fa8d2fdc36836810"

export type SincroTT = { ok: true; videos: number; actualizado: string } | { ok: false; error: string }

/**
 * Trae de Buffer los videos de TikTok ya publicados con sus números y los guarda en pc_publicaciones (red tiktok).
 * Si Buffer da el link del video, se guarda con el número del video, así se junta con lo cargado a mano; si no, con "buf:" + id de Buffer.
 * Un número que Buffer no trae no pisa uno cargado a mano (guardarPublicaciones usa coalesce).
 */
async function sincronizar(): Promise<SincroTT> {
  const consulta = (link: boolean) => `query { posts(first: 100, input: { organizationId: "${TT_ORG_BUFFER()}", filter: { status: [sent], channelIds: ["${TT_CANAL_BUFFER()}"] } }) { edges { node { id text dueAt sentAt ${link ? "externalLink " : ""}metrics { type value } } } } }`
  let d: any
  try { d = await bufferGql(consulta(true)) } catch { d = await bufferGql(consulta(false)) }
  const nodos: any[] = (d?.posts?.edges ?? []).map((e: any) => e?.node).filter(Boolean)
  const pubs: Partial<Publicacion>[] = nodos.map((n) => {
    const m: Record<string, number> = Object.fromEntries((n.metrics ?? []).map((x: any) => [x.type, Number(x.value)]))
    const vid = idDeLink(n.externalLink)
    return {
      red: "tiktok", id: vid ?? "buf:" + n.id, fecha: n.sentAt ?? n.dueAt ?? null, texto: String(n.text ?? "").trim(), tipo: "Video",
      url: vid ? `${TT_URL}/video/${vid}` : n.externalLink ?? null,
      vistas: m.views, me_gusta: m.reactions ?? m.likes, comentarios: m.comments, compartidos: m.shares, alcance: m.reach,
    }
  })
  const videos = await guardarPublicaciones(pubs, "Buffer")
  return { ok: true, videos, actualizado: new Date().toISOString() }
}

const sincronizarCache = unstable_cache(sincronizar, ["pc-tiktok-buffer-v1"], { revalidate: 1800 })

/** Sincroniza los videos de TikTok desde Buffer (como mucho una vez cada 30 minutos). Nunca tira error: si falla, lo devuelve. */
export async function tiktokDesdeBuffer(forzar = false): Promise<SincroTT> {
  if (!linkedinConfigurado()) return { ok: false, error: "sin_clave" }
  try { return await (forzar ? sincronizar() : sincronizarCache()) } catch (e: any) { return { ok: false, error: String(e?.message ?? e).slice(0, 220) } }
}
