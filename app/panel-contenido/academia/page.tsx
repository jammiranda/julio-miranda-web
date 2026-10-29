import { panelMetricas, safe } from "@/lib/panel"
import { acceso, Head, Kpi, Barras, SinDatos, fmt, plata } from "../_ui"

export const dynamic = "force-dynamic"

const PROD: Record<string, string> = { venta: "A la venta", lista_espera: "Lista de espera", oculto: "Ocultos" }

export default async function Academia() {
  if (!(await acceso())) return null
  const m = await safe(panelMetricas())
  if (!m) return (<><Head t="Academia" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const a = m.academia, s = a.suscriptores, us = m.usuarios.academia
  return (
    <>
      <Head t="Academia" sub="ACADEMIA DEVISEBIT: suscriptores, guías, cursos y ventas">
        <a className="pc-btn" href="https://academia.devisebit.com" target="_blank" rel="noreferrer">Abrir la Academia</a>
      </Head>
      <div className="pc-kpis">
        <Kpi k="Suscriptores activos" v={fmt(s?.act)} ft={s ? `${fmt(s.d7)} en 7 días · ${fmt(s.d30)} en 30` : ""} color="var(--ok)" />
        <Kpi k="Bajas de la lista" v={fmt(s?.bajas)} ft="Pidieron no recibir más correos" />
        <Kpi k="Alumnos en cursos" v={fmt(us?.alumnos)} ft={us ? `${fmt(us.alumnosActivos30)} con actividad en 30 días` : ""} />
        <Kpi k="Certificados emitidos" v={fmt(us?.certificados)} ft="Vigentes" />
        <Kpi k="Ventas (total)" v={fmt(a.ventasTotales)} ft={a.ordenesPendientes30 != null ? `${fmt(a.ordenesPendientes30)} órdenes pendientes en 30 días` : ""} color="var(--warn)" />
        <Kpi k="Guías publicadas" v={fmt(a.guias.publicadas)} ft={a.guias.vistas != null ? `${fmt(a.guias.vistas)} vistas · ${fmt(a.guias.borradores)} borradores` : ""} color="var(--info)" />
      </div>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Intereses de los suscriptores</h2></div>
          <Barras filas={a.tags.map((t) => ({ k: t.k, v: Number(t.c) }))} color="var(--ok)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Productos</h2></div>
          {Object.keys(a.productos).length ? <Barras filas={Object.entries(PROD).map(([k, t]) => ({ k: t, v: Number(a.productos[k] ?? 0) }))} color="var(--info)" /> : <div className="pc-empty">Sin productos cargados.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Ventas · 30 días</h2></div>
          {a.ventas30.length ? (
            <div className="pc-list">{a.ventas30.map((v) => <div key={v.moneda} className="pc-item"><span className="t pc-mono">{plata(Number(v.monto), v.moneda)}</span><span className="m"><span>{fmt(Number(v.c))} órdenes pagadas</span><span>{v.moneda}</span></span></div>)}</div>
          ) : <div className="pc-empty">No hubo ventas pagadas en los últimos 30 días.</div>}
        </div>
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Guías más leídas</h2><span className="pc-k">vistas acumuladas</span></div>
        {a.guias.top.length ? (
          <div className="pc-tw"><table><thead><tr><th>Guía</th><th>Categoría</th><th className="n">Vistas</th></tr></thead>
            <tbody>{a.guias.top.map((g) => <tr key={g.slug}><td><a href={`https://academia.devisebit.com/guias/${g.slug}`} target="_blank" rel="noreferrer">{g.titulo}</a></td><td className="pc-muted">{g.categoria || "—"}</td><td className="n">{fmt(Number(g.vistas))}</td></tr>)}</tbody>
          </table></div>
        ) : <div className="pc-empty">Todavía no hay guías publicadas.</div>}
      </div>
    </>
  )
}
