import { pageMeta } from "@/lib/seo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Diagnostico from "@/components/diagnostico"

export const metadata = pageMeta(
  "Autodiagnóstico de madurez digital gratis · DEVISEBIT",
  "Nivel 1 de 3: respondé 12 preguntas y obtené al instante tu puntaje en procesos, datos, atención, equipo, tecnología y seguridad, con 3 acciones prioritarias.",
  "/diagnostico",
)

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]"><Diagnostico nivel={1} /></main>
      <Footer />
    </div>
  )
}
