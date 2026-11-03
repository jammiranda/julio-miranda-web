import { unstable_cache } from "next/cache"
import { waitUntil } from "@vercel/functions"
import { instagram, sincronizarPublicacionesIG } from "@/lib/instagram"
import { linkedin } from "@/lib/linkedin"
import { historial, interacciones, REDES, type Publicacion } from "@/lib/publicaciones"
import { acceso, base, Head, Sec, Kpi, Columnas, SinDatos, fmt, fechaCorta } from "../_ui"

export const dynamic = "force-dynamic"

const PERIODOS: [string, string, number][] = [["30", "30 días", 30], ["90", "90 días", 90], ["365", "12 meses", 365], ["todo", "Todo", 3650]]
const ORDEN: [string, string][] = [["", "Más recientes"], ["int", "Más interacciones"], ["imp", "Más impresiones / vistas"]]
const alcanceDe = (p: Publicacion) => p.impresiones ?? p.vistas ?? p.alcance ?? null

const refrescarFuentes = unstable_cache(async () => { await Promise.all([sincronizarPublicacionesIG(100).catch(() => 0), linkedin("pagina").catch(() => null), linkedin("julio").catch(() => null)]); return Date.now() }, ["pc-pub-refrescar"], { revalidate: 600 })

export default async function Publicaciones({ searchParams }: { searchParams: { red?: string; periodo?: string; orden?: string; q?: string } }) {
  if (!(await acceso())) return null
  const b = base()
  // Refresca las fuentes que el panel puede leer directo (Instagram y Buffer) antes de mostrar el historial
  // En segundo plano y como mucho cada 10 minutos: la página ya no espera a Instagram ni a Buffer
  waitUntil(refrescarFuentes().catch(() => null))
  const per = PERIODOS.find(([k]) => k === searchParams.periodo) ?? PERIODOS[1]
  const red = searchParams.red && REDES[searchParams.red] ? searchParams.red : ""
  const orden = ORDEN.some(([k]) => k === searchParams.orden) ? searchParams.orden ?? "" : ""
  const busca = (searchParams.q ?? "").trim().toLowerCase()
  const [todas, ig] = await Promise.all([historial(per[2]).catch(() => [] as Publicacion[]), instagram()])

  let lista = todas.filter((p) => (!red || p.red === red) && (!busca || p.texto.toLowerCase().includes(busca)))
  if (orden === "int") lista = [...lista].sort((a, c) => interacciones(c) - interacciones(a))
  if (orden === "imp") lista = [...lista].sort((a, c) => (alcanceDe(c) ?? -1) - (alcanceDe(a) ?? -1))

  const porRed = Object.keys(REDES).map((k) => {
    const ps = todas.filter((p) => p.red === k)
    const ints = ps.map(interacciones)
    const alc = ps.map(alcanceDe).filter((x): x is number => x != null)
    return { k, n: ps.length, int: ints.reduce((a, x) => a + x, 0), prom: ps.length ? ints.reduce((a, x) => a + x, 0) / ps.length : null, alc: alc.length ? alc.reduce((a, x) => a + x, 0) : null, ultima: ps.find((p) => p.fecha)?.fecha ?? null }
  })
  const semanas = Array.from({ length: Math.min(12, Math.ceil(per[2] / 7)) }, (_, i) => {
    const fin = Date.now() - i * 7 * 864e5, ini = fin - 7 * 864e5
    return { k: new Date(ini + 864e5).toISOString().slice(0, 10), v: lista.filter((p) => { const t = p.fecha ? new Date(p.fecha).getTime() : 0; return t > ini && t <= fin }).length }
  }).reverse()
  const link = (cambios: Record<string, string>) => {
    const s = new URLSearchParams()
    const v = { red, periodo: per[0] === "90" ? "" : per[0], orden, q: busca, ...cambios }
    for (const [k, x] of Object.entries(v)) if (x) s.set(k, x)
    const t = s.toString()
    return `${b}/publicaciones${t ? "?" + t : ""}`
  }

  return (
    <>
      <Head t="Publicaciones" sub={<>Historial de todas las redes · {per[1]} · {fmt(todas.length)} publicaciones</>}>
        <a className="pc-btn" href="https://www.instagram.com/devisebit" target="_blank" rel="noreferrer">Instagram</a>
      </Head>
      {!ig.ok && <SinDatos><b>Instagram no respondió:</b> {ig.error} Se muestra lo guardado en el historial.</SinDatos>}

      <div className="pc-kpis">
        {porRed.filter((r) => r.n > 0 || ["instagram", "facebook", "linkedin", "linkedin_julio"].includes(r.k)).map((r) => (
          <a key={r.k} href={link({ red: r.k === red ? "" : r.k })} style={{ textDecoration: "none", color: "inherit" }}>
            <Kpi k={REDES[r.k].nombre} v={fmt(r.n)} color={REDES[r.k].color} ft={r.n ? `${fmt(r.int)} interacciones · ${fmt(r.prom, 1)} por publicación${r.alc != null ? ` · ${fmt(r.alc)} imp./vistas` : ""}` : "sin publicaciones en el período"} />
          </a>
        ))}
      </div>

      <div className="pc-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div className="pc-seg" role="group" aria-label="Red">
          <a href={link({ red: "" })} aria-current={!red ? "true" : undefined}>Todas</a>
          {Object.entries(REDES).map(([k, r]) => <a key={k} href={link({ red: k })} aria-current={red === k ? "true" : undefined}>{r.nombre}</a>)}
        </div>
        <div className="pc-seg" role="group" aria-label="Período">{PERIODOS.map(([k, t]) => <a key={k} href={link({ periodo: k === "90" ? "" : k })} aria-current={per[0] === k ? "true" : undefined}>{t}</a>)}</div>
        <div className="pc-seg" role="group" aria-label="Orden">{ORDEN.map(([k, t]) => <a key={k} href={link({ orden: k })} aria-current={orden === k ? "true" : undefined}>{t}</a>)}</div>
        <form action={`${b}/publicaciones`} className="pc-row" style={{ gap: 6 }}>
          {red && <input type="hidden" name="red" value={red} />}{per[0] !== "90" && <input type="hidden" name="periodo" value={per[0]} />}{orden && <input type="hidden" name="orden" value={orden} />}
          <input className="pc-inp" name="q" defaultValue={busca} placeholder="Buscar en el texto" style={{ maxWidth: 200 }} />
        </form>
      </div>

      <div className="pc-card"><div className="pc-ch"><h2>Publicaciones por semana</h2><span className="pc-k">{red ? REDES[red].nombre : "todas las redes"}</span></div>
        <Columnas filas={semanas} titulo="Publicaciones por semana" color={red ? REDES[red].color : "var(--red)"} />
      </div>

      <Sec t={`Historial · ${fmt(lista.length)} publicaciones`} />
      {lista.length ? (
        <div className="pc-card" style={{ padding: 0 }}>
          <div className="pc-tw"><table>
            <thead><tr><th>Fecha</th><th>Red</th><th>Publicación</th><th>Tipo</th><th className="n">Me gusta / reacc.</th><th className="n">Coment.</th><th className="n">Compart.</th><th className="n">Imp. / vistas</th><th className="n">Interacciones</th></tr></thead>
            <tbody>
              {lista.slice(0, 500).map((p) => (
                <tr key={p.red + p.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{p.fecha ? `${fechaCorta(p.fecha)}${new Date(p.fecha).getFullYear() !== new Date().getFullYear() ? " " + new Date(p.fecha).getFullYear() : ""}` : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}><span className="pc-dot" style={{ background: REDES[p.red]?.color ?? "var(--muted)" }} /> {REDES[p.red]?.nombre ?? p.red}</td>
                  <td style={{ maxWidth: 440 }}>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{(p.texto.split("\n")[0] || "(ver publicación)").slice(0, 130)}</a> : (p.texto.split("\n")[0] || "(sin texto)").slice(0, 130)}{p.texto.split("\n")[0].length > 130 ? "…" : ""}</td>
                  <td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{tipoLegible(p.tipo)}</td>
                  <td className="n">{fmt(p.me_gusta)}</td><td className="n">{fmt(p.comentarios)}</td><td className="n">{fmt(p.compartidos)}</td>
                  <td className="n">{fmt(alcanceDe(p))}</td><td className="n"><b>{fmt(interacciones(p))}</b></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ) : <div className="pc-card pc-empty">No hay publicaciones con estos filtros.</div>}
      <p className="pc-sub">El historial se guarda cada día: Instagram por su API, Facebook desde Metricool, YouTube desde el canal, LinkedIn desde Buffer y las exportaciones (página y perfil de Julio). Instagram no comparte impresiones con el permiso actual. Interacciones = me gusta + comentarios + compartidos + clics + votos (o lo que informa la red).</p>
    </>
  )
}

function tipoLegible(t: string | null) {
  if (!t) return "—"
  const m: Record<string, string> = { IMAGE: "Imagen", VIDEO: "Video / reel", CAROUSEL_ALBUM: "Carrusel", photo: "Foto", video: "Video", link: "Link", status: "Texto" }
  return m[t] ?? t
}
