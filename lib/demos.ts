/** Demos interactivas públicas (archivos estáticos en /public/demos) y sus videos. */
export type Demo = { slug: string; titulo: string; texto: string; para: string; video?: string }

export const DEMOS: Demo[] = [
  { slug: "whatsapp", titulo: "Asistente de WhatsApp con IA", texto: "Chateá con el asistente como si fueras un cliente y mirá cómo se llena el tablero.", para: "Clínicas, gremios, comercios e inmobiliarias" },
  { slug: "webs", titulo: "Páginas web con IA", texto: "Elegí tu rubro, tu nombre y tu color, y mirá tu web armada al instante.", para: "Profesionales, pymes y comercios" },
  { slug: "sistemas", titulo: "Sistemas a medida", texto: "Un sistema de gestión con módulos que se activan según lo que necesitás.", para: "Empresas y organizaciones con procesos propios" },
  { slug: "padron", titulo: "Sistema de padrón", texto: "Afiliados, aportes al día y credencial digital, del lado del administrador y del afiliado.", para: "Gremios, mutuales, colegios y asociaciones" },
  { slug: "obras-sociales", titulo: "Sistema para obras sociales", texto: "Afiliados, órdenes, autorizaciones, prestadores y el tablero de la conducción.", para: "Obras sociales y prepagas" },
  { slug: "academia", titulo: "Plataforma de cursos", texto: "Inscribite, cursá una lección, rendí el examen y obtené un certificado verificable.", para: "Instituciones, gremios, empresas y capacitadores" },
  { slug: "panel-de-contenido", titulo: "Panel de Contenido", texto: "Redes, web, competencia y publicaciones en un solo tablero.", para: "Marcas, agencias y equipos de comunicación" },
  { slug: "transformacion-digital", titulo: "Autodiagnóstico de madurez digital", texto: "12 preguntas y obtenés tu nivel, un gráfico por área y 3 prioridades.", para: "Pymes, empresas familiares y organismos" },
]

/** Las demos son privadas: se piden con email. Solo el autodiagnóstico es público. */
export const demoUrl = (slug: string, _blanca = false) => (slug === "transformacion-digital" ? "/demos/transformacion-digital.html" : `/demos?d=${slug}#pedir`)
export const demoDe = (slug: string) => DEMOS.find((d) => d.slug === slug)

/** Producto de /productos → demo que lo muestra */
export const DEMO_DE_PRODUCTO: Record<string, string> = {
  clinicas: "sistemas",
  whatsapp: "whatsapp",
  crm: "obras-sociales",
  tableros: "panel-de-contenido",
  app: "padron",
  academias: "academia",
}
