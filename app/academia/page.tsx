import { ultimosVideos, YT_SUSCRIBIR, miniatura, linkVideo } from "@/lib/youtube"
import VideoGaleria from "@/components/VideoGaleria"
import Link from "next/link"
import { q, one } from "@/lib/db"
import { sembrar } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
import { modalidad, pesos } from "@/lib/cursos"
import { PROGRAMAS } from "@/lib/programas"

export const dynamic = "force-dynamic"

export default async function Academia() {
  const videos = await ultimosVideos(30)
  await sembrar()
  const [guias, kit, cursos] = await Promise.all([
    q<any>("select slug, titulo, bajada, categoria, exclusiva, destacada from am_guias where publicada order by destacada desc, creado desc limit 6"),
    one<any>("select slug, titulo, bajada, precio, estado from am_productos where slug='kit-ia-pymes' and estado<>'oculto'"),
    q<any>("select slug, titulo, bajada, modalidad, horas, precio, precio_usd, docente, nuevo from am_cursos where estado='publicado' order by nuevo desc, (precio is null) desc, destacado desc, creado desc limit 6"),
  ])
  const iman = guias.find((g) => g.exclusiva)
  return (
    <main>
      <section className="ficha-head bg-[#0E1116] text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-40 -top-40 w-[560px] h-[560px] rounded-full" style={{ background: "radial-gradient(circle, rgba(200,35,31,.45), transparent 65%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-12 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-3">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6A63]">Gratis · En castellano · Para no técnicos</p>
            <h1 className="acad-h1 m-0 mt-4 font-extrabold text-white">La IA que sirve, explicada para tu negocio.</h1>
            <p className="acad-lead m-0 mt-5 text-white/80 max-w-xl">Guías prácticas para automatizar tareas, atender mejor y decidir con datos. Probadas en empresas, gremios, universidades y gobiernos de Argentina.</p>
            <div id="suscribirme" className="mt-7 max-w-xl scroll-mt-24"><Suscribir oscuro boton="Quiero las guías" /></div>
            <p className="m-0 mt-3 text-sm text-white/70">Una guía nueva por semana. Sin spam, te das de baja en un clic.</p>
          </div>
          {iman && (
            <Link href={`/guias/${iman.slug}`} className="lg:col-span-2 block rounded-2xl bg-white text-[#0E1116] p-5 sm:p-6 no-underline shadow-2xl lg:rotate-1 hover:rotate-0 transition-transform">
              <span className="chip bg-[#C8231F] text-white">Guía de regalo</span>
              <p className="m-0 mt-4 text-xl sm:text-2xl font-extrabold leading-tight">{iman.titulo}</p>
              <p className="m-0 mt-2 text-[#4A515C]">{iman.bajada}</p>
              <p className="m-0 mt-4 font-semibold text-[#C8231F]">Descargala gratis →</p>
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Autodiagnóstico digital" className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10">
        <div className="rounded-3xl bg-[#FDECEB] border border-[#F6C9C6] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-4 flex-1">
            <span aria-hidden="true" className="shrink-0 w-11 h-11 rounded-full bg-[#C8231F] text-white flex items-center justify-center font-extrabold">✓</span>
            <p className="m-0 text-[15px] sm:text-base text-[#0E1116] leading-snug"><strong className="block sm:inline">¿Qué tan digital es tu organización?</strong> <span className="text-[#4A515C]">Hacé el autodiagnóstico gratis en 5 minutos y recibí tu informe por correo.</span></p>
          </div>
          <a href="https://www.devisebit.com/demos/transformacion-digital.html" className="btn bg-[#0E1116] text-white hover:bg-[#262C37] min-h-[48px] no-underline shrink-0 w-full sm:w-auto">Hacer el autodiagnóstico →</a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10">
        <div className="rounded-3xl bg-[#0E1116] text-white p-5 sm:p-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-center relative overflow-hidden">
          <div aria-hidden="true" className="absolute -left-24 -bottom-24 w-[380px] h-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(200,35,31,.35), transparent 65%)" }} />
          <div className="relative flex flex-col gap-3">
            <span className="chip self-start bg-[#C8231F] text-white">Nuevo · Transformación digital</span>
            <h2 className="acad-h2 m-0 font-extrabold text-white">Ordená tu organización con un método, no a prueba y error.</h2>
            <p className="acad-lead m-0 text-white/80">La guía práctica con autodiagnóstico, hoja de ruta en 14 pasos y el Programa Kit 4.0, y el taller para tu equipo con certificado.</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1">
              <Link href="/productos/guia-transformacion-digital" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] min-h-[48px] text-base sm:text-sm">Guía + bonus · $40.000</Link>
              <Link href="/productos/taller-transformacion-digital" className="btn bg-white/10 text-white hover:bg-white/20 min-h-[48px] text-base sm:text-sm">Taller básico para tu equipo</Link>
              <a href="https://www.devisebit.com/transformacion-digital" className="btn bg-transparent text-white/85 hover:text-white underline min-h-[48px]">Consultoría completa ↗</a>
            </div>
          </div>
          <ul className="relative m-0 p-0 list-none grid grid-cols-2 gap-2 sm:gap-3 text-sm">
            {[["PDF", "13 páginas, en español e inglés"], ["Planilla", "Autodiagnóstico editable con resultado automático"], ["30 min", "Reunión sin cargo para revisar tu diagnóstico"], ["Kit 4.0", "Qué cofinancia y cómo se pide"]].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 flex flex-col gap-1"><strong className="text-lg sm:text-xl text-[#FF6A63]">{t}</strong><span className="text-white/80 text-sm leading-snug">{d}</span></li>
            ))}
          </ul>
        </div>
      </section>

      {cursos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-10 sm:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="acad-h2 m-0 font-extrabold">Cursos a tu ritmo, con certificado</h2><p className="m-0 mt-1 text-[#4A515C]">Empezás cuando quieras. Los pagos incluyen una videollamada con el docente.</p></div><Link href="/cursos" className="inline-flex items-center min-h-[44px] font-semibold text-[#C8231F]">Ver todos →</Link></div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {cursos.map((c) => (
              <Link key={c.slug} href={`/cursos/${c.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
                <span className="flex flex-wrap items-center gap-2">{c.nuevo && <span className="chip bg-[#C8231F] text-white">Nuevo</span>}<span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""}</span></span>
                <span className="text-lg font-bold leading-snug">{c.titulo}</span>
                {c.bajada && <span className="text-[15px] leading-snug text-[#4A515C] line-clamp-2">{c.bajada}</span>}
                <span className="mt-auto pt-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">{c.docente && <span className="text-[#262C37]">{c.docente}</span>}<strong className={c.precio ? "" : "text-emerald-700"}>{c.precio ? `${pesos(c.precio)}${c.precio_usd ? ` · USD ${Number(c.precio_usd)}` : ""}` : "Gratis"}</strong></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="t-programas" className="max-w-6xl mx-auto px-4 pt-10 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="chip bg-[#FDECEB] text-[#9E1A17]">Próximamente</span><h2 id="t-programas" className="acad-h2 m-0 mt-2 font-extrabold">Programas ejecutivos</h2></div><Link href="/programas" className="inline-flex items-center min-h-[44px] font-semibold text-[#C8231F]">Ver programas →</Link></div>
        <ul className="m-0 mt-5 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {PROGRAMAS.map((p) => (
            <li key={p.slug}>
              <Link href={`/programas#${p.slug}`} className="card h-full flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{p.tipo} · {p.inicio}</span>
                <span className="text-lg font-bold leading-snug">{p.titulo}</span>
                <span className="mt-auto pt-1 text-sm font-semibold text-[#C8231F]">Quiero que me avisen →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="acad-h2 m-0 font-extrabold">Guías</h2><Link href="/guias" className="inline-flex items-center min-h-[44px] font-semibold text-[#C8231F]">Ver todas →</Link></div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {guias.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{g.categoria}{g.exclusiva ? " · Para suscriptores" : ""}</span>
              <span className="text-lg font-bold leading-snug">{g.titulo}</span>
              <span className="text-[15px] leading-snug text-[#4A515C] line-clamp-3">{g.bajada}</span>
            </Link>
          ))}
        </div>
      </section>

      {kit && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="rounded-3xl bg-white border border-[#E2E5EA] p-5 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2"><span className="chip bg-[#FDECEB] text-[#9E1A17]">{kit.estado === "venta" ? "Disponible" : "Próximamente"}</span><h2 className="acad-h2 m-0 mt-3 font-extrabold">{kit.titulo}</h2><p className="acad-lead m-0 mt-2 text-[#4A515C]">{kit.bajada}</p></div>
            <Link href={`/productos/${kit.slug}`} className="btn-p text-base py-3.5 min-h-[52px] w-full sm:w-auto justify-self-stretch sm:justify-self-start md:justify-self-end">{kit.estado === "venta" ? "Ver el kit" : "Anotarme a la lista"}</Link>
          </div>
        </section>
      )}

      <section id="videos" className="max-w-6xl mx-auto px-4 pb-10 sm:pb-14 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div><h2 className="acad-h2 m-0 font-extrabold">Videos</h2><p className="m-0 mt-1 text-[#4A515C]">Guías en video, casos reales y tips rápidos de IA para tu organización.</p></div>
          <a href={YT_SUSCRIBIR} target="_blank" rel="noopener noreferrer" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] w-full sm:w-auto"><span aria-hidden="true">▶</span> Suscribirme al canal</a>
        </div>
        <VideoGaleria limite={{ largos: 3, cortos: 5 }} videos={videos.map((v) => ({ ...v, mini: miniatura(v), link: linkVideo(v) }))} />
        <p className="m-0 mt-3"><a href="/videos" className="inline-flex items-center min-h-[44px] font-semibold text-[#C8231F]">Ver todos los videos →</a></p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12 sm:pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[["Para pymes e instituciones", "Ejemplos reales de Argentina, con herramientas que podés usar mañana."], ["Hecho por quienes lo implementan", "Somos DEVISEBIT: desde 2009 desarrollamos software e IA en producción."], ["¿Preferís que lo hagamos nosotros?", "Te armamos la solución con alcance, fecha y precio fijo."]].map(([t, d], i) => (
          <div key={t} className="card"><p className="m-0 text-lg font-bold">{t}</p><p className="m-0 mt-1 text-[#4A515C]">{d}</p>{i === 2 && <a href="https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia" className="inline-flex items-center min-h-[44px] mt-1 font-semibold text-[#C8231F]">Hablemos por WhatsApp →</a>}</div>
        ))}
      </section>
    </main>
  )
}
