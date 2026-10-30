import { ultimosVideos, YT_SUSCRIBIR, miniatura, linkVideo } from "@/lib/youtube"
import VideoGaleria from "@/components/VideoGaleria"
import Link from "next/link"
import { q } from "@/lib/db"
import { sembrar } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
import { PROGRAMAS } from "@/lib/programas"
import { portada } from "@/lib/portadas"
import TarjetaCurso from "./_ui/TarjetaCurso"
import Revelar from "./_ui/Revelar"

export const dynamic = "force-dynamic"

const DIAGNOSTICO = "https://www.devisebit.com/diagnostico"
const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia"

/** Flecha chica para links (decorativa). */
const Flecha = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className={`w-4 h-4 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h11M11 5l5 5-5 5" /></svg>
)

/**
 * Inicio de ACADEMIA DEVISEBIT. Cada tipo de contenido tiene su color y su forma:
 * cursos (rojo, tarjetas grandes con portada y precio), autodiagnóstico (azul, tarjeta destacada),
 * programas (bloque oscuro con la fecha de inicio en ámbar) y guías (verde, lista compacta con tema).
 */
export default async function Academia() {
  const videos = await ultimosVideos(30)
  await sembrar()
  const [guias, cursos, totales] = await Promise.all([
    q<any>("select slug, titulo, bajada, categoria, exclusiva, destacada from am_guias where publicada order by destacada desc, creado desc limit 7"),
    q<any>("select slug, titulo, bajada, categoria, modalidad, horas, precio, precio_usd, cuotas, imagen, nuevo, videollamada, docente_slug, gratis_modulos from am_cursos where estado='publicado' order by nuevo desc, (precio is null) desc, destacado desc, creado desc limit 6"),
    q<{ cursos: number; guias: number }>("select (select count(*)::int from am_cursos where estado='publicado') cursos, (select count(*)::int from am_guias where publicada) guias"),
  ])
  const n = totales[0] ?? { cursos: cursos.length, guias: guias.length }
  const iman = guias.find((g) => g.exclusiva) ?? guias[0]
  const resto = guias.filter((g) => g !== iman).slice(0, 6)
  const abanico = cursos.map((c) => ({ ...c, img: portada(c) })).filter((c) => c.img).slice(0, 3)

  const puertas = [
    { href: "#cursos", t: "Cursos", d: `${n.cursos} cursos a tu ritmo, con certificado`, cls: "bg-[#C8231F] text-white", sub: "text-white/85" },
    { href: "#diagnostico", t: "Diagnóstico", d: "Autodiagnóstico gratis en 5 minutos", cls: "bg-[#2347C5] text-white", sub: "text-white/85" },
    { href: "#programas", t: "Programas", d: "Ejecutivos, desde noviembre", cls: "bg-[#7C5CFC] text-white", sub: "text-white/80" },
    { href: "#guias", t: "Guías", d: `${n.guias} guías prácticas gratis`, cls: "bg-[#0B7462] text-white", sub: "text-white/85" },
  ]

  return (
    <main>
      <Revelar />
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="ficha-head bg-[#0E1116] text-white relative overflow-hidden">
        <svg aria-hidden="true" className="absolute inset-0 w-full h-full opacity-[.35]" preserveAspectRatio="none"><defs><pattern id="trama" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="rgba(255,255,255,.18)" /></pattern></defs><rect width="100%" height="100%" fill="url(#trama)" /></svg>
        <div aria-hidden="true" className="absolute -right-48 -top-48 w-[640px] h-[640px] rounded-full" style={{ background: "radial-gradient(circle, rgba(200,35,31,.5), transparent 62%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 sm:pt-16 sm:pb-36 lg:pt-20 lg:pb-40 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-6 items-center">
          <div>
            <p className="m-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-2 pr-3 py-1 text-sm text-white/85">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#5BE08A] shadow-[0_0_0_4px_rgba(91,224,138,.2)]" />
              Gratis, en castellano y para no técnicos
            </p>
            <h1 className="acad-h1 m-0 mt-5 font-extrabold text-white tracking-tight">La IA que sirve, explicada para tu negocio.</h1>
            <p className="acad-lead m-0 mt-5 text-white/80 max-w-xl">Cursos, guías y programas para automatizar tareas, atender mejor y decidir con datos. Probados en empresas, gremios, universidades y gobiernos de Argentina.</p>
            <div id="suscribirme" className="mt-7 max-w-xl scroll-mt-24"><Suscribir oscuro boton="Quiero las guías" /></div>
            <p className="m-0 mt-3 text-sm text-white/70">Una guía nueva por semana. Sin spam, te das de baja en un clic.</p>
          </div>
          {abanico.length === 3 && (
            <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[440px] pb-6 lg:pb-0">
              <div className="abanico grid [&>*]:[grid-area:1/1]">
                {abanico.map((c) => (
                  <Link key={c.slug} href={`/cursos/${c.slug}`} className="block rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-[0_24px_50px_rgba(0,0,0,.45)] bg-[#0E1116]" aria-label={`Curso: ${c.titulo}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img!} alt="" width={1200} height={675} className="block w-full h-auto" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Puertas: un color por tipo de contenido ───────── */}
      <nav aria-label="Qué hay en la Academia" className="relative z-10 max-w-6xl mx-auto px-4 -mt-16 sm:-mt-20">
        <ul className="m-0 p-0 list-none grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {puertas.map((p) => (
            <li key={p.t}>
              <a href={p.href} className={`levanta group h-full flex flex-col justify-between gap-6 rounded-2xl p-4 sm:p-5 no-underline shadow-[0_12px_30px_rgba(14,17,22,.18)] ${p.cls}`}>
                <span className="flex items-start justify-between gap-2"><strong className="text-lg sm:text-xl font-extrabold leading-tight">{p.t}</strong><Flecha className="hidden sm:block mt-1 transition-transform group-hover:translate-x-1" /></span>
                <span className={`text-sm leading-snug ${p.sub}`}>{p.d}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Cursos (rojo) ─────────────────────────────────── */}
      {cursos.length > 0 && (
        <section id="cursos" aria-labelledby="t-cursos" className="max-w-6xl mx-auto px-4 pt-14 sm:pt-20 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3" data-revelar>
            <div className="max-w-2xl">
              <span aria-hidden="true" className="block w-12 h-1.5 rounded-full bg-[#C8231F]" />
              <h2 id="t-cursos" className="acad-h2 m-0 mt-4 font-extrabold tracking-tight">Cursos a tu ritmo, con certificado</h2>
              <p className="m-0 mt-2 text-[17px] text-[#4A515C]">Empezás cuando quieras, y en varios el módulo 1 es gratis. Los pagos son tuyos de por vida: apunte y cuaderno en PDF, plantillas, certificado y una videollamada de 30 minutos.</p>
            </div>
            <Link href="/cursos" className="inline-flex items-center gap-1.5 min-h-[44px] font-bold text-[#B91F1B] hover:underline">Ver los {n.cursos} cursos <Flecha /></Link>
          </div>
          <ul className="acad-riel -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 m-0 mt-7 p-0 list-none sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" aria-label="Cursos">
            {cursos.map((c, i) => <li key={c.slug} className="w-[84%] sm:w-auto"><TarjetaCurso c={c} i={i} /></li>)}
          </ul>
        </section>
      )}

      {/* ── Autodiagnóstico (azul) ────────────────────────── */}
      <section id="diagnostico" aria-labelledby="t-diag" className="max-w-6xl mx-auto px-4 pt-14 sm:pt-20 scroll-mt-20">
        <div data-revelar className="relative overflow-hidden rounded-[28px] bg-[#2347C5] text-white grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col gap-4">
            <span className="self-start rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">Gratis · 5 minutos</span>
            <h2 id="t-diag" className="acad-h2 m-0 font-extrabold tracking-tight text-white">¿Qué tan digital es tu organización?</h2>
            <p className="m-0 text-[17px] leading-relaxed text-white/85 max-w-lg">Respondé 12 preguntas y recibí tu puntaje en 6 dimensiones, con las 3 acciones que más te conviene encarar primero.</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a href={DIAGNOSTICO} className="btn bg-white text-[#1B379C] hover:bg-[#E8EDFC] min-h-[52px] text-base px-6 no-underline whitespace-nowrap">Hacer el autodiagnóstico <Flecha /></a>
              <Link href="/productos/guia-transformacion-digital" className="btn bg-transparent border border-white/40 text-white hover:bg-white/10 min-h-[52px] text-base px-6 no-underline whitespace-nowrap">Ver la guía completa</Link>
            </div>
          </div>
          {/* Medidor ilustrativo de las 6 dimensiones */}
          <div aria-hidden="true" className="relative min-h-[220px] lg:min-h-0 bg-[#1B379C] flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-[360px] flex flex-col gap-3">
              <p className="m-0 mb-1 text-sm text-white/75">Así se ve tu resultado (ejemplo)</p>
              {[["Estrategia", 72], ["Procesos", 45], ["Datos", 58], ["Clientes", 81], ["Personas", 39], ["Tecnología", 64]].map(([t, v], k) => (
                <div key={t as string} className="grid grid-cols-[96px_1fr_36px] items-center gap-3 text-sm">
                  <span className="text-white/85">{t}</span>
                  <span className="h-2.5 rounded-full bg-white/15 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${v}%`, background: k === 4 ? "#FFD166" : "#fff" }} /></span>
                  <span className="text-right font-bold tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Programas (oscuro + ámbar) ────────────────────── */}
      <section id="programas" aria-labelledby="t-programas" className="mt-14 sm:mt-20 bg-[#0E1116] text-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3" data-revelar>
            <div className="max-w-2xl">
              <span aria-hidden="true" className="block w-12 h-1.5 rounded-full bg-[#A78BFA]" />
              <h2 id="t-programas" className="acad-h2 m-0 mt-4 font-extrabold tracking-tight text-white">Programas ejecutivos</h2>
              <p className="m-0 mt-2 text-[17px] text-white/75">Varias semanas, casos reales y un proyecto aplicado a tu organización. Abren la inscripción pronto: dejá tu email y te avisamos.</p>
            </div>
            <Link href="/programas" className="inline-flex items-center gap-1.5 min-h-[44px] font-bold text-[#A78BFA] hover:underline">Ver los programas <Flecha /></Link>
          </div>
          <ol className="m-0 mt-8 p-0 list-none flex flex-col">
            {PROGRAMAS.map((p, i) => (
              <li key={p.slug} data-revelar style={{ ["--i" as string]: i }}>
                <Link href={`/programas#${p.slug}`} className="group grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-2 md:gap-8 items-start md:items-center border-t border-white/10 py-6 sm:py-7 no-underline text-white">
                  <span className="flex md:flex-col gap-2 md:gap-0 items-baseline">
                    <span className="text-xs text-white/70 md:mb-1">Inicio</span>
                    <strong className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#A78BFA] leading-none">{p.cuando}</strong>
                  </span>
                  <span className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-white/70">{p.tipo}</span>
                    <span className="text-lg sm:text-xl font-bold leading-snug group-hover:text-[#A78BFA] transition-colors">{p.titulo}</span>
                  </span>
                  <span className="mt-2 md:mt-0 inline-flex items-center justify-center gap-1.5 self-start md:self-center rounded-xl border border-[#A78BFA]/60 text-[#A78BFA] px-4 min-h-[44px] text-sm font-bold group-hover:bg-[#A78BFA] group-hover:text-[#0E1116] transition-colors whitespace-nowrap">Quiero que me avisen</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Guías (verde) ─────────────────────────────────── */}
      {iman && (
        <section id="guias" aria-labelledby="t-guias" className="bg-[#E3F3EE] scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3" data-revelar>
              <div className="max-w-2xl">
                <span aria-hidden="true" className="block w-12 h-1.5 rounded-full bg-[#0B7462]" />
                <h2 id="t-guias" className="acad-h2 m-0 mt-4 font-extrabold tracking-tight">Guías prácticas, gratis</h2>
                <p className="m-0 mt-2 text-[17px] text-[#3D4A47]">Cortas, en castellano y para usar mañana. Una nueva cada semana.</p>
              </div>
              <Link href="/guias" className="inline-flex items-center gap-1.5 min-h-[44px] font-bold text-[#0B6657] hover:underline">Ver las {n.guias} guías <Flecha /></Link>
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[0.95fr_1.3fr] gap-4 sm:gap-5 items-stretch">
              <Link href={`/guias/${iman.slug}`} data-revelar className="levanta group relative overflow-hidden rounded-[24px] bg-[#0B7462] text-white p-6 sm:p-8 flex flex-col gap-4 no-underline min-h-[300px]">
                <svg aria-hidden="true" viewBox="0 0 200 200" className="hidden sm:block absolute -right-10 -bottom-10 w-64 h-64 opacity-20"><g fill="none" stroke="#fff" strokeWidth="10"><rect x="40" y="20" width="120" height="160" rx="14" /><path d="M66 64h68M66 94h68M66 124h44" strokeLinecap="round" /></g></svg>
                <span className="self-start rounded-full bg-white text-[#0B6657] px-3 py-1 text-sm font-bold">{iman.exclusiva ? "De regalo al suscribirte" : "Destacada"}</span>
                <span className="relative text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">{iman.titulo}</span>
                <span className="relative text-white/85 text-[17px] leading-relaxed b3">{iman.bajada}</span>
                <span className="relative mt-auto inline-flex items-center gap-1.5 font-bold">Leer la guía <Flecha className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
              <ul className="m-0 p-0 list-none rounded-[24px] bg-white border border-[#C9E6DD] divide-y divide-[#E3F3EE] overflow-hidden">
                {resto.map((g, i) => (
                  <li key={g.slug} data-revelar style={{ ["--i" as string]: i }}>
                    <Link href={`/guias/${g.slug}`} className="group flex items-center gap-4 px-4 sm:px-6 py-4 min-h-[72px] no-underline text-[#0E1116] hover:bg-[#F3FAF7] transition-colors">
                      <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <span className="self-start rounded-md bg-[#E3F3EE] text-[#0B5D50] px-2 py-0.5 text-xs font-bold">{g.categoria}</span>
                        <span className="r2 font-bold">{g.titulo}</span>
                      </span>
                      <Flecha className="text-[#0B7462] transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── Videos ────────────────────────────────────────── */}
      <section id="videos" className="max-w-6xl mx-auto px-4 py-14 sm:py-20 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-5" data-revelar>
          <div className="max-w-2xl">
            <span aria-hidden="true" className="block w-12 h-1.5 rounded-full bg-[#0E1116]" />
            <h2 className="acad-h2 m-0 mt-4 font-extrabold tracking-tight">Videos</h2>
            <p className="m-0 mt-2 text-[17px] text-[#4A515C]">Guías en video, casos reales y tips rápidos de IA para tu organización.</p>
          </div>
          <a href={YT_SUSCRIBIR} target="_blank" rel="noopener noreferrer" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] min-h-[48px] w-full sm:w-auto"><span aria-hidden="true">▶</span> Suscribirme al canal</a>
        </div>
        <VideoGaleria limite={{ largos: 3, cortos: 5 }} videos={videos.map((v) => ({ ...v, mini: miniatura(v), link: linkVideo(v) }))} />
        <p className="m-0 mt-3"><a href="/videos" className="inline-flex items-center gap-1.5 min-h-[44px] font-bold text-[#B91F1B] hover:underline">Ver todos los videos <Flecha /></a></p>
      </section>

      {/* ── Cierre ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-14 sm:pb-20">
        <div data-revelar className="rounded-[28px] bg-[#C8231F] text-white p-6 sm:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center relative overflow-hidden">
          <div aria-hidden="true" className="absolute -right-20 -top-24 w-80 h-80 rounded-full border-[40px] border-white/10" />
          <div className="relative">
            <h2 className="acad-h2 m-0 font-extrabold tracking-tight text-white">¿Preferís que lo hagamos con vos?</h2>
            <p className="m-0 mt-2 text-[17px] text-white/90 max-w-2xl">Somos DEVISEBIT: desde 2009 hacemos software e IA en producción. Te armamos la solución con alcance, fecha y precio fijo.</p>
          </div>
          <a href={WA} className="relative btn bg-white text-[#9E1A17] hover:bg-[#FDECEB] min-h-[52px] text-base px-6 no-underline">Hablemos por WhatsApp <Flecha /></a>
        </div>
      </section>
    </main>
  )
}
