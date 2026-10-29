import { unstable_cache } from "next/cache"
import { q, one } from "@/lib/db"
import { YT_CANAL_ID, YT_URL, VIDEOS_BASE } from "@/lib/youtube"

/**
 * Datos del Panel de Contenido DEVISEBIT (solo cifras agregadas, sin nombres, emails ni teléfonos).
 * Los usan /api/panel y el panel propio (panel.devisebit.com).
 */
export const SITIOS = [
  { id: "web", nombre: "devisebit.com", url: "https://www.devisebit.com/" },
  { id: "novedades", nombre: "Novedades", url: "https://www.devisebit.com/novedades" },
  { id: "academia", nombre: "academia.devisebit.com", url: "https://academia.devisebit.com/" },
  { id: "desarrollo", nombre: "desarrollo.devisebit.com", url: "https://desarrollo.devisebit.com/desarrollo" },
  { id: "sistema", nombre: "sistema.devisebit.com", url: "https://sistema.devisebit.com/login" },
]

async function medir(url: string) {
  const t0 = Date.now()
  try {
    const r = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(9000), headers: { "user-agent": "devisebit-panel-monitor" } })
    const html = await r.text()
    return { ok: r.ok, status: r.status, ms: Date.now() - t0, kb: Math.round(html.length / 1024), html }
  } catch {
    return { ok: false, status: 0, ms: Date.now() - t0, kb: 0, html: "" }
  }
}

const MESES: Record<string, string> = { enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06", julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10", noviembre: "11", diciembre: "12" }
const limpio = (s: string) => s.replace(/<!--.*?-->/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim()
function fechaISO(t: string) {
  const m = t.toLowerCase().match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/)
  return m && MESES[m[2]] ? `${m[3]}-${MESES[m[2]]}-${m[1].padStart(2, "0")}` : ""
}
function novedades(html: string) {
  const out: { slug: string; titulo: string; categoria: string; fecha: string; resumen: string; url: string }[] = []
  const re = /<a[^>]*href="\/novedades\/([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (out.some((x) => x.slug === m![1])) continue
    const ps = [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => limpio(x[1]))
    const h = m[2].match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/)
    const partes = (ps[0] ?? "").split(" · ").map((x) => x.trim()).filter((x) => x && !/^última nota$/i.test(x))
    out.push({ slug: m[1], titulo: h ? limpio(h[1]) : m[1], categoria: partes[0] ?? "", fecha: fechaISO(partes[partes.length - 1] ?? ""), resumen: ps[1] ?? "", url: "https://www.devisebit.com/novedades/" + m[1] })
  }
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export const n = (v: unknown) => (v == null ? null : Number(v))
export async function safe<T>(p: Promise<T>): Promise<T | null> { try { return await p } catch { return null } }

/** YouTube por el feed público (sin claves): últimos videos con vistas y me gusta; suscriptores si la página los muestra. */
export async function youtube() {
  const des = (t: string) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  const [feed, canal] = await Promise.all([
    fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CANAL_ID}`, { cache: "no-store", signal: AbortSignal.timeout(9000) }).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
    fetch(`${YT_URL}/about`, { cache: "no-store", signal: AbortSignal.timeout(9000), headers: { "accept-language": "es-AR,es;q=0.9", "user-agent": "Mozilla/5.0" } }).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
  ])
  let videos = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const e = m[1]
    const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ""
    return {
      id: e.match(/<yt:videoId>([^<]+)/)?.[1] ?? "",
      titulo: des(e.match(/<title>([^<]*)/)?.[1] ?? ""),
      fecha: e.match(/<published>([^<]+)/)?.[1] ?? "",
      corto: link.includes("/shorts/"),
      url: link,
      vistas: n(e.match(/<media:statistics views="(\d+)"/)?.[1]),
      meGusta: n(e.match(/<media:starRating count="(\d+)"/)?.[1]),
    }
  }).filter((v) => v.id)
  if (!videos.length) videos = VIDEOS_BASE.map((v) => ({ ...v, url: v.corto ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`, vistas: null, meGusta: null }))
  const subTxt = canal.match(/"([\d.,]+\s*(?:mil\s*)?(?:K\s*)?)\s*(?:suscriptores|subscribers)"/i)?.[1] ?? null
  const subs = subTxt ? (() => { const s = subTxt.toLowerCase().replace(/\s/g, ""); const base = parseFloat(s.replace(/mil|k/g, "").replace(/\./g, "").replace(",", ".")); return Number.isFinite(base) ? Math.round(/mil|k/.test(s) ? base * 1000 : base) : null })() : null
  const d30 = videos.filter((v) => v.fecha && Date.now() - new Date(v.fecha).getTime() < 30 * 864e5)
  const suma = (a: typeof videos, k: "vistas" | "meGusta") => (a.some((v) => v[k] != null) ? a.reduce((s, v) => s + (v[k] ?? 0), 0) : null)
  return {
    canal: YT_URL,
    suscriptores: subs,
    videos: videos.length,
    cortos: videos.filter((v) => v.corto).length,
    publicados30: d30.length,
    vistas: suma(videos, "vistas"),
    vistas30: suma(d30, "vistas"),
    meGusta: suma(videos, "meGusta"),
    ultimo: videos[0]?.fecha ?? null,
    lista: videos.slice(0, 10),
    nota: "Datos del feed público de YouTube (últimos 15 videos). Vistas y me gusta por video; suscriptores si YouTube los muestra.",
  }
}

/** Estado de los sitios y notas del blog (mide cada sitio; tarda unos segundos). */
export async function panelWeb() {
  const checks = await Promise.all(SITIOS.map((s) => medir(s.url)))
  const sitios = SITIOS.map((s, i) => ({ id: s.id, nombre: s.nombre, url: s.url, ok: checks[i].ok, status: checks[i].status, ms: checks[i].ms, kb: checks[i].kb }))
  const notas = novedades(checks[1].html)
  return { sitios, novedades: { total: notas.length, ultimos30: notas.filter((x) => x.fecha && Date.now() - new Date(x.fecha + "T12:00:00-03:00").getTime() < 30 * 864e5).length, notas: notas.slice(0, 12) } }
}

/** YouTube con caché de 15 minutos (para el panel). */
export const youtubeCache = unstable_cache(() => youtube(), ["pc-youtube"], { revalidate: 900 })

/** Cifras de la base: visitas, CRM, usuarios y Academia. */
export async function panelMetricas() {
  const E = "devisebit"
  const [consEstado, consPer, consCanal, consFuente, consHumano, conv90, etapas, contTot, subs, tags, proy, entregas, reun, wa, wa7, emails, guias, guiasTop, prods, ventas, ventasTot, visDia, visHost, visPath, visRef, visDisp] = await Promise.all([
    safe(q<{ estado: string; c: number }>(`select estado, count(*)::int c from consultas where empresa=$1 group by estado`, [E])),
    safe(one<{ d7: number; d30: number; p30: number }>(`select count(*) filter (where creado > now()-interval '7 days')::int d7, count(*) filter (where creado > now()-interval '30 days')::int d30, count(*) filter (where creado <= now()-interval '30 days' and creado > now()-interval '60 days')::int p30 from consultas where empresa=$1`, [E])),
    safe(q<{ k: string; c: number }>(`select coalesce(canal,'otro') k, count(*)::int c from consultas where empresa=$1 and creado > now()-interval '30 days' group by 1 order by 2 desc limit 6`, [E])),
    safe(q<{ k: string; c: number }>(`select coalesce(nullif(fuente,''),'sin dato') k, count(*)::int c from consultas where empresa=$1 and creado > now()-interval '30 days' group by 1 order by 2 desc limit 6`, [E])),
    safe(one<{ c: number }>(`select count(*)::int c from consultas where empresa=$1 and necesita_humano and estado in ('nueva','contactada')`, [E])),
    safe(one<{ tot: number; conv: number }>(`select count(*)::int tot, count(*) filter (where estado='convertida')::int conv from consultas where empresa=$1 and creado > now()-interval '90 days'`, [E])),
    safe(q<{ etapa: string; c: number }>(`select etapa, count(*)::int c from db_contactos group by etapa`)),
    safe(one<{ c: number; d30: number }>(`select count(*)::int c, count(*) filter (where creado > now()-interval '30 days')::int d30 from db_contactos`)),
    safe(one<{ act: number; d7: number; d30: number; bajas: number }>(`select count(*) filter (where suscrito_en is not null and email_estado='activo')::int act, count(*) filter (where suscrito_en > now()-interval '7 days')::int d7, count(*) filter (where suscrito_en > now()-interval '30 days')::int d30, count(*) filter (where email_estado='baja')::int bajas from db_contactos`)),
    safe(q<{ k: string; c: number }>(`select t k, count(*)::int c from db_contactos, unnest(tags) t where suscrito_en is not null group by 1 order by 2 desc limit 6`)),
    safe(q<{ estado: string; c: number; monto: number }>(`select estado, count(*)::int c, coalesce(sum(monto),0)::float monto from db_proyectos group by estado`)),
    safe(one<{ c: number }>(`select count(*)::int c from db_proyectos where estado in ('planificado','en_curso') and entrega between current_date and current_date + 14`)),
    safe(one<{ prox: number; real30: number; canc30: number }>(`select count(*) filter (where estado='confirmada' and inicio between now() and now()+interval '7 days')::int prox, count(*) filter (where estado='realizada' and inicio > now()-interval '30 days')::int real30, count(*) filter (where estado in ('cancelada','no_asistio') and inicio > now()-interval '30 days')::int canc30 from db_reuniones`)),
    safe(one<{ chats7: number; chats30: number }>(`select count(distinct wa_id) filter (where creado > now()-interval '7 days')::int chats7, count(distinct wa_id) filter (where creado > now()-interval '30 days')::int chats30 from wa_mensajes where empresa=$1 and autor='cliente'`, [E])),
    safe(q<{ autor: string; c: number }>(`select autor, count(*)::int c from wa_mensajes where empresa=$1 and creado > now()-interval '7 days' group by autor`, [E])),
    safe(one<{ camp: number; env: number; abiertos: number; clics: number }>(`select count(distinct e.campania_id)::int camp, count(*) filter (where e.estado='enviado')::int env, count(*) filter (where e.aperturas>0)::int abiertos, count(*) filter (where e.clics>0)::int clics from em_envios e where coalesce(e.enviado_en, now()) > now()-interval '30 days'`)),
    safe(one<{ pub: number; borr: number; vistas: number }>(`select count(*) filter (where publicada)::int pub, count(*) filter (where not publicada)::int borr, coalesce(sum(vistas),0)::int vistas from am_guias`)),
    safe(q<{ titulo: string; slug: string; vistas: number; categoria: string }>(`select titulo, slug, vistas, coalesce(categoria,'') categoria from am_guias where publicada order by vistas desc, actualizado desc limit 6`)),
    safe(q<{ estado: string; c: number }>(`select estado, count(*)::int c from am_productos where slug <> 'prueba-de-pago' group by estado`)),
    safe(q<{ moneda: string; c: number; monto: number }>(`select coalesce(moneda,'ARS') moneda, count(*)::int c, coalesce(sum(monto),0)::float monto from am_ordenes where estado='pagada' and pagada_en > now()-interval '30 days' group by 1`)),
    safe(one<{ c: number; pend: number }>(`select count(*) filter (where estado='pagada')::int c, count(*) filter (where estado='pendiente' and creado > now()-interval '30 days')::int pend from am_ordenes`)),
    safe(q<{ dia: string; c: number }>(`select to_char(dia,'YYYY-MM-DD') dia, sum(n)::int c from pv_visitas where dia > current_date - 30 group by dia order by dia`)),
    safe(q<{ host: string; d7: number; d30: number }>(`select host, sum(n) filter (where dia > current_date - 7)::int d7, sum(n)::int d30 from pv_visitas where dia > current_date - 30 group by host order by 3 desc`)),
    safe(q<{ host: string; path: string; c: number }>(`select host, path, sum(n)::int c from pv_visitas where dia > current_date - 30 group by host, path order by 3 desc limit 10`)),
    safe(q<{ ref: string; c: number }>(`select case when ref='' then 'directo' else ref end ref, sum(n)::int c from pv_visitas where dia > current_date - 30 group by 1 order by 2 desc limit 8`)),
    safe(q<{ disp: string; c: number }>(`select disp, sum(n)::int c from pv_visitas where dia > current_date - 30 group by 1`)),
  ])

  const [usPortal, usAcad, usEquipo] = await Promise.all([
    safe(one<{ habilitados: number; ingresaron: number; activos30: number; nuevos30: number }>(`select
      count(*) filter (where email is not null and email <> '' and coalesce(portal_acceso,'auto') <> 'no' and (exists (select 1 from db_proyectos p where p.contacto_id=c.id) or exists (select 1 from portal_accesos a where a.contacto_id=c.id)))::int habilitados,
      count(*) filter (where portal_ultimo is not null)::int ingresaron,
      count(*) filter (where portal_ultimo > now()-interval '30 days')::int activos30,
      count(*) filter (where (select min(a.creado) from portal_accesos a where a.contacto_id=c.id) > now()-interval '30 days')::int nuevos30
      from db_contactos c`)),
    safe(one<{ registrados: number; nuevos30: number; alumnos: number; alumnosActivos30: number; compradores: number; certificados: number }>(`select
      (select count(*) from db_contactos where suscrito_en is not null and email_estado='activo')::int registrados,
      (select count(*) from db_contactos where suscrito_en > now()-interval '30 days')::int nuevos30,
      (select count(distinct contacto_id) from am_inscripciones where estado <> 'baja')::int alumnos,
      (select count(distinct contacto_id) from am_inscripciones where ultima_actividad > now()-interval '30 days')::int "alumnosActivos30",
      (select count(distinct lower(email)) from am_ordenes where estado='pagada')::int compradores,
      (select count(*) from am_certificados where not anulado)::int certificados`)),
    safe(one<{ c: number }>(`select count(*)::int c from usuarios where coalesce(activo,true)`)),
  ])
  const salud = await safe(one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='bot'"))
  const map = <T extends Record<string, any>>(rows: T[] | null, k: keyof T, v: keyof T) => Object.fromEntries((rows ?? []).map((r) => [r[k], n(r[v])]))

  return {
      visitas: { dias: visDia ?? [], sitios: visHost ?? [], paginas: visPath ?? [], origenes: visRef ?? [], dispositivos: map(visDisp, "disp", "c") },
      crm: {
        consultas: { porEstado: map(consEstado, "estado", "c"), d7: consPer?.d7 ?? null, d30: consPer?.d30 ?? null, p30: consPer?.p30 ?? null, porCanal: consCanal ?? [], porFuente: consFuente ?? [], esperanHumano: consHumano?.c ?? null, conversion90: conv90 && conv90.tot ? Math.round((conv90.conv / conv90.tot) * 1000) / 10 : null, total90: conv90?.tot ?? null },
        contactos: { porEtapa: map(etapas, "etapa", "c"), total: contTot?.c ?? null, nuevos30: contTot?.d30 ?? null },
        proyectos: { porEstado: Object.fromEntries((proy ?? []).map((r) => [r.estado, { c: n(r.c), monto: n(r.monto) }])), entregas14: entregas?.c ?? null },
        reuniones: { proximas7: reun?.prox ?? null, realizadas30: reun?.real30 ?? null, caidas30: reun?.canc30 ?? null },
        whatsapp: { chats7: wa?.chats7 ?? null, chats30: wa?.chats30 ?? null, mensajes7: map(wa7, "autor", "c"), horasUltimaRespuestaBot: salud?.h != null ? Math.round(salud.h) : null },
        email: emails ?? null,
      },
      usuarios: {
        devisebit: usPortal ? { ...usPortal, nota: "Clientes con acceso a Mi cuenta (portal.devisebit.com)" } : null,
        academia: usAcad ? { ...usAcad, nota: "Registrados = suscriptos activos de la Academia; alumnos = inscriptos en cursos" } : null,
        equipo: usEquipo?.c ?? null,
      },
      academia: {
        suscriptores: subs ?? null,
        tags: tags ?? [],
        guias: { publicadas: guias?.pub ?? null, borradores: guias?.borr ?? null, vistas: guias?.vistas ?? null, top: guiasTop ?? [] },
        productos: map(prods, "estado", "c"),
        ventas30: ventas ?? [],
        ventasTotales: ventasTot?.c ?? null,
        ordenesPendientes30: ventasTot?.pend ?? null,
      },
    }
}
