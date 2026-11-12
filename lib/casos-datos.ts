/** Casos de éxito destacados de DEVISEBIT (se muestran todos en el HTML de /casos-de-exito). */
export const SECTORES = [
  { id: "gobierno", name: "Gobierno y Administración", icon: "🏛️" },
  { id: "empresas", name: "Empresas Privadas", icon: "🏢" },
  { id: "innovacion", name: "Educación e Innovación", icon: "🎓" },
  { id: "analitica", name: "Analítica de Datos", icon: "📊" },
  { id: "gremios", name: "Gremios y Salud", icon: "🤝" },
]

export const CASOS = [
  {
    id: 5,
    sector: "gobierno",
    category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
    title: "Municipio de Tigre · app Soy Tigre",
    client: "Municipio de Tigre (Argentina)",
    industry: "Gobierno Municipal",
    challenge:
      "Servicio de desarrollo y soporte de la aplicación móvil del municipio, con funcionalidades específicas como el registro de comercios adheridos y el alta de usuarios de las tarjetas «Soy Tigre» y «Soy Tigre Joven».",
    service:
      "Desarrollo de software, pruebas y depuración, actualizaciones y mantenimiento, soporte técnico, monitoreo y análisis. Git, Firebase Console, ESLint, Prettier. Ciberseguridad. UX/UI. Scrum Agile.",
    achievements:
      "Más de 80.000 vecinos suscriptos a la app. Más de 500 comercios adheridos en todo el partido. Tarjetas Soy Tigre y Soy Tigre Joven con alta digital.",
    image: "/images/case-tigre-new.webp",
    technologies: ["React Native", "Firebase", "Git", "UX/UI", "Ciberseguridad"],
  },
  {
    id: 1,
    sector: "gobierno",
    category: "Gestión de Proyectos IT y Analítica de Datos",
    title:
      "Seguimiento y soporte de la gestión de la Subsecretaría de Modernización y Transformación Digital de la UBA",
    client: "Universidad de Buenos Aires (Argentina)",
    industry: "Educación Superior",
    challenge:
      "Soporte, seguimiento y documentación de los proyectos que el cliente indica como relevantes.",
    service:
      "Análisis de datos con Microsoft Power BI. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
    achievements: "Actualización tecnológica. Agilidad. Organización. Información oportuna y actualizada.",
    image: "/images/case-uba-new.webp",
    technologies: ["Microsoft Power BI", "UX/UI", "Scrum Agile", "Análisis de Datos"],
  },
  {
    id: 2,
    sector: "innovacion",
    category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
    title: "Academia BA Emprende",
    client: "Gobierno de la Ciudad de Buenos Aires (Argentina)",
    industry: "Educación y Gobierno",
    challenge:
      "Proporcionar un espacio de interacción y oferta académica para fomentar el conocimiento y la experiencia de los vecinos de la Ciudad.",
    service:
      "Single Sign-On (SSO) entre WordPress y Moodle. Gestión de contenidos para educación en línea. Implementación y conexión con CRM. UX/UI. Scrum Agile.",
    achievements: "Actualización tecnológica. Agilidad. Organización. Información oportuna y actualizada.",
    image: "/images/case-academia-new.webp",
    technologies: ["WordPress", "Moodle", "SSO", "CRM", "UX/UI"],
  },
  {
    id: 3,
    sector: "analitica",
    category: "Analítica de Datos, Inteligencia del Negocio e IA",
    title: "Web Data Extraction y Chatbots",
    client: "Gestión Pública / Empresa Privada",
    industry: "Sector Público y Privado",
    challenge:
      "Desarrollamos plataformas que recopilan y estructuran automáticamente los datos disponibles en la web y los transforman en información útil.",
    service:
      "Desarrollo tecnológico. Python / JavaScript / PHP. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
    achievements:
      "Soluciones adaptadas a las necesidades del cliente. Agilidad. Información oportuna y actualizada.",
    image: "/images/case-data-extraction-new.webp",
    technologies: ["Python", "JavaScript", "PHP", "UX/UI", "Scrum Agile", "Web Scraping"],
  },
  {
    id: 4,
    sector: "empresas",
    category: "Gestión de Proyectos IT y Analítica de Datos",
    title: "Seguimiento y soporte de la gestión integral para TSGROUP",
    client: "Empresa Privada / Tecnología y Gestión de Gobierno Provincial",
    industry: "Tecnología Empresarial",
    challenge:
      "Soporte, seguimiento y documentación de los proyectos que el cliente indica como relevantes o que forman parte de sus compromisos con terceros.",
    service:
      "Análisis de datos con Microsoft Power BI. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
    achievements: "Actualización tecnológica. Agilidad. Organización. Información oportuna y actualizada.",
    image: "/images/case-tsgroup-new.webp",
    technologies: ["Microsoft Power BI", "UX/UI", "Scrum Agile", "Análisis de Datos"],
  },
  {
    id: 6,
    sector: "empresas",
    category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
    title: "Aplicativos Trade Marketing y Nacelle",
    client: "Empresa Privada",
    industry: "Marketing y Comercio",
    challenge: "Desarrollar un aplicativo móvil de trade marketing, con su panel web administrativo.",
    service:
      "Backend: PostgreSQL, .NET Core y ORM. Aplicación web administrativa/B2B: Vue.js, JavaScript, SASS y Vuetify. Aplicación móvil: React Native y Wix UI. UX/UI. Scrum Agile.",
    achievements: "Actualización tecnológica. Agilidad. Organización. Gestión de datos.",
    image: "/images/case-trade-marketing-new.webp",
    technologies: ["PostgreSQL", ".NET Core", "VueJS", "React Native", "SASS"],
  },
  {
    id: 8,
    sector: "analitica",
    category: "Gestión Integral de Proyectos IT",
    title: "Sistema de Gestión y Seguimiento de Proyectos",
    client: "Gestión Pública / Empresa Privada",
    industry: "Gestión Empresarial",
    challenge:
      "Diseñar una herramienta de análisis de procesos para mejorar la gestión integral de los proyectos, a partir de una investigación minuciosa de las necesidades de los usuarios.",
    service:
      "Desarrollo tecnológico. Python / JavaScript / PHP. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
    achievements:
      "Soluciones adaptadas a las necesidades del cliente. Agilidad. Información oportuna y actualizada.",
    image: "/images/case-management-new.webp",
    technologies: ["Python", "JavaScript", "PHP", "UX/UI", "Scrum Agile"],
  },
  {
    id: 9,
    sector: "gremios",
    category: "Desarrollo Tecnológico, Academia y Marketing Digital",
    title: "Comunidad USL · Academia",
    client: "Comunidad gremial y obra social · San Luis (Argentina)",
    industry: "Gremios y Obra Social",
    challenge:
      "Unificar en una sola plataforma la academia, el padrón de afiliados, los beneficios y la gestión de la obra social, y acercar los servicios a cada afiliado.",
    service:
      "Sistema web administrativo multi-módulo, app de afiliados, Academia USL con cursos y certificados, landing y marketing digital en redes. UX/UI. Scrum Agile.",
    achievements: "Más de 1.000 inscriptos en la academia en un año. Tableros en tiempo real. Afiliados, beneficios y prestaciones en un solo panel.",
    image: "/images/case-comunidad-usl.webp",
    technologies: ["Plataforma web", "App móvil", "Academia online", "Tableros", "Marketing digital"],
  },
]
