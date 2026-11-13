import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { isoD, ESTADOS_PROS, CANALES_PROS, TIPOS_PROS } from "@/lib/gestion"
import { prospeccionPanel, CANAL_N } from "@/lib/prospeccion"
import { fecha, hoyISO } from "@/lib/util"
import { TablaRegistro, Aviso, Kpi, Pestanias } from "@/components/Registro"
import Indice from "@/components/Indice"

export const dynamic = "force-dynamic"

type SP = { editar?: string; nuevo?: string; ok?: string; error?: string; ver?: string; todos?: string }
const CERRADOS = ["ganado", "sin_respuesta", "descartado"]
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—")

export default async function Prospeccion({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir()
  const edita = u.rol === "gerente" || u.rol === "coordinacion"
  const m = await prospeccionPanel()
  const camp = sp.ver && m.porCampania.some((x: any) => x.campania === sp.ver) ? sp.ver : ""
  const cond: string[] = []
  const params: unknown[] = []
  if (camp) { params.push(camp); cond.push(`campania=$${params.length}`) }
  if (!sp.todos) cond.push(`estado not in ('ganado','sin_respuesta','descartado')`)
  const filas = await q<any>(`select * from g_prospeccion ${cond.length ? "where " + cond.join(" and ") : ""} order by case estado when 'respondio' then 0 when 'reunion' then 1 when 'enviado' then 2 when 'borrador' then 3 else 4 end, coalesce(seguimiento, enviado_en, creado::date) nulls last, id desc`, params)
  const editar = Number(sp.editar) || null
  const historia = await q<any>(
    editar
      ? "select e.*, p.organizacion, p.persona from g_prospeccion_eventos e join g_prospeccion p on p.id=e.prospeccion_id where p.id=$1 order by e.fecha desc, e.id desc"
      : "select e.*, p.organizacion, p.persona from g_prospeccion_eventos e join g_prospeccion p on p.id=e.prospeccion_id order by e.fecha desc, e.id desc limit 25",
    editar ? [editar] : [],
  )
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const base = { ver: camp || undefined, todos: sp.todos, ...extra }
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v)
    const s = p.toString()
    return `/prospeccion${s ? "?" + s : ""}`
  }
  const volver = qs({})

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Ventas</div><h1 className="m-0">Prospección</h1>
          <p>Cada mail, invitación de LinkedIn o postulación, de punta a punta: cuándo se preparó, cuándo salió, cuándo respondieron y qué pasó después. Las estadísticas están en panel.devisebit.com/prospeccion.</p></div>
        {edita && <div className="pag-acc"><Link href={`${volver}${volver.includes("?") ? "&" : "?"}nuevo=1`} className="btn-p">+ Contacto</Link></div>}
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Resumen de prospección" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi t="Enviados" v={m.salieron} d={`${m.E.borrador ?? 0} borradores esperan envío`} />
        <Kpi t="Respondieron" v={m.respondieron} d={`${pct(m.respondieron, m.salieron)} de los enviados${m.diasRespuesta != null ? ` · ${m.diasRespuesta} días promedio` : ""}`} tono={m.respondieron ? "verde" : undefined} />
        <Kpi t="Reuniones" v={(m.E.reunion ?? 0) + (m.E.ganado ?? 0)} d={`${m.E.ganado ?? 0} ganados`} />
        <Kpi t="Seguimientos vencidos" v={m.vencidos.length} d={m.vencidos[0] ? `${m.vencidos[0].organizacion} · ${fecha(isoD(m.vencidos[0].seguimiento))}` : "Al día"} tono={m.vencidos.length ? "ambar" : undefined} />
        <Kpi t="Sin respuesta" v={m.E.sin_respuesta ?? 0} d="Cerrados tras el seguimiento" />
      </section>

      <Pestanias base="/prospeccion" actual={camp} items={[{ v: "", n: "Todas", cant: m.total }, ...m.porCampania.map((x: any) => ({ v: x.campania, n: x.campania, cant: x.total }))]} />

      <Indice sel="h2.grupo" filtra="article.card" placeholder="Buscar persona, empresa o cargo" />
      <TablaRegistro clave="prospeccion" filas={filas} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar={edita}
        abierto={(r) => !CERRADOS.includes(r.estado)}
        rapido={{ etiqueta: "Enviado", si: (r) => r.estado === "borrador" }}
        copiar={textoParaCopiar}
        tarjeta={(r) => <Tarjeta r={r} />}
        grupo={grupoDe}
        enlace={(r) => /^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(r.destino ?? "") ? { href: r.destino, etiqueta: "Abrir perfil" } : null}
        vacio="Sin contactos en esta vista. Cargá cada mail o invitación al prepararla (estado Borrador) y marcala Enviado cuando salga: el seguimiento se agenda solo a los 7 días." />
      <Link href={sp.todos ? qs({ todos: undefined }) : qs({ todos: "1" })} className="text-sm underline text-[var(--gris)] w-fit">{sp.todos ? "Ocultar ganados, sin respuesta y descartados" : "Ver también ganados, sin respuesta y descartados"}</Link>

      <section className="card" aria-label="Historia">
        <h2 className="m-0 mb-3 text-base">{editar ? `Historia de ${historia[0]?.organizacion ?? "este contacto"}` : "Últimos movimientos"}</h2>
        {historia.length ? (
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {historia.map((e) => (
              <li key={e.id} className="text-sm border-b border-[var(--borde)] pb-2">
                <b>{new Date(e.fecha).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}</b>
                {!editar && <> · {e.organizacion}{e.persona ? ` (${e.persona})` : ""}</>} · {e.detalle ?? e.tipo}
                {e.por ? <span className="text-[var(--gris)]"> · {e.por}</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="vacio">Todavía no hay movimientos.</p>}
      </section>
      <p className="text-xs text-[var(--gris)]">Canales: {Object.values(CANAL_N).join(", ")}. LinkedIn se envía siempre a mano desde la cuenta de Julio; acá solo se registra.</p>
    </div>
  )
}

/** Bloques de las notas armadas para LinkedIn: «ENCABEZADO:» en una línea y el texto debajo, separados por una línea en blanco. */
function bloques(notas: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const b of notas.split(/\n\s*\n/)) {
    const [cab, ...resto] = b.split("\n")
    const k = cab.trim().toUpperCase()
    const t = resto.join("\n").trim()
    if (!t) continue
    if (k.startsWith("MENSAJE")) out.mensaje = t
    else if (k.startsWith("PASO 1")) out.invitacion = t
    else if (k.startsWith("PASO 2")) out.paso2 = t
    else if (k.startsWith("SEGUIMIENTO")) out.seguimiento = t
  }
  return out
}

/** Qué copiar según el estado: primero la invitación o el mensaje; ya enviado, el mensaje al aceptar o el seguimiento. */
function textoParaCopiar(r: any): { texto: string; etiqueta: string } | null {
  if (!r.notas) return null
  const b = bloques(String(r.notas))
  if (r.estado === "borrador") {
    if (b.invitacion) return { texto: b.invitacion, etiqueta: "Copiar invitación" }
    if (b.mensaje) return { texto: b.mensaje, etiqueta: "Copiar mensaje" }
  }
  if (r.estado === "enviado") {
    if (b.paso2) return { texto: b.paso2, etiqueta: "Copiar mensaje" }
    if (b.seguimiento) return { texto: b.seguimiento, etiqueta: "Copiar seguimiento" }
  }
  return null
}

const chip = (ops: { v: string; n: string; c?: string }[], v: string) => { const o = ops.find((x) => x.v === v); return o ? <span className={`chip ${o.c ?? ""}`}>{o.n}</span> : null }

/** Grupo de la lista: lo que hay que hacer y cuándo. */
function grupoDe(r: any): string {
  const d = isoD(r.seguimiento)
  if (r.estado === "respondio") return "Respondieron: contestar"
  if (r.estado === "reunion") return "Con reunión"
  if (r.estado === "enviado") return d && d <= hoyISO() ? "Enviados: toca seguimiento" : "Enviados: esperando respuesta"
  if (r.estado === "borrador") return !d ? "Para enviar · sin fecha" : d < hoyISO() ? "Para enviar · atrasados" : d === hoyISO() ? "Para enviar · hoy" : `Para enviar · ${fecha(d)}`
  return "Cerrados"
}

/** Tarjeta de un contacto: quién es, en qué está y el texto que toca mandar, todo a la vista. */
function Tarjeta({ r }: { r: any }) {
  const org = r.organizacion && !/^sin dato/i.test(r.organizacion) ? r.organizacion : ""
  const titulo = r.persona || org || "Sin nombre"
  const sub = [r.cargo, r.persona ? org : ""].filter(Boolean).join(" · ")
  const t = textoParaCopiar(r)
  const d = isoD(r.seguimiento)
  const esLink = /^https?:/i.test(r.destino ?? "")
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
        <div className="min-w-0">
          <div className="font-semibold text-base leading-snug">{titulo}</div>
          {sub && <div className="text-sm text-[var(--gris)]">{sub}</div>}
          {r.destino && !esLink && <div className="text-sm text-[var(--gris)] break-all">{r.destino}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {chip(ESTADOS_PROS, r.estado)}{chip(CANALES_PROS, r.canal)}{chip(TIPOS_PROS, r.tipo)}
          {d && r.estado === "enviado" && <span className="text-xs text-[var(--gris)] whitespace-nowrap">Seguimiento {fecha(d)}</span>}
        </div>
      </div>
      {t
        ? <div className="rounded-xl bg-[var(--sup-2)] border border-[var(--borde)] px-3.5 py-2.5">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--gris)] mb-1">{t.etiqueta.replace(/^Copiar /, "")}</div>
            <p className="m-0 text-sm whitespace-pre-line">{t.texto}</p>
          </div>
        : r.asunto ? <p className="m-0 text-sm text-[var(--gris)]">{r.asunto}</p> : null}
    </>
  )
}
