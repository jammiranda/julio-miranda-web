import { resumenAds } from "@/lib/ads"
import { seguimientos } from "@/lib/ads-seguimiento"
import { safe } from "@/lib/panel"
import { acceso, Head, Kpi, Columnas, SinDatos, fmt, plata, fechaCorta, fechaHora } from "../_ui"
import Anotar from "./_anotar"

const TIPO_B: Record<string, string> = { control: "Control", decision: "Decisión", nota: "Nota" }

async function Seguimiento() {
  const lista = await safe(seguimientos())
  if (!lista?.length) return null
  return (
    <>
      {lista.map((c) => (
        <div key={c.campania_id} className="pc-card">
          <div className="pc-ch">
            <h2>{c.nombre}</h2>
            <span className="pc-tag"><span className="pc-dot" style={{ background: c.estado === "activa" ? "var(--ok)" : "var(--muted)" }} />{c.estado === "activa" ? "Activa" : c.estado}{c.diasTotal ? ` · día ${Math.min(c.diasCorridos ?? 0, c.diasTotal)} de ${c.diasTotal}` : ""}</span>
          </div>
          <p className="pc-sub" style={{ marginTop: 0 }}>
            {c.plataforma === "meta" ? "Meta Ads" : "Google Ads"}{c.objetivo ? ` · ${c.objetivo}` : ""}
            {c.presupuesto_diario != null ? ` · ${plata(Number(c.presupuesto_diario), c.moneda)} por día` : ""}
            {c.presupuestoTotal != null ? ` (≈ ${plata(c.presupuestoTotal, c.moneda)} en total)` : ""}
            {c.inicio ? ` · del ${fechaCorta(c.inicio)}` : ""}{c.fin ? ` al ${fechaCorta(c.fin)}` : ""}
          </p>
          <div className="pc-kpis">
            <Kpi k="Invertido" v={c.gasto != null ? plata(c.gasto, c.moneda) : null} ft={c.presupuestoTotal ? `de ${plata(c.presupuestoTotal, c.moneda)}` : ""} />
            <Kpi k="Alcance" v={c.alcance != null ? fmt(c.alcance) : null} ft={c.impresiones != null ? `${fmt(c.impresiones)} impresiones${c.frecuencia ? ` · frec. ${fmt(c.frecuencia, 1)}` : ""}` : ""} />
            <Kpi k="Visitas al perfil" v={c.resultados != null ? fmt(c.resultados) : null} ft={c.costoResultado != null ? `${plata(c.costoResultado, c.moneda)} c/u` : ""} />
            <Kpi k="Seguidores nuevos" v={c.nuevosSeguidores != null ? fmt(c.nuevosSeguidores) : null} ft={c.seguidoresHoy != null ? `${fmt(c.seguidoresHoy)} hoy · ${c.costoSeguidor != null ? `${plata(c.costoSeguidor, c.moneda)} c/u` : "desde el inicio"}` : ""} color="var(--ok)" />
            {c.base_palabra && <Kpi k={`Pedidos ${c.base_palabra}`} v={c.pedidosPalabra != null ? fmt(c.pedidosPalabra) : null} ft="por DM desde el inicio" color="var(--ok)" />}
          </div>
          {(c.publico || c.anuncios || c.meta) && (
            <div className="pc-list" style={{ marginTop: 10 }}>
              {c.publico && <div className="pc-item"><span className="pc-k">Público</span><span>{c.publico}</span></div>}
              {c.anuncios && <div className="pc-item"><span className="pc-k">Anuncios</span><span style={{ whiteSpace: "pre-line" }}>{c.anuncios}</span></div>}
              {c.meta && <div className="pc-item"><span className="pc-k">Qué buscamos</span><span>{c.meta}</span></div>}
            </div>
          )}
          {c.porAnuncio.length > 0 && (
            <div className="pc-tw" style={{ marginTop: 10 }}><table><thead><tr><th>Anuncio</th><th className="n">Invertido</th><th className="n">Impresiones</th><th className="n">Visitas al perfil</th></tr></thead>
              <tbody>{c.porAnuncio.map((a, i) => <tr key={i}><td>{a.nombre}</td><td className="n">{a.gasto != null ? plata(a.gasto, c.moneda) : "—"}</td><td className="n">{fmt(a.impresiones)}</td><td className="n">{fmt(a.resultados)}</td></tr>)}</tbody>
            </table></div>
          )}
          <h3 style={{ margin: "14px 0 6px", fontSize: 13 }}>Bitácora{c.ultimoControl ? <span className="pc-muted" style={{ fontWeight: 400 }}> · último control {fechaHora(c.ultimoControl)}</span> : null}</h3>
          <div className="pc-list">
            {[...c.bitacora].reverse().slice(0, 15).map((b, i) => (
              <div key={i} className="pc-item">
                <span className="pc-row" style={{ justifyContent: "space-between" }}><span className="pc-tag">{TIPO_B[b.tipo] ?? b.tipo}</span><span className="pc-muted" style={{ fontSize: 11.5 }}>{fechaHora(b.fecha)} · {b.por}</span></span>
                <span style={{ whiteSpace: "pre-line" }}>{b.texto}</span>
              </div>
            ))}
            {!c.bitacora.length && <div className="pc-empty">Todavía no hay controles ni decisiones.</div>}
          </div>
          <Anotar campaniaId={c.campania_id} />
        </div>
      ))}
    </>
  )
}

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
      <Seguimiento />
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
