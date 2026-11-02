import { academiaPanel } from "@/lib/academia-panel"
import { youtubeCache, safe } from "@/lib/panel"
import { acceso, Head, Sec, Kpi, Barras, SinDatos, fmt, plata } from "../_ui"

export const dynamic = "force-dynamic"

const ESTADO_PROD: Record<string, string> = { venta: "A la venta", lista_espera: "Lista de espera", oculto: "Oculto" }
const EVENTOS: Record<string, string> = { leccion: "Lecciones completadas", quiz: "Cuestionarios", videollamada: "Videollamadas pedidas", autodiagnostico: "Autodiagnósticos", interes: "Interés en programas" }

export default async function Academia() {
  if (!(await acceso())) return null
  const [a, yt] = await Promise.all([safe(academiaPanel()), safe(youtubeCache())])
  if (!a) return (<><Head t="Academia" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const pub = a.cursos.filter((c) => c.estado === "publicado")
  const s = a.suscriptores, e = a.embudo
  const ventasCursos = a.cursos.reduce((x, c) => x + c.ventas, 0), ingresosCursos = a.cursos.reduce((x, c) => x + c.ingresos, 0)
  const ventasProd = a.productos.reduce((x, p) => x + p.ventas, 0), ingresosProd = a.productos.reduce((x, p) => x + p.ingresos, 0)

  return (
    <>
      <Head t="Academia" sub="ACADEMIA DEVISEBIT tal como está hoy: cursos, programas, guías, descargas, videos y autodiagnóstico">
        <a className="pc-btn" href="https://academia.devisebit.com" target="_blank" rel="noreferrer">Abrir la Academia</a>
      </Head>
      <div className="pc-kpis">
        <Kpi k="Cursos publicados" v={fmt(pub.length)} ft={`${fmt(pub.filter((c) => c.gratis_modulos > 0 || !c.precio).length)} con módulo gratis o gratuitos · ${fmt(a.cursos.length - pub.length)} en borrador`} color="var(--red)" />
        <Kpi k="Alumnos" v={fmt(e?.inscriptos)} ft={`${fmt(a.cursos.reduce((x, c) => x + c.activos30, 0))} con actividad en 30 días`} color="var(--ok)" />
        <Kpi k="Certificados" v={fmt(e?.certificados)} ft={`${fmt(a.cursos.reduce((x, c) => x + c.aprobados, 0))} aprobados`} color="var(--ok)" />
        <Kpi k="Ventas" v={fmt(ventasCursos + ventasProd)} ft={`${plata(ingresosCursos + ingresosProd)} · cursos ${fmt(ventasCursos)} · descargas ${fmt(ventasProd)}`} color="var(--warn)" />
        <Kpi k="Suscriptores de las guías" v={fmt(s?.act)} ft={s ? `+${fmt(s.d7)} en 7 días · +${fmt(s.d30)} en 30 · ${fmt(s.bajas)} bajas` : ""} color="var(--info)" />
        <Kpi k="Guías gratis" v={fmt(a.guias.pub)} ft={`${fmt(a.guias.vistas)} lecturas · ${fmt(a.guias.nuevas30)} nuevas en 30 días`} color="var(--info)" />
        <Kpi k="Autodiagnósticos" v={fmt(a.diagnosticos.total)} ft={`${fmt(a.diagnosticos.d30)} en 30 días${a.diagnosticos.promedio != null ? ` · puntaje medio ${fmt(a.diagnosticos.promedio)}` : ""}`} />
        <Kpi k="Visitas a la Academia" v={fmt(a.visitas?.d30)} ft={`${fmt(a.visitas?.d7)} en 7 días · academia.devisebit.com`} color="var(--info)" />
      </div>

      <div className="pc-card"><div className="pc-ch"><h2>Embudo de la Academia</h2><span className="pc-k">acumulado</span></div>
        <Barras filas={[
          { k: "Suscriptos a las guías", v: e?.suscriptos ?? 0 },
          { k: "Inscriptos en cursos", v: e?.inscriptos ?? 0 },
          { k: "Compradores", v: e?.compradores ?? 0 },
          { k: "Certificados emitidos", v: e?.certificados ?? 0 },
        ]} color="var(--ok)" />
      </div>

      <Sec t="Cursos · a tu ritmo, con certificado" />
      <div className="pc-card" style={{ padding: 0 }}>
        {a.cursos.length ? (
          <div className="pc-tw"><table>
            <thead><tr><th>Curso</th><th>Estado</th><th className="n">Precio</th><th className="n">Lecciones</th><th className="n">Inscriptos</th><th className="n">Nuevos 30 d</th><th className="n">Activos 30 d</th><th className="n">Progreso medio</th><th className="n">Aprobados</th><th className="n">Certif.</th><th className="n">Ventas</th></tr></thead>
            <tbody>{a.cursos.map((c) => (
              <tr key={c.slug}>
                <td style={{ maxWidth: 380 }}><a href={`https://academia.devisebit.com/cursos/${c.slug}`} target="_blank" rel="noreferrer">{c.titulo}</a>{c.nuevo ? <span className="pc-tag" style={{ marginLeft: 6 }}>Nuevo</span> : null}{c.gratis_modulos > 0 ? <span className="pc-tag" style={{ marginLeft: 6 }}>Módulo 1 gratis</span> : null}<div className="pc-muted" style={{ fontSize: 11.5 }}>{[c.categoria, c.horas ? `${fmt(c.horas)} h` : null].filter(Boolean).join(" · ")}</div></td>
                <td className="pc-muted">{c.estado === "publicado" ? "Publicado" : "Borrador"}</td>
                <td className="n" style={{ whiteSpace: "nowrap" }}>{c.precio ? plata(c.precio) : "Gratis"}{c.precio_usd ? <div className="pc-muted" style={{ fontSize: 11 }}>USD {fmt(c.precio_usd)}</div> : null}</td>
                <td className="n">{fmt(c.lecciones)}</td><td className="n">{fmt(c.inscriptos)}</td><td className="n">{fmt(c.nuevos30)}</td><td className="n">{fmt(c.activos30)}</td>
                <td className="n">{c.progreso != null ? `${fmt(c.progreso)}%` : "—"}</td><td className="n">{fmt(c.aprobados)}</td><td className="n">{fmt(c.certificados)}</td>
                <td className="n">{fmt(c.ventas)}{c.ingresos ? <div className="pc-muted" style={{ fontSize: 11 }}>{plata(c.ingresos)}</div> : null}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="pc-empty">No hay cursos cargados.</div>}
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Programas ejecutivos</h2><span className="pc-k">próximamente · interesados</span></div>
          <div className="pc-list">{a.programas.map((p) => (
            <a key={p.slug} className="pc-item" href={`https://academia.devisebit.com/programas`} target="_blank" rel="noreferrer">
              <span className="t">{p.titulo}</span>
              <span className="m"><span>{p.tipo} · {p.inicio}</span><span><b>{fmt(p.interesados)}</b> en lista de espera</span></span>
            </a>
          ))}</div>
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Descargas y servicios</h2><span className="pc-k">academia.devisebit.com/descargas</span></div>
          {a.productos.length ? (
            <div className="pc-list">{a.productos.map((p) => (
              <a key={p.slug} className="pc-item" href={`https://academia.devisebit.com/productos/${p.slug}`} target="_blank" rel="noreferrer">
                <span className="t">{p.titulo}</span>
                <span className="m"><span>{ESTADO_PROD[p.estado] ?? p.estado}{p.servicio ? " · servicio" : ""}{p.precio ? ` · ${plata(p.precio)}` : ""}</span><span>{fmt(p.ventas)} ventas{p.ingresos ? ` · ${plata(p.ingresos)}` : ""}{p.pendientes ? ` · ${fmt(p.pendientes)} pendientes` : ""}</span></span>
              </a>
            ))}</div>
          ) : <div className="pc-empty">Sin productos a la venta.</div>}
        </div>
      </div>

      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Autodiagnóstico por nivel</h2></div>
          {a.diagnosticos.porNivel.length ? <Barras filas={a.diagnosticos.porNivel.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--info)" /> : <div className="pc-empty">Todavía no hay autodiagnósticos.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Actividad de alumnos</h2><span className="pc-k">30 días</span></div>
          {a.actividad30.length ? <Barras filas={a.actividad30.map((x) => ({ k: EVENTOS[x.tipo] ?? x.tipo, v: Number(x.c) }))} color="var(--ok)" /> : <div className="pc-empty">Sin actividad registrada en 30 días.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Videos</h2><span className="pc-k">canal ACADEMIA DEVISEBIT</span></div>
          {yt ? <div className="pc-mono" style={{ fontSize: 13 }}>{fmt(yt.videos)} videos ({fmt(yt.cortos)} cortos) · {fmt(yt.vistas)} vistas{yt.suscriptores != null ? ` · ${fmt(yt.suscriptores)} suscriptores` : ""}</div> : <div className="pc-empty">Sin datos del canal.</div>}
          {a.listaEspera.length ? <><div className="pc-k" style={{ margin: "12px 0 6px" }}>Listas de espera</div><Barras filas={a.listaEspera.slice(0, 6).map((x) => ({ k: x.tag.replace(/^espera-/, ""), v: x.c }))} color="var(--warn)" /></> : null}
        </div>
      </div>

      <div className="pc-card"><div className="pc-ch"><h2>Guías más leídas</h2><span className="pc-k">{fmt(a.guias.pub)} publicadas · {fmt(a.guias.excl)} exclusivas · {fmt(a.guias.borr)} borradores</span></div>
        {a.guias.top.length ? (
          <div className="pc-tw"><table><thead><tr><th>Guía</th><th>Categoría</th><th className="n">Lecturas</th></tr></thead>
            <tbody>{a.guias.top.map((g) => <tr key={g.slug}><td><a href={`https://academia.devisebit.com/guias/${g.slug}`} target="_blank" rel="noreferrer">{g.titulo}</a></td><td className="pc-muted">{g.categoria || "—"}</td><td className="n">{fmt(Number(g.vistas))}</td></tr>)}</tbody>
          </table></div>
        ) : <div className="pc-empty">Todavía no hay guías publicadas.</div>}
      </div>
    </>
  )
}
