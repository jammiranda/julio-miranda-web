import { instagram, engagement } from "@/lib/instagram"
import { acceso, base, Head, Kpi, SinDatos, fmt, fechaCorta, fechaHora, tipoNombre } from "../_ui"

export const dynamic = "force-dynamic"

const TIPOS: [string, string][] = [["", "Todas"], ["IMAGE", "Imágenes"], ["CAROUSEL_ALBUM", "Carruseles"], ["VIDEO", "Videos y reels"]]
const ORDEN: [string, string][] = [["", "Más recientes"], ["eng", "Más engagement"], ["coment", "Más comentarios"]]

export default async function Publicaciones({ searchParams }: { searchParams: { tipo?: string; orden?: string } }) {
  if (!(await acceso())) return null
  const b = base()
  const ig = await instagram()
  if (!ig.ok) return (<><Head t="Publicaciones" sub="Instagram de DEVISEBIT" /><SinDatos><b>Sin datos de Instagram.</b> {ig.error}</SinDatos></>)
  const seg = ig.perfil.seguidores
  const tipo = TIPOS.some(([k]) => k === searchParams.tipo) ? searchParams.tipo ?? "" : ""
  const orden = ORDEN.some(([k]) => k === searchParams.orden) ? searchParams.orden ?? "" : ""
  let posts = ig.posts.filter((p) => !tipo || p.tipo === tipo)
  if (orden === "eng") posts = [...posts].sort((a, b) => (engagement(b, seg) ?? -1) - (engagement(a, seg) ?? -1))
  if (orden === "coment") posts = [...posts].sort((a, b) => (b.comentarios ?? -1) - (a.comentarios ?? -1))
  const todos = ig.posts
  const prom = (k: "meGusta" | "comentarios") => { const v = todos.map((p) => p[k]).filter((x): x is number => x != null); return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null }
  const engs = todos.map((p) => engagement(p, seg)).filter((x): x is number => x != null)
  const d30 = todos.filter((p) => p.fecha && Date.now() - new Date(p.fecha).getTime() < 30 * 864e5).length
  const link = (t: string, o: string) => { const s = new URLSearchParams(); if (t) s.set("tipo", t); if (o) s.set("orden", o); const x = s.toString(); return `${b}/publicaciones${x ? "?" + x : ""}` }

  return (
    <>
      <Head t="Publicaciones" sub={<>Últimas {todos.length} publicaciones de @{ig.perfil.username} · actualizado {fechaHora(ig.actualizado)}</>}>
        <a className="pc-btn" href="https://www.instagram.com/devisebit" target="_blank" rel="noreferrer">Abrir Instagram</a>
      </Head>
      <div className="pc-kpis">
        <Kpi k="Publicaciones totales" v={fmt(ig.perfil.publicaciones)} ft={`${fmt(d30)} en los últimos 30 días`} />
        <Kpi k="Me gusta promedio" v={fmt(prom("meGusta"), 1)} color="var(--ig)" serie={todos.slice().reverse().map((p) => p.meGusta ?? 0)} ft={`en las últimas ${todos.length}`} />
        <Kpi k="Comentarios promedio" v={fmt(prom("comentarios"), 1)} color="var(--info)" serie={todos.slice().reverse().map((p) => p.comentarios ?? 0)} ft={`en las últimas ${todos.length}`} />
        <Kpi k="Engagement aprox." v={engs.length ? `${fmt(engs.reduce((a, x) => a + x, 0) / engs.length, 2)}%` : null} color="var(--ok)" ft={`sobre ${fmt(seg)} seguidores`} />
      </div>
      <div className="pc-row" style={{ justifyContent: "space-between" }}>
        <div className="pc-seg" role="group" aria-label="Tipo">{TIPOS.map(([k, t]) => <a key={k} href={link(k, orden)} aria-current={tipo === k ? "true" : undefined}>{t}</a>)}</div>
        <div className="pc-seg" role="group" aria-label="Orden">{ORDEN.map(([k, t]) => <a key={k} href={link(tipo, k)} aria-current={orden === k ? "true" : undefined}>{t}</a>)}</div>
      </div>
      {posts.length ? (
        <div className="pc-posts">
          {posts.map((p) => (
            <a key={p.id} className="pc-post" href={p.url} target="_blank" rel="noreferrer">
              <div className="img">
                {p.imagen ? <img src={p.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
                <span className="pc-tag">{tipoNombre(p.tipo)}</span>
              </div>
              <div className="bd">
                <span className="tx">{p.texto || "(sin texto)"}</span>
                <span className="st"><span>♥ <b>{fmt(p.meGusta)}</b></span><span><b>{fmt(p.comentarios)}</b> coment.</span><span><b>{fmt(engagement(p, seg), 2)}%</b> eng.</span></span>
                <span className="st">{fechaCorta(p.fecha)} {new Date(p.fecha).getFullYear() !== new Date().getFullYear() ? new Date(p.fecha).getFullYear() : ""}</span>
              </div>
            </a>
          ))}
        </div>
      ) : <div className="pc-card pc-empty">No hay publicaciones de este tipo entre las últimas {todos.length}.</div>}
      <p className="pc-sub">Instagram no comparte alcance ni impresiones con el permiso actual: el engagement es aproximado, (me gusta + comentarios) / seguidores.</p>
    </>
  )
}
