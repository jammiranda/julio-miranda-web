import { panelWeb, panelMetricas, safe } from "@/lib/panel"
import { q } from "@/lib/db"
import { acceso, Head, Sec, Kpi, Barras, Columnas, SinDatos, fmt, fechaCorta } from "../_ui"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DISP: Record<string, string> = { movil: "Celular", mobile: "Celular", escritorio: "Computadora", desktop: "Computadora", tablet: "Tablet" }

export default async function Web() {
  if (!(await acceso())) return null
  const [w, m, blog] = await Promise.all([
    safe(panelWeb()),
    safe(panelMetricas()),
    // Visitas del blog: por nota (total y últimos 30 días) y la portada de Novedades
    safe(q<{ path: string; total: number; d30: number }>(`select path, sum(n)::int total, coalesce(sum(n) filter (where dia > current_date - 30),0)::int d30 from pv_visitas where host='www.devisebit.com' and (path='/novedades' or path like '/novedades/%') group by path`)),
  ])
  const visNota = new Map((blog ?? []).map((r) => [r.path.replace(/\/$/, ""), r]))
  const blogTotal = (blog ?? []).reduce((a, r) => a + Number(r.total), 0)
  const blog30 = (blog ?? []).reduce((a, r) => a + Number(r.d30), 0)
  const v = m?.visitas
  const dias = (v?.dias ?? []).map((d) => ({ k: d.dia, v: Number(d.c) }))
  const total = dias.reduce((a, x) => a + x.v, 0)
  const ok = w?.sitios.filter((s) => s.ok).length ?? 0
  return (
    <>
      <Head t="Web" sub="Estado de los sitios, notas del blog y visitas registradas por el sistema" />
      <div className="pc-kpis">
        <Kpi k="Sitios en línea" v={w ? `${ok}/${w.sitios.length}` : null} ft={w ? (ok === w.sitios.length ? "Todos responden" : "Hay sitios con problemas") : ""} color="var(--ok)" />
        <Kpi k="Visitas (30 días)" v={dias.length ? fmt(total) : null} serie={dias.map((d) => d.v)} color="var(--info)" ft={dias.length ? `${fmt(total / dias.length, 1)} por día` : "Sin visitas registradas"} />
        <Kpi k="Notas en el blog" v={w ? fmt(w.novedades.total) : null} ft={w ? `${fmt(w.novedades.ultimos30)} en los últimos 30 días` : ""} />
        <Kpi k="Visitas al blog" v={blog ? fmt(blogTotal) : null} ft={blog ? `${fmt(blog30)} en los últimos 30 días · portada ${fmt(Number(visNota.get("/novedades")?.total ?? 0))}` : "Sin visitas registradas"} color="var(--info)" />
        <Kpi k="Tiempo de respuesta" v={w ? `${fmt(w.sitios.reduce((a, s) => a + s.ms, 0) / w.sitios.length)} ms` : null} ft="Promedio de los sitios, medido ahora" />
      </div>

      <div className="pc-card"><div className="pc-ch"><h2>Sitios</h2><span className="pc-k">medido al abrir esta página</span></div>
        {w ? (
          <div className="pc-tw"><table><thead><tr><th>Sitio</th><th>Estado</th><th className="n">Respuesta</th><th className="n">Peso</th></tr></thead>
            <tbody>{w.sitios.map((s) => <tr key={s.id}><td><a href={s.url} target="_blank" rel="noreferrer">{s.nombre}</a></td><td><span className="pc-tag"><span className="pc-dot" style={{ background: s.ok ? "var(--ok)" : "var(--red)" }} />{s.ok ? "En línea" : s.status ? `Error ${s.status}` : "Sin respuesta"}</span></td><td className="n">{fmt(s.ms)} ms</td><td className="n">{fmt(s.kb)} KB</td></tr>)}</tbody>
          </table></div>
        ) : <div className="pc-empty">No se pudieron medir los sitios.</div>}
      </div>

      <Sec t="Visitas" />
      <div className="pc-card"><div className="pc-ch"><h2>Visitas por día</h2><span className="pc-k">30 días</span></div>
        {dias.length ? <Columnas filas={dias} titulo="Visitas por día" color="var(--info)" /> : <div className="pc-empty">Todavía no hay visitas registradas por el contador del sistema.</div>}
      </div>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Por sitio</h2><span className="pc-k">30 días</span></div><Barras filas={(v?.sitios ?? []).map((s) => ({ k: s.host, v: Number(s.d30) }))} color="var(--info)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>De dónde llegan</h2><span className="pc-k">30 días</span></div><Barras filas={(v?.origenes ?? []).map((s) => ({ k: s.ref, v: Number(s.c) }))} color="var(--violet)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>Dispositivos</h2><span className="pc-k">30 días</span></div><Barras filas={Object.entries(v?.dispositivos ?? {}).map(([k, c]) => ({ k: DISP[k] ?? k, v: Number(c ?? 0) }))} color="var(--ok)" /></div>
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Páginas más vistas</h2><span className="pc-k">30 días</span></div>
        {v?.paginas.length ? (
          <div className="pc-tw"><table><thead><tr><th>Página</th><th className="n">Visitas</th></tr></thead>
            <tbody>{v.paginas.map((p) => <tr key={p.host + p.path}><td style={{ overflowWrap: "anywhere" }}><span className="pc-muted">{p.host}</span>{p.path}</td><td className="n">{fmt(Number(p.c))}</td></tr>)}</tbody></table></div>
        ) : <div className="pc-empty">Sin visitas registradas.</div>}
      </div>

      <Sec t="Blog · Novedades" />
      {w?.novedades.notas.length ? (
        <div className="pc-grid pc-g2">
          {w.novedades.notas.map((n) => (
            <a key={n.slug} className="pc-item" href={n.url} target="_blank" rel="noreferrer">
              <span className="t">{n.titulo}</span>
              {n.resumen && <span className="pc-muted" style={{ fontSize: 12.5 }}>{n.resumen.slice(0, 160)}</span>}
              <span className="m"><span>{n.categoria || "Nota"}</span><span>{fmt(Number(visNota.get("/novedades/" + n.slug)?.total ?? 0))} visitas · {fmt(Number(visNota.get("/novedades/" + n.slug)?.d30 ?? 0))} en 30 días</span><span>{n.fecha ? fechaCorta(n.fecha) : ""}</span></span>
            </a>
          ))}
        </div>
      ) : <SinDatos>No se encontraron notas en devisebit.com/novedades.</SinDatos>}
      <p className="pc-sub">Las visitas del blog se cuentan desde el 28/10/2026, cuando se activó el contador propio en devisebit.com (sin cookies ni datos personales).</p>
    </>
  )
}
