import { q, one } from "./db"
import type { Usuario } from "./auth"

export type Aviso = { t: string; d: string; href: string; nivel: "alta" | "media"; n: number }

/** Avisos importantes según el rol: lo que hay que mirar hoy. */
export async function avisos(u: Usuario): Promise<Aviso[]> {
  const out: Aviso[] = []
  const hoy = new Date().toISOString().slice(0, 10)
  const en7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  const hace7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
  const ed = u.rol === "gerente" || u.rol === "coordinacion"
  try {
    if (ed) {
      const c = await one<{ humano: number; nuevas: number; demoradas: number }>(
        `select count(*) filter (where necesita_humano and estado not in ('ingreso','descartada'))::int humano,
                count(*) filter (where estado='nueva')::int nuevas,
                count(*) filter (where estado='nueva' and creado < now() - interval '4 hours')::int demoradas
         from consultas where empresa='sanpatricio'`,
      )
      if (c?.humano) out.push({ t: "Piden hablar con una persona", d: "Consultas de WhatsApp esperando respuesta del equipo", href: "/consultas?v=bandeja", nivel: "alta", n: c.humano })
      if (c?.demoradas) out.push({ t: "Consultas sin atender hace más de 4 h", d: "Respondelas antes de que se enfríen", href: "/consultas?v=bandeja", nivel: "alta", n: c.demoradas })
      else if (c?.nuevas) out.push({ t: "Consultas nuevas", d: "Entraron y todavía nadie respondió", href: "/consultas?v=bandeja", nivel: "media", n: c.nuevas })
      if (u.rol === "gerente") {
        const db = await one<{ n: number }>("select count(*)::int n from consultas where empresa='devisebit' and estado in ('nueva') ")
        if (db?.n) out.push({ t: "Consultas de DEVISEBIT", d: "Leads nuevos del WhatsApp de DEVISEBIT", href: "/consultas?e=devisebit", nivel: "media", n: db.n })
        const px = await one<{ n: number }>("select count(*)::int n from db_contactos where etapa not in ('ganado','perdido') and proximo_fecha <= (now() at time zone 'America/Argentina/Buenos_Aires')::date").catch(() => null)
        if (px?.n) out.push({ t: "Seguimientos DEVISEBIT para hoy", d: "Contactos con próximo paso vencido o de hoy", href: "/devisebit", nivel: "media", n: px.n })
      }
    }
    if (u.rol !== "consulta") {
      const op = await one<{ venc: number; prox: number }>(
        `select count(*) filter (where o.fecha_vencimiento < $1)::int venc, count(*) filter (where o.fecha_vencimiento between $1 and $2)::int prox
         from ordenes o join pacientes p on p.id=o.paciente_id where o.estado='vigente' and p.estado='activo'`,
        [hoy, en7],
      )
      if (op?.venc) out.push({ t: "OP vencidas", d: "Pacientes activos con la orden vencida", href: "/", nivel: "alta", n: op.venc })
      if (op?.prox) out.push({ t: "OP que vencen en 7 días", d: "Gestioná la renovación a tiempo", href: "/", nivel: "media", n: op.prox })
      const sv = await one<{ n: number }>(
        `select count(*)::int n from (select p.id from pacientes p join ordenes o on o.paciente_id=p.id and o.estado='vigente'
           left join visitas v on v.paciente_id=p.id and v.estado='realizada' where p.estado='activo'
           group by p.id having max(v.fecha) is null or max(v.fecha) < $1) x`,
        [hace7],
      )
      if (sv?.n) out.push({ t: "Pacientes sin visita hace 7+ días", d: "Revisá la agenda", href: "/", nivel: "media", n: sv.n })
      const app = await one<{ n: number }>("select count(*)::int n from visitas where estado='realizada' and not app_pami and fecha >= date_trunc('month', now())")
      if (app?.n) out.push({ t: "Visitas sin registrar en la APP PAMI", d: "Lo que no se registra no se paga", href: "/agenda", nivel: "alta", n: app.n })
      const docs = await one<{ n: number }>("select count(*)::int n from adjuntos where hc_id is null")
      if (docs?.n && ed) out.push({ t: "Documentos sin pasar a la historia clínica", d: "Fotos o PDF subidos que no se guardaron como registro", href: "/pacientes", nivel: "media", n: docs.n })
    }
    const dia = new Date().getDate()
    if (ed && dia >= 8 && dia <= 15) out.push({ t: "Transmitir consumos en Efectores Web", d: `Límite el día 15 (meta interna: día 12). Hoy es ${dia}.`, href: "/cierre", nivel: dia >= 12 ? "alta" : "media", n: 1 })
  } catch {}
  return out
}
