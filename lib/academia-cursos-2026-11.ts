import { q, one } from "./db"
import { arsDesdeUsd, edicionPermanente } from "./cursos"
import { CURSOS_2026_11 } from "./academia-cursos-2026-11-datos"

/**
 * Lote de cursos a tu ritmo de ACADEMIA DEVISEBIT (noviembre 2026).
 * Se siembra solo, una única vez, la primera vez que alguien abre la Academia o Sistema Academia después del despliegue
 * (queda anotado en am_semillas: si después se borra o se edita un curso en Sistema Academia, no se pisa ni vuelve).
 * Cada curso queda con una edición permanente "A tu ritmo" (sin fechas ni clases en vivo), así la aprobación
 * depende solo de completar las lecciones (y aprobar el quiz de las lecciones que lo tienen).
 * Precios: USD fijo y pesos con el tipo de cambio de referencia (arsDesdeUsd), editables después en Sistema Academia.
 */
export const LOTE_CURSOS_2026_11 = "cursos-2026-11"

export type LeccionSemilla = { titulo: string; modulo?: string; min?: number; archivo?: string; contenido: string; quiz: { p: string; o: string[]; c: number; e?: string }[] | null }
export type CursoSemilla = {
  slug: string; titulo: string; bajada: string; descripcion: string; categoria: string; nivel: string
  docente: string; docente_slug: string; horas: number; usd: number | null; nuevo?: boolean; destacado?: boolean; nota_interna?: string
  lecciones: LeccionSemilla[]
}

export async function sembrarCursos() {
  const nuevo = await one<{ lote: string }>("insert into am_semillas(lote) values ($1) on conflict do nothing returning lote", [LOTE_CURSOS_2026_11])
  if (!nuevo) return
  try {
    for (const c of CURSOS_2026_11) await sembrarCurso(c)
  } catch (e) {
    // Si algo falla a mitad de camino, se libera el lote para reintentar en la próxima visita (los cursos ya cargados no se duplican).
    await q("delete from am_semillas where lote=$1", [LOTE_CURSOS_2026_11]).catch(() => {})
    throw e
  }
}

async function sembrarCurso(c: CursoSemilla) {
  const ars = c.usd ? arsDesdeUsd(c.usd) : null
  const r = await one<{ id: number }>(
    `insert into am_cursos(slug, titulo, bajada, descripcion, categoria, nivel, docente, docente_slug, horas, modalidad, precio, precio_usd, cuotas,
       estado, req_lecciones, req_asistencia, certifica, destacado, nuevo, videollamada, nota_interna)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'online',$10,$11,$12,'publicado',100,0,true,$13,$14,$15,$16)
     on conflict (slug) do nothing returning id`,
    [c.slug, c.titulo, c.bajada, c.descripcion, c.categoria, c.nivel, c.docente, c.docente_slug, c.horas, ars, c.usd, ars ? 3 : 1,
      !!c.destacado, !!c.nuevo, !!c.usd, c.nota_interna ?? null],
  )
  if (!r) return
  await edicionPermanente(r.id)
  let orden = 0
  for (const l of c.lecciones) {
    await q(
      `insert into am_lecciones(curso_id, orden, modulo, titulo, tipo, contenido, archivo_url, duracion_min, publicada, quiz)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)`,
      [r.id, ++orden, l.modulo ?? null, l.titulo, l.archivo ? "descarga" : "lectura", l.contenido, l.archivo ?? null, l.min ?? null, l.quiz?.length ? JSON.stringify(l.quiz) : null],
    )
  }
}
