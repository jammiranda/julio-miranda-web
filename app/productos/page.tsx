import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SOLUCIONES, SOLUCION_DE_PRODUCTO } from "@/lib/marca"
import { DEMO_DE_PRODUCTO, demoUrl } from "@/lib/demos"

export const metadata = {
  title: "Productos · DEVISEBIT",
  description: "Sistemas probados y listos para implementar: clínicas, asistente de WhatsApp con IA, CRM de afiliados, tableros, apps, academias online, votación y gestor documental.",
}

const PRODUCTS = [
  { id: "clinicas", title: "Sistema para clínicas", text: "Turnos, historia clínica, recetas y tablero.", items: ["Agenda y turnos online", "Historia clínica electrónica", "Prestaciones y facturación", "Tablero de gestión"] },
  { id: "whatsapp", title: "Asistente de WhatsApp con IA", text: "Atención 24 h con derivación a personas.", items: ["Responde a toda hora", "Da y confirma turnos", "Deriva a tu equipo", "Registra todo en el CRM"] },
  { id: "crm", title: "CRM de afiliados y prestadores", text: "Padrón único, autorizaciones y trazabilidad.", items: ["Padrón y grupos familiares", "Aportes y recaudación", "Órdenes y autorizaciones", "Prestadores y beneficios"] },
  { id: "tableros", title: "Tableros de control", text: "Indicadores al día con alertas.", items: ["Indicadores en tiempo real", "Alertas automáticas", "Reportes mensuales", "Desde tus Excel o sistemas"] },
  { id: "app", title: "App y credencial digital", text: "Tu institución en el celular de cada afiliado.", items: ["Credencial digital", "Beneficios y novedades", "Avisos al celular", "iOS y Android"] },
  { id: "academias", title: "Academias online", text: "Cursos, pagos y certificados.", items: ["Cursos y clases en vivo", "Inscripciones y pagos", "Asistencias y certificados", "Con tu marca"] },
  { id: "votacion", title: "Votación y control de acceso", text: "Elecciones sin papel y acceso con QR.", items: ["Votación electrónica", "Padrón de votantes", "Acceso con QR y molinetes", "Resultados al instante"] },
  { id: "documental", title: "Gestor documental con firma digital", text: "Documentos ordenados y firmados en línea.", items: ["Expedientes digitales", "Firma digital", "Búsqueda y permisos", "Historial de cambios"] },
]

const STEPS = [
  { n: "01", t: "Lo configuramos", d: "Cargamos tus preguntas frecuentes, horarios, servicios y reglas de derivación." },
  { n: "02", t: "Lo conectamos", d: "WhatsApp Business oficial, tu agenda de turnos y tu CRM." },
  { n: "03", t: "Lo probamos", d: "Tu equipo lo prueba con casos reales antes de abrirlo al público." },
  { n: "04", t: "Lo medimos", d: "Tablero con consultas atendidas, turnos dados y derivaciones." },
]

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Productos</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Sistemas probados, listos para implementar.</h1>
            <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">No empezamos de cero: adaptamos productos que ya funcionan en producción. Eso baja el plazo y el riesgo.</p>
            <div className="flex flex-wrap gap-2 mt-3"><Link href="/servicios#soluciones" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Ver soluciones con precio</Link><Link href="/servicios#a-medida" className="rounded-xl border border-white/20 hover:border-[#FF6A63] px-5 py-3 font-bold text-white transition-colors">Servicios a medida</Link></div>
          </div>
          <div className="db-scan"><i /></div>
        </section>

        <section className="bg-[#F5F6F8]">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCTS.map((p) => (
              <article key={p.id} id={p.id} className="db-card scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-6 flex flex-col gap-3">
                <h2 className="m-0 font-tight text-xl font-bold">{p.title}</h2>
                <p className="m-0 text-[15px] leading-relaxed text-[#4A515C]">{p.text}</p>
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5 border-t border-[#E2E5EA] pt-3">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2 text-sm"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span>{i}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-[#E2E5EA]">
                  {(() => { const sol = SOLUCIONES.find((x) => x.id === SOLUCION_DE_PRODUCTO[p.id]); return sol ? <Link href={sol.href} className="rounded-xl border border-[#C3C8D1] hover:border-[#C8231F] px-4 py-2.5 text-center text-sm font-bold text-[#0E1116] transition-colors">Ver planes y precios</Link> : null })()}
                  {DEMO_DE_PRODUCTO[p.id] ? (
                    <>
                      <a href={demoUrl(DEMO_DE_PRODUCTO[p.id])} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors">Pedir la demo</a>
                      <span className="text-xs text-[#4A515C] text-center">Te llega por email un link para probarla. <Link href={`/contacto?tema=${encodeURIComponent("Demo: " + p.title)}#formulario`} className="underline">O pedí una presentación</Link>.</span>
                    </>
                  ) : (
                    <>
                      <Link href={`/contacto?tema=${encodeURIComponent("Demo: " + p.title)}#formulario`} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors">Quiero ver una demo</Link>
                      <span className="text-xs text-[#4A515C] text-center">Te lo mostramos funcionando en una videollamada de 30 minutos.</span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="destacado" className="bg-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-wrap gap-12">
            <div className="flex-[1_1_420px] min-w-0">
              <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">Producto destacado</p>
              <h2 id="destacado" className="mt-2 mb-3 font-tight text-[32px] md:text-[40px] leading-[1.1] font-extrabold">Tu atención por WhatsApp, las 24 horas. Sin sumar personal.</h2>
              <p className="m-0 mb-4 text-lg leading-relaxed text-[#4A515C]">Un asistente que entiende lo que te escriben, da turnos y deriva a tu equipo cuando hace falta. Se implementa en semanas, con precio fijo.</p>
              {["Responde las 24 horas, los 7 días", "Da, confirma y reprograma turnos", "Deriva a una persona cuando hace falta", "Guarda cada conversación en el CRM", "Envía recordatorios automáticos", "Tablero de métricas de atención"].map((t) => (
                <div key={t} className="flex gap-3 items-start py-4 border-b border-[#E2E5EA]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">✓</span><span className="text-[17px]">{t}</span></div>
              ))}
            </div>
            <div className="db-tech flex-[1_1_420px] min-w-0 rounded-[20px] bg-[#0B0D12] p-7 flex flex-col gap-3 text-white">
              <div className="text-[13px] text-[#C3C8D1]"><span className="db-live" />Conversación de ejemplo</div>
              <div className="db-rise self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">Hola, ¿tienen turno con kinesiología esta semana?</div>
              <div className="db-rise2 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">¡Hola! Tengo jueves 10:00 o viernes 16:30. ¿Cuál te queda mejor?</div>
              <div className="db-rise3 self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">Jueves 10</div>
              <div className="db-rise3 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">Listo, quedó agendado. Te mando un recordatorio el día anterior.</div>
              <div className="db-rise3 self-end bg-[#1F6F43] px-4 py-3 rounded-[14px_14px_2px_14px] max-w-[80%]">¿Atienden por obra social?</div>
              <div className="db-rise3 self-start bg-[#1B2029] border border-[#262C37] px-4 py-3 rounded-[14px_14px_14px_2px] max-w-[80%]">Para confirmarte la cobertura te paso con Laura, de admisión. Ya le dejé tu consulta 👇</div>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
                <span className="text-[13px] text-[#C3C8D1]">Tablero del asistente · datos de ejemplo</span>
                <div className="grid grid-cols-3 gap-2">
                  {[["312", "consultas del mes"], ["74%", "resueltas solas"], ["58", "turnos dados"]].map(([n, l]) => (
                    <div key={l} className="rounded-xl bg-[#161A22] border border-[#262C37] p-3"><strong className="block font-tight text-2xl">{n}</strong><span className="text-xs text-[#C3C8D1]">{l}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-7">
            <h2 className="m-0 font-tight text-[30px] md:text-[36px] font-extrabold">Cómo lo implementamos</h2>
            <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="db-card rounded-2xl border border-[#262C37] bg-[#161A22] p-6 flex flex-col gap-2.5">
                  <span className="font-tight text-[30px] font-extrabold text-[#FF6A63]">{s.n}</span>
                  <strong className="text-[19px]">{s.t}</strong>
                  <span className="text-[#C3C8D1] leading-normal">{s.d}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <a href={demoUrl("whatsapp")} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold text-[17px] text-white transition-colors">Pedir la demo</a>
              <Link href={`/contacto?tema=${encodeURIComponent("Demo: Asistente de WhatsApp con IA")}#formulario`} className="rounded-xl border-2 border-[#0E1116] px-[22px] py-[14px] font-bold text-[17px] hover:bg-[#0E1116] hover:text-white transition-colors">Pedir una presentación</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
