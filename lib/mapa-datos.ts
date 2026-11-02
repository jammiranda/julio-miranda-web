/**
 * Datos del mapa 3D de proyectos de DEVISEBIT.
 * Cada galaxia es un sector; cada nodo, un proyecto o cliente ya publicado en el sitio
 * (casos de éxito y /trabajos). Los textos salen de esas páginas: no se inventan datos.
 */
export type Nodo = {
  id: string
  t: string // título
  d: string // descripción corta
  cliente?: string
  hecho?: string // resultado o logro
  tags?: string[]
  destacado?: boolean
}

export type Galaxia = {
  id: string
  nombre: string
  lema: string
  color: string // hex
  pos: [number, number, number]
  nodos: Nodo[]
}

export const GALAXIAS: Galaxia[] = [
  {
    id: "gobierno",
    nombre: "Gobierno y sector público",
    lema: "Del municipio a la Nación",
    color: "#FF6A63",
    pos: [-14, 3, -4],
    nodos: [
      { id: "tigre", t: "Municipio de Tigre · app Soy Tigre", d: "Desarrollo y soporte de la app municipal, con más de 80.000 vecinos suscriptos: registro de comercios adheridos y alta de las tarjetas Soy Tigre y Soy Tigre Joven.", cliente: "Municipio de Tigre", tags: ["React Native", "Firebase", "Ciberseguridad"], destacado: true },
      { id: "ba-emprende", t: "GCBA · Academia BA Emprende", d: "Oferta académica online para emprendedores, con WordPress y Moodle unificados por SSO y conexión a CRM.", cliente: "Gobierno de la Ciudad de Buenos Aires", tags: ["WordPress", "Moodle", "SSO", "CRM"], destacado: true },
      { id: "cmd", t: "GCBA · CMD y BA Laboratorio Tecnológico", d: "Gestión operativa y tecnológica del Centro Metropolitano de Diseño (14.000 m²) y del laboratorio tecnológico de la Ciudad.", cliente: "Gobierno de la Ciudad de Buenos Aires", destacado: true },
      { id: "ambiente", t: "Ministerio de Ambiente de la Nación", d: "Red Federal de Monitoreo Ambiental y sistemas de trazabilidad de residuos, con coordinación tecnológica nacional.", cliente: "Ministerio de Ambiente de la Nación", hecho: "Implementadas en todas las provincias", destacado: true },
      { id: "catamarca-exporta", t: "Catamarca Exporta", d: "Portal de oferta exportable y herramientas para pymes de la provincia.", cliente: "Gobierno provincial" },
      { id: "expo-productiva", t: "Portal de una expo productiva provincial", d: "Sectores, expositores y agenda del predio ferial.", cliente: "Gobierno provincial" },
      { id: "agencia-desarrollo", t: "Identidad de una agencia de desarrollo", d: "Marca y piezas para una agencia de desarrollo económico.", cliente: "Gobierno provincial" },
    ],
  },
  {
    id: "educacion",
    nombre: "Educación y universidades",
    lema: "Academias, aulas y votos",
    color: "#6AA8FF",
    pos: [-3, 9, -14],
    nodos: [
      { id: "uba-modernizacion", t: "UBA · Modernización y Transformación Digital", d: "Seguimiento de proyectos, tableros en Power BI, expediente electrónico y documentación para la Subsecretaría.", cliente: "Universidad de Buenos Aires", tags: ["Power BI", "UX/UI", "Scrum"], destacado: true },
      { id: "uba-votacion", t: "UBA · votación electrónica del Consejo Superior", d: "Sistema de votación implementado para las sesiones del Consejo Superior.", cliente: "Universidad de Buenos Aires", destacado: true },
      { id: "sodetec", t: "Fundación SODETEC · academia online", d: "Plataforma de cursos, certificados y comunidad para la fundación.", cliente: "Fundación SODETEC" },
      { id: "expo-posgrados", t: "Expo de posgrados de una universidad nacional", d: "Identidad, web y expo interactiva con charlas y becas; plataforma de inscripción y acreditación con data warehouse y Power BI.", cliente: "Universidad nacional" },
      { id: "academias", t: "Academias online", d: "Cursos, certificados y comunidad en campus propios.", hecho: "Más de 1.000 inscriptos en un año" },
    ],
  },
  {
    id: "salud",
    nombre: "Salud",
    lema: "Gestión y tecnología en producción",
    color: "#2BD576",
    pos: [10, 6, -10],
    nodos: [
      { id: "crm-salud", t: "CRM de salud con historia clínica", d: "Pacientes, turnos, prestaciones y facturación en producción.", destacado: true },
      { id: "tablero-internacion", t: "Tablero de internación domiciliaria", d: "El Excel mensual de Drive se convierte en indicadores y alertas.", destacado: true },
      { id: "whatsapp-salud", t: "Asistentes de WhatsApp con IA", d: "Atención 24 horas, derivación a humanos y registro en el CRM.", tags: ["IA", "WhatsApp"] },
      { id: "webs-centros", t: "Webs para centros médicos", d: "Turnero online, especialidades y obras sociales." },
      { id: "siben", t: "SIBEN · venta de entradas para eventos", d: "Sistema de venta de entradas, acreditación y control de acceso para los eventos de la Sociedad Iberoamericana de Neonatología.", cliente: "SIBEN" },
    ],
  },
  {
    id: "gremios",
    nombre: "Gremios y comunidades",
    lema: "Afiliados, beneficios y cursos",
    color: "#FFC857",
    pos: [15, -2, 2],
    nodos: [
      { id: "usl", t: "Comunidad USL · Academia", d: "Academia, padrón de afiliados, beneficios y gestión de la obra social en una sola plataforma, con app de afiliados y marketing digital.", cliente: "Comunidad gremial y obra social · San Luis", hecho: "Más de 1.000 inscriptos en la academia en un año", tags: ["Plataforma web", "App móvil", "Tableros"], destacado: true },
      { id: "obra-social", t: "Obra social sindical · gestión digital", d: "Sistema web administrativo de padrón, aportes y prestaciones, más marketing digital en redes.", cliente: "Obra social sindical · San Luis" },
      { id: "gremio-nacional", t: "Gremio nacional del turismo, la hotelería y la gastronomía", d: "Siete años de trabajo (2014–2021): webs oficiales, Secretaría de Cultura con newsletter, revista y concursos nacionales.", cliente: "Gremio nacional" },
      { id: "iplido", t: "IPLIDO y la Copa nacional", d: "Web, app móvil y boletín del instituto; web y app de un torneo nacional de fútbol con equipos de todo el país.", cliente: "IPLIDO" },
    ],
  },
  {
    id: "plataformas",
    nombre: "Plataformas, datos e IA",
    lema: "Software a medida",
    color: "#B58CFF",
    pos: [2, -8, 8],
    nodos: [
      { id: "panel-admin", t: "Panel de administración a medida", d: "Usuarios, permisos, configuración y reportes para equipos internos." },
      { id: "molinetes", t: "Control de acceso con molinetes", d: "Integración de hardware y software para un club de primera división." },
      { id: "trade-marketing", t: "Aplicativos Trade Marketing y Nacelle", d: "Aplicativo móvil de trade marketing con su panel web administrativo.", tags: ["PostgreSQL", ".NET Core", "Vue.js", "React Native"] },
      { id: "tsgroup", t: "Gestión integral para TSGROUP", d: "Soporte, seguimiento y documentación de los proyectos que forman parte de sus compromisos con terceros.", tags: ["Power BI", "Scrum"] },
      { id: "scraping", t: "Web Data Extraction y Chatbots", d: "Plataformas que recopilan y estructuran automáticamente los datos disponibles en la web y los transforman en información útil.", tags: ["Python", "Web scraping"], destacado: true },
      { id: "gestion-proyectos", t: "Sistema de Gestión y Seguimiento de Proyectos", d: "Herramienta de análisis de procesos para mejorar la gestión integral de los proyectos.", tags: ["Python", "JavaScript", "PHP"] },
    ],
  },
  {
    id: "medios",
    nombre: "Medios, marcas y comercio",
    lema: "Desde los primeros diarios digitales",
    color: "#4FD8E8",
    pos: [-10, -7, 6],
    nodos: [
      { id: "san-luis-diario", t: "San Luis Diario y 105.7 FM", d: "Automatización de noticias y radio con inteligencia artificial.", destacado: true },
      { id: "portales", t: "29 portales de noticias y radios", d: "Diarios, revistas digitales y radios FM online del NOA, desde los primeros diarios digitales de Catamarca.", hecho: "29 portales" },
      { id: "agenda-cultural", t: "Agenda cultural y deportiva", d: "Portal con eventos de música, teatro, deporte y gastronomía." },
      { id: "tienda", t: "Tienda online de instrumentos", d: "Catálogo, promociones y carrito." },
      { id: "bodega", t: "Bodega online", d: "Tienda de vinos y destilados." },
      { id: "club", t: "Web de club de fútbol", d: "Noticias, radio y comunidad de hinchas." },
      { id: "turismo", t: "Turismo receptivo internacional", d: "Web de viajes con paquetes y consultas." },
    ],
  },
]

export const TOTAL_NODOS = GALAXIAS.reduce((n, g) => n + g.nodos.length, 0)
