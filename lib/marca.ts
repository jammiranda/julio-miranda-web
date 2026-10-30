/**
 * Datos de DEVISEBIT compartidos por toda la web: equipo, redes y soluciones.
 * Un solo lugar para editar: la home, Servicios, Productos, Nosotros y el pie usan esto.
 */

// ── Redes y canales oficiales (van en todas las páginas) ──
export const REDES = [
  { id: "instagram", nombre: "Instagram", usuario: "@devisebit", href: "https://www.instagram.com/devisebit" },
  { id: "linkedin", nombre: "LinkedIn", usuario: "DEVISEBIT", href: "https://www.linkedin.com/company/devisebit" },
  { id: "youtube", nombre: "YouTube", usuario: "Academia DEVISEBIT", href: "https://www.youtube.com/@devisebitsrl" },
  { id: "blog", nombre: "Blog", usuario: "Novedades", href: "https://www.devisebit.com/novedades" },
] as const

export const WHATSAPP = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20hacer%20una%20consulta"

// ── Equipo: líderes con equipos propios ──
export const EQUIPO = [
  { name: "Julio", role: "Fundador y Director", d: "Más de 15 años liderando proyectos de software, datos y transformación digital en salud, gobierno y educación." },
  { name: "Bárbara", role: "Coordinadora general", d: "Coordina la operación y cada proyecto de punta a punta: alcance, tiempos, pruebas y experiencia de usuario." },
  { name: "Pablo", role: "PM y Líder de Análisis", d: "Releva los procesos de cada cliente, los convierte en requerimientos claros y sigue el plan de trabajo." },
  { name: "Jonathan", role: "Líder de Desarrollo", d: "Conduce el equipo de desarrollo y la arquitectura de las plataformas que ponemos en producción." },
  { name: "Jime", role: "Líder de Diseño y Marketing", d: "Diseña la identidad, las interfaces y la comunicación digital de cada producto." },
  { name: "Nahuel", role: "Líder de QA y Testing", d: "Prueba cada entrega antes de que llegue al cliente: funciones, errores y uso en distintos dispositivos." },
  { name: "Matías", role: "Líder de Soporte Técnico", d: "Acompaña a los clientes en el día a día: consultas, incidencias, mantenimiento y monitoreo de los sistemas." },
] as const
export const EQUIPO_PIE = "Cada líder coordina su propio equipo: análisis, desarrollo, diseño, calidad y soporte trabajan en paralelo en cada proyecto."

// ── Soluciones con precio publicado: cada una tiene su landing (servida en la misma web) ──
export const SOLUCIONES = [
  { id: "webs", tag: "Páginas web", title: "Tu web a medida, lista en días", text: "Diseño único con IA, dominio a tu nombre y WhatsApp conectado.", price: "Desde $199.000", href: "/webs", img: "/images/landings/og-webs.jpg", productos: [] as string[] },
  { id: "whatsapp", tag: "WhatsApp con IA", title: "Un asistente que atiende 24 h", text: "Responde, vende y da turnos por WhatsApp sin sumar personal.", price: "Desde $290.000", href: "/whatsapp", img: "/images/landings/og-whatsapp.jpg", productos: ["whatsapp"] },
  { id: "redes", tag: "Redes y anuncios", title: "Tus redes y tu pauta, resueltas", text: "Reels, placas, historias y campañas en Meta y Google.", price: "Desde $299.000/mes", href: "/redes", img: "/images/landings/og-redes.jpg", productos: [] as string[] },
  { id: "sistemas", tag: "Sistemas", title: "CRM, turnos y tableros", text: "Partimos de módulos probados: menos costo y menos tiempo.", price: "Desde $890.000", href: "/sistemas", img: "/images/landings/og-sistemas.jpg", productos: ["clinicas", "crm", "tableros", "documental"] },
  { id: "asesoria", tag: "Asesoría en tecnología e IA", title: "Un equipo de tecnología, por horas o por mes", text: "Horas sueltas, bolsas o abono mensual con un responsable único y todo registrado en tu portal.", price: "Desde $55.000 la hora", href: "/asesoria", img: "/images/landings/og-asesoria.jpg", productos: [] as string[] },
  { id: "comunidad", tag: "Comunidades", title: "Academia y padrón con tu marca", text: "Para gremios, asociaciones, colegios y cámaras.", price: "Desde $1.490.000", href: "/comunidad", img: "/images/landings/og-comunidad.jpg", productos: ["academias", "app", "votacion"] },
] as const

/** Producto → solución (landing) donde se ve con precio. */
export const SOLUCION_DE_PRODUCTO: Record<string, (typeof SOLUCIONES)[number]["id"]> = {
  clinicas: "sistemas", whatsapp: "whatsapp", crm: "sistemas", tableros: "sistemas",
  app: "comunidad", academias: "comunidad", votacion: "comunidad", documental: "sistemas",
}
export const NOMBRE_PRODUCTO: Record<string, string> = {
  clinicas: "Sistema para clínicas", whatsapp: "Asistente de WhatsApp con IA", crm: "CRM de afiliados y prestadores", tableros: "Tableros de control",
  app: "App y credencial digital", academias: "Academias online", votacion: "Votación y control de acceso", documental: "Gestor documental con firma digital",
}

// ── Asesoría y consultoría en tecnología e IA (landing /asesoria) ──
export const ASESORIA = {
  href: "/asesoria",
  pdf: "/descargas/asesoria-y-consultoria-tecnologia-ia-devisebit.pdf",
}

// ── YouTube: la lista de subidas del canal se actualiza sola con cada video o short nuevo ──
export const YOUTUBE = {
  canal: "https://www.youtube.com/@devisebitsrl",
  suscribirse: "https://www.youtube.com/@devisebitsrl?sub_confirmation=1",
  shorts: "https://www.youtube.com/@devisebitsrl/shorts",
  ultimos: "https://www.youtube-nocookie.com/embed/videoseries?list=UU390RZKG-NZ6xU3tbOGInCA",
}

export const ACADEMIA = {
  url: "https://academia.devisebit.com",
  kit: "https://academia.devisebit.com/productos/kit-ia-pymes",
  guias: "https://academia.devisebit.com/guias",
  cursos: "https://academia.devisebit.com/cursos",
  videos: "https://academia.devisebit.com/videos",
}

// ── Cuentas de Instagram que gestionamos, hoy o en proyectos anteriores (casos de éxito) ──
// Sin `ig`: la cuenta se muestra sin enlace ni @usuario (no se publica el nombre de la cuenta)
export const REDES_GESTIONADAS: readonly { nombre: string; rubro: string; ig: string }[] = [
  { nombre: "Academia BA Emprende", rubro: "Gobierno de la Ciudad de Buenos Aires", ig: "academia_ba" },
  { nombre: "UBA Posgrados", rubro: "Universidad de Buenos Aires", ig: "ubaposgrados" },
  { nombre: "Comunidad USL · Academia", rubro: "Academia online y comunidad", ig: "academia_usl" },
  { nombre: "Gremio gastronómico · San Luis", rubro: "Gremio gastronómico y hotelero", ig: "" },
  { nombre: "Gremio gastronómico · Merlo", rubro: "Delegación Merlo, San Luis", ig: "" },
  { nombre: "IPLIDO", rubro: "Instituto para la Igualdad de Oportunidades", ig: "iplido" },
  { nombre: "Centro Médico Sagrado Corazón", rubro: "Salud · Merlo, San Luis", ig: "centroscorazon" },
  { nombre: "San Patricio Servicios de Salud", rubro: "Salud", ig: "sanpatriciosalud" },
  { nombre: "Fundación SODETEC", rubro: "Educación para el trabajo", ig: "sodetec" },
  { nombre: "RGV Consultora", rubro: "Asesoramiento contable e impositivo", ig: "rgv.consultora" },
  { nombre: "Trasandino Comex", rubro: "Comercio exterior · Catamarca", ig: "trasandinocomex" },
  { nombre: "DEVISEBIT SRL", rubro: "Nuestra marca", ig: "devisebit" },
] as const
