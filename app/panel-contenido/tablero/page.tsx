import Link from "next/link"
import { soloJulio } from "@/lib/oficina"
import { claveItem, diasConInforme, edicionesDe, diaValido, hoyAR, notaDe, tildesDe, EDICIONES, type Item, type Seccion } from "@/lib/informe"
import { Head, Sec, SinDatos, NoPermiso, fechaHora, base as basePanel } from "../_ui"
import { dejarNota, tildarDecision } from "./_acciones"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tablero diario · DEVISEBIT" }

const SEM = { verde: ["🟢", "Todo en orden"], amarillo: ["🟡", "Hay cosas para mirar"], rojo: ["🔴", "Hay algo urgente"] } as const
const NIV: Record<string, string> = { alto: "🔴", aviso: "🟡", ok: "🟢" }
const diaLargo = (d: string) => new Date(d + "T12:00:00-03:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

function Fila({ it }: { it: Item }) {
  const t = it.url ? <a href={it.url} target="_blank" rel="noreferrer">{it.t}</a> : it.t
  return (
    <li className="tb-it">
      <span className="tb-n">{it.nivel ? NIV[it.nivel] : "•"}</span>
      <span>
        {it.hora && <b className="tb-h">{it.hora} </b>}{t}
        {it.d && <span className="tb-d"> · {it.d}</span>}
      </span>
    </li>
  )
}

function Decisiones({ s, dia, tildes }: { s: Seccion; dia: string; tildes: Record<string, boolean> }) {
  return (
    <ul className="tb-ul">
      {s.items.map((it) => {
        const clave = claveItem(s.id, it.t), hecho = !!tildes[clave]
        return (
          <li key={clave} className={`tb-it${hecho ? " tb-hecho" : ""}`}>
            <form action={tildarDecision}>
              <input type="hidden" name="dia" value={dia} />
              <input type="hidden" name="clave" value={clave} />
              <input type="hidden" name="hecho" value={hecho ? "0" : "1"} />
              <button className="tb-chk" aria-label={hecho ? "Marcar como pendiente" : "Marcar como resuelto"}>{hecho ? "✓" : ""}</button>
            </form>
            <span>
              {it.nivel && <span className="tb-n">{NIV[it.nivel]} </span>}
              {it.url ? <a href={it.url} target="_blank" rel="noreferrer">{it.t}</a> : it.t}
              {it.d && <span className="tb-d"> · {it.d}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default async function Tablero({ searchParams }: { searchParams: { dia?: string; ed?: string } }) {
  if (!(await soloJulio())) return <NoPermiso />
  const hoy = hoyAR()
  const dia = diaValido(searchParams.dia) ? searchParams.dia : hoy
  const [eds, tildes, nota, dias] = await Promise.all([edicionesDe(dia), tildesDe(dia), notaDe(dia), diasConInforme()])
  const pedida = searchParams.ed === "manana" || searchParams.ed === "cierre" ? searchParams.ed : null
  // Por defecto, la edición más reciente del día (el cierre si ya salió)
  const e = (pedida && eds.find((x) => x.edicion === pedida)) || eds[eds.length - 1] || null
  const base = `?dia=${dia}`
  const pend = e ? e.secciones.filter((s) => s.tipo === "decisiones").flatMap((s) => s.items.filter((it) => !tildes[claveItem(s.id, it.t)])).length : 0

  return (
    <>
      <Head t="Tablero diario" sub={`${diaLargo(dia)}${dia === hoy ? " · hoy" : ""}`}>
        <Link className="tb-pill" href={`${basePanel()}/interaccion`}>💬 Interacción en redes</Link>
        {eds.map((x) => (
          <Link key={x.edicion} className={`tb-pill${e?.edicion === x.edicion ? " on" : ""}`} href={`${base}&ed=${x.edicion}`}>{EDICIONES[x.edicion]}</Link>
        ))}
      </Head>

      <div className="tb-dias" aria-label="Días anteriores">
        {dias.map((d) => (
          <Link key={d.dia} href={`?dia=${d.dia}`} className={`tb-pill${d.dia === dia ? " on" : ""}`}>{SEM[d.semaforo as keyof typeof SEM]?.[0] ?? "•"} {d.dia.slice(8)}/{d.dia.slice(5, 7)}</Link>
        ))}
      </div>

      {!e ? (
        <SinDatos>Todavía no hay informe de este día. La edición de la mañana sale a las 8:27 y el cierre a las 18:57.</SinDatos>
      ) : (
        <>
          <div className="pc-card tb-res">
            <div className="tb-sem">{SEM[e.semaforo]?.[0]} <b>{SEM[e.semaforo]?.[1]}</b> <span className="tb-d">· {EDICIONES[e.edicion]} · generado {fechaHora(e.creado)}</span></div>
            {e.resumen && <p className="tb-p">{e.resumen}</p>}
            {pend > 0 && <p className="tb-p"><b>{pend}</b> decisión{pend === 1 ? "" : "es"} esperando tu respuesta.</p>}
          </div>

          <div className="tb-grid">
            {e.secciones.map((s) => (
              <section key={s.id} className="pc-card">
                <Sec t={s.titulo} id={s.id} />
                {!s.items.length ? <p className="tb-d">Sin novedades.</p> : s.tipo === "decisiones" ? <Decisiones s={s} dia={dia} tildes={tildes} /> : <ul className="tb-ul">{s.items.map((it, i) => <Fila key={i} it={it} />)}</ul>}
              </section>
            ))}
          </div>
        </>
      )}

      <section className="pc-card" style={{ marginTop: 16 }}>
        <Sec t="Mis notas del día" id="notas" />
        <form action={dejarNota} className="tb-nota">
          <input type="hidden" name="dia" value={dia} />
          <textarea name="texto" defaultValue={nota?.texto ?? ""} rows={4} placeholder="Correcciones, ideas o pedidos para los agentes. Los leen al preparar el informe siguiente." />
          <button className="tb-btn">Guardar nota</button>
        </form>
      </section>
    </>
  )
}
