import { hoyAR, tiktok, tiktokDesdeBuffer, TT_PRIMER_VIDEO, TT_URL, TT_USUARIO } from "@/lib/tiktok"
import { interacciones } from "@/lib/publicaciones"
import { safe } from "@/lib/panel"
import { acceso, base, Head, Sec, Kpi, Delta, Linea, SinDatos, fmt, fechaCorta, fechaHora } from "../_ui"
import CargarTikTok from "./_cargar"

export const dynamic = "force-dynamic"

export default async function TikTok() {
  if (!(await acceso())) return null
  const b = base()
  // Primero se traen de Buffer los videos publicados con sus números (como mucho cada 30 min); después se lee lo guardado.
  const sincro = await tiktokDesdeBuffer()
  const tt = await safe(tiktok())
  const videos = tt?.videos ?? []
  const conSeg = (tt?.serie ?? []).filter((d) => d.seguidores != null)
  const crec = conSeg.length > 1 ? Number(conSeg[conSeg.length - 1].seguidores) - Number(conSeg[0].seguidores) : null
  const suma = (k: "vistas" | "me_gusta" | "comentarios" | "compartidos") => (videos.some((v) => v[k] != null) ? videos.reduce((s, v) => s + (v[k] ?? 0), 0) : null)
  const vistas = suma("vistas")
  const d30 = videos.filter((v) => v.fecha && Date.now() - new Date(v.fecha).getTime() < 30 * 864e5)

  return (
    <>
      <Head t="TikTok" sub={<>@{TT_USUARIO} · cuenta creada el 12/11/2026 · se publica por Buffer, 2 videos por día · los números llegan solos: seguidores y totales diarios desde Metricool (tarea diaria de las 7:17), videos desde Metricool y Buffer; la carga a mano queda como respaldo{tt?.actualizado ? <> · última carga {fechaHora(tt.actualizado)}</> : null}</>}>
        <a className="pc-btn" href={TT_URL} target="_blank" rel="noreferrer">Abrir TikTok</a>
      </Head>

      {!tt ? (
        <SinDatos><b>No se pudieron leer los datos guardados de TikTok en este momento.</b> Probá de nuevo en un rato.</SinDatos>
      ) : !tt.hay ? (
        <SinDatos><b>Todavía no hay datos cargados.</b> {sincro.ok ? "Buffer todavía no informó videos publicados." : sincro.error === "sin_clave" ? "Falta la clave de Buffer (BUFFER_API_KEY) para traer los videos solos." : `No se pudieron traer los videos desde Buffer (${sincro.error}).`} Los seguidores llegan desde Metricool con la tarea diaria (Metricool empezó a medir la cuenta el 13/11). Si hace falta, se pueden cargar a mano: copialos desde <a href={TT_URL} target="_blank" rel="noreferrer">el perfil @{TT_USUARIO}</a> y cargalos en el formulario de abajo. El primer video se publicó el 12/11/2026: <a href={TT_PRIMER_VIDEO} target="_blank" rel="noreferrer">verlo en TikTok</a>.</SinDatos>
      ) : (
        <>
          <div className="pc-kpis">
            <Kpi k="Seguidores" v={tt.seguidores != null ? fmt(tt.seguidores) : null} color="var(--tt)" serie={conSeg.map((d) => Number(d.seguidores))} delta={<Delta v={crec} />} ft={tt.seguidoresDia ? `al ${fechaCorta(tt.seguidoresDia)}${crec != null ? ` · desde ${fechaCorta(conSeg[0].dia)}` : ""}` : "Todavía no se cargaron"} />
            <Kpi k="Me gusta de la cuenta" v={tt.meGusta != null ? fmt(tt.meGusta) : null} color="var(--tt)" ft={tt.meGustaDia ? `al ${fechaCorta(tt.meGustaDia)}` : "Todavía no se cargaron"} />
            <Kpi k="Videos cargados" v={videos.length ? fmt(videos.length) : null} color="var(--tt)" ft={videos.length ? `${fmt(d30.length)} publicados en 30 días` : "Todavía no se cargó ningún video"} />
            <Kpi k="Reproducciones" v={vistas != null ? fmt(vistas) : null} color="var(--violet)" ft={vistas != null ? "suma de los videos cargados" : "Todavía no se cargaron"} />
            <Kpi k="Interacciones" v={videos.length && suma("me_gusta") != null ? fmt(videos.reduce((s, v) => s + interacciones(v), 0)) : null} color="var(--ok)" ft="me gusta + comentarios + compartidos de los videos cargados" />
          </div>
          {conSeg.length > 1 && <div className="pc-card"><div className="pc-ch"><h2>Seguidores</h2><span className="pc-k">según cada carga</span></div><Linea puntos={conSeg.map((d) => ({ x: d.dia, y: Number(d.seguidores) }))} color="var(--tt)" titulo="Seguidores de TikTok" /></div>}
          <div className="pc-card">
            <div className="pc-ch"><h2>Videos</h2><span className="pc-tag"><span className="pc-dot" style={{ background: "var(--tt)" }} />Origen: Metricool y Buffer (automático), carga a mano de respaldo</span>{!sincro.ok && sincro.error !== "sin_clave" && <span className="pc-tag" title={sincro.error}>Buffer no respondió: se muestra lo último guardado</span>}<a className="pc-btn" href={`${b}/publicaciones?red=tiktok&periodo=365`}>Ver en el historial</a></div>
            {videos.length ? (
              <div className="pc-tw"><table>
                <thead><tr><th>Fecha</th><th>Video</th><th className="n">Reproducciones</th><th className="n">Me gusta</th><th className="n">Coment.</th><th className="n">Compart.</th><th>Última carga</th></tr></thead>
                <tbody>{videos.slice(0, 200).map((v) => (
                  <tr key={v.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{v.fecha ? fechaCorta(v.fecha) : "—"}</td>
                    <td style={{ maxWidth: 420 }}><a href={v.url ?? TT_URL} target="_blank" rel="noreferrer">{(v.texto.split("\n")[0] || "(ver video)").slice(0, 130)}</a></td>
                    <td className="n">{fmt(v.vistas)}</td><td className="n">{fmt(v.me_gusta)}</td><td className="n">{fmt(v.comentarios)}</td><td className="n">{fmt(v.compartidos)}</td>
                    <td className="pc-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{v.actualizado ? fechaHora(v.actualizado) : ""}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <div className="pc-empty">Todavía no se cargó ningún video. Sumalos en el formulario de abajo.</div>}
          </div>
        </>
      )}

      <Sec t="Carga de datos" />
      <CargarTikTok hoy={hoyAR()} perfil={TT_URL} />
    </>
  )
}
