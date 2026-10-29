import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { usuarioActual, type Usuario } from "@/lib/auth"

/** Quién puede ver el panel: Dirección y Comercial. */
export const ROLES_PANEL = ["gerente", "coordinacion"]
export async function acceso(): Promise<Usuario | null> {
  const u = await usuarioActual()
  if (!u) redirect("/login")
  return ROLES_PANEL.includes(u.rol) ? u : null
}
/** En panel.devisebit.com las rutas van sin prefijo; en otros dominios, bajo /panel-contenido. */
export function base() {
  const h = headers()
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase()
  return host.startsWith("panel.") ? "" : "/panel-contenido"
}

const nf = new Intl.NumberFormat("es-AR")
export const fmt = (v: number | null | undefined, dec = 0) => (v == null || !Number.isFinite(v) ? "—" : dec ? v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : nf.format(Math.round(v)))
export const plata = (v: number | null | undefined, moneda = "ARS") => (v == null ? "—" : `${moneda === "ARS" ? "$" : moneda + " "}${nf.format(Math.round(v))}`)
export const fechaCorta = (iso: string) => {
  if (!iso) return ""
  const d = new Date(iso.length === 10 ? iso + "T12:00:00-03:00" : iso)
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "America/Argentina/Buenos_Aires" }).replace(".", "")
}
export const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).replace(".", "")

export function Head({ t, sub, children }: { t: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="pc-head">
      <div><h1>{t}</h1>{sub && <p className="pc-sub">{sub}</p>}</div>
      {children && <div className="pc-row">{children}</div>}
    </div>
  )
}
export const Sec = ({ t }: { t: string }) => <div className="pc-sec"><span className="pc-k">{t}</span></div>

export function Delta({ v, sufijo = "", invertir = false }: { v: number | null | undefined; sufijo?: string; invertir?: boolean }) {
  if (v == null || !Number.isFinite(v)) return null
  const bueno = invertir ? v < 0 : v > 0
  return <span className={`pc-dc ${v === 0 ? "" : bueno ? "up" : "dn"}`}>{v > 0 ? "+" : ""}{fmt(v, Number.isInteger(v) ? 0 : 1)}{sufijo}</span>
}

export function Kpi({ k, v, ft, serie, delta, color = "var(--red)" }: { k: string; v: React.ReactNode; ft?: React.ReactNode; serie?: number[]; delta?: React.ReactNode; color?: string }) {
  const nd = v == null || v === "—"
  return (
    <div className="pc-card pc-kt">
      <div className="top"><span className="pc-k" title={k}>{k}</span>{delta}</div>
      <div className={`pc-big ${nd ? "nd" : ""}`}>{nd ? "Sin datos" : v}</div>
      <div className="pc-ft">{ft}</div>
      {serie && serie.length > 1 && <Spark vals={serie} color={color} />}
    </div>
  )
}

/** Mini gráfico de área. */
export function Spark({ vals, color = "var(--red)", alto = 34, className = "pc-sp" }: { vals: number[]; color?: string; alto?: number; className?: string }) {
  if (vals.length < 2) return null
  const W = 200, H = 40
  const min = Math.min(...vals), max = Math.max(...vals), r = max - min || 1
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * W, H - 3 - ((v - min) / r) * (H - 8)])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("")
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: alto }} aria-hidden="true">
      <path d={`${d}L${W},${H}L0,${H}Z`} fill={color} opacity=".14" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Línea con ejes simples. El trazo se estira con el ancho; las etiquetas son HTML para que se lean igual en celular y en escritorio. */
export function Linea({ puntos, color = "var(--red)", alto = 180, titulo }: { puntos: { x: string; y: number }[]; color?: string; alto?: number; titulo: string }) {
  if (puntos.length < 2) return <div className="pc-empty">Todavía no hay suficientes días registrados para graficar.</div>
  const ys = puntos.map((p) => p.y)
  let min = Math.min(...ys), max = Math.max(...ys)
  if (min === max) { min -= 1; max += 1 }
  const X = (i: number) => (i / (puntos.length - 1)) * 1000
  const Y = (v: number) => 4 + (1 - (v - min) / (max - min)) * 92
  const d = puntos.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.y).toFixed(2)}`).join("")
  const marcas = [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1]
  const yt = [max, (min + max) / 2, min]
  return (
    <div className="pc-plot" role="img" aria-label={titulo}>
      <div className="ejey">{yt.map((v, i) => <span key={i}>{fmt(v)}</span>)}</div>
      <div className="area" style={{ height: alto }}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          {[4, 50, 96].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--line)" vectorEffect="non-scaling-stroke" />)}
          <path d={`${d}L1000,100L0,100Z`} fill={color} opacity=".12" />
          <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="pto" style={{ left: "100%", top: `${Y(puntos[puntos.length - 1].y)}%`, background: color }} />
      </div>
      <div className="ejex">{marcas.map((i, k) => <span key={k}>{fechaCorta(puntos[i].x)}</span>)}</div>
    </div>
  )
}

/** Columnas verticales (por día o por categoría). */
export function Columnas({ filas, color = "var(--red)", alto = 160, titulo }: { filas: { k: string; v: number }[]; color?: string; alto?: number; titulo: string }) {
  if (!filas.length) return <div className="pc-empty">Sin datos para este período.</div>
  const max = Math.max(...filas.map((f) => f.v), 1)
  const w = 1000 / filas.length
  const marcas = [0, Math.floor((filas.length - 1) / 2), filas.length - 1]
  return (
    <div className="pc-plot" role="img" aria-label={titulo}>
      <div className="ejey"><span>{fmt(max)}</span><span>{fmt(max / 2)}</span><span>0</span></div>
      <div className="area" style={{ height: alto }}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          {[0.5, 50, 99.5].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="var(--line)" vectorEffect="non-scaling-stroke" />)}
          {filas.map((f, i) => { const h = (f.v / max) * 99; return <rect key={i} x={i * w + w * 0.15} y={100 - h} width={Math.max(w * 0.7, 1)} height={h} fill={color}><title>{`${fechaCorta(f.k)}: ${fmt(f.v)}`}</title></rect> })}
        </svg>
      </div>
      <div className="ejex">{[...new Set(marcas)].map((i) => <span key={i}>{fechaCorta(filas[i].k)}</span>)}</div>
    </div>
  )
}

/** Barras horizontales con valor. */
export function Barras({ filas, color = "var(--red)", sufijo = "" }: { filas: { k: string; v: number; t?: string }[]; color?: string; sufijo?: string }) {
  if (!filas.length) return <div className="pc-empty">Sin datos para este período.</div>
  const max = Math.max(...filas.map((f) => f.v), 1)
  return (
    <div className="pc-flow">
      {filas.map((f) => (
        <div key={f.k} className="pc-fr">
          <span title={f.k}>{f.k}</span>
          <div className="pc-bar"><i style={{ width: `${Math.max((f.v / max) * 100, f.v ? 2 : 0)}%`, background: color }} /></div>
          <b>{f.t ?? fmt(f.v, Number.isInteger(f.v) ? 0 : 1) + sufijo}</b>
        </div>
      ))}
    </div>
  )
}

export const tipoNombre = (t: string) => (t === "VIDEO" ? "Video" : t === "CAROUSEL_ALBUM" ? "Carrusel" : t === "IMAGE" ? "Imagen" : t || "—")

export const SinDatos = ({ children }: { children: React.ReactNode }) => <div className="pc-note">{children}</div>

export function NoPermiso() {
  return <div className="pc-note"><b>No tenés acceso al Panel de Contenido.</b> Lo ven los usuarios de Dirección y Comercial del sistema.</div>
}
