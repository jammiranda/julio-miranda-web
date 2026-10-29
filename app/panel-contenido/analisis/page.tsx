import { instagram, historialSeguidores, engagement, type PostIG } from "@/lib/instagram"
import { panelMetricas, safe } from "@/lib/panel"
import { acceso, Head, Sec, Kpi, Delta, Barras, Linea, Columnas, SinDatos, fmt, fechaCorta, tipoNombre } from "../_ui"

export const dynamic = "force-dynamic"

const TZ = "America/Argentina/Buenos_Aires"
const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
function partes(iso: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(iso))
  const w = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(f.find((x) => x.type === "weekday")?.value ?? "")
  return { dia: w, hora: Number(f.find((x) => x.type === "hour")?.value ?? 0) }
}
const promedio = (v: number[]) => (v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0)
function agrupar(posts: PostIG[], seg: number, clave: (p: PostIG) => string, orden: string[]) {
  return orden.map((k) => {
    const g = posts.filter((p) => clave(p) === k).map((p) => engagement(p, seg)).filter((x): x is number => x != null)
    return { k, v: Math.round(promedio(g) * 100) / 100, n: g.length }
  }).filter((x) => x.n > 0).map((x) => ({ k: `${x.k} (${x.n})`, v: x.v, t: `${fmt(x.v, 2)}%` }))
}

export default async function Analisis() {
  if (!(await acceso())) return null
  const [ig, hist, m] = await Promise.all([instagram(), historialSeguidores(180).catch(() => []), safe(panelMetricas())])
  const seg = ig.ok ? ig.perfil.seguidores : 0
  const posts = ig.ok ? ig.posts.filter((p) => p.fecha) : []
  const franja = (h: number) => (h < 6 ? "Madrugada" : h < 12 ? "Mañana" : h < 15 ? "Mediodía" : h < 19 ? "Tarde" : "Noche")
  const porTipo = agrupar(posts, seg, (p) => tipoNombre(p.tipo), ["Imagen", "Carrusel", "Video"])
  const porDia = agrupar(posts, seg, (p) => DIAS[partes(p.fecha).dia], DIAS)
  const porFranja = agrupar(posts, seg, (p) => franja(partes(p.fecha).hora), ["Mañana", "Mediodía", "Tarde", "Noche", "Madrugada"])
  // Publicaciones por semana (últimas 12)
  const semanas = Array.from({ length: 12 }, (_, i) => {
    const fin = Date.now() - i * 7 * 864e5, ini = fin - 7 * 864e5
    return { k: new Date(ini + 864e5).toISOString().slice(0, 10), v: posts.filter((p) => { const t = new Date(p.fecha).getTime(); return t > ini && t <= fin }).length }
  }).reverse()
  const top = [...posts].sort((a, b) => (engagement(b, seg) ?? 0) - (engagement(a, seg) ?? 0)).slice(0, 5)
  const primero = hist[0], ultimo = hist[hist.length - 1]
  const dias = (m?.visitas.dias ?? []).map((d) => ({ x: d.dia, y: Number(d.c) }))
  const intervalo = posts.length > 1 ? (new Date(posts[0].fecha).getTime() - new Date(posts[posts.length - 1].fecha).getTime()) / 864e5 / (posts.length - 1) : null

  return (
    <>
      <Head t="Análisis" sub="Qué funciona en Instagram y cómo evolucionan la cuenta y la web" />
      {!ig.ok && <SinDatos><b>Sin datos de Instagram.</b> {ig.error}</SinDatos>}
      <div className="pc-kpis">
        <Kpi k="Crecimiento registrado" v={hist.length > 1 ? fmt(ultimo.seguidores - primero.seguidores) : null} delta={<Delta v={hist.length > 1 && primero.seguidores ? Math.round(((ultimo.seguidores - primero.seguidores) / primero.seguidores) * 1000) / 10 : null} sufijo="%" />} ft={hist.length > 1 ? `desde ${fechaCorta(primero.dia)} (${hist.length} días)` : "Se registra una foto de seguidores por día"} color="var(--ig)" serie={hist.map((h) => h.seguidores)} />
        <Kpi k="Ritmo de publicación" v={intervalo != null ? `cada ${fmt(intervalo, 1)} días` : null} ft={`según las últimas ${posts.length} publicaciones`} />
        <Kpi k="Mejor formato" v={porTipo.length ? [...porTipo].sort((a, b) => b.v - a.v)[0].k.replace(/ \(\d+\)$/, "") : null} ft="Por engagement promedio" color="var(--ok)" />
        <Kpi k="Mejor día" v={porDia.length ? [...porDia].sort((a, b) => b.v - a.v)[0].k.replace(/ \(\d+\)$/, "") : null} ft="Por engagement promedio" color="var(--info)" />
      </div>

      <div className="pc-card"><div className="pc-ch"><h2>Seguidores de Instagram</h2><span className="pc-k">foto diaria</span></div>
        <Linea puntos={hist.map((h) => ({ x: h.dia, y: h.seguidores }))} color="var(--ig)" titulo="Evolución de seguidores de Instagram" />
      </div>

      <Sec t="Engagement promedio en Instagram · entre paréntesis, cuántas publicaciones" />
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Por formato</h2></div><Barras filas={porTipo} color="var(--ig)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>Por día de la semana</h2></div><Barras filas={porDia} color="var(--info)" /></div>
        <div className="pc-card"><div className="pc-ch"><h2>Por horario</h2><span className="pc-k">hora de Argentina</span></div><Barras filas={porFranja} color="var(--ok)" /></div>
      </div>

      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Publicaciones por semana</h2><span className="pc-k">12 semanas</span></div>
          {posts.length ? <Columnas filas={semanas} titulo="Publicaciones por semana" color="var(--ig)" /> : <div className="pc-empty">Sin publicaciones.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Las 5 con más engagement</h2></div>
          {top.length ? (
            <div className="pc-list">{top.map((p) => (
              <a key={p.id} className="pc-item" href={p.url} target="_blank" rel="noreferrer">
                <span className="t">{p.texto.split("\n")[0].slice(0, 100) || "(sin texto)"}</span>
                <span className="m"><span>{fechaCorta(p.fecha)} · {tipoNombre(p.tipo)}</span><span>♥ {fmt(p.meGusta)} · {fmt(p.comentarios)} coment. · {fmt(engagement(p, seg), 2)}%</span></span>
              </a>
            ))}</div>
          ) : <div className="pc-empty">Sin publicaciones.</div>}
        </div>
      </div>

      <Sec t="Web" />
      <div className="pc-card"><div className="pc-ch"><h2>Visitas diarias a los sitios</h2><span className="pc-k">30 días</span></div>
        {dias.length ? <Linea puntos={dias} color="var(--info)" titulo="Visitas diarias" /> : <div className="pc-empty">Todavía no hay visitas registradas.</div>}
      </div>
      <p className="pc-sub">Con el permiso actual Instagram no comparte alcance, impresiones ni guardados: el análisis usa me gusta y comentarios sobre seguidores. Los horarios usan la hora de publicación.</p>
    </>
  )
}
