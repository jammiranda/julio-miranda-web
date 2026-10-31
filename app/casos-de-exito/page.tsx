import Image from "next/image"
import Link from "next/link"
import { Instagram, TrendingUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import MapaProyectos from "@/components/mapa-proyectos"
import TrabajosClient from "../trabajos/TrabajosClient"
import YoutubeUltimos from "@/components/youtube-ultimos"
import { REDES_GESTIONADAS } from "@/lib/marca"
import { CASOS, SECTORES } from "@/lib/casos-datos"
import { SITE_URL, breadcrumb } from "@/lib/seo"

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]"

export default function CasosDeExitoPage() {
  const sector = (id: string) => SECTORES.find((s) => s.id === id)?.name ?? ""
  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <JsonLd data={breadcrumb([["Casos de éxito", "/casos-de-exito"]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Casos de éxito de DEVISEBIT",
          url: `${SITE_URL}/casos-de-exito`,
          description: "Proyectos reales en producción: sistemas, apps, academias, tableros y redes para salud, gobierno, universidades, gremios y empresas.",
          about: { "@id": `${SITE_URL}/#organization` },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: CASOS.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, description: c.challenge })),
          },
        }}
      />
      <Header />
      <main id="contenido">
        {/* Encabezado: el H1 conserva el nombre de siempre de la página */}
        <section className="db-tech bg-[#0B0D12] text-white mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-10 flex flex-col gap-4">
            <p className={kicker}>Casos de éxito</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Casos de éxito: proyectos reales, en producción.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[780px]">
              Así transformamos organizaciones de salud, gobierno, universidades, gremios y empresas. Explorá el mapa, leé los casos destacados y mirá el catálogo completo con más de 150 trabajos desde 2009.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href="#casos" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Ver los casos destacados</a>
              <a href="#todos" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[18px] py-[10px] font-semibold text-white transition-colors">Ver todos los trabajos</a>
            </div>
          </div>
        </section>

        <MapaProyectos />

        {/* Casos destacados: todos en el HTML, no solo el del sector elegido */}
        <section id="casos" aria-labelledby="t-casos" className="bg-[#0B0D12] text-white scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-10">
            <div className="flex flex-col gap-3 max-w-[820px]">
              <p className={kicker}>Casos destacados</p>
              <h2 id="t-casos" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">El desafío, lo que hicimos y el resultado.</h2>
            </div>
            <div className="flex flex-col gap-8">
              {CASOS.map((c, i) => (
                <article key={c.id} className="overflow-hidden rounded-2xl border border-[#262C37] bg-[#161A22] grid lg:grid-cols-[1fr_1.2fr]">
                  <div className="relative">
                    <Image
                      src={c.image}
                      alt={`${c.title}: ${c.industry}`}
                      width={1094}
                      height={600}
                      unoptimized
                      loading={i < 2 ? "eager" : "lazy"}
                      className="w-full h-full object-cover min-h-[220px]"
                    />
                    <span className="absolute left-4 bottom-4 rounded-full bg-[#C8231F] px-3 py-1 text-[12px] font-bold">{sector(c.sector)}</span>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col gap-4">
                    <div>
                      <p className="m-0 text-sm font-semibold text-[#FF9A95]">{c.client} · {c.industry}</p>
                      <h3 className="m-0 mt-1 font-tight text-[22px] md:text-[26px] leading-snug font-bold">{c.title}</h3>
                      <p className="m-0 mt-1 text-sm text-[#9AA1AD]">{c.category}</p>
                    </div>
                    <dl className="m-0 flex flex-col gap-3">
                      <div><dt className="text-sm font-bold text-white">Desafío</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.challenge}</dd></div>
                      <div><dt className="text-sm font-bold text-white">Qué hicimos</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.service}</dd></div>
                      <div><dt className="text-sm font-bold text-white">Resultado</dt><dd className="m-0 text-[15px] leading-relaxed text-[#C3C8D1]">{c.achievements}</dd></div>
                    </dl>
                    <ul className="m-0 p-0 list-none flex flex-wrap gap-2 mt-auto">
                      {c.technologies.map((t) => <li key={t} className="rounded-full border border-[#FF6A63]/40 px-3 py-1 text-[13px] text-[#FFB4AF]">{t}</li>)}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      <section aria-labelledby="t-redes" className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
          <div className="flex flex-col gap-3 max-w-[820px]">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Redes que gestionamos</p>
            <h2 id="t-redes" className="m-0 font-tight text-[32px] md:text-[42px] leading-[1.1] font-extrabold">Contenido, reels y campañas, todas las semanas.</h2>
            <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Universidades, gobierno, gremios, salud y empresas: cuentas que llevamos hoy o que llevamos en distintas etapas, con planificación, placas, reels, publicación y respuesta con IA. Entrá y mirá cómo trabajamos.</p>
          </div>
          <ul className="m-0 p-0 list-none grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {REDES_GESTIONADAS.map((r) => {
              const href = `https://www.instagram.com/${r.ig}/`
              if (!r.ig) return (
                <li key={r.nombre}>
                  <div className="db-card h-full rounded-2xl border border-white/15 bg-white/[0.03] p-4 md:p-5 flex flex-col gap-2">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]"><Instagram size={20} aria-hidden="true" /></span>
                    <strong className="text-[17px] leading-snug">{r.nombre}</strong>
                    <span className="text-sm text-[#C3C8D1]">{r.rubro}</span>
                  </div>
                </li>
              )
              return (
                <li key={r.nombre}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="db-card h-full rounded-2xl border border-white/15 hover:border-[#FF6A63] bg-white/[0.03] p-4 md:p-5 flex flex-col gap-2 transition-colors" aria-label={`${r.nombre} (se abre en otra pestaña)`}>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]"><Instagram size={20} aria-hidden="true" /></span>
                    <strong className="text-[17px] leading-snug">{r.nombre}</strong>
                    <span className="text-sm text-[#C3C8D1]">{r.rubro}</span>
                    <span className="mt-auto pt-1 text-sm font-bold text-[#FF6A63] break-all">@{r.ig} →</span>
                  </a>
                </li>
              )
            })}
          </ul>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-3">
              <h3 className="m-0 font-tight text-2xl font-bold">Los casos, también en video</h3>
              <p className="m-0 text-[#C3C8D1] leading-relaxed">Publicamos resúmenes de cada proyecto en reels y shorts: el problema, lo que hicimos y el resultado, en menos de un minuto. Suscribite para ver los nuevos.</p>
              <a href="https://www.instagram.com/devisebit/reels/" target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-4 py-2.5 text-sm font-bold"><Instagram size={18} aria-hidden="true" /> Reels en Instagram</a>
            </div>
            <YoutubeUltimos titulo="Últimos videos y shorts" />
          </div>
        </div>
      </section>

      <TrabajosClient embedded />

      <section className="db-tech py-20 bg-[#0B0D12] border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <TrendingUp className="w-16 h-16 text-red-500" aria-hidden="true" />
          </div>
          <h2 className="font-tight text-3xl md:text-4xl font-extrabold text-white mb-6">¿Tu proyecto es el próximo caso de éxito?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Sumate a las organizaciones que ya ordenaron su gestión con nuestras soluciones.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Contanos tu proyecto</Link>
            <Link href="/servicios" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">Ver servicios</Link>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}
