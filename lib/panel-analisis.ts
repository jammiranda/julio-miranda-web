import { q } from "./db"
import { safe } from "./panel"
import { interacciones, type Publicacion } from "./publicaciones"

/**
 * Cálculos del Análisis del Panel de Contenido.
 * Reglas: ningún número sin fuente, un solo criterio de conteo, y ningún "mejor" sin muestra suficiente.
 */
export const TZ = "America/Argentina/Buenos_Aires"
export const DIAS_OPCIONES = [7, 30, 90] as const
export const MUESTRA_MIN = 5
const DIA = 864e5

export function diasDe(v?: string): number {
  const n = Number(v)
  return (DIAS_OPCIONES as readonly number[]).includes(n) ? n : 30
}

/** Edad en días de una fecha ISO (null si no hay fecha). */
export const edadDias = (iso: string | null | undefined, ahora = Date.now()) => (iso ? (ahora - new Date(iso).getTime()) / DIA : null)

/** ¿La fecha cae dentro de [hasta, desde) días atrás? (0, 30) = últimos 30 días; (30, 60) = los 30 anteriores. */
export function enVentana(iso: string | null | undefined, desde: number, hasta = 0, ahora = Date.now()) {
  const e = edadDias(iso, ahora)
  return e != null && e >= hasta && e < desde
}

/** "YYYY-MM-DD" de hace `dias` días, en hora de Argentina (para comparar con columnas de tipo date). */
export function diaHace(dias: number, ahora = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ahora - dias * DIA))
}

/* ───────────── Formatos ───────────── */

const FORMATOS: Record<string, string> = {
  image: "Imagen", photo: "Imagen", foto: "Imagen", imagen: "Imagen",
  carousel_album: "Carrusel", carousel: "Carrusel", album: "Carrusel", carrusel: "Carrusel", documento: "Carrusel", document: "Carrusel",
  video: "Video", reel: "Video", reels: "Video",
  short: "Short", shorts: "Short",
  status: "Texto", texto: "Texto", text: "Texto",
  link: "Enlace", enlace: "Enlace", article: "Enlace", articulo: "Enlace", artículo: "Enlace",
  encuesta: "Encuesta", poll: "Encuesta",
  "publicación": "Publicación simple", publicacion: "Publicación simple", post: "Publicación simple",
}

/** Nombre único de formato, sin importar cómo lo llame cada red. Nunca devuelve "—". */
export function formatoDe(red: string, tipo: string | null | undefined): string {
  const t = (tipo ?? "").trim().toLowerCase()
  if (t && FORMATOS[t]) return FORMATOS[t]
  if (t) return t.charAt(0).toUpperCase() + t.slice(1)
  if (red === "youtube_post") return "Publicación de comunidad"
  return "Sin clasificar"
}

/* ───────────── Estadística con muestra ───────────── */

export type Grupo = { k: string; n: number; media: number; mediana: number; indice: number | null; total: number; concentracion: number | null; poca: boolean }

const media = (v: number[]) => (v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0)
function mediana(v: number[]) {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Agrupa publicaciones y calcula, por grupo, promedio, mediana, cantidad y un índice de rendimiento.
 * El índice compara cada publicación con el promedio de SU red (1,0 = promedio de su cuenta), así una cuenta con más
 * audiencia no tapa a las otras. `concentracion` = qué parte de las interacciones del grupo viene de una sola publicación.
 */
export function agrupar(posts: Publicacion[], clave: (p: Publicacion) => string, orden?: string[]): Grupo[] {
  const porRed = new Map<string, number>()
  for (const r of new Set(posts.map((p) => p.red))) porRed.set(r, media(posts.filter((p) => p.red === r).map(interacciones)))
  const claves = orden ?? [...new Set(posts.map(clave))]
  return claves.map((k) => {
    const g = posts.filter((p) => clave(p) === k)
    const v = g.map(interacciones)
    const total = v.reduce((a, x) => a + x, 0)
    const idx = g.map((p) => { const base = porRed.get(p.red) ?? 0; return base > 0 ? interacciones(p) / base : null }).filter((x): x is number => x != null)
    return { k, n: g.length, media: media(v), mediana: mediana(v), indice: idx.length ? media(idx) : null, total, concentracion: total > 0 ? Math.max(...v) / total : null, poca: g.length < MUESTRA_MIN }
  }).filter((x) => x.n > 0)
}

/** El mejor grupo solo si hay muestra suficiente (≥5 publicaciones) en al menos dos grupos; si no, null. */
export function mejorGrupo(gs: Grupo[]): Grupo | null {
  const ok = gs.filter((g) => !g.poca && g.indice != null && g.k !== "Sin clasificar")
  if (ok.length < 2) return null
  return [...ok].sort((a, b) => (b.indice ?? 0) - (a.indice ?? 0))[0]
}

/* ───────────── Datos de base ───────────── */

export type FilaFBDia = { dia: string; seguidores: number | null; nuevos: number | null; perdidos: number | null; vistas_pagina: number | null; vistas_contenido: number | null; publicaciones: number | null; interacciones: number | null }

/** Filas diarias de Facebook (Metricool) de los últimos `dias` días. */
export function fbDiario(dias: number) {
  return q<FilaFBDia>(`select to_char(dia,'YYYY-MM-DD') dia, seguidores, nuevos, perdidos, vistas_pagina, vistas_contenido, publicaciones, interacciones from pc_fb_diario where dia > current_date - $1::int order by dia`, [dias])
}

export type Negocio = {
  visitas: { dia: string; c: number }[]
  consultas: { dia: string; c: number; a: number; g: number }[]
  porCanal: { k: string; c: number }[]
  porFuente: { k: string; c: number }[]
  /** Primer día con datos (para saber si hay un período anterior con el que comparar). */
  primeraVisita: string | null
  primeraConsulta: string | null
}

/** Visitas y consultas de los últimos 2×`dias` días (período actual + anterior) y su desglose por canal y fuente del período actual. */
export async function negocioPeriodo(dias: number): Promise<Negocio | null> {
  const E = "devisebit"
  const [vis, cons, canal, fuente, desde] = await Promise.all([
    safe(q<{ dia: string; c: number }>(`select to_char(dia,'YYYY-MM-DD') dia, sum(n)::int c from pv_visitas where dia > current_date - $1::int group by dia order by dia`, [dias * 2])),
    safe(q<{ dia: string; c: number; a: number; g: number }>(
      `select to_char(creado at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD') dia, count(*)::int c,
              count(*) filter (where estado in ('contactada','calificada','convertida'))::int a, count(*) filter (where estado='convertida')::int g
       from consultas where empresa=$1 and creado > now() - ($2::int || ' days')::interval group by 1 order by 1`, [E, dias * 2])),
    safe(q<{ k: string; c: number }>(`select coalesce(canal,'otro') k, count(*)::int c from consultas where empresa=$1 and creado > now() - ($2::int || ' days')::interval group by 1 order by 2 desc limit 6`, [E, dias])),
    safe(q<{ k: string; c: number }>(`select coalesce(nullif(fuente,''),'sin dato') k, count(*)::int c from consultas where empresa=$1 and creado > now() - ($2::int || ' days')::interval group by 1 order by 2 desc limit 6`, [E, dias])),
    safe(q<{ v: string | null; c: string | null }>(`select (select to_char(min(dia),'YYYY-MM-DD') from pv_visitas) v, (select to_char(min(creado at time zone 'America/Argentina/Buenos_Aires'),'YYYY-MM-DD') from consultas where empresa=$1) c`, [E])),
  ])
  if (!vis && !cons) return null
  return { visitas: vis ?? [], consultas: cons ?? [], porCanal: canal ?? [], porFuente: fuente ?? [], primeraVisita: desde?.[0]?.v ?? null, primeraConsulta: desde?.[0]?.c ?? null }
}

/** ¿Los datos empiezan lo bastante atrás como para cubrir el período anterior (2×`dias`)? Tolera 3 días de margen. */
export function cubrePrevio(primerDia: string | null | undefined, dias: number, ahora = Date.now()) {
  return !!primerDia && primerDia <= diaHace(dias * 2 - 3, ahora)
}

/** Suma una columna sobre las filas de día que caen en [hasta, desde) días atrás (según su fecha "YYYY-MM-DD"). */
export function sumaDias<T extends { dia: string }>(filas: T[], campo: (f: T) => number | null | undefined, desde: number, hasta = 0, ahora = Date.now()) {
  const ini = diaHace(desde, ahora), fin = diaHace(hasta, ahora)
  let hay = false, s = 0
  for (const f of filas) {
    if (f.dia > ini && f.dia <= fin) { const v = campo(f); if (v != null) { hay = true; s += Number(v) } }
  }
  return hay ? s : null
}

/** Variación de seguidores en una ventana de una serie diaria ascendente (primer y último valor dentro de la ventana). */
export function crecimientoSerie(serie: { dia: string; seguidores: number | null }[], dias: number, ahora = Date.now()) {
  const ini = diaHace(dias, ahora)
  const v = serie.filter((x) => x.dia >= ini && x.seguidores != null)
  if (v.length < 2) return { valor: null as number | null, desde: null as string | null }
  return { valor: Number(v[v.length - 1].seguidores) - Number(v[0].seguidores), desde: v[0].dia }
}
