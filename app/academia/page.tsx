import { ultimosVideos, YT_SUSCRIBIR, miniatura, linkVideo } from "@/lib/youtube"
import VideoGaleria from "@/components/VideoGaleria"
import Link from "next/link"
import { q, one } from "@/lib/db"
import { sembrar } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
import { modalidad } from "@/lib/cursos"

export const dynamic = "force-dynamic"

export default async function Academia() {
  const videos = await ultimosVideos(10)
  await sembrar()
  const [guias, kit, cursos] = await Promise.all([
    q<any>("select slug, titulo, bajada, categoria, exclusiva, destacada from am_guias where publicada order by destacada desc, creado desc limit 12"),
    one<any>("select slug, titulo, bajada, precio, estado from am_productos where slug='kit-ia-pymes' and estado<>'oculto'"),
    q<any>("select slug, titulo, bajada, modalidad, horas, precio from am_cursos where estado='publicado' order by destacado desc, creado desc limit 3"),
  ])
  const iman = guias.find((g) => g.exclusiva)
  return (
    <main>
      <section className="ficha-head bg-[#0E1116] text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-40 -top-40 w-[560px] h-[560px] rounded-full" style={{ background: "radial-gradient(circle, rgba(200,35,31,.45), transparent 65%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6A63]">Gratis · En castellano · Para no técnicos</p>
            <h1 className="m-0 mt-4 text-4xl sm:text-6xl leading-[1.05] font-extrabold text-white">La IA que sirve, explicada para tu negocio.</h1>
            <p className="m-0 mt-5 text-lg text-white/80 max-w-xl">Guías prácticas para automatizar tareas, atender mejor y decidir con datos. Probadas en empresas, gremios, universidades y gobiernos de Argentina.</p>
            <div id="suscribirme" className="mt-8 max-w-xl scroll-mt-24"><Suscribir oscuro boton="Quiero las guías" /></div>
            <p className="m-0 mt-3 text-sm text-white/60">Una guía nueva por semana. Sin spam, te das de baja en un clic.</p>
          </div>
          {iman && (
            <Link href={`/guias/${iman.slug}`} className="lg:col-span-2 block rounded-2xl bg-white text-[#0E1116] p-6 no-underline shadow-2xl rotate-1 hover:rotate-0 transition-transform">
              <span className="chip bg-[#C8231F] text-white">Guía de regalo</span>
              <p className="m-0 mt-4 text-2xl font-extrabold leading-tight">{iman.titulo}</p>
              <p className="m-0 mt-2 text-[#4A515C]">{iman.bajada}</p>
              <p className="m-0 mt-4 font-semibold text-[#C8231F]">Descargala gratis →</p>
            </Link>
          )}
        </div>
      </section>

      {cursos.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-14">
          <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="m-0 text-3xl font-extrabold">Cursos con certificado</h2><Link href="/cursos" className="font-semibold text-[#C8231F]">Ver todos →</Link></div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((c) => (
              <Link key={c.slug} href={`/cursos/${c.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} h` : ""} · {c.precio ? "Pago" : "Gratis"}</span>
                <span className="text-lg font-bold leading-snug">{c.titulo}</span>
                {c.bajada && <span className="text-sm text-[#4A515C]">{c.bajada}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="m-0 text-3xl font-extrabold">Guías</h2><Link href="/guias" className="font-semibold text-[#C8231F]">Ver todas →</Link></div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guias.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="card flex flex-col gap-2 no-underline text-[#0E1116] hover:border-[#C8231F] hover:-translate-y-1 transition-transform">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{g.categoria}{g.exclusiva ? " · Para suscriptores" : ""}</span>
              <span className="text-lg font-bold leading-snug">{g.titulo}</span>
              <span className="text-sm text-[#4A515C]">{g.bajada}</span>
            </Link>
          ))}
        </div>
      </section>

      {kit && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="rounded-3xl bg-white border border-[#E2E5EA] p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2"><span className="chip bg-[#FDECEB] text-[#9E1A17]">{kit.estado === "venta" ? "Disponible" : "Próximamente"}</span><h2 className="m-0 mt-3 text-3xl font-extrabold">{kit.titulo}</h2><p className="m-0 mt-2 text-lg text-[#4A515C]">{kit.bajada}</p></div>
            <Link href={`/productos/${kit.slug}`} className="btn-p text-base py-3.5 justify-self-start md:justify-self-end">{kit.estado === "venta" ? "Ver el kit" : "Anotarme a la lista"}</Link>
          </div>
        </section>
      )}

      <section id="videos" className="max-w-6xl mx-auto px-4 pb-14 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div><h2 className="m-0 text-3xl font-extrabold">Videos</h2><p className="m-0 mt-1 text-[#4A515C]">Guías en video, casos reales y tips rápidos de IA para tu organización.</p></div>
          <a href={YT_SUSCRIBIR} target="_blank" rel="noopener noreferrer" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17]">▶ Suscribirme al canal</a>
        </div>
        <VideoGaleria videos={videos.map((v) => ({ ...v, mini: miniatura(v), link: linkVideo(v) }))} />
        <p className="m-0 mt-4"><a href="/videos" className="font-semibold text-[#C8231F]">Ver todos los videos →</a></p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[["Para pymes e instituciones", "Ejemplos reales de Argentina, con herramientas que podés usar mañana."], ["Hecho por quienes lo implementan", "Somos DEVISEBIT: desde 2009 desarrollamos software e IA en producción."], ["¿Preferís que lo hagamos nosotros?", "Te armamos la solución con alcance, fecha y precio fijo."]].map(([t, d], i) => (
          <div key={t} className="card"><p className="m-0 text-lg font-bold">{t}</p><p className="m-0 mt-1 text-[#4A515C]">{d}</p>{i === 2 && <a href="https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia" className="inline-block mt-3 font-semibold text-[#C8231F]">Hablemos por WhatsApp →</a>}</div>
        ))}
      </section>
    </main>
  )
}
