import { pageMeta, breadcrumb } from "@/lib/seo"
import { JsonLd } from "@/components/json-ld"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Diagnostico from "@/components/diagnostico"

export const metadata = pageMeta(
  "Autodiagnóstico de automatización e IA · DEVISEBIT",
  "Nivel 3 de 3: descubrí qué automatizar primero, qué hace falta antes y recibí tu hoja de ruta de 90 días con inteligencia artificial.",
  "/diagnostico/automatizacion",
)

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Autodiagnóstico", "/diagnostico"], ["Automatización e IA", "/diagnostico/automatizacion"]])} />
      <Header />
      <main id="contenido" className="pt-[72px]"><Diagnostico nivel={3} /></main>
      <Footer />
    </div>
  )
}
