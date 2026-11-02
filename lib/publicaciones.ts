import { q } from "./db"

/**
 * Historial de publicaciones de todas las redes de DEVISEBIT (y del LinkedIn personal de Julio).
 * Cada fuente guarda acá lo que ve (upsert por red + id), así el historial queda aunque la API después solo muestre lo último:
 * - instagram: API de Instagram (cron diario y al abrir Publicaciones).
 * - facebook: Metricool, por la tarea diaria (POST /api/panel/redes).
 * - youtube (videos) y youtube_post (pestaña Publicaciones del canal): feed/página pública o la tarea diaria.
 * - linkedin (página) y linkedin_julio (perfil de Julio): Buffer y las exportaciones de LinkedIn.
 * Las publicaciones de la exportación de la página (li_publicaciones) se suman al leer.
 */
export const REDES: Record<string, { nombre: string; color: string }> = {
  instagram: { nombre: "Instagram", color: "var(--ig)" },
  facebook: { nombre: "Facebook", color: "var(--fb)" },
  youtube: { nombre: "YouTube · videos", color: "var(--yt)" },
  youtube_post: { nombre: "YouTube · publicaciones", color: "var(--yt)" },
  linkedin: { nombre: "LinkedIn DEVISEBIT", color: "var(--li)" },
  linkedin_julio: { nombre: "LinkedIn Julio", color: "var(--li)" },
}

export type Publicacion = {
  red: string; id: string; fecha: string | null; texto: string; tipo: string | null; url: string | null
  me_gusta: number | null; comentarios: number | null; compartidos: number | null; alcance: number | null; impresiones: number | null; vistas: number | null; clics: number | null; votos: number | null; interacciones?: number | null
  origen?: string | null
}

const n = (v: unknown) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)))

/** Upsert masivo. La fecha que ya estaba no se pisa; un número null no borra uno guardado. */
export async function guardarPublicaciones(pubs: Partial<Publicacion>[], origen: string) {
  const filas = pubs.filter((p) => p.red && p.id).slice(0, 1000).map((p) => ({
    red: String(p.red), id: String(p.id), fecha: p.fecha || null, texto: String(p.texto ?? "").slice(0, 3000), tipo: p.tipo ?? null, url: p.url ?? null,
    me_gusta: n(p.me_gusta), comentarios: n(p.comentarios), compartidos: n(p.compartidos), alcance: n(p.alcance), impresiones: n(p.impresiones), vistas: n(p.vistas), clics: n(p.clics), votos: n(p.votos), interacciones: n(p.interacciones), origen,
  }))
  if (!filas.length) return 0
  await q(
    `insert into pc_publicaciones(red,id,fecha,texto,tipo,url,me_gusta,comentarios,compartidos,alcance,impresiones,vistas,clics,votos,interacciones,origen)
     select red,id,fecha,texto,tipo,url,me_gusta,comentarios,compartidos,alcance,impresiones,vistas,clics,votos,interacciones,origen
     from jsonb_to_recordset($1::jsonb) as x(red text, id text, fecha timestamptz, texto text, tipo text, url text, me_gusta int, comentarios int, compartidos int, alcance int, impresiones int, vistas int, clics int, votos int, interacciones int, origen text)
     on conflict (red,id) do update set
       fecha=coalesce(pc_publicaciones.fecha, excluded.fecha),
       texto=case when excluded.texto <> '' then excluded.texto else pc_publicaciones.texto end,
       tipo=coalesce(excluded.tipo, pc_publicaciones.tipo), url=coalesce(excluded.url, pc_publicaciones.url),
       me_gusta=coalesce(excluded.me_gusta, pc_publicaciones.me_gusta), comentarios=coalesce(excluded.comentarios, pc_publicaciones.comentarios),
       compartidos=coalesce(excluded.compartidos, pc_publicaciones.compartidos), alcance=coalesce(excluded.alcance, pc_publicaciones.alcance),
       impresiones=coalesce(excluded.impresiones, pc_publicaciones.impresiones), vistas=coalesce(excluded.vistas, pc_publicaciones.vistas),
       clics=coalesce(excluded.clics, pc_publicaciones.clics), votos=coalesce(excluded.votos, pc_publicaciones.votos), interacciones=coalesce(excluded.interacciones, pc_publicaciones.interacciones),
       origen=excluded.origen, actualizado=now()`,
    [JSON.stringify(filas)],
  )
  return filas.length
}

/** "hace 3 días" / "hace 2 semanas" → fecha aproximada (para las publicaciones de YouTube, que no traen fecha exacta). */
export function fechaDesdeHace(t: string, ahora = Date.now()): string | null {
  const m = (t ?? "").toLowerCase().match(/(\d+)\s*(segundo|minuto|hora|día|dia|semana|mes|año|ano|second|minute|hour|day|week|month|year)/)
  if (!m) return null
  const k = m[2]
  const ms = /seg|sec/.test(k) ? 1e3 : /min/.test(k) ? 6e4 : /hora|hour/.test(k) ? 36e5 : /d[ií]a|day/.test(k) ? 864e5 : /semana|week/.test(k) ? 7 * 864e5 : /mes|month/.test(k) ? 30 * 864e5 : 365 * 864e5
  return new Date(ahora - Number(m[1]) * ms).toISOString()
}

/** Historial completo (todas las redes), lo más nuevo primero. */
export async function historial(dias = 3650): Promise<Publicacion[]> {
  return q<Publicacion>(
    `select * from (
       select red, id, to_char(fecha at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') fecha, texto, tipo, url, me_gusta, comentarios, compartidos, alcance, impresiones, vistas, clics, votos, interacciones, origen from pc_publicaciones
       union all
       select 'linkedin', 'li:' || clave, to_char(fecha,'YYYY-MM-DD"T15:00:00Z"'), coalesce(titulo,''), tipo, link, reacciones, comentarios, compartidos, null, impresiones, vistas, clics, null, null, 'exportación de LinkedIn'
       from li_publicaciones where not exists (select 1 from pc_publicaciones p where p.red='linkedin' and p.url is not null and p.url = li_publicaciones.link)
     ) t where fecha is null or fecha::timestamptz > now() - ($1::int || ' days')::interval
     order by fecha desc nulls last limit 2000`,
    [dias],
  )
}

/** Interacciones de una publicación (lo que cada red cuenta como tal). */
export const interacciones = (p: Publicacion) => p.interacciones ?? (p.me_gusta ?? 0) + (p.comentarios ?? 0) + (p.compartidos ?? 0) + (p.votos ?? 0) + (p.clics ?? 0)

/** Serie diaria guardada de una red (seguidores, impresiones, etc.). */
export type FilaRed = { dia: string; seguidores?: number | null; nuevos?: number | null; impresiones?: number | null; alcance?: number | null; interacciones?: number | null; publicaciones?: number | null }
export async function guardarRedDiario(red: string, filas: FilaRed[]) {
  const ok = filas.filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(String(f.dia ?? ""))).slice(0, 2000).map((f) => ({ red, dia: f.dia, seguidores: n(f.seguidores), nuevos: n(f.nuevos), impresiones: n(f.impresiones), alcance: n(f.alcance), interacciones: n(f.interacciones), publicaciones: n(f.publicaciones) }))
  if (!ok.length) return 0
  await q(
    `insert into pc_red_diario(red,dia,seguidores,nuevos,impresiones,alcance,interacciones,publicaciones)
     select red,dia,seguidores,nuevos,impresiones,alcance,interacciones,publicaciones from jsonb_to_recordset($1::jsonb) as x(red text, dia date, seguidores int, nuevos int, impresiones int, alcance int, interacciones int, publicaciones int)
     on conflict (red,dia) do update set seguidores=coalesce(excluded.seguidores,pc_red_diario.seguidores), nuevos=coalesce(excluded.nuevos,pc_red_diario.nuevos),
       impresiones=coalesce(excluded.impresiones,pc_red_diario.impresiones), alcance=coalesce(excluded.alcance,pc_red_diario.alcance),
       interacciones=coalesce(excluded.interacciones,pc_red_diario.interacciones), publicaciones=coalesce(excluded.publicaciones,pc_red_diario.publicaciones), actualizado=now()`,
    [JSON.stringify(ok)],
  )
  return ok.length
}
export function redDiario(red: string, dias = 365) {
  return q<{ dia: string; seguidores: number | null; nuevos: number | null; impresiones: number | null; alcance: number | null; interacciones: number | null; publicaciones: number | null; actualizado: string }>(
    `select to_char(dia,'YYYY-MM-DD') dia, seguidores, nuevos, impresiones, alcance, interacciones, publicaciones, actualizado::text from pc_red_diario where red=$1 and dia > current_date - $2::int order by dia`,
    [red, dias],
  )
}
