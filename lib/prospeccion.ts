import { q, one } from "@/lib/db"
import { ESTADOS_PROS, CANALES_PROS, TIPOS_PROS } from "@/lib/gestion"

/**
 * Prospección: cada mail (Gmail), invitación de LinkedIn, mensaje o postulación, con su historia.
 * La tabla es g_prospeccion y la historia g_prospeccion_eventos (fecha, qué pasó y quién).
 * Se carga a mano en Sistema → Prospección o por API (POST /api/panel/prospeccion) desde las tareas programadas.
 */

const HOY = "(now() at time zone 'America/Argentina/Buenos_Aires')::date"
const nombreEstado = (v: string | null | undefined) => ESTADOS_PROS.find((o) => o.v === v)?.n ?? v ?? "—"

export async function evento(id: number, tipo: string, detalle: string | null, por: string | null, fecha?: string | null) {
  await q("insert into g_prospeccion_eventos(prospeccion_id,tipo,detalle,por,fecha) values ($1,$2,$3,$4,coalesce($5::timestamptz, now()))", [id, tipo, detalle, por, fecha ?? null])
}

/**
 * Después de crear o editar un registro: anota en la historia lo que cambió y completa las fechas solas
 * (enviado → fecha de envío y seguimiento a los 7 días; respondió o reunión → fecha de respuesta).
 */
export async function registrarCambios(id: number, antes: any | null, por: string | null) {
  const r = await one<any>("select * from g_prospeccion where id=$1", [id])
  if (!r) return
  if (!antes) await evento(id, "alta", `${r.canal === "linkedin" ? "Invitación" : "Contacto"} cargado como ${nombreEstado(r.estado).toLowerCase()} · ${r.campania}`, por)
  else if (antes.estado !== r.estado) await evento(id, "estado", `${nombreEstado(antes.estado)} → ${nombreEstado(r.estado)}`, por)
  if (antes && (antes.notas ?? "") !== (r.notas ?? "") && r.notas) await evento(id, "nota", String(r.notas).slice(0, 500), por)
  const salio = ["enviado", "respondio", "reunion", "ganado", "sin_respuesta"].includes(r.estado)
  const respondio = ["respondio", "reunion", "ganado"].includes(r.estado)
  await q(
    `update g_prospeccion set
       enviado_en = case when $2 and enviado_en is null then ${HOY} else enviado_en end,
       seguimiento = case when $2 and seguimiento is null and estado='enviado' then coalesce(enviado_en, ${HOY}) + 7 when estado <> 'enviado' and $3 then null else seguimiento end,
       respondio_en = case when $3 and respondio_en is null then ${HOY} else respondio_en end
     where id=$1`,
    [id, salio, respondio],
  )
}

/** Un clic en la tabla: borrador → enviado hoy, con seguimiento a los 7 días. */
export async function marcarEnviado(id: number, por: string | null) {
  const antes = await one<any>("select * from g_prospeccion where id=$1", [id])
  if (!antes || antes.estado !== "borrador") return
  await q("update g_prospeccion set estado='enviado', actualizado=now() where id=$1", [id])
  await registrarCambios(id, antes, por)
}

export type ItemApi = {
  ref: string
  campania?: string; tanda?: number | null; tipo?: string; canal?: string; sentido?: string
  organizacion?: string; persona?: string | null; cargo?: string | null; destino?: string | null; asunto?: string | null
  estado?: string; enviado_en?: string | null; respondio_en?: string | null; seguimiento?: string | null
  responsable?: string | null; notas?: string | null
  eventos?: { fecha?: string; tipo: string; detalle?: string }[]
}

const ok = (ops: { v: string }[], v: unknown, def: string) => (typeof v === "string" && ops.some((o) => o.v === v) ? v : def)
const fechaOk = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)
const txt = (v: unknown, max = 300) => (v == null || v === "" ? null : String(v).slice(0, max))

/**
 * Alta o actualización por referencia única (ej. "gmail:r-77165…", "linkedin:adrian-bepre-baufest").
 * Lo que no se manda no se pisa. Si cambia el estado o llegan eventos, quedan en la historia.
 */
export async function guardarDesdeApi(items: ItemApi[], por: string) {
  const res = { creados: 0, actualizados: 0, eventos: 0, rechazados: [] as { ref: string; motivo: string }[] }
  for (const it of items.slice(0, 500)) {
    const ref = txt(it?.ref, 200)
    if (!ref) { res.rechazados.push({ ref: "?", motivo: "falta ref" }); continue }
    const antes = await one<any>("select * from g_prospeccion where ref=$1", [ref])
    if (!antes && !txt(it.organizacion)) { res.rechazados.push({ ref, motivo: "falta organizacion" }); continue }
    const v = {
      campania: txt(it.campania, 120), tanda: it.tanda != null && Number.isFinite(Number(it.tanda)) ? Math.round(Number(it.tanda)) : null,
      tipo: it.tipo != null ? ok(TIPOS_PROS, it.tipo, "otro") : null, canal: it.canal != null ? ok(CANALES_PROS, it.canal, "otro") : null,
      sentido: it.sentido === "entrante" || it.sentido === "saliente" ? it.sentido : null,
      organizacion: txt(it.organizacion), persona: txt(it.persona), cargo: txt(it.cargo), destino: txt(it.destino), asunto: txt(it.asunto),
      estado: it.estado != null ? ok(ESTADOS_PROS, it.estado, "borrador") : null,
      enviado_en: fechaOk(it.enviado_en), respondio_en: fechaOk(it.respondio_en), seguimiento: fechaOk(it.seguimiento),
      responsable: txt(it.responsable, 80), notas: txt(it.notas, 2000),
    }
    let id: number
    if (antes) {
      await q(
        `update g_prospeccion set campania=coalesce($2,campania), tanda=coalesce($3,tanda), tipo=coalesce($4,tipo), canal=coalesce($5,canal), sentido=coalesce($6,sentido),
           organizacion=coalesce($7,organizacion), persona=coalesce($8,persona), cargo=coalesce($9,cargo), destino=coalesce($10,destino), asunto=coalesce($11,asunto),
           estado=coalesce($12,estado), enviado_en=coalesce($13,enviado_en), respondio_en=coalesce($14,respondio_en), seguimiento=coalesce($15,seguimiento),
           responsable=coalesce($16,responsable), notas=coalesce($17,notas), actualizado=now() where id=$1`,
        [antes.id, v.campania, v.tanda, v.tipo, v.canal, v.sentido, v.organizacion, v.persona, v.cargo, v.destino, v.asunto, v.estado, v.enviado_en, v.respondio_en, v.seguimiento, v.responsable, v.notas],
      )
      id = antes.id
      res.actualizados++
    } else {
      const r = await one<{ id: number }>(
        `insert into g_prospeccion(ref,campania,tanda,tipo,canal,sentido,organizacion,persona,cargo,destino,asunto,estado,enviado_en,respondio_en,seguimiento,responsable,notas,creado_por)
         values ($1,coalesce($2,'General'),$3,coalesce($4,'cliente'),coalesce($5,'gmail'),coalesce($6,'saliente'),$7,$8,$9,$10,$11,coalesce($12,'borrador'),$13,$14,$15,coalesce($16,'Julio'),$17,$18) returning id`,
        [ref, v.campania, v.tanda, v.tipo, v.canal, v.sentido, v.organizacion, v.persona, v.cargo, v.destino, v.asunto, v.estado, v.enviado_en, v.respondio_en, v.seguimiento, v.responsable, v.notas, por],
      )
      id = r!.id
      res.creados++
    }
    for (const e of Array.isArray(it.eventos) ? it.eventos.slice(0, 50) : []) {
      if (!e?.tipo) continue
      const ya = await one("select 1 from g_prospeccion_eventos where prospeccion_id=$1 and tipo=$2 and coalesce(detalle,'')=coalesce($3,'') and fecha::date=coalesce($4::date, fecha::date)", [id, txt(e.tipo, 40), txt(e.detalle, 500), fechaOk(e.fecha)])
      if (ya) continue
      await evento(id, txt(e.tipo, 40)!, txt(e.detalle, 500), por, fechaOk(e.fecha))
      res.eventos++
    }
    await registrarCambios(id, antes, por)
  }
  return res
}

/** Números para el Panel y para la cabecera de Sistema → Prospección. */
export async function prospeccionPanel() {
  const [tot, porEstado, porCanal, porCampania, porTipo, vencidos, eventos, semanas] = await Promise.all([
    one<{ salieron: number; respondieron: number; dias: number | null }>(`select count(*) filter (where enviado_en is not null)::int salieron,
      count(*) filter (where estado in ('respondio','reunion','ganado'))::int respondieron,
      round(avg(respondio_en - enviado_en) filter (where respondio_en is not null and enviado_en is not null), 1)::float dias from g_prospeccion`),
    q<{ estado: string; n: number }>("select estado, count(*)::int n from g_prospeccion group by 1"),
    q<any>(`select canal, count(*) filter (where enviado_en is not null)::int salieron,
              count(*) filter (where estado in ('respondio','reunion','ganado'))::int respondieron, count(*) filter (where estado='borrador')::int borradores
            from g_prospeccion group by 1 order by 2 desc`),
    q<any>(`select campania, mode() within group (order by tipo) tipo, count(*)::int total, count(*) filter (where estado='borrador')::int borradores,
              count(*) filter (where enviado_en is not null)::int enviados,
              count(*) filter (where estado in ('respondio','reunion','ganado'))::int respondieron,
              count(*) filter (where estado in ('reunion','ganado'))::int reuniones, count(*) filter (where estado='ganado')::int ganados,
              round(avg(respondio_en - enviado_en) filter (where respondio_en is not null and enviado_en is not null), 1)::float dias_respuesta,
              max(coalesce(respondio_en, enviado_en, creado::date)) ultimo
            from g_prospeccion group by 1 order by ultimo desc nulls last`),
    q<any>("select tipo, count(*)::int n, count(*) filter (where estado in ('respondio','reunion','ganado'))::int r from g_prospeccion group by 1 order by 2 desc"),
    q<any>(`select id, organizacion, persona, canal, campania, seguimiento from g_prospeccion where estado='enviado' and seguimiento <= ${HOY} order by seguimiento limit 30`),
    q<any>(`select e.fecha, e.tipo, e.detalle, e.por, p.organizacion, p.persona, p.canal, p.campania from g_prospeccion_eventos e join g_prospeccion p on p.id=e.prospeccion_id
            order by e.fecha desc, e.id desc limit 40`),
    q<any>(`select to_char(date_trunc('week', d), 'YYYY-MM-DD') s, count(*) filter (where k='env')::int env, count(*) filter (where k='resp')::int resp from (
              select enviado_en d, 'env' k from g_prospeccion where enviado_en is not null
              union all select respondio_en, 'resp' from g_prospeccion where respondio_en is not null) x
            where d >= ${HOY} - 84 group by 1 order by 1`),
  ])
  const E = Object.fromEntries(porEstado.map((x) => [x.estado, x.n])) as Record<string, number>
  const total = porEstado.reduce((a, x) => a + x.n, 0)
  const salieron = tot?.salieron ?? 0
  const respondieron = tot?.respondieron ?? 0
  return { total, E, salieron, respondieron, diasRespuesta: tot?.dias ?? null, porCanal, porCampania, porTipo, vencidos, eventos, semanas }
}

export const CANAL_N = Object.fromEntries(CANALES_PROS.map((o) => [o.v, o.n])) as Record<string, string>
export const TIPO_N = Object.fromEntries(TIPOS_PROS.map((o) => [o.v, o.n])) as Record<string, string>
