import Link from "next/link"
import { notFound } from "next/navigation"
import { q } from "@/lib/db"
import { requerirAutor, cursoDe } from "@/lib/autores"
import { guardarCursoAutor, leccionAutor, pedirEstadoAutor } from "@/lib/autor-acciones"
import { MODALIDADES, TIPOS_LECCION, tipoLeccion, quizDe, pesos, dolares } from "@/lib/cursos"
import { fecha } from "@/lib/util"
import { CabeceraAutor, ESTADO_CURSO, Chip } from "../../_ui"

export const dynamic = "force-dynamic"

const Campo = ({ l, children, className = "" }: { l: string; children: React.ReactNode; className?: string }) => <label className={`lbl ${className}`}>{l}{children}</label>
const Fijo = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="text-sm"><span className="block text-xs text-[#4A515C]">{l}</span><strong>{v}</strong></div>

type SP = { ok?: string; err?: string; lok?: string; lerr?: string; editar?: string; pedido?: string }

/** Editor del autor: contenido del curso y lecciones. Lo comercial y la publicación se ven, pero no se editan. */
export default async function CursoAutor({ params, searchParams }: { params: { id: string }; searchParams: SP }) {
  const a = await requerirAutor()
  const c = await cursoDe(a, Number(params.id))
  if (!c) notFound()
  const [lecciones, cambios] = await Promise.all([
    q<any>("select l.*, (select count(*)::int from am_progreso p where p.leccion_id=l.id) hechas from am_lecciones l where l.curso_id=$1 order by l.orden, l.id", [c.id]),
    q<any>("select id, tipo, resumen, estado, creado from am_cambios_autor where curso_id=$1 order by id desc limit 15", [c.id]),
  ])
  const pedido = cambios.find((x) => x.tipo === "pedido_estado" && x.estado === "pendiente")
  const ed = searchParams.editar ? lecciones.find((l) => l.id === Number(searchParams.editar)) : null
  const e = ESTADO_CURSO[c.estado] ?? ESTADO_CURSO.borrador
  return (
    <div className="flex flex-col gap-5">
      <CabeceraAutor a={a} activa={null} titulo={c.titulo} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/autor" className="text-sm underline text-[#4A515C]">← Mis cursos</Link>
        <span className="flex gap-2 items-center"><Chip c={e.c}>{e.n}</Chip><Link href={`/autor/alumnos?curso=${c.id}`} className="btn-s py-1.5">Ver alumnos</Link></span>
      </div>

      <section className="card grid grid-cols-2 md:grid-cols-4 gap-3 !bg-[#F8F9FB]" aria-labelledby="t-fijo">
        <h2 id="t-fijo" className="m-0 col-span-full text-base">Lo maneja Dirección</h2>
        <Fijo l="Precio" v={c.precio ? pesos(c.precio) : "Gratis"} />
        <Fijo l="Precio en USD" v={c.precio_usd ? dolares(c.precio_usd) : "—"} />
        <Fijo l="Modalidad" v={MODALIDADES.find((m) => m.v === c.modalidad)?.n ?? c.modalidad} />
        <Fijo l="Horas (certificado)" v={c.horas ? `${Number(c.horas)} h` : "—"} />
        <Fijo l="Docentes" v={c.docente ?? "—"} />
        <Fijo l="Para aprobar" v={`${c.req_lecciones}% de lecciones`} />
        <Fijo l="Certificado" v={c.certifica ? "Sí" : "No"} />
        <Fijo l="Videollamada incluida" v={c.videollamada ? "Sí, 30 min" : "No"} />
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="t-estado">
        <h2 id="t-estado" className="m-0 text-base">Estado del curso</h2>
        {searchParams.pedido && <p role="status" className="m-0 text-sm text-emerald-700">Listo: le avisamos a Dirección. El estado cambia cuando lo apruebe.</p>}
        {pedido
          ? <p className="m-0 text-sm">Pediste: <strong>{pedido.resumen}</strong> ({fecha(pedido.creado)}). Está esperando la aprobación de Dirección.</p>
          : <p className="m-0 text-sm text-[#4A515C]">Publicar, volver a borrador o archivar el curso lo aprueba Dirección. Pedilo acá y te avisamos.</p>}
        <form action={pedirEstadoAutor} className="flex flex-wrap gap-2 items-end">
          <input type="hidden" name="id" value={c.id} />
          <Campo l="Pedir pasar a"><select name="estado" defaultValue="" className="inp" required>
            <option value="" disabled>Elegí…</option>
            {["publicado", "borrador", "archivado"].filter((x) => x !== c.estado).map((x) => <option key={x} value={x}>{ESTADO_CURSO[x].n}</option>)}
          </select></Campo>
          <Campo l="Comentario para Dirección (opcional)" className="flex-1 min-w-[220px]"><input name="motivo" maxLength={500} className="inp" placeholder="Ya está completo y revisado…" /></Campo>
          <button className="btn-s">Enviar pedido</button>
        </form>
      </section>

      <form action={guardarCursoAutor} className="card grid grid-cols-1 md:grid-cols-4 gap-3" aria-labelledby="t-textos">
        <input type="hidden" name="id" value={c.id} />
        <div className="md:col-span-4 flex items-center justify-between gap-2">
          <h2 id="t-textos" className="m-0 text-base">Textos del curso</h2>
          {searchParams.ok === "1" && <span role="status" className="text-sm text-emerald-700">Guardado. Dirección lo va a revisar.</span>}
          {searchParams.ok === "sin" && <span role="status" className="text-sm text-[#4A515C]">No había cambios para guardar.</span>}
        </div>
        {searchParams.err && <p role="alert" className="m-0 md:col-span-4 text-sm text-rojo">Falta el título.</p>}
        <Campo l="Título *" className="md:col-span-3"><input name="titulo" required maxLength={160} defaultValue={c.titulo} className="inp" /></Campo>
        <Campo l="Nivel"><input name="nivel" maxLength={60} defaultValue={c.nivel ?? ""} className="inp" placeholder="Inicial, intermedio…" /></Campo>
        <Campo l="Bajada (una línea)" className="md:col-span-4"><input name="bajada" maxLength={300} defaultValue={c.bajada ?? ""} className="inp" /></Campo>
        <Campo l="Descripción (texto simple: ## títulos, - listas, **negrita**)" className="md:col-span-4"><textarea name="descripcion" rows={10} defaultValue={c.descripcion} className="inp font-mono text-sm" /></Campo>
        <div className="md:col-span-4"><button className="btn-p">Guardar textos</button></div>
      </form>

      <section id="lecciones" className="card flex flex-col gap-3 scroll-mt-24" aria-labelledby="t-lec">
        <h2 id="t-lec" className="m-0 text-base">Lecciones, quiz y materiales ({lecciones.length})</h2>
        {searchParams.lok === "1" && <p role="status" className="m-0 text-sm text-emerald-700">Lección guardada. Dirección la va a revisar.</p>}
        {searchParams.lok === "sin" && <p role="status" className="m-0 text-sm text-[#4A515C]">No había cambios en la lección.</p>}
        <ul className="m-0 p-0 list-none flex flex-col">
          {lecciones.map((l, k) => (
            <li key={l.id} className={`flex flex-wrap items-center gap-3 py-2 border-b border-[#EEF0F3] ${l.publicada ? "" : "opacity-60"}`}>
              <span className="w-7 text-center text-[#C8231F]" aria-hidden="true">{tipoLeccion(l.tipo).i}</span>
              <span className="flex-1 min-w-[200px]"><span className="text-xs text-[#4A515C]">{k + 1}. {l.modulo ? `${l.modulo} · ` : ""}{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{l.quiz ? ` · Quiz (${quizDe(l.quiz).length})` : ""}{!l.publicada ? " · Oculta" : ""} · {l.hechas} completaron</span><strong className="block text-sm">{l.titulo}</strong></span>
              <form action={leccionAutor} className="flex gap-1 items-center text-xs">
                <input type="hidden" name="id" value={c.id} /><input type="hidden" name="lid" value={l.id} />
                <button name="op" value="subir" disabled={k === 0} aria-label={`Subir ${l.titulo}`} className="w-8 h-8 rounded hover:bg-[#F5F6F8] disabled:opacity-30">↑</button>
                <button name="op" value="bajar" disabled={k === lecciones.length - 1} aria-label={`Bajar ${l.titulo}`} className="w-8 h-8 rounded hover:bg-[#F5F6F8] disabled:opacity-30">↓</button>
                <Link href={`/autor/cursos/${c.id}?editar=${l.id}#editor`} className="underline px-1">Editar</Link>
                <button name="op" value={l.publicada ? "ocultar" : "mostrar"} className="underline px-1">{l.publicada ? "Ocultar" : "Mostrar"}</button>
              </form>
            </li>
          ))}
          {!lecciones.length && <li className="py-3 text-sm text-[#4A515C]">Todavía no hay lecciones. Agregá la primera abajo.</li>}
        </ul>
        <form id="editor" key={ed?.id ?? "nueva"} action={leccionAutor} className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl bg-[#F8F9FB] p-4 scroll-mt-24">
          <input type="hidden" name="id" value={c.id} />{ed && <input type="hidden" name="lid" value={ed.id} />}
          <h3 className="m-0 md:col-span-4 text-sm font-bold">{ed ? `Editar: ${ed.titulo}` : "Nueva lección"}</h3>
          {searchParams.lerr === "titulo" && <p role="alert" className="m-0 md:col-span-4 text-sm text-rojo">Falta el título de la lección.</p>}
          {searchParams.lerr === "quiz" && <p role="alert" className="m-0 md:col-span-4 text-sm text-rojo">El quiz no tiene el formato correcto: no se guardó nada. Revisalo (cada pregunta necesita "p", al menos 2 opciones en "o" y la correcta en "c").</p>}
          <Campo l="Título *" className="md:col-span-2"><input name="titulo" required maxLength={200} defaultValue={ed?.titulo ?? ""} className="inp" /></Campo>
          <Campo l="Módulo"><input name="modulo" maxLength={120} defaultValue={ed?.modulo ?? ""} className="inp" placeholder="Módulo 1 · Fundamentos" /></Campo>
          <Campo l="Tipo"><select name="tipo" defaultValue={ed?.tipo ?? "video"} className="inp">{TIPOS_LECCION.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></Campo>
          <Campo l="Video (YouTube, Vimeo, Loom o Drive, https)" className="md:col-span-2"><input name="video_url" type="url" defaultValue={ed?.video_url ?? ""} className="inp" /></Campo>
          <Campo l="Material para descargar (link https)"><input name="archivo_url" defaultValue={ed?.archivo_url ?? ""} className="inp" placeholder="Drive, Dropbox…" /></Campo>
          <Campo l="Duración (min)"><input name="duracion_min" type="number" min={0} max={999} defaultValue={ed?.duracion_min ?? ""} className="inp" /></Campo>
          <Campo l="Contenido (texto simple)" className="md:col-span-4"><textarea name="contenido" rows={8} defaultValue={ed?.contenido ?? ""} className="inp font-mono text-sm" /></Campo>
          <Campo l={`Quiz corto (opcional, JSON: [{"p":"Pregunta","o":["A","B","C"],"c":0,"e":"Por qué"}] · c = número de la opción correcta, desde 0)`} className="md:col-span-4"><textarea name="quiz" rows={4} defaultValue={ed?.quiz ? JSON.stringify(ed.quiz) : ""} className="inp font-mono text-xs" /></Campo>
          <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="publicada" value="1" defaultChecked={ed ? ed.publicada : true} /> Visible para alumnos</label>
          <div className="md:col-span-3 flex gap-2 justify-end">{ed && <Link href={`/autor/cursos/${c.id}#lecciones`} className="btn-s">Cancelar</Link>}<button name="op" value="guardar" className="btn-p">{ed ? "Guardar cambios" : "Agregar lección"}</button></div>
          <p className="m-0 md:col-span-4 text-xs text-[#4A515C]">Para quitar una lección, ocultala: Dirección decide si se borra. Si el material es un archivo protegido del repositorio, lo carga Dirección.</p>
        </form>
      </section>

      {cambios.length > 0 && (
        <section className="card flex flex-col gap-2" aria-labelledby="t-hist">
          <h2 id="t-hist" className="m-0 text-base">Tus últimos cambios</h2>
          <ul className="m-0 p-0 list-none flex flex-col text-sm">
            {cambios.map((x) => (
              <li key={x.id} className="flex flex-wrap justify-between gap-2 py-1.5 border-b border-[#EEF0F3] last:border-0">
                <span>{x.resumen}</span>
                <span className="text-xs text-[#4A515C]">{fecha(x.creado)} · {({ pendiente: "En revisión", revisado: "Revisado", revertido: "Revertido por Dirección", aprobado: "Aprobado", rechazado: "No aprobado" } as Record<string, string>)[x.estado] ?? x.estado}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
