import { Header } from "@/components/header"
import { pageMeta } from "@/lib/seo"
import { Footer } from "@/components/footer"
import DbContactForm from "@/components/db-contact-form"
import { Mail, MessageCircle, MapPin, CalendarClock, FileText, Tag } from "lucide-react"
import Redes from "@/components/redes"
import { WHATSAPP } from "@/lib/marca"

export const metadata = pageMeta(
  "Contacto · DEVISEBIT",
  "Escribinos por WhatsApp, email o con el formulario. Te respondemos en 24 horas hábiles, de lunes a viernes de 8 a 18 h.",
  "/contacto",
)

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Contacto</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Contanos tu proyecto.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">Te respondemos en 24 horas hábiles con alcance, fecha y precio fijo.</p>
            <div className="flex flex-wrap gap-2.5 mt-3">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Escribinos por WhatsApp</a>
              <a href="#formulario" className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><FileText size={19} aria-hidden="true" /> Completar el formulario</a>
              <a href="https://sistema.devisebit.com/agendar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><CalendarClock size={19} aria-hidden="true" /> Agendar una reunión</a>
              <a href="mailto:info@devisebit.com" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><Mail size={19} aria-hidden="true" /> info@devisebit.com</a>
              <a href="https://sistema.devisebit.com/lista-precios" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><Tag size={19} aria-hidden="true" /> Lista de precios</a>
            </div>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-wrap gap-12">
            <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-5">
              <h2 className="m-0 font-tight text-[28px] font-extrabold">Hablemos</h2>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><MessageCircle size={20} aria-hidden="true" /> WhatsApp +54 9 11 7346-6490</a>
              <a href="mailto:info@devisebit.com" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><Mail size={20} aria-hidden="true" /> info@devisebit.com</a>
              <span className="flex items-start gap-3 text-[17px]"><MapPin size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> <span>Luna 24, 6.º piso, Parque Patricios, CABA<span className="block text-[15px] text-[#4A515C]">Ubicación estratégica en el Polo Tecnológico de la Ciudad de Buenos Aires.</span></span></span>
              <span className="flex items-start gap-3 text-[17px]"><MapPin size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> <span>Av. de los Lagos 7008, Nordelta, Tigre<span className="block text-[15px] text-[#4A515C]">Oficina en <a href="https://www.instagram.com/circularcowork/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C8231F]">Circular Cowork</a>, parte de una red de empresas, emprendedores y laboratorios de innovación.</span></span></span>
              <a href="https://sistema.devisebit.com/agendar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><CalendarClock size={20} aria-hidden="true" /> Reunión de 30 minutos por videollamada</a>
              <p className="m-0 text-[15px] text-[#4A515C]">Atendemos de lunes a viernes de 8 a 18 h. Por WhatsApp, en el día.</p>
              <div className="flex flex-col gap-2 pt-2"><span className="text-sm font-semibold text-[#4A515C]">Seguinos y mirá cómo trabajamos</span><Redes oscuro={false} conTexto /></div>
            </div>
            <div id="formulario" className="flex-[999_1_520px] min-w-0 scroll-mt-24">
              <DbContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
