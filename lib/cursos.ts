import { randomBytes } from "crypto"
import { q, one, audit } from "./db"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { notificar } from "./push"
import { URL_ACADEMIA } from "./academia"
import { crearAcceso, urlPortal } from "./portal"

/**
 * Academia DEVISEBIT · cursos (modelo tomado de Academia USL):
 * curso → ediciones (cohortes) → clases en vivo con asistencia, y lecciones online con avance.
 * Inscripción conectada a Contactos (tags alumno / curso:slug / egresado), aprobación y certificado verificable.
 */

export const MODALIDADES = [
  { v: "online", n: "Online a tu ritmo" },
  { v: "en_vivo", n: "Online en vivo" },
  { v: "presencial", n: "Presencial" },
  { v: "mixta", n: "Mixta" },
] as const
export const modalidad = (v: string) => MODALIDADES.find((m) => m.v === v)?.n ?? v

export const ESTADOS_INSC = [
  { v: "inscripto", n: "Inscripto", c: "bg-sky-50 text-sky-700" },
  { v: "cursando", n: "Cursando", c: "bg-amber-50 text-amber-700" },
  { v: "aprobado", n: "Aprobado", c: "bg-emerald-50 text-emerald-700" },
  { v: "desaprobado", n: "No aprobado", c: "bg-slate-100 text-slate-600" },
  { v: "baja", n: "Baja", c: "bg-slate-100 text-slate-500" },
] as const
export const estadoInsc = (v: string) => ESTADOS_INSC.find((e) => e.v === v) ?? ESTADOS_INSC[0]

export const ESTADOS_EDICION = [
  { v: "inscripcion", n: "Inscripción abierta" },
  { v: "en_curso", n: "En curso" },
  { v: "finalizada", n: "Finalizada" },
  { v: "cancelada", n: "Cancelada" },
] as const

export const TIPOS_LECCION = [
  { v: "video", n: "Video", i: "▶" },
  { v: "lectura", n: "Lectura", i: "▤" },
  { v: "descarga", n: "Material descargable", i: "⤓" },
  { v: "tarea", n: "Actividad", i: "✎" },
] as const
export const tipoLeccion = (v: string) => TIPOS_LECCION.find((t) => t.v === v) ?? TIPOS_LECCION[1]

export const urlCertificado = (codigo: string) => `${URL_ACADEMIA}/certificado/${codigo}`

/** YouTube / Vimeo / Loom / Drive → URL para iframe. Si no la reconoce, devuelve null y se muestra como link. */
export function embedVideo(u: string | null | undefined) {
  if (!u) return null
  let m
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) return `https://www.youtube-nocookie.com/embed/${m[1]}`
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return `https://player.vimeo.com/video/${m[1]}`
  if ((m = u.match(/loom\.com\/(?:share|embed)\/([\w]+)/))) return `https://www.loom.com/embed/${m[1]}`
  if ((m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

// ── Avance ──
export type Avance = { lecciones: number; hechas: number; pctLecciones: number; clases: number; presentes: number; pctAsistencia: number; dadas: number }

export async function avance(iid: number): Promise<Avance> {
  const r = await one<any>(
    `select
       (select count(*)::int from am_lecciones l where l.curso_id=e.curso_id and l.publicada) lecciones,
       (select count(*)::int from am_progreso p join am_lecciones l on l.id=p.leccion_id and l.publicada where p.inscripcion_id=i.id) hechas,
       (select count(*)::int from am_clases c where c.edicion_id=i.edicion_id) clases,
       (select count(*)::int from am_clases c where c.edicion_id=i.edicion_id and c.fecha <= now()) dadas,
       (select count(*)::int from am_asistencias a join am_clases c on c.id=a.clase_id where a.inscripcion_id=i.id and a.presente) presentes
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where i.id=$1`,
    [iid],
  )
  const lecciones = r?.lecciones ?? 0, hechas = r?.hechas ?? 0, clases = r?.clases ?? 0, presentes = r?.presentes ?? 0, dadas = r?.dadas ?? 0
  return {
    lecciones, hechas, clases, presentes, dadas,
    pctLecciones: lecciones ? Math.round((100 * hechas) / lecciones) : 100,
    pctAsistencia: clases ? Math.round((100 * presentes) / clases) : 100,
  }
}

/** Revisa si ya cumple los requisitos y, si corresponde, aprueba y emite el certificado. */
export async function evaluar(iid: number) {
  const i = await one<any>(
    `select i.estado, e.estado edicion_estado, c.req_lecciones, c.req_asistencia,
       (select count(*)::int from am_clases k where k.edicion_id=i.edicion_id) clases
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id where i.id=$1`,
    [iid],
  )
  if (!i || !["inscripto", "cursando"].includes(i.estado)) return false
  const a = await avance(iid)
  const okLecciones = a.pctLecciones >= i.req_lecciones
  const okAsistencia = i.clases === 0 || (i.edicion_estado === "finalizada" && a.pctAsistencia >= i.req_asistencia)
  if (okLecciones && okAsistencia && (a.lecciones > 0 || i.clases > 0)) { await aprobar(iid, "automático"); return true }
  if (i.estado === "inscripto" && (a.hechas > 0 || a.presentes > 0)) await q("update am_inscripciones set estado='cursando' where id=$1 and estado='inscripto'", [iid])
  return false
}

const codigo = () => {
  const c = randomBytes(6).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "X")
  return `DB-${c.slice(0, 4)}-${c.slice(4, 8)}`
}

/** Aprueba (a mano o automático), emite certificado si el curso certifica y avisa al alumno. */
export async function aprobar(iid: number, por: string) {
  const i = await one<any>(
    `update am_inscripciones set estado='aprobado', aprobado_en=coalesce(aprobado_en, now()) where id=$1 and estado<>'aprobado'
     returning id, contacto_id, edicion_id`, [iid])
  if (!i) return null
  const d = await one<any>(
    `select k.nombre, k.email, c.titulo, c.slug, c.horas, c.certifica, e.nombre edicion
     from am_inscripciones i join db_contactos k on k.id=i.contacto_id join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id where i.id=$1`, [iid])
  let cert: string | null = null
  if (d.certifica) {
    for (let n = 0; n < 5 && !cert; n++) {
      const r = await one<{ codigo: string }>(
        `insert into am_certificados(inscripcion_id, codigo, nombre, curso, horas, edicion) values ($1,$2,$3,$4,$5,$6)
         on conflict (inscripcion_id) do update set anulado=false returning codigo`,
        [iid, codigo(), d.nombre, d.titulo, d.horas, d.edicion],
      ).catch(() => null)
      cert = r?.codigo ?? null
    }
  }
  await q("update db_contactos set tags=(select array(select distinct unnest(tags || array['egresado', $2::text]))), actualizado=now() where id=$1", [i.contacto_id, `egresado:${d.slug}`])
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'aprobado',$3)", [i.contacto_id, iid, d.slug])
  await audit({ id: 0, usuario: por }, "curso_aprobado", "am_inscripcion", iid, d.titulo)
  if (d.email) {
    const md = `# ¡Felicitaciones, terminaste el curso!\n\nHola {{nombre}}, aprobaste **${d.titulo}**.${cert ? `\n\nTu certificado ya está disponible. Cualquier persona puede verificarlo con el código **${cert}**.\n\n[[Ver mi certificado|${urlCertificado(cert)}]]` : ""}\n\nEn tu cuenta tenés todos tus cursos y certificados. Gracias por aprender con la Academia DEVISEBIT.\n\n[[Ver más cursos|${URL_ACADEMIA}/cursos]]`
    await enviarBrevo({ email: d.email, name: d.nombre }, `Aprobaste ${d.titulo}${cert ? " · tu certificado" : ""}`, plantilla(aHtml(md), { nombre: d.nombre, preheader: "Tu certificado está listo" })).catch(() => {})
  }
  await notificar(["gerente", "coordinacion"], "🎓 Curso aprobado", `${d.nombre} · ${d.titulo}`, `/cursos/edicion/${i.edicion_id}`).catch(() => {})
  return cert
}

// ── Inscripción ──
/** Inscribe a un contacto en una edición (sin duplicar), lo etiqueta en el CRM y le manda la bienvenida con acceso. */
export async function inscribir(contactoId: number, edicionId: number, origen: string, conEmail = true) {
  const e = await one<any>(
    `select e.*, c.titulo, c.slug, c.estado curso_estado, (select count(*)::int from am_inscripciones i where i.edicion_id=e.id and i.estado<>'baja') inscriptos
     from am_ediciones e join am_cursos c on c.id=e.curso_id where e.id=$1`, [edicionId])
  if (!e) return { ok: false as const, error: "La edición no existe." }
  const ya = await one<{ id: number; estado: string }>("select id, estado from am_inscripciones where edicion_id=$1 and contacto_id=$2", [edicionId, contactoId])
  if (ya && ya.estado !== "baja") return { ok: true as const, id: ya.id, ya: true }
  if (["finalizada", "cancelada"].includes(e.estado)) return { ok: false as const, error: "La inscripción a esta edición está cerrada." }
  if (e.cupo && e.inscriptos >= e.cupo) return { ok: false as const, error: "No quedan vacantes en esta edición." }
  const r = ya
    ? await one<{ id: number }>("update am_inscripciones set estado='inscripto', origen=$2 where id=$1 returning id", [ya.id, origen])
    : await one<{ id: number }>("insert into am_inscripciones(edicion_id, contacto_id, origen) values ($1,$2,$3) returning id", [edicionId, contactoId, origen])
  const iid = r!.id
  await q(
    `update db_contactos set tags=(select array(select distinct unnest(tags || array['alumno', $2::text]))),
       categoria=coalesce(categoria,'Alumno academia'), consentimiento=coalesce(consentimiento,'Sí'), suscrito_en=coalesce(suscrito_en, now()), actualizado=now() where id=$1`,
    [contactoId, `curso:${e.slug}`],
  )
  await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'inscripcion',$3)", [contactoId, iid, e.slug])
  if (conEmail) await bienvenida(iid).catch(() => {})
  await notificar(["gerente", "coordinacion"], "🎓 Nueva inscripción", `${e.titulo} · ${e.nombre}`, `/cursos/edicion/${edicionId}`).catch(() => {})
  return { ok: true as const, id: iid, ya: false }
}

/** Email de bienvenida con link directo al curso (entra sin contraseña). */
export async function bienvenida(iid: number) {
  const d = await one<any>(
    `select i.contacto_id, k.nombre, k.email, c.titulo, e.nombre edicion, to_char(e.inicio,'YYYY-MM-DD') inicio, e.horario, e.link
     from am_inscripciones i join db_contactos k on k.id=i.contacto_id join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id where i.id=$1`, [iid])
  if (!d?.email) return
  const { url } = await crearAcceso(d.contacto_id, "invitacion")
  const ir = `${url}?ir=${encodeURIComponent(`/portal/cursos/${iid}`)}`
  const inicio = d.inicio ? `\n\nArranca el **${new Date(d.inicio + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}**${d.horario ? ` · ${d.horario}` : ""}.` : ""
  const md = `# ¡Ya estás inscripto!\n\nHola {{nombre}}, te damos la bienvenida a **${d.titulo}** (${d.edicion}).${inicio}\n\nEn tu cuenta vas a encontrar las clases, los materiales para descargar, tu avance y, al terminar, tu certificado.\n\n[[Entrar al curso|${ir}]]\n\nEl botón vale 7 días. Después podés entrar siempre desde ${urlPortal()} con tu email.`
  await enviarBrevo({ email: d.email, name: d.nombre }, `Bienvenido a ${d.titulo}`, plantilla(aHtml(md), { nombre: d.nombre, preheader: "Tu acceso al curso" }))
}

/** Busca o crea el contacto por email (para inscripciones públicas y altas masivas). */
export async function contactoPorEmail(email: string, nombre?: string | null, extra?: { telefono?: string | null; organizacion?: string | null; origen?: string }) {
  const e = email.trim().toLowerCase()
  const c = await one<{ id: number }>("select id from db_contactos where lower(email)=$1", [e])
  if (c) {
    await q("update db_contactos set telefono=coalesce(telefono,$2), organizacion=coalesce(organizacion,$3), actualizado=now() where id=$1", [c.id, extra?.telefono ?? null, extra?.organizacion ?? null])
    return c.id
  }
  return (await one<{ id: number }>(
    "insert into db_contactos(nombre,email,telefono,organizacion,etapa,origen,fuente,categoria,consentimiento) values ($1,$2,$3,$4,'base',$5,'academia','Alumno academia','Sí') returning id",
    [nombre?.trim() || e.split("@")[0], e, extra?.telefono ?? null, extra?.organizacion ?? null, extra?.origen ?? "Academia (curso)"],
  ))!.id
}

// ── Lecturas para el alumno ──
export async function misInscripciones(cid: number) {
  const l = await q<any>(
    `select i.id, i.estado, i.creado, i.aprobado_en, e.id edicion_id, e.nombre edicion, e.inicio, e.fin, e.horario, e.estado edicion_estado,
       c.id curso_id, c.titulo, c.slug, c.imagen, c.modalidad, c.horas, ce.codigo certificado
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id
     left join am_certificados ce on ce.inscripcion_id=i.id and not ce.anulado
     where i.contacto_id=$1 and i.estado<>'baja' order by i.estado='aprobado', i.creado desc`, [cid])
  return Promise.all(l.map(async (x) => ({ ...x, av: await avance(x.id) })))
}

export async function inscripcionDe(cid: number, iid: number) {
  return await one<any>(
    `select i.*, e.nombre edicion, e.inicio, e.fin, e.horario, e.lugar, e.link, e.estado edicion_estado,
       c.id curso_id, c.titulo, c.slug, c.bajada, c.descripcion, c.imagen, c.modalidad, c.horas, c.docente, c.req_lecciones, c.req_asistencia, c.certifica,
       ce.codigo certificado
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos c on c.id=e.curso_id
     left join am_certificados ce on ce.inscripcion_id=i.id and not ce.anulado
     where i.id=$1 and i.contacto_id=$2 and i.estado<>'baja'`, [iid, cid])
}

export async function leccionesDe(cursoId: number, iid?: number) {
  return await q<any>(
    `select l.*, ${iid ? "p.completada" : "null::timestamptz completada"} from am_lecciones l
     ${iid ? "left join am_progreso p on p.leccion_id=l.id and p.inscripcion_id=$2" : ""}
     where l.curso_id=$1 and l.publicada order by l.orden, l.id`,
    iid ? [cursoId, iid] : [cursoId],
  )
}

/** Recordatorio por email de las clases de hoy (cron de las 8). */
export async function recordatoriosClases() {
  const l = await q<any>(
    `select k.nombre, k.email, c.titulo, cl.fecha, cl.tema, coalesce(cl.link, e.link) link, e.lugar, i.id iid
     from am_clases cl join am_ediciones e on e.id=cl.edicion_id join am_cursos c on c.id=e.curso_id
     join am_inscripciones i on i.edicion_id=e.id and i.estado in ('inscripto','cursando') join db_contactos k on k.id=i.contacto_id
     where k.email is not null and (cl.fecha at time zone 'America/Argentina/Buenos_Aires')::date = (now() at time zone 'America/Argentina/Buenos_Aires')::date`)
  let n = 0
  for (const x of l) {
    const hora = new Date(x.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })
    const md = `# Hoy tenés clase\n\nHola {{nombre}}, hoy a las **${hora}** es la clase de **${x.titulo}**${x.tema ? `: ${x.tema}` : ""}.${x.lugar ? `\n\nLugar: ${x.lugar}` : ""}\n\n${x.link ? `[[Entrar a la clase|${x.link}]]` : `[[Ver el curso|${urlPortal(`/cursos/${x.iid}`)}]]`}`
    const r = await enviarBrevo({ email: x.email, name: x.nombre }, `Hoy ${hora} · ${x.titulo}`, plantilla(aHtml(md), { nombre: x.nombre, preheader: x.tema ?? "Recordatorio de clase" })).catch(() => ({ ok: false }))
    if (r.ok) n++
  }
  return n
}
