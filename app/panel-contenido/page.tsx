import { instagram, historialSeguidores, engagement } from "@/lib/instagram"
import { linkedin } from "@/lib/linkedin"
import { panelMetricas, youtubeCache, safe } from "@/lib/panel"
import { publicacionesYouTubeCache } from "@/lib/youtube-publicaciones"
import { resumenAds } from "@/lib/ads"
import { seguimientos } from "@/lib/ads-seguimiento"
import { linkedinExport } from "@/lib/linkedin-export"
import { facebook, FB_URL } from "@/lib/facebook"
import { historial, interacciones, REDES } from "@/lib/publicaciones"
import { edadDias, formatoDe, negocioPeriodo, sumaDias, cubrePrevio, diaHace } from "@/lib/panel-analisis"
import { prefsDe } from "@/lib/panel-prefs"
import Personalizar from "./_personalizar"
import { ParaHoy } from "@/components/Kpi"
import { acceso, base, Head, Sec, Kpi, Delta, Barras, SinDatos, Alerta, Embudo, dif, fmt, plata, fechaCorta, fechaHora } from "./_ui"

export const dynamic = "force-dynamic"

const ESTADOS: Record<string, string> = { nueva: "Nuevas", contactada: "Contactadas", calificada: "Calificadas", convertida: "Ganadas", descartada: "Descartadas" }

export default async function Inicio() {
  const u = await acceso()
  if (!u) return null
  const P = await prefsDe(u.id)
  const ver = (id: string) => P.bloques.includes(id)
  const b = base()
  const [segAds, ig, hist, m, yt, ads, li, ytp] = await Promise.all([safe(seguimientos()), instagram(), historialSeguidores(120).catch(() => []), safe(panelMetricas()), safe(youtubeCache()), safe(resumenAds()), linkedin(), safe(publicacionesYouTubeCache())])
  const [lix, fb, pubs, neg] = await Promise.all([safe(linkedinExport()), facebook(), historial(90).catch(() => []), negocioPeriodo(30)])
  const seg = ig.ok ? ig.perfil.seguidores : null
  const posts = ig.ok ? ig.posts : []
  const p30 = posts.filter((p) => p.fecha && Date.now() - new Date(p.fecha).getTime() < 30 * 864e5)
  const ult = posts.slice(0, 10).map((p) => engagement(p, seg ?? 0)).filter((x): x is number => x != null)
  const engProm = ult.length ? ult.reduce((a, x) => a + x, 0) / ult.length : null
  const hace30 = hist.find((h) => Date.now() - new Date(h.dia + "T12:00:00-03:00").getTime() <= 30 * 864e5)
  const crecimiento = seg != null && hist.length > 1 && hace30 ? seg - hace30.seguidores : null
  const c = m?.crm.consultas
  const visDias = (m?.visitas.dias ?? []).map((d) => Number(d.c))
  const vis30 = visDias.length ? visDias.reduce((a, x) => a + x, 0) : null
  const gasto = ads?.plataformas.filter((p) => p.gasto > 0) ?? []
  // Meta no se sincroniza solo: la inversión sale de los controles de la bitácora de cada campaña (acumulado desde su inicio).
  const metaBit = (segAds ?? []).filter((x) => x.gasto != null && x.inicio && Date.now() - new Date(x.inicio.replace(/([+-]\d\d)$/, "$1:00")).getTime() < 30 * 864e5).reduce((a, x) => a + Number(x.gasto), 0)
  const inversion = [...gasto.map((p) => ({ n: p.nombre, t: plata(p.gasto, p.moneda) })), ...(!gasto.some((p) => p.plataforma === "meta") && metaBit > 0 ? [{ n: "Meta Ads (según controles)", t: plata(metaBit) }] : [])]

  const ultima = (reds: string[]) => pubs.find((p) => reds.includes(p.red) && p.fecha)?.fecha ?? null
  const cuentasEstado: [string, string, string[]][] = [["Instagram", "instagram", ["instagram"]], ["Facebook", "facebook", ["facebook"]], ["YouTube", "youtube", ["youtube", "youtube_post"]], ["LinkedIn de la página", "linkedin", ["linkedin"]], ["LinkedIn de Julio", "linkedin_julio", ["linkedin_julio"]]]
  type Al = { nivel: "alto" | "medio" | "info" | "ok"; t: string; d?: string; href?: string; accion?: string }
  const atencion: Al[] = []
  if (c?.esperanHumano) atencion.push({ nivel: "alto", t: `${fmt(c.esperanHumano)} consulta${c.esperanHumano === 1 ? "" : "s"} sin atender o esperan a una persona`, d: "Entraron por la web, WhatsApp o el bot y nadie respondió todavía.", href: `${b}/crm`, accion: "Atender" })
  for (const [nom, id, reds] of cuentasEstado) {
    const d = edadDias(ultima(reds))
    if (pubs.length && (d == null || d > 7)) atencion.push({ nivel: d == null || d > 14 ? "alto" : "medio", t: `${nom}: ${d == null ? "sin publicaciones registradas" : `sin publicar hace ${Math.floor(d)} días`}`, href: `${b}/analisis?cuenta=${id}#que-funciona`, accion: "Ver cuenta" })
  }
  if (!ig.ok) atencion.push({ nivel: "medio", t: "Instagram sin conexión", d: ig.error, href: `${b}/analisis#datos`, accion: "Detalle" })
  if (neg && (c?.d30 ?? 1) === 0) atencion.push({ nivel: "medio", t: "Sin consultas nuevas en 30 días", href: `${b}/analisis#negocio`, accion: "Ver embudo" })
  const nv = neg?.visitas ?? [], nc = neg?.consultas ?? []
  const visA = neg ? sumaDias(nv, (x) => x.c, 30) : null
  const visP = cubrePrevio(neg?.primeraVisita, 30) ? sumaDias(nv, (x) => x.c, 60, 30) : null
  const conA = neg ? sumaDias(nc, (x) => x.c, 30) ?? 0 : null
  const atenA = sumaDias(nc, (x) => x.a, 30) ?? 0, ganA = sumaDias(nc, (x) => x.g, 30) ?? 0
  const hoyAR = diaHace(0), ayerAR = diaHace(1)
  const visHoy = neg ? Number(nv.find((x) => x.dia === hoyAR)?.c ?? 0) : null
  const visAyer = neg ? Number(nv.find((x) => x.dia === ayerAR)?.c ?? 0) : null
  const recientes = pubs.filter((p) => p.fecha).slice(0, 8)

  const T: Record<string, React.ReactNode> = {
    ig_seg: <Kpi key="ig_seg" href={`${b}/analisis?cuenta=instagram#que-funciona`} k="Seguidores Instagram" v={seg != null ? fmt(seg) : null} color="var(--ig)" serie={hist.map((h) => h.seguidores)} delta={<Delta v={crecimiento} />} ft={crecimiento != null ? `desde ${fechaCorta(hace30!.dia)}` : ig.ok ? "La evolución se registra cada día" : "Instagram sin conexión"} />,
    ig_pub: <Kpi key="ig_pub" href={`${b}/publicaciones?red=instagram`} k="Publicaciones IG (30 días)" v={ig.ok ? fmt(p30.length) : null} color="var(--ig)" ft={ig.ok ? `${fmt(ig.perfil.publicaciones)} en total` : ""} />,
    ig_eng: <Kpi key="ig_eng" href={`${b}/analisis#que-funciona`} k="Engagement aprox." v={engProm != null ? `${fmt(engProm, 2)}%` : null} color="var(--ig)" serie={posts.slice(0, 10).reverse().map((p) => engagement(p, seg ?? 0) ?? 0)} ft="Me gusta + comentarios / seguidores (últimas 10)" />,
    consultas: <Kpi key="consultas" href={`${b}/crm`} k="Consultas (30 días)" v={c?.d30 != null ? fmt(c.d30) : null} delta={<Delta v={c?.d30 != null && c?.p30 != null ? c.d30 - c.p30 : null} />} ft={c?.d7 != null ? `${fmt(c.d7)} en los últimos 7 días` : ""} />,
    visitas: <Kpi key="visitas" href={`${b}/web`} k="Visitas web (30 días)" delta={<Delta v={dif(visA, visP)} />} v={vis30 != null ? fmt(vis30) : null} serie={visDias} color="var(--info)" ft={visDias.length ? `${visDias.length} días con registro` : "Sin visitas registradas"} />,
    academia: <Kpi key="academia" href={`${b}/academia`} k="Suscriptores Academia" v={m?.academia.suscriptores?.act != null ? fmt(m.academia.suscriptores.act) : null} color="var(--ok)" delta={<Delta v={m?.academia.suscriptores?.d30 ?? null} />} ft="activos · altas en 30 días" />,
    fb_seg: <Kpi key="fb_seg" href={`${b}/analisis?cuenta=facebook#que-funciona`} k="Seguidores Facebook" v={fb.ok && fb.seguidores != null ? fmt(fb.seguidores) : null} color="var(--fb)" serie={fb.ok ? fb.serieSeguidores : undefined} delta={<Delta v={fb.ok ? fb.crecimiento30 : null} />} ft={fb.ok ? `desde ${fechaCorta(fb.desde)} · ${fmt(fb.vistasContenido30)} visualizaciones` : "Facebook sin datos todavía"} />,
    yt_vistas: <Kpi key="yt_vistas" href={`${b}/youtube`} k="Vistas YouTube" v={yt?.vistas != null ? fmt(yt.vistas) : null} color="var(--yt)" serie={yt?.lista.slice().reverse().map((v) => v.vistas ?? 0)} ft={yt ? `últimos ${yt.videos} videos del canal` : "Sin conexión con YouTube"} />,
    inversion: <Kpi key="inversion" href={`${b}/anuncios`} k="Inversión en anuncios" v={inversion.length ? inversion.map((x) => x.t).join(" + ") : null} ft={inversion.length ? inversion.map((x) => x.n).join(" y ") + " · 30 días" : "No hay datos de anuncios cargados"} />,
    visitas_hoy: <Kpi key="visitas_hoy" href={`${b}/web`} k="Visitas de hoy" v={visHoy != null ? fmt(visHoy) : null} serie={nv.slice(-14).map((x) => Number(x.c))} color="var(--info)" ft={visAyer != null ? `ayer ${fmt(visAyer)} visitas` : "Sin visitas registradas"} />,
    li_seg: <Kpi key="li_seg" href={`${b}/linkedin`} k="Seguidores LinkedIn (página)" v={lix?.seguidores.total != null ? fmt(lix.seguidores.total) : null} color="var(--li)" delta={<Delta v={lix?.seguidores.nuevos ?? null} />} ft={lix?.seguidores.total != null ? `exportación de LinkedIn${lix.mes ? " · " + lix.mes : ""}` : "Sin exportación cargada"} />,
  }

  return (
    <>
      <Head t="Inicio" sub={<>Resumen de redes, web y negocio de DEVISEBIT · últimos 30 días{ig.ok ? ` · Instagram actualizado ${fechaHora(ig.actualizado)}` : ""}</>}><Personalizar actual={P} /></Head>

      {ver("atencion") && <>
      <div id="atencion"><ParaHoy items={atencion.map((a) => ({ n: a.nivel === "alto" ? "!" : "·", t: a.t, d: a.d, href: a.href ?? `${b}/analisis`, accion: a.accion ?? "Ver", tono: a.nivel === "alto" ? undefined : "av" as const }))} /></div>
      </>}

      {P.tarjetas.length > 0 && <Sec t="Indicadores" />}
      {P.tarjetas.length > 0 && (
      <div className="pc-kpis">
        {P.tarjetas.map((id) => T[id])}
      </div>
      )}

      {ver("embudo") && <>
      <Sec t="Del visitante a la venta" />
      <div className="pc-card"><div className="pc-ch"><h2>Embudo · 30 días</h2><a className="pc-btn" href={`${b}/analisis#negocio`}>Análisis</a></div>
        {neg ? <Embudo pasos={[{ k: "Visitas web", v: visA }, { k: "Consultas", v: conA }, { k: "Atendidas", v: atenA }, { k: "Ganadas", v: ganA }]} /> : <div className="pc-empty">Sin datos.</div>}
      </div>
      </>}

      {ver("redes") && <>
      <Sec t="Redes" />
      <div className="pc-grid pc-g5">
        <a className="pc-card pc-red" href="https://www.instagram.com/devisebit" target="_blank" rel="noreferrer">
          <div className="hd"><span className="ic" style={{ background: "rgba(225,48,108,.15)", color: "var(--ig)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></span><div><h3>Instagram</h3><span className="pc-muted" style={{ fontSize: 12 }}>@devisebit</span></div></div>
          {ig.ok ? <div className="pc-mono" style={{ fontSize: 13 }}>{fmt(ig.perfil.seguidores)} seguidores · {fmt(ig.perfil.publicaciones)} publicaciones · sigue a {fmt(ig.perfil.siguiendo)}</div> : <span className="pc-muted" style={{ fontSize: 12.5 }}>{ig.error}</span>}
        </a>
        <a className="pc-card pc-red" href={yt?.canal ?? "https://www.youtube.com/@devisebitsrl"} target="_blank" rel="noreferrer">
          <div className="hd"><span className="ic" style={{ background: "rgba(255,59,59,.15)", color: "var(--yt)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" /></svg></span><div><h3>YouTube</h3><span className="pc-muted" style={{ fontSize: 12 }}>ACADEMIA DEVISEBIT</span></div></div>
          <div className="pc-mono" style={{ fontSize: 13 }}>{yt ? <>{yt.suscriptores != null ? `${fmt(yt.suscriptores)} suscriptores · ` : ""}{fmt(yt.videos)} videos · {fmt(yt.publicados30)} en 30 días</> : "Sin datos del canal"}</div>
          {ytp && <div className="pc-mono pc-muted" style={{ fontSize: 12, marginTop: 4 }}>Publicaciones: {fmt(ytp.totalPublicadas)} publicadas · {fmt(ytp.proximas.length)} programadas{ytp.proximas[0] ? ` · próxima ${new Date(ytp.proximas[0].fecha).toLocaleDateString("es-AR", { day: "numeric", month: "numeric", timeZone: "America/Argentina/Buenos_Aires" })}` : ""}{ytp.totalPublicadas ? ` · ${fmt(ytp.meGusta)} me gusta` : ""}</div>}
        </a>
        <a className="pc-card pc-red" href={FB_URL} target="_blank" rel="noreferrer">
          <div className="hd"><span className="ic" style={{ background: "rgba(24,119,242,.15)", color: "var(--fb)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M15 8h-1.5A2.5 2.5 0 0011 10.5V21M8.5 13H15" /></svg></span><div><h3>Facebook</h3><span className="pc-muted" style={{ fontSize: 12 }}>Página DEVISEBIT</span></div></div>
          {fb.ok ? (
            <>
              <div className="pc-mono" style={{ fontSize: 13 }}>{fmt(fb.seguidores)} seguidores · +{fmt(fb.nuevos30)} / −{fmt(fb.perdidos30)} en 30 días · {fmt(pubs.filter((p) => p.red === "facebook" && p.fecha && Date.now() - new Date(p.fecha).getTime() < 30 * 864e5).length)} publicaciones</div>
              <div className="pc-mono pc-muted" style={{ fontSize: 12, marginTop: 4 }}>{fmt(fb.vistasPagina30)} vistas de la página · {fmt(fb.vistasContenido30)} visualizaciones de contenido (Metricool, {fechaHora(fb.actualizado)})</div>
            </>
          ) : <span className="pc-muted" style={{ fontSize: 12.5 }}>{fb.error}</span>}
        </a>
        <a className="pc-card pc-red" href={`${b}/linkedin`}>
          <div className="hd"><span className="ic" style={{ background: "rgba(47,140,255,.15)", color: "var(--li)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7" /></svg></span><div><h3>LinkedIn</h3><span className="pc-muted" style={{ fontSize: 12 }}>DEVISEBIT</span></div></div>
          {lix && (lix.periodo.dias > 0 || lix.posts.length > 0 || lix.seguidores.total != null) ? (
            <div className="pc-mono" style={{ fontSize: 13, marginBottom: 4 }}>
              {lix.seguidores.total != null ? `${fmt(lix.seguidores.total)} seguidores · ` : ""}{lix.seguidores.nuevos != null ? `+${fmt(lix.seguidores.nuevos)} en ${lix.mes} · ` : ""}{lix.visitas.vistas != null ? `${fmt(lix.visitas.vistas)} visitas · ` : ""}{fmt(lix.contenido.impresiones)} impresiones{lix.contenido.interaccion != null ? ` · interacción ${fmt(lix.contenido.interaccion, 1)}%` : ""}
              <span className="pc-muted"> (exportación de LinkedIn{lix.ultimaImportacion ? `, ${fechaHora(lix.ultimaImportacion.creado)}` : ""})</span>
            </div>
          ) : null}
          {li.ok ? (
            <div className="pc-mono" style={{ fontSize: 13 }}>
              <span className="pc-muted">Buffer: </span>{fmt(li.actual.posts)} publicaciones en 30 días · alcance {fmt(li.actual.alcance)} · {fmt(li.actual.reacciones)} reacciones{li.actual.engagement != null ? ` · engagement ${fmt(li.actual.engagement, 1)}%` : ""}
              {li.previo.alcance ? <span className="pc-muted"> (antes: alcance {fmt(li.previo.alcance)})</span> : null}
            </div>
          ) : <span className="pc-muted" style={{ fontSize: 12.5 }}>{li.error === "sin_clave" ? "Datos de la página vía Buffer: falta cargar la clave de Buffer." : `Buffer no respondió: ${li.error}`}</span>}
        </a>
        <a className="pc-card pc-red" href={`${b}/web`}>
          <div className="hd"><span className="ic" style={{ background: "var(--red-soft)", color: "var(--red)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h13v16H6a2 2 0 01-2-2zM17 8h3v10a2 2 0 01-2 2M8 8h5M8 12h5M8 16h3" /></svg></span><div><h3>Blog y web</h3><span className="pc-muted" style={{ fontSize: 12 }}>devisebit.com/novedades</span></div></div>
          <span className="pc-muted" style={{ fontSize: 12.5 }}>Estado de los sitios, notas publicadas y visitas.</span>
        </a>
      </div>
      </>}

      {(ver("recientes") || ver("consultas")) && <div className={`pc-grid ${ver("recientes") && ver("consultas") ? "pc-g2" : ""}`}>
        {ver("recientes") && <div className="pc-card">
          <div className="pc-ch"><h2>Últimas publicaciones</h2><span className="pc-k">todas las redes</span><a className="pc-btn" href={`${b}/publicaciones`}>Ver todas</a></div>
          {recientes.length ? (
            <div className="pc-list">
              {recientes.map((p) => (
                <a key={p.red + p.id} className="pc-item" href={p.url ?? "#"} target="_blank" rel="noreferrer">
                  <span className="t">{(p.texto.split("\n")[0] || "(ver publicación)").slice(0, 110)}</span>
                  <span className="m"><span><span className="pc-dot" style={{ background: REDES[p.red]?.color }} /> {REDES[p.red]?.nombre} · {formatoDe(p.red, p.tipo)} · {fechaCorta(p.fecha!)}</span><span><b>{fmt(interacciones(p))}</b> interacciones</span></span>
                </a>
              ))}
            </div>
          ) : <SinDatos><b>Sin publicaciones en el historial.</b></SinDatos>}
        </div>}
        {ver("consultas") && <div className="pc-card">
          <div className="pc-ch"><h2>Consultas por estado</h2><a className="pc-btn" href={`${b}/crm`}>CRM y ventas</a></div>
          {c && Object.keys(c.porEstado).length ? (
            <Barras filas={Object.entries(ESTADOS).map(([k, t]) => ({ k: t, v: Number(c.porEstado[k] ?? 0) }))} />
          ) : <div className="pc-empty">Todavía no hay consultas registradas.</div>}
          {c?.esperanHumano ? <p className="pc-sub" style={{ marginTop: 12 }}><b style={{ color: "var(--warn)" }}>{fmt(c.esperanHumano)}</b> consultas esperan que las atienda una persona.</p> : null}
        </div>}
      </div>}
    </>
  )
}
