import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { q, one } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { inscripcionDe, leccionesDe, evaluar, embedVideo, tipoLeccion } from "@/lib/cursos"
import { mdWeb } from "@/lib/academia"

export const dynamic = "force-dynamic"

async function completar(fd: FormData) {
  "use server"
  const c = await requerirCliente()
  const iid = Number(fd.get("iid")), lid = Number(fd.get("lid"))
  const i = await inscripcionDe(c.id, iid)
  if (!i || !(await one("select 1 from am_lecciones where id=$1 and curso_id=$2 and publicada", [lid, i.curso_id]))) redirect("/portal/cursos")
  if (fd.get("op") === "deshacer") await q("delete from am_progreso where inscripcion_id=$1 and leccion_id=$2", [iid, lid])
  else {
    await q("insert into am_progreso(inscripcion_id, leccion_id) values ($1,$2) on conflict do nothing", [iid, lid])
    await q("insert into am_eventos(contacto_id, inscripcion_id, tipo, ref) values ($1,$2,'leccion',$3)", [c.id, iid, String(lid)])
  }
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [iid])
  const aprobado = await evaluar(iid)
  const sig = String(fd.get("siguiente") ?? "")
  redirect(aprobado ? `/portal/cursos/${iid}` : sig && fd.get("op") !== "deshacer" ? `/portal/cursos/${iid}/l/${sig}` : `/portal/cursos/${iid}/l/${lid}`)
}

export default async function Leccion({ params }: { params: { id: string; lid: string } }) {
  const c = await requerirCliente()
  const i = await inscripcionDe(c.id, Number(params.id))
  if (!i) notFound()
  const lecciones = await leccionesDe(i.curso_id, i.id)
  const k = lecciones.findIndex((l) => l.id === Number(params.lid))
  if (k < 0) notFound()
  const l = lecciones[k], ant = lecciones[k - 1], sig = lecciones[k + 1]
  const video = embedVideo(l.video_url)
  await q("update am_inscripciones set ultima_actividad=now() where id=$1", [i.id])
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Link href={`/portal/cursos/${i.id}`} className="text-sm underline text-[#4A515C] self-start">← {i.titulo}</Link>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#4A515C]">{l.modulo || "Contenido"} · Lección {k + 1} de {lecciones.length} · {tipoLeccion(l.tipo).n}</span>
        <h1 className="m-0 mt-1">{l.titulo}</h1>
      </div>
      {video ? (
        <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16 / 9" }}>
          <iframe src={video} title={l.titulo} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      ) : l.video_url ? <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="btn-s self-start">Ver el video ↗</a> : null}
      {l.contenido && <article className="card prosa" dangerouslySetInnerHTML={{ __html: mdWeb(l.contenido) }} />}
      {l.archivo_url && (
        <a href={`/portal/descargar/${i.id}/${l.id}`} className="card flex items-center gap-3 hover:border-[#C8231F]">
          <span className="w-10 h-10 rounded-xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-lg" aria-hidden="true">⤓</span>
          <span><strong className="block">Descargar material</strong><span className="text-xs text-[#4A515C]">Exclusivo para inscriptos</span></span>
        </a>
      )}
      <form action={completar} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E5EA] pt-4">
        <input type="hidden" name="iid" value={i.id} /><input type="hidden" name="lid" value={l.id} />{sig && <input type="hidden" name="siguiente" value={sig.id} />}
        {ant ? <Link href={`/portal/cursos/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
        {l.completada
          ? <span className="flex items-center gap-3"><span className="text-sm text-emerald-700 font-semibold">✓ Completada</span><button name="op" value="deshacer" className="text-xs underline text-[#4A515C]">Desmarcar</button>{sig && <Link href={`/portal/cursos/${i.id}/l/${sig.id}`} className="btn-p">Siguiente →</Link>}</span>
          : <button name="op" value="completar" className="btn-p">{sig ? "Completar y seguir →" : "Completar lección"}</button>}
      </form>
    </div>
  )
}
