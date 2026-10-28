import type { Metadata } from "next"

export const metadata: Metadata = { title: "Equipo académico · Academia DEVISEBIT", description: "Quiénes enseñan en la Academia DEVISEBIT: dirección académica con experiencia en educación y transformación digital." }

/** Equipo académico de la Academia DEVISEBIT (público). */
export default function EquipoAcademico() {
  return (
    <main>
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

      </div>
    </main>
  )
}
