import { youtubeCache, safe } from "@/lib/panel"
import { acceso, Head, Kpi, Barras, SinDatos, fmt, fechaCorta } from "../_ui"

export const dynamic = "force-dynamic"

export default async function YouTube() {
  if (!(await acceso())) return null
  const yt = await safe(youtubeCache())
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
      <p className="pc-sub">{yt.nota}</p>
    </>
  )
}
