/** Agentes y equipo de la Oficina (se cargan una sola vez, la primera vez que se abre). */
type S = [id: string, nombre: string, piso: number, equipo: string, tipo: "tarea" | "persona", rol: string, horario: string, forma: string, color: string, acc: string, orden: number, trigger?: string, nohace?: string]
const L: S[] = [
  ["jefe-gabinete", "Jefe de oficina (IA)", 5, "Gabinete", "tarea", "Recibe tus órdenes, las reparte entre las áreas y te pide el OK; coordina con la jefa de gabinete", "Siempre disponible (web, WhatsApp y audios)", "star", "#F59312", "antenna", 1, undefined, "No envía, publica ni paga nada sin tu OK."],
  ["control-diario", "Control diario", 5, "Gabinete", "tarea", "Calidad y semáforo del día, llega a las 8:00", "Todos los días · 07:50", "hexagon", "#8F59F9", "glasses", 2, "trig_012dMwGNtPf8mR5dVRuQbpDZ", "Solo lee y avisa. No publica, no envía, no borra."],
  ["revision-ecosistema", "Revisión del ecosistema", 5, "Gabinete", "tarea", "Webs, sistemas, Vercel, Gmail y redes", "Lunes · 07:53", "sphere", "#13B7A2", "glasses", 3, "trig_018EeAg6d7qUGw16TJSLoKij", "Solo revisa; nunca carga claves ni borra."],
  ["ventas", "Ventas", 4, "Comercial", "tarea", "Seguimientos, borradores de Gmail y pipeline", "Lunes a viernes · 06:47", "rsquare", "#1E86FC", "none", 1, "trig_01HN6qcUu4FLUahsghpHjmi4", "Solo borradores. Sin precios. No entra a LinkedIn."],
  ["comercial", "Comercial · licitaciones", 4, "Comercial", "tarea", "Propuestas en borrador desde el Radar", "Martes y jueves · 07:13", "triangle", "#E5484D", "bow", 2, "trig_01EmEGZKzTFgKMbxF9xAssoo", "No presenta nada ni inventa experiencia; los montos los define Julio."],
  ["radar", "Radar de licitaciones", 4, "Comercial", "tarea", "Busca compras públicas de software y comunicación", "Lunes a viernes · 07:04", "cloud", "#14C16F", "antenna", 3, "trig_011Tm3brmtuUpAjZoYQML34R", "No inventa filas: cada una sale de una fuente con su link."],
  ["prospeccion", "Prospección semanal", 4, "Comercial", "tarea", "Borradores de mail y notas de LinkedIn para nuevos contactos", "Lunes · 08:23", "flower", "#F93498", "none", 4, "trig_0168xitoP1Hg4jtqn9Sy747X", "Nunca envía mails ni invitaciones; solo prepara."],
  ["busqueda-laboral", "Búsqueda laboral", 4, "Comercial", "tarea", "Contactos de empresas objetivo en la Bandeja LinkedIn", "Lunes a viernes · 10:17", "drop", "#A06B39", "glasses", 5, "trig_017EFHg5ddm8r4sQLrX5XVwh", "No entra a LinkedIn ni envía nada."],
  ["invitaciones-linkedin", "Invitaciones LinkedIn", 4, "Comercial", "tarea", "Lista mensual para invitar a seguir la página", "Día 1 de cada mes · 09:19", "pill", "#959595", "stem", 6, "trig_01HDb6PkjaXnu1AEsCKEBwtD", "No invita: la lista la usa Julio a mano."],
  ["redes", "Redes diario", 3, "Contenido", "tarea", "Publica en LinkedIn, Facebook e Instagram", "Lunes a viernes · 08:41", "sphere", "#1E86FC", "bow", 1, "trig_01Sonkji2Rg63UCMokSQFGns", "Sin precios; no nombra OSDEPYM, UTHGRA ni Grupo San Gabriel."],
  ["contenido", "Plan de contenido", 3, "Contenido", "tarea", "Plan semanal con las piezas para Jime", "Viernes · 07:36", "rsquare", "#F59312", "glasses", 2, "trig_019VLjss1fnbfteU8vx4m2QS", "No publica ni programa."],
  ["youtube", "YouTube semanal", 3, "Contenido", "tarea", "Programa las publicaciones del canal", "Viernes · 14:47", "triangle", "#E5484D", "none", 3, "trig_0137NRknChMWMCLDzDuQUrMD"],
  ["comentarios", "Comentarios en redes", 3, "Contenido", "tarea", "Participa en conversaciones grandes para dar visibilidad", "Todos los días · 10:07", "cloud", "#8F59F9", "antenna", 4, "trig_013RNXrskAoZ8k2tdEt4AY2d"],
  ["noticias", "Noticias del panel", 3, "Contenido", "tarea", "Carga noticias de IT e IA", "Todos los días · 07:17, 13:17 y 19:17", "flower", "#14C16F", "none", 5, "trig_016UFviHMoPAXyLvdrfpatcr", "Solo notas reales, con su fuente."],
  ["meta-ads", "Meta Ads", 3, "Contenido", "tarea", "Seguimiento de la campaña de seguidores", "Lunes, miércoles y viernes · 11:43", "hexagon", "#FD690F", "glasses", 6, "trig_01RfVBce4va1Yxos4EBMeoeP"],
  ["panel-fb-yt", "Panel Facebook y YouTube", 3, "Contenido", "tarea", "Actualiza las métricas del panel de contenido", "Todos los días · 07:17", "pill", "#13B7A2", "none", 7, "trig_01J4aiVa92NZuH6CMx7T78j6"],
  ["linkedin-panel", "LinkedIn al panel", 3, "Contenido", "tarea", "Exporta las estadísticas del mes", "Día 2 de cada mes · 09:13", "drop", "#1E86FC", "stem", 8, "trig_0197NZC9pXjJbQqdqU5HrQ2G"],
  ["blog", "Nota semanal del blog", 3, "Contenido", "tarea", "Escribe y publica la nota de novedades", "Lunes · 08:48", "star", "#F93498", "bow", 9, "trig_011pjbariW7jtFmbT6GTE7Jd", "Nada de San Patricio; sin precios ni clientes."],
  ["administrativo", "Administrativo", 2, "Administración", "tarea", "Agenda, fichas de reunión, mails y vencimientos", "Lunes a viernes · 06:21", "rsquare", "#13B7A2", "glasses", 1, "trig_017fBzeDuFDBAhaByDYw77tC", "Solo borradores en Gmail. Nunca envía ni borra."],
  ["finanzas", "Finanzas", 2, "Administración", "tarea", "Control de pagos, cobros y alertas", "Lunes a viernes · 06:34", "hexagon", "#14C16F", "none", 2, "trig_01HVxtJ5KE9mZ93Brdt52yNR", "No mueve plata ni modifica planillas."],
  ["documentos", "Documentos mensuales", 2, "Administración", "tarea", "Manual y presentación de la empresa en borrador", "Día 2 de cada mes · 09:41", "cloud", "#959595", "stem", 3, "trig_014Xa61cmHnGvokS8wMi9w2k"],
  ["bot-bit", "Prueba del bot Bit", 1, "Sistemas", "tarea", "Simula clientes exigentes y corrige el prompt", "Viernes · 08:36", "triangle", "#8F59F9", "antenna", 1, "trig_01H6HugNSnyHxJqsRcGyoS8v", "Nunca sube cambios a la rama de producción: abre un pull request."],
  ["integraciones", "Integraciones del panel", 1, "Sistemas", "tarea", "Revisa si ya hay datos nuevos para sumar", "Lunes · 09:13", "sphere", "#F59312", "none", 2, "trig_012NhwdKVfF4s6yWVLtjrtDG", "Solo revisa y avisa."],
  ["academia-contenido", "Academia · Contenido y guías", 6, "Academia", "tarea", "Propone cursos y guías nuevas y revisa que el material esté al día", "Lunes · 14:23", "star", "#8F59F9", "glasses", 1, "trig_012YGeodEfaP8xhLpwVFWQK1", "Solo propone. No modifica la Academia ni publica."],
  ["academia-alumnos", "Academia · Alumnos y seguimiento", 6, "Academia", "tarea", "Semáforo de cursos, avance y alertas para Georgina", "Lunes a viernes · 15:41", "hexagon", "#13B7A2", "antenna", 2, "trig_01GEh17JKsxz3h8nNTwMkwgW", "Solo cifras agregadas. No contacta a nadie ni ve datos personales."],
  ["academia-difusion", "Academia · Difusión", 6, "Academia", "tarea", "Borradores de LinkedIn, Instagram y newsletter", "Martes y jueves · 16:07", "flower", "#F93498", "bow", 3, "trig_01B3sYr7sN77CgBQNHzZbuTr", "Solo borradores; nada sale sin el OK de Georgina o Julio."],
  ["claude-dev", "Claude (desarrollo)", 1, "Sistemas", "persona", "Compañero de todas las áreas: hace lo que requiere desarrollo o código (webs, panel, Academia, integraciones). El responsable del área lo pide, Claude lo ejecuta y el responsable valida", "", "sphere", "#C8231F", "glasses", 0],
  ["barbara", "Bárbara", 5, "Gabinete", "persona", "Jefa de gabinete: coordina la operación, proyectos, demos y testing", "", "flower", "#F93498", "bow", 0],
  ["jime", "Jime", 3, "Contenido", "persona", "Responsable de Contenido y redes: diseño y marketing", "", "star", "#FD690F", "none", 0],
  ["jonathan", "Jonathan", 1, "Sistemas", "persona", "Responsable de Sistemas y desarrollo", "", "hexagon", "#1E86FC", "glasses", 0],
  ["julio", "Julio Miranda", 2, "Administración", "persona", "Dirección general. Responsable único de Administración y finanzas y quien da el OK final", "", "star", "#C8231F", "glasses", 0],
  ["georgina", "Georgina", 6, "Academia", "persona", "Responsable de Academia Educativa", "", "flower", "#8F59F9", "bow", 0],
  ["debora", "Débora", 4, "Comercial", "persona", "Responsable de Comercial: ventas y call center", "", "drop", "#14C16F", "antenna", 0],
]
export const SEMILLA = L.map(([id, nombre, piso, equipo, tipo, rol, horario, forma, color, acc, orden, trigger, nohace]) => ({
  id,
  data: { nombre, piso, equipo, tipo, rol, horario, orden, look: { forma, color, acc }, ...(trigger ? { trigger } : {}), ...(nohace ? { nohace } : {}) },
}))

/** Áreas (pisos): título y responsable. El responsable es una persona; se puede cambiar desde la Oficina. */
export const AREAS: Record<number, { titulo: string; responsable?: string; cargo?: string }> = {
  5: { titulo: "Dirección y gabinete", responsable: "barbara", cargo: "Jefa de gabinete" },
  4: { titulo: "Comercial y licitaciones", responsable: "debora", cargo: "Responsable de Comercial" },
  3: { titulo: "Contenido y redes", responsable: "jime", cargo: "Responsable de Contenido" },
  2: { titulo: "Administración y finanzas", responsable: "julio", cargo: "Responsable (solo Julio)" },
  6: { titulo: "Academia Educativa", responsable: "georgina", cargo: "Responsable de Academia" },
  1: { titulo: "Sistemas y desarrollo", responsable: "jonathan", cargo: "Responsable de Sistemas" },
}
