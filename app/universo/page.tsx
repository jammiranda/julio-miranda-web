import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Universo from "@/components/universo"
import { GALAXIAS } from "@/lib/universo-datos"

export const metadata: Metadata = {
  title: "Universo de proyectos · DEVISEBIT",
  description: "Explorá en 3D los proyectos y clientes de DEVISEBIT: gobierno, educación, salud, gremios, plataformas y medios.",
  robots: { index: false, follow: false }, // prototipo: no se indexa hasta aprobarlo
}

export default function UniversoPage() {
  return (
    <div className="min-h-screen bg-[#05060A] text-white">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <Universo />

        <section id="catalogo" aria-labelledby="t-cat" className="db-tech bg-[#0B0D12] scroll-mt-[72px]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-10">
            <div className="flex flex-col gap-2.5 max-w-[760px]">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Todo el catálogo</p>
              <h2 id="t-cat" className="m-0 font-tight text-[32px] md:text-[44px] leading-[1.1] font-extrabold">Los mismos proyectos, en lista.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Si preferís leer, acá está todo ordenado por galaxia. Hay más de 150 trabajos en el <Link href="/trabajos" className="underline hover:text-white">catálogo completo</Link>.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {GALAXIAS.map((g) => (
                <article key={g.id} className="rounded-2xl border border-white/10 bg-[#11141B] p-6 flex flex-col gap-4" style={{ boxShadow: `inset 0 3px 0 ${g.color}` }}>
                  <div>
                    <h3 className="m-0 font-tight text-[22px] font-bold" style={{ color: g.color }}>{g.nombre}</h3>
                    <p className="m-0 text-sm text-[#AEB5C2]">{g.lema}</p>
                  </div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {g.nodos.map((n) => (
                      <li key={n.id} className="flex flex-col gap-0.5">
                        <strong className="text-[15px]">{n.t}</strong>
                        <span className="text-[14px] leading-relaxed text-[#C3C8D1]">{n.d}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
