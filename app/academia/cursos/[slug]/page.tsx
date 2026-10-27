import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { q, one, audit } from "@/lib/db"
import { mdWeb } from "@/lib/academia"
import { modalidad, tipoLeccion, inscribir, contactoPorEmail } from "@/lib/cursos"
import { clienteActual, urlPortal } from "@/lib/portal"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

const curso = (slug: string) => one<any>("select * from am_cursos where slug=$1 and estado='publicado'", [slug])

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await curso(params.slug)
  return c ? { title: c.titulo, description: c.bajada ?? undefined, alternates: { canonical: `/cursos/${c.slug}` }, openGraph: c.imagen ? { images: [c.imagen] } : undefined } : {}
}

const t = (v: FormDataEntryValue | null, n = 160) => String(v ?? "").trim().slice(0, n) || null

async function anotarme(fd: FormData) {
  "use server"
  const slug = String(fd.get("slug") ?? "")
  const c = await curso(slug)
  if (!c) redirect("/cursos")
  if (fd.get("website")) redirect(`/cursos/${slug}?ok=1`)
  const edicion = Number(fd.get("edicion"))
  if (!(await one("select 1 from am_ediciones where id=$1 and curso_id=$2", [edicion, c.id]))) redirect(`/cursos/${slug}?e=edicion#inscripcion`)
  const yo = await clienteActual()
  let cid: number
  if (yo && !t(fd.get("email"))) cid = yo.id
  else {
    const email = (t(fd.get("email")) ?? "").toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/cursos/${slug}?e=email#inscripcion`)
    if (!fd.get("acepto")) redirect(`/cursos/${slug}?e=acepto#inscripcion`)
    cid = await contactoPorEmail(email, t(fd.get("nombre"), 120), { telefono: t(fd.get("telefono"), 40), organizacion: t(fd.get("organizacion")), origen: "Academia (curso)" })
  }
  const bloq = await one<{ portal_acceso: string }>("select portal_acceso from db_contactos where id=$1", [cid])
  if (bloq?.portal_acceso === "bloqueado") redirect(`/cursos/${slug}?e=bloqueado#inscripcion`)
  const r = await inscribir(cid, edicion, "web", true)
  await audit({ id: 0, usuario: `alumno:${cid}` }, r.ok ? "curso_inscripcion" : "curso_inscripcion_error", "am_edicion", edicion, r.ok ? slug : r.error)
  if (!r.ok) redirect(`/cursos/${slug}?e=${encodeURIComponent(r.error)}#inscripcion`)
  if (yo && yo.id === cid) redirect(urlPortal(`/cursos/${r.id}`))
  redirect(`/cursos/${slug}?ok=1#inscripcion`)
}

export default async function Curso({ params, searchParams }: { params: { slug: string }; searchParams: { ok?: string; e?: string } }) {
  const c = await curso(params.slug)
  if (!c) notFound()
  const [ediciones, lecciones, yo] = await Promise.all([
    q<any>(`select e.*, (select count(*)::int from am_inscripciones i where i.edicion_id=e.id and i.estado<>'baja') inscriptos,
              (select count(*)::int from am_clases k where k.edicion_id=e.id) clases
            from am_ediciones e where e.curso_id=$1 and e.estado in ('inscripcion','en_curso') order by e.inicio nulls first, e.id`, [c.id]),
    q<any>("select modulo, titulo, tipo, duracion_min from am_lecciones where curso_id=$1 and publicada order by orden, id", [c.id]),
    clienteActual(),
  ])
  const abiertas = ediciones.filter((e) => !e.cupo || e.inscriptos < e.cupo)
  const ya = yo ? await one<{ id: number }>("select i.id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=$1 and i.contacto_id=$2 and i.estado<>'baja'", [c.id, yo.id]) : null
  const err: Record<string, string> = { email: "Revisá el email.", acepto: "Necesitamos tu conformidad para registrarte.", edicion: "Elegí una edición.", bloqueado: "Tu cuenta tiene el acceso suspendido. Escribinos por WhatsApp." }
  const modulos = Array.from(new Set(lecciones.map((l) => l.modulo || "Contenido")))
  return (
    <main>
      <section className="ficha-head bg-[#0E1116] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <Link href="/cursos" className="text-sm text-white/70 hover:text-white">← Cursos</Link>
            <p className="m-0 mt-4 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6A63]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} horas` : ""}{c.certifica ? " · Con certificado" : ""}</p>
            <h1 className="m-0 mt-3 text-4xl sm:text-5xl leading-[1.05] font-extrabold text-white">{c.titulo}</h1>
            {c.bajada && <p className="m-0 mt-4 text-lg text-white/80">{c.bajada}</p>}
            {c.docente && <p className="m-0 mt-4 text-sm text-white/70">Docente: <strong className="text-white">{c.docente}</strong></p>}
          </div>
          {c.imagen && <img src={c.imagen} alt="" className="lg:col-span-2 w-full rounded-2xl aspect-video object-cover" />}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {c.descripcion && <article className="prosa" dangerouslySetInnerHTML={{ __html: mdWeb(c.descripcion) }} />}
          {lecciones.length > 0 && (
            <section aria-labelledby="t-prog">
              <h2 id="t-prog" className="m-0 text-2xl font-extrabold">Programa</h2>
              {modulos.map((m) => (
                <div key={m} className="mt-4">
                  <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-[#4A515C]">{m}</h3>
                  <ul className="m-0 mt-2 p-0 list-none card flex flex-col gap-2">
                    {lecciones.filter((l) => (l.modulo || "Contenido") === m).map((l, k) => (
                      <li key={k} className="flex items-center gap-3 text-sm"><span className="text-[#C8231F]" aria-hidden="true">{tipoLeccion(l.tipo).i}</span><span className="flex-1">{l.titulo}</span>{l.duracion_min && <span className="text-xs text-[#4A515C]">{l.duracion_min} min</span>}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>

        <aside id="inscripcion" className="flex flex-col gap-4 scroll-mt-24">
          <div className="card flex flex-col gap-3 lg:sticky lg:top-24">
            <p className="m-0 text-2xl font-extrabold">{c.precio ? `$ ${Number(c.precio).toLocaleString("es-AR")}` : "Gratis"}</p>
            {searchParams.ok ? (
              <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm"><strong className="block mb-1">¡Listo, ya estás inscripto!</strong>Te mandamos un email con el acceso al curso. Revisá también spam o promociones.</div>
            ) : ya ? (
              <a href={urlPortal(`/cursos/${ya.id}`)} className="btn-p">Ir a mi curso</a>
            ) : !abiertas.length ? (
              <p className="m-0 text-sm text-[#4A515C]">No hay ediciones con inscripción abierta. Suscribite a la newsletter desde la portada y te avisamos.</p>
            ) : (
              <form action={anotarme} className="flex flex-col gap-3">
                <input type="hidden" name="slug" value={c.slug} />
                {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">{err[searchParams.e] ?? searchParams.e}</p>}
                <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                  <legend className="text-sm font-semibold mb-1">Edición</legend>
                  {abiertas.map((e, k) => (
                    <label key={e.id} className="flex gap-2 items-start text-sm rounded-xl border border-[#E2E5EA] p-3 cursor-pointer has-[:checked]:border-[#C8231F] has-[:checked]:bg-[#FDECEB]">
                      <input type="radio" name="edicion" value={e.id} defaultChecked={k === 0} className="mt-1" />
                      <span><strong className="block">{e.nombre}</strong><span className="text-xs text-[#4A515C]">{e.inicio ? `Desde ${fecha(e.inicio)}` : "Empezás cuando quieras"}{e.horario ? ` · ${e.horario}` : ""}{e.lugar ? ` · ${e.lugar}` : ""}{e.cupo ? ` · Quedan ${e.cupo - e.inscriptos} lugares` : ""}</span></span>
                    </label>
                  ))}
                </fieldset>
                {yo ? (
                  <p className="m-0 text-sm">Te inscribís como <strong>{yo.nombre}</strong> ({yo.email}).</p>
                ) : (
                  <>
                    <label className="lbl">Nombre y apellido<input name="nombre" required autoComplete="name" className="inp" /></label>
                    <label className="lbl">Email<input name="email" type="email" required autoComplete="email" className="inp" /></label>
                    <label className="lbl">WhatsApp (opcional)<input name="telefono" type="tel" autoComplete="tel" className="inp" /></label>
                    <label className="lbl">Organización (opcional)<input name="organizacion" autoComplete="organization" className="inp" /></label>
                    <label className="flex gap-2 items-start text-xs text-[#4A515C]"><input type="checkbox" name="acepto" value="1" required className="mt-0.5" /> Acepto recibir el acceso, recordatorios y novedades de la Academia por email (me puedo dar de baja cuando quiera).</label>
                  </>
                )}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <button className="btn-p">{c.precio ? "Reservar mi lugar" : "Inscribirme gratis"}</button>
              </form>
            )}
            <ul className="m-0 p-0 list-none text-sm text-[#4A515C] flex flex-col gap-1 border-t border-[#EEF0F3] pt-3">
              <li>✓ Acceso desde tu cuenta, sin contraseñas</li>
              {lecciones.length > 0 && <li>✓ {lecciones.length} lecciones y materiales descargables</li>}
              <li>✓ Seguimiento de tu avance</li>
              {c.certifica && <li>✓ Certificado verificable al aprobar</li>}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
