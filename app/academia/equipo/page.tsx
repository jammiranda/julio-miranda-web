import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { usuarioActual } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Equipo académico (borrador)", robots: { index: false, follow: false } }

/**
 * BORRADOR: equipo académico de la Academia DEVISEBIT.
 * Solo lo ve el equipo con sesión iniciada (sistema.devisebit.com/academia/equipo).
 * Para publicarlo: sacar el control de sesión y sumar el link en el menú de la Academia.
 */
export default async function EquipoAcademico() {
  const u = await usuarioActual()
  if (!u) redirect("/login")
  return (
    <main>
      <div className="bg-amber-100 text-amber-900 text-sm font-semibold text-center py-2 px-4">BORRADOR · no está publicado · solo lo ve el equipo con sesión iniciada</div>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-5xl mx-auto px-4 py-14">
        <span className="chip bg-[#C8231F] text-white">Equipo académico</span>
        <h1 className="m-0 mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">Quiénes enseñan en la Academia</h1>
        <p className="m-0 mt-4 text-lg text-white/80 max-w-2xl">Una dirección académica con experiencia en educación y transformación digital, y especialistas invitados que suman su mirada en cursos, talleres y sesiones.</p>
      </div></header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
        <section className="card grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6" aria-labelledby="t-dir">
          <div className="w-[180px] h-[180px] rounded-2xl bg-[#F5F6F8] border border-[#E2E5EA] flex items-center justify-center text-5xl font-extrabold text-[#C8231F]" aria-hidden="true">GV</div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">Directora académica</p>
              <h2 id="t-dir" className="m-0 mt-1 text-3xl">Georgina N. Varela Cilio</h2>
              <p className="m-0 mt-1 text-[#4A515C]">Licenciada y Profesora en Ciencias de la Educación · Maestranda en Dirección de Instituciones Educativas (USAL)</p>
            </div>
            <p className="m-0">Lidera el diseño pedagógico de la Academia: qué se enseña, cómo se enseña y cómo se evalúa, para que cada curso termine en algo que el alumno pueda aplicar en su trabajo.</p>
            <p className="m-0">Tiene 17 años de trayectoria en educación. Fue secretaria de Innovación Tecnológica Educativa y tutora pedagógica en el Colegio Nacional de Buenos Aires (UBA), y coordinó proyectos de digitalización en la Subsecretaría de Transformación Digital y Modernización de la UBA: implementación de plataformas, digitalización de procesos y comunicación institucional. Lideró equipos de hasta 15 personas y acompañó con tutorías personalizadas a 150 estudiantes.</p>
            <ul className="m-0 p-0 list-none flex flex-wrap gap-2 text-sm">
              {["Tecnología educativa e IA en el aula", "Transformación digital de instituciones", "Diseño y evaluación de la enseñanza", "Capacitación docente", "Liderazgo de equipos y coaching"].map((t) => <li key={t} className="rounded-full border border-[#C3C8D1] px-3 py-1 font-semibold">{t}</li>)}
            </ul>
            <a href="https://www.linkedin.com/in/georgina-n-varela-cilio-55a277106/" target="_blank" rel="noopener noreferrer" className="btn-s self-start">Perfil de LinkedIn ↗</a>
          </div>
        </section>

        <section className="card grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6" aria-labelledby="t-osc">
          <div className="w-[180px] h-[180px] rounded-2xl bg-[#0E1116] flex items-center justify-center text-5xl font-extrabold text-[#FF6A63]" aria-hidden="true">OS</div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">Especialista invitado</p>
              <h2 id="t-osc" className="m-0 mt-1 text-3xl">Oscar Schmitz</h2>
              <p className="m-0 mt-1 text-[#4A515C]">Coach, consultor y speaker en liderazgo en la era de la inteligencia artificial</p>
            </div>
            <p className="m-0">Acompaña a líderes y equipos a convertir la presión, los datos y la incertidumbre en foco y acción, integrando tecnología, propósito y personas.</p>
            <h3 className="m-0 text-base">Lo que podría sumar a la Academia</h3>
            <ul className="m-0 pl-5 flex flex-col gap-1 text-[15px]">
              <li>Sesiones individuales de coaching ejecutivo y liderazgo con IA.</li>
              <li>Talleres: Prompt engineering para ejecutivos · Automatizaciones y productividad con IA · Transformación digital para pymes · Marca personal en LinkedIn.</li>
              <li>Sus libros y papers, ofrecidos en la Academia.</li>
            </ul>
            <a href="https://www.oscarschmitz.com/" target="_blank" rel="noopener noreferrer" className="btn-s self-start">oscarschmitz.com ↗</a>
          </div>
        </section>

        <section className="card !bg-[#FFFBEB] !border-amber-200 flex flex-col gap-2" aria-labelledby="t-pend">
          <h2 id="t-pend" className="m-0 text-base">Antes de publicar (nota interna)</h2>
          <ul className="m-0 pl-5 flex flex-col gap-1 text-sm">
            <li>Georgina: revisar y aprobar el texto, sumar su foto y confirmar cómo quiere figurar el título (la maestría está en curso).</li>
            <li>Oscar: acordar qué ofrece en la Academia, precios, comisión de DEVISEBIT por reventa (sesiones, talleres, libros) y forma de cobro (Mercado Pago de la Academia y liquidación mensual). Usar su foto y textos solo con su aprobación.</li>
            <li>Cargar cada oferta como producto de la Academia (Panel → Academia) y los talleres como cursos con certificado.</li>
            <li>Para publicar: quitar el control de sesión de esta página y agregar «Equipo» en el menú de la Academia.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
