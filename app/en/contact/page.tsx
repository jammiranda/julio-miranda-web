import { Header } from "@/components/header"
import { JsonLd } from "@/components/json-ld"
import { pageMeta, breadcrumb } from "@/lib/seo"
import { Footer } from "@/components/footer"
import DbContactForm from "@/components/db-contact-form"
import { Mail, MessageCircle, MapPin, Clock, FileText } from "lucide-react"
import Redes from "@/components/redes"
import { WHATSAPP_EN as WHATSAPP } from "@/lib/marca"

export const metadata = pageMeta(
  "Contact DEVISEBIT: Get a Proposal in 24 Hours",
  "Tell us about your software or AI project by WhatsApp, email or form. We reply within one business day, Monday to Friday, 8 am to 6 pm Buenos Aires time.",
  "/en/contact",
)

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Contact", "/en/contact"]], "en")} />
      <Header lang="en" />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Contact</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Tell us about your project.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">We reply within one business day with scope, timeline and a fixed price. Your first 30-minute call is free.</p>
            <div className="flex flex-wrap gap-2.5 mt-3">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Message us on WhatsApp</a>
              <a href="#formulario" className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><FileText size={19} aria-hidden="true" /> Fill out the form</a>
              <a href="mailto:info@devisebit.com" className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3.5 font-bold text-white transition-colors"><Mail size={19} aria-hidden="true" /> info@devisebit.com</a>
            </div>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-wrap gap-12">
            <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-5">
              <h2 className="m-0 font-tight text-[28px] font-extrabold">Let&apos;s talk</h2>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><MessageCircle size={20} aria-hidden="true" /> WhatsApp +54 9 11 7346-6490</a>
              <a href="mailto:info@devisebit.com" className="flex items-center gap-3 text-[17px] text-[#C8231F] hover:text-[#9E1A17]"><Mail size={20} aria-hidden="true" /> info@devisebit.com</a>
              <span className="flex items-start gap-3 text-[17px]"><MapPin size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> <span>Luna 24, 6th floor, Parque Patricios, Buenos Aires, Argentina<span className="block text-[15px] text-[#4A515C]">In the city&apos;s technology district.</span></span></span>
              <span className="flex items-start gap-3 text-[17px]"><MapPin size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> <span>Av. de los Lagos 7008, Nordelta, Tigre (Greater Buenos Aires)<span className="block text-[15px] text-[#4A515C]">Office at <a href="https://www.instagram.com/circularcowork/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C8231F]">Circular Cowork</a>, part of a network of companies, entrepreneurs and innovation labs.</span></span></span>
              <span className="flex items-start gap-3 text-[17px]"><Clock size={20} className="mt-0.5 shrink-0 text-[#C8231F]" aria-hidden="true" /> <span>Free 30-minute intro call by video<span className="block text-[15px] text-[#4A515C]">Tell us your preferred time in the form or on WhatsApp.</span></span></span>
              <p className="m-0 text-[15px] text-[#4A515C]">We&apos;re available Monday to Friday, 8 am to 6 pm Buenos Aires time (GMT-3). On WhatsApp, we reply the same day.</p>
              <div className="flex flex-col gap-2 pt-2"><span className="text-sm font-semibold text-[#4A515C]">Follow us and see how we work</span><Redes oscuro={false} conTexto /></div>
            </div>
            <div id="formulario" className="flex-[999_1_520px] min-w-0 scroll-mt-24">
              <DbContactForm lang="en" />
            </div>
          </div>
        </section>
      </main>
      <Footer lang="en" />
    </div>
  )
}
