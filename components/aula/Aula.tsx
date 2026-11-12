import Link from "next/link"
import { estadoInsc, modalidad, modalidadYEdicion, tipoLeccion, urlCertificado, embedVideo, descargaAula, quizDe, pesos, dolares, textoCuotas, textoGratis, type BaseAula, type Avance } from "@/lib/cursos"
import { mdWeb, URL_ACADEMIA } from "@/lib/academia"
import { firmaCurso } from "@/lib/portadas"
import { completarLeccion, pedirVideollamada } from "@/lib/aula-acciones"
import { fecha } from "@/lib/util"

/**
 * Aula del alumno: las mismas piezas se usan en el portal (/portal/cursos) y en la Academia (/mi-cuenta/cursos).
 * `base` define a dónde apuntan los links; la identidad visual (colores, tipografía) la ponen las variables CSS del
 * contenedor: en la Academia `data-espacio="academia"` (crema y verde azulado), en el portal los valores base.
 */

export const fh = (d: any) => new Date(d).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

const TIT = { fontFamily: "var(--fuente-titulos)" } as const

export const Barra = ({ pct, label }: { pct: number; label: string }) => (
  <div>
    <div className="flex justify-between text-xs text-[#4A515C]"><span>{label}</span><span className="font-semibold">{pct}%</span></div>
    <div className="h-2 rounded-full bg-[#E9E5DA] mt-1 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[var(--ac)] transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
  </div>
)

/** Avance en forma de anillo: se lee de un vistazo y ocupa poco lugar. */
export function Anillo({ pct, size = 64, trazo = 7, claro = false }: { pct: number; size?: number; trazo?: number; claro?: boolean }) {
  const r = (size - trazo) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${p}% completado`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={trazo} stroke={claro ? "rgba(255,255,255,.22)" : "var(--borde)"} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={trazo} strokeLinecap="round" stroke={claro ? "#A7F3E6" : "var(--ac)"} strokeDasharray={`${(c * p) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={claro ? "#fff" : "var(--tinta)"} style={{ fontSize: size * 0.27, fontWeight: 700 }}>{p}%</text>
    </svg>
  )
}

const Candado = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
)

const Tilde = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)

/** Dónde se compra el curso completo (desde el portal va a la Academia). */
const urlCompra = (base: BaseAula, slug: string) => `${base === "/mi-cuenta/cursos" ? "" : URL_ACADEMIA}/cursos/${slug}#inscripcion`

const bordeAc = { borderColor: "color-mix(in srgb, var(--ac) 38%, transparent)" } as const

/**
 * Llamado para pasar del módulo gratis al curso completo: precio en pesos y dólares, cuotas y qué se desbloquea.
 * La compra convierte esta misma inscripción (no se duplica) y conserva el avance.
 */
export function Desbloquear({ base, i, titulo = "Desbloqueá el curso completo", texto }: { base: BaseAula; i: any; titulo?: string; texto?: string }) {
  return (
    <section className="card flex flex-col gap-3" style={bordeAc} aria-labelledby="t-desbloquear">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-[var(--ac-suave)] text-[var(--ac-texto)] flex items-center justify-center"><Candado className="w-5 h-5" /></span>
        <div className="flex flex-col gap-1">
          <h2 id="t-desbloquear" className="m-0 text-lg" style={TIT}>{titulo}</h2>
          <p className="m-0 text-sm text-[#4A515C]">{texto ?? `Estás cursando gratis ${Number(i.gratis_modulos) > 1 ? `los módulos 1 a ${i.gratis_modulos}` : "el módulo 1"}. Con el curso completo seguís con todos los módulos, descargás el apunte y el cuaderno en PDF (son tuyos), las plantillas, pedís tu videollamada y obtenés el certificado verificable. Tu avance queda guardado.`}</p>
        </div>
      </div>
      {i.precio && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#EEF0F3] pt-3">
          <div className="flex flex-col gap-0.5">
            <strong className="text-2xl leading-none" style={TIT}>{pesos(i.precio)} <span className="text-sm font-semibold text-[#4A515C]">ARS</span></strong>
            {i.precio_usd && <span className="text-sm text-[#262C37]"><strong>{dolares(i.precio_usd)}</strong> desde el exterior</span>}
            {i.cuotas > 1 && <span className="text-sm font-semibold text-emerald-700">{textoCuotas(i.precio, i.cuotas)}</span>}
          </div>
          <a href={urlCompra(base, i.slug)} className="btn-p">Desbloquear el curso completo</a>
        </div>
      )}
    </section>
  )
}

/** Tarjetas de "Mis cursos" con avance. */
export function TarjetasCursos({ ins, base }: { ins: any[]; base: BaseAula }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ins.map((x) => {
        const e = estadoInsc(x.estado)
        const accion = x.certificado ? "Ver certificado" : x.av.hechas ? "Continuar" : "Empezar"
        return (
          <Link key={x.id} href={`${base}/${x.id}`} className="card flex flex-col gap-4 no-underline text-[#0E1116] group">
            <div className="flex items-center gap-4">
              {x.av.lecciones > 0 ? <Anillo pct={x.av.pctLecciones} size={58} /> : <span className="w-[58px] h-[58px] shrink-0 rounded-full bg-[var(--ac-suave)] text-[var(--ac-texto)] flex items-center justify-center"><Tilde className="w-6 h-6" /></span>}
              <div className="min-w-0">
                <strong className="block text-[17px] leading-snug" style={TIT}>{x.titulo}</strong>
                <span className="text-sm text-[#4A515C]">{modalidadYEdicion(x.modalidad, x.edicion)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`chip ${e.c}`}>{e.n}</span>
              {x.parcial && <span className="chip bg-[var(--ac-suave)] text-[var(--ac-texto)]">{textoGratis(x.gratis_modulos)}</span>}
              {x.certificado && <span className="chip bg-emerald-50 text-emerald-700">Certificado disponible</span>}
            </div>
            {x.av.lecciones > 0 && <Barra pct={x.av.pctLecciones} label={`Lecciones: ${x.av.hechas} de ${x.av.lecciones}`} />}
            {x.av.clases > 0 && <Barra pct={x.av.pctAsistencia} label={`Asistencia: ${x.av.presentes} de ${x.av.clases} clases`} />}
            <div className="flex items-center justify-between gap-3 text-xs text-[#4A515C] mt-auto pt-1">
              <span>{x.inicio ? `Inicio ${fecha(x.inicio)}` : ""}{x.inicio && x.horario ? " · " : ""}{x.horario ?? ""}</span>
              <span className="font-bold text-sm text-[var(--ac-texto)] group-hover:translate-x-0.5 transition-transform">{accion} →</span>
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
      <h2 id="t-cert" className="m-0 text-lg" style={TIT}>Mis certificados</h2>
      <ul className="m-0 mt-2 p-0 list-none flex flex-col">
        {certs.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-[#EEF0F3] last:border-0">
            <span><strong className="text-sm">{x.titulo}</strong><span className="block text-xs text-[#4A515C]">Código {x.certificado} · {fecha(x.aprobado_en)}</span></span>
            <a href={urlCertificado(x.certificado)} className="btn-s py-1.5">Ver y descargar</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Índice del curso por módulos, con la lección actual marcada. Se usa de columna fija (escritorio) y plegable (celular). */
function Indice({ base, i, lecciones, actual }: { base: BaseAula; i: any; lecciones: any[]; actual: number }) {
  const modulos: { nombre: string; items: any[] }[] = []
  for (const l of lecciones) {
    const n = l.modulo || "Contenido"
    const m = modulos.find((x) => x.nombre === n)
    m ? m.items.push(l) : modulos.push({ nombre: n, items: [l] })
  }
  return (
    <nav aria-label="Contenido del curso" className="flex flex-col gap-4">
      {modulos.map((m) => (
        <div key={m.nombre}>
          <h3 className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6E6758]">{m.nombre}</h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
            {m.items.map((l) => {
              const on = l.id === actual
              return (
                <li key={l.id}>
                  <Link href={`${base}/${i.id}/l/${l.id}`} aria-current={on ? "page" : undefined} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] leading-snug no-underline ${on ? "bg-[var(--ac-suave)] text-[var(--ac-texto)] font-bold" : "text-[#262C37] hover:bg-[#F1ECE0]"}`}>
                    <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] ${l.completada ? "bg-[var(--ac)] text-white" : l.bloqueada ? "bg-[#F1ECE0] text-[#6E6758]" : "border border-[var(--borde-fuerte)] text-transparent"}`}>{l.completada ? <Tilde className="w-3 h-3" /> : l.bloqueada ? <Candado className="w-3 h-3" /> : "·"}</span>
                    <span className="flex-1">{l.titulo}</span>
                    {l.duracion_min ? <span className="text-[11px] text-[#6E6758] shrink-0">{l.duracion_min} min</span> : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Vista de un curso: certificado o siguiente lección, avance, contenido por módulo y clases en vivo. */
export function AulaCurso({ base, i, lecciones, av, clases, volver, aprobadoRecien }: { base: BaseAula; i: any; lecciones: any[]; av: Avance; clases: any[]; volver: { href: string; t: string }; aprobadoRecien?: boolean }) {
  const e = estadoInsc(i.estado)
  const siguiente = lecciones.find((l) => !l.completada && !l.bloqueada)
  const corte = Date.now() - 3 * 3600e3
  const proximas = clases.filter((k) => new Date(k.fecha).getTime() > corte)
  const pasadas = clases.filter((k) => new Date(k.fecha).getTime() <= corte)
  const modulos: { nombre: string; items: any[] }[] = []
  for (const l of lecciones) {
    const n = l.modulo || "Contenido"
    const m = modulos.find((x) => x.nombre === n)
    m ? m.items.push(l) : modulos.push({ nombre: n, items: [l] })
  }
  const moduloActual = siguiente ? (siguiente.modulo || "Contenido") : null
  return (
    <div className="flex flex-col gap-6">
      <Link href={volver.href} className="text-sm no-underline text-[#4A515C] hover:text-[var(--ac-texto)] self-start inline-flex items-center min-h-[44px] sm:min-h-0">← {volver.t}</Link>

      <section className="aula-hero" aria-labelledby="t-curso">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 min-w-[15rem] flex flex-col gap-3">
            <p className="m-0 aula-eyebrow">{modalidadYEdicion(i.modalidad, i.edicion)}</p>
            <h1 id="t-curso" className="m-0">{i.titulo}</h1>
            {i.docente && <p className="m-0 text-[15px] text-white/80">{firmaCurso(i.docente_slug)} {i.docente}</p>}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {i.certificado
                ? <a href={urlCertificado(i.certificado)} className="aula-cta">Ver y descargar certificado</a>
                : siguiente
                  ? <Link href={`${base}/${i.id}/l/${siguiente.id}`} className="aula-cta">{av.hechas ? "Continuar" : "Empezar"}: {siguiente.titulo.length > 38 ? siguiente.titulo.slice(0, 36) + "…" : siguiente.titulo} →</Link>
                  : null}
              <span className="chip bg-white/15 text-white">{e.n}</span>
            </div>
          </div>
          {av.lecciones > 0 && (
            <div className="flex items-center gap-3 text-white/90">
              <Anillo pct={av.pctLecciones} size={96} trazo={9} claro />
              <span className="text-sm leading-snug"><strong className="block text-lg text-white">{av.hechas} de {av.lecciones}</strong>lecciones</span>
            </div>
          )}
        </div>
      </section>

      {i.certificado ? (
        <div role={aprobadoRecien ? "status" : undefined} className="card !border-emerald-300 !bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
          <span><strong>¡Aprobaste el curso!</strong> <span className="text-sm">Tu certificado tiene el código {i.certificado}.</span></span>
          <a href={urlCertificado(i.certificado)} className="btn-p py-1.5">Ver y descargar certificado</a>
        </div>
      ) : i.estado === "aprobado" ? (
        <div role="status" className="card !border-emerald-300 !bg-emerald-50"><strong>¡Aprobaste el curso!</strong></div>
      ) : null}

      {i.parcial && !i.certificado && (siguiente
        ? <Desbloquear base={base} i={i} />
        : <Desbloquear base={base} i={i} titulo="¡Terminaste la parte gratis! Desbloqueá el curso completo" texto="Seguí con los módulos siguientes desde donde estás: tu avance queda guardado. Además descargás el apunte y el cuaderno en PDF (son tuyos), las plantillas, pedís tu videollamada y obtenés el certificado verificable." />)}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Tu avance">
        {av.lecciones > 0 && <div className="stat"><span>Lecciones</span><b>{av.hechas} / {av.lecciones}</b><span className="font-normal">Necesitás {i.req_lecciones}%</span></div>}
        {av.clases > 0 && <div className="stat"><span>Asistencia</span><b>{av.presentes} / {av.clases}</b><span className="font-normal">Necesitás {i.req_asistencia}%</span></div>}
        <div className="stat"><span>Fechas</span><b className="!text-base !leading-snug">{i.inicio ? `${fecha(i.inicio)}${i.fin ? ` al ${fecha(i.fin)}` : ""}` : "A tu ritmo"}</b>{i.horario && <span className="font-normal">{i.horario}</span>}</div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 flex flex-col gap-3" aria-labelledby="t-cont">
          <h2 id="t-cont" className="m-0 text-xl">Contenido del curso</h2>
          {!lecciones.length && <p className="card m-0 text-sm text-[#4A515C]">El contenido se habilita con el inicio de la cursada.</p>}
          {modulos.map((m, n) => {
            const hechas = m.items.filter((l) => l.completada).length
            const gratis = i.parcial && !m.items[0]?.bloqueada
            return (
              <details key={m.nombre} className="card aula-modulo !p-0" open={moduloActual ? m.nombre === moduloActual : n === 0}>
                <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none">
                  <span className="flex-1"><strong className="block text-[15px]" style={TIT}>{m.nombre}</strong><span className="text-xs text-[#4A515C]">{hechas} de {m.items.length} {m.items.length === 1 ? "lección" : "lecciones"}{gratis && <span className="ml-1.5 font-bold text-emerald-700">· Gratis</span>}</span></span>
                  <span aria-hidden="true" className="aula-flecha text-[#6E6758]">⌄</span>
                </summary>
                <ul className="m-0 px-3 pb-3 list-none">
                  {m.items.map((l) => (
                    <li key={l.id}>
                      {l.bloqueada ? (
                        <Link href={`${base}/${i.id}/l/${l.id}`} className="flex items-center gap-3 py-2.5 px-2 rounded-xl no-underline text-[#4A515C] hover:bg-[#F6F2EA]">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#F1ECE0] text-[#6E6758]"><Candado className="w-3.5 h-3.5" /></span>
                          <span className="flex-1 text-sm"><strong className="font-semibold">{l.titulo}</strong><span className="block text-xs">{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""} · Con el curso completo</span></span>
                          <span className="sr-only">(bloqueada)</span>
                        </Link>
                      ) : (
                        <Link href={`${base}/${i.id}/l/${l.id}`} className={`flex items-center gap-3 py-2.5 px-2 rounded-xl no-underline text-[#0E1116] hover:bg-[#F6F2EA] ${siguiente?.id === l.id ? "bg-[var(--ac-suave)]" : ""}`}>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${l.completada ? "bg-[var(--ac)] text-white" : "bg-[#F1ECE0] text-[var(--ac-texto)]"}`} aria-hidden="true">{l.completada ? <Tilde className="w-4 h-4" /> : tipoLeccion(l.tipo).i}</span>
                          <span className="flex-1 text-sm"><strong className="font-semibold">{l.titulo}</strong><span className="block text-xs text-[#4A515C]">{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{l.completada ? " · Completada" : ""}</span></span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )
          })}
        </section>

        <aside className="flex flex-col gap-5">
          {i.videollamada && (
            <section className="card flex flex-col gap-3" style={bordeAc} aria-labelledby="t-video">
              <h2 id="t-video" className="m-0 text-base" style={TIT}>Pedí tu videollamada{i.docente ? ` con ${i.docente}` : " con quien enseña el curso"}</h2>
              {i.parcial ? (
                <p className="m-0 text-sm text-[#4A515C] flex gap-2 items-start"><Candado className="w-4 h-4 mt-0.5 shrink-0" /><span>Viene con el curso completo: <strong className="text-[#0E1116]">1 videollamada de 30 minutos</strong>{i.docente ? <> con {i.docente}</> : null} para resolver dudas o revisar tu caso. <a href={urlCompra(base, i.slug)} className="underline font-semibold text-[var(--ac-texto)]">Desbloquear</a></span></p>
              ) : i.videollamada_en ? (
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
              <h2 id="t-clases" className="m-0 text-base" style={TIT}>Clases en vivo</h2>
              {i.lugar && <p className="m-0 text-sm">Lugar: {i.lugar}</p>}
              {i.link && <a href={i.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Sala de clases en vivo</a>}
              {proximas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Próximas</h3>}
              {proximas.map((k) => (
                <div key={k.id} className="text-sm"><strong className="block">{fh(k.fecha)}</strong>{k.tema && <span className="text-[#4A515C]">{k.tema}</span>}{(k.link || i.link) && <> · <a href={k.link || i.link} target="_blank" rel="noopener noreferrer" className="underline text-[var(--ac-texto)]">Entrar</a></>}</div>
              ))}
              {pasadas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Dadas</h3>}
              {pasadas.map((k) => (
                <div key={k.id} className="text-sm flex justify-between gap-2"><span>{fecha(k.fecha)}{k.tema ? ` · ${k.tema}` : ""}{k.grabacion && <> · <a href={k.grabacion} target="_blank" rel="noopener noreferrer" className="underline text-[var(--ac-texto)]">Grabación</a></>}</span><span className={k.presente ? "text-emerald-700" : k.presente === false ? "text-rojo" : "text-[#4A515C]"}>{k.presente ? "Presente" : k.presente === false ? "Ausente" : "—"}</span></div>
              ))}
            </section>
          )}
          {i.descripcion && (
            <section className="card" aria-labelledby="t-acerca">
              <h2 id="t-acerca" className="m-0 text-base" style={TIT}>Sobre el curso</h2>
              <div className="prosa !text-[15px] mt-2" dangerouslySetInnerHTML={{ __html: mdWeb(i.descripcion) }} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

/** Marco de una lección: índice del curso a la izquierda (escritorio) o plegable arriba (celular) y el contenido a la derecha. */
function MarcoLeccion({ base, i, lecciones, k, children }: { base: BaseAula; i: any; lecciones: any[]; k: number; children: React.ReactNode }) {
  const hechas = lecciones.filter((x) => x.completada).length
  const pct = lecciones.length ? Math.round((hechas / lecciones.length) * 100) : 0
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href={`${base}/${i.id}`} className="text-sm no-underline text-[#4A515C] hover:text-[var(--ac-texto)] inline-flex items-center min-h-[44px] sm:min-h-0">← {i.titulo}</Link>
        <div className="w-full sm:w-64"><Barra pct={pct} label={`Tu avance: ${hechas} de ${lecciones.length}`} /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
        <details className="card lg:hidden !p-0 aula-modulo">
          <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer list-none text-sm font-bold"><span>Contenido del curso · lección {k + 1} de {lecciones.length}</span><span aria-hidden="true" className="aula-flecha text-[#6E6758]">⌄</span></summary>
          <div className="px-4 pb-4"><Indice base={base} i={i} lecciones={lecciones} actual={lecciones[k].id} /></div>
        </details>
        <aside className="hidden lg:block card sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto !p-4">
          <h2 className="m-0 mb-3 text-base" style={TIT}>Contenido del curso</h2>
          <Indice base={base} i={i} lecciones={lecciones} actual={lecciones[k].id} />
        </aside>
        <div className="flex flex-col gap-5 min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  )
}

/** Vista de una lección: video, contenido, material y "marcar como vista". */
export function AulaLeccion({ base, i, lecciones, k, quiz }: { base: BaseAula; i: any; lecciones: any[]; k: number; quiz?: { bien: number; total: number; r: (number | null)[] } }) {
  const l = lecciones[k], ant = lecciones[k - 1], sig = lecciones[k + 1]
  const video = embedVideo(l.video_url)
  const preguntas = quizDe(l.quiz)
  // Lección de un módulo pago con la inscripción gratuita: el servidor no manda el contenido, solo el llamado a desbloquear.
  if (l.bloqueada)
    return (
      <MarcoLeccion base={base} i={i} lecciones={lecciones} k={k}>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#6E6758]">{l.modulo || "Contenido"} · Lección {k + 1} de {lecciones.length} · {tipoLeccion(l.tipo).n}</span>
          <h1 className="m-0 mt-1 flex items-center gap-2"><Candado className="w-6 h-6 shrink-0 text-[#6E6758]" />{l.titulo}</h1>
        </div>
        <Desbloquear base={base} i={i} titulo="Esta lección es parte del curso completo" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] pt-4">
          {ant ? <Link href={`${base}/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
          <Link href={`${base}/${i.id}`} className="btn-s">Volver al curso</Link>
        </div>
      </MarcoLeccion>
    )
  return (
    <MarcoLeccion base={base} i={i} lecciones={lecciones} k={k}>
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ac-texto)]">{l.modulo || "Contenido"} · Lección {k + 1} de {lecciones.length} · {tipoLeccion(l.tipo).n}</span>
        <h1 className="m-0 mt-1.5">{l.titulo}</h1>
      </div>
      {video ? (
        <div className="relative w-full overflow-hidden rounded-3xl bg-black shadow-[0_18px_44px_-14px_rgba(14,17,22,.35)]" style={{ aspectRatio: "16 / 9" }}>
          <iframe src={video} title={l.titulo} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      ) : l.video_url ? <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="btn-s self-start">Ver el video ↗</a> : null}
      {l.contenido && <article className="card prosa !p-6 sm:!p-8" dangerouslySetInnerHTML={{ __html: mdWeb(l.contenido) }} />}
      {!l.archivo_url && l.conArchivo && (
        <a href={urlCompra(base, i.slug)} className="card flex items-center gap-3 no-underline text-[#0E1116]">
          <span className="w-11 h-11 rounded-2xl bg-[#F1ECE0] text-[#6E6758] flex items-center justify-center" aria-hidden="true"><Candado className="w-5 h-5" /></span>
          <span><strong className="block">Material descargable</strong><span className="text-xs text-[#4A515C]">Se descarga con el curso completo: desbloquealo y es tuyo</span></span>
        </a>
      )}
      {l.archivo_url && (
        <a href={descargaAula(base, i.id, l.id)} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-3 no-underline text-[#0E1116]">
          <span className="w-11 h-11 rounded-2xl bg-[var(--ac-suave)] text-[var(--ac-texto)] flex items-center justify-center text-lg" aria-hidden="true">⤓</span>
          <span><strong className="block">Descargar material</strong><span className="text-xs text-[#4A515C]">Exclusivo para inscriptos</span></span>
        </a>
      )}
      <form action={completarLeccion} className="flex flex-col gap-4">
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
                <div key={n} role="radiogroup" aria-labelledby={`qp${n}`} className={`flex flex-col gap-2 ${mal ? "rounded-xl bg-amber-50 p-3 -mx-3" : ""}`}>
                  <p id={`qp${n}`} className="m-0 font-semibold">{n + 1}. {p.p}</p>
                  {p.o.map((o, j) => (
                    <label key={j} className="flex gap-3 items-start text-[15px] rounded-xl border border-[var(--borde)] bg-white p-3 min-h-[48px] cursor-pointer hover:border-[var(--borde-fuerte)] has-[:checked]:border-[color:var(--ac)] has-[:checked]:bg-[var(--ac-suave)]">
                      <input type="radio" name={`q${n}`} value={j} required defaultChecked={marcada === j} className="mt-0.5" /><span>{o}</span>
                    </label>
                  ))}
                  {quiz && !mal && p.e && <p className="m-0 text-sm text-emerald-800">✓ {p.e}</p>}
                </div>
              )
            })}
          </fieldset>
        )}
        <div className="aula-barra flex flex-wrap items-center justify-between gap-3">
          {ant ? <Link href={`${base}/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
          {l.completada
            ? <span className="flex flex-wrap items-center gap-3"><span className="text-sm text-emerald-700 font-semibold flex items-center gap-1"><Tilde className="w-4 h-4" /> Vista</span><button name="op" value="deshacer" className="inline-flex items-center min-h-[44px] sm:min-h-0 px-1 text-sm sm:text-xs underline text-[#4A515C] bg-transparent border-0 cursor-pointer">Desmarcar</button>{sig && <Link href={`${base}/${i.id}/l/${sig.id}`} className="btn-p">Siguiente →</Link>}</span>
            : <button name="op" value="completar" className="btn-p">{preguntas.length ? "Enviar respuestas y marcar como vista" : sig ? "Marcar como vista y seguir →" : "Marcar como vista"}</button>}
        </div>
      </form>
    </MarcoLeccion>
  )
}

/** Resultado de un intento de quiz que vuelve en la URL (?quiz=2-3&r=0.1.x). */
export function leerQuiz(sp: { quiz?: string; r?: string }) {
  const m = sp.quiz?.match(/^(\d+)-(\d+)$/)
  if (!m) return undefined
  return { bien: Number(m[1]), total: Number(m[2]), r: (sp.r ?? "").split(".").map((x) => (/^\d+$/.test(x) ? Number(x) : null)) }
}
