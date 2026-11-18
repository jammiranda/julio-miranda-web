import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q, one } from "@/lib/db"
import { isoD, ESTADOS_PROS, CANALES_PROS, TIPOS_PROS } from "@/lib/gestion"
import { prospeccionPanel, CANAL_N, CUPO_DIA } from "@/lib/prospeccion"
import { accionAcercamiento } from "@/lib/prospeccion-acciones"
import { fecha, hoyISO } from "@/lib/util"
import { TablaRegistro, Aviso, Kpi } from "@/components/Registro"
import Indice from "@/components/Indice"
import Lote from "@/components/Lote"
import { bloques } from "@/lib/prospeccion-bloques"

export const dynamic = "force-dynamic"

/**
 * ACERCAMIENTOS (antes «Prospección», renombrado el 17/11/2026 a pedido de Julio).
 * Cada invitación, mensaje de LinkedIn, mail o postulación, ordenado por DÍA: qué toca hoy, qué viene, qué se hizo.
 * La ruta sigue siendo /prospeccion (y la tabla g_prospeccion) para no romper las tareas programadas ni la API.
 */

type SP = { s?: string; cerrados?: string; editar?: string; nuevo?: string; ok?: string; error?: string; vista?: string; b?: string; ver?: string; todos?: string; sug?: string }
const SUG: Record<string, string> = { si: "Sí", tal: "Tal vez", no: "No", otro: "Otro" }
const sugDe = (notas: string | null) => { const m = /SUGERENCIA:\s*\n\s*(\S+)/i.exec(notas ?? ""); const w = (m?.[1] ?? "").toLowerCase(); return w.startsWith("sí") || w.startsWith("si") ? "si" : w.startsWith("tal") ? "tal" : w.startsWith("no") ? "no" : "otro" }
const HOY = "(now() at time zone 'America/Argentina/Buenos_Aires')::date"
const VISTAS = ["hoy", "foco", "tablero", "decidir", "proximos", "esperando", "hecho", "todos"] as const
type Vista = (typeof VISTAS)[number]

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—")
const diaLargo = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric", timeZone: "America/Argentina/Buenos_Aires" })

/** Qué entra en cada vista (todas sobre g_prospeccion). */
const COND: Record<Vista, string> = {
  hoy: `(estado='respondio' and (seguimiento is null or seguimiento <= ${HOY}))
        or (estado='reunion')
        or (estado='enviado' and seguimiento <= ${HOY})
        or (estado='borrador' and seguimiento <= ${HOY})`,
  decidir: `estado='borrador' and seguimiento is null`,
  proximos: `(estado='borrador' and seguimiento > ${HOY}) or (estado='respondio' and seguimiento > ${HOY})`,
  esperando: `estado='enviado' and (seguimiento is null or seguimiento > ${HOY})`,
  // Solo lo que hizo una persona (botones o edición), no las altas ni las cargas de las tareas
  hecho: `id in (select prospeccion_id from g_prospeccion_eventos where tipo in ('estado','seguimiento','contestado','aprobado','pospuesto','nota') and (fecha at time zone 'America/Argentina/Buenos_Aires')::date = ${HOY})`,
  todos: `true`,
  foco: `true`,
  tablero: `estado in ('borrador','enviado','respondio','reunion')`,
}
COND.foco = COND.hoy
const ACC_LOTE: Record<Vista, { acc: string; t: string; p?: boolean }[]> = {
  decidir: [{ acc: "si", t: "✓ Sí, escribirles", p: true }, { acc: "hoy", t: "Escribir hoy" }, { acc: "enviado", t: "Ya los envié" }, { acc: "no", t: "✕ No" }],
  hoy: [{ acc: "enviado", t: "✓ Enviados", p: true }, { acc: "seguimiento", t: "Seguimiento enviado" }, { acc: "contestado", t: "Les contesté" }, { acc: "manana", t: "Pasar a mañana" }, { acc: "descartar", t: "Descartar" }],
  proximos: [{ acc: "hoy", t: "Pasar a hoy", p: true }, { acc: "descartar", t: "Descartar" }],
  esperando: [{ acc: "seguimiento", t: "Seguimiento enviado", p: true }, { acc: "respondio", t: "Respondieron" }, { acc: "sin_respuesta", t: "Cerrar sin respuesta" }],
  hecho: [{ acc: "descartar", t: "Descartar" }],
  todos: [{ acc: "respondio", t: "Respondieron" }, { acc: "hoy", t: "Pasar a hoy" }, { acc: "reabrir", t: "Reabrir (cerrados)" }, { acc: "descartar", t: "Descartar" }],
  foco: [],
  tablero: [{ acc: "enviado", t: "✓ Enviados", p: true }, { acc: "respondio", t: "Respondieron" }, { acc: "hoy", t: "Pasar a hoy" }, { acc: "descartar", t: "Descartar" }],
}
const ORDEN = `case estado when 'respondio' then 0 when 'reunion' then 1 when 'enviado' then 2 when 'borrador' then 3 else 4 end, seguimiento nulls last, coalesce(enviado_en, creado::date), id`

export default async function Acercamientos({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir()
  const edita = u.rol === "gerente" || u.rol === "coordinacion"
  const b = (sp.b ?? "").trim()
  // Con búsqueda se busca en TODO (también cerrados), sin importar la vista
  const vista: Vista = b ? "todos" : (VISTAS as readonly string[]).includes(sp.vista ?? "") ? (sp.vista as Vista) : "hoy"

  const [m, cuentas, hechoHoy] = await Promise.all([
    prospeccionPanel(),
    one<Record<Vista, number>>(`select ${VISTAS.map((v) => `count(*) filter (where ${COND[v]})::int "${v}"`).join(", ")} from g_prospeccion`),
    one<{ enviados: number; seguimientos: number; contestados: number; decididos: number }>(`select
        count(*) filter (where tipo='estado' and detalle like 'Borrador → Enviado%')::int enviados,
        count(*) filter (where tipo='seguimiento')::int seguimientos,
        count(*) filter (where tipo in ('contestado'))::int contestados,
        count(*) filter (where tipo in ('aprobado') or (tipo='estado' and detalle like 'Borrador → Descartado%'))::int decididos
      from g_prospeccion_eventos where (fecha at time zone 'America/Argentina/Buenos_Aires')::date = ${HOY}`),
  ])

  const params: unknown[] = []
  let where = `(${COND[vista]})`
  if (b) {
    params.push(`%${b}%`)
    where += ` and (coalesce(persona,'') || ' ' || coalesce(organizacion,'') || ' ' || coalesce(cargo,'') || ' ' || coalesce(destino,'') || ' ' || coalesce(campania,'') || ' ' || coalesce(notas,'')) ilike $1`
  }
  const todas = await q<any>(`select * from g_prospeccion where ${where} order by ${ORDEN} limit ${vista === "tablero" ? 3000 : 600}`, params)
  const sug = vista === "decidir" && SUG[sp.sug ?? ""] ? sp.sug! : ""
  const cantSug: Record<string, number> = {}
  if (vista === "decidir") for (const r of todas) { const k = sugDe(r.notas); cantSug[k] = (cantSug[k] ?? 0) + 1 }
  const hoyD = hoyISO()
  // Pendiente = todavía hay algo para hacer con este contacto hoy (o decidir). Lo demás ya está resuelto por ahora.
  const pend = (r: any) => { const d = isoD(r.seguimiento); return r.estado === "reunion" || (r.estado === "borrador" && (!d || d <= hoyD)) || (r.estado === "respondio" && (!d || d <= hoyD)) || (r.estado === "enviado" && !!d && d <= hoyD) }
  const salto = Math.max(0, Number(sp.s) || 0)
  const base = sug ? todas.filter((r) => sugDe(r.notas) === sug) : todas
  // En la búsqueda, lo ya resuelto (contestado, enviado en espera, cerrado) se pliega abajo: la lista se va limpiando
  const resueltas = b ? base.filter((r) => !pend(r)) : []
  const filas = vista === "foco" ? base.slice(Math.min(salto, Math.max(0, base.length - 1))).slice(0, 1) : b && !sp.cerrados ? base.filter(pend) : base

  const editar = Number(sp.editar) || null
  const historia = await q<any>(
    editar
      ? "select e.*, p.organizacion, p.persona from g_prospeccion_eventos e join g_prospeccion p on p.id=e.prospeccion_id where p.id=$1 order by e.fecha desc, e.id desc"
      : `select e.*, p.organizacion, p.persona from g_prospeccion_eventos e join g_prospeccion p on p.id=e.prospeccion_id
         where e.tipo in ('estado','seguimiento','contestado','aprobado','pospuesto','nota') and (e.fecha at time zone 'America/Argentina/Buenos_Aires')::date = ${HOY} order by e.fecha desc, e.id desc limit 60`,
    editar ? [editar] : [],
  )

  const url = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const base = { vista: vista === "hoy" ? undefined : vista, s: vista === "foco" && salto ? String(salto) : undefined, cerrados: sp.cerrados || undefined, b: b || undefined, sug: sug || undefined, ...extra }
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v)
    const s = p.toString()
    return `/prospeccion${s ? "?" + s : ""}`
  }
  const volver = url({})
  const C = cuentas ?? ({} as Record<Vista, number>)
  const H = hechoHoy ?? { enviados: 0, seguimientos: 0, contestados: 0, decididos: 0 }
  const tabs: { v: Vista; n: string; d: string }[] = [
    { v: "hoy", n: "Hoy", d: "Contestar, seguir y enviar" },
    { v: "foco", n: "De a uno", d: "Uno por vez: resolvés y pasa al siguiente" },
    { v: "tablero", n: "Tablero", d: "Todo por etapa, en columnas" },
    { v: "decidir", n: "Para decidir", d: "¿Le escribimos o no?" },
    { v: "proximos", n: "Próximos días", d: "Ya planificados" },
    { v: "esperando", n: "Esperando respuesta", d: "Enviados, sin plazo vencido" },
    { v: "hecho", n: "Hecho hoy", d: "Lo que se movió hoy" },
    { v: "todos", n: "Todos", d: "Incluye cerrados" },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Ventas</div><h1 className="m-0">Acercamientos</h1>
          <p>Invitaciones, mensajes de LinkedIn, mails y seguimientos, día por día. Arrancá por <b>Hoy</b>: primero contestar, después seguimientos, después mensajes nuevos. Cada botón queda anotado en la historia.</p></div>
        {edita && <div className="pag-acc"><Link href={`${volver}${volver.includes("?") ? "&" : "?"}nuevo=1`} className="btn-p">+ Contacto</Link></div>}
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Resumen" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi t="Para hacer hoy" v={C.hoy ?? 0} d={`${C.decidir ?? 0} esperan tu sí o no`} tono={(C.hoy ?? 0) ? "ambar" : undefined} />
        <Kpi t="Hecho hoy" v={H.enviados + H.seguimientos + H.contestados} d={`${H.enviados} enviados · ${H.seguimientos} seguimientos · ${H.contestados} contestados`} tono={H.enviados + H.seguimientos + H.contestados ? "verde" : undefined} />
        <Kpi t="Enviados (total)" v={m.salieron} d={`${m.E.borrador ?? 0} todavía en borrador`} />
        <Kpi t="Respondieron" v={m.respondieron} d={`${pct(m.respondieron, m.salieron)} de los enviados`} tono={m.respondieron ? "verde" : undefined} />
        <Kpi t="Reuniones" v={(m.E.reunion ?? 0) + (m.E.ganado ?? 0)} d={`${m.E.ganado ?? 0} ganados`} />
      </section>

      <nav aria-label="Vistas" className="flex flex-wrap gap-1 border-b border-[var(--borde)]">
        {tabs.map((t) => {
          const on = t.v === vista && !b
          return (
            <Link key={t.v} href={`/prospeccion${t.v === "hoy" ? "" : `?vista=${t.v}`}`} aria-current={on ? "page" : undefined} title={t.d}
              className={`px-3.5 py-2 -mb-px text-sm font-semibold border-b-2 ${on ? "border-[var(--ac)] text-[var(--tinta)]" : "border-transparent text-[var(--gris)] hover:text-[var(--tinta)]"}`}>
              {t.n}<span className="ml-1.5 text-xs font-bold text-[var(--gris)] tabular-nums">{C[t.v] ?? 0}</span>
            </Link>
          )
        })}
      </nav>

      <form method="get" action="/prospeccion" className="flex flex-wrap items-center gap-2" role="search">
        <label htmlFor="b-acerc" className="sr-only">Buscar en todos los acercamientos</label>
        <input id="b-acerc" name="b" type="search" defaultValue={b} placeholder="Buscar en todo: nombre, empresa, cargo, campaña…" className="inp !w-[min(100%,420px)]" />
        <button className="btn-s py-2 px-4 text-sm">Buscar</button>
        {b && <><span className="text-sm text-[var(--gris)]">{sp.cerrados ? `${base.length} resultados para «${b}» (todos los estados)` : `${filas.length} pendientes para «${b}»`}{!sp.cerrados && resueltas.length > 0 && <> · <Link className="underline" href={`/prospeccion?b=${encodeURIComponent(b)}&cerrados=1`}>ver también los {resueltas.length} ya resueltos o cerrados</Link></>}</span>
          <Link href="/prospeccion" className="text-sm underline text-[var(--gris)]">Limpiar</Link></>}
      </form>

      {vista === "decidir" && !b && (
        <>
          <p className="m-0 text-sm text-[var(--gris)]">Filtrá por sugerencia, tildá varios (o «Seleccionar todos») y resolvelos de una: <b>Sí, escribirles</b> los reparte de a {CUPO_DIA} por día hábil y aparecen en <b>Hoy</b> el día que toca; <b>No</b> los saca de la lista. Si ya les escribiste por tu cuenta, tocá <b>Ya lo envié</b> (o <b>Ya respondió</b>) y pasan directo a Esperando o a Respondieron.</p>
          <nav aria-label="Filtrar por sugerencia" className="flex flex-wrap gap-1.5">
            {[["", "Todos", todas.length], ...Object.entries(SUG).map(([k, n]) => [k, n, cantSug[k] ?? 0])].filter((x) => x[0] === "" || Number(x[2]) > 0).map(([k, n, c]) => (
              <Link key={String(k)} href={`/prospeccion?vista=decidir${k ? `&sug=${k}` : ""}`} aria-current={sug === k ? "true" : undefined}
                className={`chip text-sm px-3 py-1.5 border ${sug === k ? "bg-[var(--tinta)] text-white border-[var(--tinta)]" : "bg-[var(--sup)] border-[var(--borde-fuerte)]"}`}>{n} · {c}</Link>
            ))}
          </nav>
        </>
      )}
      {vista === "foco" && base.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--sup-2)] border border-[var(--borde)] px-4 py-3">
          <span className="text-sm"><b>Quedan {base.length} para hoy.</b> Resolvé este con uno de sus botones y aparece el siguiente solo.</span>
          {base.length > 1 && <Link href={`/prospeccion?vista=foco&s=${salto + 1 >= base.length ? 0 : salto + 1}`} className="btn-s py-2 px-4 text-sm">Saltar por ahora →</Link>}
        </div>
      )}
      {vista === "hecho" && <p className="m-0 text-sm rounded-xl bg-[var(--sup-2)] border border-[var(--borde)] px-4 py-3"><b>Esto es el registro de lo que ya resolviste hoy.</b> No hay nada para hacer acá: lo pendiente está en «Hoy» o «De a uno».</p>}
      {edita && filas.length > 0 && ACC_LOTE[vista].length > 0 && vista !== "hecho" && <Lote volver={volver} acciones={ACC_LOTE[vista]} />}

      {vista === "tablero" ? <Tablero filas={filas} volver={volver} sel={edita} /> : <>
      <Indice sel="h2.grupo" filtra="article.card" placeholder="Filtrar esta vista" />
      <TablaRegistro clave="prospeccion" filas={filas} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar={edita}
        abierto={(r) => !["ganado", "sin_respuesta", "descartado"].includes(r.estado)}
        copiar={textoParaCopiar}
        tarjeta={(r) => <Tarjeta r={r} compacta={vista === "decidir"} sel={edita && vista !== "foco" && vista !== "hecho"} />}
        grupo={(r) => grupoDe(r, vista)}
        enlace={(r) => enlaceDe(r)}
        acciones={(r) => vista === "hecho" ? null : <Acciones r={r} volver={volver} />}
        vacio={b && resueltas.length ? `Nada pendiente con «${b}»: los ${resueltas.length} que coinciden ya están resueltos o cerrados (link de arriba para verlos).` : vacioDe(vista, b)} /></>}

      <section className="card" aria-label="Historia">
        <h2 className="m-0 mb-3 text-base">{editar ? `Historia de ${historia[0]?.persona ?? historia[0]?.organizacion ?? "este contacto"}` : `Lo que se hizo hoy (${historia.length})`}</h2>
        {historia.length ? (
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {historia.map((e) => (
              <li key={e.id} className="text-sm border-b border-[var(--borde)] pb-2">
                <b>{new Date(e.fecha).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}</b>
                {!editar && <> · {e.persona || e.organizacion}{e.persona && e.organizacion ? ` (${e.organizacion})` : ""}</>} · {e.detalle ?? e.tipo}
                {e.por ? <span className="text-[var(--gris)]"> · {e.por}</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="vacio">Hoy todavía no se movió nada.</p>}
      </section>
      <p className="text-xs text-[var(--gris)]">Canales: {Object.values(CANAL_N).join(", ")}. LinkedIn se envía siempre a mano desde la cuenta de Julio; acá se registra con un clic.</p>
    </div>
  )
}

const esEmail = (d: string | null) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((d ?? "").trim())
/** Botón principal de la tarjeta: perfil de LinkedIn o WhatsApp con el mensaje ya escrito. */
function enlaceDe(r: any): { href: string; etiqueta: string } | null {
  if (/^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(r.destino ?? "")) return { href: r.destino, etiqueta: "Abrir perfil" }
  const tel = String(r.destino ?? "").replace(/\D/g, "")
  if (r.canal === "whatsapp" && tel.length >= 10) { const t = textoParaCopiar(r); return { href: `https://wa.me/${tel}${t ? `?text=${encodeURIComponent(t.texto)}` : ""}`, etiqueta: "Abrir WhatsApp con el mensaje" } }
  return null
}

function vacioDe(v: Vista, b: string) {
  if (b) return `No hay nada que coincida con «${b}».`
  return {
    hoy: "Nada pendiente para hoy. Mirá «Para decidir» o «Próximos días».",
    decidir: "No hay contactos esperando tu decisión.",
    proximos: "No hay nada planificado para los próximos días.",
    esperando: "No hay enviados esperando respuesta.",
    hecho: "Hoy todavía no se movió nada.",
    todos: "Sin contactos cargados.",
    tablero: "No hay acercamientos abiertos.",
    foco: "¡Listo! No queda nada pendiente para hoy.",
  }[v]
}

/** Bloques de las notas: «ENCABEZADO:» en una línea y el texto debajo, separados por una línea en blanco. */

/** Qué copiar según el estado. */
function textoParaCopiar(r: any): { texto: string; etiqueta: string } | null {
  if (!r.notas) return null
  const b = bloques(String(r.notas))
  if (r.estado === "borrador") {
    if (b.invitacion) return { texto: b.invitacion, etiqueta: "Copiar invitación" }
    if (b.mensaje) return { texto: b.mensaje, etiqueta: "Copiar mensaje" }
  }
  if (r.estado === "enviado") {
    if (b.seguimiento) return { texto: b.seguimiento, etiqueta: "Copiar seguimiento" }
    if (b.paso2) return { texto: b.paso2, etiqueta: "Copiar mensaje" }
  }
  if (r.estado === "respondio" && b.respuesta) return { texto: b.respuesta, etiqueta: "Copiar respuesta" }
  return null
}

const chip = (ops: { v: string; n: string; c?: string }[], v: string) => { const o = ops.find((x) => x.v === v); return o ? <span className={`chip ${o.c ?? ""}`}>{o.n}</span> : null }

/** Grupo de la lista según la vista: lo que hay que hacer y cuándo. */
function grupoDe(r: any, vista: Vista): string {
  const d = isoD(r.seguimiento)
  const hoy = hoyISO()
  if (vista === "decidir") return r.campania || "Sin campaña"
  if (vista === "hecho" || vista === "todos") return ESTADOS_PROS.find((o) => o.v === r.estado)?.n ?? r.estado
  if (vista === "proximos") return d ? diaLargo(d) : "Sin fecha"
  if (vista === "esperando") return d ? `Seguimiento el ${diaLargo(d)}` : "Sin fecha de seguimiento"
  if (r.estado === "respondio") return "1 · Contestar (respondieron)"
  if (r.estado === "reunion") return "2 · Con reunión: preparar o confirmar"
  if (r.estado === "enviado") return "3 · Seguimientos de hoy"
  return d && d < hoy ? "4 · Mensajes nuevos · atrasados" : "5 · Mensajes nuevos · hoy"
}

/** Tablero: una columna por etapa, con tarjetas cortas y sus botones. */
function Tablero({ filas, volver, sel }: { filas: any[]; volver: string; sel: boolean }) {
  const cols: { t: string; d: string; v: string; f: (r: any) => boolean }[] = [
    { t: "Para decidir", d: "¿Le escribimos?", v: "decidir", f: (r) => r.estado === "borrador" && !r.seguimiento },
    { t: "Para escribir", d: "Aprobados, por fecha", v: "proximos", f: (r) => r.estado === "borrador" && !!r.seguimiento },
    { t: "Esperando respuesta", d: "Ya enviados", v: "esperando", f: (r) => r.estado === "enviado" },
    { t: "Respondieron", d: "Hay que contestar", v: "hoy", f: (r) => r.estado === "respondio" },
    { t: "Reunión", d: "Preparar o confirmar", v: "hoy", f: (r) => r.estado === "reunion" },
  ]
  return (
    <div className="flex gap-3 overflow-x-auto pb-3" role="list" aria-label="Tablero de acercamientos">
      {cols.map((c) => {
        const lista = filas.filter(c.f).sort((a, b) => String(isoD(a.seguimiento) ?? "").localeCompare(String(isoD(b.seguimiento) ?? "")))
        return (
          <section key={c.t} role="listitem" className="shrink-0 w-[300px] flex flex-col gap-2 rounded-2xl bg-[var(--sup-2)] border border-[var(--borde)] p-2.5">
            <header className="px-1"><h2 className="m-0 text-sm font-bold">{c.t} <span className="text-[var(--gris)] tabular-nums">{lista.length}</span></h2><p className="m-0 text-xs text-[var(--gris)]">{c.d}</p></header>
            {lista.slice(0, 40).map((r) => {
              const org = r.organizacion && !/^sin dato/i.test(r.organizacion) ? r.organizacion : ""
              const titulo = r.persona || org || "Sin nombre"
              const d = isoD(r.seguimiento)
              const li = /^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(r.destino ?? "") ? r.destino : null
              return (
                <article key={r.id} className="card !p-3 flex flex-col gap-2" aria-label={titulo}>
                  <div className="flex items-start gap-2">
                    {sel && <input type="checkbox" form="lote" name="ids" value={r.id} aria-label={`Seleccionar a ${titulo}`} className="w-4 h-4 mt-1 shrink-0 cursor-pointer" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm leading-snug">{titulo}</div>
                      {(r.cargo || (r.persona && org)) && <div className="text-xs text-[var(--gris)] line-clamp-2">{[r.cargo, r.persona ? org : ""].filter(Boolean).join(" · ")}</div>}
                      {d && <div className="text-xs text-[var(--gris)] mt-0.5">{r.estado === "borrador" ? "Enviar" : "Seguimiento"} {fecha(d)}</div>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 [&_button]:!py-1 [&_button]:!px-2.5 [&_button]:!text-xs">
                    {li && <a href={li} target="_blank" rel="noreferrer" className="btn-s !py-1 !px-2.5 !text-xs">Perfil ↗</a>}
                    <Acciones r={r} volver={volver} />
                    <Link href={`/prospeccion?b=${encodeURIComponent(titulo)}&editar=${r.id}`} className="text-xs underline text-[var(--gris)] self-center">Ver / editar</Link>
                  </div>
                </article>
              )
            })}
            {lista.length > 40 && <Link href={`/prospeccion?vista=${c.v}`} className="text-xs underline text-[var(--gris)] px-1">Ver los {lista.length}</Link>}
          </section>
        )
      })}
    </div>
  )
}

/** Botones según el estado: un clic y queda en la historia. */
function Acciones({ r, volver }: { r: any; volver: string }) {
  const B = ({ acc, t, p }: { acc: string; t: string; p?: boolean }) => (
    <form action={accionAcercamiento}>
      <input type="hidden" name="_id" value={r.id} /><input type="hidden" name="_acc" value={acc} /><input type="hidden" name="_volver" value={volver} />
      <button className={`${p ? "btn-p" : "btn-s"} py-2 px-3.5 text-sm`}>{t}</button>
    </form>
  )
  const d = isoD(r.seguimiento)
  if (r.estado === "borrador" && !d) return <><B acc="si" t="✓ Sí, escribirle" p /><B acc="enviado" t="Ya lo envié" /><B acc="respondio" t="Ya respondió" /><B acc="no" t="✕ No" /></>
  if (r.estado === "borrador" && esEmail(r.destino) && r.canal === "gmail") return <><B acc="email" t="✉ Enviar el email ahora" p /><B acc="enviado" t="Ya lo envié yo" /><B acc="manana" t="Mañana" /><B acc="descartar" t="Descartar" /></>
  if (r.estado === "borrador") return <><B acc="enviado" t="✓ Enviado" p /><B acc="manana" t="Mañana" /><B acc="respondio" t="Ya respondió" /><B acc="descartar" t="Descartar" /></>
  if (r.estado === "enviado") return <><B acc="seguimiento" t="✓ Seguimiento enviado" p /><B acc="respondio" t="Respondió" /><B acc="sin_respuesta" t="Cerrar sin respuesta" /></>
  if (r.estado === "respondio") return <><B acc="contestado" t="✓ Le contesté" p /><B acc="reunion" t="Reunión agendada" /><B acc="descartar" t="No sigue" /></>
  if (r.estado === "reunion") return <><B acc="ganado" t="✓ Ganado" p /><B acc="descartar" t="No sigue" /></>
  if (r.estado === "descartado" || r.estado === "sin_respuesta") return <><B acc="respondio" t="✓ Respondió" p /><B acc="reabrir" t="Reabrir (para hoy)" /></>
  return null
}

/** Tarjeta: quién es, en qué está, qué nos escribió y el texto que toca mandar. */
function Tarjeta({ r, compacta, sel }: { r: any; compacta?: boolean; sel?: boolean }) {
  const org = r.organizacion && !/^sin dato/i.test(r.organizacion) ? r.organizacion : ""
  const titulo = r.persona || org || "Sin nombre"
  const sub = [r.cargo, r.persona ? org : ""].filter(Boolean).join(" · ")
  const t = textoParaCopiar(r)
  const bl = r.notas ? bloques(String(r.notas)) : {}
  const d = isoD(r.seguimiento)
  const esLink = /^https?:/i.test(r.destino ?? "")
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
        <div className="min-w-0 flex items-start gap-2.5">
          {sel && <input type="checkbox" form="lote" name="ids" value={r.id} aria-label={`Seleccionar a ${titulo}`} className="w-5 h-5 mt-0.5 shrink-0 cursor-pointer" />}
          <div className="min-w-0">
          <div className="font-semibold text-base leading-snug">{titulo}</div>
          {sub && <div className="text-sm text-[var(--gris)]">{sub}</div>}
          {r.destino && !esLink && <div className="text-sm text-[var(--gris)] break-all">{r.destino}</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {chip(ESTADOS_PROS, r.estado)}{chip(CANALES_PROS, r.canal)}{chip(TIPOS_PROS, r.tipo)}
          {d && <span className="text-xs text-[var(--gris)] whitespace-nowrap">{r.estado === "borrador" ? "Enviar" : r.estado === "respondio" ? "Volver a ver" : "Seguimiento"} {fecha(d)}</span>}
          {r.enviado_en && <span className="text-xs text-[var(--gris)] whitespace-nowrap">Enviado {fecha(isoD(r.enviado_en))}</span>}
        </div>
      </div>
      {["descartado", "sin_respuesta", "ganado"].includes(r.estado) && <p className="m-0 text-sm rounded-lg bg-[var(--sup-2)] px-3 py-2"><b>Cerrado.</b> {r.estado === "ganado" ? "Ya es cliente." : "Ya no aparece en Hoy ni en las demás vistas: solo en Todos y en la búsqueda. Si te volvió a escribir, tocá «Respondió»."}</p>}
      {bl.sugerencia && <p className="m-0 text-sm"><b>Sugerencia:</b> {bl.sugerencia}</p>}
      {bl.recibido && (
        <div className="rounded-xl border border-[var(--borde)] px-3.5 py-2.5">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--gris)] mb-1">Nos escribió</div>
          <p className="m-0 text-sm whitespace-pre-line">{bl.recibido}</p>
        </div>
      )}
      {t && compacta
        ? <details className="text-sm"><summary className="cursor-pointer text-[var(--gris)] w-fit">Ver el mensaje</summary><p className="m-0 mt-1.5 whitespace-pre-line">{t.texto}</p></details>
        : t
        ? <div className="rounded-xl bg-[var(--sup-2)] border border-[var(--borde)] px-3.5 py-2.5">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--gris)] mb-1">{t.etiqueta.replace(/^Copiar /, "")}</div>
            {bl.asunto && r.estado === "borrador" && <p className="m-0 mb-1.5 text-sm"><b>Asunto:</b> {bl.asunto}</p>}
            <p className="m-0 text-sm whitespace-pre-line">{t.texto}</p>
          </div>
        : r.asunto ? <p className="m-0 text-sm text-[var(--gris)]">{r.asunto}</p> : null}
    </>
  )
}
