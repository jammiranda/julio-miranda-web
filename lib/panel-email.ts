import { q, one } from "@/lib/db"
import { LIMITE_DIARIO, enviadosHoy, EXCLUIDOS_SQL } from "@/lib/email"

/** Estadísticas de envíos de email para el Panel de Contenido (solo cifras agregadas, sin emails ni nombres). */

const NOMBRES: [RegExp, string][] = [
  [/devisebit\.com\/webs/, "Landing · Webs"],
  [/devisebit\.com\/sistemas/, "Landing · Sistemas"],
  [/devisebit\.com\/whatsapp/, "Landing · WhatsApp con IA"],
  [/devisebit\.com\/redes/, "Landing · Redes"],
  [/devisebit\.com\/comunidad/, "Landing · Comunidad y academia"],
  [/devisebit\.com\/productos/, "Landing · Productos"],
  [/transformacion-digital\.html/, "Autodiagnóstico gratis"],
  [/devisebit\.com\/transformacion-digital/, "Transformación digital"],
  [/wa\.me|whatsapp\.com/, "WhatsApp"],
  [/\/agendar/, "Agendar reunión"],
  [/academia\.devisebit\.com/, "Academia"],
  [/instagram\.com/, "Instagram"],
  [/linkedin\.com/, "LinkedIn"],
  [/youtube\.com|youtu\.be/, "YouTube"],
  [/devisebit\.com\/novedades/, "Blog"],
]
export const nombreLink = (u: string) => NOMBRES.find(([r]) => r.test(u))?.[1] ?? u.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").slice(0, 60)

const CLASE: Record<string, string> = { cliente: "Clientes", oportunidad: "Oportunidades", suscriptor: "Email marketing", alumno: "Alumnos", aliado: "Aliados y red" }

export async function emailPanel(dias = 30) {
  const desde = `now() - interval '${Math.max(1, Math.min(365, Math.round(dias)))} days'`
  const [tot, porDia, campanias, clics, porLista, porHora, cola, base, hoy] = await Promise.all([
    one<any>(`select count(*) filter (where estado='enviado')::int enviados, count(entregado_en)::int entregados, count(abierto_en)::int abiertos, count(clic_en)::int clics,
                coalesce(sum(clics),0)::int clics_total, count(*) filter (where baja)::int bajas,
                count(*) filter (where rebote in ('hard_bounce','invalid_email','blocked'))::int rebotes, count(*) filter (where rebote in ('spam','complaint'))::int spam,
                count(*) filter (where estado='error')::int errores
              from em_envios where coalesce(enviado_en, now()) > ${desde}`),
    q<{ d: string; env: number; ab: number; cl: number }>(`with d as (select generate_series((now() at time zone 'America/Argentina/Buenos_Aires')::date - ${Math.round(dias) - 1}, (now() at time zone 'America/Argentina/Buenos_Aires')::date, '1 day')::date d)
      select to_char(d.d,'YYYY-MM-DD') d,
        (select count(*) from em_envios e where (e.enviado_en at time zone 'America/Argentina/Buenos_Aires')::date=d.d)::int env,
        (select count(*) from em_envios e where (e.abierto_en at time zone 'America/Argentina/Buenos_Aires')::date=d.d)::int ab,
        (select count(*) from em_envios e where (e.clic_en at time zone 'America/Argentina/Buenos_Aires')::date=d.d)::int cl
      from d order by d.d`),
    q<any>(`select k.id, k.asunto, k.estado, k.lanzada, count(e.id)::int total, count(e.id) filter (where e.estado='enviado')::int enviados, count(e.id) filter (where e.estado='pendiente')::int pendientes,
              count(e.abierto_en)::int abiertos, count(e.clic_en)::int clics, count(*) filter (where e.baja)::int bajas, count(*) filter (where e.rebote in ('hard_bounce','invalid_email','blocked'))::int rebotes
            from em_campanias k left join em_envios e on e.campania_id=k.id where k.estado <> 'borrador' or k.clave is not null group by k.id order by coalesce(k.lanzada, k.creado) desc limit 12`),
    q<{ url: string; personas: number; n: number }>(`select regexp_replace(url, '[?#].*$', '') url, count(distinct envio_id)::int personas, count(*)::int n from em_clics where creado > ${desde} group by 1 order by 2 desc limit 20`),
    q<{ k: string; env: number; ab: number; cl: number }>(`select coalesce(c.clase,'sin lista') k, count(*)::int env, count(e.abierto_en)::int ab, count(e.clic_en)::int cl
            from em_envios e left join db_contactos c on c.id=e.contacto_id where e.estado='enviado' and e.enviado_en > ${desde} group by 1 order by 2 desc`),
    q<{ h: number; n: number }>(`select extract(hour from abierto_en at time zone 'America/Argentina/Buenos_Aires')::int h, count(*)::int n from em_envios where abierto_en > ${desde} group by 1 order by 1`),
    one<{ n: number }>("select count(*)::int n from em_envios e join em_campanias k on k.id=e.campania_id where e.estado='pendiente' and k.estado='enviando'"),
    one<any>(`select count(*) filter (where email is not null and email_estado='activo' and clase is not null and clase<>'descartado' and not ${EXCLUIDOS_SQL})::int enviables,
                count(*) filter (where email is not null and ${EXCLUIDOS_SQL})::int excluidos,
                count(*) filter (where email is not null and email_estado='activo' and clase is null)::int sin_lista,
                count(*) filter (where email_estado='baja')::int bajas, count(*) filter (where email_estado='rebotado')::int rebotados,
                count(*) filter (where email_estado='activo' and exists (select 1 from em_envios e where e.contacto_id=c.id and (e.abierto_en is not null or e.clic_en is not null)))::int respondieron,
                count(*) filter (where clase='descartado')::int descartados,
                count(*) filter (where tags && array['red-julio','linkedin','seguidor-devisebit'])::int red, count(*) filter (where 'no-enviar' = any(tags))::int no_enviar from db_contactos c`),
    enviadosHoy(),
  ])
  // Los clics por link se agrupan por destino con nombre legible (una landing puede tener varias URL).
  const agrup = new Map<string, { personas: number; n: number }>()
  for (const c of clics) { const k = nombreLink(c.url); const a = agrup.get(k) ?? { personas: 0, n: 0 }; a.personas += c.personas; a.n += c.n; agrup.set(k, a) }
  return {
    tot, porDia, campanias, cola: cola?.n ?? 0, base, hoy, limite: LIMITE_DIARIO,
    links: [...agrup.entries()].map(([k, v]) => ({ k, ...v })).sort((a, b) => b.personas - a.personas),
    porLista: porLista.map((x) => ({ ...x, k: CLASE[x.k] ?? (x.k === "sin lista" ? "Sin lista" : x.k) })),
    porHora: Array.from({ length: 24 }, (_, h) => ({ h, n: porHora.find((x) => x.h === h)?.n ?? 0 })),
    webhook: !!process.env.BREVO_WEBHOOK_KEY,
  }
}
