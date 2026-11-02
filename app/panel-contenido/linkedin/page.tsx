import { linkedin } from "@/lib/linkedin"
import { linkedinExport } from "@/lib/linkedin-export"
import { safe } from "@/lib/panel"
import { acceso, base, Head, Sec, Kpi, Delta, Columnas, SinDatos, fmt, fechaCorta, fechaHora } from "../_ui"
import SubirLinkedin from "./_subir"
import SubirPerfil from "./_subir-perfil"
import { historial, redDiario, interacciones } from "@/lib/publicaciones"

export const dynamic = "force-dynamic"

const nombreMes = (m: string) => new Date(`${m}-15T12:00:00-03:00`).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })

export default async function LinkedIn({ searchParams }: { searchParams: { mes?: string; cuenta?: string } }) {
  if (!(await acceso())) return null
  const b = base()
  if (searchParams.cuenta === "julio") return <PerfilJulio b={b} />
  const [ex, li] = await Promise.all([safe(linkedinExport(searchParams.mes)), linkedin()])
  const hayExport = !!ex && (ex.periodo.dias > 0 || ex.posts.length > 0 || ex.seguidores.total != null)
  const c = ex?.contenido
  const crecSeg = ex?.seguidores.total != null && ex.seguidores.totalAnterior != null ? ex.seguidores.total - ex.seguidores.totalAnterior : null

  return (
    <>
      <Head
        t="LinkedIn"
        sub={<>Página de empresa /company/devisebit{ex ? <> · {nombreMes(ex.mes)}</> : null}{ex?.ultimaImportacion ? <> · última importación {fechaHora(ex.ultimaImportacion.creado)} ({ex.ultimaImportacion.origen === "manual" ? `a mano, ${ex.ultimaImportacion.por ?? ""}` : "tarea programada"})</> : null}</>}
      >
        <a className="pc-btn" href="https://www.linkedin.com/company/devisebit" target="_blank" rel="noreferrer">Abrir LinkedIn</a>
      </Head>
      <Cuentas b={b} actual="pagina" />

      {ex && ex.meses.length > 1 && (
        <div className="pc-seg" role="group" aria-label="Mes">
          {ex.meses.slice(0, 12).map((m) => <a key={m} href={`${b}/linkedin?mes=${m}`} aria-current={ex.mes === m ? "true" : undefined}>{m}</a>)}
        </div>
      )}

      <Sec t="Exportación de LinkedIn" />
      {hayExport && ex ? (
        <>
          <div className="pc-kpis">
            <Kpi k="Seguidores totales" v={ex.seguidores.total != null ? fmt(ex.seguidores.total) : null} color="var(--li)" delta={<Delta v={crecSeg} />} ft={ex.seguidores.fechaTotal ? `al ${fechaCorta(ex.seguidores.fechaTotal)}` : "Cargá el total al subir la exportación"} />
            <Kpi k="Seguidores nuevos del mes" v={ex.seguidores.nuevos != null ? fmt(ex.seguidores.nuevos) : null} color="var(--li)" serie={ex.dias.map((d) => d.seg_nuevos ?? 0)} ft="orgánicos + patrocinados + invitados" />
            <Kpi k="Visitas a la página" v={ex.visitas.vistas != null ? fmt(ex.visitas.vistas) : null} color="var(--info)" serie={ex.dias.map((d) => d.vistas ?? 0)} ft="vistas de página (todas las secciones)" />
            <Kpi k="Visitantes únicos" v={ex.visitas.visitantes != null ? fmt(ex.visitas.visitantes) : null} color="var(--info)" ft="suma de únicos por día" />
            <Kpi k="Impresiones" v={c?.impresiones != null ? fmt(c.impresiones) : null} serie={ex.dias.map((d) => d.impresiones ?? 0)} color="var(--violet)" />
            <Kpi k="Clics" v={c?.clics != null ? fmt(c.clics) : null} color="var(--violet)" />
            <Kpi k="Reacciones" v={c?.reacciones != null ? fmt(c.reacciones) : null} color="var(--ok)" ft={c ? `${fmt(c.comentarios)} comentarios · ${fmt(c.compartidos)} compartidos` : ""} />
            <Kpi k="Tasa de interacción" v={c?.interaccion != null ? `${fmt(c.interaccion, 2)}%` : null} color="var(--ok)" ft="(clics + reacciones + coment. + compartidos) / impresiones" />
          </div>
          {ex.dias.some((d) => d.impresiones) && <div className="pc-card"><div className="pc-ch"><h2>Impresiones por día</h2><span className="pc-tag">{ex.periodo.desde ? `${fechaCorta(ex.periodo.desde)} – ${fechaCorta(ex.periodo.hasta!)}` : ""}</span></div><Columnas filas={ex.dias.map((d) => ({ k: d.fecha, v: d.impresiones ?? 0 }))} color="var(--li)" titulo="Impresiones por día" /></div>}
          <div className="pc-card">
            <div className="pc-ch"><h2>Publicaciones del mes</h2><span className="pc-tag"><span className="pc-dot" style={{ background: "var(--li)" }} />Origen: exportación de LinkedIn · por impresiones</span></div>
            {ex.posts.length ? (
              <div className="pc-tw"><table>
                <thead><tr><th>Fecha</th><th>Publicación</th><th className="n">Impresiones</th><th className="n">Clics</th><th className="n">CTR</th><th className="n">Reacciones</th><th className="n">Coment.</th><th className="n">Compart.</th><th className="n">Interacción</th></tr></thead>
                <tbody>
                  {ex.posts.map((p) => (
                    <tr key={p.clave}>
                      <td>{p.fecha ? fechaCorta(p.fecha) : "—"}</td>
                      <td style={{ maxWidth: 420 }}>{p.link ? <a href={p.link} target="_blank" rel="noreferrer">{(p.titulo || "(sin texto)").slice(0, 140)}</a> : (p.titulo || "(sin texto)").slice(0, 140)}{(p.titulo?.length ?? 0) > 140 ? "…" : ""}{p.tipo ? <span className="pc-muted"> · {p.tipo}</span> : null}</td>
                      <td className="n">{fmt(p.impresiones)}</td><td className="n">{fmt(p.clics)}</td><td className="n">{p.ctr != null ? `${fmt(p.ctr, 1)}%` : "—"}</td>
                      <td className="n">{fmt(p.reacciones)}</td><td className="n">{fmt(p.comentarios)}</td><td className="n">{fmt(p.compartidos)}</td>
                      <td className="n">{p.engagement != null ? `${fmt(p.engagement, 1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            ) : <div className="pc-empty">No hay publicaciones de este mes en la exportación.</div>}
          </div>
        </>
      ) : (
        <SinDatos><b>Todavía no hay exportaciones de LinkedIn cargadas{ex ? ` para ${nombreMes(ex.mes)}` : ""}.</b> Subí los archivos de Seguidores, Visitantes y Contenido acá abajo (o los manda la tarea programada mensual).</SinDatos>
      )}

      <SubirLinkedin />

      <Sec t="Buffer (publicaciones programadas)" />
      {li.ok ? (
        <div className="pc-card">
          <div className="pc-ch"><h2>Últimos 30 días según Buffer</h2><span className="pc-tag"><span className="pc-dot" style={{ background: "var(--muted)" }} />Origen: Buffer · solo lo publicado desde Buffer</span></div>
          <div className="pc-mono" style={{ fontSize: 13 }}>{fmt(li.actual.posts)} publicaciones · alcance {fmt(li.actual.alcance)} · impresiones {fmt(li.actual.impresiones)} · {fmt(li.actual.reacciones)} reacciones{li.actual.engagement != null ? ` · engagement ${fmt(li.actual.engagement, 1)}%` : ""}</div>
        </div>
      ) : <SinDatos><b>Buffer sin datos.</b> {li.error === "sin_clave" ? "Falta la clave de Buffer (BUFFER_API_KEY)." : li.error}</SinDatos>}
    </>
  )
}

function Cuentas({ b, actual }: { b: string; actual: "pagina" | "julio" }) {
  return (
    <div className="pc-seg" role="group" aria-label="Cuenta">
      <a href={`${b}/linkedin`} aria-current={actual === "pagina" ? "true" : undefined}>Página DEVISEBIT</a>
      <a href={`${b}/linkedin?cuenta=julio`} aria-current={actual === "julio" ? "true" : undefined}>Perfil de Julio</a>
    </div>
  )
}

/** Perfil personal de Julio: exportación de Analytics del perfil + publicaciones enviadas por Buffer. */
async function PerfilJulio({ b }: { b: string }) {
  const [dias, li, pubs] = await Promise.all([redDiario("linkedin_julio", 120).catch(() => []), linkedin("julio"), historial(365).catch(() => [])])
  const posts = pubs.filter((p) => p.red === "linkedin_julio")
  const ult30 = dias.filter((d) => Date.now() - new Date(d.dia + "T12:00:00-03:00").getTime() <= 30 * 864e5)
  const seg = [...dias].reverse().find((d) => d.seguidores != null)
  const suma = (k: "impresiones" | "interacciones" | "nuevos") => (ult30.some((d) => d[k] != null) ? ult30.reduce((a, d) => a + (d[k] ?? 0), 0) : null)
  const imp = suma("impresiones"), inter = suma("interacciones")
  return (
    <>
      <Head t="LinkedIn" sub={<>Perfil personal de Julio Miranda · parte del ecosistema DEVISEBIT{dias.length ? <> · datos hasta {fechaCorta(dias[dias.length - 1].dia)}</> : null}</>}>
        <a className="pc-btn" href="https://www.linkedin.com/in/me/" target="_blank" rel="noreferrer">Abrir el perfil</a>
      </Head>
      <Cuentas b={b} actual="julio" />
      <div className="pc-kpis">
        <Kpi k="Seguidores" v={seg?.seguidores != null ? fmt(seg.seguidores) : null} color="var(--li)" delta={<Delta v={suma("nuevos")} />} ft={seg ? `al ${fechaCorta(seg.dia)} · nuevos en 30 días` : "Subí la exportación del perfil"} serie={dias.filter((d) => d.seguidores != null).map((d) => d.seguidores!)} />
        <Kpi k="Impresiones (30 días)" v={imp != null ? fmt(imp) : null} color="var(--violet)" serie={ult30.map((d) => d.impresiones ?? 0)} ft="de tus publicaciones" />
        <Kpi k="Interacciones (30 días)" v={inter != null ? fmt(inter) : null} color="var(--ok)" ft={imp && inter != null ? `tasa ${fmt((inter / imp) * 100, 2)}%` : ""} />
        <Kpi k="Publicaciones en el historial" v={fmt(posts.length)} ft={`${fmt(posts.filter((p) => p.fecha && Date.now() - new Date(p.fecha).getTime() < 30 * 864e5).length)} en 30 días`} color="var(--li)" />
      </div>
      {ult30.some((d) => d.impresiones) && <div className="pc-card"><div className="pc-ch"><h2>Impresiones por día</h2></div><Columnas filas={ult30.map((d) => ({ k: d.dia, v: d.impresiones ?? 0 }))} color="var(--li)" titulo="Impresiones por día" /></div>}
      <div className="pc-card">
        <div className="pc-ch"><h2>Tus publicaciones</h2><a className="pc-btn" href={`${b}/publicaciones?red=linkedin_julio&periodo=365`}>Ver en el historial</a></div>
        {posts.length ? (
          <div className="pc-tw"><table>
            <thead><tr><th>Fecha</th><th>Publicación</th><th className="n">Impresiones</th><th className="n">Reacciones</th><th className="n">Coment.</th><th className="n">Interacciones</th><th>Origen</th></tr></thead>
            <tbody>{posts.slice(0, 60).map((p) => (
              <tr key={p.id}><td>{p.fecha ? fechaCorta(p.fecha) : "—"}</td><td style={{ maxWidth: 420 }}>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{(p.texto || "(ver publicación)").slice(0, 130)}</a> : (p.texto || "(sin texto)").slice(0, 130)}</td>
                <td className="n">{fmt(p.impresiones)}</td><td className="n">{fmt(p.me_gusta)}</td><td className="n">{fmt(p.comentarios)}</td><td className="n">{fmt(interacciones(p))}</td><td className="pc-muted" style={{ fontSize: 12 }}>{p.origen ?? ""}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <div className="pc-empty">Todavía no hay publicaciones del perfil. Se suman las que salen por Buffer y las de la exportación.</div>}
      </div>
      <SubirPerfil />
      <Sec t="Buffer (perfil de Julio)" />
      {li.ok ? (
        <div className="pc-card"><div className="pc-mono" style={{ fontSize: 13 }}>{fmt(li.actual.posts)} publicaciones en 30 días · alcance {fmt(li.actual.alcance)} · impresiones {fmt(li.actual.impresiones)} · {fmt(li.actual.reacciones)} reacciones{li.actual.engagement != null ? ` · engagement ${fmt(li.actual.engagement, 1)}%` : ""}</div></div>
      ) : <SinDatos><b>Buffer sin datos.</b> {li.error === "sin_clave" ? "Falta la clave de Buffer (BUFFER_API_KEY)." : li.error}</SinDatos>}
    </>
  )
}
