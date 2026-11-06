import Link from "next/link"

/** Indicador grande y legible de un vistazo: etiqueta, número, contexto y (opcional) mini gráfico. Mismo estilo en todo el sistema. */
export type KpiDato = { t: string; v: string | number | null | undefined; d?: string; href?: string; tono?: "oscuro" | "alerta"; tendencia?: { texto: string; sube: boolean }; serie?: number[] }

function Spark({ serie }: { serie: number[] }) {
  if (serie.length < 2) return null
  const max = Math.max(...serie, 1), w = 100, h = 28
  const pts = serie.map((v, i) => `${(i / (serie.length - 1)) * w},${h - 3 - (v / max) * (h - 6)}`).join(" ")
  return <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity=".55" /></svg>
}

export function Kpis({ datos }: { datos: KpiDato[] }) {
  return (
    <ul className="kpis">
      {datos.map((x) => {
        const cuerpo = (
          <>
            <span className="kpi-t">{x.t}</span>
            <span className="kpi-v">{x.v ?? "Sin datos"}</span>
            {x.tendencia ? <span className={`kpi-d ${x.tendencia.sube ? "kpi-sube" : "kpi-baja"}`}><b>{x.tendencia.sube ? "▲" : "▼"} {x.tendencia.texto}</b>{x.d ? ` · ${x.d}` : ""}</span> : x.d ? <span className="kpi-d">{x.d}</span> : null}
            {x.serie && <Spark serie={x.serie} />}
          </>
        )
        const cl = `kpi ${x.tono === "oscuro" ? "kpi-oscuro" : x.tono === "alerta" ? "kpi-alerta" : ""}`
        return <li key={x.t} className="contents">{x.href ? <Link href={x.href} className={cl}>{cuerpo}</Link> : <div className={cl}>{cuerpo}</div>}</li>
      })}
    </ul>
  )
}

/** "Para hoy": lo que necesita una acción, primero. Si no hay nada, no se muestra. */
export type Pendiente = { n: number | string; t: string; d?: string; href: string; accion: string; tono?: "ok" | "av" }
export function ParaHoy({ items }: { items: Pendiente[] }) {
  const hay = items.filter((x) => Number(x.n) !== 0)
  if (!hay.length) return <p className="vacio">Todo al día: no hay nada urgente para hoy.</p>
  return (
    <section aria-label="Para hoy" className="flex flex-col gap-2">
      <h2 className="m-0 text-lg">Para hoy</h2>
      <ul className="hoy">
        {hay.map((x) => (
          <li key={x.t} className="contents"><Link href={x.href}><span className={`n ${x.tono ?? ""}`}>{x.n}</span><span><b>{x.t}</b>{x.d && <small>{x.d}</small>}</span><span className="go">{x.accion} →</span></Link></li>
        ))}
      </ul>
    </section>
  )
}
