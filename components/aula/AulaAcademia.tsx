import Link from "next/link"
import { estadoInsc, modalidad, tipoLeccion, urlCertificado, embedVideo, descargaAula, quizDe, pesos, dolares, textoCuotas, textoGratis, type BaseAula, type Avance } from "@/lib/cursos"
import { mdWeb } from "@/lib/academia"
import { firmaCurso, portada } from "@/lib/portadas"
import { completarLeccion, pedirVideollamada } from "@/lib/aula-acciones"
import { fecha } from "@/lib/util"
import { Candado, Desbloquear, fh } from "./Aula"

/**
 * Espacio del alumno de ACADEMIA DEVISEBIT (rediseño). Mismas acciones y datos que el aula compartida
 * (components/aula/Aula.tsx, que sigue usando el portal); acá cambia la interfaz.
 */

const BASE: BaseAula = "/mi-cuenta/cursos"

const FONDOS = [
  "linear-gradient(135deg,#0B0D12 0%,#1B2236 55%,#C8231F 140%)",
  "linear-gradient(135deg,#0B0D12 0%,#14302B 55%,#0B7462 140%)",
  "linear-gradient(135deg,#0B0D12 0%,#1F1B3A 55%,#6D5BD0 140%)",
  "linear-gradient(135deg,#0B0D12 0%,#1A2A52 55%,#2347C5 140%)",
  "linear-gradient(135deg,#0B0D12 0%,#3A1A18 55%,#E5484D 140%)",
]
const fondoDe = (slug: string) => FONDOS[[...slug].reduce((a, ch) => a + ch.charCodeAt(0), 0) % FONDOS.length]

/** Anillo de avance. */
export function Anillo({ pct, size = 64, grosor = 7, claro = false, children }: { pct: number; size?: number; grosor?: number; claro?: boolean; children?: React.ReactNode }) {
  const r = (size - grosor) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={grosor} stroke={claro ? "rgba(255,255,255,.18)" : "#E8EBF0"} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={grosor} strokeLinecap="round" stroke={pct >= 100 ? "#16A34A" : claro ? "#FF6A63" : "#C8231F"} strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-extrabold ${claro ? "text-white" : "text-[#0E1116]"}`} style={{ fontSize: size * 0.26 }}>{children ?? `${pct}%`}</span>
    </div>
  )
}

/** Portada del curso: la imagen si existe o un fondo de color propio. */
function Portada({ c, className = "" }: { c: { slug: string; imagen?: string | null; titulo: string }; className?: string }) {
  const img = portada(c)
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: fondoDe(c.slug) }} aria-hidden="true">
      {img ? <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> : (
        <svg viewBox="0 0 120 120" className="absolute -right-4 -bottom-6 w-28 h-28 text-white/10" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"><circle cx="60" cy="60" r="44" /><circle cx="60" cy="60" r="26" /><circle cx="60" cy="60" r="8" /></svg>
      )}
    </div>
  )
}

const pctDe = (av: Avance) => (av.lecciones > 0 ? av.pctLecciones : av.clases > 0 ? av.pctAsistencia : 0)
const Flecha = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const Check = ({ c = "w-3.5 h-3.5" }: { c?: string }) => <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
const Btn = "inline-flex items-center justify-center gap-2 rounded-xl font-bold no-underline min-h-[46px] px-5 transition-all"
const BtnP = `${Btn} bg-[#C8231F] text-white hover:bg-[#9E1A17] shadow-[0_8px_20px_-8px_rgba(200,35,31,.7)]`
const BtnClaro = `${Btn} bg-white text-[#0E1116] hover:bg-[#FDECEB]`

/* ───────────────────────── Inicio ───────────────────────── */

export function InicioAlumno({ nombre, ins, clases, compras, otros, salir }: { nombre: string; ins: any[]; clases: any[]; compras: any[]; otros: any[]; salir: React.ReactNode }) {
  const enCurso = ins.filter((x) => ["inscripto", "cursando"].includes(x.estado))
  const sig = enCurso[0]
  const certs = ins.filter((x) => x.certificado)
  const hechas = ins.reduce((a, x) => a + (x.av?.hechas ?? 0), 0)
  const prox = clases[0]
  return (
    <div className="flex flex-col gap-10">
      {/* Cabecera */}
      <section className="relative overflow-hidden rounded-[28px] text-white p-6 sm:p-9" style={{ background: "linear-gradient(135deg,#0B0D12 0%,#151B2B 60%,#2A1214 130%)" }}>
        <div aria-hidden="true" className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#C8231F]/25 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#FF8A84]">Tu espacio de aprendizaje</p>
            <h1 className="m-0 mt-2 font-extrabold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(1.9rem,1.3rem + 2.4vw,3rem)" }}>Hola, {nombre.split(" ")[0]} 👋</h1>
            <p className="m-0 mt-2 text-white/70 max-w-xl">{ins.length ? (enCurso.length ? `Tenés ${enCurso.length} ${enCurso.length === 1 ? "curso" : "cursos"} en marcha. Seguí donde dejaste.` : "Acá están tus cursos y certificados.") : "Elegí tu primer curso y empezá hoy, a tu ritmo."}</p>
          </div>
          <div className="[&_button]:!bg-white/10 [&_button]:!text-white [&_button]:!border-white/20 [&_button]:!shadow-none">{salir}</div>
        </div>

        {sig ? (
          <div className="relative mt-7 rounded-2xl bg-white/[.07] border border-white/10 backdrop-blur p-4 sm:p-5 flex flex-wrap items-center gap-4">
            <Anillo pct={pctDe(sig.av)} size={72} claro />
            <div className="flex-1 min-w-[200px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Seguí donde dejaste</span>
              <strong className="block text-lg leading-snug">{sig.titulo}</strong>
              {sig.av.lecciones > 0 && <span className="text-sm text-white/60">{sig.av.hechas} de {sig.av.lecciones} lecciones</span>}
            </div>
            <Link href={`${BASE}/${sig.id}`} className={BtnClaro}>{sig.av.hechas ? "Continuar" : "Empezar"} <Flecha /></Link>
          </div>
        ) : (
          <div className="relative mt-7"><Link href="/cursos" className={BtnClaro}>Ver cursos abiertos <Flecha /></Link></div>
        )}

        {ins.length > 0 && (
          <dl className="relative m-0 mt-5 grid grid-cols-3 gap-3 max-w-lg">
            {[["Cursos", ins.length], ["Lecciones vistas", hechas], ["Certificados", certs.length]].map(([t, n]) => (
              <div key={t as string}><dt className="text-[11px] uppercase tracking-wider text-white/55 order-2">{t}</dt><dd className="m-0 text-2xl font-extrabold leading-none mt-1">{n}</dd></div>
            ))}
          </dl>
        )}
      </section>

      {/* Próxima clase */}
      {prox && (
        <section aria-labelledby="t-vivo" className="rounded-2xl border border-[#E2E5EA] bg-white p-4 sm:p-5 flex flex-wrap items-center gap-4 shadow-[0_2px_10px_-6px_rgba(14,17,22,.15)]">
          <span className="w-12 h-12 rounded-2xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center shrink-0" aria-hidden="true"><svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg></span>
          <div className="flex-1 min-w-[200px]">
            <h2 id="t-vivo" className="m-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4A515C]">Próxima clase en vivo</h2>
            <strong className="block capitalize">{fh(prox.fecha)}</strong>
            <Link href={`${BASE}/${prox.iid}`} className="text-sm text-[#4A515C] underline">{prox.titulo}</Link>{prox.tema ? <span className="text-sm text-[#4A515C]"> · {prox.tema}</span> : null}
          </div>
          {prox.link && <a href={prox.link} target="_blank" rel="noopener noreferrer" className={BtnP}>Entrar a la clase</a>}
          {clases.length > 1 && <details className="w-full text-sm"><summary className="cursor-pointer font-semibold text-[#4A515C]">Ver las otras {clases.length - 1}</summary><ul className="m-0 mt-2 p-0 list-none flex flex-col">{clases.slice(1).map((k) => <li key={k.id} className="flex flex-wrap justify-between gap-2 py-2 border-t border-[#EEF0F3]"><span><strong className="capitalize">{fh(k.fecha)}</strong> · {k.titulo}</span>{k.link && <a href={k.link} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F] font-semibold">Entrar</a>}</li>)}</ul></details>}
        </section>
      )}

      {/* Mis cursos */}
      <section id="mis-cursos" aria-labelledby="t-cursos" className="flex flex-col gap-4 scroll-mt-24">
        <h2 id="t-cursos" className="m-0 text-2xl font-extrabold tracking-tight">Mis cursos</h2>
        {ins.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ins.map((x) => {
              const e = estadoInsc(x.estado), p = pctDe(x.av)
              return (
                <Link key={x.id} href={`${BASE}/${x.id}`} className="group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden no-underline text-[#0E1116] flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(14,17,22,.35)] hover:border-[#C3C8D1]">
                  <Portada c={x} className="h-32" />
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <strong className="block text-[17px] leading-snug">{x.titulo}</strong>
                        <span className="text-sm text-[#4A515C]">{modalidad(x.modalidad)}{x.horas ? ` · ${Number(x.horas)} h` : ""}</span>
                      </div>
                      {x.av.lecciones > 0 && <Anillo pct={p} size={52} grosor={6} />}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`chip ${e.c}`}>{e.n}</span>
                      {x.parcial && <span className="chip bg-[#FDECEB] text-[#9E1A17]">{textoGratis(x.gratis_modulos)}</span>}
                      {x.certificado && <span className="chip bg-emerald-50 text-emerald-700">Certificado</span>}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-[#C8231F] group-hover:gap-2.5 transition-all">{x.certificado ? "Ver curso" : x.av.hechas ? "Continuar" : "Empezar"} <Flecha /></span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C3C8D1] bg-white p-8 text-center flex flex-col items-center gap-3">
            <strong className="text-lg">Todavía no estás inscripto en ningún curso</strong>
            <p className="m-0 text-[#4A515C] max-w-md">Empezá con un módulo gratis o elegí un curso completo. Tu avance queda guardado.</p>
            <Link href="/cursos" className={BtnP}>Ver cursos abiertos <Flecha /></Link>
          </div>
        )}
      </section>

      {/* Certificados */}
      {certs.length > 0 && (
        <section id="certificados" aria-labelledby="t-cert" className="flex flex-col gap-4 scroll-mt-24">
          <h2 id="t-cert" className="m-0 text-2xl font-extrabold tracking-tight">Mis certificados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map((x) => (
              <div key={x.id} className="rounded-2xl p-5 flex items-center gap-4 border border-[#E7D9A8] bg-gradient-to-br from-[#FFFBEA] to-white">
                <span className="w-12 h-12 rounded-full bg-[#F3E3A6] text-[#7A5B00] flex items-center justify-center shrink-0"><Check c="w-6 h-6" /></span>
                <div className="flex-1 min-w-0"><strong className="block leading-snug">{x.titulo}</strong><span className="text-xs text-[#4A515C]">Código {x.certificado} · {fecha(x.aprobado_en)}</span></div>
                <a href={urlCertificado(x.certificado)} className="text-sm font-bold text-[#C8231F] underline shrink-0">Ver y descargar</a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Compras */}
      {compras.length > 0 && (
        <section aria-labelledby="t-compras" className="flex flex-col gap-4">
          <h2 id="t-compras" className="m-0 text-2xl font-extrabold tracking-tight">Mis guías y productos</h2>
          <ul className="m-0 p-0 list-none rounded-2xl border border-[#E2E5EA] bg-white divide-y divide-[#EEF0F3]">
            {compras.map((o) => (
              <li key={o.token} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span><strong className="block">{o.titulo}</strong><span className="text-xs text-[#4A515C]">Comprado el {fecha(o.pagada_en ?? o.creado)}</span></span>
                {o.descarga && !o.servicio ? <a href={`/descarga/${o.token}`} className="btn-s py-1.5">Descargar</a> : <Link href={`/productos/${o.slug}`} className="btn-s py-1.5">Ver</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Seguí aprendiendo */}
      {otros.length > 0 && (
        <section aria-labelledby="t-mas" className="flex flex-col gap-4">
          <h2 id="t-mas" className="m-0 text-2xl font-extrabold tracking-tight">Seguí aprendiendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {otros.map((o) => (
              <Link key={o.slug} href={`/cursos/${o.slug}`} className="group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden no-underline text-[#0E1116] flex flex-col hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(14,17,22,.35)] transition-all">
                <Portada c={{ slug: o.slug, imagen: o.imagen, titulo: o.titulo }} className="h-24" />
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <strong className="leading-snug">{o.titulo}</strong>
                  {o.bajada && <span className="text-sm text-[#4A515C] line-clamp-2">{o.bajada}</span>}
                  <span className="text-xs text-[#4A515C] mt-auto pt-2">{modalidad(o.modalidad)}{o.horas ? ` · ${Number(o.horas)} h` : ""} · {o.precio ? "Pago" : "Gratis"}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ───────────────────────── Curso ───────────────────────── */

function agrupar(lecciones: any[]) {
  const m: { nombre: string; items: any[] }[] = []
  for (const l of lecciones) {
    const n = l.modulo || "Contenido"
    const g = m.find((x) => x.nombre === n)
    g ? g.items.push(l) : m.push({ nombre: n, items: [l] })
  }
  return m
}

function Icono({ l }: { l: any }) {
  if (l.bloqueada) return <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#F5F6F8] text-[#6B7280] border border-[#E2E5EA]"><Candado className="w-3.5 h-3.5" /></span>
  if (l.completada) return <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white"><Check /></span>
  return <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#FDECEB] text-[#C8231F] text-xs" aria-hidden="true">{tipoLeccion(l.tipo).i}</span>
}

export function CursoAlumno({ i, lecciones, av, clases, aprobadoRecien }: { i: any; lecciones: any[]; av: Avance; clases: any[]; aprobadoRecien?: boolean }) {
  const e = estadoInsc(i.estado)
  const siguiente = lecciones.find((l) => !l.completada && !l.bloqueada)
  const corte = Date.now() - 3 * 3600e3
  const proximas = clases.filter((k) => new Date(k.fecha).getTime() > corte)
  const pasadas = clases.filter((k) => new Date(k.fecha).getTime() <= corte)
  const modulos = agrupar(lecciones)
  const p = pctDe(av)
  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[28px] text-white" style={{ background: fondoDe(i.slug) }}>
        {portada(i) && <img src={portada(i)!} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/55 to-[#0B0D12]/20" aria-hidden="true" />
        <div className="relative p-6 sm:p-9 flex flex-col gap-5">
          <Link href="/mi-cuenta" className="text-sm text-white/70 no-underline hover:text-white self-start inline-flex items-center gap-1.5"><span aria-hidden="true">←</span> Mi cuenta</Link>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0 flex-1 basis-[280px]">
              <div className="flex flex-wrap gap-2 mb-3"><span className="chip bg-white/15 text-white">{modalidad(i.modalidad)}</span><span className="chip bg-white/15 text-white">{e.n}</span>{i.parcial && <span className="chip bg-[#C8231F] text-white">{textoGratis(i.gratis_modulos)}</span>}</div>
              <h1 className="m-0 font-extrabold leading-[1.08] tracking-tight" style={{ fontSize: "clamp(1.7rem,1.2rem + 2vw,2.6rem)" }}>{i.titulo}</h1>
              <p className="m-0 mt-2 text-white/70 text-sm">{i.edicion}{i.docente ? ` · ${firmaCurso(i.docente_slug)} ${i.docente}` : ""}</p>
            </div>
            {(av.lecciones > 0 || av.clases > 0) && <Anillo pct={p} size={92} grosor={9} claro />}
          </div>
          {i.certificado ? (
            <div role={aprobadoRecien ? "status" : undefined} className="rounded-2xl bg-emerald-500/15 border border-emerald-300/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <span><strong className="block text-lg">¡Aprobaste el curso!</strong><span className="text-sm text-white/75">Tu certificado tiene el código {i.certificado}.</span></span>
              <a href={urlCertificado(i.certificado)} className={BtnClaro}>Ver y descargar certificado</a>
            </div>
          ) : i.estado === "aprobado" ? (
            <div role="status" className="rounded-2xl bg-emerald-500/15 border border-emerald-300/30 p-4"><strong className="text-lg">¡Aprobaste el curso!</strong></div>
          ) : siguiente ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`${BASE}/${i.id}/l/${siguiente.id}`} className={BtnClaro}>{av.hechas ? "Continuar" : "Empezar el curso"} <Flecha /></Link>
              <span className="text-sm text-white/70 min-w-0">Sigue: <strong className="text-white">{siguiente.titulo}</strong></span>
            </div>
          ) : null}
        </div>
      </section>

      {i.parcial && !i.certificado && (siguiente
        ? <Desbloquear base={BASE} i={i} />
        : <Desbloquear base={BASE} i={i} titulo="¡Terminaste la parte gratis! Desbloqueá el curso completo" texto="Seguí con los módulos siguientes desde donde estás: tu avance queda guardado. Además descargás el apunte y el cuaderno en PDF (son tuyos), recibís el certificado y tu videollamada." />)}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Tu avance">
        {[
          av.lecciones > 0 && ["Lecciones", `${av.hechas} / ${av.lecciones}`, `Necesitás ${i.req_lecciones}%`],
          av.clases > 0 && ["Asistencia", `${av.presentes} / ${av.clases}`, `Necesitás ${i.req_asistencia}%`],
          ["Fechas", i.inicio ? fecha(i.inicio) : "A tu ritmo", i.fin ? `al ${fecha(i.fin)}` : i.horario || ""],
          i.horas && ["Duración", `${Number(i.horas)} h`, modalidad(i.modalidad)],
        ].filter(Boolean).map((x: any) => (
          <div key={x[0]} className="rounded-2xl border border-[#E2E5EA] bg-white p-4"><span className="text-xs text-[#4A515C]">{x[0]}</span><strong className="block text-xl leading-tight mt-0.5">{x[1]}</strong><span className="text-xs text-[#4A515C]">{x[2]}</span></div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 flex flex-col gap-3" aria-labelledby="t-cont">
          <h2 id="t-cont" className="m-0 text-2xl font-extrabold tracking-tight">Contenido del curso</h2>
          {!lecciones.length && <p className="m-0 text-sm text-[#4A515C] rounded-2xl border border-[#E2E5EA] bg-white p-5">El contenido se habilita con el inicio de la cursada.</p>}
          {modulos.map((m, n) => {
            const hechas = m.items.filter((l) => l.completada).length
            const abierto = m.items.some((l) => l === siguiente) || (!siguiente && n === 0)
            const gratis = i.parcial && !m.items[0]?.bloqueada
            return (
              <details key={m.nombre} open={abierto} className="group rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden">
                <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-[#F8F9FB]">
                  <span className="w-9 h-9 rounded-xl bg-[#0E1116] text-white text-sm font-extrabold flex items-center justify-center shrink-0">{n + 1}</span>
                  <span className="flex-1 min-w-0"><strong className="block leading-snug">{m.nombre}{gratis && <span className="ml-2 text-xs font-bold text-emerald-700">· Gratis</span>}</strong><span className="text-xs text-[#4A515C]">{hechas} de {m.items.length} lecciones</span></span>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#4A515C] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                <ul className="m-0 p-2 pt-0 list-none">
                  {m.items.map((l) => (
                    <li key={l.id}>
                      <Link href={`${BASE}/${i.id}/l/${l.id}`} className={`flex items-center gap-3 p-2.5 rounded-xl no-underline hover:bg-[#F5F6F8] ${l.bloqueada ? "text-[#4A515C]" : "text-[#0E1116]"} ${l === siguiente ? "bg-[#FDECEB]/60" : ""}`}>
                        <Icono l={l} />
                        <span className="flex-1 min-w-0 text-sm"><strong className="font-semibold">{l.titulo}</strong><span className="block text-xs text-[#4A515C]">{tipoLeccion(l.tipo).n}{l.duracion_min ? ` · ${l.duracion_min} min` : ""}{l.bloqueada ? " · Con el curso completo" : l.completada ? " · Completada" : ""}</span></span>
                        {l === siguiente && <span className="text-xs font-bold text-[#C8231F] shrink-0">Seguí acá</span>}
                        {l.bloqueada && <span className="sr-only">(bloqueada)</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )
          })}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          {i.videollamada && (
            <section className="rounded-2xl border border-[#C8231F]/30 bg-white p-5 flex flex-col gap-3" aria-labelledby="t-video">
              <h2 id="t-video" className="m-0 text-base font-extrabold">Pedí tu videollamada{i.docente ? ` con ${i.docente}` : ""}</h2>
              {i.parcial ? (
                <p className="m-0 text-sm text-[#4A515C] flex gap-2 items-start"><Candado className="w-4 h-4 mt-0.5 shrink-0" /><span>Viene con el curso completo: <strong className="text-[#0E1116]">1 videollamada de 30 minutos</strong>{i.docente ? <> con {i.docente}</> : null}.</span></p>
              ) : i.videollamada_en ? (
                <>
                  <p className="m-0 text-sm text-[#4A515C]">Ya la pediste el {fecha(i.videollamada_en)}. Si todavía no elegiste día y horario, hacelo desde la agenda. Si ya la agendaste, te llegó la confirmación por email.</p>
                  <form action={pedirVideollamada}><input type="hidden" name="base" value={BASE} /><input type="hidden" name="iid" value={i.id} /><button className="btn-s w-full">Ver o elegir horario</button></form>
                </>
              ) : (
                <form action={pedirVideollamada} className="flex flex-col gap-2">
                  <input type="hidden" name="base" value={BASE} /><input type="hidden" name="iid" value={i.id} />
                  <p className="m-0 text-sm text-[#4A515C]">Tu curso incluye <strong className="text-[#0E1116]">1 videollamada de 30 minutos</strong>{i.docente ? <> con {i.docente}</> : null} para resolver dudas o revisar tu caso. Elegís día y horario en la agenda.</p>
                  <label className="lbl text-sm">¿De qué querés hablar? (opcional)<textarea name="tema" rows={2} maxLength={600} className="inp text-sm" placeholder="Ej.: revisar mi plan de automatización" /></label>
                  <button className="btn-p">Pedir mi videollamada</button>
                </form>
              )}
            </section>
          )}
          {(i.link || i.lugar || clases.length > 0) && (
            <section className="rounded-2xl border border-[#E2E5EA] bg-white p-5 flex flex-col gap-2" aria-labelledby="t-clases">
              <h2 id="t-clases" className="m-0 text-base font-extrabold">Clases en vivo</h2>
              {i.lugar && <p className="m-0 text-sm">Lugar: {i.lugar}</p>}
              {i.link && <a href={i.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Sala de clases en vivo</a>}
              {proximas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Próximas</h3>}
              {proximas.map((k) => (
                <div key={k.id} className="text-sm"><strong className="block capitalize">{fh(k.fecha)}</strong>{k.tema && <span className="text-[#4A515C]">{k.tema}</span>}{(k.link || i.link) && <> · <a href={k.link || i.link} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F] font-semibold">Entrar</a></>}</div>
              ))}
              {pasadas.length > 0 && <h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Dadas</h3>}
              {pasadas.map((k) => (
                <div key={k.id} className="text-sm flex justify-between gap-2"><span>{fecha(k.fecha)}{k.tema ? ` · ${k.tema}` : ""}{k.grabacion && <> · <a href={k.grabacion} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Grabación</a></>}</span>{k.presente != null && <span className={k.presente ? "text-emerald-700 font-semibold" : "text-[#4A515C]"}>{k.presente ? "Asististe" : "Ausente"}</span>}</div>
              ))}
            </section>
          )}
          {i.descripcion && (
            <section className="rounded-2xl border border-[#E2E5EA] bg-white p-5" aria-labelledby="t-acerca">
              <h2 id="t-acerca" className="m-0 text-base font-extrabold">Sobre el curso</h2>
              <div className="prosa !text-[15px] mt-2" dangerouslySetInnerHTML={{ __html: mdWeb(i.descripcion) }} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ───────────────────────── Lección ───────────────────────── */

export function LeccionAlumno({ i, lecciones, k, quiz }: { i: any; lecciones: any[]; k: number; quiz?: { bien: number; total: number; r: (number | null)[] } }) {
  const l = lecciones[k], ant = lecciones[k - 1], sig = lecciones[k + 1]
  const video = embedVideo(l.video_url)
  const preguntas = quizDe(l.quiz)
  const modulos = agrupar(lecciones)
  const hechas = lecciones.filter((x) => x.completada).length
  const pct = lecciones.length ? Math.round((hechas / lecciones.length) * 100) : 0

  const lista = (
    <nav aria-label="Contenido del curso" className="rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden">
      <div className="p-4 flex items-center gap-3 border-b border-[#EEF0F3]">
        <Anillo pct={pct} size={48} grosor={6} />
        <div className="min-w-0"><Link href={`${BASE}/${i.id}`} className="font-extrabold text-sm leading-snug text-[#0E1116] no-underline hover:underline block">{i.titulo}</Link><span className="text-xs text-[#4A515C]">{hechas} de {lecciones.length} lecciones</span></div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {modulos.map((m) => (
          <div key={m.nombre}>
            <h3 className="m-0 px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#4A515C]">{m.nombre}</h3>
            <ul className="m-0 px-2 pb-2 list-none">
              {m.items.map((x) => {
                const n = lecciones.indexOf(x), actual = n === k
                return (
                  <li key={x.id}>
                    <Link href={`${BASE}/${i.id}/l/${x.id}`} aria-current={actual ? "page" : undefined} className={`flex items-center gap-2.5 p-2 rounded-xl no-underline text-sm ${actual ? "bg-[#0E1116] text-white" : x.bloqueada ? "text-[#6B7280] hover:bg-[#F5F6F8]" : "text-[#0E1116] hover:bg-[#F5F6F8]"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${x.completada ? "bg-emerald-600 text-white" : actual ? "bg-[#C8231F] text-white" : "bg-[#F0F1F4] text-[#4A515C]"}`}>{x.completada ? <Check c="w-3 h-3" /> : x.bloqueada ? <Candado className="w-3 h-3" /> : n + 1}</span>
                      <span className="flex-1 min-w-0 leading-snug">{x.titulo}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )

  const cabecera = (
    <header className="flex flex-col gap-2">
      <nav aria-label="Ruta" className="text-sm flex flex-wrap items-center gap-1.5 text-[#4A515C]">
        <Link href="/mi-cuenta" className="text-[#4A515C] no-underline hover:underline">Mi cuenta</Link><span aria-hidden="true">/</span>
        <Link href={`${BASE}/${i.id}`} className="text-[#4A515C] no-underline hover:underline">{i.titulo}</Link>
      </nav>
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8231F]">{l.modulo || "Contenido"} · Lección {k + 1} de {lecciones.length} · {tipoLeccion(l.tipo).n}</span>
      <h1 className="m-0 font-extrabold leading-[1.1] tracking-tight flex items-center gap-2" style={{ fontSize: "clamp(1.6rem,1.2rem + 1.6vw,2.3rem)" }}>{l.bloqueada && <Candado className="w-6 h-6 shrink-0 text-[#4A515C]" />}{l.titulo}</h1>
    </header>
  )

  // Lección de un módulo pago con la inscripción gratuita: el servidor no manda el contenido, solo el llamado a desbloquear.
  if (l.bloqueada)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          {cabecera}
          <Desbloquear base={BASE} i={i} titulo="Esta lección es parte del curso completo" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {ant ? <Link href={`${BASE}/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
            <Link href={`${BASE}/${i.id}`} className="btn-s">Volver al curso</Link>
          </div>
        </div>
        <aside className="lg:sticky lg:top-24">{lista}</aside>
      </div>
    )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <div className="flex flex-col gap-5 min-w-0">
        {cabecera}
        {video ? (
          <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_-24px_rgba(14,17,22,.6)]" style={{ aspectRatio: "16 / 9" }}>
            <iframe src={video} title={l.titulo} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        ) : l.video_url ? <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="btn-s self-start">Ver el video ↗</a> : null}
        {l.contenido && <article className="rounded-2xl border border-[#E2E5EA] bg-white p-5 sm:p-8 prosa" dangerouslySetInnerHTML={{ __html: mdWeb(l.contenido) }} />}
        {!l.archivo_url && l.conArchivo && (
          <a href={`${"/cursos/"}${i.slug}#inscripcion`} className="rounded-2xl border border-[#E2E5EA] bg-white p-4 flex items-center gap-3 no-underline text-[#0E1116] hover:border-[#C8231F]">
            <span className="w-11 h-11 rounded-xl bg-[#F5F6F8] text-[#4A515C] flex items-center justify-center" aria-hidden="true"><Candado className="w-5 h-5" /></span>
            <span><strong className="block">Material descargable</strong><span className="text-xs text-[#4A515C]">Se descarga con el curso completo: desbloquealo y es tuyo</span></span>
          </a>
        )}
        {l.archivo_url && (
          <a href={descargaAula(BASE, i.id, l.id)} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[#E2E5EA] bg-white p-4 flex items-center gap-3 no-underline text-[#0E1116] hover:border-[#C8231F]">
            <span className="w-11 h-11 rounded-xl bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-lg" aria-hidden="true">⤓</span>
            <span><strong className="block">Descargar material</strong><span className="text-xs text-[#4A515C]">Exclusivo para inscriptos</span></span>
          </a>
        )}
        <form action={completarLeccion} className="flex flex-col gap-4">
          <input type="hidden" name="base" value={BASE} /><input type="hidden" name="iid" value={i.id} /><input type="hidden" name="lid" value={l.id} />{sig && <input type="hidden" name="siguiente" value={sig.id} />}
          {preguntas.length > 0 && !l.completada && (
            <fieldset id="quiz" className="rounded-2xl border border-[#E2E5EA] bg-white p-5 sm:p-6 m-0 flex flex-col gap-5 scroll-mt-24">
              <legend className="sr-only">Autoevaluación</legend>
              <div><h2 className="m-0 text-xl font-extrabold">Autoevaluación</h2><p className="m-0 text-sm text-[#4A515C]">Respondé para marcar la lección como vista. Necesitás {Math.ceil(preguntas.length * 0.7 - 0.04)} de {preguntas.length} bien; podés intentarlo las veces que quieras.</p></div>
              {quiz && <p role="alert" className="m-0 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm"><strong>Tuviste {quiz.bien} de {quiz.total}.</strong> Revisá las marcadas y probá de nuevo.</p>}
              {preguntas.map((p, n) => {
                const marcada = quiz?.r[n]
                const mal = quiz && marcada !== p.c
                return (
                  <div key={n} role="radiogroup" aria-labelledby={`qp${n}`} className={`flex flex-col gap-2 ${mal ? "rounded-xl bg-[#FDECEB] p-3 -mx-3" : ""}`}>
                    <p id={`qp${n}`} className="m-0 font-bold">{n + 1}. {p.p}</p>
                    {p.o.map((o, j) => (
                      <label key={j} className="flex gap-3 items-start text-[15px] rounded-xl border border-[#E2E5EA] bg-white p-3 min-h-[48px] cursor-pointer hover:border-[#C3C8D1] has-[:checked]:border-[#C8231F] has-[:checked]:bg-[#FDECEB]/40">
                        <input type="radio" name={`q${n}`} value={j} required defaultChecked={marcada === j} className="mt-0.5 accent-[#C8231F]" /><span>{o}</span>
                      </label>
                    ))}
                    {quiz && !mal && p.e && <p className="m-0 text-sm text-emerald-800">✓ {p.e}</p>}
                  </div>
                )
              })}
            </fieldset>
          )}
          <div className="sticky bottom-3 z-10 rounded-2xl border border-[#E2E5EA] bg-white/95 backdrop-blur p-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_12px_30px_-14px_rgba(14,17,22,.35)]">
            {ant ? <Link href={`${BASE}/${i.id}/l/${ant.id}`} className="btn-s">← Anterior</Link> : <span />}
            {l.completada
              ? <span className="flex flex-wrap items-center gap-3"><span className="text-sm text-emerald-700 font-bold inline-flex items-center gap-1.5"><Check />Vista</span><button name="op" value="deshacer" className="text-xs underline text-[#4A515C] bg-transparent border-0 cursor-pointer">Desmarcar</button>{sig && <Link href={`${BASE}/${i.id}/l/${sig.id}`} className={BtnP}>Siguiente <Flecha /></Link>}</span>
              : <button name="op" value="completar" className={`${BtnP} border-0 cursor-pointer`}>{preguntas.length ? "Enviar respuestas y marcar como vista" : sig ? "Marcar como vista y seguir" : "Marcar como vista"} <Flecha /></button>}
          </div>
        </form>
      </div>
      <aside className="lg:sticky lg:top-24 order-last">{lista}</aside>
    </div>
  )
}
