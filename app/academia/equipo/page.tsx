import type { Metadata } from "next"
import { existsSync } from "fs"
import path from "path"

export const metadata: Metadata = { title: "Equipo académico · ACADEMIA DEVISEBIT", description: "Quiénes enseñan en la ACADEMIA DEVISEBIT: dirección académica de Georgina Varela Cilio, 17 años en educación y transformación digital." }

/** Foto: subir el archivo a public/equipo/georgina.jpg y se muestra sola. Mientras no esté, van las iniciales. */
const FOTO = "/equipo/georgina.jpg"

const CIFRAS = [
  ["17", "años en educación"],
  ["3", "niveles: inicial, primario y secundario"],
  ["150", "estudiantes en tutoría personalizada"],
  ["15", "personas a cargo en equipos"],
]

const TRAYECTORIA = [
  { a: "2026 – hoy", t: "Docente · Colegio Nacional de Buenos Aires (UBA)", d: "Campo de Deportes de Puerto Madero; acompañó la gestión del proyecto del nuevo campo deportivo." },
  { a: "2026 – hoy", t: "Docente de Excel · Colegio Northfield (Red Educativa Itínere)", d: "Horas extraprogramáticas en 5.° año y preparación para la certificación externa de la UTN." },
  { a: "2023 – 2026", t: "Coordinadora de Proyectos de Digitalización · Universidad de Buenos Aires", d: "Equipos de hasta 15 personas: implementación de plataformas, sistematización de procesos y mejora de la web institucional." },
  { a: "2022 – 2026", t: "Secretaria de Innovación Tecnológica Educativa · Colegio Nacional de Buenos Aires", d: "Procesos digitales en la enseñanza; tutora pedagógica con seguimiento académico de 150 estudiantes." },
  { a: "2024", t: "Medios de apoyo técnico-pedagógico · Colegio Preuniversitario Dr. Ramón Cereijo", d: "Además, gestión y organización de un curso de inglés a nivel universitario." },
  { a: "2012 – 2022", t: "Profesora · Colegio Carmen Arriola de Marín", d: "Educación Física y Construcción de la Ciudadanía, con proyectos interdisciplinarios." },
  { a: "2008 – 2014", t: "Profesora y coordinadora de Educación Física · Instituto San Juan Bosco", d: "Nivel primario; campamentos y viajes educativos." },
]

const FORMACION = [
  ["Maestría en Dirección de Instituciones Educativas", "Universidad del Salvador (USAL) · en curso"],
  ["Licenciatura y Profesorado Universitario en Ciencias de la Educación", "USI · 2023"],
  ["Licenciatura en Deporte en la Naturaleza", "UFLO · cursada completa"],
  ["Profesorado Nacional de Educación Física", "ISEF N.° 1 Romero Brest · 2010"],
  ["Coaching Ontológico", "Axion Training · 2018"],
]

const CAPACITACIONES = ["Multialfabetización digital (USI)", "Profesionalización y evaluación de la enseñanza (Grupo Educativo Marín)", "“Que enseñes no significa que aprendan” (Laura Lewin)", "Cápsulas de práctica docente (Red Itínere, 2026)", "Desarrollo Profesional Docente (Northfield School, 2026)", "Inglés B1"]

const AREAS = ["Tecnología educativa e IA en el aula", "Transformación digital de instituciones", "Diseño y evaluación de la enseñanza", "Decisiones basadas en datos", "Capacitación docente", "Liderazgo de equipos y gestión del cambio"]

/** Equipo académico de la ACADEMIA DEVISEBIT (público). */
export default function EquipoAcademico() {
  const hayFoto = existsSync(path.join(process.cwd(), "public", FOTO))
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-5xl mx-auto px-4 py-12 sm:py-14">
        <span className="chip bg-[#C8231F] text-white">Equipo académico</span>
        <h1 className="m-0 mt-4 text-3xl sm:text-5xl font-extrabold text-white leading-tight">Quiénes enseñan en la Academia</h1>
        <p className="m-0 mt-4 text-base sm:text-lg text-white/80 max-w-2xl">Una dirección académica con experiencia en educación y transformación digital, y especialistas invitados que suman su mirada en cursos, talleres y sesiones.</p>
      </div></header>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 flex flex-col gap-8">
        <section className="card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start" aria-labelledby="t-dir">
          {hayFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FOTO} alt="Georgina N. Varela Cilio, directora académica" width={200} height={200} className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-2xl object-cover border border-[#E2E5EA]" />
          ) : (
            <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-2xl bg-[#F5F6F8] border border-[#E2E5EA] flex items-center justify-center text-5xl font-extrabold text-[#C8231F]" aria-hidden="true">GV</div>
          )}
          <div className="flex flex-col gap-3">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">Directora académica</p>
              <h2 id="t-dir" className="m-0 mt-1 text-2xl sm:text-3xl">Georgina N. Varela Cilio</h2>
              <p className="m-0 mt-1 text-[#4A515C]">Licenciada y Profesora en Ciencias de la Educación · Profesora de Educación Física · Maestranda en Dirección de Instituciones Educativas (USAL)</p>
            </div>
            <p className="m-0">Lidera el diseño pedagógico de la Academia: qué se enseña, cómo se enseña y cómo se evalúa, para que cada curso termine en algo que el alumno pueda aplicar en su trabajo.</p>
            <p className="m-0">Tiene 17 años de trayectoria en los tres niveles educativos. Fue secretaria de Innovación Tecnológica Educativa y tutora pedagógica en el Colegio Nacional de Buenos Aires, y coordinó proyectos de digitalización en la Universidad de Buenos Aires: implementación de plataformas, digitalización de procesos y comunicación institucional.</p>
            <blockquote className="m-0 border-l-4 border-[#C8231F] pl-4 italic text-[#262C37]">“Los datos no hablan solos: nosotros los hacemos hablar.”</blockquote>
            <a href="https://www.linkedin.com/in/georgina-n-varela-cilio-55a277106/" target="_blank" rel="noopener noreferrer" className="btn-s self-start">Perfil de LinkedIn ↗</a>
          </div>
        </section>

        <ul className="m-0 p-0 list-none grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Trayectoria en números">
          {CIFRAS.map(([n, t]) => (
            <li key={t} className="card !p-4 flex flex-col gap-1"><strong className="text-3xl sm:text-4xl font-extrabold text-[#C8231F] leading-none">{n}</strong><span className="text-sm text-[#4A515C]">{t}</span></li>
          ))}
        </ul>

        <section aria-labelledby="t-tray" className="flex flex-col gap-4">
          <h2 id="t-tray" className="m-0 text-2xl">Trayectoria</h2>
          <ol className="m-0 p-0 list-none flex flex-col gap-3">
            {TRAYECTORIA.map((x) => (
              <li key={x.t} className="card !p-4 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-4">
                <span className="text-sm font-bold text-[#C8231F]">{x.a}</span>
                <div><strong className="block">{x.t}</strong><span className="text-sm text-[#4A515C]">{x.d}</span></div>
              </li>
            ))}
          </ol>
          <p className="m-0 text-sm text-[#4A515C]">Antes, años de coordinación en deporte, recreación y eventos masivos: salas de entrenamiento, colonias, campamentos y torneos intercolegiales.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section aria-labelledby="t-form" className="card flex flex-col gap-3">
            <h2 id="t-form" className="m-0 text-xl">Formación</h2>
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {FORMACION.map(([t, d]) => <li key={t}><strong className="block text-[15px]">{t}</strong><span className="text-sm text-[#4A515C]">{d}</span></li>)}
            </ul>
          </section>
          <section aria-labelledby="t-cap" className="card flex flex-col gap-3">
            <h2 id="t-cap" className="m-0 text-xl">Capacitaciones</h2>
            <ul className="m-0 pl-5 flex flex-col gap-1.5 text-[15px]">
              {CAPACITACIONES.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </section>
        </div>

        <section aria-labelledby="t-areas" className="flex flex-col gap-3">
          <h2 id="t-areas" className="m-0 text-xl">Áreas de trabajo</h2>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2 text-sm">
            {AREAS.map((t) => <li key={t} className="rounded-full border border-[#C3C8D1] px-3 py-1.5 font-semibold">{t}</li>)}
          </ul>
        </section>

        <section aria-labelledby="t-proy" className="card bg-[#F5F6F8] flex flex-col gap-2">
          <h2 id="t-proy" className="m-0 text-xl">En el aula hoy</h2>
          <p className="m-0">Diseña cápsulas de práctica docente con rutinas de pensamiento: los alumnos aprenden Excel resolviendo el caso de una tienda real (“DigiMarket”), con estaciones de inteligencias múltiples, funciones condicionales y registro de evidencias del aprendizaje. Esa misma forma de enseñar —práctica, con casos concretos y medible— es la que guía los cursos de la Academia.</p>
        </section>
      </div>
    </main>
  )
}
