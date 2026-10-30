import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir, URL_ESPACIO } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { ESTADOS_EDICION, ESTADOS_INSC, estadoInsc, avance, evaluar, aprobar, inscribir, bienvenida, contactoPorEmail, urlCertificado, modalidad, completarAcceso } from "@/lib/cursos"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const url = (v: string | null) => (v && /^https?:\/\//.test(v) ? v : null)
const tz = (d: string | null) => (d ? `${d}:00-03:00` : null)
const back = (id: number, qs = "", h = "") => redirect(`/sistema/cursos/edicion/${id}${qs ? `?${qs}` : ""}${h ? `#${h}` : ""}`)

async function datos(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const est = String(fd.get("estado"))
  const antes = await one<{ estado: string }>("select estado from am_ediciones where id=$1", [id])
  await q("update am_ediciones set nombre=$1, inicio=$2, fin=$3, horario=$4, lugar=$5, link=$6, cupo=$7, estado=$8 where id=$9", [
    s(fd.get("nombre")) ?? "Edición", s(fd.get("inicio")), s(fd.get("fin")), s(fd.get("horario")), s(fd.get("lugar")), url(s(fd.get("link"))),
    Number(fd.get("cupo")) || null, ESTADOS_EDICION.some((e) => e.v === est) ? est : "inscripcion", id,
  ])
  await audit(u, "edita_edicion", "am_edicion", id, est)
  // Al finalizar, se evalúa a cada alumno: quien cumple los requisitos queda aprobado y recibe su certificado.
  if (est === "finalizada" && antes?.estado !== "finalizada") {
    const l = await q<{ id: number }>("select id from am_inscripciones where edicion_id=$1 and estado in ('inscripto','cursando')", [id])
    let n = 0
    for (const i of l) if (await evaluar(i.id)) n++
    back(id, `fin=${n}&pend=${l.length - n}`)
  }
  back(id, "ok=1")
}

async function alta(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const avisar = fd.get("avisar") === "1"
  const lineas = String(fd.get("lista") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 300)
  let ok = 0, ya = 0
  const errores: string[] = []
  for (const l of lineas) {
    const email = l.match(/[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/)?.[0]?.toLowerCase()
    if (!email) { errores.push(l.slice(0, 40)); continue }
    const nombre = l.replace(email, "").replace(/[<>,;]/g, " ").replace(/\s+/g, " ").trim() || null
    const cid = await contactoPorEmail(email, nombre, { origen: "Academia (alta del equipo)" })
    const r = await inscribir(cid, id, `equipo:${u.usuario}`, avisar)
    if (!r.ok) errores.push(`${email}: ${r.error}`)
    else if (r.ya) ya++
    else ok++
  }
  await audit(u, "alta_alumnos", "am_edicion", id, `${ok} nuevos, ${ya} ya estaban, ${errores.length} con error`)
  back(id, `alta=${ok}&ya=${ya}${errores.length ? `&aerr=${encodeURIComponent(errores.slice(0, 5).join(" | "))}` : ""}`, "alumnos")
}

async function alumno(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id")), iid = Number(fd.get("iid"))
  const i = await one<{ id: number }>("select id from am_inscripciones where id=$1 and edicion_id=$2", [iid, id])
  if (!i) back(id)
  const op = String(fd.get("op"))
  if (op === "aprobar") await aprobar(iid, u.usuario)
  // Pasa una inscripción del módulo gratis al curso completo (pago por transferencia, beca…): misma inscripción, mismo avance.
  else if (op === "completo") await completarAcceso(iid, `equipo:${u.usuario}`)
  else if (op === "acceso") await bienvenida(iid)
  else if (op === "anular") await q("update am_certificados set anulado=true where inscripcion_id=$1", [iid])
  else if (ESTADOS_INSC.some((e) => e.v === op)) {
    await q("update am_inscripciones set estado=$1 where id=$2", [op, iid])
    if (op !== "aprobado") await q("update am_certificados set anulado=true where inscripcion_id=$1", [iid])
  }
  await audit(u, `alumno_${op}`, "am_inscripcion", iid)
  back(id, `aok=${op}`, "alumnos")
}

async function clase(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const id = Number(fd.get("id")), cl = Number(fd.get("cl") || 0)
  if (fd.get("op") === "borrar") { await q("delete from am_clases where id=$1 and edicion_id=$2", [cl, id]); back(id, "", "clases") }
  const f = tz(s(fd.get("fecha")))
  if (!f) back(id, "cerr=1", "clases")
  const v = [f, Number(String(fd.get("horas") ?? "").replace(",", ".")) || 2, s(fd.get("tema")), url(s(fd.get("link"))), url(s(fd.get("grabacion")))]
  if (cl) await q("update am_clases set fecha=$1, horas=$2, tema=$3, link=$4, grabacion=$5 where id=$6 and edicion_id=$7", [...v, cl, id])
  else await q("insert into am_clases(edicion_id, fecha, horas, tema, link, grabacion) values ($1,$2,$3,$4,$5,$6)", [id, ...v])
  await audit(u, cl ? "edita_clase" : "crea_clase", "am_edicion", id)
  back(id, "clok=1", "clases")
}

async function asistencia(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const id = Number(fd.get("id")), cl = Number(fd.get("cl"))
  if (!(await one("select 1 from am_clases where id=$1 and edicion_id=$2", [cl, id]))) back(id)
  const presentes = new Set(fd.getAll("p").map(Number))
  const inscriptos = await q<{ id: number }>("select id from am_inscripciones where edicion_id=$1 and estado<>'baja'", [id])
  for (const i of inscriptos) {
    await q("insert into am_asistencias(clase_id, inscripcion_id, presente) values ($1,$2,$3) on conflict (clase_id, inscripcion_id) do update set presente=excluded.presente", [cl, i.id, presentes.has(i.id)])
    if (presentes.has(i.id)) await q("update am_inscripciones set estado='cursando', ultima_actividad=now() where id=$1 and estado='inscripto'", [i.id])
  }
  await audit(u, "asistencia", "am_clase", cl, `${presentes.size}/${inscriptos.length}`)
  back(id, "asok=1", `clase-${cl}`)
}

const local = (d: any) => new Date(d).toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).slice(0, 16).replace(" ", "T")
const fh = (d: any) => new Date(d).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })
const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Edicion({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | undefined> }) {
  const u = await requerir()
  const e = await one<any>(
    `select e.*, c.id curso_id, c.titulo, c.slug, c.modalidad, c.req_lecciones, c.req_asistencia, c.certifica, c.horas
     from am_ediciones e join am_cursos c on c.id=e.curso_id where e.id=$1`, [Number(params.id)])
  if (!e) notFound()
  const [alumnos, clases, asis] = await Promise.all([
    q<any>(`select i.*, k.nombre, k.email, k.organizacion, ce.codigo certificado from am_inscripciones i join db_contactos k on k.id=i.contacto_id
            left join am_certificados ce on ce.inscripcion_id=i.id and not ce.anulado where i.edicion_id=$1 order by i.estado='baja', k.nombre`, [e.id]),
    q<any>("select * from am_clases where edicion_id=$1 order by fecha", [e.id]),
    q<{ clase_id: number; inscripcion_id: number; presente: boolean }>("select a.* from am_asistencias a join am_clases c on c.id=a.clase_id where c.edicion_id=$1", [e.id]),
  ])
  const av = new Map(await Promise.all(alumnos.map(async (a) => [a.id, await avance(a.id)] as const)))
  const presente = (cl: number, iid: number) => asis.some((x) => x.clase_id === cl && x.inscripcion_id === iid && x.presente)
  const tomada = (cl: number) => asis.some((x) => x.clase_id === cl)
  const activos = alumnos.filter((a) => a.estado !== "baja")
  const cuenta = (est: string) => alumnos.filter((a) => a.estado === est).length
  const sp = searchParams

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/sistema/cursos/${e.curso_id}#ediciones`} className="text-sm underline text-[#4A515C]">← {e.titulo}</Link>
          <h1 className="m-0 mt-1">{e.nombre}</h1>
          <p className="m-0 text-sm text-[#4A515C]">{modalidad(e.modalidad)} · {activos.length} inscriptos{e.cupo ? ` de ${e.cupo}` : ""} · {cuenta("aprobado")} aprobados · Requisitos: {e.req_lecciones}% de lecciones{clases.length ? ` y ${e.req_asistencia}% de asistencia` : ""}</p>
        </div>
        <a href={`https://academia.devisebit.com/cursos/${e.slug}`} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Ver página pública</a>
      </div>

      {sp.ok && <p role="status" className="m-0 text-sm text-emerald-700">Guardado.</p>}
      {sp.fin && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50">Edición finalizada: <strong>{sp.fin}</strong> aprobados con certificado enviado. {Number(sp.pend) > 0 && <>Quedan <strong>{sp.pend}</strong> sin cumplir los requisitos: podés aprobarlos a mano o marcarlos como no aprobados.</>}</p>}

      <form action={datos} className="card grid grid-cols-2 md:grid-cols-4 gap-3">
        <input type="hidden" name="id" value={e.id} />
        <label className="lbl col-span-2">Nombre de la edición<input name="nombre" defaultValue={e.nombre} className="inp" /></label>
        <label className="lbl">Estado<select name="estado" defaultValue={e.estado} className="inp">{ESTADOS_EDICION.map((x) => <option key={x.v} value={x.v}>{x.n}</option>)}</select></label>
        <label className="lbl">Cupo<input name="cupo" type="number" min={0} defaultValue={e.cupo ?? ""} className="inp" placeholder="Sin límite" /></label>
        <label className="lbl">Inicio<input name="inicio" type="date" defaultValue={iso(e.inicio)} className="inp" /></label>
        <label className="lbl">Fin<input name="fin" type="date" defaultValue={iso(e.fin)} className="inp" /></label>
        <label className="lbl">Días y horario<input name="horario" defaultValue={e.horario ?? ""} className="inp" placeholder="Martes 19 a 21 h" /></label>
        <label className="lbl">Lugar<input name="lugar" defaultValue={e.lugar ?? ""} className="inp" placeholder="Online / dirección" /></label>
        <label className="lbl col-span-2 md:col-span-3">Link de las clases en vivo<input name="link" type="url" defaultValue={e.link ?? ""} className="inp" placeholder="https://meet.google.com/…" /></label>
        <div className="flex items-end"><button className="btn-p w-full">Guardar</button></div>
        <p className="m-0 col-span-2 md:col-span-4 text-xs text-[#4A515C]">Al pasar a <strong>Finalizada</strong>, el sistema aprueba y certifica automáticamente a quienes cumplen los requisitos y les manda el certificado por email.</p>
      </form>

      <section id="alumnos" aria-labelledby="t-al" className="card flex flex-col gap-3">
        <h2 id="t-al" className="m-0 text-base">Alumnos ({activos.length})</h2>
        {sp.alta && <p role="status" className="m-0 text-sm text-emerald-700">{sp.alta} inscriptos nuevos{Number(sp.ya) ? `, ${sp.ya} ya estaban` : ""}.</p>}
        {sp.aerr && <p role="alert" className="m-0 text-sm text-rojo">No se pudieron inscribir: {sp.aerr}</p>}
        {sp.aok && <p role="status" className="m-0 text-sm text-emerald-700">{sp.aok === "acceso" ? "Acceso reenviado por email." : sp.aok === "aprobar" ? "Aprobado y certificado enviado." : sp.aok === "completo" ? "Ahora tiene el curso completo (le avisamos por email)." : "Actualizado."}</p>}
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Alumno</th><th>Estado</th><th>Lecciones</th>{clases.length > 0 && <th>Asistencia</th>}<th>Certificado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {alumnos.map((a) => {
                const x = av.get(a.id)!
                const cumple = x.pctLecciones >= e.req_lecciones && (!clases.length || x.pctAsistencia >= e.req_asistencia)
                return (
                  <tr key={a.id} className={a.estado === "baja" ? "opacity-50" : ""}>
                    <td>{u.espacios.includes("comercial") ? <a href={`${URL_ESPACIO.comercial}/contactos/${a.contacto_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" title="Abrir la ficha en el Sistema comercial">{a.nombre}</a> : <strong>{a.nombre}</strong>}<span className="block text-xs text-[#4A515C]">{a.email}{a.organizacion ? ` · ${a.organizacion}` : ""}</span></td>
                    <td><span className={`chip ${estadoInsc(a.estado).c}`}>{estadoInsc(a.estado).n}</span>{a.parcial && <span className="chip bg-[#FDECEB] text-[#9E1A17] ml-1">Módulo gratis</span>}{cumple && !a.parcial && ["inscripto", "cursando"].includes(a.estado) && <span className="block text-xs text-emerald-700 mt-1">Cumple requisitos</span>}</td>
                    <td className="whitespace-nowrap">{x.lecciones ? `${x.hechas}/${x.lecciones} · ${x.pctLecciones}%` : "—"}</td>
                    {clases.length > 0 && <td className="whitespace-nowrap">{x.presentes}/{x.clases} · {x.pctAsistencia}%</td>}
                    <td>{a.certificado ? <a href={urlCertificado(a.certificado)} target="_blank" rel="noopener noreferrer" className="underline text-xs">{a.certificado}</a> : "—"}</td>
                    <td>
                      <form action={alumno} className="flex flex-wrap gap-1 justify-end">
                        <input type="hidden" name="id" value={e.id} /><input type="hidden" name="iid" value={a.id} />
                        {a.parcial && a.estado !== "baja" && <button name="op" value="completo" className="btn-s py-1 px-2 text-xs" title="Pagó por otro medio o tiene beca: pasa al curso completo con su avance">Dar curso completo</button>}
                        {!a.parcial && a.estado !== "aprobado" && a.estado !== "baja" && <button name="op" value="aprobar" className="btn-s py-1 px-2 text-xs">Aprobar</button>}
                        {a.estado !== "baja" && <button name="op" value="acceso" className="btn-s py-1 px-2 text-xs">Reenviar acceso</button>}
                        {["inscripto", "cursando"].includes(a.estado) && <button name="op" value="desaprobado" className="btn-s py-1 px-2 text-xs">No aprobó</button>}
                        {a.estado === "baja" ? <button name="op" value="inscripto" className="btn-s py-1 px-2 text-xs">Reactivar</button> : <button name="op" value="baja" className="py-1 px-2 text-xs underline text-rojo">Baja</button>}
                      </form>
                    </td>
                  </tr>
                )
              })}
              {!alumnos.length && <tr><td colSpan={6} className="text-[#4A515C]">Todavía no hay inscriptos.</td></tr>}
            </tbody>
          </table>
        </div>
        <form action={alta} className="rounded-xl bg-[#F8F9FB] p-4 flex flex-col gap-2">
          <input type="hidden" name="id" value={e.id} />
          <label className="lbl">Inscribir alumnos (uno por línea: email y nombre)<textarea name="lista" rows={3} required className="inp font-mono text-sm" placeholder={"ana@empresa.com Ana Pérez\njuan@gmail.com, Juan Gómez"} /></label>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="avisar" value="1" defaultChecked /> Mandarles la bienvenida con el acceso</label>
            <button className="btn-p py-1.5">Inscribir</button>
          </div>
          <p className="m-0 text-xs text-[#4A515C]">Si el email no está en Contactos, se crea como alumno. Quedan etiquetados <code>alumno</code> y <code>curso:{e.slug}</code> para email marketing.</p>
        </form>
      </section>

      <section id="clases" aria-labelledby="t-cl" className="card flex flex-col gap-3">
        <h2 id="t-cl" className="m-0 text-base">Clases en vivo y asistencia ({clases.length})</h2>
        <p className="m-0 text-sm text-[#4A515C]">Opcional: para cursos online a tu ritmo alcanza con las lecciones. Si cargás clases, la asistencia cuenta para aprobar. Los alumnos reciben un recordatorio el día de cada clase.</p>
        {sp.cerr && <p role="alert" className="m-0 text-sm text-rojo">Falta la fecha y hora de la clase.</p>}
        {sp.asok && <p role="status" className="m-0 text-sm text-emerald-700">Asistencia guardada.</p>}
        {clases.map((c, n) => (
          <details key={c.id} id={`clase-${c.id}`} className="rounded-xl border border-[#E2E5EA]" open={!tomada(c.id) && new Date(c.fecha) <= new Date()}>
            <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span><strong>Clase {n + 1}</strong> · {fh(c.fecha)} · {Number(c.horas)} h{c.tema ? ` · ${c.tema}` : ""}</span>
              <span className="text-xs text-[#4A515C]">{tomada(c.id) ? `${asis.filter((x) => x.clase_id === c.id && x.presente).length}/${activos.length} presentes` : new Date(c.fecha) <= new Date() ? "Falta tomar asistencia" : "Próxima"}</span>
            </summary>
            <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <form action={asistencia} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={e.id} /><input type="hidden" name="cl" value={c.id} />
                <h3 className="m-0 text-sm font-bold">Asistencia</h3>
                {activos.length ? activos.map((a) => (
                  <label key={a.id} className="flex gap-2 items-center text-sm"><input type="checkbox" name="p" value={a.id} defaultChecked={tomada(c.id) ? presente(c.id, a.id) : false} /> {a.nombre}</label>
                )) : <p className="m-0 text-sm text-[#4A515C]">Sin alumnos.</p>}
                {activos.length > 0 && <button className="btn-p py-1.5 self-start">Guardar asistencia</button>}
              </form>
              <form action={clase} className="grid grid-cols-2 gap-2 content-start">
                <input type="hidden" name="id" value={e.id} /><input type="hidden" name="cl" value={c.id} />
                <label className="lbl">Fecha y hora<input name="fecha" type="datetime-local" required defaultValue={local(c.fecha)} className="inp py-1.5" /></label>
                <label className="lbl">Horas<input name="horas" inputMode="decimal" defaultValue={Number(c.horas)} className="inp py-1.5" /></label>
                <label className="lbl col-span-2">Tema<input name="tema" defaultValue={c.tema ?? ""} className="inp py-1.5" /></label>
                <label className="lbl col-span-2">Link (si es distinto al de la edición)<input name="link" type="url" defaultValue={c.link ?? ""} className="inp py-1.5" /></label>
                <label className="lbl col-span-2">Grabación<input name="grabacion" type="url" defaultValue={c.grabacion ?? ""} className="inp py-1.5" placeholder="YouTube, Drive, Vimeo…" /></label>
                <div className="col-span-2 flex gap-2"><button className="btn-s py-1.5">Guardar clase</button><button name="op" value="borrar" className="text-xs underline text-rojo">Borrar</button></div>
              </form>
            </div>
          </details>
        ))}
        <form action={clase} className="rounded-xl bg-[#F8F9FB] p-4 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <input type="hidden" name="id" value={e.id} />
          <label className="lbl">Fecha y hora *<input name="fecha" type="datetime-local" required className="inp py-1.5" /></label>
          <label className="lbl">Horas<input name="horas" inputMode="decimal" defaultValue="2" className="inp py-1.5" /></label>
          <label className="lbl col-span-2">Tema<input name="tema" className="inp py-1.5" /></label>
          <button className="btn-p py-1.5">+ Agregar clase</button>
        </form>
      </section>
      <p className="m-0 text-xs text-[#4A515C]">Creada el {fecha(e.creado)}.</p>
    </div>
  )
}
