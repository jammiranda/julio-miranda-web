"use server"
import { redirect } from "next/navigation"
import { q, one, audit } from "./db"
import { notificar } from "./push"
import { requerirAutor, cursoDe, quien, registrarCambio, diferencias, leerCurso, leerLeccion, CAMPOS_CURSO, CAMPOS_LECCION, idsCursos, type Autor } from "./autores"

/**
 * Acciones del panel de autor (academia.devisebit.com/autor). Cada una vuelve a validar la sesión y que el curso
 * (o la lección, o la inscripción) sea de un curso del autor: nunca se confía en el id que llega del formulario.
 */

const ESTADOS = ["borrador", "publicado", "archivado"] as const

/** Aviso a Dirección, uno por curso y autor cada 2 horas (para no llenar la bandeja con cada guardado). */
async function avisar(a: Autor, cursoId: number, titulo: string, texto: string, siempre = false) {
  if (!siempre) {
    const r = await one<{ n: number }>("select count(*)::int n from am_cambios_autor where curso_id=$1 and autor=$2 and creado > now() - interval '2 hours'", [cursoId, a.email])
    if ((r?.n ?? 0) > 1) return
  }
  await notificar(["gerente"], titulo, texto, "/sistema/autores").catch(() => {})
}

/** Textos del curso: título, bajada, descripción y nivel. Nada de precio, estado, docentes, slug ni requisitos. */
export async function guardarCursoAutor(fd: FormData) {
  const a = await requerirAutor()
  const id = Number(fd.get("id"))
  const c = await cursoDe(a, id)
  if (!c) redirect("/autor")
  const v = leerCurso(fd)
  if (!v.titulo) redirect(`/autor/cursos/${id}?err=titulo`)
  const cambios = diferencias(c, v, CAMPOS_CURSO)
  if (!cambios.length) redirect(`/autor/cursos/${id}?ok=sin`)
  await q("update am_cursos set titulo=$1, bajada=$2, descripcion=$3, nivel=$4, actualizado=now() where id=$5", [v.titulo, v.bajada, v.descripcion, v.nivel, id])
  const antes = Object.fromEntries(CAMPOS_CURSO.map((k) => [k, c[k]]))
  await registrarCambio(a, { curso: id, tipo: "curso", resumen: `Editó ${cambios.join(", ")} del curso`, antes, despues: v })
  await audit(quien(a), "autor_edita_curso", "am_curso", id, cambios.join(","))
  await avisar(a, id, "✏️ Un autor editó su curso", `${a.nombre} · ${v.titulo}: ${cambios.join(", ")}. Revisalo en Autores.`)
  redirect(`/autor/cursos/${id}?ok=1`)
}

/** Alta, edición, orden y visibilidad de lecciones. No hay borrado: se ocultan (y Dirección puede borrar o revertir). */
export async function leccionAutor(fd: FormData) {
  const a = await requerirAutor()
  const id = Number(fd.get("id")), lid = Number(fd.get("lid") || 0)
  const c = await cursoDe(a, id)
  if (!c) redirect("/autor")
  const op = String(fd.get("op") ?? "guardar")
  const ant = lid ? await one<any>("select * from am_lecciones where id=$1 and curso_id=$2", [lid, id]) : null
  if (lid && !ant) redirect(`/autor/cursos/${id}#lecciones`)

  if (op === "subir" || op === "bajar") {
    const l = await q<{ id: number }>("select id from am_lecciones where curso_id=$1 order by orden, id", [id])
    const k = l.findIndex((x) => x.id === lid), j = op === "subir" ? k - 1 : k + 1
    if (k >= 0 && j >= 0 && j < l.length) {
      ;[l[k], l[j]] = [l[j], l[k]]
      for (const [i, x] of l.entries()) await q("update am_lecciones set orden=$1 where id=$2 and curso_id=$3", [i + 1, x.id, id])
      await registrarCambio(a, { curso: id, leccion: lid, tipo: "leccion_orden", resumen: `Movió «${ant.titulo}» hacia ${op === "subir" ? "arriba" : "abajo"}` })
    }
    redirect(`/autor/cursos/${id}#lecciones`)
  }
  if (op === "ocultar" || op === "mostrar") {
    const pub = op === "mostrar"
    await q("update am_lecciones set publicada=$1 where id=$2 and curso_id=$3", [pub, lid, id])
    await registrarCambio(a, { curso: id, leccion: lid, tipo: "leccion", resumen: `${pub ? "Mostró" : "Ocultó"} la lección «${ant.titulo}»`, antes: Object.fromEntries(CAMPOS_LECCION.map((k) => [k, ant[k]])), despues: { ...Object.fromEntries(CAMPOS_LECCION.map((k) => [k, ant[k]])), publicada: pub } })
    await audit(quien(a), "autor_visibilidad_leccion", "am_leccion", lid, pub ? "visible" : "oculta")
    redirect(`/autor/cursos/${id}?lok=1#lecciones`)
  }

  const v = leerLeccion(fd, ant)
  if (!v.titulo) redirect(`/autor/cursos/${id}?lerr=titulo${lid ? `&editar=${lid}` : ""}#editor`)
  if (v.quizInvalido) redirect(`/autor/cursos/${id}?lerr=quiz${lid ? `&editar=${lid}` : ""}#editor`)
  const vals = [v.modulo, v.titulo, v.tipo, v.contenido, v.video_url, v.archivo_url, v.duracion_min, v.publicada, v.quiz ? JSON.stringify(v.quiz) : null]
  const despues = Object.fromEntries(CAMPOS_LECCION.map((k) => [k, (v as any)[k]]))
  if (ant) {
    const antes = Object.fromEntries(CAMPOS_LECCION.map((k) => [k, ant[k]]))
    const cambios = diferencias(antes, despues, CAMPOS_LECCION)
    if (!cambios.length) redirect(`/autor/cursos/${id}?lok=sin#lecciones`)
    await q("update am_lecciones set modulo=$1, titulo=$2, tipo=$3, contenido=$4, video_url=$5, archivo_url=$6, duracion_min=$7, publicada=$8, quiz=$9 where id=$10 and curso_id=$11", [...vals, lid, id])
    await registrarCambio(a, { curso: id, leccion: lid, tipo: "leccion", resumen: `Editó la lección «${v.titulo}»: ${cambios.join(", ")}`, antes, despues })
    await audit(quien(a), "autor_edita_leccion", "am_leccion", lid, cambios.join(","))
  } else {
    const r = await one<{ id: number }>(
      "insert into am_lecciones(curso_id, orden, modulo, titulo, tipo, contenido, video_url, archivo_url, duracion_min, publicada, quiz) values ($1, coalesce((select max(orden) from am_lecciones where curso_id=$1),0)+1, $2,$3,$4,$5,$6,$7,$8,$9,$10) returning id",
      [id, ...vals],
    )
    await registrarCambio(a, { curso: id, leccion: r!.id, tipo: "leccion_nueva", resumen: `Agregó la lección «${v.titulo}»`, despues })
    await audit(quien(a), "autor_crea_leccion", "am_leccion", r!.id, v.titulo!)
  }
  await avisar(a, id, "✏️ Un autor editó su curso", `${a.nombre} · ${c.titulo}: lecciones. Revisalo en Autores.`)
  redirect(`/autor/cursos/${id}?lok=1#lecciones`)
}

/** Pedido de cambio de estado (publicar, borrador, archivar): no se aplica; lo aprueba Dirección. */
export async function pedirEstadoAutor(fd: FormData) {
  const a = await requerirAutor()
  const id = Number(fd.get("id"))
  const c = await cursoDe(a, id)
  if (!c) redirect("/autor")
  const est = String(fd.get("estado"))
  if (!ESTADOS.includes(est as any) || est === c.estado) redirect(`/autor/cursos/${id}`)
  const motivo = String(fd.get("motivo") ?? "").trim().slice(0, 500) || null
  // Un solo pedido abierto por curso: el nuevo reemplaza al anterior.
  await q("update am_cambios_autor set estado='rechazado', revisado_por='reemplazado', revisado_en=now() where curso_id=$1 and tipo='pedido_estado' and estado='pendiente'", [id])
  await registrarCambio(a, { curso: id, tipo: "pedido_estado", resumen: `Pide pasar el curso a «${est}»${motivo ? `: ${motivo}` : ""}`, antes: { estado: c.estado }, despues: { estado: est, motivo } })
  await audit(quien(a), "autor_pide_estado", "am_curso", id, est)
  await avisar(a, id, "📣 Un autor pide cambiar el estado de su curso", `${a.nombre} · ${c.titulo}: ${c.estado} → ${est}. Aprobalo o rechazalo en Autores.`, true)
  redirect(`/autor/cursos/${id}?pedido=1`)
}

/** El autor marca cómo salió la videollamada y deja una nota (solo de alumnos de sus cursos). */
export async function videollamadaAutor(fd: FormData) {
  const a = await requerirAutor()
  const iid = Number(fd.get("iid"))
  const ids = await idsCursos(a)
  const i = await one<{ id: number; consulta: number | null }>(
    `select i.id, i.videollamada_consulta consulta from am_inscripciones i join am_ediciones e on e.id=i.edicion_id
     where i.id=$1 and e.curso_id = any($2::int[]) and i.videollamada_en is not null`, [iid, ids])
  if (!i) redirect("/autor/videollamadas")
  const est = String(fd.get("estado") ?? "")
  if (["realizada", "no_asistio"].includes(est) && i.consulta) {
    const rid = Number(fd.get("rid"))
    await q("update db_reuniones set estado=$1 where id=$2 and consulta_id=$3 and estado in ('confirmada','realizada','no_asistio')", [est, rid, i.consulta])
    await audit(quien(a), "autor_videollamada", "db_reunion", rid, est)
  }
  if (fd.has("nota")) await q("update am_inscripciones set videollamada_nota=$1 where id=$2", [String(fd.get("nota") ?? "").trim().slice(0, 1000) || null, iid])
  redirect(`/autor/videollamadas?ok=${iid}#v${iid}`)
}
