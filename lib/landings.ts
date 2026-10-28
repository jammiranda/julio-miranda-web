/** Landings de venta de DEVISEBIT (www.devisebit.com) con su miniatura, para mostrarlas dentro del portal. */
export const LANDINGS = [
  { slug: "webs", titulo: "Desarrollo web a medida con IA", bajada: "Webs diseñadas con IA y revisadas por especialistas. Lista en 72 horas, con dominio a tu nombre y SSL.", img: "/marca/landings/og-webs.jpg" },
  { slug: "sistemas", titulo: "Sistemas de gestión a medida", bajada: "Clientes, turnos, stock, pagos, documentos y tableros, sobre módulos probados.", img: "/marca/landings/og-sistemas.jpg" },
  { slug: "whatsapp", titulo: "Agente de WhatsApp con IA", bajada: "Responde, vende y da turnos las 24 horas, entrenado con la información de tu negocio.", img: "/marca/landings/og-whatsapp.jpg" },
  { slug: "redes", titulo: "Gestión de redes sociales", bajada: "Placas y reels con tu marca, publicados por nosotros en Instagram, Facebook y LinkedIn.", img: "/marca/landings/og-redes.jpg" },
  { slug: "comunidad", titulo: "Comunidad y academia con tu marca", bajada: "Para gremios, asociaciones, colegios y cámaras: academia con certificados, padrón y beneficios.", img: "/marca/landings/og-comunidad.jpg" },
  { slug: "productos", titulo: "Productos listos para implementar", bajada: "Clínicas, CRM de afiliados, tableros, apps, academias y más, probados en clientes reales.", img: "/marca/landings/og-productos.jpg" },
] as const
export const urlLanding = (slug: string) => `https://www.devisebit.com/${slug}`
