/**
 * Equipo de la ACADEMIA DEVISEBIT. Cada persona es una tarjeta en /equipo y tiene su perfil en /equipo/<slug>.
 * Para sumar a alguien: agregar un objeto a EQUIPO (y su foto en public/equipo/<slug>.jpg, cuadrada, 400×400 o más).
 * Si la foto no está, se muestran las iniciales.
 */
export type Perfil = {
  slug: string
  nombre: string
  iniciales: string
  rol: string
  grupo: "academica" | "direccion" | "especialista"
  /** Especialista invitado (no es parte del staff de DEVISEBIT). */
  invitado?: boolean
  titular: string
  resumen: string
  bio: string[]
  frase?: string
  cifras?: [string, string][]
  trayectoria?: { a: string; t: string; d?: string }[]
  formacion?: [string, string][]
  extra?: { t: string; items: string[] }[]
  areas: string[]
  enLaAcademia?: { t: string; texto?: string; items?: string[] }
  links: { t: string; url: string }[]
  actualizado: string
}

export const EQUIPO: Perfil[] = [
  {
    slug: "georgina-varela-cilio",
    nombre: "Georgina N. Varela Cilio",
    iniciales: "GV",
    rol: "Directora académica",
    grupo: "academica",
    titular: "Gestión educativa · Liderazgo de equipos · Innovación y transformación digital",
    resumen: "Licenciada y Profesora en Ciencias de la Educación, con 17 años en educación y coordinación de proyectos de digitalización en la UBA.",
    bio: [
      "Lidera el diseño pedagógico de la Academia: qué se enseña, cómo se enseña y cómo se evalúa, para que cada curso termine en algo que el alumno pueda aplicar en su trabajo.",
      "Tiene 17 años de trayectoria en educación, liderazgo de equipos e innovación educativa, en los tres niveles. Fue secretaria de Innovación Tecnológica Educativa y tutora pedagógica en el Colegio Nacional de Buenos Aires, y coordinó proyectos de digitalización en la Universidad de Buenos Aires: implementación de plataformas, digitalización de procesos y comunicación institucional. Se destaca por la comunicación asertiva, la adaptabilidad y la toma de decisiones basada en datos.",
    ],
    frase: "Los datos no hablan solos: nosotros los hacemos hablar.",
    cifras: [["17", "años en educación"], ["3", "niveles: inicial, primario y secundario"], ["150", "estudiantes en tutoría personalizada"], ["15", "personas a cargo en equipos"]],
    trayectoria: [
      { a: "2022 – hoy", t: "Secretaria de Innovación Tecnológica Educativa · Colegio Nacional de Buenos Aires (UBA)", d: "Implementó herramientas y procesos digitales aplicados a la enseñanza. Fue tutora pedagógica (2022 – 2024) con seguimiento académico de 150 estudiantes, y desde 2026 es ayudante de Campo de Deportes: acompañó a la gestión del colegio en el proyecto del nuevo campo deportivo." },
      { a: "2026 – hoy", t: "Profesora · Colegio Northfield, sede Puertos (Red Educativa Itínere)", d: "Dicta Gestión de Datos en el nivel secundario y prepara a los estudiantes para la certificación externa de la UTN." },
      { a: "2023 – 2026", t: "Coordinadora de Proyectos de Digitalización · Universidad de Buenos Aires", d: "Subsecretaría de Transformación Digital y Modernización. Lideró equipos interdisciplinarios de hasta 15 personas: sistematización de correos, implementación de plataformas, digitalización de documentos y procesos, y mejora de la web institucional." },
      { a: "2024", t: "Encargada de Medios de Apoyo Técnico-Pedagógico · Colegio Preuniversitario Dr. Ramón Cereijo", d: "Además, gestión y organización de un curso de inglés a nivel universitario." },
      { a: "2012 – 2022", t: "Docente y desarrolladora de proyectos interdisciplinarios · Colegio Carmen Arriola de Marín", d: "Grupo Educativo Marín." },
      { a: "2008 – 2014", t: "Profesora de Educación Física y coordinadora de campamentos · Instituto San Juan Bosco", d: "Coordinó y organizó campamentos y viajes educativos institucionales." },
    ],
    formacion: [
      ["Maestría en Dirección de Instituciones Educativas", "Universidad del Salvador (USAL) · en curso"],
      ["Licenciatura y Profesorado Universitario en Ciencias de la Educación", "USI · 2023"],
      ["Licenciatura en Deporte en la Naturaleza", "UFLO · cursada completa"],
      ["Profesorado Nacional de Educación Física", "ISEF N.° 1 Romero Brest · 2010"],
      ["Coaching Ontológico", "Axion Training · 2018"],
    ],
    extra: [{ t: "Capacitaciones", items: ["Multialfabetización digital (USI)", "Profesionalización y evaluación de la enseñanza (Grupo Educativo Marín)", "“Que enseñes no significa que aprendan” (Laura Lewin)", "Cápsulas de práctica docente (Red Itínere, 2026)", "Desarrollo Profesional Docente (Northfield School, 2026)", "Inglés B1 (intermedio)"] }],
    areas: ["Gestión educativa", "IA aplicada a la educación", "Transformación digital de instituciones", "Planificación estratégica", "Decisiones basadas en datos", "Tutorías y acompañamiento", "Capacitación docente", "Liderazgo de equipos y gestión del cambio"],
    enLaAcademia: { t: "En el aula hoy", texto: "Enseña Gestión de Datos con cápsulas de práctica docente y rutinas de pensamiento: los alumnos trabajan resolviendo el caso de una tienda real (“DigiMarket”), con estaciones de inteligencias múltiples, funciones condicionales y registro de evidencias del aprendizaje. Esa misma forma de enseñar —práctica, con casos concretos y medible— es la que guía los cursos de la Academia." },
    links: [{ t: "LinkedIn", url: "https://www.linkedin.com/in/georgina-n-varela-cilio-55a277106/" }],
    actualizado: "2026-10-28",
  },
  {
    slug: "julio-miranda",
    nombre: "Julio Miranda",
    iniciales: "JM",
    rol: "Fundador de DEVISEBIT",
    grupo: "direccion",
    titular: "Transformación digital e inteligencia artificial aplicada",
    resumen: "Más de 15 años liderando proyectos de software, datos y transformación digital en salud, gobierno y educación.",
    bio: [
      "Fundó la empresa en 2009 como Web y Graf, que hoy es DEVISEBIT SRL: desarrolla software, apps e inteligencia artificial para salud, gobierno, universidades, gremios y empresas.",
      "Coordinó plataformas tecnológicas federales en el Ministerio de Ambiente de la Nación y dirigió el Centro Metropolitano de Diseño y el BA Laboratorio Tecnológico en la Ciudad de Buenos Aires. Entre 2021 y 2024 fue asesor tecnológico de la Subsecretaría de Modernización y Transformación Digital de la Universidad de Buenos Aires.",
      "En la Academia enseña lo que aplica todos los días con su equipo: IA aplicada a procesos reales, asistentes de WhatsApp, sistemas, tableros y salud digital, como la digitalización de San Patricio Servicios de Salud, uno de los proyectos de DEVISEBIT.",
    ],
    cifras: [["15+", "años liderando proyectos de tecnología"], ["2009", "funda Web y Graf, hoy DEVISEBIT SRL"]],
    trayectoria: [
      { a: "Desde 2009", t: "Fundador y Director · DEVISEBIT SRL (antes Web y Graf)", d: "Software, apps, datos e IA para salud, gobierno, universidades, gremios y empresas." },
      { a: "2021 – 2024", t: "Asesor tecnológico · Subsecretaría de Modernización y Transformación Digital, Universidad de Buenos Aires" },
      { a: "Ciudad de Buenos Aires", t: "Dirigió el Centro Metropolitano de Diseño y el BA Laboratorio Tecnológico" },
      { a: "Gobierno nacional", t: "Coordinó plataformas tecnológicas federales · Ministerio de Ambiente de la Nación" },
    ],
    formacion: [
      ["Diplomatura en Transformación Digital", "Completa"],
      ["Diplomatura en Tecnología y Salud", "UTN.BA · en curso"],
    ],
    areas: ["Transformación digital", "IA aplicada", "Asistentes de WhatsApp con IA", "Sistemas y plataformas", "Datos y tableros", "Salud digital"],
    enLaAcademia: { t: "En la Academia", items: ["Dirige la ACADEMIA DEVISEBIT junto con la dirección académica.", "Cursos de IA para pymes, asistentes de WhatsApp con IA y casos reales del ecosistema digital de DEVISEBIT."] },
    links: [{ t: "julio.devisebit.com", url: "https://julio.devisebit.com" }],
    actualizado: "2026-10-30",
  },
  {
    slug: "matias-gonzalez-dalessandro",
    nombre: "Matías González D'Alessandro",
    iniciales: "MG",
    rol: "Analista de Transformación Digital · PM",
    grupo: "especialista",
    titular: "Diagnóstico de madurez digital, planes de transformación y gestión ágil de proyectos",
    resumen: "Ingeniero Industrial (Universidad de Mendoza). Analista de Transformación Digital en DEVISEBIT: diagnósticos y consultoría a empresas.",
    bio: [
      "Es Analista de Transformación Digital en DEVISEBIT desde mayo de 2026: hace el diagnóstico de madurez digital de los clientes, diseña e implementa los planes de transformación digital, releva requerimientos con los distintos actores de cada organización, acompaña la gestión del cambio y hace el seguimiento con reportes.",
      "Es Ingeniero Industrial por la Universidad de Mendoza y complementó su formación con gestión ágil de proyectos, Python y análisis de datos con SQL y Power BI.",
    ],
    trayectoria: [
      { a: "Mayo 2026 – hoy", t: "Analista de Transformación Digital · DEVISEBIT SRL", d: "Diagnóstico de madurez digital, planes de transformación digital, relevamiento de requerimientos con stakeholders, gestión del cambio y seguimiento con reportes." },
    ],
    formacion: [
      ["Ingeniería Industrial", "Universidad de Mendoza · 2015 – 2022"],
      ["Gestión Ágil de Proyectos", "Universidad de Mendoza · 2022"],
      ["Python 3 Paso a Paso", "Centro de e-Learning UTN FRBA · 2023"],
      ["Data Analytics con SQL y Power BI", "Coderhouse · 2026"],
      ["Data Science I con Python, Pandas y NumPy", "Coderhouse · 2026"],
    ],
    areas: ["Diagnóstico de madurez digital", "Planes de transformación digital", "Gestión ágil de proyectos", "Análisis de datos y tableros (Power BI, SQL, Python)", "Gestión del cambio"],
    enLaAcademia: { t: "Lo que suma a la Academia", items: ["El curso gratis de Introducción a la transformación digital.", "Los diagnósticos de transformación digital y la devolución de los autodiagnósticos."] },
    links: [{ t: "LinkedIn", url: "https://www.linkedin.com/in/matias-gonzalez-d-alessandro/" }],
    actualizado: "2026-10-30",
  },
  {
    slug: "oscar-schmitz",
    nombre: "Oscar Schmitz",
    iniciales: "OS",
    rol: "Coach ejecutivo · Liderazgo e IA",
    grupo: "especialista",
    invitado: true,
    titular: "Coach ejecutivo, consultor y speaker en liderazgo en la era de la inteligencia artificial",
    resumen: "Ingeniero en Sistemas (UTN) y MBA (UCEMA), con más de 25 años en tecnología, coaching ejecutivo y estrategia de negocios.",
    bio: [
      "Acompaña a líderes y equipos a convertir la presión, los datos y la incertidumbre en foco y acción, integrando tecnología, propósito y personas.",
      "Tiene más de 25 años de experiencia en la industria informática, el coaching ejecutivo y el crecimiento estratégico de los negocios. Desde 1992 ocupó funciones de innovación tecnológica y gestión de negocios en la industria financiera, organismos de gobierno y empresas de tecnología, con cargos de dirección y asesoría al directorio. Es profesor universitario de grado y posgrado desde 1998 y coach mentor ejecutivo desde 2007.",
      "Participa como congresista, moderador y panelista en encuentros ejecutivos de Latinoamérica, y es columnista, autor y video-podcaster.",
    ],
    frase: "Transformando lo imposible en posible.",
    cifras: [["25+", "años en tecnología y negocios"], ["1998", "profesor de grado y posgrado"], ["22.000+", "suscriptores en #MartesCoach"]],
    trayectoria: [
      { a: "Desde 2007", t: "Coach mentor ejecutivo", d: "Innovación y transformación personal y organizacional, con equipos de alto nivel y C-Level." },
      { a: "Desde 1998", t: "Profesor universitario de grado y posgrado", d: "Programas ejecutivos y programas ejecutivos de innovación." },
      { a: "Desde 1992", t: "Innovación tecnológica y gestión de negocios", d: "Industria financiera, organismos de gobierno y empresas de tecnología, con cargos de dirección y asesoría al directorio." },
      { a: "Hoy", t: "Fundador de CXO Community, Nego2CIO, #MartesCoach y Propósito Extraordinario", d: "Comunidad, newsletter y podcast para líderes de tecnología y negocio." },
    ],
    formacion: [
      ["Ingeniero en Sistemas de Información", "Universidad Tecnológica Nacional (UTN)"],
      ["Master in Business Administration (MBA)", "UCEMA"],
      ["Coaching y Liderazgo Ontológico · Tecnicatura Superior", "ICEBA"],
      ["Embajador para Argentina de OpenEXO", "Transformación en organizaciones exponenciales"],
    ],
    areas: ["Liderazgo con IA", "Coaching y mentoring ejecutivo", "Transformación digital y exponencial", "Gestión y gobierno de IT", "Gestión del cambio", "Casos de negocio", "Seguridad de la información"],
    enLaAcademia: { t: "Lo que suma a la Academia", items: ["Sesiones de coaching ejecutivo y liderazgo con IA.", "Talleres: prompt engineering para ejecutivos, automatizaciones y productividad con IA, transformación digital para pymes y marca personal en LinkedIn.", "Sus libros y papers, entre ellos “El arte de forjar sistemas”."] },
    links: [{ t: "oscarschmitz.com", url: "https://www.oscarschmitz.com/" }, { t: "LinkedIn", url: "https://www.linkedin.com/in/schmitzoscar/" }],
    actualizado: "2026-10-28",
  },
]

export const perfil = (slug: string) => EQUIPO.find((p) => p.slug === slug)
export const fotoDe = (slug: string) => `/equipo/${slug}.jpg`
