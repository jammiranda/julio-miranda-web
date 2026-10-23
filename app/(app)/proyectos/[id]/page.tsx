import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { ESTADOS_PROY, trelloActivo, trelloCrearTablero, trelloIdDeUrl, trelloResumen, trelloTarjeta, type TrelloResumen } from "@/lib/crm"

export const dynamic = "force-dynamic"

const num = (v: string | null) => (v ? Number(v.replace(/\./g, "").replace(",", ".")) || null : null)

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const nombre = s(fd.get("nombre"))
  if (!nombre) redirect(`/proyectos/${id ?? "nuevo"}?err=nombre`)
  const est = String(fd.get("estado") ?? "planificado")
  const url = s(fd.get("trello_url"))
  const v = [nombre, s(fd.get("contacto_id")) ? Number(fd.get("contacto_id")) : null, s(fd.get("servicio_id")) ? Number(fd.get("servicio_id")) : null,
    ESTADOS_PROY.some((e) => e.v === est) ? est : "planificado", s(fd.get("inicio")), s(fd.get("entrega")), num(s(fd.get("monto"))), s(fd.get("responsable")),
    url, trelloIdDeUrl(url), s(fd.get("notas"))]
  let pid: number
  if (id) {
    await q("update db_proyectos set nombre=$1,contacto_id=$2,servicio_id=$3,estado=$4,inicio=$5,entrega=$6,monto=$7,responsable=$8,trello_url=$9,trello_board=coalesce($10,trello_board),notas=$11,actualizado=now() where id=$12", [...v, Number(id)])
    if (!url) await q("update db_proyectos set trello_board=null where id=$1", [Number(id)])
    pid = Number(id)
  } else {
    const r = await one<{ id: number }>("insert into db_proyectos(nombre,contacto_id,servicio_id,estado,inicio,entrega,monto,responsable,trello_url,trello_board,notas) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id", v)
    pid = r!.id
  }
  // Al ganar un proyecto, el contacto pasa a "ganado"
  if (v[1] && ["en_curso", "terminado"].includes(v[3] as string)) await q("update db_contactos set etapa='ganado', actualizado=now() where id=$1 and etapa<>'ganado'", [v[1]])
  await audit(u, id ? "edita_proyecto_db" : "crea_proyecto_db", "db_proyecto", pid, est)
  redirect(`/proyectos/${pid}?ok=1`)
}

async function crearTablero(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const p = await one<any>("select p.nombre, p.notas, c.organizacion from db_proyectos p left join db_contactos c on c.id=p.contacto_id where p.id=$1", [id])
  if (!p) redirect("/proyectos")
  try {
    const b = await trelloCrearTablero(p.organizacion ? `${p.organizacion} · ${p.nombre}` : p.nombre, p.notas ?? "")
    await q("update db_proyectos set trello_board=$1, trello_url=$2, actualizado=now() where id=$3", [b.id, b.url, id])
    await audit(u, "crea_tablero_trello", "db_proyecto", id)
  } catch (e) {
    redirect(`/proyectos/${id}?terr=${encodeURIComponent(String((e as Error).message).slice(0, 160))}`)
  }
  redirect(`/proyectos/${id}?ok=1`)
}

async function nuevaTarea(fd: FormData) {
  "use server"
  await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const p = await one<any>("select trello_board from db_proyectos where id=$1", [id])
  const t = s(fd.get("tarea"))
  if (!p?.trello_board || !t) redirect(`/proyectos/${id}`)
  try { await trelloTarjeta(p.trello_board, t!, s(fd.get("vence"))) } catch (e) {
    redirect(`/proyectos/${id}?terr=${encodeURIComponent(String((e as Error).message).slice(0, 160))}`)
  }
  redirect(`/proyectos/${id}`)
}

const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Proyecto({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; terr?: string; contacto?: string } }) {
  const nuevo = params.id === "nuevo"
  const p: any = nuevo ? { contacto_id: searchParams.contacto ? Number(searchParams.contacto) : null, estado: "planificado" } : await one<any>("select * from db_proyectos where id=$1", [Number(params.id)])
  if (!p) notFound()
  const [contactos, servicios] = await Promise.all([
    q<any>("select id, nombre, organizacion from db_contactos order by coalesce(organizacion,nombre)"),
    q<any>("select id, nombre from db_servicios where activo or id=$1 order by nombre", [p.servicio_id ?? 0]),
  ])
  const trello = trelloActivo()
  let tablero: TrelloResumen | null = null
  let terr = searchParams.terr ?? null
  if (!nuevo && trello && p.trello_board) {
    try { tablero = await trelloResumen(p.trello_board) } catch (e) { terr = (e as Error).message }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <form action={guardar} className="card lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
        <div className="md:col-span-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-lg">{nuevo ? "Nuevo proyecto" : p.nombre}</h2>
          <Link href="/proyectos" className="text-sm underline text-[#4A515C]">Volver</Link>
        </div>
        {searchParams.ok && <p role="status" className="m-0 md:col-span-2 text-sm text-[#C8231F]">Guardado.</p>}
        {searchParams.err && <p role="alert" className="m-0 md:col-span-2 text-sm text-rojo">Falta el nombre del proyecto.</p>}
        {!nuevo && <input type="hidden" name="id" value={p.id} />}
        <label className="lbl md:col-span-2">Nombre del proyecto *<input name="nombre" required defaultValue={p.nombre ?? ""} className="inp" /></label>
        <label className="lbl">Cliente<select name="contacto_id" defaultValue={p.contacto_id ?? ""} className="inp"><option value="">—</option>{contactos.map((c) => <option key={c.id} value={c.id}>{c.organizacion ? `${c.organizacion} (${c.nombre})` : c.nombre}</option>)}</select></label>
        <label className="lbl">Servicio<select name="servicio_id" defaultValue={p.servicio_id ?? ""} className="inp"><option value="">—</option>{servicios.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
        <label className="lbl">Estado<select name="estado" defaultValue={p.estado} className="inp">{ESTADOS_PROY.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
        <label className="lbl">Responsable<input name="responsable" defaultValue={p.responsable ?? ""} className="inp" /></label>
        <label className="lbl">Inicio<input name="inicio" type="date" defaultValue={iso(p.inicio)} className="inp" /></label>
        <label className="lbl">Entrega<input name="entrega" type="date" defaultValue={iso(p.entrega)} className="inp" /></label>
        <label className="lbl">Monto acordado<input name="monto" inputMode="decimal" defaultValue={p.monto ?? ""} className="inp" /></label>
        <label className="lbl">Tablero de Trello (URL)<input name="trello_url" type="url" defaultValue={p.trello_url ?? ""} placeholder="https://trello.com/b/…" className="inp" /></label>
        <label className="lbl md:col-span-2">Alcance y notas<textarea name="notas" rows={6} defaultValue={p.notas ?? ""} className="inp" /></label>
        <div className="md:col-span-2"><button className="btn-p">Guardar</button></div>
      </form>

      {!nuevo && (
        <aside className="flex flex-col gap-4">
          <section className="card flex flex-col gap-3">
            <h2 className="m-0 text-base">Tareas en Trello</h2>
            {terr && <p role="alert" className="m-0 text-sm text-rojo">Trello: {terr}</p>}
            {!trello ? (
              <p className="m-0 text-sm text-[#4A515C]">{p.trello_url ? <>Tablero: <a href={p.trello_url} target="_blank" rel="noopener noreferrer" className="underline">abrir en Trello</a>. </> : null}Para ver las tareas acá y crear tableros con un clic, cargá <code>TRELLO_KEY</code> y <code>TRELLO_TOKEN</code> en Vercel.</p>
            ) : !p.trello_board ? (
              <form action={crearTablero}><input type="hidden" name="id" value={p.id} /><button className="btn-p w-full">Crear tablero en Trello</button><p className="mt-2 mb-0 text-xs text-[#4A515C]">Crea un tablero con listas Pendiente, En curso y Hecho. O pegá la URL de uno existente en el formulario.</p></form>
            ) : tablero && (
              <>
                <div>
                  <div className="flex justify-between text-sm"><span>{tablero.hechas} de {tablero.total} hechas</span><a href={p.trello_url} target="_blank" rel="noopener noreferrer" className="underline">Abrir tablero</a></div>
                  <div className="h-2 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-valuenow={tablero.total ? Math.round((100 * tablero.hechas) / tablero.total) : 0} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#C8231F]" style={{ width: `${tablero.total ? (100 * tablero.hechas) / tablero.total : 0}%` }} /></div>
                </div>
                {tablero.listas.map((l) => (
                  <div key={l.nombre}>
                    <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-[#4A515C]">{l.nombre} · {l.tarjetas.length}</h3>
                    <ul className="m-0 mt-1 pl-4 text-sm">{l.tarjetas.slice(0, 15).map((t) => <li key={t.url}><a href={t.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{t.nombre}</a>{t.vence && <span className="text-xs text-[#4A515C]"> · {fecha(t.vence)}</span>}</li>)}</ul>
                  </div>
                ))}
                <form action={nuevaTarea} className="flex flex-col gap-2 border-t border-[#EEF0F3] pt-3">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="tarea" required placeholder="Nueva tarea" className="inp py-1.5" />
                  <div className="flex gap-2"><input name="vence" type="date" className="inp py-1.5" aria-label="Vence" /><button className="btn-s py-1.5">Agregar</button></div>
                </form>
              </>
            )}
          </section>
        </aside>
      )}
    </div>
  )
}
