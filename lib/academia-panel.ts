import { q, one } from "./db"
import { safe } from "./panel"
import { PROGRAMAS } from "./programas"

const HOY = `(now() at time zone 'America/Argentina/Buenos_Aires')::date`
/** Páginas privadas del alumno (con códigos o ids en la ruta) se agrupan para que nunca salgan identificadores sueltos. */
const PAGINA = `case when path ~ '^/(mi-cuenta|certificado|descarga|gracias|r)(/|$)' then '/' || split_part(path,'/',2) || '/*' else path end`

type Tipo = "directo" | "buscadores" | "redes" | "mails" | "anuncios" | "otros sitios"
/** Agrupa el origen de cada visita: sin origen = directo; utm:* viene de los links con parámetros (mails, anuncios, redes). */
function tipoOrigen(ref: string): Tipo {
  if (!ref) return "directo"
  if (ref.startsWith("utm:")) {
    const v = ref.slice(4)
    if (v === "email") return "mails"
    if (/^(cpc|ppc|paid|ads|google-?ads|meta-?ads|display)/.test(v)) return "anuncios"
    if (/^(facebook|fb|instagram|ig|linkedin|twitter|x|tiktok|youtube|whatsapp|wa|social|meta|threads)/.test(v)) return "redes"
    if (/^(google|bing|search|seo)/.test(v)) return "buscadores"
    return "otros sitios"
  }
  if (/^(mail|webmail|outlook)\.|^mail\.google\./.test(ref)) return "mails"
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|yandex|baidu)\./.test(ref)) return "buscadores"
  if (/(^|\.)(facebook|instagram|linkedin|lnkd\.in|t\.co|twitter|x\.com|youtube|youtu\.be|tiktok|wa\.me|whatsapp|pinterest|reddit|threads)(\.|$)/.test(ref)) return "redes"
  return "otros sitios"
}
const tipoPagina = (p: string) => (p === "/" ? "inicio" : p.startsWith("/cursos/") ? "curso" : p.startsWith("/guias/") ? "guia" : p.startsWith("/productos/") ? "producto" : p.startsWith("/programas") ? "programa" : "otra")

/**
 * ACADEMIA DEVISEBIT para el Panel de Contenido, con la misma estructura que hoy tiene academia.devisebit.com:
 * Cursos (a tu ritmo, con certificado y módulo 1 gratis en algunos), Programas ejecutivos (lista de espera),
 * Guías gratis, Descargas (productos digitales y servicios), Videos (canal de YouTube), Autodiagnóstico y la lista de suscriptores.
 * Solo cifras agregadas.
 */
export async function academiaPanel() {
  const [cursos, guias, guiasTop, productos, diag, diagNivel, espera, visitas, embudo, subs, eventos, vPaginas, vOrigenes, vClics, vClicsPag, vPorDia, vClicsDesde] = await Promise.all([
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
    // Visitas por página (30 días y 7 días). Solo contadores por ruta, sin personas.
    safe(q<{ pagina: string; d7: number; d30: number }>(`select ${PAGINA} pagina, coalesce(sum(n) filter (where dia > ${HOY}-7),0)::int d7, coalesce(sum(n),0)::int d30
      from pv_visitas where host like 'academia.%' and dia > ${HOY}-30 group by 1 order by 3 desc limit 200`)),
    safe(q<{ ref: string; c: number }>(`select ref, sum(n)::int c from pv_visitas where host like 'academia.%' and dia > ${HOY}-30 group by ref order by 2 desc`)),
    safe(q<{ accion: string; d7: number; d30: number }>(`select accion, coalesce(sum(n) filter (where dia > ${HOY}-7),0)::int d7, coalesce(sum(n),0)::int d30
      from pv_clics where host like 'academia.%' and dia > ${HOY}-30 group by accion order by 3 desc`)),
    safe(q<{ pagina: string; accion: string; c: number }>(`select ${PAGINA} pagina, accion, sum(n)::int c from pv_clics where host like 'academia.%' and dia > ${HOY}-30 group by 1,2 order by 3 desc limit 40`)),
    safe(q<{ dia: string; c: number }>(`select to_char(d::date,'YYYY-MM-DD') dia, coalesce(sum(v.n),0)::int c
      from generate_series(${HOY}-29, ${HOY}, interval '1 day') d left join pv_visitas v on v.dia = d::date and v.host like 'academia.%' group by d order by d`)),
    safe(one<{ desde: string | null }>(`select to_char(min(dia),'YYYY-MM-DD') desde from pv_clics where host like 'academia.%'`)),
  ])
  const esperaPor = new Map((espera ?? []).map((e) => [e.tag, Number(e.c)]))

  // Páginas más vistas, con el nombre del curso cuando la ruta es de un curso
  const tituloCurso = new Map((cursos ?? []).map((c) => [`/cursos/${c.slug}`, c.titulo]))
  const paginasTodas = (vPaginas ?? []).map((p) => ({ pagina: p.pagina, tipo: tipoPagina(p.pagina), titulo: tituloCurso.get(p.pagina) ?? null, d7: Number(p.d7), d30: Number(p.d30) }))
  const vistasPor = new Map(paginasTodas.map((p) => [p.pagina, p]))
  const clicsPorPagina = new Map<string, Record<string, number>>()
  for (const c of vClicsPag ?? []) clicsPorPagina.set(c.pagina, { ...(clicsPorPagina.get(c.pagina) ?? {}), [c.accion]: Number(c.c) })

  // Origen de las visitas: por tipo (buscadores, directo, redes, mails, anuncios, otros sitios) y los orígenes más frecuentes
  const totalOrigen = (vOrigenes ?? []).reduce((s, o) => s + Number(o.c), 0)
  const porTipo = new Map<Tipo, number>()
  for (const o of vOrigenes ?? []) porTipo.set(tipoOrigen(o.ref), (porTipo.get(tipoOrigen(o.ref)) ?? 0) + Number(o.c))
  const clicsTotales = Object.fromEntries((vClics ?? []).map((c) => [c.accion, { d7: Number(c.d7), d30: Number(c.d30) }]))

  return {
    cursos: cursos ?? [],
    programas: PROGRAMAS.map((p) => ({ ...p, interesados: esperaPor.get(p.tag) ?? 0 })),
    guias: { ...(guias ?? { pub: 0, borr: 0, excl: 0, vistas: 0, nuevas30: 0 }), top: guiasTop ?? [] },
    productos: productos ?? [],
    diagnosticos: { ...(diag ?? { total: 0, d30: 0, d7: 0, promedio: null }), porNivel: diagNivel ?? [] },
    visitas: visitas ?? null,
    /** Páginas más vistas (30 y 7 días) y, aparte, cada curso con sus visitas, inscriptos, ventas y clics de botones. */
    paginasMasVistas: paginasTodas.slice(0, 30),
    cursosVisitas: (cursos ?? []).filter((c) => c.estado === "publicado").map((c) => {
      const p = vistasPor.get(`/cursos/${c.slug}`)
      return { slug: c.slug, titulo: c.titulo, visitas7: p?.d7 ?? 0, visitas30: p?.d30 ?? 0, inscriptos: c.inscriptos, ventas: c.ventas, clics: clicsPorPagina.get(`/cursos/${c.slug}`) ?? {} }
    }),
    /** De dónde llegan las visitas de los últimos 30 días. Los mails se reconocen por utm_medium=email en el link. */
    origenes: {
      total: totalOrigen,
      porTipo: Array.from(porTipo.entries()).map(([tipo, v]) => ({ tipo, visitas: v, pct: totalOrigen ? Math.round((v * 1000) / totalOrigen) / 10 : 0 })).sort((a, b) => b.visitas - a.visitas),
      top: (vOrigenes ?? []).slice(0, 12).map((o) => ({ origen: o.ref || "directo", tipo: tipoOrigen(o.ref), visitas: Number(o.c) })),
    },
    /** Clics en los botones de suscripción, inscripción y compra (30 y 7 días), por página. Se cuentan desde `desde`; antes no se medían. */
    clics: { desde: vClicsDesde?.desde ?? null, totales: clicsTotales, porPagina: (vClicsPag ?? []).slice(0, 25).map((c) => ({ pagina: c.pagina, accion: c.accion, clics: Number(c.c) })) },
    /** Visitas por día de los últimos 30 días (el más antiguo primero; los días sin visitas figuran en 0). */
    visitasPorDia: (vPorDia ?? []).map((d) => ({ dia: d.dia, visitas: Number(d.c) })),
    embudo: embudo ?? null,
    suscriptores: subs ?? null,
    actividad30: eventos ?? [],
    listaEspera: [...esperaPor.entries()].map(([tag, c]) => ({ tag, c })).sort((a, b) => b.c - a.c),
  }
}
