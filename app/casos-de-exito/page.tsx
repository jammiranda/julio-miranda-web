import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import YoutubeGaleria from "@/components/youtube-galeria"
import { CASOS, SECTORES } from "@/lib/casos-datos"
import { REDES_GESTIONADAS } from "@/lib/marca"
import { SITE_URL, breadcrumb } from "@/lib/seo"

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em]"

/** Casos destacados: los tres que mejor cuentan lo que hacemos hoy. */
const DESTACADOS = [
  {
    img: "/images/case-tigre-new.webp",
    tag: "Gobierno municipal · app",
    title: "Municipio de Tigre · app Soy Tigre",
    reto: "Llevar los beneficios del municipio al celular de cada vecino y sumar a los comercios del partido.",
    hicimos: "Desarrollo y soporte de la app: alta digital de las tarjetas Soy Tigre y Soy Tigre Joven, registro de comercios, pruebas, monitoreo y mejoras continuas.",
    cifras: [["+80.000", "vecinos suscriptos"], ["+500", "comercios adheridos"]],
  },
  {
    img: "/images/case-comunidad-usl.webp",
    tag: "Gremio y obra social · plataforma",
    title: "Comunidad USL · Academia",
    reto: "Unificar academia, padrón, beneficios y obra social en un solo lugar, y acercarlos a cada afiliado.",
    hicimos: "Sistema web multimódulo, app de afiliados, academia con certificados, tableros en tiempo real y marketing digital en redes.",
    cifras: [["+1.000", "inscriptos en un año"], ["1", "panel para todo"]],
  },
  {
    img: "/images/case-salud-digital-panel.webp",
    tag: "Salud Digital · marca blanca",
    title: "Salud Digital · Atención domiciliaria",
    reto: "Ordenar pacientes, órdenes, visitas, profesionales, historia clínica y facturación de una operación de salud en domicilio que no para.",
    hicimos: "Un sistema en producción todos los días que hoy ofrecemos con la marca de cada prestador: internación domiciliaria, enfermería y kinesiología a domicilio, cuidados paliativos y cuidadores.",
    cifras: [["24/7", "en producción"], ["Tu marca", "por abono mensual"]],
  },
]

const OTROS = CASOS.filter((c) => ![5, 9].includes(c.id)).sort((a, b) => (a.id === 1 ? 1 : 0) - (b.id === 1 ? 1 : 0))

export default function CasosDeExitoPage() {
  const sector = (id: string) => SECTORES.find((s) => s.id === id)?.name ?? ""
  const redes = REDES_GESTIONADAS.filter((r) => r.ig !== "devisebit")
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Casos de éxito", "/casos-de-exito"]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Casos de éxito de DEVISEBIT",
          url: `${SITE_URL}/casos-de-exito`,
          description: "Proyectos reales en producción: apps, plataformas, sistemas de salud, academias, tableros y redes.",
          about: { "@id": `${SITE_URL}/#organization` },
          mainEntity: { "@type": "ItemList", itemListElement: DESTACADOS.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, description: c.reto })) },
        }}
      />
      <Header />
      <main id="contenido" className="pt-[72px]">
        {/* Portada */}
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-14 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
            <div className="flex flex-col gap-4">
              <p className={kicker + " text-[#FF6A63]"}>Casos de éxito</p>
              <h1 className="m-0 font-tight text-[38px] md:text-[56px] leading-[1.04] font-extrabold tracking-[-0.02em]">Proyectos reales. <span className="text-[#FF6A63]">Funcionando hoy.</span></h1>
              <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[640px]">Más de 150 proyectos desde 2009 para municipios, gremios, salud, universidades y empresas. Estos son algunos de los que siguen en producción.</p>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-3">
              {[["+80.000", "vecinos en la app Soy Tigre"], ["+1.000", "inscriptos en un año"], ["+150", "proyectos desde 2009"], [String(redes.length), "cuentas de redes gestionadas"]].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-[#262C37] bg-[#161A22] p-4 md:p-5">
                  <dt className="font-tight text-[28px] md:text-[34px] font-extrabold leading-none">{n}</dt>
                  <dd className="m-0 mt-1.5 text-[14px] text-[#C3C8D1]">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        {/* Destacados */}
        <section aria-labelledby="t-destacados" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-10">
            <h2 id="t-destacados" className="sr-only">Casos destacados</h2>
            {DESTACADOS.map((c, i) => (
              <article key={c.title} className={`grid lg:grid-cols-2 gap-6 lg:gap-12 items-center ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="rounded-[22px] overflow-hidden bg-[#0B0D12] aspect-[16/10] border border-[#E2E5EA]">
                  <img src={c.img} alt={c.title} width={960} height={600} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-4">
                  <p className={kicker + " text-[#C8231F]"}>{c.tag}</p>
                  <h3 className="m-0 font-tight text-[28px] md:text-[36px] leading-[1.1] font-extrabold">{c.title}</h3>
                  <dl className="m-0 flex flex-col gap-3 text-[16px] leading-relaxed">
                    <div><dt className="font-bold">El desafío</dt><dd className="m-0 text-[#4A515C]">{c.reto}</dd></div>
                    <div><dt className="font-bold">Qué hicimos</dt><dd className="m-0 text-[#4A515C]">{c.hicimos}</dd></div>
                  </dl>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {c.cifras.map(([n, l]) => (
                      <div key={l} className="border-l-2 border-[#C8231F] pl-4">
                        <strong className="block font-tight text-[26px] md:text-[30px] font-extrabold leading-none">{n}</strong>
                        <span className="text-[14px] text-[#4A515C]">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Redes que gestionamos */}
        <section aria-labelledby="t-redes" className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#C8231F]"}>Redes y comunicación</p>
              <h2 id="t-redes" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">Cuentas que gestionamos, hoy y en proyectos anteriores.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Contenido, reels, campañas y comunidad para gobierno, universidades, gremios, salud y empresas.</p>
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {redes.map((r) => (
                <li key={r.nombre}>
                  <a href={`https://www.instagram.com/${r.ig}`} target="_blank" rel="noopener noreferrer" className="group h-full rounded-2xl border border-[#E2E5EA] bg-white hover:border-[#C8231F] p-5 flex items-center gap-4 transition-colors">
                    <span aria-hidden="true" className="shrink-0 w-11 h-11 rounded-xl bg-[#0B0D12] text-white grid place-items-center font-tight font-extrabold">{r.nombre.charAt(0)}</span>
                    <span className="flex flex-col min-w-0">
                      <strong className="text-[16px] leading-snug">{r.nombre}</strong>
                      <span className="text-[14px] text-[#4A515C] truncate">{r.rubro}</span>
                      <span className="text-[13px] font-semibold text-[#C8231F]">@{r.ig}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Más proyectos */}
        <section aria-labelledby="t-mas" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2.5 max-w-[760px]">
                <p className={kicker + " text-[#C8231F]"}>Más proyectos</p>
                <h2 id="t-mas" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">Desarrollo, datos y gestión.</h2>
              </div>
              <Link href="/casos-de-exito/todos" className="inline-flex items-center min-h-11 font-bold text-[#C8231F] hover:text-[#9E1A17]">Catálogo de +150 trabajos →</Link>
            </div>
            <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {OTROS.map((c) => (
                <li key={c.id} className="rounded-2xl border border-[#E2E5EA] bg-white overflow-hidden flex flex-col">
                  <div className="aspect-[16/10] bg-[#0B0D12] overflow-hidden"><img src={c.image} alt="" width={800} height={500} loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
                  <div className="p-5 flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C8231F]">{sector(c.sector)}</span>
                    <strong className="font-tight text-[18px] leading-snug">{c.title}</strong>
                    <span className="text-[14px] leading-relaxed text-[#4A515C] line-clamp-3">{c.challenge}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Videos */}
        <section aria-labelledby="t-videos" className="bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col gap-8">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className={kicker + " text-[#FF6A63]"}>En video</p>
              <h2 id="t-videos" className="m-0 font-tight text-[30px] md:text-[42px] leading-[1.1] font-extrabold">Mirá cómo funcionan.</h2>
            </div>
            <YoutubeGaleria cantidad={6} />
          </div>
        </section>

        <section className="db-tech py-16 bg-[#0B0D12] border-t border-white/10">
          <div className="max-w-[900px] mx-auto px-4 text-center flex flex-col gap-5 items-center">
            <h2 className="m-0 font-tight text-3xl md:text-4xl font-extrabold text-white">¿Tu proyecto es el próximo caso?</h2>
            <p className="m-0 text-lg text-[#C3C8D1] max-w-2xl">Contanos qué necesitás y te decimos cómo lo integramos con lo que ya tenés.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Contanos tu proyecto</Link>
              <Link href="/productos" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-[17px] text-white transition-colors">Ver productos</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
