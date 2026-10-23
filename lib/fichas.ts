/** Fichas comerciales por servicio (una página que el bot y el equipo mandan al cliente; se imprime como PDF). */
export type Ficha = {
  slug: string; servicio: string; titulo: string; bajada: string; dolor: string[]; incluye: string[]; plus: string
  etapas: { n: string; d: string }[]; caso: { t: string; d: string }; ideal: string
}

const PASOS = [
  { n: "Relevamiento", d: "Entendemos tu problema antes de escribir una línea de código." },
  { n: "Propuesta cerrada", d: "Alcance, fecha de entrega y precio fijo, por escrito." },
  { n: "Entregas cada dos semanas", d: "Ves avances reales y los probás con tu equipo." },
  { n: "Soporte y mejora", d: "Acompañamos la operación y sumamos mejoras." },
]
export { PASOS }

export const FICHAS: Ficha[] = [
  {
    slug: "sitio-web", servicio: "Sitio web", titulo: "Una web que trabaja para vos", bajada: "No una tarjeta de presentación: una web rápida, que aparece en Google y convierte visitas en consultas por WhatsApp.",
    dolor: ["Tu web está desactualizada o no aparece en Google", "Las consultas se pierden entre mails y redes", "No sabés cuántos clientes te trae"],
    incluye: ["Diseño a medida con tu marca, pensado primero para el celular", "Textos claros orientados a vender", "Botón de WhatsApp y formularios conectados a tu CRM", "SEO inicial, Google Analytics y píxeles de publicidad", "Panel para que actualices novedades sin depender de nadie"],
    plus: "Cada consulta queda registrada con su origen (Google, Instagram, publicidad): vas a saber qué canal te trae clientes de verdad.",
    etapas: [{ n: "Lanzamiento", d: "Web institucional con lo esencial, publicada y medida" }, { n: "Crecimiento", d: "Blog, landing por servicio y campañas" }],
    caso: { t: "+150 proyectos desde 2009", d: "Webs institucionales, de gremios, universidades y empresas, muchas conectadas a sistemas de gestión." },
    ideal: "Empresas, profesionales e instituciones que quieren dejar de perder consultas.",
  },
  {
    slug: "tienda-online", servicio: "Tienda online", titulo: "Vendé por internet, todos los días, a toda hora", bajada: "Tu catálogo online con carrito, Mercado Pago y envíos, integrado con WhatsApp para no perder ninguna venta.",
    dolor: ["Vendés por WhatsApp a mano y no das abasto", "Pasás precios y fotos uno por uno", "No sabés qué productos se mueven"],
    incluye: ["Catálogo con fotos, variantes y stock", "Pagos con Mercado Pago, tarjetas y transferencia", "Envíos y retiro en local", "Carrito abandonado y avisos por email", "Panel de ventas y reportes"],
    plus: "Lo conectamos con un asistente de WhatsApp que responde dudas de productos y lleva al cliente directo al pago.",
    etapas: [{ n: "Tienda lista", d: "Catálogo, pagos y envíos funcionando" }, { n: "Más ventas", d: "Promociones, cupones, marketing por email y publicidad" }],
    caso: { t: "Venta de entradas para SIBEN", d: "Plataforma de venta online con pagos y control de acceso." },
    ideal: "Comercios, marcas y distribuidores que hoy venden por redes o en local.",
  },
  {
    slug: "sistema-a-medida", servicio: "Sistema web a medida", titulo: "Tu operación, ordenada en un solo sistema", bajada: "Dejamos atrás los Excel sueltos: un sistema hecho sobre tus procesos reales, que tu equipo usa desde la compu o el celular.",
    dolor: ["La información está en planillas, mails y papeles", "Nadie sabe en qué estado está cada trámite", "Cada mes cerrar números lleva días"],
    incluye: ["Relevamiento de procesos y diseño con tu equipo", "Usuarios, roles y auditoría de todo lo que pasa", "Importación de tus Excel actuales", "Tableros e indicadores al día", "Integraciones con lo que ya usás (facturación, WhatsApp, pagos)"],
    plus: "Arrancamos por una primera etapa que resuelve el dolor principal en semanas, y crecemos desde ahí: invertís en lo que ya te está dando resultado.",
    etapas: [{ n: "Etapa 1 (MVP)", d: "El módulo que más te duele, funcionando" }, { n: "Etapas siguientes", d: "Nuevos módulos cada dos semanas" }],
    caso: { t: "Sistema de seguimiento de proyectos para la UBA", d: "Gestión y tableros de la Subsecretaría de Modernización y Transformación Digital." },
    ideal: "Organizaciones que crecieron y necesitan dejar de depender de planillas.",
  },
  {
    slug: "app", servicio: "App iOS y Android", titulo: "Tu institución en el celular de cada cliente", bajada: "Apps nativas para iOS y Android, conectadas a tus sistemas, con avisos al celular y tu marca.",
    dolor: ["Tus clientes o afiliados no se enteran de lo que ofrecés", "Los trámites siguen siendo presenciales", "No tenés un canal directo y propio"],
    incluye: ["Diseño UX/UI y prototipo navegable antes de programar", "App iOS y Android publicada en las tiendas", "Notificaciones push y credencial digital", "Panel web de administración", "Métricas de uso"],
    plus: "Antes de programar ves y probás un prototipo navegable: decidís sobre algo concreto, no sobre una idea.",
    etapas: [{ n: "Primera versión", d: "Lo esencial publicado en las tiendas" }, { n: "Evolución", d: "Nuevas funciones según el uso real" }],
    caso: { t: "App Soy Tigre · Municipio de Tigre", d: "Desarrollo y soporte, registro de comercios adheridos y alta de usuarios de las tarjetas Soy Tigre y Soy Tigre Joven." },
    ideal: "Municipios, gremios, mutuales y empresas con una comunidad grande de usuarios.",
  },
  {
    slug: "asistente-whatsapp-ia", servicio: "Asistente de WhatsApp con IA", titulo: "Tu atención por WhatsApp, las 24 horas", bajada: "Un asistente que entiende lo que te escriben, responde, da turnos y deriva a tu equipo cuando hace falta. Sin sumar personal.",
    dolor: ["Respondés lo mismo cien veces por día", "Los mensajes de la noche y el fin de semana se enfrían", "No sabés cuántas consultas se pierden"],
    incluye: ["WhatsApp Business oficial (API de Meta)", "Respuestas con IA entrenada con tu información", "Turnos, toma de datos y derivación a personas", "Todo queda guardado en un CRM con avisos al celular", "Tablero de consultas atendidas y origen de cada cliente"],
    plus: "El bot aprende: cada vez que tu equipo responde algo nuevo, se lo enseñás con un clic. Es el mismo asistente que te atendió a vos.",
    etapas: [{ n: "En marcha", d: "Configurado, conectado y probado con casos reales" }, { n: "Escala", d: "Instagram, campañas, recordatorios y más integraciones" }],
    caso: { t: "Lo usamos nosotros", d: "El asistente de DEVISEBIT atiende, califica y agenda reuniones solo. Y lo implementamos en salud para atención y turnos." },
    ideal: "Clínicas, comercios, inmobiliarias, instituciones: cualquiera que reciba muchas consultas por WhatsApp.",
  },
  {
    slug: "tableros", servicio: "Tableros e indicadores", titulo: "Decidí con datos, no con intuición", bajada: "Tus números al día en un tablero claro, con alertas y reportes automáticos, aunque hoy estén en Excel.",
    dolor: ["Armar un reporte lleva días", "Cada área tiene su propio número", "Te enterás tarde de los problemas"],
    incluye: ["Relevamiento de los indicadores que importan", "Conexión a tus Excel, sistemas o bases de datos", "Tableros en Power BI o web", "Alertas automáticas y reportes mensuales", "Capacitación al equipo"],
    plus: "Te entregamos el tablero con 3 decisiones que ya podés tomar con tus datos: no solo gráficos, conclusiones.",
    etapas: [{ n: "Tablero principal", d: "Los indicadores clave, al día" }, { n: "Ampliación", d: "Más áreas, alertas y automatizaciones" }],
    caso: { t: "UBA y TSGROUP", d: "Seguimiento, documentación y reportes de gestión con Microsoft Power BI." },
    ideal: "Direcciones y gerencias que necesitan ver el negocio completo en un solo lugar.",
  },
  {
    slug: "academia-online", servicio: "Academia online", titulo: "Tu propia academia, con tu marca", bajada: "Cursos, clases en vivo, inscripciones, pagos y certificados en una plataforma propia.",
    dolor: ["Las capacitaciones se organizan por mail y planillas", "Cobrar y certificar es manual", "No tenés un lugar propio para tu contenido"],
    incluye: ["Plataforma de cursos con tu marca", "Inscripciones y pagos online", "Clases en vivo y grabadas", "Asistencia, evaluaciones y certificados", "Acceso único con tus sistemas (SSO)"],
    plus: "Sumamos un asistente que responde las dudas de los alumnos y recupera inscripciones que quedaron a mitad de camino.",
    etapas: [{ n: "Lanzamiento", d: "Primeros cursos publicados y cobrando" }, { n: "Escala", d: "Más cursos, comunidad y marketing" }],
    caso: { t: "Academia BA Emprende · Gobierno de la Ciudad", d: "Oferta académica para ciudadanos, con acceso único entre WordPress y Moodle y conexión al CRM." },
    ideal: "Gremios, instituciones, consultoras y profesionales que enseñan.",
  },
  {
    slug: "sistema-clinicas", servicio: "Sistema para clínicas e internación domiciliaria", titulo: "Gestión clínica completa, lista para usar", bajada: "Turnos, historia clínica, prestaciones, facturación y tablero, probado en producción.",
    dolor: ["Historias clínicas en papel o dispersas", "Prestaciones que no se facturan", "Coordinación de profesionales a mano"],
    incluye: ["Pacientes, órdenes y agenda de visitas", "Historia clínica electrónica con carga desde fotos y PDF", "Cierre mensual y facturación", "Asistente de WhatsApp para pacientes y familias", "Tablero de gestión y avisos"],
    plus: "No empezamos de cero: adaptamos un sistema que ya funciona en producción. Eso baja el plazo y el riesgo.",
    etapas: [{ n: "Implementación", d: "Configuración, migración de datos y capacitación" }, { n: "Acompañamiento", d: "Soporte y mejoras continuas" }],
    caso: { t: "Internación domiciliaria en San Luis", d: "Sistema en uso diario para pacientes, visitas, historia clínica y cierre mensual." },
    ideal: "Clínicas, centros médicos, prestadores de internación domiciliaria y residencias.",
  },
  {
    slug: "crm-afiliados", servicio: "CRM de afiliados", titulo: "Todos tus afiliados, en un solo lugar", bajada: "Padrón único, aportes, autorizaciones y beneficios, con trazabilidad de punta a punta.",
    dolor: ["Padrones duplicados y desactualizados", "Autorizaciones lentas", "Sin visión de aportes y recaudación"],
    incluye: ["Padrón y grupos familiares", "Aportes y recaudación", "Órdenes y autorizaciones", "Prestadores y beneficios", "App y credencial digital opcional"],
    plus: "Se integra con el asistente de WhatsApp: el afiliado consulta su estado o pide una autorización sin hacer fila.",
    etapas: [{ n: "Padrón y gestión", d: "Migración y operación diaria" }, { n: "Autogestión", d: "App, credencial y WhatsApp" }],
    caso: { t: "Gremios y obras sociales", d: "Plataformas de identificación, academia, app y redes para gremios de San Luis y CABA." },
    ideal: "Gremios, mutuales, obras sociales y prepagas.",
  },
  {
    slug: "credencial-digital", servicio: "App y credencial digital", titulo: "La credencial en el celular, siempre a mano", bajada: "Credencial digital, beneficios, novedades y avisos al celular para cada socio o afiliado.",
    dolor: ["Credenciales plásticas caras y que se pierden", "Los socios no conocen los beneficios", "No hay canal directo con la comunidad"],
    incluye: ["Credencial digital con QR", "Beneficios y comercios adheridos", "Novedades y avisos push", "iOS y Android", "Panel de administración"],
    plus: "El QR de la credencial sirve también para control de acceso en eventos y sedes.",
    etapas: [{ n: "Credencial", d: "App publicada con credencial y beneficios" }, { n: "Comunidad", d: "Eventos, encuestas y acceso con QR" }],
    caso: { t: "App Soy Tigre", d: "Tarjetas digitales Soy Tigre y Soy Tigre Joven con comercios adheridos." },
    ideal: "Gremios, clubes, mutuales, municipios y empresas con programas de beneficios.",
  },
  {
    slug: "votacion-acceso", servicio: "Votación y control de acceso", titulo: "Elecciones sin papel y acceso con QR", bajada: "Votación electrónica auditable y acreditación con QR para asambleas, eventos y sedes.",
    dolor: ["Elecciones lentas y costosas", "Acreditaciones con planillas y filas", "Resultados que tardan días"],
    incluye: ["Padrón de votantes", "Votación electrónica segura", "Acreditación y acceso con QR o molinetes", "Resultados al instante", "Reportes de auditoría"],
    plus: "Simulacro completo antes del día de la votación, con tu equipo, para que nada falle.",
    etapas: [{ n: "Evento", d: "Configuración, simulacro y soporte en vivo" }, { n: "Permanente", d: "Control de acceso diario en sedes" }],
    caso: { t: "Eventos y asambleas", d: "Venta de entradas y control de acceso para SIBEN." },
    ideal: "Gremios, colegios profesionales, clubes y organizadores de eventos.",
  },
  {
    slug: "gestor-documental", servicio: "Gestor documental con firma digital", titulo: "Cero papel, todo firmado y ordenado", bajada: "Expedientes digitales, circuitos de aprobación y firma digital, con búsqueda y permisos.",
    dolor: ["Papeles que se pierden o se demoran", "Firmas que esperan días", "Imposible encontrar un documento viejo"],
    incluye: ["Expedientes y circuitos de aprobación", "Firma digital", "Búsqueda y permisos por área", "Historial de cambios", "Integración con tus sistemas"],
    plus: "La IA lee los documentos que subís y completa los datos sola: vos solo revisás.",
    etapas: [{ n: "Digitalización", d: "Circuitos principales funcionando" }, { n: "Integración", d: "Firma, IA y otros sistemas" }],
    caso: { t: "Gestión pública", d: "Sistemas de gestión y seguimiento de expedientes y proyectos para organismos." },
    ideal: "Organismos, colegios profesionales y empresas con mucha documentación.",
  },
]

export const fichaDe = (slug: string) => FICHAS.find((f) => f.slug === slug)
