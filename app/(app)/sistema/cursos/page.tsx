import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { slugDe, URL_ACADEMIA, sembrar } from "@/lib/academia"
import { modalidad } from "@/lib/cursos"
import { Kpis } from "@/components/Kpi"

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
  await sembrar()
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
      <header className="pag-cab">
        <div><div className="eyebrow">Academia</div><h1 className="m-0">Cursos</h1><p>Cursos, ediciones, alumnos, asistencia y certificados. Se publican en <a href={`${URL_ACADEMIA}/cursos`} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-[var(--ac-texto)]">academia.devisebit.com/cursos</a>.</p></div>
        <div className="pag-acc"><Link href="/sistema" className="btn-s">Guías y productos</Link><Link href="/sistema/alumnos" className="btn-s">Alumnos</Link></div>
      </header>
      <Kpis datos={[
        { t: "Alumnos", v: kpi?.alumnos ?? 0, d: "inscriptos en algún curso", href: "/sistema/alumnos" },
        { t: "Certificados", v: kpi?.certificados ?? 0, d: "emitidos" },
        { t: "Activos · 30 días", v: kpi?.activos ?? 0, d: "con alguna actividad" },
        { t: "Descargas · 30 días", v: kpi?.descargas ?? 0, d: "de material", tono: "oscuro" },
      ]} />
      <form action={crear} className="card flex flex-wrap items-end gap-3">
        <label className="lbl flex-1 min-w-[240px]">Nuevo curso<input name="titulo" required placeholder="Ej.: IA para atención al cliente por WhatsApp" className="inp" /></label>
        <label className="lbl">Modalidad<select name="modalidad" className="inp" defaultValue="online"><option value="online">Online a tu ritmo</option><option value="en_vivo">Online en vivo</option><option value="presencial">Presencial</option><option value="mixta">Mixta</option></select></label>
        <button className="btn-p">Crear</button>
        {searchParams.err && <p role="alert" className="m-0 w-full text-sm text-rojo">Poné un título.</p>}
      </form>
      {!cursos.length && <p className="card m-0 text-[#4A515C]">Todavía no hay cursos. Creá el primero arriba.</p>}
      <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cursos.map((c) => {
          const pct = c.alumnos ? Math.round((c.aprobados / c.alumnos) * 100) : 0
          return (
            <li key={c.id}>
              <Link href={`/sistema/cursos/${c.id}`} className="card h-full flex flex-col gap-3 no-underline text-[#0E1116] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <span className={`chip ${c.estado === "publicado" ? "bg-emerald-50 text-emerald-700" : c.estado === "borrador" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{c.estado === "publicado" ? "Publicado" : c.estado === "borrador" ? "Borrador" : "Archivado"}</span>
                  {c.destacado && <span className="chip bg-[var(--ac-suave)] text-[var(--ac-texto)]">Destacado</span>}
                </div>
                <strong className="text-[17px] leading-snug" style={{ fontFamily: "var(--fuente-titulos)" }}>{c.titulo}</strong>
                <span className="text-sm text-[#4A515C]">{modalidad(c.modalidad)} · {c.lecciones} {c.lecciones === 1 ? "lección" : "lecciones"}</span>
                <div className="mt-auto pt-2 grid grid-cols-2 gap-2 text-sm">
                  <span><b className="text-xl" style={{ fontFamily: "var(--fuente-titulos)" }}>{c.alumnos}</b> <span className="text-xs text-[#4A515C]">alumnos</span></span>
                  <span><b className="text-xl" style={{ fontFamily: "var(--fuente-titulos)" }}>{c.aprobados}</b> <span className="text-xs text-[#4A515C]">aprobados</span></span>
                </div>
                {c.alumnos > 0 && <div className="h-1.5 rounded-full bg-[#E9E5DA] overflow-hidden" role="progressbar" aria-label="Aprobados" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[var(--ac)]" style={{ width: `${pct}%` }} /></div>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
