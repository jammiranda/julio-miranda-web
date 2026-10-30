import Link from "next/link"
import { estadoInsc, modalidad, tipoLeccion, urlCertificado, embedVideo, descargaAula, quizDe, type BaseAula, type Avance } from "@/lib/cursos"
import { mdWeb } from "@/lib/academia"
import { completarLeccion, pedirVideollamada } from "@/lib/aula-acciones"
import { fecha } from "@/lib/util"

/**
 * Aula del alumno: las mismas piezas se usan en el portal (/portal/cursos) y en la Academia (/mi-cuenta/cursos).
 * `base` define a dónde apuntan los links; la identidad visual la pone el layout de cada sitio.
 */

export const fh = (d: any) => new Date(d).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

export const Barra = ({ pct, label }: { pct: number; label: string }) => (
  <div>
    <div className="flex justify-between text-xs text-[#4A515C]"><span>{label}</span><span>{pct}%</span></div>
    <div className="h-2 rounded-full bg-[#E2E5EA] mt-1 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#C8231F] rounded-full" style={{ width: `${pct}%` }} /></div>
  </div>
)

/** Tarjetas de "Mis cursos" con avance. */
export function TarjetasCursos({ ins, base }: { ins: any[]; base: BaseAula }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ins.map((x) => {
        const e = estadoInsc(x.estado)
        return (
          <Link key={x.id} href={`${base}/${x.id}`} className="card flex flex-col gap-3 no-underline text-[#0E1116] hover:border-[#C8231F]">
            <div className="flex items-start justify-between gap-2">
              <div><strong className="block text-[17px]">{x.titulo}</strong><span className="text-sm text-[#4A515C]">{modalidad(x.modalidad)} · {x.edicion}</span></div>
              <span className={`chip ${e.c} shrink-0`}>{e.n}</span>
            </div>
            {x.av.lecciones > 0 && <Barra pct={x.av.pctLecciones} label={`Lecciones: ${x.av.hechas} de ${x.av.lecciones}`} />}
            {x.av.clases > 0 && <Barra pct={x.av.pctAsistencia} label={`Asistencia: ${x.av.presentes} de ${x.av.clases} clases`} />}
            <div className="flex flex-wrap gap-x-4 text-xs text-[#4A515C]">
              {x.inicio && <span>Inicio {fecha(x.inicio)}</span>}
              {x.horario && <span>{x.horario}</span>}
              {x.certificado && <span className="font-semibold text-emerald-700">Certificado disponible</span>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/** Lista de certificados con link a /certificado/CÓDIGO. */
export function Certificados({ ins }: { ins: any[] }) {
  const certs = ins.filter((x) => x.certificado)
  if (!certs.length) return null
  return (
    <section id="certificados" className="card scroll-mt-24" aria-labelledby="t-cert">
      <h2 id="t-cert" className="m-0 text-base">Mis certificados</h2>
      <ul className="m-0 mt-2 p-0 list-none flex flex-col">
        {certs.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#EEF0F3] last:border-0">
            <span><strong className="text-sm">{x.titulo}</strong><span className="block text-xs text-[#4A515C]">Código {x.certificado} · {fecha(x.aprobado_en)}</span></span>
            <a href={urlCertificado(x.certificado)} className="btn-s py-1.5">Ver y descargar</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Vista de un curso: certificado o siguiente lección, avance, contenido por módulo y clases en vivo. */
export function AulaCurso({ base, i, lecciones, av, clases, volver, aprobadoRecien }: { base: BaseAula; i: any; lecciones: any[]; av: Avance; clases: any[]; volver: { href: string; t: string }; aprobadoRecien?: boolean }) {
  const e = estadoInsc(i.estado)
  const siguiente = lecciones.find((l) => !l.completada)
  const corte = Date.now() - 3 * 3600e3
  const proximas = clases.filter((k) => new Date(k.fecha).getTime() > corte)
  const pasadas = clases.filter((k) => new Date(k.fecha).getTime() <= corte)
  const modulos: { nombre: string; items: any[] }[] = []
  for (const l of lecciones) {
    const n = l.modulo || "Contenido"
    const m = modulos.find((x) => x.nombre === n)
    m ? m.items.push(l) : modulos.push({ nombre: n, items: [l] })
  }
  return (
    <div className="flex flex-col gap-5">
      <Link href={volver.href} className="text-sm underline text-[#4A515C] self-start">← {volver.t}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="m-0">{i.titulo}</h1><p className="m-0 text-[#4A515C]">{modalidad(i.modalidad)} · {i.edicion}{i.docente ? ` · Docente: ${i.docente}` : ""}</p></div>
        <span className={`chip ${e.c}`}>{e.n}</span>
      </div>

      {i.certificado ? (
        <div role={aprobadoRecien ? "status" : undefined} className="card !border-emerald-300 !bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
          <span><strong>¡Aprobaste el curso!</strong> <span className="text-sm">Tu certificado tiene el código {i.certificado}.</span></span>
          <a href={urlCertificado(i.certificado)} className="btn-p py-1.5">Ver y descargar certificado</a>
        </div>
      ) : i.estado === "aprobado" ? (
        <div role="status" className="card !border-emerald-300 !bg-emerald-50"><strong>¡Aprobaste el curso!</strong></div>
      ) : siguiente ? (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">Seguí por: <strong>{siguiente.titulo}</strong></span>
          <Link href={`${base}/${i.id}/l/${siguiente.id}`} className="btn-p py-1.5">{av.hechas ? "Continuar" : "Empezar"}</Link>
        </div>
      ) : null}

      <section className="card grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Tu avance">
        {av.lecciones > 0 && <div><span className="text-xs text-[#4A515C]">Lecciones</span><strong className="block text-xl">{av.hechas} / {av.lecciones}</strong><span className="text-xs text-[#4A515C]">Necesitás {i.req_lecciones}%</span></div>}
        {av.clases > 0 && <div><span className="text-xs text-[#4A515C]">Asistencia</span><strong className="block text-xl">{av.presentes} / {av.clases}</strong><span className="text-xs text-[#4A515C]">Necesitás {i.req_asistencia}%</span></div>}
        <div><span className="text-xs text-[#4A515C]">Fechas</span><strong className="block text-sm mt-1">{i.inicio ? `${fecha(i.inicio)}${i.fin ? ` al ${fecha(i.fin)}` : ""}` : "A tu ritmo"}</strong>{i.horario && <span className="text-xs text-[#4A515C]">{i.horario}</span>}</div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="card lg:col-span-2 flex flex-col gap-4" aria-labelledby="t-cont">
          <h2 id="t-cont" className="m-0 text-base">Contenido del curso</h2>
          {!lecciones.length && <p className="m-0 text-sm text-[#4A515C]">El contenido se habilita con el inicio de la cursada.</p>}
          {modulos.map((m) => (
            <div key={m.nombre}>
              <h3 className="m-0 mb-1 text-xs font-bold uppercase tracking-wider text-[#4A515C]">{m.nombre}</h3>
              <ul className="m-0 p-0 list-none">
                {m.items.map((l) => (
                  <li key={l.id}>
                    <Link href={`${base}/${i.id}/l/${l.id}`} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg no-underline text-[#0E1116] hover:bg-[#F5F6F8]">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${l.completada ? "bg-[#0E1116] text-white" : "bg-[#F5F6F8] text-[#C8231F] border border-[#E2E5EA]"}`} aria-hidden="true">{l.completada ? "✓" : tipoLeccion(l.tipo).i}</span>
                      <span className="flex-1 text-sm"><strong className="font-semibold">{l.titulo}</strong><span className="block text-xs text-[#4A515C]">{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{l.completada ? " · Completada" : ""}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <aside className="flex flex-col gap-5">
          {i.videollamada && (
            <section className="card flex flex-col gap-3 !border-[#C8231F]/40" aria-labelledby="t-video">
              <h2 id="t-video" className="m-0 text-base">Pedí una videollamada con el docente</h2>
              {i.videollamada_en ? (
                <>
                  <p className="m-0 text-sm text-[#4A515C]">Ya la pediste el {fecha(i.videollamada_en)}. Si todavía no elegiste día y horario, hacelo desde la agenda. Si ya la agendaste, te llegó la confirmación por email.</p>
                  <form action={pedirVideollamada}><input type="hidden" name="base" value={base} /><input type="hidden" name="iid" value={i.id} /><button className="btn-s w-full">Ver o elegir horario</button></form>
                </>
              ) : (
                <form action={pedirVideollamada} className="flex flex-col gap-2">
                  <input type="hidden" name="base" value={base} /><input type="hidden" name="iid" value={i.id} />
                  <p className="m-0 text-sm text-[#4A515C]">Tu curso incluye <strong className="text-[#0E1116]">1 videollamada de 30 minutos</strong>{i.docente ? <> con {i.docente}</> : null} para resolver dudas o revisar tu caso. Elegís día y horario en la agenda.</p>
                  <label className="lbl text-sm">¿De qué querés hablar? (opcional)<textarea name="tema" rows={2} maxLength={600} className="inp text-sm" placeholder="Ej.: revisar mi plan de automatización" /></label>
                  <button className="btn-p">Pedir mi videollamada</button>
                </form>
              )}
            </section>
          )}
          {(i.link || i.lugar || clases.length > 0) && (
            <section className="card flex flex-col gap-2" aria-labelledby="t-clases">
              <h2 id="t-clases" className="m-0 text-base">Clases en vivo</h2>
              {i.lugar && <p className="m-0 text-sm">Lugar: {i.lugar}</p>}
              {i.link && <a href={i.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Sala de clases en vivo</a>}
              {proximas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Próximas</h3>}
              {proximas.map((k) => (
                <div key={k.id} className="text-sm"><strong className="block">{fh(k.fecha)}</strong>{k.tema && <span className="text-[#4A515C]">{k.tema}</span>}{(k.link || i.link) && <> · <a href={k.link || i.link} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Entrar</a></>}</div>
              ))}
              {pasadas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Dadas</h3>}
              {pasadas.map((k) => (
                <div key={k.id} className="text-sm flex justify-between gap-2"><span>{fecha(k.fecha)}{k.tema ? ` · ${k.tema}` : ""}{k.grabacion && <> · <a href={k.grabacion} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Grabación</a></>}</span><span className={k.presente ? "text-emerald-700" : k.presente === false ? "text-rojo" : "text-[#4A515C]"}>{k.presente ? "Presente" : k.presente === false ? "Ausente" : "—"}</span></div>
              ))}
            </section>
          )}
          {i.descripcion && (
            <section className="card" aria-labelledby="t-acerca">
              <h2 id="t-acerca" className="m-0 text-base">Sobre el curso</h2>
              <div className="prosa !text-[15px] mt-2" dangerouslySetInnerHTML={{ __html: mdWeb(i.descripcion) }} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

/** Vista de una lección: video, contenido, material y "marcar como vista". */
export function AulaLeccion({ base, i, lecciones, k, quiz }: { base: BaseAula; i: any; lecciones: any[]; k: number; quiz?: { bien: number; total: number; r: (number | null)[] } }) {
  const l = lecciones[k], ant = lecciones[k - 1], sig = lecciones[k + 1]
  const video = embedVideo(l.video_url)
  const preguntas = quizDe(l.quiz)
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Link href={`${base}/${i.id}`} className="text-sm underline text-[#4A515C] self-start">← {i.titulo}</Link>
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
        <a href={descargaAula(base, i.id, l.id)} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 no-underline text-[#0E1116] hover:border-[#C8231F]">
          <span className="w-10 h-10 rounded-xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-lg" aria-hidden="true">⤓</span>
          <span><strong className="block">Descargar material</strong><span className="text-xs text-[#4A515C]">Exclusivo para inscriptos</span></span>
        </a>
      )}
      <form action={completarLeccion} className="flex flex-col gap-4 border-t border-[#E2E5EA] pt-4">
        <input type="hidden" name="base" value={base} /><input type="hidden" name="iid" value={i.id} /><input type="hidden" name="lid" value={l.id} />{sig && <input type="hidden" name="siguiente" value={sig.id} />}
        {preguntas.length > 0 && !l.completada && (
          <fieldset id="quiz" className="card m-0 flex flex-col gap-4 scroll-mt-24">
            <legend className="sr-only">Autoevaluación</legend>
            <div><h2 className="m-0 text-lg">Autoevaluación</h2><p className="m-0 text-sm text-[#4A515C]">Respondé para marcar la lección como vista. Necesitás {Math.ceil(preguntas.length * 0.7 - 0.04)} de {preguntas.length} bien; podés intentarlo las veces que quieras.</p></div>
            {quiz && <p role="alert" className="m-0 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm"><strong>Tuviste {quiz.bien} de {quiz.total}.</strong> Revisá las marcadas y probá de nuevo.</p>}
            {preguntas.map((p, n) => {
              const marcada = quiz?.r[n]
              const mal = quiz && marcada !== p.c
              return (
                <div key={n} role="radiogroup" aria-labelledby={`qp${n}`} className={`flex flex-col gap-2 ${mal ? "rounded-xl bg-[#FDECEB] p-3 -mx-3" : ""}`}>
                  <p id={`qp${n}`} className="m-0 font-semibold">{n + 1}. {p.p}</p>
                  {p.o.map((o, j) => (
                    <label key={j} className="flex gap-3 items-start text-[15px] rounded-xl border border-[#E2E5EA] bg-white p-3 min-h-[48px] cursor-pointer has-[:checked]:border-[#C8231F]">
                      <input type="radio" name={`q${n}`} value={j} required defaultChecked={marcada === j} className="mt-0.5" /><span>{o}</span>
                    </label>
                  ))}
                  {quiz && !mal && p.e && <p className="m-0 text-sm text-emerald-800">✓ {p.e}</p>}
                </div>
              )
            })}
          </fieldset>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
        {ant ? <Link href={`${base}/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
        {l.completada
          ? <span className="flex flex-wrap items-center gap-3"><span className="text-sm text-emerald-700 font-semibold">✓ Vista</span><button name="op" value="deshacer" className="text-xs underline text-[#4A515C] bg-transparent border-0 cursor-pointer">Desmarcar</button>{sig && <Link href={`${base}/${i.id}/l/${sig.id}`} className="btn-p">Siguiente →</Link>}</span>
          : <button name="op" value="completar" className="btn-p">{preguntas.length ? "Enviar respuestas y marcar como vista" : sig ? "Marcar como vista y seguir →" : "Marcar como vista"}</button>}
        </div>
      </form>
    </div>
  )
}

/** Resultado de un intento de quiz que vuelve en la URL (?quiz=2-3&r=0.1.x). */
export function leerQuiz(sp: { quiz?: string; r?: string }) {
  const m = sp.quiz?.match(/^(\d+)-(\d+)$/)
  if (!m) return undefined
  return { bien: Number(m[1]), total: Number(m[2]), r: (sp.r ?? "").split(".").map((x) => (/^\d+$/.test(x) ? Number(x) : null)) }
}
