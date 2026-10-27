import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { q, one } from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * KPIs para el Panel de Contenido DEVISEBIT (solo cifras agregadas, sin nombres, emails ni teléfonos).
 * Protegido con ?k=PANEL_TOKEN.
 */
function autorizado(k: string | null) {
  const t = process.env.PANEL_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

const SITIOS = [
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

const n = (v: unknown) => (v == null ? null : Number(v))
async function safe<T>(p: Promise<T>): Promise<T | null> { try { return await p } catch { return null } }

export async function GET(req: NextRequest) {
  if (!autorizado(req.nextUrl.searchParams.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const t0 = Date.now()
  const checks = await Promise.all(SITIOS.map((s) => medir(s.url)))
  const sitios = SITIOS.map((s, i) => ({ id: s.id, nombre: s.nombre, url: s.url, ok: checks[i].ok, status: checks[i].status, ms: checks[i].ms, kb: checks[i].kb }))
  const notas = novedades(checks[1].html)

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

  const salud = await safe(one<{ h: number | null }>("select extract(epoch from now() - max(creado))/3600 h from wa_mensajes where autor='bot'"))
  const map = <T extends Record<string, any>>(rows: T[] | null, k: keyof T, v: keyof T) => Object.fromEntries((rows ?? []).map((r) => [r[k], n(r[v])]))

  return NextResponse.json(
    {
      ok: true,
      generado: new Date().toISOString(),
      ms: Date.now() - t0,
      web: { sitios, novedades: { total: notas.length, ultimos30: notas.filter((x) => x.fecha && Date.now() - new Date(x.fecha + "T12:00:00-03:00").getTime() < 30 * 864e5).length, notas: notas.slice(0, 12) } },
      visitas: { dias: visDia ?? [], sitios: visHost ?? [], paginas: visPath ?? [], origenes: visRef ?? [], dispositivos: map(visDisp, "disp", "c") },
      crm: {
        consultas: { porEstado: map(consEstado, "estado", "c"), d7: consPer?.d7 ?? null, d30: consPer?.d30 ?? null, p30: consPer?.p30 ?? null, porCanal: consCanal ?? [], porFuente: consFuente ?? [], esperanHumano: consHumano?.c ?? null, conversion90: conv90 && conv90.tot ? Math.round((conv90.conv / conv90.tot) * 1000) / 10 : null, total90: conv90?.tot ?? null },
        contactos: { porEtapa: map(etapas, "etapa", "c"), total: contTot?.c ?? null, nuevos30: contTot?.d30 ?? null },
        proyectos: { porEstado: Object.fromEntries((proy ?? []).map((r) => [r.estado, { c: n(r.c), monto: n(r.monto) }])), entregas14: entregas?.c ?? null },
        reuniones: { proximas7: reun?.prox ?? null, realizadas30: reun?.real30 ?? null, caidas30: reun?.canc30 ?? null },
        whatsapp: { chats7: wa?.chats7 ?? null, chats30: wa?.chats30 ?? null, mensajes7: map(wa7, "autor", "c"), horasUltimaRespuestaBot: salud?.h != null ? Math.round(salud.h) : null },
        email: emails ?? null,
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
    },
    { headers: { "cache-control": "no-store" } },
  )
}
