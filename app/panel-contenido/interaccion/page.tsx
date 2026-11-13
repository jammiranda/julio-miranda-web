import { safe, panelMetricas } from "@/lib/panel"
import { ESTADOS, METAS, REDES, TIPOS, resumenInteraccion, seguidoresPanel, type Accion } from "@/lib/interaccion"
import { acceso, base, Head, Sec, Kpi, Delta, Columnas, Barras, Linea, SinDatos, fmt, fechaCorta, fechaHora } from "../_ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Interacción en redes · DEVISEBIT" }

const ICO: Record<string, string> = { publicado: "🟢", pendiente: "🟡", rechazado: "🔴", borrado: "⚪" }
const nombreRed = (r: string) => (r === "linkedin_julio" ? "LinkedIn · Julio" : REDES[r as keyof typeof REDES] ?? r)

function Tabla({ filas, conTexto = false }: { filas: Accion[]; conTexto?: boolean }) {
  if (!filas.length) return <SinDatos>Todavía no hay registros.</SinDatos>
  return (
    <div className="pc-tw"><table>
      <thead><tr><th>Día</th><th>Red</th><th>{conTexto ? "Dónde" : "Cuenta o grupo"}</th>{conTexto ? <th>Qué</th> : <th>Tamaño</th>}<th>Estado</th></tr></thead>
      <tbody>
        {filas.map((a) => (
          <tr key={a.clave}>
            <td>{fechaCorta(a.dia)}</td>
            <td>{nombreRed(a.red)}</td>
            <td>{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.cuenta || "ver"}</a> : a.cuenta}{conTexto && <small className="tb-d"> · {TIPOS[a.tipo] ?? a.tipo}</small>}</td>
            <td>{conTexto ? <span className="tb-d">{a.texto}</span> : a.tamano}</td>
            <td>{ICO[a.estado]} {ESTADOS[a.estado] ?? a.estado}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  )
}

export default async function Interaccion() {
  if (!(await acceso())) return null
  const b = base()
  const [r0, seg, pm] = await Promise.all([safe(resumenInteraccion()), safe(seguidoresPanel()), safe(panelMetricas())])
  if (!r0) return (<><Head t="Interacción en redes" /><SinDatos>No se pudo leer la base. Probá de nuevo en un rato.</SinDatos></>)
  const r = r0

  const sum = (f: (x: (typeof r.totales)[number]) => boolean) => r.totales.filter(f).reduce((a, x) => a + x.c, 0)
  const coment = (red?: string) => sum((x) => x.tipo === "comentario" && x.estado === "publicado" && (!red || x.red === red))
  const grupos = r.grupos.filter((g) => g.tipo === "presentacion")
  const gPub = grupos.filter((g) => g.estado === "publicado").length, gPend = grupos.filter((g) => g.estado === "pendiente").length
  const seguidas = r.seguidas.filter((s) => s.estado !== "borrado").length
  const respuestas = sum((x) => x.tipo === "respuesta"), conversaciones = sum((x) => x.tipo === "mensaje")

  // Serie diaria de comentarios (todas las redes) y por red
  const dias = [...new Set(r.porDia.map((x) => x.dia))].sort()
  const serie = dias.map((d) => ({ k: d, v: r.porDia.filter((x) => x.dia === d).reduce((a, x) => a + x.c, 0) }))

  // Métricas manuales (LinkedIn de Julio): serie por métrica
  const met = (red: string, m: string) => r.metricas.filter((x) => x.red === red && x.metrica === m)
  const liSeg = met("linkedin_julio", "seguidores"), liVis = met("linkedin_julio", "visualizaciones_perfil")
  const ult = <T,>(a: T[]) => a[a.length - 1]
  const igSeg = seg?.instagram ?? [], fbSeg = seg?.facebook ?? []
  const crec = (a: { v: number }[]) => (a.length > 1 ? a[a.length - 1].v - a[0].v : null)

  const pctMes = r.mes ? Math.round((r.mes.comentarios / METAS.comentarios) * 100) : null
  const consultas30 = pm?.crm.consultas.d30 ?? null
  const visitas30 = pm ? pm.visitas.sitios.reduce((a: number, s: any) => a + (s.d30 ?? 0), 0) : null

  return (
    <>
      <Head t="Interacción en redes" sub={<>Comentarios, grupos y cuentas que seguimos para dar a conocer DEVISEBIT{r.ultima ? <> · actualizado {fechaHora(r.ultima)}</> : null}</>}>
        <a className="pc-btn" href={`${b}/tablero`}>Tablero diario</a>
      </Head>

      <div className="pc-kpis">
        <Kpi k="Comentarios publicados (total)" v={fmt(coment())} ft={<>LinkedIn {fmt(coment("linkedin"))} · Instagram {fmt(coment("instagram"))} · Facebook {fmt(coment("facebook"))}</>} serie={serie.map((s) => s.v)} delta={<Delta v={r.mes ? r.mes.d7 - r.mes.p7 : null} />} />
        <Kpi k="Meta del mes" v={pctMes != null ? `${pctMes}%` : "—"} ft={<>{fmt(r.mes?.comentarios)} de {METAS.comentarios} comentarios</>} />
        <Kpi k="Últimos 7 días" v={fmt(r.mes?.d7)} ft={<>semana anterior: {fmt(r.mes?.p7)}</>} />
        <Kpi k="Grupos de Facebook" v={fmt(gPub)} ft={<>presentaciones visibles · {gPend} en aprobación</>} />
        <Kpi k="Cuentas seguidas" v={fmt(seguidas)} ft={<>meta del mes: {METAS.seguidas}</>} />
        <Kpi k="Respuestas y conversaciones" v={fmt(respuestas + conversaciones)} ft={<>{respuestas} respuestas · {conversaciones} a mensaje directo (meta {METAS.conversaciones})</>} />
      </div>

      <Sec t="Comentarios por día" />
      <div className="pc-card"><Columnas filas={serie} titulo="Comentarios publicados por día" /></div>

      <Sec t="Por red" />
      <div className="pc-card">
        <Barras filas={(["linkedin", "instagram", "facebook"] as const).map((k) => ({ k: REDES[k], v: coment(k) }))} />
      </div>

      <Sec t="¿Rinde? Seguidores y resultados" />
      <div className="pc-kpis">
        <Kpi k="LinkedIn · Julio, seguidores" v={fmt(ult(liSeg)?.valor)} ft={ult(liSeg) ? <>al {fechaCorta(ult(liSeg)!.dia)} · desde {fechaCorta(liSeg[0].dia)}</> : "Se carga en cada corrida"} delta={<Delta v={liSeg.length > 1 ? ult(liSeg)!.valor - liSeg[0].valor : null} />} serie={liSeg.map((x) => x.valor)} />
        <Kpi k="LinkedIn · visualizaciones del perfil" v={fmt(ult(liVis)?.valor)} ft="últimos 90 días, según LinkedIn" serie={liVis.map((x) => x.valor)} />
        <Kpi k="Instagram @devisebit, seguidores" v={fmt(ult(igSeg)?.v)} ft="lo trae el panel solo" delta={<Delta v={crec(igSeg)} />} serie={igSeg.map((x) => x.v)} />
        <Kpi k="Facebook, seguidores de la página" v={fmt(ult(fbSeg)?.v)} ft="lo trae el panel solo" delta={<Delta v={crec(fbSeg)} />} serie={fbSeg.map((x) => x.v)} />
      </div>
      <div className="pc-kpis" style={{ marginTop: 12 }}>
        <Kpi k="Visitas a las webs (30 días)" v={fmt(visitas30)} ft="todas las webs del ecosistema" />
        <Kpi k="Consultas que entraron (30 días)" v={fmt(consultas30)} ft="web, WhatsApp y formularios" />
        <Kpi k="Conversaciones desde redes" v={fmt(conversaciones)} ft="pasaron a mensaje directo" />
      </div>
      {liSeg.length > 1 && <div className="pc-card" style={{ marginTop: 12 }}><Linea titulo="Seguidores de LinkedIn de Julio" puntos={liSeg.map((x) => ({ x: x.dia, y: x.valor }))} /></div>}

      <Sec t="Grupos de Facebook" />
      <Tabla filas={r.grupos} />

      <Sec t="Cuentas que seguimos" />
      <Tabla filas={r.seguidas} />

      <Sec t="Últimos comentarios y respuestas" />
      <Tabla filas={r.recientes} conTexto />
      <p className="tb-d" style={{ marginTop: 8 }}>Del 02/11 al 13/11 los comentarios se cargaron como totales por día; el detalle con el link de cada uno está en los registros diarios del proyecto. Desde el 14/11 la tarea de comentarios carga cada uno con su link al terminar la corrida.</p>
    </>
  )
}
