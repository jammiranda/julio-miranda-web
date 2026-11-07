import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { isoD } from "@/lib/gestion"
import { prospeccionPanel, CANAL_N } from "@/lib/prospeccion"
import { fecha } from "@/lib/util"
import { TablaRegistro, Aviso, Kpi, Pestanias } from "@/components/Registro"

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

      <TablaRegistro clave="prospeccion" filas={filas} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar={edita}
        abierto={(r) => !CERRADOS.includes(r.estado)}
        rapido={{ etiqueta: "Enviado", si: (r) => r.estado === "borrador" }}
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
