import { one } from "./db"
import type { Usuario } from "./auth"

export type Aviso = { t: string; d: string; href: string; nivel: "alta" | "media"; n: number }

/** Avisos importantes: lo que hay que mirar hoy. */
export async function avisos(u: Usuario): Promise<Aviso[]> {
  const out: Aviso[] = []
  if (u.rol === "consulta") return out
  try {
    const c = await one<{ humano: number; nuevas: number; demoradas: number }>(
      `select count(*) filter (where necesita_humano and estado <> 'descartada')::int humano,
              count(*) filter (where estado='nueva')::int nuevas,
              count(*) filter (where estado='nueva' and creado < now() - interval '4 hours')::int demoradas
       from consultas`,
    )
    if (c?.humano) out.push({ t: "Piden hablar con una persona", d: "Conversaciones esperando respuesta del equipo", href: "/consultas?v=bandeja", nivel: "alta", n: c.humano })
    if (c?.demoradas) out.push({ t: "Consultas sin atender hace más de 4 h", d: "Respondelas antes de que se enfríen", href: "/consultas?v=bandeja", nivel: "alta", n: c.demoradas })
    else if (c?.nuevas) out.push({ t: "Consultas nuevas", d: "Entraron y todavía nadie respondió", href: "/consultas?v=bandeja", nivel: "media", n: c.nuevas })
    const px = await one<{ n: number }>("select count(*)::int n from db_contactos where etapa not in ('ganado','perdido') and proximo_fecha <= (now() at time zone 'America/Argentina/Buenos_Aires')::date")
    if (px?.n) out.push({ t: "Seguimientos para hoy", d: "Contactos con próximo paso vencido o de hoy", href: "/", nivel: "media", n: px.n })
    const pr = await one<{ n: number }>("select count(*)::int n from db_proyectos where estado in ('planificado','en_curso') and entrega < (now() at time zone 'America/Argentina/Buenos_Aires')::date")
    if (pr?.n) out.push({ t: "Proyectos con entrega vencida", d: "Revisá fechas o estado", href: "/proyectos", nivel: "alta", n: pr.n })
  } catch {}
  return out
}
