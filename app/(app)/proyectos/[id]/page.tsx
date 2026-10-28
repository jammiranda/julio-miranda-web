import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { FASES, TIPOS_HITO, tipoHito, registrarHito, avisarNovedad, enviarAcceso, urlPortal, fase as faseDe, type Hito } from "@/lib/portal"
import FaseBarra from "@/components/FaseBarra"
import { cargarFactura, nroRecibo, formatoCuit } from "@/lib/comprobantes"
import { TIPOS_COBRO, tipoCobro, plata, cobrosDe, generarAbonos } from "@/lib/cobros"
import { registrarPago } from "@/lib/pagos"
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
  await q("update db_proyectos set moneda=$1 where id=$2", [s(fd.get("moneda_proy")) === "ARS" ? "ARS" : "USD", pid])
  // Trazabilidad automática para el cliente
  if (antes) {
    if (antes.fase !== faseOk) await registrarHito(pid, { tipo: "sistema", titulo: `Pasamos a la etapa: ${faseDe(faseOk).n}`, detalle: faseDe(faseOk).d, autor: u.nombre })
    if (antes.estado !== est) await registrarHito(pid, { tipo: "sistema", titulo: `Estado del proyecto: ${estadoProy(est).n}`, autor: u.nombre })
    const ent = v[5] as string | null
    if (antes.entrega && ent && antes.entrega !== ent) await registrarHito(pid, { tipo: "sistema", titulo: `Nueva fecha estimada de entrega: ${fecha(ent)}`, detalle: `Antes: ${fecha(antes.entrega)}`, autor: u.nombre })
  }
  // Al ganar un proyecto, el contacto pasa a "ganado"
  if (v[1] && ["en_curso", "terminado"].includes(v[3] as string)) await q("update db_contactos set etapa='ganado', clase=case when clase is null or clase in ('oportunidad','suscriptor') then 'cliente' else clase end, actualizado=now() where id=$1", [v[1]])
  else if (v[1]) await q("update db_contactos set clase=coalesce(clase,'oportunidad') where id=$1", [v[1]])
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

async function abono(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const monto = num(s(fd.get("abono_monto")))
  await q("update db_proyectos set abono_monto=$1, abono_moneda=$2, abono_dia=$3, abono_desde=$4, abono_hasta=$5, actualizado=now() where id=$6",
    [monto, s(fd.get("abono_moneda")) === "USD" ? "USD" : "ARS", Math.min(28, Math.max(1, Number(fd.get("abono_dia")) || 10)), s(fd.get("abono_desde")), s(fd.get("abono_hasta")), id])
  if (monto) await generarAbonos()
  await audit(u, "proyecto_abono", "db_proyecto", id, monto ? String(monto) : "sin abono")
  redirect(`/proyectos/${id}?cok=abono#cobros`)
}

async function nuevoCobro(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const p = await one<{ contacto_id: number | null; nombre: string }>("select contacto_id, nombre from db_proyectos where id=$1", [id])
  if (!p?.contacto_id) redirect(`/proyectos/${id}?cerr=${encodeURIComponent("Asigná un cliente al proyecto")}#cobros`)
  const total = num(s(fd.get("monto")))
  const vence = s(fd.get("vence"))
  if (!total || !vence) redirect(`/proyectos/${id}?cerr=${encodeURIComponent("Faltan el monto o el vencimiento")}#cobros`)
  const cuotas = Math.min(36, Math.max(1, Number(fd.get("cuotas")) || 1))
  const tipo = TIPOS_COBRO.some((t) => t.v === fd.get("tipo")) ? String(fd.get("tipo")) : "cuota"
  const moneda = s(fd.get("moneda")) === "USD" ? "USD" : "ARS"
  const concepto = s(fd.get("concepto")) ?? `${tipoCobro(tipo)} · ${p!.nombre}`
  const parte = Math.round((total! / cuotas) * 100) / 100
  for (let k = 0; k < cuotas; k++) {
    const monto = k === cuotas - 1 ? Math.round((total! - parte * (cuotas - 1)) * 100) / 100 : parte
    await q(`insert into db_cobros(contacto_id, proyecto_id, tipo, concepto, monto, moneda, vence, creado_por) values ($1,$2,$3,$4,$5,$6, ($7::date + ($8 || ' months')::interval)::date, $9)`,
      [p!.contacto_id, id, tipo, cuotas > 1 ? `${concepto} (${k + 1}/${cuotas})` : concepto, monto, moneda, vence, String(k), u.nombre])
  }
  await audit(u, "crea_cobro", "db_proyecto", id, `${cuotas} x ${moneda} ${parte}`)
  redirect(`/proyectos/${id}?cok=cobro#cobros`)
}

async function accionCobro(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id")), cid = Number(fd.get("cobro"))
  const op = String(fd.get("op"))
  if (op === "pagado") await registrarPago(cid, { medio: s(fd.get("medio")) ?? "Transferencia", por: u.nombre })
  else if (op === "anular") { await q("update db_cobros set estado='anulado' where id=$1 and proyecto_id=$2 and estado='pendiente'", [cid, id]); await audit(u, "anula_cobro", "db_cobro", cid) }
  else if (op === "factura") {
    const nro = s(fd.get("factura_nro")), url = s(fd.get("factura_url"))
    if (!nro || !url || !/^https?:\/\//.test(url)) redirect(`/proyectos/${id}?cerr=${encodeURIComponent("Para cargar la factura poné el número y el link al PDF (https://…)")}#cobros`)
    const r = await cargarFactura(cid, { nro: nro!, url: url!, tipo: s(fd.get("factura_tipo")), por: u.nombre })
    redirect(`/proyectos/${id}?${r.ok ? "cok=factura" : `cerr=${encodeURIComponent(r.error ?? "error")}`}#cobros`)
  }
  else if (op === "reabrir") { await q("update db_cobros set estado='pendiente', pagado_en=null, medio=null where id=$1 and proyecto_id=$2", [cid, id]); await audit(u, "reabre_cobro", "db_cobro", cid) }
  redirect(`/proyectos/${id}#cobros`)
}

const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Proyecto({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; terr?: string; contacto?: string; hok?: string; herr?: string; avisado?: string; invitado?: string; cok?: string; cerr?: string } }) {
  const nuevo = params.id === "nuevo"
  const p: any = nuevo ? { contacto_id: searchParams.contacto ? Number(searchParams.contacto) : null, estado: "planificado" } : await one<any>("select * from db_proyectos where id=$1", [Number(params.id)])
  if (!p) notFound()
  const [contactos, servicios] = await Promise.all([
    q<any>("select id, nombre, organizacion from db_contactos order by coalesce(organizacion,nombre)"),
    q<any>("select id, nombre from db_servicios where activo or id=$1 order by nombre", [p.servicio_id ?? 0]),
  ])
  const cobros = nuevo || !p.contacto_id ? [] : (await cobrosDe(p.contacto_id, true)).filter((c) => c.proyecto_id === p.id)
  const sumar = (est: string) => cobros.filter((c) => c.estado === est).reduce<Record<string, number>>((a, c) => ((a[c.moneda] = (a[c.moneda] ?? 0) + Number(c.monto)), a), {})
  const tot = (m: Record<string, number>) => Object.entries(m).map(([k, v]) => plata(v, k)).join(" + ") || "—"
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
        <label className="lbl">Monto acordado<span className="flex gap-2"><select name="moneda_proy" defaultValue={p.moneda ?? "USD"} className="inp w-24" aria-label="Moneda"><option>USD</option><option>ARS</option></select><input name="monto" inputMode="decimal" defaultValue={p.monto ?? ""} className="inp" /></span></label>
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
        <section id="cobros" aria-labelledby="t-cobros" className="card lg:col-span-3 flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="t-cobros" className="m-0 text-base">Cobros y abono</h2>
            <span className="text-sm text-[#4A515C]">Cobrado <strong className="text-emerald-700">{tot(sumar("pagado"))}</strong> · Pendiente <strong className="text-[#0E1116]">{tot(sumar("pendiente"))}</strong>{p.monto ? <> · Acordado {plata(p.monto, p.moneda ?? "USD")}</> : null}</span>
          </div>
          {searchParams.cok && <p role="status" className="m-0 text-sm text-emerald-700">{searchParams.cok === "abono" ? "Abono guardado. El cobro del mes se genera solo." : searchParams.cok === "factura" ? "Factura cargada y enviada al cliente por email." : "Cobro cargado. El cliente ya lo ve en su estado de cuenta."}</p>}
          {searchParams.cerr && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.cerr}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <form action={nuevoCobro} className="flex flex-col gap-2 rounded-xl bg-[#F8F9FB] p-4">
                <input type="hidden" name="id" value={p.id} />
                <h3 className="m-0 text-sm font-bold">Nuevo cobro o plan de cuotas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="lbl">Tipo<select name="tipo" className="inp" defaultValue="cuota">{TIPOS_COBRO.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></label>
                  <label className="lbl">Moneda<select name="moneda" className="inp" defaultValue="ARS"><option>ARS</option><option>USD</option></select></label>
                  <label className="lbl">Monto total<input name="monto" required inputMode="decimal" className="inp" /></label>
                  <label className="lbl">Cuotas<input name="cuotas" type="number" min={1} max={36} defaultValue={1} className="inp" /></label>
                  <label className="lbl col-span-2">Primer vencimiento<input name="vence" type="date" required className="inp" /></label>
                  <label className="lbl col-span-2">Concepto<input name="concepto" className="inp" placeholder={`Ej.: Anticipo 50% · ${p.nombre}`} /></label>
                </div>
                <p className="m-0 text-xs text-[#4A515C]">Con varias cuotas, se reparten en partes iguales una por mes.</p>
                <button className="btn-p">Cargar</button>
              </form>
              <form action={abono} className="flex flex-col gap-2 rounded-xl bg-[#F8F9FB] p-4">
                <input type="hidden" name="id" value={p.id} />
                <h3 className="m-0 text-sm font-bold">Abono mensual (soporte, hosting, mantenimiento)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="lbl">Monto<input name="abono_monto" inputMode="decimal" defaultValue={p.abono_monto ?? ""} className="inp" placeholder="Vacío = sin abono" /></label>
                  <label className="lbl">Moneda<select name="abono_moneda" className="inp" defaultValue={p.abono_moneda ?? "ARS"}><option>ARS</option><option>USD</option></select></label>
                  <label className="lbl">Vence el día<input name="abono_dia" type="number" min={1} max={28} defaultValue={p.abono_dia ?? 10} className="inp" /></label>
                  <label className="lbl">Desde<input name="abono_desde" type="date" defaultValue={iso(p.abono_desde)} className="inp" /></label>
                  <label className="lbl col-span-2">Hasta (opcional)<input name="abono_hasta" type="date" defaultValue={iso(p.abono_hasta)} className="inp" /></label>
                </div>
                <p className="m-0 text-xs text-[#4A515C]">Todos los meses se genera solo el cobro, con aviso por email 3 días antes y si se atrasa.</p>
                <button className="btn-s">Guardar abono</button>
              </form>
            </div>
            <div className="lg:col-span-3 overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Concepto</th><th>Vence</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {cobros.map((c) => {
                    const venc = c.estado === "pendiente" && (c.dias_atraso ?? 0) > 0
                    return (
                      <tr key={c.id} className={c.estado === "anulado" ? "opacity-50" : ""}>
                        <td><span className="font-semibold">{c.concepto}</span><span className="block text-xs text-[#4A515C]">{tipoCobro(c.tipo)}</span></td>
                        <td className={venc ? "text-rojo font-semibold" : ""}>{fecha(c.vence)}{venc && <span className="block text-xs">{c.dias_atraso} días</span>}</td>
                        <td className="whitespace-nowrap">{plata(c.monto, c.moneda)}</td>
                        <td><span className={`chip ${c.estado === "pagado" ? "bg-emerald-50 text-emerald-700" : c.estado === "anulado" ? "bg-slate-100 text-slate-500" : venc ? "bg-red-50 text-rojo" : "bg-amber-50 text-amber-700"}`}>{c.estado === "pagado" ? `Pagado ${fecha(c.pagado_en)}` : c.estado === "anulado" ? "Anulado" : venc ? "Vencido" : "Pendiente"}</span>{c.medio && <span className="block text-xs text-[#4A515C]">{c.medio}</span>}{c.estado === "pendiente" && c.informado_en && <span className="block text-xs font-semibold text-sky-700">El cliente informó el pago: {c.informado_detalle}</span>}
                          {c.estado === "pagado" && <a href={`/portal/pagos/comprobante/${c.id}`} target="_blank" rel="noopener noreferrer" className="block text-xs underline mt-1">Comprobante {nroRecibo(c.recibo_nro)}</a>}
                          {c.factura_estado === "emitida" && <a href={c.factura_url ?? "#"} target="_blank" rel="noopener noreferrer" className="block text-xs underline text-emerald-700">Factura {c.factura_tipo ?? ""} {c.factura_nro}</a>}
                          {c.factura_estado === "pedida" && <span className="block text-xs font-semibold text-sky-700">Pidió factura {c.factura_tipo ?? "(tipo a definir)"}: {c.factura_datos?.razon} · {c.factura_datos?.doc_tipo} {c.factura_datos?.doc_tipo === "DNI" ? c.factura_datos?.doc : formatoCuit(c.factura_datos?.doc ?? "")} · {c.factura_datos?.iva}</span>}
                        </td>
                        <td>
                          <form action={accionCobro} className="flex flex-wrap gap-1 justify-end">
                            <input type="hidden" name="id" value={p.id} /><input type="hidden" name="cobro" value={c.id} />
                            {c.estado === "pendiente" && <><select name="medio" className="inp py-1 text-xs w-auto" aria-label="Medio de pago"><option>Transferencia</option><option>Efectivo</option><option>Mercado Pago</option><option>Cheque</option><option>Otro</option></select><button name="op" value="pagado" className="btn-p py-1 text-xs">Cobrado</button><button name="op" value="anular" className="text-xs underline text-[#4A515C]">Anular</button></>}
                            {c.estado !== "pendiente" && <button name="op" value="reabrir" className="text-xs underline text-[#4A515C]">Volver a pendiente</button>}
                          </form>
                          {c.estado !== "anulado" && c.factura_estado !== "emitida" && (
                            <details className="mt-1 text-right">
                              <summary className={`cursor-pointer text-xs underline ${c.factura_estado === "pedida" ? "font-semibold text-sky-700" : "text-[#4A515C]"}`}>Cargar factura</summary>
                              <form action={accionCobro} className="mt-1 flex flex-col gap-1 items-end">
                                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="cobro" value={c.id} />
                                <select name="factura_tipo" defaultValue={c.factura_tipo ?? ""} className="inp py-1 text-xs w-auto" aria-label="Tipo de factura"><option value="">Tipo</option><option>A</option><option>B</option><option>C</option></select>
                                <input name="factura_nro" placeholder="N° 0001-00000123" className="inp py-1 text-xs w-44" aria-label="Número de factura" />
                                <input name="factura_url" type="url" placeholder="Link al PDF (Drive, ARCA…)" className="inp py-1 text-xs w-44" aria-label="Link al PDF de la factura" />
                                <button name="op" value="factura" className="btn-p py-1 text-xs">Cargar y enviar</button>
                              </form>
                            </details>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!cobros.length && <tr><td colSpan={5} className="text-[#4A515C]">Sin cobros cargados.{!p.contacto_id ? " Asigná un cliente para poder cargarlos." : ""}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
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
            <form key={searchParams.hok ?? "nuevo"} action={nuevoHito} className="lg:col-span-2 flex flex-col gap-2 rounded-xl bg-[#F8F9FB] p-4 content-start">
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
