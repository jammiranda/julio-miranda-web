import { instagram, historialSeguidores } from "@/lib/instagram"
import { facebook } from "@/lib/facebook"
import { linkedinExport } from "@/lib/linkedin-export"
import { panelMetricas, youtubeCache, safe } from "@/lib/panel"
import { historial, interacciones, redDiario, REDES, type Publicacion } from "@/lib/publicaciones"
import { agrupar, crecimientoSerie, cubrePrevio, diaHace, diasDe, edadDias, enVentana, fbDiario, formatoDe, mejorGrupo, MUESTRA_MIN, negocioPeriodo, sumaDias, TZ, type Grupo } from "@/lib/panel-analisis"
import Exportar from "../_exportar"
import { acceso, base, Head, Sec, Kpi, Delta, Barras, Linea, SinDatos, Anclas, Alerta, Embudo, Periodo, dif, fmt, fechaCorta, plata } from "../_ui"

export const dynamic = "force-dynamic"

const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
const DIA_LARGO: Record<string, string> = { lun: "lunes", mar: "martes", "mié": "miércoles", jue: "jueves", vie: "viernes", "sáb": "sábados", dom: "domingos" }
const FRANJAS = ["Mañana", "Mediodía", "Tarde", "Noche", "Madrugada"]
const FRANJA_TXT: Record<string, string> = { Mañana: "de 6 a 12", Mediodía: "de 12 a 15", Tarde: "de 15 a 19", Noche: "de 19 a 24", Madrugada: "de 0 a 6" }
const ESTADOS_CONS: Record<string, string> = { nueva: "Nuevas", contactada: "Contactadas", calificada: "Calificadas", convertida: "Pasaron al CRM", descartada: "Descartadas" }
const ESTADOS_PROY: Record<string, string> = { propuesta: "Propuesta", planificado: "Planificado", en_curso: "En curso", pausado: "Pausado", entregado: "Entregado", cancelado: "Cancelado" }

function partes(iso: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(iso))
  return { dia: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(f.find((x) => x.type === "weekday")?.value ?? ""), hora: Number(f.find((x) => x.type === "hour")?.value ?? 0) }
}
const franja = (h: number) => (h < 6 ? "Madrugada" : h < 12 ? "Mañana" : h < 15 ? "Mediodía" : h < 19 ? "Tarde" : "Noche")
const mayor = (...v: (number | null | undefined)[]) => { const x = v.filter((n): n is number => n != null); return x.length ? Math.max(...x) : null }
const filasGrupo = (gs: Grupo[]) => gs.map((g) => ({ k: g.k, v: g.indice ?? 0, t: `×${fmt(g.indice, 1)} · prom. ${fmt(g.media, 1)} · n=${g.n}${g.poca ? " · pocas" : ""}` }))
const gruposDe = (posts: Publicacion[]) => ({
  formato: agrupar(posts, (p) => formatoDe(p.red, p.tipo)).sort((a, b) => (b.indice ?? 0) - (a.indice ?? 0)),
  dia: agrupar(posts, (p) => DIAS[partes(p.fecha!).dia], DIAS),
  franja: agrupar(posts, (p) => franja(partes(p.fecha!).hora), FRANJAS),
})

type Cuenta = {
  id: string; nombre: string; color: string
  seguidores: number | null; crec: number | null; crecNota?: string
  posts: number; postsPrev: number | null; inter: number; interPrev: number | null
  alcance: number | null; ultima: string | null; fuente: string
  /** Cuenta de carga a mano sin nada cargado todavía: sus publicaciones e interacciones se muestran como «—», no como cero. */
  sinCarga?: boolean
}

export default async function Analisis({ searchParams }: { searchParams: { cuenta?: string; dias?: string } }) {
  if (!(await acceso())) return null
  const b = base()
  const dias = diasDe(searchParams.dias)
  const AHORA = Date.now()
  const [ig, histIG, fb, fbD, yt, lix, liJ, ttD, m, pubs, neg] = await Promise.all([
    instagram(), historialSeguidores(180).catch(() => []), facebook(), safe(fbDiario(dias * 2)), safe(youtubeCache()), safe(linkedinExport()), redDiario("linkedin_julio", 180).catch(() => []), redDiario("tiktok", 180).catch(() => []),
    safe(panelMetricas()), historial(180).catch(() => [] as Publicacion[]), negocioPeriodo(dias),
  ])

  /* ───── Publicaciones: ventanas actual y anterior ───── */
  const fechas = pubs.map((p) => p.fecha).filter((x): x is string => !!x)
  const historiaDesde = fechas.length ? fechas.reduce((a, x) => (x < a ? x : a)).slice(0, 10) : null
  const histCubre = cubrePrevio(historiaDesde, dias, AHORA)
  const act = (p: Publicacion) => enVentana(p.fecha, dias, 0, AHORA)
  const ant = (p: Publicacion) => enVentana(p.fecha, dias * 2, dias, AHORA)
  const suma = (x: Publicacion[]) => x.reduce((s, p) => s + interacciones(p), 0)
  const vol = (reds: string[]) => {
    const ps = pubs.filter((p) => reds.includes(p.red)), a = ps.filter(act), p = ps.filter(ant)
    const alc = a.map((x) => x.impresiones ?? x.vistas ?? null).filter((x): x is number => x != null)
    return { posts: a.length, inter: suma(a), alcance: alc.length ? alc.reduce((s, x) => s + x, 0) : null, postsPrev: histCubre ? p.length : null, interPrev: histCubre ? suma(p) : null }
  }
  const ultimaDe = (reds: string[]) => pubs.find((p) => reds.includes(p.red) && p.fecha)?.fecha ?? null
  const parcial = (desde: string | null) => (desde && desde > diaHace(dias - 3, AHORA) ? `desde ${fechaCorta(desde)} (lo registrado)` : undefined)

  /* ───── Cuentas ───── */
  const vIG = vol(["instagram"])
  const cIG = crecimientoSerie(histIG, dias, AHORA)

  const fbRows = fbD ?? []
    const vFB = vol(["facebook"])
  const fbPostsMet = sumaDias(fbRows, (f) => f.publicaciones, dias, 0, AHORA)
  // Facebook: el contador diario de Metricool cuenta de más (41 contra 19 reales); los totales salen del detalle por publicación.
  const fbPosts = vFB.posts
  const fbInter = vFB.inter
  const fbPostsPrev = vFB.postsPrev
  const fbInterPrev = vFB.interPrev
  const cFB = crecimientoSerie(fbRows, dias, AHORA)
  const fbSeg = [...fbRows].reverse().find((f) => f.seguidores != null)?.seguidores ?? (fb.ok ? fb.seguidores : null)

  const vLI = vol(["linkedin"])
  const liCrec = lix && Math.abs((lix.periodo?.dias ?? 0) - dias) <= 7 ? lix.seguidores.nuevos : null

  const vJ = vol(["linkedin_julio"])
  const jCubre = cubrePrevio(liJ[0]?.dia, dias, AHORA)
  const jSeg = [...liJ].reverse().find((x) => x.seguidores != null)?.seguidores ?? null
  const jPosts = mayor(vJ.posts, sumaDias(liJ, (x) => x.publicaciones, dias, 0, AHORA)) ?? 0
  const jInter = mayor(vJ.inter, sumaDias(liJ, (x) => x.interacciones, dias, 0, AHORA)) ?? 0
  const jPostsPrev = mayor(vJ.postsPrev, jCubre ? sumaDias(liJ, (x) => x.publicaciones, dias * 2, dias, AHORA) : null)
  const jInterPrev = mayor(vJ.interPrev, jCubre ? sumaDias(liJ, (x) => x.interacciones, dias * 2, dias, AHORA) : null)

  const vYT = vol(["youtube", "youtube_post"])

  // TikTok: todo sale de la carga a mano (seguidores por día de carga y videos); sin carga queda como «Sin datos»
  const vTT = vol(["tiktok"])
  const ttSeg = [...ttD].reverse().find((x) => x.seguidores != null)?.seguidores ?? null
  const cTT = crecimientoSerie(ttD, dias, AHORA)
  const ttHay = ttSeg != null || pubs.some((p) => p.red === "tiktok")

  const cuentas: Cuenta[] = [
    { id: "instagram", nombre: "Instagram @devisebit", color: "var(--ig)", seguidores: ig.ok ? ig.perfil.seguidores : null, crec: cIG.valor, crecNota: parcial(cIG.desde), posts: vIG.posts, postsPrev: vIG.postsPrev, inter: vIG.inter, interPrev: vIG.interPrev, alcance: null, ultima: ultimaDe(["instagram"]), fuente: ig.ok ? "API de Instagram" : `sin conexión: ${ig.error}` },
    { id: "facebook", nombre: "Facebook · página", color: "var(--fb)", seguidores: fbSeg, crec: cFB.valor, crecNota: parcial(cFB.desde), posts: fbPosts, postsPrev: fbPostsPrev, inter: fbInter, interPrev: fbInterPrev, alcance: sumaDias(fbRows, (f) => f.vistas_contenido, dias, 0, AHORA), ultima: ultimaDe(["facebook"]), fuente: fbRows.length ? "Metricool (tarea diaria)" : fb.ok ? "Metricool" : fb.error },
    { id: "youtube", nombre: "YouTube · ACADEMIA DEVISEBIT", color: "var(--yt)", seguidores: yt?.suscriptores ?? null, crec: null, posts: vYT.posts, postsPrev: vYT.postsPrev, inter: vYT.inter, interPrev: vYT.interPrev, alcance: vYT.alcance ?? (dias === 30 ? yt?.vistas30 ?? null : null), ultima: ultimaDe(["youtube", "youtube_post"]), fuente: yt ? "página pública + tarea diaria" : "sin datos" },
    { id: "linkedin", nombre: "LinkedIn · página DEVISEBIT", color: "var(--li)", seguidores: lix?.seguidores.total ?? null, crec: liCrec, crecNota: liCrec != null ? "exportación de LinkedIn" : undefined, posts: vLI.posts, postsPrev: vLI.postsPrev, inter: vLI.inter, interPrev: vLI.interPrev, alcance: vLI.alcance, ultima: ultimaDe(["linkedin"]), fuente: "Buffer + exportación mensual" },
    { id: "linkedin_julio", nombre: "LinkedIn · Julio Miranda", color: "var(--li)", seguidores: jSeg, crec: sumaDias(liJ, (x) => x.nuevos, dias, 0, AHORA), posts: jPosts, postsPrev: jPostsPrev, inter: jInter, interPrev: jInterPrev, alcance: sumaDias(liJ, (x) => x.impresiones, dias, 0, AHORA) ?? vJ.alcance, ultima: ultimaDe(["linkedin_julio"]), fuente: liJ.length ? "Buffer + exportación del perfil" : "Buffer (subí la exportación del perfil)" },
    { id: "tiktok", nombre: "TikTok @devisebit", color: "var(--tt)", seguidores: ttSeg, crec: cTT.valor, crecNota: parcial(cTT.desde), posts: vTT.posts, postsPrev: vTT.postsPrev, inter: vTT.inter, interPrev: vTT.interPrev, alcance: vTT.alcance, ultima: ultimaDe(["tiktok"]), fuente: ttHay ? "Metricool (tarea diaria) + Buffer" : "todavía no hay datos (llegan solos desde Metricool y Buffer)", sinCarga: !ttHay },
  ]
  const hace = (c: Cuenta) => edadDias(c.ultima, AHORA)
  const estado = (c: Cuenta) => {
    const d = hace(c)
    if (c.seguidores == null && !c.posts) return { t: "Sin datos", col: "var(--muted)", nivel: 0 }
    if (d == null || d > 14) return { t: "Sin publicar hace más de 14 días", col: "var(--red)", nivel: 2 }
    if (d > 7) return { t: "Sin publicar hace más de 7 días", col: "var(--warn)", nivel: 1 }
    return { t: "Activa", col: "var(--ok)", nivel: 0 }
  }
  const sumC = (f: (c: Cuenta) => number | null) => cuentas.reduce((a, c) => a + (f(c) ?? 0), 0)
  const todas = (f: (c: Cuenta) => number | null) => cuentas.every((c) => f(c) != null)
  const audiencia = sumC((c) => c.seguidores)
  const crecTotal = cuentas.some((c) => c.crec != null) ? sumC((c) => c.crec) : null
  const postsT = sumC((c) => c.posts), interT = sumC((c) => c.inter)
  const postsPrevT = todas((c) => c.postsPrev) ? sumC((c) => c.postsPrev) : null
  const interPrevT = todas((c) => c.interPrev) ? sumC((c) => c.interPrev) : null
  const tasa = (c: Cuenta) => (c.posts && c.seguidores && c.seguidores >= 50 ? (c.inter / c.posts / c.seguidores) * 100 : null)

  /* ───── Negocio y web ───── */
  const nv = neg?.visitas ?? [], nc = neg?.consultas ?? []
  const visCub = cubrePrevio(neg?.primeraVisita, dias, AHORA), conCub = cubrePrevio(neg?.primeraConsulta, dias, AHORA)
  const visA = neg ? sumaDias(nv, (x) => x.c, dias, 0, AHORA) : null
  const visP = visCub ? sumaDias(nv, (x) => x.c, dias * 2, dias, AHORA) : null
  const conA = neg ? sumaDias(nc, (x) => x.c, dias, 0, AHORA) ?? 0 : null
  const conP = conCub ? sumaDias(nc, (x) => x.c, dias * 2, dias, AHORA) ?? 0 : null
  const atenA = sumaDias(nc, (x) => x.a, dias, 0, AHORA) ?? 0
  const ganA = sumaDias(nc, (x) => x.g, dias, 0, AHORA) ?? 0
  const crmA = sumaDias(nc, (x) => x.p, dias, 0, AHORA) ?? 0
  const visSerie = nv.filter((x) => x.dia > diaHace(dias, AHORA)).map((x) => ({ x: x.dia, y: Number(x.c) }))
  const c = m?.crm.consultas

  /* ───── Qué funciona ───── */
  const sel = CUENTAS_IDS(searchParams.cuenta) ? cuentas.find((x) => x.id === searchParams.cuenta) : undefined
  const reds = (id: string) => (id === "youtube" ? ["youtube", "youtube_post"] : [id])
  const conFechaTodas = pubs.filter((p) => p.fecha)
  const conFecha = sel ? conFechaTodas.filter((p) => reds(sel.id).includes(p.red)) : conFechaTodas
  const gSel = gruposDe(conFecha)
  const gTodas = sel ? gruposDe(conFechaTodas) : gSel
  const top = [...(sel ? pubs.filter((p) => reds(sel.id).includes(p.red)) : pubs)].sort((a, x) => interacciones(x) - interacciones(a)).slice(0, 10)
  const mFmt = mejorGrupo(gSel.formato), mDia = mejorGrupo(gSel.dia), mFr = mejorGrupo(gSel.franja)
  const nota = (g: Grupo | null, pocas: string) => (g ? `×${fmt(g.indice, 1)} el promedio · n=${g.n}${g.concentracion != null && g.concentracion > 0.5 ? " · depende de una sola publicación" : ""}` : pocas)
  const faltan = `Hacen falta ${MUESTRA_MIN}+ publicaciones por grupo`
  const liga = (cuenta?: string) => { const s = new URLSearchParams(); if (dias !== 30) s.set("dias", String(dias)); if (cuenta) s.set("cuenta", cuenta); const t = s.toString(); return `${b}/analisis${t ? "?" + t : ""}` }

  /* ───── Hallazgos ───── */
  type H = { nivel: "alto" | "medio" | "info" | "ok"; t: string; d?: string; href?: string }
  const hall: H[] = []
  for (const x of cuentas) {
    const e = estado(x)
    if (e.nivel > 0) hall.push({ nivel: e.nivel === 2 ? "alto" : "medio", t: `${x.nombre}: ${e.t.toLowerCase()}`, d: x.ultima ? `Última publicación: ${fechaCorta(x.ultima)} (hace ${Math.floor(hace(x)!)} días).` : "No hay publicaciones registradas.", href: liga(x.id) + "#que-funciona", })
  }
  if (conA != null) {
    const d = dif(conA, conP)
    const canal = neg?.porCanal[0]
    hall.push({ nivel: conA === 0 ? "medio" : "info", t: `Entraron ${fmt(conA)} consulta${conA === 1 ? "" : "s"} en ${dias} días${d != null ? ` (${d > 0 ? "+" : ""}${fmt(d)} frente a los ${dias} anteriores)` : ""}`, d: canal && conA ? `La mayoría llegó por ${canal.k} (${fmt(canal.c)}). ${atenA ? `${fmt(atenA)} ya fueron atendidas` : "Ninguna fue atendida todavía"}${ganA ? ` y ${fmt(ganA)} se ganaron.` : "."}` : undefined, href: `${b}/crm` })
  }
  if (mDia) hall.push({ nivel: "info", t: `Los ${DIA_LARGO[mDia.k] ?? mDia.k} son el día que mejor rinde: ×${fmt(mDia.indice, 1)} el promedio de cada cuenta`, d: `Sale de ${fmt(mDia.n)} publicaciones${mDia.concentracion != null && mDia.concentracion > 0.5 ? ", pero más de la mitad de las interacciones viene de una sola" : ""}. Confirmalo cuando haya más historial.`, href: "#que-funciona" })
  if (mFr) hall.push({ nivel: "info", t: `El horario ${mFr.k.toLowerCase()} (${FRANJA_TXT[mFr.k]}) rinde mejor: ×${fmt(mFr.indice, 1)} el promedio`, d: `Sale de ${fmt(mFr.n)} publicaciones. Hora de Argentina.`, href: "#que-funciona" })
  if (mFmt) hall.push({ nivel: "info", t: `El formato que mejor rinde es ${mFmt.k.toLowerCase()}: ×${fmt(mFmt.indice, 1)} el promedio`, d: `Sale de ${fmt(mFmt.n)} publicaciones.`, href: "#que-funciona" })
  if (!mDia && !mFr && !mFmt) hall.push({ nivel: "info", t: "Todavía no hay muestra suficiente para recomendar día, horario o formato", d: `Se necesitan al menos ${MUESTRA_MIN} publicaciones en cada grupo y dos grupos para comparar. Más publicaciones y más días de historial lo resuelven.` })
  const mejorTop = [...pubs].filter(act).sort((a, x) => interacciones(x) - interacciones(a))[0]
  if (mejorTop && interacciones(mejorTop) > 0) hall.push({ nivel: "info", t: `La publicación con más interacciones del período: ${fmt(interacciones(mejorTop))} en ${REDES[mejorTop.red]?.nombre ?? mejorTop.red}`, d: (mejorTop.texto.split("\n")[0] || "(ver publicación)").slice(0, 140), href: mejorTop.url ?? undefined })
  const masTasa = [...cuentas].filter((x) => tasa(x) != null && x.posts >= MUESTRA_MIN).sort((a, x) => tasa(x)! - tasa(a)!)[0]
  if (masTasa) hall.push({ nivel: "info", t: `${masTasa.nombre} tiene la mejor interacción en relación a su audiencia: ${fmt(tasa(masTasa), 1)}% por publicación`, d: "Interacciones por publicación dividido por seguidores. Sirve para comparar cuentas de distinto tamaño." })
  const crecMayor = [...cuentas].filter((x) => (x.crec ?? 0) > 0).sort((a, x) => (x.crec ?? 0) - (a.crec ?? 0))[0]
  if (crecMayor && crecTotal != null) hall.push({ nivel: "ok", t: `La audiencia creció ${crecTotal > 0 ? "+" : ""}${fmt(crecTotal)} en el período; la que más sumó fue ${crecMayor.nombre} (+${fmt(crecMayor.crec)})` })

  /* ───── Calidad de los datos ───── */
  const calidad: { t: string; d?: string }[] = []
  if (fbPostsMet != null && fbPostsMet > vFB.posts + 2) calidad.push({ t: `Facebook: el contador diario de Metricool suma ${fmt(fbPostsMet)} publicaciones en ${dias} días, pero el detalle publicación por publicación tiene ${fmt(vFB.posts)}.`, d: "El contador de Metricool cuenta más tipos de contenido; el panel usa el detalle, que se puede verificar una por una." })
  const sinTipo = conFechaTodas.filter((p) => formatoDe(p.red, p.tipo) === "Sin clasificar").length
  if (sinTipo) calidad.push({ t: `${fmt(sinTipo)} publicaciones no tienen formato cargado y figuran como «Sin clasificar».`, d: "Mientras no se sepa el formato, no cuentan para decidir cuál rinde mejor." })
  if (!histCubre && historiaDesde) calidad.push({ t: `El historial de publicaciones empieza el ${fechaCorta(historiaDesde)}: todavía no cubre los ${dias} días anteriores.`, d: "Por eso no se muestran variaciones de publicaciones ni de interacciones. Aparecen solas cuando haya historial suficiente." })
  if (!visCub && neg?.primeraVisita) calidad.push({ t: `Las visitas web se registran desde el ${fechaCorta(neg.primeraVisita)}: no alcanzan para comparar con los ${dias} días anteriores.` })
  if (!ig.ok) calidad.push({ t: `Instagram sin conexión: ${ig.error}` })
  else calidad.push({ t: "Instagram no comparte impresiones ni alcance con el permiso actual.", d: "La interacción de Instagram se compara con seguidores, no con impresiones." })
  if (!yt) calidad.push({ t: "YouTube no respondió: se muestra lo último guardado." })

  return (
    <>
      <Head t="Análisis" sub={`Todo el ecosistema DEVISEBIT · últimos ${dias} días, comparados con los ${dias} anteriores cuando hay historial`}>
        <Periodo ruta={`${b}/analisis`} params={{ cuenta: sel?.id }} actual={dias} />
        <Exportar />
      </Head>
      <Anclas items={[["resumen", "Resumen"], ["hallazgos", "Hallazgos"], ["cuentas", "Cuentas"], ["que-funciona", "Qué funciona"], ["negocio", "Negocio"], ["web", "Web"], ["datos", "Calidad de datos"]]} />

      <Sec t="Resumen general" id="resumen" />
      <div className="pc-kpis">
        <Kpi k="Audiencia total" v={fmt(audiencia)} href="#cuentas" delta={<Delta v={crecTotal} />} ft={`seguidores de ${cuentas.filter((x) => x.seguidores != null).length} cuentas`} color="var(--red)" />
        <Kpi k={`Publicaciones (${dias} días)`} v={fmt(postsT)} href={`${b}/publicaciones`} delta={<Delta v={dif(postsT, postsPrevT)} />} ft={`${fmt(postsT / (dias / 7), 1)} por semana · ${cuentas.filter((x) => x.posts).length} cuentas`} />
        <Kpi k={`Interacciones (${dias} días)`} v={fmt(interT)} href="#que-funciona" delta={<Delta v={dif(interT, interPrevT)} />} ft={postsT ? `${fmt(interT / postsT, 1)} por publicación` : ""} color="var(--ok)" />
        <Kpi k={`Visitas web (${dias} días)`} v={visA != null ? fmt(visA) : null} href="#web" delta={<Delta v={dif(visA, visP)} />} serie={visSerie.map((d) => d.y)} color="var(--info)" ft="todos los sitios" />
        <Kpi k={`Consultas (${dias} días)`} v={conA != null ? fmt(conA) : null} href={`${b}/crm`} delta={<Delta v={dif(conA, conP)} />} ft={conA ? `${fmt(crmA)} al CRM · ${fmt(ganA)} ganada${ganA === 1 ? "" : "s"} · ${fmt(atenA)} atendida${atenA === 1 ? "" : "s"}` : ""} color="var(--warn)" />
        <Kpi k="Suscriptores Academia" v={fmt(m?.academia.suscriptores?.act)} href={`${b}/academia`} delta={<Delta v={m?.academia.suscriptores?.d30 ?? null} />} ft="activos · altas en 30 días" color="var(--ok)" />
      </div>
      {!histCubre && historiaDesde ? <SinDatos><b>Sin variaciones de publicaciones todavía.</b> El historial empieza el {fechaCorta(historiaDesde)} y no cubre los {dias} días anteriores. Se muestran solas cuando haya datos para comparar.</SinDatos> : null}

      <Sec t="Hallazgos" id="hallazgos" />
      <div className="pc-hal pc-alertas">
        {hall.map((h, i) => <Alerta key={i} nivel={h.nivel} t={h.t} d={h.d} href={h.href} accion={h.href?.startsWith("http") ? "Abrir" : undefined} />)}
      </div>

      <Sec t="Por cuenta" id="cuentas" />
      <div className="pc-card" style={{ padding: 0 }}>
        <div className="pc-tw"><table className="pc-fija">
          <thead><tr><th>Cuenta</th><th>Estado</th><th className="n">Seguidores</th><th className="n">Crec.</th><th className="n">Publicaciones</th><th className="n">Interacciones</th><th className="n">Por publicación</th><th className="n" title="Interacciones por publicación ÷ seguidores">Sobre seguidores</th><th className="n" title="Impresiones o vistas del período. En Facebook son las visualizaciones de contenido de la página">Alcance / vistas</th><th>Última publicación</th><th>Fuente</th></tr></thead>
          <tbody>{cuentas.map((x) => { const e = estado(x); const t = tasa(x); return (
            <tr key={x.id}>
              <td style={{ whiteSpace: "nowrap" }}><span className="pc-dot" style={{ background: x.color }} /> <a href={liga(x.id) + "#que-funciona"}>{x.nombre}</a></td>
              <td style={{ whiteSpace: "nowrap" }}><span className="pc-tag"><span className="pc-dot" style={{ background: e.col }} />{e.t}</span></td>
              <td className="n">{fmt(x.seguidores)}</td>
              <td className="n" title={x.crecNota}>{x.crec != null ? <Delta v={x.crec} /> : "—"}{x.crecNota ? <span className="pc-sub2">{x.crecNota}</span> : null}</td>
              <td className="n">{x.sinCarga ? "—" : fmt(x.posts)}{x.postsPrev != null && !x.sinCarga ? <span className="pc-sub2"><Delta v={x.posts - x.postsPrev} /></span> : null}</td>
              <td className="n">{x.sinCarga ? "—" : fmt(x.inter)}{x.interPrev != null && !x.sinCarga ? <span className="pc-sub2"><Delta v={x.inter - x.interPrev} /></span> : null}</td>
              <td className="n">{x.posts ? fmt(x.inter / x.posts, 1) : "—"}</td>
              <td className="n">{t != null ? `${fmt(t, t < 1 ? 2 : 1)}%` : "—"}</td>
              <td className="n">{fmt(x.alcance)}</td>
              <td style={{ whiteSpace: "nowrap" }}>{x.ultima ? `${fechaCorta(x.ultima)} (hace ${Math.floor(hace(x)!)} d)` : "—"}</td>
              <td className="pc-muted" style={{ fontSize: 12 }}>{x.fuente}</td>
            </tr>) })}</tbody>
        </table></div>
      </div>

      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Interacciones por publicación</h2><span className="pc-k">{dias} días · publicaciones</span></div>
          {cuentas.some((x) => x.posts) ? <Barras filas={cuentas.filter((x) => x.posts).map((x) => ({ k: x.nombre, v: x.inter / x.posts, t: `${fmt(x.inter / x.posts, 1)} · ${fmt(x.posts)} publ.` }))} color="var(--red)" /> : <div className="pc-empty">Sin publicaciones en {dias} días.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Interacción sobre seguidores</h2><span className="pc-k">por publicación</span></div>
          {cuentas.some((x) => tasa(x) != null) ? <Barras filas={cuentas.filter((x) => tasa(x) != null).map((x) => ({ k: x.nombre, v: tasa(x)!, t: `${fmt(tasa(x), tasa(x)! < 1 ? 2 : 1)}%` }))} color="var(--ok)" /> : <div className="pc-empty">Sin datos.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores por cuenta</h2></div>
          <Barras filas={cuentas.filter((x) => x.seguidores != null).map((x) => ({ k: x.nombre, v: x.seguidores! }))} color="var(--info)" />
        </div>
      </div>

      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores de Instagram</h2><span className="pc-k">foto diaria</span></div>
          {histIG.length > 1 ? <Linea puntos={histIG.map((h) => ({ x: h.dia, y: h.seguidores }))} color="var(--ig)" titulo="Seguidores de Instagram" /> : <div className="pc-empty">Se registra una foto por día.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores de Facebook</h2><span className="pc-k">Metricool</span></div>
          {fbRows.filter((d) => d.seguidores != null).length > 1 ? <Linea puntos={fbRows.filter((d) => d.seguidores != null).map((d) => ({ x: d.dia, y: Number(d.seguidores) }))} color="var(--fb)" titulo="Seguidores de Facebook" /> : <div className="pc-empty">Sin serie todavía.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Seguidores de LinkedIn · Julio</h2><span className="pc-k">exportación</span></div>
          {liJ.filter((d) => d.seguidores != null).length > 1 ? <Linea puntos={liJ.filter((d) => d.seguidores != null).map((d) => ({ x: d.dia, y: Number(d.seguidores) }))} color="var(--li)" titulo="Seguidores de LinkedIn de Julio" /> : <div className="pc-empty">Sin serie todavía.</div>}
        </div>
      </div>

      <Sec t={`Qué funciona · ${sel ? sel.nombre : "todas las cuentas"}`} id="que-funciona" />
      <div className="pc-seg" role="group" aria-label="Cuenta">
        <a href={liga() + "#que-funciona"} aria-current={!sel ? "true" : undefined}>Todas</a>
        {cuentas.map((x) => <a key={x.id} href={liga(x.id) + "#que-funciona"} aria-current={sel?.id === x.id ? "true" : undefined}>{x.nombre}</a>)}
      </div>
      <div className="pc-kpis">
        <Kpi k="Mejor formato" v={mFmt?.k ?? null} ft={nota(mFmt, faltan)} color="var(--ok)" />
        <Kpi k="Mejor día" v={mDia ? DIA_LARGO[mDia.k] ?? mDia.k : null} ft={nota(mDia, faltan)} color="var(--info)" />
        <Kpi k="Mejor horario" v={mFr ? `${mFr.k} · ${FRANJA_TXT[mFr.k]}` : null} ft={nota(mFr, faltan)} color="var(--info)" />
        <Kpi k="Publicaciones analizadas" v={fmt(conFecha.length)} ft={`historial de 180 días${gSel.formato.some((g) => g.k === "Sin clasificar") ? " · algunas sin formato" : ""}`} />
      </div>
      <p className="pc-sub">Cada barra es un <b>índice de rendimiento</b>: ×1,0 es el promedio de interacciones de su propia cuenta. Así una cuenta grande no tapa a una chica. Los grupos con menos de {MUESTRA_MIN} publicaciones se muestran pero no se usan para recomendar.</p>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Por formato</h2></div>{gSel.formato.length ? <Barras filas={filasGrupo(gSel.formato)} color="var(--red)" /> : <div className="pc-empty">Sin datos.</div>}</div>
        <div className="pc-card"><div className="pc-ch"><h2>Por día</h2></div>{gSel.dia.length ? <Barras filas={filasGrupo(gSel.dia).map((f) => ({ ...f, k: DIA_LARGO[f.k] ?? f.k }))} color="var(--info)" /> : <div className="pc-empty">Sin datos.</div>}</div>
        <div className="pc-card"><div className="pc-ch"><h2>Por horario</h2></div>{gSel.franja.length ? <Barras filas={filasGrupo(gSel.franja).map((f) => ({ ...f, k: `${f.k} · ${FRANJA_TXT[f.k] ?? ""}` }))} color="var(--ok)" /> : <div className="pc-empty">Sin datos.</div>}</div>
      </div>
      <div className="pc-card"><div className="pc-ch"><h2>Las 10 con más interacciones</h2><span className="pc-k">180 días · {sel ? sel.nombre : "todas las cuentas"}</span></div>
        {top.length ? (
          <div className="pc-list">{top.map((p) => (
            <a key={p.red + p.id} className="pc-item" href={p.url ?? "#"} target="_blank" rel="noreferrer">
              <span className="t">{(p.texto.split("\n")[0] || "(ver publicación)").slice(0, 110)}</span>
              <span className="m"><span><span className="pc-dot" style={{ background: REDES[p.red]?.color }} /> {REDES[p.red]?.nombre} · {formatoDe(p.red, p.tipo)} · {p.fecha ? fechaCorta(p.fecha) : "—"}</span><span><b>{fmt(interacciones(p))}</b> interacciones{p.impresiones ?? p.vistas ? ` · ${fmt(p.impresiones ?? p.vistas)} imp./vistas` : ""}</span></span>
            </a>
          ))}</div>
        ) : <div className="pc-empty">Todavía no hay publicaciones en el historial.</div>}
      </div>

      <Sec t="Negocio" id="negocio" />
      <div className="pc-card"><div className="pc-ch"><h2>Del visitante a la venta</h2><span className="pc-k">{dias} días · todos los sitios</span></div>
        {neg ? <Embudo pasos={[{ k: "Visitas web", v: visA }, { k: "Consultas", v: conA }, { k: "Atendidas", v: atenA, nota: "con respuesta del equipo" }, { k: "Ganadas", v: ganA, nota: "contacto en etapa Ganado del CRM" }]} /> : <div className="pc-empty">Sin datos de visitas ni de consultas.</div>}
      </div>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por estado</h2><span className="pc-k">histórico</span><a className="pc-btn" href={`${b}/crm`}>CRM</a></div>
          {c && Object.keys(c.porEstado).length ? <Barras filas={Object.entries(ESTADOS_CONS).map(([k, t]) => ({ k: t, v: Number(c.porEstado[k] ?? 0) }))} /> : <div className="pc-empty">Sin consultas.</div>}
          {c?.esperanHumano ? <p className="pc-sub" style={{ marginTop: 10 }}><b style={{ color: "var(--warn)" }}>{fmt(c.esperanHumano)}</b> esperan a una persona.</p> : null}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por canal</h2><span className="pc-k">{dias} días</span></div>
          {neg?.porCanal.length ? <Barras filas={neg.porCanal.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--warn)" /> : <div className="pc-empty">Sin consultas en {dias} días.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Consultas por fuente</h2><span className="pc-k">{dias} días</span></div>
          {neg?.porFuente.length ? <Barras filas={neg.porFuente.map((x) => ({ k: x.k, v: Number(x.c) }))} color="var(--warn)" /> : <div className="pc-empty">Sin consultas en {dias} días.</div>}
        </div>
      </div>
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Contactos por etapa</h2></div>
          {m && Object.keys(m.crm.contactos.porEtapa).length ? <Barras filas={Object.entries(m.crm.contactos.porEtapa).map(([k, v]) => ({ k, v: Number(v ?? 0) })).sort((a, x) => x.v - a.v)} color="var(--info)" /> : <div className="pc-empty">Sin contactos.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Proyectos por estado</h2></div>
          {m && Object.keys(m.crm.proyectos.porEstado).length ? <Barras filas={Object.entries(m.crm.proyectos.porEstado).map(([k, v]) => ({ k: ESTADOS_PROY[k] ?? k, v: Number(v?.c ?? 0), t: `${fmt(v?.c)}${v?.monto ? " · " + plata(v.monto) : ""}` }))} color="var(--ok)" /> : <div className="pc-empty">Sin proyectos.</div>}
        </div>
      </div>

      <Sec t="Web" id="web" />
      <div className="pc-card"><div className="pc-ch"><h2>Visitas diarias a los sitios</h2><span className="pc-k">{dias} días{visA != null ? ` · ${fmt(visA)} en total` : ""}</span></div>
        {visSerie.length ? <Linea puntos={visSerie} color="var(--info)" titulo="Visitas diarias" /> : <div className="pc-empty">Todavía no hay visitas registradas.</div>}
      </div>
      <div className="pc-grid pc-g3">
        <div className="pc-card"><div className="pc-ch"><h2>Por sitio</h2><span className="pc-k">30 días</span></div>
          {m?.visitas.sitios.length ? <Barras filas={m.visitas.sitios.map((x) => ({ k: x.host, v: Number(x.d30), t: `${fmt(x.d30)} · ${fmt(x.d7)} en 7 d` }))} color="var(--info)" /> : <div className="pc-empty">Sin visitas.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Páginas más vistas</h2><span className="pc-k">30 días</span></div>
          {m?.visitas.paginas.length ? <Barras filas={m.visitas.paginas.map((x) => ({ k: `${x.host.replace(/^www\./, "")}${x.path === "/" ? "" : x.path}`, v: Number(x.c) }))} color="var(--info)" /> : <div className="pc-empty">Sin visitas.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>De dónde llegan</h2><span className="pc-k">30 días</span></div>
          {m?.visitas.origenes.length ? <Barras filas={m.visitas.origenes.map((x) => ({ k: x.ref, v: Number(x.c) }))} color="var(--violet)" /> : <div className="pc-empty">Sin datos de origen.</div>}
        </div>
      </div>

      <Sec t="Calidad de los datos" id="datos" />
      <div className="pc-hal pc-alertas">
        {calidad.map((x, i) => <Alerta key={i} nivel="info" t={x.t} d={x.d} />)}
      </div>
      <p className="pc-sub">Interacciones = me gusta + comentarios + compartidos + clics + votos (o lo que informa cada red). Las variaciones se calculan contra los {dias} días anteriores y solo aparecen cuando el historial los cubre. El estado de cada cuenta se calcula por la fecha de su última publicación.</p>
    </>
  )
}

function CUENTAS_IDS(v?: string) { return !!v && ["instagram", "facebook", "youtube", "linkedin", "linkedin_julio", "tiktok"].includes(v) }
