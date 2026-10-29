import { safe } from "@/lib/panel"
import { emailPanel } from "@/lib/panel-email"
import { acceso, Head, Sec, Kpi, Barras, Columnas, SinDatos, fmt, fechaHora } from "../_ui"

export const dynamic = "force-dynamic"

const EST: Record<string, string> = { borrador: "Borrador", enviando: "Enviando", pausada: "Pausada", enviada: "Terminada" }
const pct = (a: number, b: number) => (b ? (100 * a) / b : null)
const P = (a: number, b: number) => { const v = pct(a, b); return v == null ? "—" : `${fmt(v, 1)}%` }
const FRANJAS: [number, number, string][] = [[0, 7, "Madrugada (0–7)"], [7, 10, "Temprano (7–10)"], [10, 13, "Mañana (10–13)"], [13, 16, "Siesta (13–16)"], [16, 19, "Tarde (16–19)"], [19, 24, "Noche (19–24)"]]

export default async function Email({ searchParams }: { searchParams: { d?: string } }) {
  if (!(await acceso())) return null
  const dias = [7, 30, 90].includes(Number(searchParams.d)) ? Number(searchParams.d) : 30
  const m = await safe(emailPanel(dias))
  if (!m) return (<><Head t="Email" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const t = m.tot ?? {}
  const env = t.enviados ?? 0
  const diasRestantes = m.cola ? Math.ceil(m.cola / m.limite) : 0
  return (
    <>
      <Head t="Email" sub={`Campañas enviadas desde el sistema por Brevo · últimos ${dias} días`}>
        {[7, 30, 90].map((d) => <a key={d} href={`?d=${d}`} className={`pc-btn ${d === dias ? "pri" : ""}`}>{d} días</a>)}
      </Head>

      <div className="pc-kpis">
        <Kpi k="Enviados" v={fmt(env)} ft={`${fmt(m.hoy)} hoy · máximo ${fmt(m.limite)} por día`} serie={m.porDia.map((x) => x.env)} />
        <Kpi k="Tasa de apertura" v={env ? `${fmt(pct(t.abiertos, env), 1)}%` : null} ft={`${fmt(t.abiertos)} personas abrieron`} serie={m.porDia.map((x) => x.ab)} color="var(--ok)" />
        <Kpi k="Tasa de clics" v={env ? `${fmt(pct(t.clics, env), 1)}%` : null} ft={`${fmt(t.clics)} personas · ${t.abiertos ? `${fmt(pct(t.clics, t.abiertos), 1)}% de quienes abrieron` : ""}`} serie={m.porDia.map((x) => x.cl)} color="var(--info)" />
        <Kpi k="Bajas" v={env ? fmt(t.bajas) : null} ft={env ? `${P(t.bajas, env)} de los enviados` : ""} color="var(--warn)" />
        <Kpi k="Rebotes y spam" v={m.webhook ? fmt((t.rebotes ?? 0) + (t.spam ?? 0)) : "—"} ft={m.webhook ? `${fmt(t.rebotes)} rebotes · ${fmt(t.spam)} marcados como spam${t.entregados ? ` · ${fmt(t.entregados)} entregados` : ""}` : "Falta conectar el aviso de Brevo"} color="var(--warn)" />
        <Kpi k="En cola" v={fmt(m.cola)} ft={m.cola ? `≈ ${diasRestantes} día${diasRestantes === 1 ? "" : "s"} más, a ${fmt(m.limite)} por día` : "Nada pendiente"} />
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Enviados por día</h2><span className="pc-k">{dias} días</span></div>
          <Columnas filas={m.porDia.map((x) => ({ k: x.d, v: x.env }))} titulo="Correos enviados por día" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Aperturas por día</h2><span className="pc-k">primera apertura</span></div>
          <Columnas filas={m.porDia.map((x) => ({ k: x.d, v: x.ab }))} color="var(--ok)" titulo="Aperturas por día" />
        </div>
      </div>

      <Sec t="Qué les interesa" />
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Clics por destino</h2><span className="pc-k">personas</span></div>
          <Barras filas={m.links.slice(0, 10).map((l) => ({ k: l.k, v: l.personas, t: `${fmt(l.personas)} · ${fmt(l.n)} clics` }))} color="var(--info)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Respuesta por lista</h2><span className="pc-k">apertura · clic</span></div>
          <Barras filas={m.porLista.map((l) => ({ k: l.k, v: pct(l.ab, l.env) ?? 0, t: `${P(l.ab, l.env)} · ${P(l.cl, l.env)} (${fmt(l.env)})` }))} color="var(--ok)" />
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>A qué hora abren</h2><span className="pc-k">hora de Argentina</span></div>
          <Barras filas={FRANJAS.map(([a, b, k]) => ({ k, v: m.porHora.filter((x) => x.h >= a && x.h < b).reduce((s, x) => s + x.n, 0) }))} color="var(--violet)" />
        </div>
      </div>

      <Sec t="Campañas" />
      <div className="pc-card">
        {m.campanias.length ? (
          <div className="pc-tw"><table><thead><tr><th>Campaña</th><th>Estado</th><th className="n">Destinatarios</th><th className="n">Enviados</th><th className="n">En cola</th><th className="n">Abrieron</th><th className="n">Clics</th><th className="n">Bajas</th><th className="n">Rebotes</th></tr></thead>
            <tbody>{m.campanias.map((k: any) => (
              <tr key={k.id}>
                <td>{k.asunto}<div className="pc-muted" style={{ fontSize: 11.5 }}>{k.lanzada ? `Lanzada ${fechaHora(k.lanzada)}` : "Sin lanzar"}</div></td>
                <td>{EST[k.estado] ?? k.estado}</td>
                <td className="n">{fmt(k.total)}</td><td className="n">{fmt(k.enviados)}</td><td className="n">{fmt(k.pendientes)}</td>
                <td className="n">{k.enviados ? `${fmt(k.abiertos)} · ${P(k.abiertos, k.enviados)}` : "—"}</td>
                <td className="n">{k.enviados ? `${fmt(k.clics)} · ${P(k.clics, k.enviados)}` : "—"}</td>
                <td className="n">{fmt(k.bajas)}</td><td className="n">{m.webhook ? fmt(k.rebotes) : "—"}</td>
              </tr>
            ))}</tbody></table></div>
        ) : <div className="pc-empty">Todavía no se lanzó ninguna campaña. Se arman y se envían en sistema.devisebit.com → Envíos de email.</div>}
      </div>

      <Sec t="Base de contactos" />
      <div className="pc-kpis">
        <Kpi k="Pueden recibir envíos" v={fmt(m.base?.enviables)} ft="Con email activo y en una lista" color="var(--ok)" />
        <Kpi k="Por clasificar" v={fmt(m.base?.sin_lista)} ft="Con email, pero sin lista: no reciben nada hasta ubicarlos" color="var(--warn)" />
        <Kpi k="Dados de baja" v={fmt(m.base?.bajas)} ft="Nunca más reciben campañas" />
        <Kpi k="Rebotados" v={fmt(m.base?.rebotados)} ft="Email inexistente o bloqueado: se excluyen solos" />
      </div>

      <SinDatos>
        <b>Cómo leer estos números.</b> Una apertura se cuenta cuando el correo carga sus imágenes: algunos programas (Apple Mail) las cargan solos y otros (Outlook) las bloquean, así que la tasa de apertura es orientativa. Los <b>clics</b> son el dato fino: muestran qué landing atrajo a cada persona.
        {!m.webhook && <> Para ver <b>entregas, rebotes y spam</b> hay que conectar el aviso (webhook) de Brevo con la clave <b>BREVO_WEBHOOK_KEY</b>.</>}
      </SinDatos>
    </>
  )
}
