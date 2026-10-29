import { panelMetricas, safe } from "@/lib/panel"
import { acceso, Head, Sec, Kpi, Delta, Barras, SinDatos, fmt, plata } from "../_ui"

export const dynamic = "force-dynamic"

const ESTADOS: Record<string, string> = { nueva: "Nuevas", contactada: "Contactadas", calificada: "Calificadas", convertida: "Ganadas", descartada: "Descartadas" }
const PROY: Record<string, string> = { planificado: "Planificado", en_curso: "En curso", pausado: "Pausado", terminado: "Terminado", cancelado: "Cancelado" }
const ETAPAS: Record<string, string> = { nuevo: "Nuevo", conversando: "Conversando", reunion: "Reunión", propuesta: "Propuesta", ganado: "Ganado", perdido: "Perdido" }
const nombre = (s: string) => s.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase())

export default async function Crm() {
  if (!(await acceso())) return null
  const m = await safe(panelMetricas())
  if (!m) return (<><Head t="CRM y ventas" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const { consultas: c, contactos, proyectos, reuniones, whatsapp: wa, email } = m.crm
  const proy = Object.entries(proyectos.porEstado)
  const enCurso = proy.filter(([k]) => ["planificado", "en_curso"].includes(k)).reduce((a, [, v]) => a + (v.c ?? 0), 0)
  return (
    <>
      <Head t="CRM y ventas" sub="Consultas, contactos, proyectos, reuniones y WhatsApp del sistema comercial" />
      <div className="pc-kpis">
        <Kpi k="Consultas (30 días)" v={fmt(c.d30)} delta={<Delta v={c.d30 != null && c.p30 != null ? c.d30 - c.p30 : null} />} ft={`${fmt(c.d7)} en 7 días · ${fmt(c.p30)} los 30 anteriores`} />
        <Kpi k="Esperan una persona" v={fmt(c.esperanHumano)} ft="Consultas abiertas que pidió atender un humano" />
        <Kpi k="Conversión (90 días)" v={c.conversion90 != null ? `${fmt(c.conversion90, 1)}%` : null} ft={c.total90 != null ? `sobre ${fmt(c.total90)} consultas` : ""} color="var(--ok)" />
        <Kpi k="Contactos" v={fmt(contactos.total)} ft={contactos.nuevos30 != null ? `${fmt(contactos.nuevos30)} nuevos en 30 días` : ""} />
        <Kpi k="Proyectos activos" v={fmt(enCurso)} ft={proyectos.entregas14 != null ? `${fmt(proyectos.entregas14)} entregas en 14 días` : ""} />
        <Kpi k="Chats de WhatsApp (30 días)" v={fmt(wa.chats30)} ft={`${fmt(wa.chats7)} en 7 días${wa.horasUltimaRespuestaBot != null ? ` · el bot respondió hace ${fmt(wa.horasUltimaRespuestaBot)} h` : ""}`} color="var(--ok)" />
      </div>

      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por estado</h2><span className="pc-k">histórico</span></div>
          {Object.keys(c.porEstado).length ? <Barras filas={Object.entries(ESTADOS).map(([k, t]) => ({ k: t, v: Number(c.porEstado[k] ?? 0) }))} /> : <div className="pc-empty">Sin consultas registradas.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Por canal</h2><span className="pc-k">30 días</span></div>
          <Barras filas={c.porCanal.map((x) => ({ k: nombre(x.k), v: Number(x.c) }))} color="var(--info)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Por fuente</h2><span className="pc-k">30 días</span></div>
          <Barras filas={c.porFuente.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--violet)" />
        </div>
      </div>

      <Sec t="Clientes y proyectos" />
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Contactos por etapa</h2></div>
          {Object.keys(contactos.porEtapa).length ? <Barras filas={Object.entries(ETAPAS).map(([k, t]) => ({ k: t, v: Number(contactos.porEtapa[k] ?? 0) }))} color="var(--ok)" /> : <div className="pc-empty">Sin contactos cargados.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Proyectos por estado</h2></div>
          {proy.length ? (
            <div className="pc-tw"><table><thead><tr><th>Estado</th><th className="n">Cantidad</th><th className="n">Monto</th></tr></thead>
              <tbody>{proy.sort((a, b) => (b[1].c ?? 0) - (a[1].c ?? 0)).map(([k, v]) => <tr key={k}><td>{PROY[k] ?? nombre(k)}</td><td className="n">{fmt(v.c)}</td><td className="n">{plata(v.monto)}</td></tr>)}</tbody>
            </table></div>
          ) : <div className="pc-empty">Sin proyectos cargados.</div>}
        </div>
      </div>

      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Reuniones</h2></div>
          <Barras filas={[{ k: "Próximas 7 días", v: reuniones.proximas7 ?? 0 }, { k: "Realizadas (30 d)", v: reuniones.realizadas30 ?? 0 }, { k: "Caídas (30 d)", v: reuniones.caidas30 ?? 0 }]} color="var(--info)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>WhatsApp · mensajes 7 días</h2></div>
          <Barras filas={Object.entries(wa.mensajes7).map(([k, v]) => ({ k: k === "cliente" ? "Clientes" : k === "bot" ? "Bot" : nombre(k), v: Number(v ?? 0) }))} color="var(--ok)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Email · 30 días</h2></div>
          {email && email.env ? (
            <Barras filas={[{ k: "Enviados", v: email.env }, { k: "Abiertos", v: email.abiertos, t: `${fmt(email.abiertos)} · ${fmt((email.abiertos / email.env) * 100, 1)}%` }, { k: "Con clic", v: email.clics, t: `${fmt(email.clics)} · ${fmt((email.clics / email.env) * 100, 1)}%` }]} color="var(--warn)" />
          ) : <div className="pc-empty">No hubo envíos de campañas en los últimos 30 días.</div>}
        </div>
      </div>
    </>
  )
}
