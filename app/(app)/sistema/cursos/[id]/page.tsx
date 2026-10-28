import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { slugDe, URL_ACADEMIA } from "@/lib/academia"
import { MODALIDADES, TIPOS_LECCION, ESTADOS_EDICION, tipoLeccion } from "@/lib/cursos"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

const n = (v: string | null) => (v ? Number(v.replace(",", ".")) || null : null)
const url = (v: string | null) => (v && /^https?:\/\//.test(v) ? v : null)

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const titulo = s(fd.get("titulo"))
  if (!titulo) redirect(`/sistema/cursos/${id}?err=titulo`)
  let slug = slugDe(s(fd.get("slug")) ?? titulo!) || `curso-${id}`
  if (await one("select 1 from am_cursos where slug=$1 and id<>$2", [slug, id])) slug = `${slug}-${id}`
  const mod = String(fd.get("modalidad"))
  const est = String(fd.get("estado"))
  await q(
    `update am_cursos set titulo=$1, slug=$2, bajada=$3, descripcion=$4, imagen=$5, categoria=$6, nivel=$7, docente=$8, horas=$9, modalidad=$10,
       precio=$11, estado=$12, req_lecciones=$13, req_asistencia=$14, certifica=$15, destacado=$16, actualizado=now() where id=$17`,
    [titulo, slug, s(fd.get("bajada")), String(fd.get("descripcion") ?? ""), url(s(fd.get("imagen"))), s(fd.get("categoria")), s(fd.get("nivel")), s(fd.get("docente")),
      n(s(fd.get("horas"))), MODALIDADES.some((m) => m.v === mod) ? mod : "online", n(s(fd.get("precio"))), ["borrador", "publicado", "archivado"].includes(est) ? est : "borrador",
      Math.min(100, Math.max(0, Number(fd.get("req_lecciones")) || 0)), Math.min(100, Math.max(0, Number(fd.get("req_asistencia")) || 0)), fd.get("certifica") === "1", fd.get("destacado") === "1", id],
  )
  await audit(u, "edita_curso", "am_curso", id, est)
  redirect(`/sistema/cursos/${id}?ok=1`)
}

async function leccion(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const id = Number(fd.get("id")), lid = Number(fd.get("lid") || 0)
  const op = String(fd.get("op") ?? "guardar")
  if (op === "borrar") { await q("delete from am_lecciones where id=$1 and curso_id=$2", [lid, id]); await audit(u, "borra_leccion", "am_leccion", lid); redirect(`/sistema/cursos/${id}#lecciones`) }
  if (op === "subir" || op === "bajar") {
    const l = await q<{ id: number }>("select id from am_lecciones where curso_id=$1 order by orden, id", [id])
    const k = l.findIndex((x) => x.id === lid), j = op === "subir" ? k - 1 : k + 1
    if (k >= 0 && j >= 0 && j < l.length) [l[k], l[j]] = [l[j], l[k]]
    for (const [i, x] of l.entries()) await q("update am_lecciones set orden=$1 where id=$2", [i + 1, x.id])
    redirect(`/sistema/cursos/${id}#lecciones`)
  }
  const titulo = s(fd.get("titulo"))
  if (!titulo) redirect(`/sistema/cursos/${id}?lerr=1#lecciones`)
  const tipo = TIPOS_LECCION.some((t) => t.v === fd.get("tipo")) ? String(fd.get("tipo")) : "lectura"
  const v = [s(fd.get("modulo")), titulo, tipo, String(fd.get("contenido") ?? ""), url(s(fd.get("video_url"))), url(s(fd.get("archivo_url"))), Number(fd.get("duracion_min")) || null, fd.get("publicada") === "1"]
  if (lid) await q("update am_lecciones set modulo=$1, titulo=$2, tipo=$3, contenido=$4, video_url=$5, archivo_url=$6, duracion_min=$7, publicada=$8 where id=$9 and curso_id=$10", [...v, lid, id])
  else await q("insert into am_lecciones(curso_id, orden, modulo, titulo, tipo, contenido, video_url, archivo_url, duracion_min, publicada) values ($1, coalesce((select max(orden) from am_lecciones where curso_id=$1),0)+1, $2,$3,$4,$5,$6,$7,$8,$9)", [id, ...v])
  await audit(u, lid ? "edita_leccion" : "crea_leccion", "am_curso", id, titulo)
  redirect(`/sistema/cursos/${id}?lok=1#lecciones`)
}

async function edicion(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const r = await one<{ id: number }>("insert into am_ediciones(curso_id, nombre, inicio, fin, horario, lugar, link, cupo) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id",
    [id, s(fd.get("nombre")) ?? "Nueva edición", s(fd.get("inicio")), s(fd.get("fin")), s(fd.get("horario")), s(fd.get("lugar")), url(s(fd.get("link"))), Number(fd.get("cupo")) || null])
  await audit(u, "crea_edicion", "am_curso", id)
  redirect(`/sistema/cursos/edicion/${r!.id}?nueva=1`)
}

const Campo = ({ l, children, className = "" }: { l: string; children: React.ReactNode; className?: string }) => <label className={`lbl ${className}`}>{l}{children}</label>

export default async function Curso({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; nuevo?: string; lok?: string; lerr?: string; editar?: string } }) {
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const c = await one<any>("select * from am_cursos where id=$1", [Number(params.id)])
  if (!c) notFound()
  const [lecciones, ediciones] = await Promise.all([
    q<any>("select l.*, (select count(*)::int from am_progreso p where p.leccion_id=l.id) hechas from am_lecciones l where l.curso_id=$1 order by l.orden, l.id", [c.id]),
    q<any>(`select e.*, (select count(*)::int from am_inscripciones i where i.edicion_id=e.id and i.estado<>'baja') inscriptos,
              (select count(*)::int from am_inscripciones i where i.edicion_id=e.id and i.estado='aprobado') aprobados
            from am_ediciones e where e.curso_id=$1 order by e.inicio nulls first, e.id`, [c.id]),
  ])
  const ed = searchParams.editar ? lecciones.find((l) => l.id === Number(searchParams.editar)) : null
  const puede = u.rol !== "profesional"
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/sistema/cursos" className="text-sm underline text-[#4A515C]">← Cursos</Link>
        {c.estado === "publicado" && <a href={`${URL_ACADEMIA}/cursos/${c.slug}`} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Ver publicado ↗</a>}
      </div>
      {searchParams.nuevo && <p role="status" className="m-0 card py-3 text-sm">Curso creado en borrador con una edición. Completá los datos, cargá las lecciones y cuando esté listo pasalo a <strong>Publicado</strong>.</p>}

      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="hidden" name="id" value={c.id} />
        <div className="md:col-span-4 flex items-center justify-between gap-2"><h1 className="m-0 text-xl">{c.titulo}</h1>{searchParams.ok && <span role="status" className="text-sm text-emerald-700">Guardado.</span>}</div>
        {searchParams.err && <p role="alert" className="m-0 md:col-span-4 text-sm text-rojo">Falta el título.</p>}
        <Campo l="Título *" className="md:col-span-3"><input name="titulo" required defaultValue={c.titulo} className="inp" /></Campo>
        <Campo l="Estado"><select name="estado" defaultValue={c.estado} className="inp"><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="archivado">Archivado</option></select></Campo>
        <Campo l="Bajada (una línea)" className="md:col-span-4"><input name="bajada" defaultValue={c.bajada ?? ""} className="inp" /></Campo>
        <Campo l="Modalidad"><select name="modalidad" defaultValue={c.modalidad} className="inp">{MODALIDADES.map((m) => <option key={m.v} value={m.v}>{m.n}</option>)}</select></Campo>
        <Campo l="Horas"><input name="horas" inputMode="decimal" defaultValue={c.horas ?? ""} className="inp" /></Campo>
        <Campo l="Categoría"><input name="categoria" defaultValue={c.categoria ?? ""} className="inp" placeholder="IA, Gestión, Salud digital…" /></Campo>
        <Campo l="Nivel"><input name="nivel" defaultValue={c.nivel ?? ""} className="inp" placeholder="Inicial, intermedio…" /></Campo>
        <Campo l="Docente"><input name="docente" defaultValue={c.docente ?? ""} className="inp" /></Campo>
        <Campo l="Precio (vacío = gratis)"><input name="precio" inputMode="decimal" defaultValue={c.precio ?? ""} className="inp" /></Campo>
        <Campo l="Dirección web (slug)"><input name="slug" defaultValue={c.slug} className="inp" /></Campo>
        <Campo l="Imagen (URL)"><input name="imagen" type="url" defaultValue={c.imagen ?? ""} className="inp" /></Campo>
        <Campo l="Para aprobar: % de lecciones"><input name="req_lecciones" type="number" min={0} max={100} defaultValue={c.req_lecciones} className="inp" /></Campo>
        <Campo l="Para aprobar: % de asistencia"><input name="req_asistencia" type="number" min={0} max={100} defaultValue={c.req_asistencia} className="inp" /></Campo>
        <label className="flex gap-2 items-center text-sm self-end pb-3"><input type="checkbox" name="certifica" value="1" defaultChecked={c.certifica} /> Emite certificado</label>
        <label className="flex gap-2 items-center text-sm self-end pb-3"><input type="checkbox" name="destacado" value="1" defaultChecked={c.destacado} /> Destacado</label>
        <Campo l="Descripción (texto simple: ## títulos, - listas, **negrita**)" className="md:col-span-4"><textarea name="descripcion" rows={8} defaultValue={c.descripcion} className="inp font-mono text-sm" /></Campo>
        {puede && <div className="md:col-span-4"><button className="btn-p">Guardar curso</button></div>}
      </form>

      <section id="ediciones" className="card flex flex-col gap-3" aria-labelledby="t-ed">
        <h2 id="t-ed" className="m-0 text-base">Ediciones (cohortes)</h2>
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>Edición</th><th>Fechas</th><th>Inscriptos</th><th>Aprobados</th><th>Estado</th></tr></thead>
          <tbody>{ediciones.map((e) => (
            <tr key={e.id}><td><Link href={`/sistema/cursos/edicion/${e.id}`} className="font-semibold hover:underline">{e.nombre}</Link>{e.horario && <span className="block text-xs text-[#4A515C]">{e.horario}</span>}</td>
              <td>{e.inicio ? `${fecha(e.inicio)}${e.fin ? ` – ${fecha(e.fin)}` : ""}` : "A su ritmo"}</td><td>{e.inscriptos}{e.cupo ? ` / ${e.cupo}` : ""}</td><td>{e.aprobados}</td>
              <td>{ESTADOS_EDICION.find((x) => x.v === e.estado)?.n}</td></tr>
          ))}</tbody>
        </table></div>
        {puede && (
          <form action={edicion} className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-xl bg-[#F8F9FB] p-4">
            <input type="hidden" name="id" value={c.id} />
            <h3 className="m-0 col-span-2 md:col-span-4 text-sm font-bold">Nueva edición</h3>
            <Campo l="Nombre"><input name="nombre" className="inp" placeholder="Noviembre 2026" /></Campo>
            <Campo l="Inicio"><input name="inicio" type="date" className="inp" /></Campo>
            <Campo l="Fin"><input name="fin" type="date" className="inp" /></Campo>
            <Campo l="Cupo"><input name="cupo" type="number" min={1} className="inp" /></Campo>
            <Campo l="Horario"><input name="horario" className="inp" placeholder="Martes 19 a 21 h" /></Campo>
            <Campo l="Lugar"><input name="lugar" className="inp" placeholder="Online / dirección" /></Campo>
            <Campo l="Link de clases en vivo" className="col-span-2"><input name="link" type="url" className="inp" placeholder="https://meet.google.com/…" /></Campo>
            <div className="col-span-2 md:col-span-4"><button className="btn-s">Crear edición</button></div>
          </form>
        )}
      </section>

      <section id="lecciones" className="card flex flex-col gap-3" aria-labelledby="t-lec">
        <h2 id="t-lec" className="m-0 text-base">Lecciones y materiales ({lecciones.length})</h2>
        {searchParams.lok && <p role="status" className="m-0 text-sm text-emerald-700">Lección guardada.</p>}
        {searchParams.lerr && <p role="alert" className="m-0 text-sm text-rojo">Falta el título de la lección.</p>}
        <ul className="m-0 p-0 list-none flex flex-col">
          {lecciones.map((l, k) => (
            <li key={l.id} className={`flex flex-wrap items-center gap-3 py-2 border-b border-[#EEF0F3] ${l.publicada ? "" : "opacity-60"}`}>
              <span className="w-7 text-center text-[#C8231F]" aria-hidden="true">{tipoLeccion(l.tipo).i}</span>
              <span className="flex-1 min-w-[200px]"><span className="text-xs text-[#4A515C]">{k + 1}. {l.modulo ? `${l.modulo} · ` : ""}{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{!l.publicada ? " · Oculta" : ""} · {l.hechas} completaron</span><strong className="block text-sm">{l.titulo}</strong></span>
              <form action={leccion} className="flex gap-1 items-center text-xs">
                <input type="hidden" name="id" value={c.id} /><input type="hidden" name="lid" value={l.id} />
                <button name="op" value="subir" disabled={k === 0} aria-label="Subir" className="w-7 h-7 rounded hover:bg-[#F5F6F8] disabled:opacity-30">↑</button>
                <button name="op" value="bajar" disabled={k === lecciones.length - 1} aria-label="Bajar" className="w-7 h-7 rounded hover:bg-[#F5F6F8] disabled:opacity-30">↓</button>
                <Link href={`/sistema/cursos/${c.id}?editar=${l.id}#editor`} className="underline px-1">Editar</Link>
                {puede && <button name="op" value="borrar" className="underline text-rojo px-1">Borrar</button>}
              </form>
            </li>
          ))}
        </ul>
        <form id="editor" key={ed?.id ?? "nueva"} action={leccion} className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl bg-[#F8F9FB] p-4 scroll-mt-24">
          <input type="hidden" name="id" value={c.id} />{ed && <input type="hidden" name="lid" value={ed.id} />}
          <h3 className="m-0 md:col-span-4 text-sm font-bold">{ed ? `Editar: ${ed.titulo}` : "Nueva lección"}</h3>
          <Campo l="Título *" className="md:col-span-2"><input name="titulo" required defaultValue={ed?.titulo ?? ""} className="inp" /></Campo>
          <Campo l="Módulo"><input name="modulo" defaultValue={ed?.modulo ?? ""} className="inp" placeholder="Módulo 1 · Fundamentos" /></Campo>
          <Campo l="Tipo"><select name="tipo" defaultValue={ed?.tipo ?? "video"} className="inp">{TIPOS_LECCION.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></Campo>
          <Campo l="Video (YouTube, Vimeo, Loom o Drive)" className="md:col-span-2"><input name="video_url" type="url" defaultValue={ed?.video_url ?? ""} className="inp" /></Campo>
          <Campo l="Material para descargar (link)"><input name="archivo_url" type="url" defaultValue={ed?.archivo_url ?? ""} className="inp" placeholder="Drive, Dropbox…" /></Campo>
          <Campo l="Duración (min)"><input name="duracion_min" type="number" min={0} defaultValue={ed?.duracion_min ?? ""} className="inp" /></Campo>
          <Campo l="Contenido (texto simple)" className="md:col-span-4"><textarea name="contenido" rows={6} defaultValue={ed?.contenido ?? ""} className="inp font-mono text-sm" /></Campo>
          <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="publicada" value="1" defaultChecked={ed ? ed.publicada : true} /> Visible para alumnos</label>
          <div className="md:col-span-3 flex gap-2 justify-end">{ed && <Link href={`/sistema/cursos/${c.id}#lecciones`} className="btn-s">Cancelar</Link>}<button name="op" value="guardar" className="btn-p">{ed ? "Guardar cambios" : "Agregar lección"}</button></div>
          <p className="m-0 md:col-span-4 text-xs text-[#4A515C]">El material descargable solo lo abren los inscriptos con la cuenta al día; cada descarga queda registrada.</p>
        </form>
      </section>
    </div>
  )
}
