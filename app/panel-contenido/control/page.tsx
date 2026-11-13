import Link from "next/link"
import { soloJulio } from "@/lib/oficina"
import { cortes, diaValido } from "@/lib/control"
import { Head, Sec, SinDatos, NoPermiso, fechaHora } from "../_ui"
import { Marco } from "./_marco"

export const dynamic = "force-dynamic"
export const metadata = { title: "Control mensual · DEVISEBIT" }

const SEM = { verde: ["🟢", "Vamos bien"], amarillo: ["🟡", "Hay cosas para mirar"], rojo: ["🔴", "Hay algo urgente"] } as const
const fecha = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
const archivo = (dia: string, t: "pdf" | "info", bajar = false) => `/api/panel/control/archivo?dia=${dia}&t=${t}${bajar ? "&bajar=1" : ""}`
const nombre = (c: { numero: number; titulo: string }) => c.titulo || (c.numero ? `Corte n.º ${c.numero}` : "Avance")

export default async function Control({ searchParams }: { searchParams: { dia?: string } }) {
  if (!(await soloJulio())) return <NoPermiso />
  const todos = await cortes()
  const c = (diaValido(searchParams.dia) && todos.find((x) => x.dia === searchParams.dia)) || todos[0] || null

  return (
    <>
      <Head t="Control mensual" sub="Un corte el último día hábil de cada mes: el PDF y la infografía, con el historial de cortes">
        {c?.tiene_pdf && <a className="tb-pill on" href={archivo(c.dia, "pdf")} target="_blank" rel="noreferrer">Abrir el PDF</a>}
        {c?.tiene_pdf && <a className="tb-pill" href={archivo(c.dia, "pdf", true)}>Descargar el PDF</a>}
        {c?.tiene_info && <a className="tb-pill" href={archivo(c.dia, "info")} target="_blank" rel="noreferrer">Infografía en pestaña nueva</a>}
      </Head>

      {!c ? (
        <SinDatos>Todavía no hay ningún corte cargado. El primero sale el último día hábil del mes, a la noche, y aparece acá solo.</SinDatos>
      ) : (
        <>
          <div className="tb-dias" aria-label="Cortes">
            {todos.slice(0, 14).map((x) => (
              <Link key={x.dia} href={`?dia=${x.dia}`} className={`tb-pill${x.dia === c.dia ? " on" : ""}`}>{SEM[x.semaforo]?.[0] ?? "•"} {x.numero ? `Corte ${x.numero}` : "Avance"} · {fecha(x.dia)}</Link>
            ))}
          </div>

          <div className="pc-card tb-res">
            <div className="tb-sem">{SEM[c.semaforo]?.[0]} <b>{nombre(c)}</b> <span className="tb-d">· {c.periodo || fecha(c.dia)} · cargado {fechaHora(c.creado)}</span></div>
            {c.resumen && <p className="tb-p">{c.resumen}</p>}
          </div>

          {c.indicadores.length > 0 && (
            <div className="cm-kpis">
              {c.indicadores.map((i) => (
                <div key={i.k} className="pc-card cm-kpi"><span className="cm-k">{i.k}</span><b className="cm-v">{i.v}</b>{i.meta && <span className="tb-d">meta: {i.meta}</span>}</div>
              ))}
            </div>
          )}

          <Sec t="Infografía" id="infografia" />
          {c.tiene_info ? <Marco src={archivo(c.dia, "info")} titulo={`Infografía · ${nombre(c)}`} /> : <SinDatos>Este corte no tiene infografía cargada.</SinDatos>}

          <Sec t="Historial de cortes" id="historial" />
          <div className="pc-card">
            <div className="pc-tw"><table>
              <thead><tr><th>Corte</th><th>Fecha</th><th>Período</th><th>Estado</th><th>PDF</th><th>Infografía</th></tr></thead>
              <tbody>
                {todos.map((x) => (
                  <tr key={x.dia}>
                    <td><Link href={`?dia=${x.dia}`}><b>{nombre(x)}</b></Link></td>
                    <td>{fecha(x.dia)}</td>
                    <td>{x.periodo || "—"}</td>
                    <td>{SEM[x.semaforo]?.[0]} {SEM[x.semaforo]?.[1]}</td>
                    <td>{x.tiene_pdf ? <><a href={archivo(x.dia, "pdf")} target="_blank" rel="noreferrer">Abrir</a> · <a href={archivo(x.dia, "pdf", true)}>Descargar</a></> : "—"}</td>
                    <td>{x.tiene_info ? <a href={archivo(x.dia, "info")} target="_blank" rel="noreferrer">Abrir</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </>
  )
}
