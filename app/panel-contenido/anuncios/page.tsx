import { resumenAds } from "@/lib/ads"
import { safe } from "@/lib/panel"
import { acceso, Head, Kpi, Columnas, SinDatos, fmt, plata } from "../_ui"

export const dynamic = "force-dynamic"

export default async function Anuncios() {
  if (!(await acceso())) return null
  const a = await safe(resumenAds())
  if (!a) return (<><Head t="Anuncios" /><SinDatos>No se pudieron leer los datos de anuncios.</SinDatos></>)
  const hay = a.plataformas.some((p) => p.gasto > 0 || p.impresiones > 0)
  const dias = [...new Set(a.dias.map((d) => d.fecha))].map((f) => ({ k: f, v: a.dias.filter((d) => d.fecha === f).reduce((s, d) => s + Number(d.gasto), 0) }))
  return (
    <>
      <Head t="Anuncios" sub={`Google Ads y Meta Ads · últimos ${a.periodo}`} />
      {!hay && <SinDatos><b>Todavía no hay datos de anuncios en el sistema.</b> Cuando haya campañas sincronizadas (Meta Ads se trae solo cada mañana; Google Ads llega por su script), aparecen acá la inversión, los clics y las consultas que generaron.</SinDatos>}
      <div className="pc-grid pc-g2">
        {a.plataformas.map((p) => (
          <div key={p.plataforma} className="pc-card">
            <div className="pc-ch"><h2>{p.nombre}</h2><span className="pc-tag"><span className="pc-dot" style={{ background: p.conectada ? "var(--ok)" : "var(--muted)" }} />{p.conectada ? `Conectada${p.ultimaActualizacion ? ` · ${p.ultimaActualizacion}` : ""}` : "Sin conectar"}</span></div>
            {p.gasto > 0 || p.impresiones > 0 ? (
              <div className="pc-kpis">
                <Kpi k="Inversión" v={plata(p.gasto, p.moneda)} />
                <Kpi k="Impresiones" v={fmt(p.impresiones)} />
                <Kpi k="Clics" v={fmt(p.clics)} ft={p.ctr != null ? `CTR ${fmt(p.ctr, 1)}%` : ""} />
                <Kpi k="Costo por clic" v={p.cpc != null ? plata(p.cpc, p.moneda) : null} />
                <Kpi k="Consultas" v={fmt(p.consultas)} ft={`${fmt(p.consultasAtendidas)} atendidas · ${fmt(p.ventas)} ganadas`} color="var(--ok)" />
                <Kpi k="Costo por consulta" v={p.costoPorConsulta != null ? plata(p.costoPorConsulta, p.moneda) : null} />
              </div>
            ) : <div className="pc-empty">Sin inversión registrada en los últimos 30 días.</div>}
          </div>
        ))}
      </div>
      {hay && (
        <>
          <div className="pc-card"><div className="pc-ch"><h2>Inversión por día</h2></div><Columnas filas={dias} titulo="Inversión por día" /></div>
          <div className="pc-card"><div className="pc-ch"><h2>Campañas</h2></div>
            <div className="pc-tw"><table><thead><tr><th>Campaña</th><th>Plataforma</th><th className="n">Inversión</th><th className="n">Impresiones</th><th className="n">Clics</th><th className="n">Conversiones</th></tr></thead>
              <tbody>{a.campanias.map((c, i) => <tr key={i}><td>{c.campania}</td><td className="pc-muted">{c.plataforma === "google" ? "Google" : "Meta"}</td><td className="n">{plata(Number(c.gasto))}</td><td className="n">{fmt(Number(c.impresiones))}</td><td className="n">{fmt(Number(c.clics))}</td><td className="n">{fmt(Number(c.conversiones), 0)}</td></tr>)}</tbody>
            </table></div>
          </div>
        </>
      )}
      <p className="pc-sub">{a.nota}</p>
    </>
  )
}
