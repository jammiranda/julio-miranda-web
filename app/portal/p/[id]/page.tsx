import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { waitUntil } from "@vercel/functions"
import { q, one, audit } from "@/lib/db"
import { requerirCliente, proyectoDe, registrarHito, tipoHito, fase, type Hito } from "@/lib/portal"
import { estadoProy, trelloActivo, trelloResumen } from "@/lib/crm"
import { notificar } from "@/lib/push"
import { fecha } from "@/lib/util"
import FaseBarra from "@/components/FaseBarra"

export const dynamic = "force-dynamic"

const txt = (v: FormDataEntryValue | null, n = 2000) => String(v ?? "").trim().slice(0, n)
const fh = (d: any) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

async function responder(fd: FormData) {
  "use server"
  const c = await requerirCliente()
  const hid = Number(fd.get("hito"))
  const op = String(fd.get("op") ?? "")
  const com = txt(fd.get("comentario"), 1500) || null
  const h = await one<any>("select h.id, h.titulo, h.proyecto_id, p.nombre from db_hitos h join db_proyectos p on p.id=h.proyecto_id where h.id=$1 and p.contacto_id=$2 and h.visible and h.requiere_ok and h.ok_en is null", [hid, c.id])
  if (!h) redirect("/portal")
  if (op === "aprobar") {
    await q("update db_hitos set ok_en=now(), ok_comentario=$1 where id=$2", [com, hid])
    await registrarHito(h.proyecto_id, { tipo: "cliente", titulo: `Aprobado: ${h.titulo}`, detalle: com, autor: c.nombre })
  } else {
    if (!com) redirect(`/portal/p/${h.proyecto_id}?falta=1#aprobar`)
    await registrarHito(h.proyecto_id, { tipo: "cliente", titulo: `Pidió cambios en: ${h.titulo}`, detalle: com, autor: c.nombre })
  }
  await audit({ id: 0, usuario: `cliente:${c.id}` }, op === "aprobar" ? "portal_aprueba" : "portal_pide_cambios", "db_hito", hid, com ?? undefined)
  waitUntil(notificar(["gerente", "coordinacion"], op === "aprobar" ? "✅ El cliente aprobó" : "✏️ El cliente pidió cambios", `${c.organizacion ?? c.nombre} · ${h.nombre}: ${h.titulo}${com ? ` — ${com}` : ""}`, `/proyectos/${h.proyecto_id}`).catch(() => {}))
  revalidatePath(`/portal/p/${h.proyecto_id}`)
  redirect(`/portal/p/${h.proyecto_id}?ok=${op === "aprobar" ? "aprobado" : "cambios"}`)
}

async function mensaje(fd: FormData) {
  "use server"
  const c = await requerirCliente()
  const pid = Number(fd.get("pid"))
  const p = await proyectoDe(c.id, pid)
  if (!p) redirect("/portal")
  const t = txt(fd.get("texto"))
  if (!t) redirect(`/portal/p/${pid}#mensaje`)
  const asunto = txt(fd.get("asunto"), 40) || "Consulta"
  await registrarHito(pid, { tipo: "cliente", titulo: `${asunto} del cliente`, detalle: t, autor: c.nombre })
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_mensaje", "db_proyecto", pid)
  waitUntil(notificar(["gerente", "coordinacion"], `✉️ ${asunto} desde el portal`, `${c.organizacion ?? c.nombre} · ${p.nombre}: ${t}`, `/proyectos/${pid}`).catch(() => {}))
  redirect(`/portal/p/${pid}?ok=mensaje#mensaje`)
}

export default async function ProyectoCliente({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; falta?: string } }) {
  const c = await requerirCliente()
  const p = await proyectoDe(c.id, Number(params.id))
  if (!p) notFound()
  const [hitos, reuniones] = await Promise.all([
    q<Hito>("select * from db_hitos where proyecto_id=$1 and visible order by fecha desc, id desc", [p.id]),
    q<any>("select inicio, modalidad, link, estado from db_reuniones where contacto_id=$1 and estado in ('confirmada','realizada') and inicio >= coalesce($2::date, '2000-01-01') order by inicio desc limit 20", [c.id, p.inicio]),
  ])
  let tareas: { total: number; hechas: number; enCurso: number } | null = null
  if (trelloActivo() && p.trello_board) {
    try {
      const t = await trelloResumen(p.trello_board)
      tareas = { total: t.total, hechas: t.hechas, enCurso: t.listas.filter((l) => /curso|progreso|doing/i.test(l.nombre)).reduce((a, l) => a + l.tarjetas.length, 0) }
    } catch {}
  }
  const aprobar = hitos.filter((h) => h.requiere_ok && !h.ok_en)
  const docs = hitos.filter((h) => h.url && ["documento", "entrega", "pago", "aprobacion"].includes(h.tipo))
  // Línea de tiempo: novedades + reuniones, de lo más nuevo a lo más viejo
  const linea = [
    ...hitos.map((h) => ({ k: `h${h.id}`, fecha: h.fecha, tipo: h.tipo, titulo: h.titulo, detalle: h.detalle, url: h.url, ok: h.requiere_ok ? (h.ok_en ? `Aprobado el ${fecha(h.ok_en)}` : "Pendiente de tu aprobación") : null, autor: h.tipo === "cliente" ? h.autor : null })),
    ...reuniones.map((r, i) => ({ k: `r${i}`, fecha: r.inicio, tipo: "reunion", titulo: r.estado === "realizada" ? "Reunión realizada" : new Date(r.inicio) > new Date() ? "Reunión agendada" : "Reunión", detalle: r.modalidad, url: new Date(r.inicio) > new Date() ? r.link : null, ok: null, autor: null })),
  ].sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha))
  const e = estadoProy(p.estado)
  const f = fase(p.fase)

  return (
    <div className="flex flex-col gap-5">
      <Link href="/portal" className="text-sm underline text-[#4A515C] self-start">← Mis proyectos</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="m-0">{p.nombre}</h1>{p.servicio && <p className="m-0 text-[#4A515C]">{p.servicio}</p>}</div>
        <span className={`chip ${e.c}`}>{e.n}</span>
      </div>

      {searchParams.ok && (
        <p role="status" className="m-0 card py-3 text-sm bg-emerald-50 border-emerald-200">
          {searchParams.ok === "aprobado" ? "¡Gracias! Quedó registrada tu aprobación y el equipo ya fue avisado." : searchParams.ok === "cambios" ? "Recibimos tu pedido de cambios. El equipo te responde a la brevedad." : "Mensaje enviado. Te respondemos a la brevedad."}
        </p>
      )}

      <section aria-labelledby="t-etapa" className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="t-etapa" className="m-0 text-base">Etapa actual: <span className="text-[#C8231F]">{p.estado === "terminado" ? "Proyecto entregado" : f.n}</span></h2>
          <span className="text-sm text-[#4A515C]">{p.inicio && <>Inicio {fecha(p.inicio)}</>}{p.entrega && <> · Entrega estimada <strong className="text-[#0E1116]">{fecha(p.entrega)}</strong></>}</span>
        </div>
        <FaseBarra fase={p.fase} terminado={p.estado === "terminado"} detalle />
        {tareas && tareas.total > 0 && (
          <div>
            <div className="flex justify-between text-sm"><span>Tareas del equipo: <strong>{tareas.hechas}</strong> hechas de {tareas.total}{tareas.enCurso ? ` · ${tareas.enCurso} en curso` : ""}</span><span>{Math.round((100 * tareas.hechas) / tareas.total)}%</span></div>
            <div className="h-2 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-label="Tareas hechas" aria-valuenow={Math.round((100 * tareas.hechas) / tareas.total)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#0E1116]" style={{ width: `${(100 * tareas.hechas) / tareas.total}%` }} /></div>
          </div>
        )}
        {p.responsable && <p className="m-0 text-sm text-[#4A515C]">Tu referente en DEVISEBIT: <strong className="text-[#0E1116]">{p.responsable}</strong></p>}
      </section>

      {aprobar.length > 0 && (
        <section id="aprobar" aria-labelledby="t-apr" className="card border-[#C8231F] flex flex-col gap-3">
          <h2 id="t-apr" className="m-0 text-base">Para revisar y aprobar ({aprobar.length})</h2>
          {searchParams.falta && <p role="alert" className="m-0 text-sm text-rojo">Contanos qué cambios necesitás para poder ajustarlo.</p>}
          {aprobar.map((h) => (
            <form key={h.id} action={responder} className="rounded-xl border border-[#E2E5EA] p-4 flex flex-col gap-2">
              <input type="hidden" name="hito" value={h.id} />
              <strong>{h.titulo}</strong>
              {h.detalle && <p className="m-0 text-sm whitespace-pre-line text-[#262C37]">{h.detalle}</p>}
              {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-[#C8231F] self-start">Abrir para revisar ↗</a>}
              <label className="lbl font-normal">Comentario (opcional para aprobar, necesario para pedir cambios)<textarea name="comentario" rows={2} className="inp" /></label>
              <div className="flex flex-wrap gap-2"><button name="op" value="aprobar" className="btn-p">Aprobar</button><button name="op" value="cambios" className="btn-s">Pedir cambios</button></div>
            </form>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section aria-labelledby="t-hist" className="card lg:col-span-2 flex flex-col gap-3">
          <h2 id="t-hist" className="m-0 text-base">Historial del proyecto</h2>
          {!linea.length && <p className="m-0 text-sm text-[#4A515C]">Todavía no hay movimientos registrados.</p>}
          <ol className="m-0 p-0 list-none relative">
            {linea.map((x) => (
              <li key={x.k} className="relative pl-10 pb-5 last:pb-0 before:absolute before:left-[13px] before:top-7 before:bottom-0 before:w-px before:bg-[#E2E5EA] last:before:hidden">
                <span className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${x.tipo === "cliente" ? "bg-[#0E1116] text-white" : x.tipo === "entrega" ? "bg-[#C8231F] text-white" : "bg-[#F5F6F8] text-[#C8231F] border border-[#E2E5EA]"}`} aria-hidden="true">{tipoHito(x.tipo).i}</span>
                <div className="text-xs text-[#4A515C]">{fh(x.fecha)} · {x.tipo === "cliente" ? `Vos${x.autor ? ` (${x.autor})` : ""}` : tipoHito(x.tipo).n}</div>
                <div className="font-semibold">{x.titulo}</div>
                {x.detalle && <p className="m-0 mt-0.5 text-sm whitespace-pre-line text-[#262C37]">{x.detalle}</p>}
                <div className="flex flex-wrap gap-3 mt-1 text-sm">
                  {x.url && <a href={x.url} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">{x.tipo === "reunion" ? "Unirme" : "Abrir"} ↗</a>}
                  {x.ok && <span className={`chip ${x.ok.startsWith("Aprobado") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{x.ok}</span>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="flex flex-col gap-5">
          <section aria-labelledby="t-docs" className="card flex flex-col gap-2">
            <h2 id="t-docs" className="m-0 text-base">Documentos y entregables</h2>
            {!docs.length && <p className="m-0 text-sm text-[#4A515C]">Acá van a aparecer propuestas, contratos, manuales, facturas y entregas.</p>}
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {docs.map((d) => (
                <li key={d.id}><a href={d.url!} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-start text-sm hover:underline"><span className="text-[#C8231F]" aria-hidden="true">{tipoHito(d.tipo).i}</span><span><strong className="block">{d.titulo}</strong><span className="text-xs text-[#4A515C]">{tipoHito(d.tipo).n} · {fecha(d.fecha)}</span></span></a></li>
              ))}
            </ul>
          </section>

          <section id="mensaje" aria-labelledby="t-msg" className="card flex flex-col gap-3">
            <h2 id="t-msg" className="m-0 text-base">Escribile al equipo</h2>
            <form action={mensaje} className="flex flex-col gap-2">
              <input type="hidden" name="pid" value={p.id} />
              <label className="lbl">Tipo<select name="asunto" className="inp" defaultValue="Consulta"><option>Consulta</option><option>Pedido de cambio</option><option>Problema o error</option><option>Nueva idea</option></select></label>
              <label className="lbl">Mensaje<textarea name="texto" required rows={4} className="inp" /></label>
              <button className="btn-p">Enviar</button>
              <p className="m-0 text-xs text-[#4A515C]">Queda guardado en el historial del proyecto y le llega al equipo al instante.</p>
            </form>
          </section>
        </aside>
      </div>
    </div>
  )
}
