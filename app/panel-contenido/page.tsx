import { instagram, historialSeguidores, engagement } from "@/lib/instagram"
import { linkedin } from "@/lib/linkedin"
import { panelMetricas, youtubeCache, safe } from "@/lib/panel"
import { publicacionesYouTubeCache } from "@/lib/youtube-publicaciones"
import { resumenAds } from "@/lib/ads"
import { linkedinExport } from "@/lib/linkedin-export"
import { acceso, base, Head, Sec, Kpi, Delta, Barras, SinDatos, fmt, plata, fechaCorta, fechaHora } from "./_ui"

export const dynamic = "force-dynamic"

const ESTADOS: Record<string, string> = { nueva: "Nuevas", contactada: "Contactadas", calificada: "Calificadas", convertida: "Ganadas", descartada: "Descartadas" }

export default async function Inicio() {
  if (!(await acceso())) return null
  const b = base()
  const [ig, hist, m, yt, ads, li, ytp] = await Promise.all([instagram(), historialSeguidores(120).catch(() => []), safe(panelMetricas()), safe(youtubeCache()), safe(resumenAds()), linkedin(), safe(publicacionesYouTubeCache())])
  const lix = await safe(linkedinExport())
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

  return (
    <>
      <Head t="Inicio" sub={<>Resumen de redes, web y negocio de DEVISEBIT · últimos 30 días{ig.ok ? ` · Instagram actualizado ${fechaHora(ig.actualizado)}` : ""}</>} />

      <Sec t="Indicadores" />
      <div className="pc-kpis">
        <Kpi k="Seguidores Instagram" v={seg != null ? fmt(seg) : null} color="var(--ig)" serie={hist.map((h) => h.seguidores)} delta={<Delta v={crecimiento} />} ft={crecimiento != null ? `desde ${fechaCorta(hace30!.dia)}` : ig.ok ? "La evolución se registra cada día" : "Instagram sin conexión"} />
        <Kpi k="Publicaciones IG (30 días)" v={ig.ok ? fmt(p30.length) : null} color="var(--ig)" ft={ig.ok ? `${fmt(ig.perfil.publicaciones)} en total` : ""} />
        <Kpi k="Engagement aprox." v={engProm != null ? `${fmt(engProm, 2)}%` : null} color="var(--ig)" serie={posts.slice(0, 10).reverse().map((p) => engagement(p, seg ?? 0) ?? 0)} ft="Me gusta + comentarios / seguidores (últimas 10)" />
        <Kpi k="Consultas (30 días)" v={c?.d30 != null ? fmt(c.d30) : null} delta={<Delta v={c?.d30 != null && c?.p30 != null ? c.d30 - c.p30 : null} />} ft={c?.d7 != null ? `${fmt(c.d7)} en los últimos 7 días` : ""} />
        <Kpi k="Visitas web (30 días)" v={vis30 != null ? fmt(vis30) : null} serie={visDias} color="var(--info)" ft={visDias.length ? `${visDias.length} días con registro` : "Sin visitas registradas"} />
        <Kpi k="Suscriptores Academia" v={m?.academia.suscriptores?.act != null ? fmt(m.academia.suscriptores.act) : null} color="var(--ok)" delta={<Delta v={m?.academia.suscriptores?.d30 ?? null} />} ft="activos · altas en 30 días" />
        <Kpi k="Vistas YouTube" v={yt?.vistas != null ? fmt(yt.vistas) : null} color="var(--yt)" serie={yt?.lista.slice().reverse().map((v) => v.vistas ?? 0)} ft={yt ? `últimos ${yt.videos} videos del canal` : "Sin conexión con YouTube"} />
        <Kpi k="Inversión en anuncios" v={gasto.length ? gasto.map((p) => plata(p.gasto, p.moneda)).join(" + ") : null} ft={gasto.length ? gasto.map((p) => p.nombre).join(" y ") + " · 30 días" : "No hay datos de anuncios cargados"} />
      </div>

      <Sec t="Redes" />
      <div className="pc-grid pc-g4">
        <a className="pc-card pc-red" href="https://www.instagram.com/devisebit" target="_blank" rel="noreferrer">
          <div className="hd"><span className="ic" style={{ background: "rgba(225,48,108,.15)", color: "var(--ig)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></span><div><h3>Instagram</h3><span className="pc-muted" style={{ fontSize: 12 }}>@devisebit</span></div></div>
          {ig.ok ? <div className="pc-mono" style={{ fontSize: 13 }}>{fmt(ig.perfil.seguidores)} seguidores · {fmt(ig.perfil.publicaciones)} publicaciones · sigue a {fmt(ig.perfil.siguiendo)}</div> : <span className="pc-muted" style={{ fontSize: 12.5 }}>{ig.error}</span>}
        </a>
        <a className="pc-card pc-red" href={yt?.canal ?? "https://www.youtube.com/@devisebitsrl"} target="_blank" rel="noreferrer">
          <div className="hd"><span className="ic" style={{ background: "rgba(255,59,59,.15)", color: "var(--yt)" }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" /></svg></span><div><h3>YouTube</h3><span className="pc-muted" style={{ fontSize: 12 }}>ACADEMIA DEVISEBIT</span></div></div>
          <div className="pc-mono" style={{ fontSize: 13 }}>{yt ? <>{yt.suscriptores != null ? `${fmt(yt.suscriptores)} suscriptores · ` : ""}{fmt(yt.videos)} videos · {fmt(yt.publicados30)} en 30 días</> : "Sin datos del canal"}</div>
          {ytp && <div className="pc-mono pc-muted" style={{ fontSize: 12, marginTop: 4 }}>Publicaciones: {fmt(ytp.totalPublicadas)} publicadas · {fmt(ytp.proximas.length)} programadas{ytp.proximas[0] ? ` · próxima ${new Date(ytp.proximas[0].fecha).toLocaleDateString("es-AR", { day: "numeric", month: "numeric", timeZone: "America/Argentina/Buenos_Aires" })}` : ""}{ytp.totalPublicadas ? ` · ${fmt(ytp.meGusta)} me gusta` : ""}</div>}
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

      <div className="pc-grid pc-g2">
        <div className="pc-card">
          <div className="pc-ch"><h2>Últimas publicaciones en Instagram</h2><a className="pc-btn" href={`${b}/publicaciones`}>Ver todas</a></div>
          {ig.ok ? (
            posts.length ? (
              <div className="pc-list">
                {posts.slice(0, 5).map((p) => (
                  <a key={p.id} className="pc-item" href={p.url} target="_blank" rel="noreferrer">
                    <span className="t">{p.texto.split("\n")[0].slice(0, 110) || "(sin texto)"}</span>
                    <span className="m"><span>{fechaCorta(p.fecha)} · {p.tipo === "VIDEO" ? "Video" : p.tipo === "CAROUSEL_ALBUM" ? "Carrusel" : "Imagen"}</span><span>♥ {fmt(p.meGusta)} · {fmt(p.comentarios)} coment. · {fmt(engagement(p, seg ?? 0), 2)}%</span></span>
                  </a>
                ))}
              </div>
            ) : <div className="pc-empty">La cuenta todavía no tiene publicaciones.</div>
          ) : <SinDatos><b>Instagram sin datos.</b> {ig.error}</SinDatos>}
        </div>
        <div className="pc-card">
          <div className="pc-ch"><h2>Consultas por estado</h2><a className="pc-btn" href={`${b}/crm`}>CRM y ventas</a></div>
          {c && Object.keys(c.porEstado).length ? (
            <Barras filas={Object.entries(ESTADOS).map(([k, t]) => ({ k: t, v: Number(c.porEstado[k] ?? 0) }))} />
          ) : <div className="pc-empty">Todavía no hay consultas registradas.</div>}
          {c?.esperanHumano ? <p className="pc-sub" style={{ marginTop: 12 }}><b style={{ color: "var(--warn)" }}>{fmt(c.esperanHumano)}</b> consultas esperan que las atienda una persona.</p> : null}
        </div>
      </div>
    </>
  )
}
