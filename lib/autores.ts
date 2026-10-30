import { redirect } from "next/navigation"
import { q, one, audit } from "./db"
import { sesionCuenta, conDestino, rutaActual, crearCuenta, crearAcceso } from "./portal"
import { EQUIPO } from "./equipo"
import { URL_ACADEMIA } from "./academia"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { quizDe, TIPOS_LECCION } from "./cursos"

/**
 * Autores (docentes) de ACADEMIA DEVISEBIT.
 *
 * - Un autor es una persona con cuenta DEVISEBIT (la misma del alumno: email + código o link, cookie db_cuenta)
 *   que además figura en am_autores con uno o más docente_slug (los perfiles de /equipo).
 * - Entra a academia.devisebit.com/autor y ve SOLO los cursos cuyo am_cursos.docente_slug incluye alguno de sus slugs.
 * - No tiene sesión del equipo (db_sesion): el panel, el sistema comercial y el Sistema Academia le piden login.
 * - Edita contenido (textos, lecciones, quiz, materiales). Precio, cuotas, docentes, slug y requisitos quedan fijos.
 *   Publicar, pasar a borrador o archivar es un pedido que Dirección aprueba en /sistema/autores.
 * - Cada cambio queda en am_cambios_autor con el "antes", para que Dirección lo revise o lo revierta.
 */

export type Autor = { contacto: number; nombre: string; email: string; slugs: string[] }

const limpio = (e: string) => e.trim().toLowerCase()
export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Perfiles de /equipo que pueden ser autores (para el alta). */
export const PERFILES_DOCENTES = EQUIPO.map((p) => ({ slug: p.slug, nombre: p.nombre }))
export const esSlugDocente = (v: string) => PERFILES_DOCENTES.some((p) => p.slug === v)

/** Slugs activos de un email (vacío si no es autor). */
export async function slugsDe(email: string) {
  const l = await q<{ docente_slug: string }>("select docente_slug from am_autores where lower(email)=$1 and activo order by docente_slug", [limpio(email)])
  return l.map((x) => x.docente_slug)
}

/** El autor de la sesión actual: null si no hay sesión, "no" si la cuenta no es de un autor activo. */
export async function autorActual(): Promise<Autor | null | "no"> {
  const c = await sesionCuenta().catch(() => null)
  if (!c) return null
  const slugs = await slugsDe(c.email)
  if (!slugs.length) return "no"
  return { contacto: c.id, nombre: c.nombre, email: limpio(c.email), slugs }
}

/** Guard de todas las páginas y acciones del autor. Sin sesión → ingreso; sesión sin permiso de autor → pantalla de acceso denegado. */
export async function requerirAutor(): Promise<Autor> {
  const a = await autorActual()
  if (!a) redirect(conDestino("/mi-cuenta/entrar", rutaActual() || "/autor"))
  if (a === "no") redirect("/autor/sin-acceso")
  return a
}

export const quien = (a: Autor) => ({ id: 0, usuario: `autor:${a.email}` })

/** Condición SQL "el curso es de este autor": docente_slug es una lista separada por comas. $N = text[] con los slugs. */
const DEL_AUTOR = (n: number) => `string_to_array(replace(coalesce(c.docente_slug,''),' ',''),',') && $${n}::text[]`

export async function cursosDe(a: Autor) {
  return await q<any>(
    `select c.id, c.slug, c.titulo, c.bajada, c.estado, c.modalidad, c.horas, c.precio, c.docente, c.actualizado,
       (select count(*)::int from am_lecciones l where l.curso_id=c.id) lecciones,
       (select count(*)::int from am_lecciones l where l.curso_id=c.id and l.publicada) visibles,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado<>'baja') alumnos,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado='aprobado') aprobados,
       (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.videollamada_en is not null) videollamadas,
       (select count(*)::int from am_cambios_autor x where x.curso_id=c.id and x.estado='pendiente') pendientes,
       (select x.despues->>'estado' from am_cambios_autor x where x.curso_id=c.id and x.tipo='pedido_estado' and x.estado='pendiente' order by x.id desc limit 1) pedido_estado
     from am_cursos c where ${DEL_AUTOR(1)} order by c.estado='archivado', c.titulo`,
    [a.slugs],
  )
}

/** El curso, solo si es del autor (si no, null: la página responde como si no existiera). */
export async function cursoDe(a: Autor, id: number) {
  if (!Number.isInteger(id) || id <= 0) return null
  return await one<any>(`select c.* from am_cursos c where c.id=$2 and ${DEL_AUTOR(1)}`, [a.slugs, id])
}

/** Ids de los cursos del autor. */
export async function idsCursos(a: Autor) {
  return (await q<{ id: number }>(`select c.id from am_cursos c where ${DEL_AUTOR(1)}`, [a.slugs])).map((x) => x.id)
}

/**
 * Alumnos de los cursos del autor. Ley 25.326 (minimización): solo nombre, email y avance.
 * Nada de teléfono, organización, pagos, notas internas ni datos del CRM.
 */
export async function alumnosDe(a: Autor, cursoId?: number | null) {
  const ids = await idsCursos(a)
  const filtro = cursoId && ids.includes(cursoId) ? [cursoId] : ids
  if (!filtro.length) return []
  return await q<any>(
    `select i.id, k.nombre, k.email, i.estado, i.creado, i.ultima_actividad, i.aprobado_en, c.id curso_id, c.titulo, e.nombre edicion,
       (select count(*)::int from am_lecciones l where l.curso_id=c.id and l.publicada) lecciones,
       (select count(*)::int from am_progreso p join am_lecciones l on l.id=p.leccion_id and l.publicada where p.inscripcion_id=i.id) hechas,
       exists (select 1 from am_certificados ce where ce.inscripcion_id=i.id and not ce.anulado) certificado
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id join db_contactos k on k.id=i.contacto_id
     where c.id = any($1::int[]) and i.estado<>'baja'
     order by c.titulo, i.estado='aprobado', coalesce(i.ultima_actividad, i.creado) desc`,
    [filtro],
  )
}

/** Videollamadas pedidas por alumnos de sus cursos, con el último turno reservado (si hay). */
export async function videollamadasDe(a: Autor) {
  const ids = await idsCursos(a)
  if (!ids.length) return []
  return await q<any>(
    `select i.id iid, k.nombre, k.email, c.id curso_id, c.titulo, i.videollamada_en, i.videollamada_nota, co.mensaje,
       r.id rid, r.inicio, r.fin, r.estado restado, r.modalidad, r.link
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id join db_contactos k on k.id=i.contacto_id
     left join consultas co on co.id=i.videollamada_consulta
     left join lateral (select r.* from db_reuniones r where i.videollamada_consulta is not null and r.consulta_id=i.videollamada_consulta order by r.inicio desc limit 1) r on true
     where c.id = any($1::int[]) and i.videollamada_en is not null and i.estado<>'baja'
     order by (r.id is null or (r.estado='confirmada')) desc, coalesce(r.inicio, i.videollamada_en) desc`,
    [ids],
  )
}

/** Lo que el alumno escribió al pedir la videollamada ("Quiere hablar de: …"), sin el resto del registro del CRM. */
export const temaDe = (mensaje: string | null | undefined) => mensaje?.match(/Quiere hablar de: ([\s\S]*)$/)?.[1]?.trim() || null

export const ESTADOS_VIDEO: Record<string, { n: string; c: string }> = {
  pedida: { n: "Pedida · falta elegir horario", c: "bg-amber-50 text-amber-800" },
  agendada: { n: "Agendada", c: "bg-sky-50 text-sky-800" },
  pasada: { n: "Ya pasó · marcá cómo salió", c: "bg-amber-50 text-amber-800" },
  realizada: { n: "Realizada", c: "bg-emerald-50 text-emerald-800" },
  no_asistio: { n: "El alumno no asistió", c: "bg-slate-100 text-slate-700" },
  cancelada: { n: "Cancelada", c: "bg-slate-100 text-slate-600" },
}
export function estadoVideo(v: { rid: number | null; restado: string | null; inicio: string | null }) {
  if (!v.rid) return "pedida"
  if (v.restado === "confirmada") return v.inicio && new Date(v.inicio).getTime() < Date.now() ? "pasada" : "agendada"
  return v.restado ?? "pedida"
}

// ── Registro de cambios para revisión ──
export const CAMPOS_CURSO = ["titulo", "bajada", "descripcion", "nivel"] as const
export const CAMPOS_LECCION = ["modulo", "titulo", "tipo", "contenido", "video_url", "archivo_url", "duracion_min", "publicada", "quiz"] as const

export async function registrarCambio(a: Autor, x: { curso: number; leccion?: number | null; tipo: string; resumen: string; antes?: unknown; despues?: unknown }) {
  await q(
    "insert into am_cambios_autor(autor, curso_id, leccion_id, tipo, resumen, antes, despues) values ($1,$2,$3,$4,$5,$6,$7)",
    [a.email, x.curso, x.leccion ?? null, x.tipo, x.resumen.slice(0, 300), x.antes == null ? null : JSON.stringify(x.antes), x.despues == null ? null : JSON.stringify(x.despues)],
  )
}

/** Campos que cambiaron entre dos objetos (para el resumen y la revisión). */
export function diferencias(antes: Record<string, any> | null, despues: Record<string, any> | null, campos: readonly string[]) {
  // JSON estable (jsonb reordena las claves): así un quiz igual no figura como cambiado.
  const estable = (v: any): any => (Array.isArray(v) ? v.map(estable) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, estable(v[k])])) : v)
  const norm = (v: any) => (v == null || v === "" ? null : typeof v === "object" ? JSON.stringify(estable(v)) : String(v))
  return campos.filter((k) => norm(antes?.[k]) !== norm(despues?.[k]))
}

// ── Validación del contenido que manda el autor (la misma regla que el editor del sistema) ──
const url = (v: string | null) => (v && /^https:\/\//.test(v) ? v.slice(0, 600) : null)
const txt = (v: FormDataEntryValue | null, max: number) => {
  const t = String(v ?? "").trim()
  return t ? t.slice(0, max) : null
}

export function leerCurso(fd: FormData) {
  return {
    titulo: txt(fd.get("titulo"), 160),
    bajada: txt(fd.get("bajada"), 300),
    descripcion: String(fd.get("descripcion") ?? "").slice(0, 20000),
    nivel: txt(fd.get("nivel"), 60),
  }
}

/** Lección enviada por el autor. El material puede ser un link https o el archivo cifrado que ya tenía (no puede apuntar a otro). */
export function leerLeccion(fd: FormData, anterior?: { archivo_url: string | null } | null) {
  const tipo = TIPOS_LECCION.some((t) => t.v === fd.get("tipo")) ? String(fd.get("tipo")) : "lectura"
  const arch = txt(fd.get("archivo_url"), 600)
  const archivo = arch && anterior?.archivo_url && arch === anterior.archivo_url ? arch : url(arch)
  const qz = quizDe(String(fd.get("quiz") ?? "").trim())
  const dur = Math.round(Number(fd.get("duracion_min")))
  return {
    modulo: txt(fd.get("modulo"), 120),
    titulo: txt(fd.get("titulo"), 200),
    tipo,
    contenido: String(fd.get("contenido") ?? "").slice(0, 50000),
    video_url: url(txt(fd.get("video_url"), 600)),
    archivo_url: archivo,
    duracion_min: dur > 0 && dur < 1000 ? dur : null,
    publicada: fd.get("publicada") === "1",
    quiz: qz.length ? qz : null,
    quizInvalido: !!String(fd.get("quiz") ?? "").trim() && !qz.length,
  }
}

// ── Lado de Dirección (Sistema Academia) ──

/** Alta (o reactivación) de un autor: email + perfil docente. Habilita su cuenta para que pueda entrar aunque la política de ingreso sea restringida. */
export async function altaAutor(email: string, slug: string, nombre: string | null, por: { id: number; usuario: string }) {
  const e = limpio(email)
  if (!emailValido(e)) return { ok: false as const, error: "El email no es válido." }
  if (!esSlugDocente(slug)) return { ok: false as const, error: "Elegí un perfil del equipo de la Academia." }
  const perfil = PERFILES_DOCENTES.find((p) => p.slug === slug)!
  await q(
    `insert into am_autores(email, docente_slug, nombre, creado_por) values ($1,$2,$3,$4)
     on conflict (lower(email), docente_slug) do update set activo=true, nombre=coalesce(excluded.nombre, am_autores.nombre)`,
    [e, slug, nombre || perfil.nombre, por.usuario],
  )
  // La cuenta DEVISEBIT (contacto) con ese email: si no existe se crea; queda habilitada salvo que esté bloqueada a mano.
  const c = await crearCuenta(e, nombre || perfil.nombre, { origen: "Academia (autor)", fuente: "academia", categoria: "Docente academia" })
  if (c) await q("update db_contactos set portal_acceso=case when portal_acceso='bloqueado' then portal_acceso else 'habilitado' end, actualizado=now() where id=$1", [c.id])
  await audit(por, "alta_autor", "am_autor", e, slug)
  return { ok: true as const }
}

/** Email con el acceso al panel de autor (link de 7 días; después entra con su email y un código). Solo lo dispara Dirección con un botón. */
export async function invitarAutor(id: number, por: { id: number; usuario: string }) {
  const a = await one<{ email: string; nombre: string | null; docente_slug: string; activo: boolean }>("select email, nombre, docente_slug, activo from am_autores where id=$1", [id])
  if (!a?.activo) return { ok: false, error: "El autor no está activo." }
  const c = await one<{ id: number; nombre: string }>("select id, nombre from db_contactos where lower(email)=$1", [limpio(a.email)])
  if (!c) return { ok: false, error: "No existe la cuenta: volvé a darlo de alta." }
  const { url: acceso } = await crearAcceso(c.id, "invitacion", { sitio: "academia", a: "/autor" })
  const md = `# Tu panel de autor en ACADEMIA DEVISEBIT\n\nHola {{nombre}}, ya podés entrar a tu panel de autor: ahí editás el contenido de tus cursos (textos, lecciones, quiz y materiales), ves a tus alumnos y su avance, y las videollamadas que te pidieron.\n\n[[Entrar a mi panel de autor|${acceso}]]\n\nEl botón vale 7 días y se usa una sola vez. Después entrás siempre desde ${URL_ACADEMIA}/autor con tu email: te mandamos un código, sin contraseñas.\n\nLos cambios de precio y la publicación de un curso los coordinamos con Dirección.`
  const r = await enviarBrevo({ email: a.email, name: a.nombre ?? c.nombre }, "Tu panel de autor en ACADEMIA DEVISEBIT", plantilla(aHtml(md), { nombre: a.nombre ?? c.nombre, preheader: "Tus cursos, alumnos y videollamadas" }))
  await audit(por, "invita_autor", "am_autor", id, r.ok ? "enviado" : r.error)
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar el email" }
}

/** Revierte un cambio de contenido de un autor (vuelve al "antes"). Los pedidos de estado se aprueban o rechazan, no se revierten. */
export async function revertirCambio(id: number, por: { id: number; usuario: string }) {
  const x = await one<any>("select * from am_cambios_autor where id=$1 and estado in ('pendiente','revisado')", [id])
  if (!x) return { ok: false, error: "El cambio no existe o ya se resolvió." }
  if (x.tipo === "curso" && x.antes) {
    const v = x.antes
    await q("update am_cursos set titulo=$1, bajada=$2, descripcion=$3, nivel=$4, actualizado=now() where id=$5", [v.titulo, v.bajada, v.descripcion ?? "", v.nivel, x.curso_id])
  } else if (x.tipo === "leccion" && x.antes && x.leccion_id) {
    const v = x.antes
    await q("update am_lecciones set modulo=$1, titulo=$2, tipo=$3, contenido=$4, video_url=$5, archivo_url=$6, duracion_min=$7, publicada=$8, quiz=$9 where id=$10 and curso_id=$11",
      [v.modulo, v.titulo, v.tipo, v.contenido ?? "", v.video_url, v.archivo_url, v.duracion_min, !!v.publicada, v.quiz ? JSON.stringify(v.quiz) : null, x.leccion_id, x.curso_id])
  } else if (x.tipo === "leccion_nueva" && x.leccion_id) {
    await q("delete from am_lecciones where id=$1 and curso_id=$2", [x.leccion_id, x.curso_id])
  } else return { ok: false, error: "Este cambio no se puede revertir automáticamente." }
  await q("update am_cambios_autor set estado='revertido', revisado_por=$1, revisado_en=now() where id=$2", [por.usuario, id])
  await audit(por, "revierte_cambio_autor", "am_curso", x.curso_id, `${x.tipo} #${id}`)
  return { ok: true }
}

/** Aprueba (aplica) o rechaza un pedido de cambio de estado del curso. */
export async function resolverPedidoEstado(id: number, aprobar: boolean, por: { id: number; usuario: string }) {
  const x = await one<any>("select * from am_cambios_autor where id=$1 and tipo='pedido_estado' and estado='pendiente'", [id])
  if (!x) return { ok: false, error: "El pedido no existe o ya se resolvió." }
  const est = x.despues?.estado
  if (aprobar) {
    if (!["borrador", "publicado", "archivado"].includes(est)) return { ok: false, error: "Estado inválido." }
    await q("update am_cursos set estado=$1, actualizado=now() where id=$2", [est, x.curso_id])
  }
  await q("update am_cambios_autor set estado=$1, revisado_por=$2, revisado_en=now() where id=$3", [aprobar ? "aprobado" : "rechazado", por.usuario, id])
  await audit(por, aprobar ? "aprueba_estado_autor" : "rechaza_estado_autor", "am_curso", x.curso_id, est)
  return { ok: true }
}
