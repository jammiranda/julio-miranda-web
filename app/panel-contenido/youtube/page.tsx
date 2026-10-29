import { youtubeCache, safe } from "@/lib/panel"
import { publicacionesYouTubeCache } from "@/lib/youtube-publicaciones"
import { acceso, Head, Kpi, Barras, SinDatos, fmt, fechaCorta } from "../_ui"

export const dynamic = "force-dynamic"

export default async function YouTube() {
  if (!(await acceso())) return null
  const [yt, pub] = await Promise.all([safe(youtubeCache()), safe(publicacionesYouTubeCache())])
  if (!yt) return (<><Head t="YouTube" sub="ACADEMIA DEVISEBIT" /><SinDatos>No se pudo leer el canal de YouTube en este momento.</SinDatos></>)
  const conVistas = yt.lista.filter((v) => v.vistas != null)
  return (
    <>
      <Head t="YouTube" sub="Canal ACADEMIA DEVISEBIT · datos del feed público (últimos 15 videos)">
        <a className="pc-btn" href={yt.canal} target="_blank" rel="noreferrer">Abrir el canal</a>
      </Head>
      <div className="pc-kpis">
        <Kpi k="Suscriptores" v={yt.suscriptores != null ? fmt(yt.suscriptores) : null} color="var(--yt)" ft={yt.suscriptores == null ? "YouTube no los mostró en la página pública" : "según la página del canal"} />
        <Kpi k="Videos en el feed" v={fmt(yt.videos)} ft={`${fmt(yt.cortos)} son cortos`} color="var(--yt)" />
        <Kpi k="Publicados (30 días)" v={fmt(yt.publicados30)} ft={yt.ultimo ? `último: ${fechaCorta(yt.ultimo)}` : ""} />
        <Kpi k="Vistas" v={yt.vistas != null ? fmt(yt.vistas) : null} serie={yt.lista.slice().reverse().map((v) => v.vistas ?? 0)} color="var(--yt)" ft={yt.vistas30 != null ? `${fmt(yt.vistas30)} en videos de los últimos 30 días` : ""} />
        <Kpi k="Me gusta" v={yt.meGusta != null ? fmt(yt.meGusta) : null} ft="Suma de los videos del feed" color="var(--ok)" />
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Vistas por video</h2></div>
        {conVistas.length ? <Barras filas={conVistas.map((v) => ({ k: v.titulo, v: v.vistas ?? 0 }))} color="var(--yt)" /> : <div className="pc-empty">El feed no trajo vistas por video.</div>}
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Videos</h2></div>
        <div className="pc-tw"><table><thead><tr><th>Video</th><th>Tipo</th><th>Fecha</th><th className="n">Vistas</th><th className="n">Me gusta</th></tr></thead>
          <tbody>{yt.lista.map((v) => <tr key={v.id}><td><a href={v.url} target="_blank" rel="noreferrer">{v.titulo}</a></td><td className="pc-muted">{v.corto ? "Corto" : "Video"}</td><td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{v.fecha ? fechaCorta(v.fecha) : "—"}</td><td className="n">{fmt(v.vistas)}</td><td className="n">{fmt(v.meGusta)}</td></tr>)}</tbody>
        </table></div>
      </div>
      {pub && (<>
        <div className="pc-card"><div className="pc-ch"><h2>Publicaciones de la comunidad</h2><a className="pc-btn" href={pub.url} target="_blank" rel="noreferrer">Abrir Publicaciones</a></div>
          <div className="pc-kpis">
            <Kpi k="Publicadas" v={fmt(pub.totalPublicadas)} color="var(--yt)" ft={pub.leido ? "según la pestaña pública del canal" : "no se pudo leer la pestaña pública"} />
            <Kpi k="Programadas" v={fmt(pub.proximas.length)} color="var(--yt)" ft={pub.proximas[0] ? `próxima: ${fechaCorta(pub.proximas[0].fecha)}` : "cargá la semana el domingo"} />
            <Kpi k="Me gusta" v={fmt(pub.meGusta)} color="var(--ok)" ft="suma de las publicadas" />
            <Kpi k="Comentarios" v={fmt(pub.comentarios)} ft="suma de las publicadas" />
            <Kpi k="Votos en encuestas" v={fmt(pub.votos)} ft="suma de las encuestas" />
          </div>
          <p className="pc-sub">Ritmo: {pub.ritmo.map((r) => `${r.dia}: ${r.que}`).join(" · ")}. Se programan los domingos (tarea automática en la compu de Julio).</p>
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Próximas (programadas)</h2></div>
          {pub.proximas.length ? <div className="pc-tw"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Tema</th><th>Texto</th><th>Estado</th></tr></thead>
            <tbody>{pub.proximas.map((x, i) => <tr key={i}><td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{fechaCorta(x.fecha)} 9 h</td><td className="pc-muted">{x.tipo}</td><td>{x.tema}</td><td className="pc-muted">{x.texto}{x.opciones ? ` (${x.opciones.join(" / ")})` : ""}{x.video ? ` · video: ${x.video}` : ""}</td><td className="pc-muted">{x.estado === "programada" ? "Programada" : "Falta cargar"}</td></tr>)}</tbody>
          </table></div> : <div className="pc-empty">No hay publicaciones programadas a futuro.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Publicadas</h2></div>
          {pub.publicadas.length ? <div className="pc-tw"><table><thead><tr><th>Publicación</th><th>Tipo</th><th>Cuándo</th><th className="n">Me gusta</th><th className="n">Comentarios</th><th className="n">Votos</th></tr></thead>
            <tbody>{pub.publicadas.map((x) => <tr key={x.id}><td><a href={x.url} target="_blank" rel="noreferrer">{x.texto.slice(0, 110) || "(sin texto)"}</a></td><td className="pc-muted">{x.tipo}</td><td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{x.hace || "—"}</td><td className="n">{fmt(x.meGusta)}</td><td className="n">{fmt(x.comentarios)}</td><td className="n">{x.votos != null ? fmt(x.votos) : "—"}</td></tr>)}</tbody>
          </table></div> : <div className="pc-empty">Todavía no hay publicaciones visibles. La primera sale el 1/11 a las 9 h.</div>}
        </div>
      </>)}
      <p className="pc-sub">{yt.nota}</p>
    </>
  )
}
