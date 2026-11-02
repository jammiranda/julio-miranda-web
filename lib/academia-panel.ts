import { q, one } from "./db"
import { safe } from "./panel"
import { PROGRAMAS } from "./programas"

/**
 * ACADEMIA DEVISEBIT para el Panel de Contenido, con la misma estructura que hoy tiene academia.devisebit.com:
 * Cursos (a tu ritmo, con certificado y módulo 1 gratis en algunos), Programas ejecutivos (lista de espera),
 * Guías gratis, Descargas (productos digitales y servicios), Videos (canal de YouTube), Autodiagnóstico y la lista de suscriptores.
 * Solo cifras agregadas.
 */
export async function academiaPanel() {
  const [cursos, guias, guiasTop, productos, diag, diagNivel, espera, visitas, embudo, subs, eventos] = await Promise.all([
    safe(q<{ slug: string; titulo: string; categoria: string | null; estado: string; precio: number | null; precio_usd: number | null; horas: number | null; nuevo: boolean; gratis_modulos: number; lecciones: number; inscriptos: number; activos30: number; nuevos30: number; aprobados: number; certificados: number; parciales: number; ventas: number; ingresos: number; progreso: number | null }>(`
      select c.slug, c.titulo, c.categoria, c.estado, c.precio::float precio, c.precio_usd::float precio_usd, c.horas::float horas, c.nuevo, c.gratis_modulos,
        (select count(*) from am_lecciones l where l.curso_id=c.id and l.publicada)::int lecciones,
        count(distinct i.contacto_id) filter (where i.estado <> 'baja')::int inscriptos,
        count(distinct i.contacto_id) filter (where i.ultima_actividad > now()-interval '30 days')::int activos30,
        count(distinct i.contacto_id) filter (where i.creado > now()-interval '30 days')::int nuevos30,
        count(distinct i.id) filter (where i.estado='aprobado')::int aprobados,
        count(distinct ce.id) filter (where not ce.anulado)::int certificados,
        count(distinct i.id) filter (where i.parcial)::int parciales,
        (select count(*) from am_ordenes o where o.curso_id=c.id and o.estado='pagada')::int ventas,
        (select coalesce(sum(o.monto),0) from am_ordenes o where o.curso_id=c.id and o.estado='pagada' and coalesce(o.moneda,'ARS')='ARS')::float ingresos,
        (select round(avg(x.pct)) from (select i2.id, 100.0 * count(p.leccion_id) / nullif((select count(*) from am_lecciones l2 where l2.curso_id=c.id and l2.publicada),0) pct
           from am_inscripciones i2 join am_ediciones e2 on e2.id=i2.edicion_id left join am_progreso p on p.inscripcion_id=i2.id
           where e2.curso_id=c.id and i2.estado <> 'baja' group by i2.id) x)::float progreso
      from am_cursos c
      left join am_ediciones e on e.curso_id=c.id
      left join am_inscripciones i on i.edicion_id=e.id
      left join am_certificados ce on ce.inscripcion_id=i.id
      where c.estado <> 'archivado'
      group by c.id order by c.estado='publicado' desc, c.nuevo desc, c.destacado desc, c.id`)),
    safe(one<{ pub: number; borr: number; excl: number; vistas: number; nuevas30: number }>(`select count(*) filter (where publicada)::int pub, count(*) filter (where not publicada)::int borr, count(*) filter (where publicada and exclusiva)::int excl, coalesce(sum(vistas),0)::int vistas, count(*) filter (where publicada and creado > now()-interval '30 days')::int nuevas30 from am_guias`)),
    safe(q<{ titulo: string; slug: string; vistas: number; categoria: string }>(`select titulo, slug, vistas, coalesce(categoria,'') categoria from am_guias where publicada order by vistas desc, actualizado desc limit 10`)),
    safe(q<{ slug: string; titulo: string; estado: string; servicio: boolean; precio: number | null; ventas: number; ingresos: number; pendientes: number }>(`
      select p.slug, p.titulo, p.estado, coalesce(p.servicio,false) servicio, p.precio::float precio,
        count(o.id) filter (where o.estado='pagada')::int ventas, coalesce(sum(o.monto) filter (where o.estado='pagada' and coalesce(o.moneda,'ARS')='ARS'),0)::float ingresos,
        count(o.id) filter (where o.estado='pendiente' and o.creado > now()-interval '30 days')::int pendientes
      from am_productos p left join am_ordenes o on o.producto_id=p.id
      where p.slug <> 'prueba-de-pago' and p.estado <> 'oculto' group by p.id order by p.estado='venta' desc, ventas desc, p.id`)),
    safe(one<{ total: number; d30: number; d7: number; promedio: number | null }>(`select count(*)::int total, count(*) filter (where creado > now()-interval '30 days')::int d30, count(*) filter (where creado > now()-interval '7 days')::int d7, round(avg(puntaje))::int promedio from demo_diagnosticos`)),
    safe(q<{ k: string; c: number }>(`select coalesce(nivel,'sin nivel') k, count(*)::int c from demo_diagnosticos group by 1 order by 2 desc limit 8`)),
    safe(q<{ tag: string; c: number }>(`select t tag, count(*)::int c from db_contactos, unnest(tags) t where t like 'espera-%' group by 1`)),
    safe(one<{ d7: number; d30: number }>(`select coalesce(sum(n) filter (where dia > current_date - 7),0)::int d7, coalesce(sum(n),0)::int d30 from pv_visitas where dia > current_date - 30 and host like 'academia.%'`)),
    safe(one<{ suscriptos: number; inscriptos: number; compradores: number; certificados: number }>(`select
      (select count(*) from db_contactos where suscrito_en is not null and email_estado='activo')::int suscriptos,
      (select count(distinct contacto_id) from am_inscripciones where estado <> 'baja')::int inscriptos,
      (select count(distinct lower(email)) from am_ordenes where estado='pagada')::int compradores,
      (select count(*) from am_certificados where not anulado)::int certificados`)),
    safe(one<{ act: number; d7: number; d30: number; bajas: number }>(`select count(*) filter (where suscrito_en is not null and email_estado='activo')::int act, count(*) filter (where suscrito_en > now()-interval '7 days')::int d7, count(*) filter (where suscrito_en > now()-interval '30 days')::int d30, count(*) filter (where email_estado='baja')::int bajas from db_contactos`)),
    safe(q<{ tipo: string; c: number }>(`select tipo, count(*)::int c from am_eventos where creado > now()-interval '30 days' group by tipo order by 2 desc`)),
  ])
  const esperaPor = new Map((espera ?? []).map((e) => [e.tag, Number(e.c)]))
  return {
    cursos: cursos ?? [],
    programas: PROGRAMAS.map((p) => ({ ...p, interesados: esperaPor.get(p.tag) ?? 0 })),
    guias: { ...(guias ?? { pub: 0, borr: 0, excl: 0, vistas: 0, nuevas30: 0 }), top: guiasTop ?? [] },
    productos: productos ?? [],
    diagnosticos: { ...(diag ?? { total: 0, d30: 0, d7: 0, promedio: null }), porNivel: diagNivel ?? [] },
    visitas: visitas ?? null,
    embudo: embudo ?? null,
    suscriptores: subs ?? null,
    actividad30: eventos ?? [],
    listaEspera: [...esperaPor.entries()].map(([tag, c]) => ({ tag, c })).sort((a, b) => b.c - a.c),
  }
}
