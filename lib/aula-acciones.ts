"use server"
import { redirect } from "next/navigation"
import { q, one } from "./db"
import { requerirCliente, requerirAlumno } from "./portal"
import { randomBytes } from "crypto"
import { inscripcionDe, evaluar, esBaseAula, quizDe, corregirQuiz } from "./cursos"
import { notificar } from "./push"
import { URL_SISTEMA } from "./brief"

/** Marca (o desmarca) una lección como vista. Sirve igual desde el portal y desde la Academia (`base`). */
export async function completarLeccion(fd: FormData) {
  const b = fd.get("base")
  const base = esBaseAula(b) ? b : "/portal/cursos"
  const c = base === "/mi-cuenta/cursos" ? await requerirAlumno() : await requerirCliente()
  const iid = Number(fd.get("iid")), lid = Number(fd.get("lid"))
  const i = await inscripcionDe(c.id, iid)
  if (!i || !(await one("select 1 from am_lecciones where id=$1 and curso_id=$2 and publicada", [lid, i.curso_id]))) redirect(base)
  const deshacer = fd.get("op") === "deshacer"
  // Lección con quiz: para marcarla como vista hay que aprobarlo (70 %). Si no, vuelve con el resultado.
  if (!deshacer) {
    const l = await one<{ quiz: unknown }>("select quiz from am_lecciones where id=$1", [lid])
    const qz = quizDe(l?.quiz)
    if (qz.length) {
      const resp = qz.map((_, k) => (fd.get(`q${k}`) == null ? null : Number(fd.get(`q${k}`))))
      const r = corregirQuiz(qz, resp)
      await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'quiz',$3)", [c.id, iid, `${lid}:${r.bien}/${r.total}`]).catch(() => {})
      if (!r.ok) redirect(`${base}/${iid}/l/${lid}?quiz=${r.bien}-${r.total}&r=${resp.map((x) => (x == null ? "x" : x)).join(".")}#quiz`)
    }
  }
  if (deshacer) await q("delete from am_progreso where inscripcion_id=$1 and leccion_id=$2", [iid, lid])
  else {
    await q("insert into am_progreso(inscripcion_id, leccion_id) values ($1,$2) on conflict do nothing", [iid, lid])
    await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'leccion',$3)", [c.id, iid, String(lid)])
  }
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [iid])
  const aprobado = await evaluar(iid)
  const sig = Number(fd.get("siguiente") ?? 0)
  redirect(aprobado ? `${base}/${iid}?aprobado=1` : sig && !deshacer ? `${base}/${iid}/l/${sig}` : `${base}/${iid}/l/${lid}`)
}

/**
 * "Pedí tu videollamada con quien enseña el curso" (cursos pagos, 1 de 30 minutos incluida).
 * Abre (o reutiliza) una consulta en el CRM marcada para que la atienda una persona, avisa al equipo
 * y lleva al alumno a la agenda real (/agendar/<token>) para elegir día y horario: la reunión queda en el calendario,
 * con link de videollamada y confirmación por email.
 */
export async function pedirVideollamada(fd: FormData) {
  const b = fd.get("base")
  const base = esBaseAula(b) ? b : "/mi-cuenta/cursos"
  const c = base === "/mi-cuenta/cursos" ? await requerirAlumno() : await requerirCliente()
  const iid = Number(fd.get("iid"))
  const i = await inscripcionDe(c.id, iid)
  if (!i) redirect(base)
  const x = await one<{ videollamada: boolean; docente: string | null; consulta: number | null; tel: string | null }>(
    `select cu.videollamada, cu.docente, i.videollamada_consulta consulta, k.telefono tel
     from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos cu on cu.id=e.curso_id join db_contactos k on k.id=i.contacto_id where i.id=$1`, [iid])
  if (!x?.videollamada) redirect(`${base}/${iid}`)
  let tok: string | null = null
  if (x.consulta) tok = (await one<{ brief_token: string }>("select brief_token from consultas where id=$1", [x.consulta]))?.brief_token ?? null
  if (!tok) {
    tok = randomBytes(9).toString("base64url")
    const tema = String(fd.get("tema") ?? "").trim().slice(0, 600) || null
    const n = await one<{ id: number }>(
      `insert into consultas(empresa,canal,nombre,email,telefono,organizacion,motivo,mensaje,fuente,necesita_humano,brief_token)
       values ('devisebit','academia',$1,$2,$3,$4,$5,$6,'academia',true,$7) returning id`,
      [c.nombre, c.email, x.tel, c.organizacion, `Videollamada${x.docente ? ` con ${x.docente}` : ""} · ${i.titulo}`,
        `${c.nombre} pidió la videollamada de 30 minutos incluida en el curso "${i.titulo}"${x.docente ? ` (lo enseña ${x.docente})` : ""}.${tema ? ` Quiere hablar de: ${tema}` : ""}`, tok],
    )
    await q("update am_inscripciones set videollamada_en=now(), videollamada_consulta=$1 where id=$2", [n!.id, iid])
    await q("update db_contactos set consulta_id=coalesce(consulta_id,$1), proximo=$2, proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date + 1, actualizado=now() where id=$3",
      [n!.id, `Videollamada${x.docente ? ` con ${x.docente}` : ""} de ${i.titulo}`, c.id]).catch(() => {})
    await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'videollamada',$3)", [c.id, iid, i.slug]).catch(() => {})
    await notificar(["gerente", "coordinacion"], "🎥 Pidieron la videollamada de un curso", `${c.nombre} · ${i.titulo}${x.docente ? ` · ${x.docente}` : ""}`, `/consultas/${n!.id}`).catch(() => {})
  }
  redirect(`${URL_SISTEMA}/agendar/${tok}`)
}
