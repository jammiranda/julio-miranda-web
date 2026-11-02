import { instagram, historialSeguidores } from "@/lib/instagram"
import { facebook } from "@/lib/facebook"
import { linkedinExport } from "@/lib/linkedin-export"
import { panelMetricas, youtubeCache, safe } from "@/lib/panel"
import { historial, interacciones, redDiario, REDES, type Publicacion } from "@/lib/publicaciones"
import { acceso, base, Head, Sec, Kpi, Delta, Barras, Linea, SinDatos, fmt, fechaCorta, plata } from "../_ui"

export const dynamic = "force-dynamic"

const TZ = "America/Argentina/Buenos_Aires"
const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
const FRANJAS = ["Mañana", "Mediodía", "Tarde", "Noche", "Madrugada"]
function partes(iso: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(iso))
  return { dia: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(f.find((x) => x.type === "weekday")?.value ?? ""), hora: Number(f.find((x) => x.type === "hour")?.value ?? 0) }
}
const franja = (h: number) => (h < 6 ? "Madrugada" : h < 12 ? "Mañana" : h < 15 ? "Mediodía" : h < 19 ? "Tarde" : "Noche")
const prom = (v: number[]) => (v.length ? v.reduce((a, x) => a + x, 0) / v.length : null)
const hace = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null)
const ESTADOS_CONS: Record<string, string> = { nueva: "Nuevas", contactada: "Contactadas", calificada: "Calificadas", convertida: "Ganadas", descartada: "Descartadas" }
const ESTADOS_PROY: Record<string, string> = { propuesta: "Propuesta", planificado: "Planificado", en_curso: "En curso", pausado: "Pausado", entregado: "Entregado", cancelado: "Cancelado" }

function agrupar(posts: Publicacion[], clave: (p: Publicacion) => string, orden: string[]) {
  return orden.map((k) => { const g = posts.filter((p) => clave(p) === k).map(interacciones); return { k, v: Math.round((prom(g) ?? 0) * 10) / 10, n: g.length } })
    .filter((x) => x.n > 0).map((x) => ({ k: `${x.k} (${x.n})`, v: x.v, t: fmt(x.v, 1) }))
}

export default async function Analisis({ searchParams }: { searchParams: { cuenta?: string } }) {
  if (!(await acceso())) return null
  const b = base()
  const [ig, histIG, fb, yt, lix, liJ, m, pubs] = await Promise.all([
    instagram(), historialSeguidores(180).catch(() => []), facebook(), safe(youtubeCache()), safe(linkedinExport()), redDiario("linkedin_julio", 180).catch(() => []), safe(panelMetricas()), historial(180).catch(() => [] as Publicacion[]),
  ])
  const d30 = pubs.filter((p) => p.fecha && hace(p.fecha)! < 30)
  const p30 = (red: string | string[]) => d30.filter((p) => (Array.isArray(red) ? red.includes(p.red) : p.red === red))
  const igCrec = (() => { const h = histIG.find((x) => Date.now() - new Date(x.dia + "T12:00:00-03:00").getTime() <= 30 * 864e5); return ig.ok && h ? ig.perfil.seguidores - h.seguidores : null })()
  const liJSeg = [...liJ].reverse().find((x) => x.seguidores != null)
  const liJ30 = liJ.filter((x) => Date.now() - new Date(x.dia + "T12:00:00-03:00").getTime() <= 30 * 864e5)
  const ultimaDe = (reds: string[]) => pubs.find((p) => reds.includes(p.red) && p.fecha)?.fecha ?? null

  type Cuenta = { id: string; nombre: string; color: string; seguidores: number | null; crecimiento: number | null; posts: number; inter: number; alcance: number | null; ultima: string | null; fuente: string; enlace: string }
  const cuentas: Cuenta[] = [
    { id: "instagram", nombre: "Instagram @devisebit", color: "var(--ig)", seguidores: ig.ok ? ig.perfil.seguidores : null, crecimiento: igCrec, posts: p30("instagram").length, inter: p30("instagram").reduce((a, p) => a + interacciones(p), 0), alcance: null, ultima: ultimaDe(["instagram"]), fuente: ig.ok ? "API de Instagram" : `sin conexión: ${ig.error}`, enlace: `${b}/publicaciones?red=instagram` },
    { id: "facebook", nombre: "Facebook · página", color: "var(--fb)", seguidores: fb.ok ? fb.seguidores : null, crecimiento: fb.ok ? fb.crecimiento30 : null, posts: Math.max(p30("facebook").length, fb.ok ? fb.publicaciones30 : 0), inter: Math.max(p30("facebook").reduce((a, p) => a + interacciones(p), 0), fb.ok ? fb.interacciones30 : 0), alcance: fb.ok ? fb.vistasContenido30 : null, ultima: ultimaDe(["facebook"]), fuente: fb.ok ? "Metricool (tarea diaria)" : fb.error, enlace: `${b}/publicaciones?red=facebook` },
    { id: "youtube", nombre: "YouTube · ACADEMIA DEVISEBIT", color: "var(--yt)", seguidores: yt?.suscriptores ?? null, crecimiento: null, posts: p30(["youtube", "youtube_post"]).length, inter: p30(["youtube", "youtube_post"]).reduce((a, p) => a + interacciones(p), 0), alcance: yt?.vistas30 ?? null, ultima: ultimaDe(["youtube", "youtube_post"]), fuente: yt ? "página pública + tarea diaria" : "sin datos", enlace: `${b}/youtube` },
    { id: "linkedin", nombre: "LinkedIn · página DEVISEBIT", color: "var(--li)", seguidores: lix?.seguidores.total ?? null, crecimiento: lix?.seguidores.nuevos ?? null, posts: p30("linkedin").length, inter: p30("linkedin").reduce((a, p) => a + interacciones(p), 0), alcance: p30("linkedin").reduce((a, p) => a + (p.impresiones ?? 0), 0) || null, ultima: ultimaDe(["linkedin"]), fuente: "Buffer + exportación mensual", enlace: `${b}/linkedin` },
    { id: "linkedin_julio", nombre: "LinkedIn · Julio Miranda", color: "var(--li)", seguidores: liJSeg?.seguidores ?? null, crecimiento: liJ30.length ? liJ30.reduce((a, x) => a + (x.nuevos ?? 0), 0) : null, posts: p30("linkedin_julio").length, inter: Math.max(p30("linkedin_julio").reduce((a, p) => a + interacciones(p), 0), liJ30.reduce((a, x) => a + (x.interacciones ?? 0), 0)), alcance: liJ30.reduce((a, x) => a + (x.impresiones ?? 0), 0) || null, ultima: ultimaDe(["linkedin_julio"]), fuente: liJ.length ? "Buffer + exportación del perfil" : "Buffer (subí la exportación del perfil)", enlace: `${b}/linkedin?cuenta=julio` },
  ]
  const estado = (c: Cuenta) => {
    const d = hace(c.ultima)
    if (c.seguidores == null && !c.posts) return { t: "Sin datos", col: "var(--muted)" }
    if (d == null || d > 14) return { t: "Sin publicar hace más de 14 días", col: "var(--red)" }
    if (d > 7) return { t: "Sin publicar hace más de 7 días", col: "var(--warn)" }
    return { t: "Activa", col: "var(--ok)" }
  }
  const audiencia = cuentas.reduce((a, c) => a + (c.seguidores ?? 0), 0)
  const visDias = (m?.visitas.dias ?? []).map((d) => ({ x: d.dia, y: Number(d.c) }))
  const vis30 = visDias.reduce((a, d) => a + d.y, 0)
  const c = m?.crm.consultas
  const sel = cuentas.find((x) => x.id === searchParams.cuenta)
  const base30 = sel ? d30.filter((p) => (sel.id === "youtube" ? ["youtube", "youtube_post"].includes(p.red) : p.red === sel.id)) : d30
  const base180 = sel ? pubs.filter((p) => (sel.id === "youtube" ? ["youtube", "youtube_post"].includes(p.red) : p.red === sel.id)) : pubs
  const conFecha = base180.filter((p) => p.fecha)
  const porRed = Object.keys(REDES).map((k) => ({ k: REDES[k].nombre, v: Math.round((prom(d30.filter((p) => p.red === k).map(interacciones)) ?? 0) * 10) / 10, n: d30.filter((p) => p.red === k).length })).filter((x) => x.n > 0).map((x) => ({ k: `${x.k} (${x.n})`, v: x.v, t: fmt(x.v, 1) }))
  const porTipo = agrupar(conFecha, (p) => p.tipo ?? "—", [...new Set(conFecha.map((p) => p.tipo ?? "—"))])
  const porDia = agrupar(conFecha, (p) => DIAS[partes(p.fecha!).dia], DIAS)
  const porFranja = agrupar(conFecha, (p) => franja(partes(p.fecha!).hora), FRANJAS)
  const top = [...base180].sort((a, x) => interacciones(x) - interacciones(a)).slice(0, 10)
  const mejor = (f: { k: string; v: number }[]) => (f.length ? [...f].sort((a, x) => x.v - a.v)[0].k.replace(/ \(\d+\)$/, "") : null)

  return (
    <>
      <Head t="Análisis" sub="Todo el ecosistema DEVISEBIT: redes, web, Academia y negocio · últimos 30 días (historial de 180)" />

      <Sec t="Resumen general" />
      <div className="pc-kpis">
        <Kpi k="Audiencia total" v={fmt(audiencia)} ft="seguidores sumados de todas las cuentas" color="var(--red)" />
        <Kpi k="Publicaciones (30 días)" v={fmt(d30.length)} ft={`en ${cuentas.filter((x) => x.posts).length} cuentas`} />
        <Kpi k="Interacciones (30 días)" v={fmt(cuentas.reduce((a, x) => a + x.inter, 0))} ft={d30.length ? `${fmt(cuentas.reduce((a, x) => a + x.inter, 0) / Math.max(1, d30.length), 1)} por publicación` : ""} color="var(--ok)" />
        <Kpi k="Visitas web (30 días)" v={fmt(vis30)} serie={visDias.map((d) => d.y)} color="var(--info)" ft="todos los sitios" />
        <Kpi k="Consultas (30 días)" v={fmt(c?.d30)} delta={<Delta v={c?.d30 != null && c?.p30 != null ? c.d30 - c.p30 : null} />} ft={c?.conversion90 != null ? `conversión 90 días: ${fmt(c.conversion90, 1)}%` : ""} color="var(--warn)" />
        <Kpi k="Suscriptores Academia" v={fmt(m?.academia.suscriptores?.act)} delta={<Delta v={m?.academia.suscriptores?.d30 ?? null} />} ft="activos · altas en 30 días" color="var(--ok)" />
      </div>

      <Sec t="Por cuenta" />
      <div className="pc-card" style={{ padding: 0 }}>
        <div className="pc-tw"><table>
          <thead><tr><th>Cuenta</th><th>Estado</th><th className="n">Seguidores</th><th className="n">Crec. 30 d</th><th className="n">Publicaciones 30 d</th><th className="n">Interacciones 30 d</th><th className="n">Por publicación</th><th className="n">Imp. / vistas 30 d</th><th>Última publicación</th><th>Fuente</th></tr></thead>
          <tbody>{cuentas.map((x) => { const e = estado(x); return (
            <tr key={x.id}>
              <td style={{ whiteSpace: "nowrap" }}><span className="pc-dot" style={{ background: x.color }} /> <a href={`${b}/analisis?cuenta=${x.id}`}>{x.nombre}</a></td>
              <td style={{ whiteSpace: "nowrap" }}><span className="pc-tag"><span className="pc-dot" style={{ background: e.col }} />{e.t}</span></td>
              <td className="n">{fmt(x.seguidores)}</td><td className="n">{x.crecimiento != null ? <Delta v={x.crecimiento} /> : "—"}</td>
              <td className="n">{fmt(x.posts)}</td><td className="n">{fmt(x.inter)}</td><td className="n">{x.posts ? fmt(x.inter / x.posts, 1) : "—"}</td><td className="n">{fmt(x.alcance)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{x.ultima ? `${fechaCorta(x.ultima)} (hace ${hace(x.ultima)} d)` : "—"}</td>
              <td className="pc-muted" style={{ fontSize: 12 }}>{x.fuente}</td>
            </tr>) })}</tbody>
        </table></div>
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Interacciones por publicación, por red</h2><span className="pc-k">30 días · (publicaciones)</span></div>
          {porRed.length ? <Barras filas={porRed} color="var(--red)" /> : <div className="pc-empty">Sin publicaciones en 30 días.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores por cuenta</h2></div>
          <Barras filas={cuentas.filter((x) => x.seguidores != null).map((x) => ({ k: x.nombre, v: x.seguidores! }))} color="var(--info)" />
        </div>
      </div>

      <Sec t={`Qué funciona · ${sel ? sel.nombre : "todas las cuentas"} · interacciones promedio (publicaciones)`} />
      <div className="pc-seg" role="group" aria-label="Cuenta">
        <a href={`${b}/analisis`} aria-current={!sel ? "true" : undefined}>Todas</a>
        {cuentas.map((x) => <a key={x.id} href={`${b}/analisis?cuenta=${x.id}`} aria-current={sel?.id === x.id ? "true" : undefined}>{x.nombre}</a>)}
      </div>
      <div className="pc-kpis">
        <Kpi k="Mejor formato" v={mejor(porTipo)} ft="por interacciones promedio" color="var(--ok)" />
        <Kpi k="Mejor día" v={mejor(porDia)} ft="hora de Argentina" color="var(--info)" />
        <Kpi k="Mejor horario" v={mejor(porFranja)} ft="hora de Argentina" color="var(--info)" />
        <Kpi k="Publicaciones analizadas" v={fmt(conFecha.length)} ft={`${fmt(base30.length)} en los últimos 30 días`} />
      </div>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Por formato</h2></div>{porTipo.length ? <Barras filas={porTipo} color="var(--red)" /> : <div className="pc-empty">Sin datos.</div>}</div>
        <div className="pc-card"><div className="pc-ch"><h2>Por día</h2></div>{porDia.length ? <Barras filas={porDia} color="var(--info)" /> : <div className="pc-empty">Sin datos.</div>}</div>
        <div className="pc-card"><div className="pc-ch"><h2>Por horario</h2></div>{porFranja.length ? <Barras filas={porFranja} color="var(--ok)" /> : <div className="pc-empty">Sin datos.</div>}</div>
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Las 10 con más interacciones</h2><span className="pc-k">180 días</span></div>
        {top.length ? (
          <div className="pc-list">{top.map((p) => (
            <a key={p.red + p.id} className="pc-item" href={p.url ?? "#"} target="_blank" rel="noreferrer">
              <span className="t">{(p.texto.split("\n")[0] || "(ver publicación)").slice(0, 110)}</span>
              <span className="m"><span><span className="pc-dot" style={{ background: REDES[p.red]?.color }} /> {REDES[p.red]?.nombre} · {p.fecha ? fechaCorta(p.fecha) : "—"}</span><span><b>{fmt(interacciones(p))}</b> interacciones{p.impresiones ?? p.vistas ? ` · ${fmt(p.impresiones ?? p.vistas)} imp./vistas` : ""}</span></span>
            </a>
          ))}</div>
        ) : <div className="pc-empty">Todavía no hay publicaciones en el historial.</div>}
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores de Instagram</h2><span className="pc-k">foto diaria</span></div>
          {histIG.length > 1 ? <Linea puntos={histIG.map((h) => ({ x: h.dia, y: h.seguidores }))} color="var(--ig)" titulo="Seguidores de Instagram" /> : <div className="pc-empty">Se registra una foto por día.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores de Facebook</h2><span className="pc-k">Metricool</span></div>
          {fb.ok && fb.dias.length > 1 ? <Linea puntos={fb.dias.filter((d) => d.seguidores != null).map((d) => ({ x: d.dia, y: Number(d.seguidores) }))} color="var(--fb)" titulo="Seguidores de Facebook" /> : <div className="pc-empty">Sin serie todavía.</div>}
        </div>
      </div>

      <Sec t="Por estado · negocio" />
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por estado</h2><a className="pc-btn" href={`${b}/crm`}>CRM</a></div>
          {c && Object.keys(c.porEstado).length ? <Barras filas={Object.entries(ESTADOS_CONS).map(([k, t]) => ({ k: t, v: Number(c.porEstado[k] ?? 0) }))} /> : <div className="pc-empty">Sin consultas.</div>}
          {c?.esperanHumano ? <p className="pc-sub" style={{ marginTop: 10 }}><b style={{ color: "var(--warn)" }}>{fmt(c.esperanHumano)}</b> esperan a una persona.</p> : null}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Contactos por etapa</h2></div>
          {m && Object.keys(m.crm.contactos.porEtapa).length ? <Barras filas={Object.entries(m.crm.contactos.porEtapa).map(([k, v]) => ({ k, v: Number(v ?? 0) })).sort((a, x) => x.v - a.v)} color="var(--info)" /> : <div className="pc-empty">Sin contactos.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Proyectos por estado</h2></div>
          {m && Object.keys(m.crm.proyectos.porEstado).length ? <Barras filas={Object.entries(m.crm.proyectos.porEstado).map(([k, v]) => ({ k: ESTADOS_PROY[k] ?? k, v: Number(v?.c ?? 0), t: `${fmt(v?.c)}${v?.monto ? " · " + plata(v.monto) : ""}` }))} color="var(--ok)" /> : <div className="pc-empty">Sin proyectos.</div>}
        </div>
      </div>
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por canal</h2><span className="pc-k">30 días</span></div>
          {c?.porCanal.length ? <Barras filas={c.porCanal.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--warn)" /> : <div className="pc-empty">Sin consultas en 30 días.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por fuente</h2><span className="pc-k">30 días</span></div>
          {c?.porFuente.length ? <Barras filas={c.porFuente.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--warn)" /> : <div className="pc-empty">Sin consultas en 30 días.</div>}
        </div>
      </div>

      <Sec t="Web" />
      <div className="pc-card"><div className="pc-ch"><h2>Visitas diarias a los sitios</h2><span className="pc-k">30 días</span></div>
        {visDias.length ? <Linea puntos={visDias} color="var(--info)" titulo="Visitas diarias" /> : <div className="pc-empty">Todavía no hay visitas registradas.</div>}
      </div>
      {!ig.ok && <SinDatos><b>Instagram sin conexión:</b> {ig.error}</SinDatos>}
      <p className="pc-sub">Interacciones = me gusta + comentarios + compartidos + clics + votos (o lo que informa cada red). Instagram no comparte impresiones con el permiso actual. El estado de cada cuenta se calcula por la fecha de la última publicación.</p>
    </>
  )
}
