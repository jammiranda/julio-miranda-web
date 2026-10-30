import { pageMeta } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Diagnostico from "@/components/diagnostico"

export const metadata = pageMeta(
  "Autodiagnóstico de procesos · DEVISEBIT",
  "Nivel 2 de 3: 15 preguntas sobre tareas manuales, planillas y tiempos. Descubrí los 3 procesos que más te conviene digitalizar.",
  "/diagnostico/procesos",
)

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]"><Diagnostico nivel={2} /></main>
      <Footer />
    </div>
  )
}
