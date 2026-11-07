import { safe } from "@/lib/panel"
import { prospeccionPanel, CANAL_N, TIPO_N } from "@/lib/prospeccion"
import { acceso, Head, Sec, Kpi, Embudo, Barras, Columnas, SinDatos, fmt, fechaCorta, fechaHora } from "../_ui"

export const dynamic = "force-dynamic"

const pct = (a: number, b: number) => (b ? (100 * a) / b : null)
const P = (a: number, b: number) => { const v = pct(a, b); return v == null ? "—" : `${fmt(v, 0)}%` }
const ESTADO_N: Record<string, string> = { borrador: "Borrador", enviado: "Enviado", respondio: "Respondió", reunion: "Reunión", ganado: "Ganado", sin_respuesta: "Sin respuesta", descartado: "Descartado" }

export default async function Prospeccion() {
  if (!(await acceso())) return null
  const m = await safe(prospeccionPanel())
  if (!m) return (<><Head t="Prospección" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const E = m.E
  const reuniones = (E.reunion ?? 0) + (E.ganado ?? 0)
  return (
    <>
      <Head t="Prospección" sub="Mails, invitaciones de LinkedIn y postulaciones: cuántos salieron, cuántos respondieron y qué pasó con cada uno" />

      <div className="pc-kpis">
        <Kpi k="Enviados" v={fmt(m.salieron)} ft={`${fmt(m.total)} cargados · ${fmt(E.borrador ?? 0)} borradores esperan envío`} serie={m.semanas.map((s: any) => s.env)} />
        <Kpi k="Respondieron" v={fmt(m.respondieron)} ft={`${P(m.respondieron, m.salieron)} de los enviados${m.diasRespuesta != null ? ` · ${fmt(m.diasRespuesta, 1)} días promedio` : ""}`} serie={m.semanas.map((s: any) => s.resp)} color="var(--ok)" />
        <Kpi k="Reuniones" v={fmt(reuniones)} ft={`${P(reuniones, m.salieron)} de los enviados · ${fmt(E.ganado ?? 0)} ganados`} color="var(--info)" />
        <Kpi k="Seguimientos vencidos" v={fmt(m.vencidos.length)} ft={m.vencidos.length ? "Enviados hace 7 días o más sin respuesta" : "Al día"} color="var(--warn)" href="https://sistema.devisebit.com/prospeccion" />
        <Kpi k="Sin respuesta" v={fmt(E.sin_respuesta ?? 0)} ft="Cerrados después del seguimiento" />
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Embudo</h2><span className="pc-k">todas las campañas</span></div>
          <Embudo pasos={[
            { k: "Preparados", v: m.total - (E.descartado ?? 0) },
            { k: "Enviados", v: m.salieron },
            { k: "Respondieron", v: m.respondieron, nota: P(m.respondieron, m.salieron) },
            { k: "Reunión", v: reuniones, nota: P(reuniones, m.respondieron) },
            { k: "Ganados", v: E.ganado ?? 0 },
          ]} />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Enviados por semana</h2><span className="pc-k">últimas 12 semanas</span></div>
          {m.semanas.length ? <Columnas filas={m.semanas.map((s: any) => ({ k: s.s, v: s.env }))} titulo="Enviados por semana" /> : <div className="pc-empty">Todavía no salió ningún envío registrado.</div>}
        </div>
      </div>

      <Sec t="Por canal y por tipo" />
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Respuesta por canal</h2><span className="pc-k">respondieron · enviados</span></div>
          <Barras filas={m.porCanal.map((c: any) => ({ k: CANAL_N[c.canal] ?? c.canal, v: c.salieron, t: `${fmt(c.respondieron)} de ${fmt(c.salieron)} · ${P(c.respondieron, c.salieron)}${c.borradores ? ` · ${fmt(c.borradores)} en borrador` : ""}` }))} />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Por objetivo</h2><span className="pc-k">contactos · respondieron</span></div>
          <Barras filas={m.porTipo.map((t: any) => ({ k: TIPO_N[t.tipo] ?? t.tipo, v: t.n, t: `${fmt(t.n)} · ${fmt(t.r)} respondieron` }))} color="var(--violet)" />
        </div>
      </div>

      <Sec t="Campañas" />
      <div className="pc-card">
        {m.porCampania.length ? (
          <div className="pc-tw"><table><thead><tr><th>Campaña</th><th>Objetivo</th><th className="n">Cargados</th><th className="n">Borradores</th><th className="n">Enviados</th><th className="n">Respondieron</th><th className="n">Reuniones</th><th className="n">Días a respuesta</th><th>Último movimiento</th></tr></thead>
            <tbody>{m.porCampania.map((c: any) => (
              <tr key={c.campania}>
                <td>{c.campania}</td><td>{TIPO_N[c.tipo] ?? c.tipo}</td>
                <td className="n">{fmt(c.total)}</td><td className="n">{fmt(c.borradores)}</td><td className="n">{fmt(c.enviados)}</td>
                <td className="n">{c.enviados ? `${fmt(c.respondieron)} · ${P(c.respondieron, c.enviados)}` : "—"}</td>
                <td className="n">{fmt(c.reuniones)}</td><td className="n">{c.dias_respuesta != null ? fmt(c.dias_respuesta, 1) : "—"}</td>
                <td>{c.ultimo ? fechaCorta(c.ultimo) : "—"}</td>
              </tr>
            ))}</tbody></table></div>
        ) : <div className="pc-empty">Todavía no hay campañas cargadas. Se cargan en sistema.devisebit.com → Prospección o por la API.</div>}
      </div>

      <Sec t="Trazabilidad" />
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Últimos movimientos</h2><span className="pc-k">qué pasó y cuándo</span></div>
          {m.eventos.length ? (
            <div className="pc-tw"><table><thead><tr><th>Cuándo</th><th>Contacto</th><th>Qué pasó</th></tr></thead>
              <tbody>{m.eventos.map((e: any, i: number) => (
                <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{fechaHora(e.fecha)}</td>
                  <td>{e.organizacion}<div className="pc-muted" style={{ fontSize: 11.5 }}>{CANAL_N[e.canal] ?? e.canal} · {e.campania}</div></td>
                  <td>{e.detalle ?? e.tipo}{e.por ? <div className="pc-muted" style={{ fontSize: 11.5 }}>{e.por}</div> : null}</td></tr>
              ))}</tbody></table></div>
          ) : <div className="pc-empty">Sin movimientos todavía.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguimientos para hacer</h2><span className="pc-k">enviados sin respuesta</span></div>
          {m.vencidos.length ? (
            <div className="pc-tw"><table><thead><tr><th>Contacto</th><th>Canal</th><th>Desde</th></tr></thead>
              <tbody>{m.vencidos.map((v: any) => (
                <tr key={v.id}><td>{v.organizacion}<div className="pc-muted" style={{ fontSize: 11.5 }}>{v.campania}</div></td><td>{CANAL_N[v.canal] ?? v.canal}</td><td>{fechaCorta(v.seguimiento)}</td></tr>
              ))}</tbody></table></div>
          ) : <div className="pc-empty">Nada vencido: ningún envío lleva 7 días sin respuesta.</div>}
          <div className="pc-muted" style={{ fontSize: 12, marginTop: 10 }}>Estados: {Object.entries(E).map(([k, v]) => `${ESTADO_N[k] ?? k} ${v}`).join(" · ") || "—"}</div>
        </div>
      </div>

      <SinDatos>
        <b>Cómo se arma.</b> Cada contacto entra como <b>Borrador</b> cuando se prepara (en Gmail o en la Bandeja de LinkedIn). Al salir pasa a <b>Enviado</b> y el seguimiento se agenda solo a los 7 días; si contestan, <b>Respondió</b>, y después <b>Reunión</b> o <b>Ganado</b>. Cada cambio queda en la historia con fecha y quién lo hizo. LinkedIn lo envía siempre Julio a mano: acá solo se registra.
      </SinDatos>
    </>
  )
}
