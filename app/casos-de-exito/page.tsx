import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import MapaProyectos from "@/components/mapa-proyectos"
import { CASOS, SECTORES } from "@/lib/casos-datos"
import { SITE_URL, breadcrumb } from "@/lib/seo"

const kicker = "m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF8E88]"

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
        <section className="db-tech bg-[#0B0D12] text-white mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-8 flex flex-col gap-4">
            <p className={kicker}>Casos de éxito</p>
            <h1 className="m-0 font-tight text-[34px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Casos de éxito: proyectos reales, en producción.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[780px]">
              Más de 150 proyectos desde 2009. Elegí un sector en el mapa y mirá qué construimos, para quién y con qué resultado.
            </p>
          </div>
        </section>

        <MapaProyectos />

        <section aria-labelledby="t-lista" className="bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/casos-de-exito/todos" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Ver todos los casos detallados →</Link>
              <Link href="/casos-de-exito/todos#todos" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[18px] py-[10px] font-semibold text-white transition-colors">Catálogo de +150 trabajos</Link>
              <Link href="/casos-de-exito/todos#redes" className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[18px] py-[10px] font-semibold text-white transition-colors">Redes que gestionamos</Link>
            </div>
            <details className="rounded-2xl border border-[#262C37] bg-[#161A22] p-5">
              <summary id="t-lista" className="cursor-pointer font-bold text-[17px]">Prefiero verlo como lista</summary>
              <ul className="mt-4 mb-0 p-0 list-none grid md:grid-cols-2 gap-4">
                {CASOS.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1">
                    <strong className="text-[16px]">{c.title}</strong>
                    <span className="text-sm text-[#FF9A95]">{c.client} · {sector(c.sector)}</span>
                    <span className="text-[15px] leading-relaxed text-[#C3C8D1]">{c.achievements}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        <section className="db-tech py-16 bg-[#0B0D12] border-t border-white/10">
          <div className="max-w-[900px] mx-auto px-4 text-center flex flex-col gap-5 items-center">
            <h2 className="m-0 font-tight text-3xl md:text-4xl font-extrabold text-white">¿Tu proyecto es el próximo caso?</h2>
            <p className="m-0 text-lg text-[#C3C8D1] max-w-2xl">Contanos qué necesitás y te decimos cómo lo integramos con lo que ya tenés.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
