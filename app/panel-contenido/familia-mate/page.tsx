import { q, one } from "@/lib/db"
import { safe } from "@/lib/panel"
import { acceso, Head, Sec, Kpi, Barras, Columnas, Embudo, Alerta, SinDatos, fmt, plata } from "../_ui"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Familia Mate: MateBot y MateCuentas. ¿Se usan? ¿Se visitan? ¿Sirven?
 * Uso: números agregados que exponen los propios productos (STATS_KEY). Visitas y clics: contador del sistema (pv_visitas, pv_clics).
 * SEO: se revisa cada sitio al abrir la página.
 */
const MB = "matebot.devisebit.com"
const MC = "matecuentas.devisebit.com"
const MT = "mateturnos.devisebit.com"
const ME = "mateeventos.devisebit.com"
const ACC: Record<string, string> = { demo: "Ver ejemplo", reserva: "Reservó un turno", recordatorio: "Pidió recordatorio", rsvp: "Respondió una invitación", compartir: "Compartió invitación", matebot: "Conocer MateBot", whatsapp: "Empezar en WhatsApp", telegram: "Empezar en Telegram", plus: "Quiero Plus", pro: "Pasarme a Pro", registro: "Crear cuenta", instalar: "Instalar app", matecuentas: "Ir a MateCuentas", empresas: "Hablar con DEVISEBIT" }
const VIA: Record<string, string> = { app: "App / web", wa: "WhatsApp", whatsapp: "WhatsApp", tg: "Telegram", telegram: "Telegram" }
const TIPO: Record<string, string> = { texto: "Texto", audio: "Audio", archivo: "Foto o PDF" }
const KIND: Record<string, string> = { event: "Eventos y turnos", reminder: "Recordatorios", birthday: "Cumpleaños", list: "Ítems de listas" }

async function stats<T>(url: string, init: RequestInit = {}): Promise<T | null> {
  const key = process.env.STATS_KEY
  if (!key) return null
  const r = await fetch(url, { ...init, headers: { "x-stats-key": key, "x-admin": key, ...(init.headers || {}) }, cache: "no-store", signal: AbortSignal.timeout(20000) })
  return r.ok ? ((await r.json()) as T) : null
}

type MBStats = {
  usuarios: Record<string, number>
  items: { kind: string; total: number; d30: number }[]
  altasDia: { dia: string; n: number }[]
  actDia: { dia: string; canal: string; usuarios: number; mensajes: number }[]
  tipos30: { tipo: string; n: number }[]
  usoMes: { agendado: number; fotos: number; avisos_wa: number }
  precioPlus: number
  contactos?: { id: number; nombre: string; email: string | null; phone: string | null; wa_id: string | null; telegram: boolean; optin: boolean; alta: string; last_seen: string; plus: boolean; step: string; turnos: boolean; eventos: boolean }[]
  turnos?: Record<string, number>
  eventos?: Record<string, number>
  infra?: { funciones: string | null; baseDeDatos: string }
}
type Promo = { productos: Record<string, string>; codigos: { code: string; producto: string; dias: number; usos_max: number; usos: number; nota: string | null; created_at: string; canjes: { producto: string; quien: string | null; cuando: string }[] }[] }
type MCStats = Record<string, any>

type Seo = { sitio: string; url: string; ok: boolean; ms: number; titulo: string; desc: string; og: boolean; robots: boolean; sitemap: boolean }
async function seo(sitio: string): Promise<Seo> {
  const url = `https://${sitio}/`
  const t0 = Date.now()
  const get = (u: string) => fetch(u, { cache: "no-store", signal: AbortSignal.timeout(10000) }).then(async (r) => ({ ok: r.ok, txt: r.ok ? await r.text() : "" })).catch(() => ({ ok: false, txt: "" }))
  const [h, rb, sm] = await Promise.all([get(url), get(url + "robots.txt"), get(url + "sitemap.xml")])
  const pick = (re: RegExp) => (h.txt.match(re)?.[1] || "").trim()
  return {
    sitio, url, ok: h.ok, ms: Date.now() - t0,
    titulo: pick(/<title[^>]*>([^<]*)<\/title>/i),
    desc: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    og: /property=["']og:image["']/i.test(h.txt),
    robots: rb.ok && /user-agent/i.test(rb.txt),
    sitemap: sm.ok && /<urlset|<sitemapindex/i.test(sm.txt),
  }
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null)

export default async function FamiliaMate() {
  if (!(await acceso())) return null
  const [mb, mc, visDia, visSitio, origen, clics, google, seoMb, seoMc, seoMt, seoMe, promo] = await Promise.all([
    safe(stats<MBStats>(`https://${MB}/api/admin/stats`)),
    safe(stats<MCStats>(`https://${MC}/api/admin?a=stats`)),
    safe(q<{ dia: string; host: string; c: number }>(`select dia::text dia, host, sum(n)::int c from pv_visitas where host in ($1,$2,$3,$4) and dia > current_date - 30 group by 1,2 order by 1`, [MB, MC, MT, ME])),
    safe(q<{ host: string; d30: number; d7: number; movil: number }>(`select host, sum(n)::int d30, coalesce(sum(n) filter (where dia > current_date - 7),0)::int d7, coalesce(sum(n) filter (where disp='movil'),0)::int movil from pv_visitas where host in ($1,$2,$3,$4) and dia > current_date - 30 group by 1`, [MB, MC, MT, ME])),
    safe(q<{ ref: string; c: number }>(`select coalesce(nullif(ref,''),'Directo') ref, sum(n)::int c from pv_visitas where host in ($1,$2,$3,$4) and dia > current_date - 30 group by 1 order by 2 desc limit 10`, [MB, MC, MT, ME])),
    safe(q<{ host: string; accion: string; c: number }>(`select host, accion, sum(n)::int c from pv_clics where host in ($1,$2,$3,$4) and dia > current_date - 30 group by 1,2 order by 3 desc`, [MB, MC, MT, ME])),
    safe(q<{ host: string; c: number }>(`select host, sum(n)::int c from pv_visitas where host in ($1,$2,$3,$4) and dia > current_date - 30 and ref like '%google%' group by 1`, [MB, MC, MT, ME])),
    safe(seo(MB)),
    safe(seo(MC)),
    safe(seo(MT)),
    safe(seo(ME)),
    safe(fetch(`https://${MB}/api/admin/promo`, { headers: { "x-admin-key": process.env.STATS_KEY || "" }, cache: "no-store", signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? (r.json() as Promise<Promo>) : null))),
  ])

  const vis = (h: string) => (visSitio ?? []).find((r) => r.host === h)
  const clic = (h: string, a: string) => Number((clics ?? []).find((r) => r.host === h && r.accion === a)?.c ?? 0)
  const dias = (h: string) => {
    const m = new Map((visDia ?? []).filter((r) => r.host === h).map((r) => [r.dia, Number(r.c)]))
    const out: { k: string; v: number }[] = []
    for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - 3 * 3600e3 - i * 86400e3).toISOString().slice(0, 10); out.push({ k: d.slice(5), v: m.get(d) ?? 0 }) }
    return out
  }

  // MateBot
  const u = mb?.usuarios
  const actPorDia = (() => {
    const m = new Map<string, number>()
    for (const r of mb?.actDia ?? []) m.set(r.dia, (m.get(r.dia) ?? 0) + Number(r.usuarios))
    const out: { k: string; v: number }[] = []
    for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - 3 * 3600e3 - i * 86400e3).toISOString().slice(0, 10); out.push({ k: d.slice(5), v: m.get(d) ?? 0 }) }
    return out
  })()
  const canal30 = ["whatsapp", "telegram"].map((c) => ({ k: c === "whatsapp" ? "WhatsApp" : "Telegram", v: (mb?.actDia ?? []).filter((r) => r.canal === c).reduce((a, r) => a + Number(r.mensajes), 0) }))
  const mbVis = Number(vis(MB)?.d30 ?? 0)
  const mbStart = clic(MB, "whatsapp") + clic(MB, "telegram")

  // MateCuentas
  const mcVis = Number(vis(MC)?.d30 ?? 0)
  const mcReg = clic(MC, "registro")
  const mcPorDia = (() => {
    const m = mc?.porDia30 ?? {}
    const out: { k: string; v: number }[] = []
    for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - 3 * 3600e3 - i * 86400e3).toISOString().slice(0, 10); out.push({ k: d.slice(5), v: Number(m[d] ?? 0) }) }
    return out
  })()

  // Lectura rápida: ¿sirve?
  const lecturas: { nivel: "alto" | "medio" | "info" | "ok"; t: string; d?: string }[] = []
  if (u) {
    const ret = pct(u.activos7, u.registrados)
    if (u.registrados < 20) lecturas.push({ nivel: "info", t: `MateBot tiene ${fmt(u.registrados)} usuarios registrados`, d: "Todavía es poco para sacar conclusiones: lo importante ahora es atraer gente (lanzamiento, pauta, boca en boca)." })
    else if (ret != null) lecturas.push({ nivel: ret >= 40 ? "ok" : ret >= 20 ? "medio" : "alto", t: `${ret}% de los usuarios de MateBot lo usó esta semana`, d: ret >= 40 ? "Se usa: la gente vuelve. Buen momento para empujar Plus." : "Mucha gente prueba y no vuelve: revisar el primer uso y los recordatorios." })
  }
  if (mbVis >= 30) {
    const c = pct(mbStart, mbVis) ?? 0
    lecturas.push({ nivel: c >= 15 ? "ok" : c >= 5 ? "medio" : "alto", t: `De cada 100 visitas a la web de MateBot, ${c} tocan "Empezar"`, d: c >= 15 ? "La web convence." : "La web atrae pero no convence: probar otro título, el video arriba o un ejemplo más claro." })
  }
  if (mc) {
    const ret = pct(mc.activos7 ?? 0, mc.users ?? 0)
    if ((mc.users ?? 0) < 20) lecturas.push({ nivel: "info", t: `MateCuentas tiene ${fmt(mc.users)} cuentas`, d: "Etapa de arranque: medir cuántos cargan al menos un gasto en su primera semana." })
    else if (ret != null) lecturas.push({ nivel: ret >= 30 ? "ok" : "medio", t: `${ret}% de las cuentas de MateCuentas cargó algo esta semana` })
  }
  const sinGoogle = (google ?? []).reduce((a, r) => a + Number(r.c), 0) === 0
  if (sinGoogle) lecturas.push({ nivel: "medio", t: "Todavía no llegan visitas desde Google", d: "Es normal en sitios nuevos. Falta darlos de alta en Google Search Console para que se indexen antes y ver qué buscan." })

  // Contactos de toda la familia (para hablarles, pedir feedback y regalar códigos)
  type Contacto = { nombre: string; email: string; tel: string; producto: string; alta: string; novedades: boolean; paga: boolean }
  const contactos: Contacto[] = [
    ...(mb?.contactos ?? []).map((c) => ({ nombre: c.nombre || "", email: c.email || "", tel: c.phone || (c.wa_id ? `+${c.wa_id}` : ""), producto: ["MateBot " + (c.wa_id ? "WhatsApp" : "Telegram"), c.turnos ? "MateTurnos" : "", c.eventos ? "MateEventos" : ""].filter(Boolean).join(" · "), alta: String(c.alta).slice(0, 10), novedades: !!c.optin, paga: !!c.plus })),
    ...((mc?.contactos ?? []) as any[]).map((c) => ({ nombre: c.nombre || "", email: c.email || "", tel: c.phone || "", producto: "MateCuentas" + (c.whatsapp ? " · con MateBot" : ""), alta: c.alta ? new Date(c.alta).toISOString().slice(0, 10) : "", novedades: !!c.optin, paga: !!c.pro })),
  ].sort((a, b) => b.alta.localeCompare(a.alta))
  const conEmail = contactos.filter((c) => c.email).length
  const mt = mb?.turnos, me = mb?.eventos

  const ingresosMes = (u?.plus ?? 0) * (mb?.precioPlus ?? 3500) + (mc?.pro ?? 0) * 3990

  return (
    <>
      <Head t="Familia Mate" sub="MateBot, MateCuentas, MateTurnos y MateEventos: si se usan, si se visitan y si sirven. Solo números; el detalle está en el sistema." />

      <div className="pc-kpis">
        <Kpi k="Usuarios MateBot" v={u ? fmt(u.registrados) : null} ft={u ? `+${fmt(u.altas7)} esta semana · ${fmt(u.whatsapp)} WhatsApp · ${fmt(u.telegram)} Telegram` : "Sin conexión con MateBot"} serie={(mb?.altasDia ?? []).map((r) => Number(r.n))} />
        <Kpi k="Usaron MateBot (7 días)" v={u ? fmt(u.activos7) : null} ft={u ? `${fmt(u.activos30)} en 30 días` : ""} serie={actPorDia.map((d) => d.v)} color="var(--ok)" />
        <Kpi k="Cuentas MateCuentas" v={mc ? fmt(mc.users) : null} ft={mc ? `+${fmt(mc.altas7)} esta semana · ${fmt(mc.spaces)} espacios` : "Sin conexión con MateCuentas"} color="var(--info)" />
        <Kpi k="Cargaron gastos (7 días)" v={mc ? fmt(mc.activos7) : null} ft={mc ? `${fmt(mc.movs7)} movimientos en la semana` : ""} serie={mcPorDia.map((d) => d.v)} color="var(--info)" />
        <Kpi k="Pagan" v={u || mc ? fmt((u?.plus ?? 0) + (mc?.pro ?? 0)) : null} ft={`${fmt(u?.plus ?? 0)} Plus · ${fmt(mc?.pro ?? 0)} Pro · ${plata(ingresosMes)} por mes`} color="var(--violet, #7c5cff)" />
        <Kpi k="Visitas a las webs (30 días)" v={visSitio ? fmt(mbVis + mcVis) : null} ft={`MateBot ${fmt(mbVis)} · MateCuentas ${fmt(mcVis)}`} color="var(--info)" />
      </div>

      {lecturas.length ? (<><Sec t="¿Sirve? Lectura rápida" />{lecturas.map((l, i) => <Alerta key={i} nivel={l.nivel} t={l.t} d={l.d} />)}</>) : null}

      <Sec t="MateBot · uso" id="matebot" />
      {u ? (
        <>
          <div className="pc-card"><div className="pc-ch"><h2>Personas que le escribieron por día</h2><span className="pc-k">30 días · WhatsApp + Telegram</span></div>
            {actPorDia.some((d) => d.v) ? <Columnas filas={actPorDia} titulo="Personas por día" color="var(--ok)" /> : <SinDatos>Se empieza a medir desde hoy: cada mensaje suma al día, sin guardar el contenido.</SinDatos>}
          </div>
          <div className="pc-grid pc-g3">
            <div className="pc-card"><div className="pc-ch"><h2>Mensajes por canal</h2><span className="pc-k">30 días</span></div><Barras filas={canal30} color="var(--ok)" /></div>
            <div className="pc-card"><div className="pc-ch"><h2>Cómo le hablan</h2><span className="pc-k">30 días</span></div><Barras filas={(mb?.tipos30 ?? []).map((r) => ({ k: TIPO[r.tipo] ?? r.tipo, v: Number(r.n) }))} color="var(--ok)" /></div>
            <div className="pc-card"><div className="pc-ch"><h2>Qué anotan</h2><span className="pc-k">30 días</span></div><Barras filas={(mb?.items ?? []).map((r) => ({ k: KIND[r.kind] ?? r.kind, v: Number(r.d30), t: `${fmt(r.total)} en total` }))} color="var(--ok)" /></div>
          </div>
          <div className="pc-kpis">
            <Kpi k="Familias" v={fmt(u.familias)} ft={`${fmt(u.en_familia)} personas en una familia`} />
            <Kpi k="Con resumen diario" v={fmt(u.resumen)} ft="Lo reciben cada mañana" />
            <Kpi k="Aceptaron novedades" v={fmt(u.optin)} ft={`${fmt(pct(u.optin, u.registrados))}% de los usuarios`} />
            <Kpi k="Este mes" v={fmt(mb?.usoMes.agendado ?? 0)} ft={`cosas agendadas · ${fmt(mb?.usoMes.fotos ?? 0)} fotos o PDF · ${fmt(mb?.usoMes.avisos_wa ?? 0)} avisos WhatsApp pagos`} />
          </div>
        </>
      ) : <SinDatos>No se pudo leer MateBot. Revisar que STATS_KEY esté cargada en los dos proyectos.</SinDatos>}

      <Sec t="MateCuentas · uso" id="matecuentas" />
      {mc ? (
        <>
          <div className="pc-card"><div className="pc-ch"><h2>Movimientos cargados por día</h2><span className="pc-k">30 días</span></div>
            {mcPorDia.some((d) => d.v) ? <Columnas filas={mcPorDia} titulo="Movimientos por día" color="var(--info)" /> : <SinDatos>Todavía no hay movimientos en los últimos 30 días.</SinDatos>}
          </div>
          <div className="pc-grid pc-g3">
            <div className="pc-card"><div className="pc-ch"><h2>Desde dónde cargan</h2><span className="pc-k">30 días</span></div><Barras filas={Object.entries(mc.via30 ?? {}).map(([k, v]) => ({ k: VIA[k] ?? k, v: Number(v) }))} color="var(--info)" /></div>
            <div className="pc-card"><div className="pc-ch"><h2>Espacios</h2><span className="pc-k">compartidos</span></div><Barras filas={[{ k: "Espacios", v: Number(mc.spaces ?? 0) }, { k: "Activos en 30 días", v: Number(mc.espaciosActivos30 ?? 0) }, { k: "Personas en espacios", v: Number(mc.miembros ?? 0) }]} color="var(--info)" /></div>
            <div className="pc-card"><div className="pc-ch"><h2>Cargas mágicas</h2><span className="pc-k">este mes</span></div><Barras filas={[{ k: "Audio, foto o WhatsApp con IA", v: Number(mc.cargasIaMes ?? 0) }, { k: "Cuentas conectadas a MateBot", v: Number(mc.conBot ?? 0) }, { k: "Aceptaron novedades", v: Number(mc.optin ?? 0) }]} color="var(--info)" /></div>
          </div>
        </>
      ) : <SinDatos>No se pudo leer MateCuentas. Revisar que STATS_KEY esté cargada en los dos proyectos.</SinDatos>}

      <Sec t="MateTurnos y MateEventos · uso" id="turnos-eventos" />
      {mt && me ? (
        <div className="pc-kpis">
          <Kpi k="Agendas MateTurnos" v={fmt(mt.agendas)} ft={`${fmt(mt.pro)} en Pro`} color="#0f6b63" />
          <Kpi k="Turnos reservados" v={fmt(mt.reservas)} ft={`${fmt(mt.reservas30)} en 30 días · ${fmt(mt.con_recordatorio)} con recordatorio · ${fmt(mt.cancelados)} cancelados`} color="#0f6b63" />
          <Kpi k="Eventos MateEventos" v={fmt(me.eventos)} ft={`${fmt(me.eventos30)} nuevos en 30 días · ${fmt(me.pro)} en Pro`} color="#c2187a" />
          <Kpi k="Respuestas de invitados" v={fmt(me.respuestas)} ft={`${fmt(me.confirmados)} confirmaron · ${fmt(me.coorganizadores)} co-organizadores`} color="#c2187a" />
        </div>
      ) : <SinDatos>No se pudo leer MateTurnos y MateEventos (viven dentro de MateBot).</SinDatos>}

      <Sec t="Personas, pagos y códigos" id="contactos" />
      <div className="pc-card"><p style={{ margin: 0 }}>{fmt(contactos.length)} personas registradas ({fmt(conEmail)} con email) · {fmt(promo?.codigos?.length ?? 0)} códigos de regalo creados. El detalle con nombre y apellido, los planes pagos y los códigos están en el sistema: <a className="pc-btn" href="https://sistema.devisebit.com/familia-mate">Abrir Familia Mate en el sistema</a></p></div>

      <Sec t="Webs · visitas y conversión" id="web" />
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>MateBot · visitas por día</h2><span className="pc-k">{fmt(mbVis)} en 30 días · {fmt(pct(Number(vis(MB)?.movil ?? 0), mbVis))}% celular</span></div><Columnas filas={dias(MB)} titulo="Visitas MateBot" color="var(--red)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>MateCuentas · visitas por día</h2><span className="pc-k">{fmt(mcVis)} en 30 días · {fmt(pct(Number(vis(MC)?.movil ?? 0), mcVis))}% celular</span></div><Columnas filas={dias(MC)} titulo="Visitas MateCuentas" color="var(--info)" /></div>
      </div>
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Embudo MateBot</h2><span className="pc-k">30 días</span></div>
          <Embudo pasos={[{ k: "Visitas a la web", v: mbVis }, { k: "Tocaron Empezar (WhatsApp o Telegram)", v: mbStart }, { k: "Usuarios nuevos", v: u?.altas30 ?? null }, { k: "Pasaron a Plus", v: u?.plus ?? null }]} />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Embudo MateCuentas</h2><span className="pc-k">30 días</span></div>
          <Embudo pasos={[{ k: "Visitas a la web", v: mcVis }, { k: "Tocaron Crear cuenta", v: mcReg }, { k: "Cuentas nuevas", v: mc?.altas30 ?? null }, { k: "Pasaron a Pro", v: mc?.pro ?? null }]} />
        </div>
      </div>
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>De dónde llegan</h2><span className="pc-k">las dos webs · 30 días</span></div><Barras filas={(origen ?? []).map((r) => ({ k: r.ref, v: Number(r.c) }))} color="var(--info)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>Botones que tocan</h2><span className="pc-k">30 días</span></div><Barras filas={(clics ?? []).map((r) => ({ k: `${ACC[r.accion] ?? r.accion} · ${r.host === MB ? "MateBot" : "MateCuentas"}`, v: Number(r.c) }))} color="var(--red)" /></div>
      </div>

      <Sec t="SEO" id="seo" />
      <div className="pc-card"><div className="pc-ch"><h2>Cómo los ve Google</h2><span className="pc-k">revisado al abrir esta página</span></div>
        <div className="pc-tw"><table><thead><tr><th>Sitio</th><th>Título</th><th>Descripción</th><th>Imagen al compartir</th><th>robots.txt</th><th>Mapa del sitio</th><th className="n">Visitas desde Google</th></tr></thead>
          <tbody>{[seoMb, seoMc, seoMt, seoMe].filter(Boolean).map((s) => {
            const x = s as Seo
            const g = Number((google ?? []).find((r) => r.host === x.sitio)?.c ?? 0)
            const okc = (b: boolean) => <span className="pc-tag"><span className="pc-dot" style={{ background: b ? "var(--ok)" : "var(--red)" }} />{b ? "Sí" : "Falta"}</span>
            return <tr key={x.sitio}><td><a href={x.url} target="_blank" rel="noreferrer">{x.sitio}</a></td><td>{x.titulo || "—"}</td><td>{x.desc ? `${x.desc.slice(0, 90)}${x.desc.length > 90 ? "…" : ""}` : okc(false)}</td><td>{okc(x.og)}</td><td>{okc(x.robots)}</td><td>{okc(x.sitemap)}</td><td className="n">{fmt(g)}</td></tr>
          })}</tbody>
        </table></div>
        <SinDatos>MateBot y MateCuentas ya están en Google Search Console (dominio devisebit.com). Las invitaciones de MateEventos son privadas y no se indexan a propósito.</SinDatos>
      </div>

      <Sec t="Dónde están los servidores" id="infra" />
      <div className="pc-card"><p style={{ margin: 0 }}>Funciones (Vercel): <b>{mb?.infra?.funciones === "iad1" ? "Washington D.C., Estados Unidos (iad1)" : mb?.infra?.funciones ?? "—"}</b> · Base de datos de MateBot, MateTurnos y MateEventos: <b>{mb?.infra?.baseDeDatos ?? "—"}</b> (Virginia, Estados Unidos) · Datos de MateCuentas: Vercel Blob, región {mc?.region ?? "—"}. Todo cifrado en tránsito (HTTPS) y en reposo.</p></div>
    </>
  )
}
