import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { slugDe, URL_ACADEMIA } from "@/lib/academia"
import { modalidad } from "@/lib/cursos"

export const dynamic = "force-dynamic"

async function crear(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const titulo = String(fd.get("titulo") ?? "").trim()
  if (!titulo) redirect("/sistema/cursos?err=1")
  let slug = slugDe(titulo) || "curso"
  if (await one("select 1 from am_cursos where slug=$1", [slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  const r = await one<{ id: number }>("insert into am_cursos(slug, titulo, modalidad) values ($1,$2,$3) returning id", [slug, titulo.slice(0, 160), String(fd.get("modalidad") ?? "online")])
  await q("insert into am_ediciones(curso_id, nombre) values ($1, $2)", [r!.id, fd.get("modalidad") === "online" ? "Siempre disponible" : "Primera edición"])
  await audit(u, "crea_curso", "am_curso", r!.id, titulo)
  redirect(`/sistema/cursos/${r!.id}?nuevo=1`)
}

export default async function CursosAdmin({ searchParams }: { searchParams: { err?: string } }) {
  await requerir(["gerente", "coordinacion", "profesional"])
  const [cursos, kpi] = await Promise.all([
    q<any>(`select c.*, (select count(*)::int from am_lecciones l where l.curso_id=c.id) lecciones,
              (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado<>'baja') alumnos,
              (select count(*)::int from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=c.id and i.estado='aprobado') aprobados
            from am_cursos c order by c.estado='archivado', c.creado desc`),
    one<any>(`select (select count(distinct contacto_id)::int from am_inscripciones where estado<>'baja') alumnos,
                (select count(*)::int from am_certificados where not anulado) certificados,
                (select count(*)::int from am_eventos where tipo='descarga' and creado > now() - interval '30 days') descargas,
                (select count(distinct contacto_id)::int from am_eventos where creado > now() - interval '30 days') activos`),
  ])
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="m-0">Academia · Cursos</h1><p className="m-0 text-sm text-[#4A515C]">Cursos, ediciones, alumnos, asistencia y certificados. Se publican en <a href={`${URL_ACADEMIA}/cursos`} target="_blank" rel="noopener noreferrer" className="underline">academia.devisebit.com/cursos</a>.</p></div>
        <Link href="/sistema" className="text-sm underline text-[#4A515C]">Guías y productos →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Alumnos", kpi?.alumnos], ["Certificados emitidos", kpi?.certificados], ["Activos últimos 30 días", kpi?.activos], ["Descargas últimos 30 días", kpi?.descargas]].map(([t, v]) => (
          <div key={t as string} className="card"><span className="text-xs text-[#4A515C]">{t}</span><strong className="block text-2xl">{v ?? 0}</strong></div>
        ))}
      </div>
      <form action={crear} className="card flex flex-wrap items-end gap-3">
        <label className="lbl flex-1 min-w-[240px]">Nuevo curso<input name="titulo" required placeholder="Ej.: IA para atención al cliente por WhatsApp" className="inp" /></label>
        <label className="lbl">Modalidad<select name="modalidad" className="inp" defaultValue="online"><option value="online">Online a tu ritmo</option><option value="en_vivo">Online en vivo</option><option value="presencial">Presencial</option><option value="mixta">Mixta</option></select></label>
        <button className="btn-p">Crear</button>
        {searchParams.err && <p role="alert" className="m-0 w-full text-sm text-rojo">Poné un título.</p>}
      </form>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Curso</th><th>Modalidad</th><th>Lecciones</th><th>Alumnos</th><th>Aprobados</th><th>Estado</th></tr></thead>
          <tbody>
            {cursos.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/sistema/cursos/${c.id}`} className="font-semibold hover:underline">{c.titulo}</Link>{c.destacado && <span className="ml-2 chip bg-[#FDECEB] text-[#9E1A17]">Destacado</span>}</td>
                <td>{modalidad(c.modalidad)}</td><td>{c.lecciones}</td><td>{c.alumnos}</td><td>{c.aprobados}</td>
                <td><span className={`chip ${c.estado === "publicado" ? "bg-emerald-50 text-emerald-700" : c.estado === "borrador" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{c.estado === "publicado" ? "Publicado" : c.estado === "borrador" ? "Borrador" : "Archivado"}</span></td>
              </tr>
            ))}
            {!cursos.length && <tr><td colSpan={6} className="text-[#4A515C]">Todavía no hay cursos. Creá el primero arriba.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
