import Link from "next/link"
import { MessageCircle, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import DbHero from "@/components/db-hero"
import { JsonLd } from "@/components/json-ld"
import Kit40Herramienta from "@/components/kit40-herramienta"
import { pageMeta, breadcrumb, servicio, SITE_URL } from "@/lib/seo"

export const metadata = pageMeta(
  "Kit 4.0: cofinanciá hasta el 50% de tu tecnología · DEVISEBIT",
  "Guía y herramienta gratis del Programa Kit 4.0: requisitos, kits de CRM, IA y canal digital, cofinanciamiento estimado y documentación para tu pyme.",
  "/kit-4-0",
)

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20revisar%20si%20mi%20pyme%20califica%20para%20el%20Kit%204.0"
const ACTUALIZADO = "31 de octubre de 2026"

const PASOS = [
  ["Elegí el kit", "Según lo que necesitás: canal digital, CRM, IA comercial, ISO o los kits industriales."],
  ["Pedí el presupuesto", "A un proveedor del programa, desglosado en software, implementación, servicios, integraciones, capacitación y soporte."],
  ["Presentá la solicitud", "La Solicitud de Elegibilidad se carga en Trámites a Distancia (TAD) con el presupuesto adjunto."],
  ["Reservá el cupo", "Si se aprueba, recibís el ticket de reserva y firmás el acta de inicio con el proveedor."],
  ["Implementá", "El proveedor desarrolla e implementa el kit con tu equipo."],
  ["Firmá la recepción", "Con el Acta de Recepción Conforme se acredita el 50% al proveedor."],
]

const FAQ = [
  ["¿Qué es el Programa Kit 4.0?", "Es un programa del Ministerio de Economía de la Nación que cofinancia hasta el 50% del valor neto de soluciones digitales para mipymes. Se financia con el FONPEC y lo aplica la Subsecretaría de Industria y Economía del Conocimiento."],
  ["¿Quién puede pedirlo?", "Desde la Resolución 343/2026 (septiembre de 2026), las mipymes de todos los sectores. Hace falta tener al menos 2 años de actividad en Argentina, Certificado MiPyME vigente y no tener deuda fiscal ni previsional exigible."],
  ["¿Me dan el dinero a mí?", "No. El beneficio no se cobra en efectivo: se acredita al proveedor que implementa la solución, como crédito fiscal, una vez firmada el Acta de Recepción Conforme. Vos pagás tu parte."],
  ["¿Qué kits sirven para CRM, inteligencia artificial o vender online?", "La Disposición 106/2026 (septiembre de 2026) sumó cuatro kits: Canales y comercio digital, CRM y automatización, Analítica e IA comercial y Sistema de gestión ISO."],
  ["¿El cupo es limitado?", "Sí. El programa tiene un cupo total de $9.000 millones que se asigna por orden de llegada. Cuando se agota, se cierra o suspende la convocatoria."],
  ["¿Cuánto cuesta la revisión de DEVISEBIT?", "La primera reunión es gratuita. Revisamos tus requisitos, qué kit te conviene y qué documentación te falta."],
]

const FUENTES = [
  ["Programa KIT 4.0: acceso para todas las MiPyMEs (Resolución 343/2026)", "https://siap.blogdelcontador.com.ar/novedades/programa-kit-4-0-amplian-el-acceso-a-mipymes-de-todos-los-sectores/"],
  ["Programa Kit 4.0 suma comercio digital, CRM, IA y normas ISO (Disposición 106/2026)", "https://contadoresenred.com/programa-kit-4-0-suma-comercio-digital-crm-ia-y-normas-iso-a-quienes-alcanza/"],
  ["Kit 4.0 PyMEs: guía paso a paso", "https://revistafoda.com.ar/kit-40-pymes-argentina-guia/"],
]

export default function Kit40Page() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <JsonLd data={breadcrumb([["Transformación digital", "/transformacion-digital"], ["Kit 4.0", "/kit-4-0"]])} />
      <JsonLd data={servicio("Asesoramiento para el Programa Kit 4.0", "Revisión de requisitos, elección del kit, armado de la solicitud y documentación para pymes que quieren cofinanciar tecnología con el Programa Kit 4.0.", "/kit-4-0", "Consultoría de financiamiento para transformación digital")} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", url: SITE_URL + "/kit-4-0", name: "Kit 4.0: guía y herramienta para pymes", dateModified: "2026-10-31", inLanguage: "es-AR" }} />
      <Header />
      <main id="contenido" className="pt-[72px]">
        <DbHero
          kicker="Programa Kit 4.0"
          title="Cofinanciá hasta el 50% de la tecnología de tu pyme."
          sub="Ahora el Kit 4.0 alcanza a todas las mipymes y suma kits de CRM, inteligencia artificial y canal digital. Verificá en 5 minutos si calificás, qué kit te conviene y qué documentación necesitás."
        >
          <div className="flex flex-wrap gap-2.5 mt-2">
            <a href="#herramienta" className="inline-flex items-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3.5 font-bold text-white transition-colors"><FileText size={19} aria-hidden="true" /> Usar la herramienta gratis</a>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3.5 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={19} aria-hidden="true" /> Consultar por WhatsApp</a>
          </div>
          <p className="m-0 text-sm text-[#9AA1AD]">Información actualizada al {ACTUALIZADO}.</p>
        </DbHero>

        <section aria-labelledby="k-que" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid md:grid-cols-[1fr_1.2fr] gap-10 items-start">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Cómo funciona</p>
              <h2 id="k-que" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">El Estado paga la mitad; vos elegís qué implementar.</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Elegís un kit estandarizado y un proveedor del programa. El Estado cubre hasta el 50% del valor neto, pero no se lo entrega a la pyme: se acredita al proveedor como crédito fiscal cuando el proyecto está implementado y firmado.</p>
              <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">El cupo es limitado y se asigna por orden de llegada, así que conviene tener la documentación lista antes de presentar.</p>
            </div>
            <ol className="m-0 p-0 list-none grid sm:grid-cols-2 gap-3">
              {PASOS.map(([t, d], i) => (
                <li key={t} className="rounded-2xl border border-[#E2E5EA] p-5 flex flex-col gap-1.5">
                  <span className="text-sm font-extrabold text-[#C8231F]">{String(i + 1).padStart(2, "0")}</span>
                  <strong>{t}</strong><span className="text-[15px] text-[#4A515C]">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="herramienta" aria-labelledby="k-tool" className="bg-[#F5F6F8] scroll-mt-24">
          <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Herramienta gratuita</p>
              <h2 id="k-tool" className="m-0 font-tight text-[34px] md:text-[44px] leading-[1.1] font-extrabold">¿Calificás? Hacelo en 5 minutos.</h2>
              <p className="m-0 text-lg leading-relaxed text-[#4A515C]">Completás cuatro pasos y te llevás un resumen con tu situación, el kit que te conviene, el cofinanciamiento estimado y la carpeta de documentos. No guardamos nada: se calcula en tu navegador.</p>
            </div>
            <Kit40Herramienta />
          </div>
        </section>

        <section aria-labelledby="k-faq" className="bg-white">
          <div className="max-w-[900px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-6">
            <h2 id="k-faq" className="m-0 font-tight text-[30px] md:text-[38px] leading-[1.12] font-extrabold">Preguntas frecuentes</h2>
            <div className="flex flex-col gap-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="rounded-2xl border border-[#E2E5EA] p-5 open:bg-[#F5F6F8]">
                  <summary className="cursor-pointer font-bold text-[17px]">{q}</summary>
                  <p className="mt-3 mb-0 text-[16px] leading-relaxed text-[#4A515C]">{a}</p>
                </details>
              ))}
            </div>
            <div className="rounded-2xl border border-[#E2E5EA] p-5 text-sm text-[#4A515C] flex flex-col gap-2">
              <strong className="text-[#0E1116]">Fuentes consultadas ({ACTUALIZADO})</strong>
              <ul className="m-0 pl-5 flex flex-col gap-1">
                {FUENTES.map(([t, h]) => <li key={h}><a href={h} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] underline">{t}</a></li>)}
              </ul>
              <span>Las condiciones pueden cambiar. Antes de presentar, confirmá los montos, los topes y los requisitos vigentes en el Boletín Oficial y en el sitio del programa. DEVISEBIT no es un organismo oficial.</span>
            </div>
          </div>
        </section>

        <section className="bg-[#FFF4F2] border-t border-[#F0C9C6]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10 flex flex-wrap gap-4 items-center justify-between">
            <p className="m-0 text-[17px] text-[#3B424D] max-w-[760px]"><strong className="text-[#0B0D12]">¿Querés contratar directamente?</strong> Los Kits DEVISEBIT son nuestros paquetes de tecnología con alcance cerrado, y te ayudamos a buscar financiamiento.</p>
            <Link href="/kit-digital" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-3.5 font-bold text-white transition-colors">Ver los Kits DEVISEBIT →</Link>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-16 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex-[1_1_560px] flex flex-col gap-3">
              <h2 className="m-0 font-tight text-[28px] md:text-[34px] font-extrabold">¿Revisamos tu caso, sin cargo?</h2>
              <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">La primera reunión es gratuita. Te decimos si calificás, qué kit conviene y qué documentación falta, antes de presupuestar nada.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-6 py-4 font-bold text-[#0B0D12] transition-colors">WhatsApp</a>
              <Link href="/diagnostico" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-white transition-colors">Hacé el autodiagnóstico gratis</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
