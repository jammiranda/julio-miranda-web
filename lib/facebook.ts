import { q } from "./db"

/**
 * Página de Facebook de DEVISEBIT para el Panel de Contenido.
 * El sistema no tiene acceso directo a la API de páginas de Meta: los datos llegan desde Metricool
 * (marca devisebit, red Facebook) por la ingesta POST /api/panel/redes, que corre una tarea programada cada día.
 */
export const FB_PAGINA_ID = "791385181251883"
export const FB_URL = `https://www.facebook.com/${FB_PAGINA_ID}`

export type FilaFB = { dia: string; seguidores?: number | null; nuevos?: number | null; perdidos?: number | null; vistas_pagina?: number | null; vistas_contenido?: number | null; publicaciones?: number | null; interacciones?: number | null }

const num = (v: unknown) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)))

/** Guarda filas diarias (upsert por día: repetir días actualiza los números, no duplica). Un null no pisa un dato ya guardado. */
export async function guardarFacebook(filas: FilaFB[]) {
  let n = 0
  for (const f of filas) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(f.dia ?? ""))) continue
    await q(
      `insert into pc_fb_diario(dia,seguidores,nuevos,perdidos,vistas_pagina,vistas_contenido,publicaciones,interacciones) values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (dia) do update set
         seguidores=coalesce(excluded.seguidores,pc_fb_diario.seguidores), nuevos=coalesce(excluded.nuevos,pc_fb_diario.nuevos), perdidos=coalesce(excluded.perdidos,pc_fb_diario.perdidos),
         vistas_pagina=coalesce(excluded.vistas_pagina,pc_fb_diario.vistas_pagina), vistas_contenido=coalesce(excluded.vistas_contenido,pc_fb_diario.vistas_contenido),
         publicaciones=coalesce(excluded.publicaciones,pc_fb_diario.publicaciones), interacciones=coalesce(excluded.interacciones,pc_fb_diario.interacciones), actualizado=now()`,
      [f.dia, num(f.seguidores), num(f.nuevos), num(f.perdidos), num(f.vistas_pagina), num(f.vistas_contenido), num(f.publicaciones), num(f.interacciones)],
    )
    n++
  }
  return n
}

type Fila = { dia: string; seguidores: number | null; nuevos: number | null; perdidos: number | null; vistas_pagina: number | null; vistas_contenido: number | null; publicaciones: number | null; interacciones: number | null; actualizado: string }

export type DatosFB =
  | { ok: true; seguidores: number | null; crecimiento30: number | null; nuevos30: number; perdidos30: number; vistasPagina30: number; vistasContenido30: number; publicaciones30: number; interacciones30: number; serieSeguidores: number[]; serieVistas: number[]; desde: string; actualizado: string; dias: Fila[] }
  | { ok: false; error: string }

/** Resumen de los últimos 30 días a partir de lo guardado. */
export async function facebook(): Promise<DatosFB> {
  try {
    const filas = await q<Fila>(`select to_char(dia,'YYYY-MM-DD') dia, seguidores, nuevos, perdidos, vistas_pagina, vistas_contenido, publicaciones, interacciones, actualizado::text from pc_fb_diario where dia > current_date - 30 order by dia`)
    if (!filas.length) return { ok: false, error: "Todavía no llegaron datos de Facebook (se cargan cada día desde Metricool)." }
    const conSeg = filas.filter((f) => f.seguidores != null)
    const suma = (k: keyof Fila) => filas.reduce((s, f) => s + (Number(f[k]) || 0), 0)
    const ultimo = conSeg[conSeg.length - 1]?.seguidores ?? null
    const primero = conSeg[0]?.seguidores ?? null
    return {
      ok: true,
      seguidores: ultimo,
      crecimiento30: ultimo != null && primero != null && conSeg.length > 1 ? ultimo - primero : null,
      nuevos30: suma("nuevos"),
      perdidos30: suma("perdidos"),
      vistasPagina30: suma("vistas_pagina"),
      vistasContenido30: suma("vistas_contenido"),
      publicaciones30: suma("publicaciones"),
      interacciones30: suma("interacciones"),
      serieSeguidores: conSeg.map((f) => Number(f.seguidores)),
      serieVistas: filas.map((f) => Number(f.vistas_contenido ?? 0)),
      desde: conSeg[0]?.dia ?? filas[0].dia,
      actualizado: filas.reduce((m, f) => (f.actualizado > m ? f.actualizado : m), ""),
      dias: filas,
    }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e).slice(0, 200) }
  }
}
