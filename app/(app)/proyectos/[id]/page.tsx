import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { FASES, TIPOS_HITO, tipoHito, registrarHito, avisarNovedad, enviarAcceso, urlPortal, fase as faseDe, type Hito } from "@/lib/portal"
import FaseBarra from "@/components/FaseBarra"
import { ESTADOS_PROY, estadoProy, trelloActivo, trelloCrearTablero, trelloIdDeUrl, trelloResumen, trelloTarjeta, type TrelloResumen } from "@/lib/crm"

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
  const fs = String(fd.get("fase") ?? "inicio")
  const faseOk = FASES.some((f) => f.v === fs) ? fs : "inicio"
  const antes = id ? await one<{ estado: string; fase: string; entrega: string | null }>("select estado, fase, to_char(entrega,'YYYY-MM-DD') entrega from db_proyectos where id=$1", [Number(id)]) : null
  const v = [nombre, s(fd.get("contacto_id")) ? Number(fd.get("contacto_id")) : null, s(fd.get("servicio_id")) ? Number(fd.get("servicio_id")) : null,
    ESTADOS_PROY.some((e) => e.v === est) ? est : "planificado", s(fd.get("inicio")), s(fd.get("entrega")), num(s(fd.get("monto"))), s(fd.get("responsable")),
    url, trelloIdDeUrl(url), s(fd.get("notas"))]
  let pid: number
  if (id) {
    await q("update db_proyectos set nombre=$1,contacto_id=$2,servicio_id=$3,estado=$4,inicio=$5,entrega=$6,monto=$7,responsable=$8,trello_url=$9,trello_board=coalesce($10,trello_board),notas=$11,fase=$12,actualizado=now() where id=$13", [...v, faseOk, Number(id)])
    if (!url) await q("update db_proyectos set trello_board=null where id=$1", [Number(id)])
    pid = Number(id)
  } else {
    const r = await one<{ id: number }>("insert into db_proyectos(nombre,contacto_id,servicio_id,estado,inicio,entrega,monto,responsable,trello_url,trello_board,notas,fase) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id", [...v, faseOk])
    pid = r!.id
    await registrarHito(pid, { tipo: "sistema", titulo: "Arrancamos el proyecto", detalle: "Proyecto dado de alta. Desde acá vas a poder seguir cada etapa.", autor: u.nombre })
  }
  // Trazabilidad automática para el cliente
  if (antes) {
    if (antes.fase !== faseOk) await registrarHito(pid, { tipo: "sistema", titulo: `Pasamos a la etapa: ${faseDe(faseOk).n}`, detalle: faseDe(faseOk).d, autor: u.nombre })
    if (antes.estado !== est) await registrarHito(pid, { tipo: "sistema", titulo: `Estado del proyecto: ${estadoProy(est).n}`, autor: u.nombre })
    const ent = v[5] as string | null
    if (antes.entrega && ent && antes.entrega !== ent) await registrarHito(pid, { tipo: "sistema", titulo: `Nueva fecha estimada de entrega: ${fecha(ent)}`, detalle: `Antes: ${fecha(antes.entrega)}`, autor: u.nombre })
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

async function nuevoHito(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const id = Number(fd.get("id"))
  const titulo = s(fd.get("titulo"))
  if (!titulo) redirect(`/proyectos/${id}?herr=titulo#portal`)
  const tipo = TIPOS_HITO.some((t) => t.v === fd.get("tipo")) ? String(fd.get("tipo")) : "avance"
  const link = s(fd.get("url"))
  if (link && !/^https?:\/\//.test(link)) redirect(`/proyectos/${id}?herr=url#portal`)
  const visible = fd.get("visible") === "1"
  const requiere_ok = tipo === "aprobacion" || fd.get("requiere_ok") === "1"
  const h = { tipo, titulo, detalle: s(fd.get("detalle")), url: link, fecha: s(fd.get("fecha")), visible, requiere_ok: visible && requiere_ok, autor: u.nombre }
  const r = await registrarHito(id, h)
  await audit(u, "crea_hito", "db_proyecto", id, titulo)
  let aviso = ""
  if (visible && fd.get("avisar") === "1") {
    const a = await avisarNovedad(id, h)
    aviso = a.ok ? "&avisado=1" : `&herr=${encodeURIComponent(a.error ?? "aviso")}`
  }
  redirect(`/proyectos/${id}?hok=${r?.id ?? 1}${aviso}#portal`)
}

async function editarHito(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const hid = Number(fd.get("hito"))
  const op = String(fd.get("op") ?? "")
  if (op === "borrar") await q("delete from db_hitos where id=$1 and proyecto_id=$2", [hid, id])
  else if (op === "visible") await q("update db_hitos set visible=not visible where id=$1 and proyecto_id=$2", [hid, id])
  await audit(u, `hito_${op}`, "db_hito", hid)
  redirect(`/proyectos/${id}#portal`)
}

async function invitar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const p = await one<{ contacto_id: number | null }>("select contacto_id from db_proyectos where id=$1", [id])
  if (!p?.contacto_id) redirect(`/proyectos/${id}?herr=${encodeURIComponent("Asigná un cliente al proyecto")}#portal`)
  const r = await enviarAcceso(p.contacto_id, "invitacion")
  await audit(u, r.ok ? "portal_invita" : "portal_invita_error", "db_contacto", p.contacto_id, r.ok ? undefined : r.error)
  redirect(`/proyectos/${id}?${r.ok ? "invitado=1" : `herr=${encodeURIComponent(r.error ?? "error")}`}#portal`)
}

const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Proyecto({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; terr?: string; contacto?: string; hok?: string; herr?: string; avisado?: string; invitado?: string } }) {
  const nuevo = params.id === "nuevo"
  const p: any = nuevo ? { contacto_id: searchParams.contacto ? Number(searchParams.contacto) : null, estado: "planificado" } : await one<any>("select * from db_proyectos where id=$1", [Number(params.id)])
  if (!p) notFound()
  const [contactos, servicios] = await Promise.all([
    q<any>("select id, nombre, organizacion from db_contactos order by coalesce(organizacion,nombre)"),
    q<any>("select id, nombre from db_servicios where activo or id=$1 order by nombre", [p.servicio_id ?? 0]),
  ])
  const [hitos, cliente] = nuevo ? [[], null] : await Promise.all([
    q<Hito>("select * from db_hitos where proyecto_id=$1 order by fecha desc, id desc limit 60", [p.id]),
    p.contacto_id ? one<{ nombre: string; email: string | null; portal_ultimo: string | null }>("select nombre, email, portal_ultimo from db_contactos where id=$1", [p.contacto_id]) : Promise.resolve(null),
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
        <label className="lbl">Etapa (la ve el cliente)<select name="fase" defaultValue={p.fase ?? "inicio"} className="inp">{FASES.map((f, i) => <option key={f.v} value={f.v}>{i + 1}. {f.n}</option>)}</select></label>
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

      {!nuevo && (
        <section id="portal" aria-labelledby="t-portal" className="card lg:col-span-3 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="t-portal" className="m-0 text-base">Portal del cliente · trazabilidad</h2>
              <p className="m-0 text-sm text-[#4A515C]">Lo marcado como visible lo ve el cliente en <a href={urlPortal()} target="_blank" rel="noopener noreferrer" className="underline">su portal</a>. Los cambios de etapa, estado y fecha de entrega se registran solos.</p>
            </div>
            <form action={invitar} className="flex flex-col items-end gap-1">
              <input type="hidden" name="id" value={p.id} />
              <button className="btn-s py-1.5" disabled={!cliente?.email}>{cliente?.portal_ultimo ? "Reenviar acceso" : "Invitar al portal"}</button>
              <span className="text-xs text-[#4A515C]">{!cliente ? "Asigná un cliente al proyecto" : !cliente.email ? "El cliente no tiene email" : cliente.portal_ultimo ? `Último ingreso: ${fecha(cliente.portal_ultimo)}` : `Se envía a ${cliente.email}`}</span>
            </form>
          </div>
          {searchParams.invitado && <p role="status" className="m-0 text-sm text-emerald-700">Invitación enviada por email (vale 7 días).</p>}
          {searchParams.hok && <p role="status" className="m-0 text-sm text-emerald-700">Novedad registrada{searchParams.avisado ? " y avisada al cliente por email" : ""}.</p>}
          {searchParams.herr && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.herr === "titulo" ? "Falta el título de la novedad." : searchParams.herr === "url" ? "El link tiene que empezar con https://" : searchParams.herr}</p>}
          <FaseBarra fase={p.fase} terminado={p.estado === "terminado"} detalle />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <form action={nuevoHito} className="lg:col-span-2 flex flex-col gap-2 rounded-xl bg-[#F8F9FB] p-4 content-start">
              <input type="hidden" name="id" value={p.id} />
              <h3 className="m-0 text-sm font-bold">Nueva novedad</h3>
              <label className="lbl">Tipo<select name="tipo" className="inp" defaultValue="avance">{TIPOS_HITO.filter((t) => !["cliente", "sistema"].includes(t.v)).map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></label>
              <label className="lbl">Título *<input name="titulo" required maxLength={200} className="inp" placeholder="Ej.: Entregamos el diseño de la home" /></label>
              <label className="lbl">Detalle<textarea name="detalle" rows={3} className="inp" /></label>
              <label className="lbl">Link (documento, prototipo, factura, entrega)<input name="url" type="url" className="inp" placeholder="https://…" /></label>
              <label className="lbl">Fecha<input name="fecha" type="date" className="inp" /></label>
              <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="visible" value="1" defaultChecked /> Visible para el cliente</label>
              <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="requiere_ok" value="1" /> Pedirle aprobación</label>
              <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="avisar" value="1" defaultChecked={!!cliente?.email} disabled={!cliente?.email} /> Avisarle por email</label>
              <button className="btn-p mt-1">Registrar</button>
            </form>
            <div className="lg:col-span-3">
              <h3 className="m-0 mb-2 text-sm font-bold">Historial ({hitos.length})</h3>
              {!hitos.length && <p className="m-0 text-sm text-[#4A515C]">Sin novedades todavía.</p>}
              <ul className="m-0 p-0 list-none flex flex-col max-h-[640px] overflow-auto">
                {hitos.map((h) => (
                  <li key={h.id} className={`flex gap-3 py-2.5 border-b border-[#EEF0F3] ${h.visible ? "" : "opacity-60"}`}>
                    <span className="w-7 h-7 rounded-full bg-[#F5F6F8] text-[#C8231F] flex items-center justify-center text-sm shrink-0" aria-hidden="true">{tipoHito(h.tipo).i}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[#4A515C]">{fecha(h.fecha)} · {tipoHito(h.tipo).n}{h.autor ? ` · ${h.autor}` : ""}{!h.visible ? " · Interno" : ""}</div>
                      <div className="text-sm font-semibold">{h.titulo}</div>
                      {h.detalle && <p className="m-0 text-sm whitespace-pre-line text-[#262C37]">{h.detalle}</p>}
                      <div className="flex flex-wrap gap-2 mt-1 text-xs">
                        {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" className="underline">Abrir link</a>}
                        {h.requiere_ok && <span className={`chip ${h.ok_en ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{h.ok_en ? `Aprobado ${fecha(h.ok_en)}` : "Esperando aprobación"}</span>}
                        {h.ok_comentario && <span className="text-[#4A515C]">“{h.ok_comentario}”</span>}
                      </div>
                    </div>
                    {h.tipo !== "cliente" && (
                      <form action={editarHito} className="flex flex-col gap-1 shrink-0">
                        <input type="hidden" name="id" value={p.id} /><input type="hidden" name="hito" value={h.id} />
                        <button name="op" value="visible" className="text-xs underline text-[#4A515C]" title={h.visible ? "Ocultar al cliente" : "Mostrar al cliente"}>{h.visible ? "Ocultar" : "Mostrar"}</button>
                        <button name="op" value="borrar" className="text-xs underline text-rojo">Borrar</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
