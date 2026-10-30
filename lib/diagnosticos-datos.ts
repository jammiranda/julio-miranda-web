/**
 * Autodiagnósticos de DEVISEBIT: escalera de 3 niveles gratis.
 *   1 · Madurez digital (12 preguntas, 6 dimensiones)
 *   2 · Procesos (15 preguntas: tareas manuales, planillas, tiempos y herramientas por área)
 *   3 · Automatización e IA (12 preguntas: canales, volumen, datos, equipo y consentimiento)
 *
 * Este archivo es la ÚNICA fuente de las preguntas, los textos y el cálculo de puntajes.
 * COPIA EXACTA de lib/diagnosticos.ts de la web (repo devisebit-web, julio-miranda-web).
 * El sistema la usa para recalcular los puntajes del lado del servidor (no se confía en el navegador).
 * No la edites acá: editá la de la web, cambiá VERSION y copiala a este archivo.
 *
 * Reglas: sin precios, sin promedios de mercado ni comparaciones inventadas.
 */

export const VERSION = "2026-10-29"
const W = "https://www.devisebit.com"

// ── Servicios y productos de DEVISEBIT a los que apuntan las recomendaciones ──
export type ServicioId = "webs" | "whatsapp" | "sistemas" | "comunidad" | "redes" | "consultoria" | "soporte" | "ia" | "tableros" | "demos"
export const SERVICIOS: Record<ServicioId, { nombre: string; href: string }> = {
  webs: { nombre: "Páginas web", href: `${W}/webs` },
  whatsapp: { nombre: "Asistente de WhatsApp con IA", href: `${W}/whatsapp` },
  sistemas: { nombre: "Sistemas a medida", href: `${W}/sistemas` },
  comunidad: { nombre: "Plataformas para comunidades", href: `${W}/comunidad` },
  redes: { nombre: "Marketing digital: redes y anuncios", href: `${W}/redes` },
  consultoria: { nombre: "Consultoría de transformación digital", href: `${W}/transformacion-digital` },
  soporte: { nombre: "Soporte y ciberseguridad", href: `${W}/servicios#soporte` },
  ia: { nombre: "Inteligencia artificial aplicada", href: `${W}/servicios#ia` },
  tableros: { nombre: "Tableros e inteligencia de negocio", href: `${W}/servicios#tableros` },
  demos: { nombre: "Demos de nuestros productos", href: `${W}/demos` },
}

// ── Rubros: los valores coinciden con los sectores del CRM ──
export const RUBROS = [
  { v: "Salud", n: "Salud (clínicas, consultorios, obras sociales, prestadores)" },
  { v: "Gremial", n: "Gremio, mutual, colegio profesional o asociación" },
  { v: "Educación", n: "Educación (escuelas, institutos, universidades)" },
  { v: "Gobierno", n: "Gobierno u organismo público" },
  { v: "Empresa", n: "Empresa, pyme o comercio" },
  { v: "Tecnología", n: "Tecnología" },
  { v: "Finanzas", n: "Finanzas, seguros o estudio contable" },
  { v: "Medios", n: "Medios y comunicación" },
  { v: "Otro", n: "Otro" },
] as const
export const rubroValido = (r: unknown) => (RUBROS.some((x) => x.v === r) ? (r as string) : null)

// ── Tipos de pregunta ──
export type Rec = { titulo: string; porque: string; paso: string; servicio: ServicioId }
export type Escala = { id: string; tipo: "escala"; dim: string; texto: string; ayuda?: string; opciones: string[]; noAplica?: string; valores?: number[]; rec?: Rec }
export type Horas = { id: string; tipo: "horas"; dim: string; texto: string; ayuda?: string; de: string }
export type Opcion = { id: string; tipo: "opcion"; dim: string; texto: string; ayuda?: string; opciones: string[] }
export type Pregunta = Escala | Horas | Opcion

/** Respuestas: un número por pregunta. Escala y opción: 1..n (0 = no aplica). Horas: 0..2000. */
export type Respuestas = number[]

export type Nivel = 1 | 2 | 3
export const NIVELES: { n: Nivel; slug: string; ruta: string; titulo: string; corto: string; bajada: string; minutos: number }[] = [
  { n: 1, slug: "madurez", ruta: "/diagnostico", titulo: "Madurez digital", corto: "Nivel 1", bajada: "Dónde está tu organización en procesos, datos, atención, equipo, tecnología y seguridad.", minutos: 5 },
  { n: 2, slug: "procesos", ruta: "/diagnostico/procesos", titulo: "Procesos", corto: "Nivel 2", bajada: "Qué tareas manuales te consumen más horas y qué conviene digitalizar primero.", minutos: 7 },
  { n: 3, slug: "automatizacion", ruta: "/diagnostico/automatizacion", titulo: "Automatización e IA", corto: "Nivel 3", bajada: "Qué automatizar primero, qué hace falta antes y tu hoja de ruta de 90 días.", minutos: 6 },
]
export const nivelInfo = (n: number) => NIVELES.find((x) => x.n === n) ?? NIVELES[0]
export const urlNivel = (n: number, token?: string | null) => `${W}${nivelInfo(n).ruta}${token ? `?t=${encodeURIComponent(token)}` : ""}`

const to100 = (v: number, max = 4) => Math.max(0, Math.min(100, Math.round(((v - 1) / (max - 1)) * 100)))
const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** Etiqueta según el puntaje de 0 a 100 (mismos cortes que el autodiagnóstico original: 1,75 · 2,5 · 3,25 de 4). */
export function etiqueta(nivel: Nivel, puntaje: number) {
  const nombres: Record<Nivel, string[]> = {
    1: ["Inicial", "En camino", "Avanzado", "Líder"],
    2: ["Procesos manuales", "En transición", "Mayormente digitales", "Digitales e integrados"],
    3: ["Por preparar", "Con bases", "Preparada", "Lista para escalar"],
  }
  const i = puntaje < 25 ? 0 : puntaje < 50 ? 1 : puntaje < 75 ? 2 : 3
  return { nombre: nombres[nivel][i], indice: i, todos: nombres[nivel] }
}

// ═════════════════════ NIVEL 1 · MADUREZ DIGITAL ═════════════════════
export const DIMS1 = [
  { k: "procesos", n: "Procesos" },
  { k: "datos", n: "Datos" },
  { k: "atencion", n: "Atención al cliente" },
  { k: "equipo", n: "Equipo y cultura" },
  { k: "tecnologia", n: "Tecnología" },
  { k: "seguridad", n: "Seguridad" },
] as const
/** Desempate: con el mismo puntaje, primero lo que más riesgo o impacto tiene. */
const PRIO1: Record<string, number> = { seguridad: 0, datos: 1, atencion: 2, procesos: 3, tecnologia: 4, equipo: 5 }

export const PREGUNTAS1: Escala[] = [
  { id: "registro", tipo: "escala", dim: "procesos", texto: "¿Cómo registran las tareas y los pedidos del día a día?", opciones: ["En papel o de memoria", "En planillas sueltas, cada uno la suya", "Con un sistema en algunas áreas", "Con un sistema integrado en toda la organización"],
    rec: { titulo: "Pasar los registros a un sistema único", porque: "Cuando cada área anota a su manera se pierden pedidos y nadie ve el panorama completo.", paso: "Elegí el proceso que más se repite y llevalo a una sola planilla compartida o a un sistema simple.", servicio: "sistemas" } },
  { id: "automatizadas", tipo: "escala", dim: "procesos", texto: "¿Cuántas tareas repetitivas tienen automatizadas?", opciones: ["Ninguna", "Algunas, con fórmulas en planillas", "Varias, con herramientas específicas", "La mayoría, con flujos y alertas automáticas"],
    rec: { titulo: "Automatizar las tareas que se repiten", porque: "Recordatorios, confirmaciones y reportes manuales consumen horas que el equipo podría usar mejor.", paso: "Listá 5 tareas que se hacen igual todas las semanas y automatizá primero la más simple.", servicio: "sistemas" } },
  { id: "decisiones", tipo: "escala", dim: "datos", texto: "¿Cómo toman las decisiones importantes?", opciones: ["Por intuición o experiencia", "Con informes que alguien arma a mano", "Con un tablero que se actualiza cada tanto", "Con un tablero en tiempo real que todos consultan"],
    rec: { titulo: "Tener un tablero con 5 números clave", porque: "Decidir sin datos actualizados es manejar mirando por el espejo retrovisor.", paso: "Definí los 5 indicadores que más importan y armá un tablero que se actualice solo, aunque sea una vez por semana.", servicio: "tableros" } },
  { id: "base", tipo: "escala", dim: "datos", texto: "¿Dónde está la información de sus clientes, pacientes, socios o alumnos?", opciones: ["Dispersa en papeles, mails y celulares", "En planillas que maneja cada persona", "En una base única, pero incompleta", "En una base única, limpia y actualizada"],
    rec: { titulo: "Unificar la base de contactos", porque: "Sin una base única no podés seguir a cada persona ni medir cómo evoluciona la relación.", paso: "Juntá todas las listas en una sola, sacá los duplicados y definí quién la mantiene al día.", servicio: "sistemas" } },
  { id: "canales", tipo: "escala", dim: "atencion", texto: "¿Por qué canales los contactan y cómo se ordenan?", opciones: ["Teléfono y en persona", "WhatsApp desde celulares personales", "Canales centralizados en un número o casilla", "Todos los canales en un solo lugar, con historial"],
    rec: { titulo: "Centralizar los canales de contacto", porque: "Si las consultas llegan a celulares personales, se pierden cuando alguien falta o se va.", paso: "Pasá a un único número de WhatsApp de la organización, compartido por el equipo.", servicio: "whatsapp" } },
  { id: "respuesta", tipo: "escala", dim: "atencion", texto: "¿Cuánto tardan en responder una consulta?", opciones: ["Más de un día", "En el día", "En pocas horas", "Al instante, con asistente y derivación a una persona"],
    rec: { titulo: "Responder más rápido con un asistente", porque: "Quien consulta y no recibe respuesta en el momento suele preguntar en otro lado.", paso: "Escribí las 10 preguntas más frecuentes con su respuesta: es la base de un asistente automático.", servicio: "whatsapp" } },
  { id: "capacitacion", tipo: "escala", dim: "equipo", texto: "¿Cómo se capacita el equipo en herramientas digitales?", opciones: ["No se capacita", "Cada uno aprende por su cuenta", "Con capacitaciones ocasionales", "Con un plan de formación continuo"],
    rec: { titulo: "Armar un plan de formación corto", porque: "Las herramientas rinden solo si el equipo sabe usarlas y se siente seguro.", paso: "Programá una capacitación de una hora por mes sobre la herramienta que más usan.", servicio: "consultoria" } },
  { id: "cambios", tipo: "escala", dim: "equipo", texto: "¿Cómo recibe el equipo los cambios tecnológicos?", opciones: ["Con resistencia", "Con dudas y algo de desconfianza", "Con interés", "Proponen mejoras por iniciativa propia"],
    rec: { titulo: "Sumar al equipo al cambio desde el inicio", porque: "Los cambios impuestos generan resistencia; los compartidos generan aliados.", paso: "Elegí 2 referentes digitales por área y sumalos a las decisiones de cada mejora.", servicio: "consultoria" } },
  { id: "documentos", tipo: "escala", dim: "tecnologia", texto: "¿Cómo trabajan con documentos y archivos?", opciones: ["En papel o en pendrives", "Por mail, con adjuntos", "En la nube, en algunas áreas", "En la nube, con permisos y edición compartida"],
    rec: { titulo: "Llevar los documentos a la nube", porque: "Los adjuntos por mail generan versiones duplicadas y archivos imposibles de encontrar.", paso: "Creá una carpeta compartida por área, con una estructura simple y acordada.", servicio: "sistemas" } },
  { id: "ia", tipo: "escala", dim: "tecnologia", texto: "¿Usan inteligencia artificial en el trabajo?", opciones: ["No", "Algunos por su cuenta, sin reglas", "En tareas puntuales, con reglas claras", "Integrada en procesos, con criterios y control"],
    rec: { titulo: "Usar IA con reglas claras", porque: "La IA ahorra tiempo en textos, resúmenes y análisis, pero sin reglas pone en riesgo datos sensibles.", paso: "Escribí una política de una página: qué se puede usar, para qué y qué datos nunca se comparten.", servicio: "consultoria" } },
  { id: "accesos", tipo: "escala", dim: "seguridad", texto: "¿Cómo manejan las contraseñas y los accesos?", opciones: ["Compartidas o anotadas en papel", "Cada uno las suyas, sin reglas", "Con reglas y doble verificación en algunas cuentas", "Con gestor de contraseñas y doble verificación en todo"],
    rec: { titulo: "Proteger los accesos", porque: "La mayoría de los incidentes empieza con una contraseña débil o compartida.", paso: "Activá la verificación en dos pasos en el correo y en las cuentas bancarias esta misma semana.", servicio: "soporte" } },
  { id: "copias", tipo: "escala", dim: "seguridad", texto: "¿Tienen copias de seguridad de su información?", opciones: ["No", "A veces, de forma manual", "Automáticas, pero nunca probamos restaurarlas", "Automáticas y probadas regularmente"],
    rec: { titulo: "Tener copias de seguridad probadas", porque: "Una falla, un robo o un virus pueden borrar años de trabajo en minutos.", paso: "Configurá una copia automática diaria y probá restaurar un archivo una vez por mes.", servicio: "soporte" } },
]

export type Resultado1 = {
  nivel: 1; puntaje: number; etiqueta: string
  dimensiones: { k: string; n: string; puntaje: number }[]
  acciones: (Rec & { pregunta: string; respuesta: string; servicioNombre: string; servicioHref: string })[]
}

export function calcular1(r: Respuestas): Resultado1 {
  const dimensiones = DIMS1.map((d) => ({ k: d.k, n: d.n, puntaje: to100(prom(PREGUNTAS1.map((q, i) => (q.dim === d.k ? r[i] : null)).filter((x): x is number => x != null))) }))
  const puntaje = to100(prom(r.slice(0, PREGUNTAS1.length)))
  const acciones = PREGUNTAS1.map((q, i) => ({ q, i, v: r[i] }))
    .filter((x) => x.v < 4)
    .sort((a, b) => a.v - b.v || PRIO1[a.q.dim] - PRIO1[b.q.dim] || a.i - b.i)
    .slice(0, 3)
    .map(({ q, v }) => ({ ...q.rec!, pregunta: q.texto, respuesta: q.opciones[v - 1], servicioNombre: SERVICIOS[q.rec!.servicio].nombre, servicioHref: SERVICIOS[q.rec!.servicio].href }))
  return { nivel: 1, puntaje, etiqueta: etiqueta(1, puntaje).nombre, dimensiones, acciones }
}

// ═════════════════════ NIVEL 2 · PROCESOS ═════════════════════
export type ModuloId = "crm" | "turnos" | "documental" | "padron" | "tableros" | "clinicas" | "obras"
export const MODULOS: Record<ModuloId, { nombre: string; detalle: string; servicio: ServicioId }> = {
  crm: { nombre: "CRM", detalle: "Consultas, oportunidades y seguimiento de cada cliente, conectado a WhatsApp y correo.", servicio: "sistemas" },
  turnos: { nombre: "Turnos y agenda", detalle: "Agenda por profesional o sala, turnos online y por WhatsApp, y recordatorios automáticos.", servicio: "sistemas" },
  documental: { nombre: "Gestión documental con firma digital", detalle: "Documentos, legajos y contratos ordenados, con permisos, vencimientos y firma digital.", servicio: "sistemas" },
  padron: { nombre: "Padrón", detalle: "Socios o afiliados, cuotas al día y credencial digital.", servicio: "comunidad" },
  tableros: { nombre: "Tableros de control", detalle: "Indicadores al día, alertas y reportes que se arman solos.", servicio: "tableros" },
  clinicas: { nombre: "Sistema para clínicas", detalle: "Pacientes, turnos, prestaciones e historia de cada atención en un solo sistema.", servicio: "sistemas" },
  obras: { nombre: "Sistema para obras sociales", detalle: "Afiliados, órdenes, autorizaciones, prestadores y el tablero de la conducción.", servicio: "sistemas" },
}

export const OPERACIONES = [
  "Atendemos pacientes o clientes con turnos (consultorio, clínica, centro, estudio)",
  "Administramos afiliados o socios (obra social, mutual, gremio, colegio)",
  "Vendemos productos o servicios",
  "Gestionamos trámites, expedientes o pedidos",
]

export const PROCESOS: { id: string; area: string; nombre: string; modulo: ModuloId | "segun-operacion" | "segun-rubro" }[] = [
  { id: "turnos", area: "Atención", nombre: "Turnos, reservas y agenda", modulo: "turnos" },
  { id: "seguimiento", area: "Ventas", nombre: "Seguimiento de consultas, presupuestos y clientes", modulo: "crm" },
  { id: "documentos", area: "Administración", nombre: "Documentos, contratos y firmas", modulo: "documental" },
  { id: "reportes", area: "Administración", nombre: "Informes para la dirección", modulo: "tableros" },
  { id: "socios", area: "Administración", nombre: "Socios o afiliados y sus cuotas", modulo: "segun-rubro" },
  { id: "operacion", area: "Operación", nombre: "Registro de la operación diaria", modulo: "segun-operacion" },
]

const AYUDA_HORAS = "Una estimación tuya alcanza: sumá las horas de todas las personas que lo hacen."
export const PREGUNTAS2: Pregunta[] = [
  { id: "tipo", tipo: "opcion", dim: "general", texto: "¿Cuál describe mejor la tarea principal de tu organización?", opciones: OPERACIONES },
  { id: "turnos", tipo: "escala", dim: "turnos", texto: "Atención: ¿cómo dan, confirman y reprograman los turnos o reservas?", opciones: ["En papel o por teléfono, sin agenda compartida", "En una planilla o agenda compartida", "Con un sistema, pero las confirmaciones son a mano", "Online, con confirmación y recordatorio automáticos"], noAplica: "No damos turnos ni reservas" },
  { id: "turnos-h", tipo: "horas", dim: "turnos", de: "turnos", texto: "¿Cuántas horas por mes le dedica el equipo a dar, confirmar y reprogramar turnos?", ayuda: AYUDA_HORAS },
  { id: "seguimiento", tipo: "escala", dim: "seguimiento", texto: "Ventas: ¿cómo siguen las consultas, los presupuestos y a cada cliente?", opciones: ["No hay seguimiento: depende de la memoria de cada uno", "Cada vendedor en su planilla o su celular", "En una planilla compartida", "En un CRM con recordatorios y estados"], noAplica: "No hacemos ventas ni presupuestos" },
  { id: "seguimiento-h", tipo: "horas", dim: "seguimiento", de: "seguimiento", texto: "¿Cuántas horas por mes llevan responder consultas repetidas, armar presupuestos y hacer el seguimiento a mano?", ayuda: AYUDA_HORAS },
  { id: "documentos", tipo: "escala", dim: "documentos", texto: "Administración: ¿cómo manejan documentos, contratos, legajos y firmas?", opciones: ["En papel, con firma en persona", "Escaneados y por mail, firmando en papel", "En carpetas en la nube, firmando en papel", "En un sistema documental con firma digital"], noAplica: "Casi no manejamos documentos" },
  { id: "documentos-h", tipo: "horas", dim: "documentos", de: "documentos", texto: "¿Cuántas horas por mes llevan buscar, imprimir, firmar, escanear y archivar documentos?", ayuda: AYUDA_HORAS },
  { id: "reportes", tipo: "escala", dim: "reportes", texto: "Administración: ¿cómo arman los informes para la dirección o el directorio?", opciones: ["No armamos informes", "A mano, juntando datos de varios lados", "Con planillas que hay que actualizar a mano", "Salen solos de un tablero"], noAplica: "No necesitamos informes" },
  { id: "reportes-h", tipo: "horas", dim: "reportes", de: "reportes", texto: "¿Cuántas horas por mes llevan juntar datos y armar esos informes?", ayuda: AYUDA_HORAS },
  { id: "socios", tipo: "escala", dim: "socios", texto: "Administración: ¿cómo llevan el padrón de socios o afiliados y sus cuotas?", opciones: ["En papel o en un cuaderno", "En planillas que se cruzan a mano con los pagos", "En un sistema, pero sin credencial ni autogestión", "En un sistema con cuotas al día, credencial digital y autogestión"], noAplica: "No tenemos socios ni afiliados" },
  { id: "socios-h", tipo: "horas", dim: "socios", de: "socios", texto: "¿Cuántas horas por mes llevan actualizar el padrón, controlar cuotas y responder consultas de socios?", ayuda: AYUDA_HORAS },
  { id: "operacion", tipo: "escala", dim: "operacion", texto: "Operación: ¿cómo registran el trabajo diario (atenciones, prestaciones, pedidos o trámites)?", opciones: ["En papel", "En planillas, cargando el mismo dato más de una vez", "En un sistema que no se conecta con el resto", "En un sistema integrado con turnos, facturación y reportes"], noAplica: "No aplica a mi organización" },
  { id: "operacion-h", tipo: "horas", dim: "operacion", de: "operacion", texto: "¿Cuántas horas por mes lleva cargar, controlar y corregir ese registro diario?", ayuda: AYUDA_HORAS },
  { id: "planillas", tipo: "escala", dim: "herramientas", texto: "Herramientas: ¿cuántas planillas o archivos sueltos usan para el día a día?", opciones: ["Más de 10, y cada uno tiene las suyas", "Entre 5 y 10", "Pocas, compartidas", "Casi ninguna: todo está en sistemas"] },
  { id: "doble", tipo: "escala", dim: "herramientas", texto: "Herramientas: ¿cuántas veces se carga el mismo dato (por ejemplo, el nombre de un cliente o un pago)?", opciones: ["Tres o más veces, en lugares distintos", "Dos veces", "Una vez, pero hay que pasarlo a mano a otro sistema", "Una sola vez: los sistemas se conectan entre sí"] },
]

export function moduloDe(procesoId: string, tipoOperacion: number, rubro: string | null): ModuloId {
  const p = PROCESOS.find((x) => x.id === procesoId)!
  if (p.modulo === "segun-rubro") return rubro === "Salud" ? "obras" : "padron"
  if (p.modulo === "segun-operacion") return tipoOperacion === 1 ? (rubro === "Salud" ? "clinicas" : "turnos") : tipoOperacion === 2 ? (rubro === "Salud" ? "obras" : "padron") : tipoOperacion === 3 ? "crm" : "documental"
  return p.modulo
}

export type Proceso2 = { id: string; area: string; nombre: string; respuesta: string; madurez: number; horas: number; modulo: ModuloId; moduloNombre: string; moduloDetalle: string; servicioNombre: string; servicioHref: string }
export type Resultado2 = { nivel: 2; puntaje: number; etiqueta: string; horasTotales: number; prioridades: Proceso2[]; otros: Proceso2[]; operacion: string }

export function calcular2(r: Respuestas, rubro: string | null): Resultado2 {
  const val = (id: string) => r[PREGUNTAS2.findIndex((q) => q.id === id)] ?? 0
  const tipo = val("tipo")
  const procesos: Proceso2[] = []
  for (const p of PROCESOS) {
    const q = PREGUNTAS2.find((x) => x.id === p.id) as Escala
    const v = val(p.id)
    if (!v) continue // no aplica
    const modulo = moduloDe(p.id, tipo, rubro)
    procesos.push({ id: p.id, area: p.area, nombre: p.nombre, respuesta: q.opciones[v - 1], madurez: v, horas: Math.max(0, Math.round(val(`${p.id}-h`))), modulo, moduloNombre: MODULOS[modulo].nombre, moduloDetalle: MODULOS[modulo].detalle, servicioNombre: SERVICIOS[MODULOS[modulo].servicio].nombre, servicioHref: SERVICIOS[MODULOS[modulo].servicio].href })
  }
  const escalas = PREGUNTAS2.filter((q) => q.tipo === "escala").map((q) => val(q.id)).filter((v) => v > 0)
  const puntaje = to100(prom(escalas))
  // Conviene digitalizar primero lo que más horas lleva y está menos digitalizado. Sin horas, pesa solo la brecha.
  const peso = (p: Proceso2) => ((4 - p.madurez) / 3) * (p.horas > 0 ? p.horas : 0.5)
  const candidatos = procesos.filter((p) => p.madurez < 4).sort((a, b) => peso(b) - peso(a) || a.madurez - b.madurez)
  return {
    nivel: 2, puntaje, etiqueta: etiqueta(2, puntaje).nombre,
    horasTotales: procesos.reduce((a, p) => a + p.horas, 0),
    prioridades: candidatos.slice(0, 3),
    otros: procesos.filter((p) => !candidatos.slice(0, 3).includes(p)),
    operacion: OPERACIONES[tipo - 1] ?? "",
  }
}

// ═════════════════════ NIVEL 3 · AUTOMATIZACIÓN E IA ═════════════════════
export const CANALES = ["WhatsApp", "Teléfono", "Email", "Redes sociales", "En persona"]
export const PREGUNTAS3: Pregunta[] = [
  { id: "canal", tipo: "opcion", dim: "canales", texto: "¿Por dónde les llegan más consultas?", opciones: CANALES },
  { id: "volumen", tipo: "escala", dim: "consultas", texto: "¿Cuántas consultas reciben por semana, aproximadamente, sumando todos los canales?", opciones: ["Menos de 20", "Entre 20 y 100", "Entre 100 y 500", "Más de 500"] },
  { id: "repetidas", tipo: "escala", dim: "consultas", texto: "¿Qué parte de esas consultas son preguntas repetidas (horarios, requisitos, precios, turnos, estado de un trámite)?", opciones: ["Poca", "Alrededor de un cuarto", "Cerca de la mitad", "La mayoría"] },
  { id: "fuera", tipo: "escala", dim: "consultas", texto: "¿Les escriben fuera del horario de atención?", opciones: ["Casi nunca", "A veces", "Seguido", "Todos los días"] },
  { id: "numero", tipo: "escala", dim: "canales", texto: "¿Tienen un número de WhatsApp de la organización?", opciones: ["No, cada uno atiende desde su celular", "Sí, un WhatsApp común en un celular", "Sí, WhatsApp Business en un celular", "Sí, WhatsApp Business conectado a una plataforma"] },
  { id: "respuestas", tipo: "escala", dim: "datos", texto: "¿Tienen escritas las respuestas a las preguntas frecuentes?", opciones: ["No", "Están en la cabeza de alguien del equipo", "Algunas, en un documento", "Sí, completas y actualizadas"] },
  { id: "informes", tipo: "escala", dim: "datos", texto: "¿Cuánto tiempo les lleva armar los informes de cada semana o mes?", opciones: ["Salen solos", "No armamos informes", "Unas horas", "Días"], valores: [1, 2, 3, 4] },
  { id: "datos", tipo: "escala", dim: "datos", texto: "¿Dónde están los datos con los que deciden (ventas, turnos, prestaciones, cobros)?", opciones: ["En papel", "En planillas sueltas", "En un sistema que permite exportarlos", "En un sistema con acceso directo a los datos"] },
  { id: "externa", tipo: "escala", dim: "datos", texto: "¿Juntan a mano información de webs o fuentes públicas (precios, licitaciones, boletines oficiales, normativas)?", opciones: ["No lo necesitamos", "A veces", "Todas las semanas", "Todos los días"] },
  { id: "base", tipo: "escala", dim: "consentimiento", texto: "¿Tienen una base de contactos con email (clientes, pacientes, socios, alumnos)?", opciones: ["No tenemos", "Sí, la usamos seguido para comunicar", "Sí, pero desordenada", "Sí, ordenada pero casi no la usamos"], valores: [1, 2, 3, 4] },
  { id: "consentimiento", tipo: "escala", dim: "consentimiento", texto: "¿Esas personas aceptaron recibir comunicaciones de ustedes?", ayuda: "La Ley 25.326 de protección de datos personales pide consentimiento y la posibilidad de darse de baja.", opciones: ["No lo sabemos", "Algunas", "La mayoría, pero no lo tenemos registrado", "Sí, con registro de cuándo y cómo lo aceptaron"] },
  { id: "equipo", tipo: "escala", dim: "equipo", texto: "¿Quién se ocuparía de la automatización del lado de ustedes?", opciones: ["Nadie tiene tiempo", "Alguien, a ratos", "Una persona con horas asignadas", "Un equipo con un responsable"] },
]

export type AutoId = "whatsapp" | "reportes" | "extraccion" | "email"
export const AUTOMATIZACIONES: { id: AutoId; nombre: string; que: string; indicador: string; servicio: ServicioId; necesidad: string[]; preparacion: string[] }[] = [
  { id: "whatsapp", nombre: "Asistente de WhatsApp con IA", que: "Responde las preguntas frecuentes, da turnos y deriva a una persona cuando hace falta, las 24 horas.", indicador: "el tiempo de respuesta y las consultas resueltas sin intervención", servicio: "whatsapp", necesidad: ["volumen", "repetidas", "fuera"], preparacion: ["numero", "respuestas"] },
  { id: "reportes", nombre: "Reportes automáticos", que: "Los informes que hoy arman a mano se generan solos y llegan por email o a un tablero.", indicador: "las horas por mes que lleva armar informes", servicio: "tableros", necesidad: ["informes"], preparacion: ["datos"] },
  { id: "extraccion", nombre: "Extracción de datos públicos o autorizados", que: "Un proceso que junta solo la información de webs y fuentes públicas o autorizadas, y avisa cuando hay novedades.", indicador: "las horas por semana que se van en buscar información", servicio: "ia", necesidad: ["externa"], preparacion: ["equipo"] },
  { id: "email", nombre: "Email marketing", que: "Campañas y seguimientos automáticos a tu base de contactos, solo a quienes aceptaron recibirlos.", indicador: "las aperturas, los clics y las respuestas", servicio: "redes", necesidad: ["base"], preparacion: ["consentimiento", "base"] },
]

const PRERREQ: Record<string, string> = {
  numero: "Tener un número de WhatsApp de la organización (no celulares personales), con WhatsApp Business.",
  respuestas: "Escribir las preguntas más frecuentes con su respuesta: es lo que va a usar el asistente.",
  datos: "Llevar los datos a un sistema o a planillas ordenadas que se puedan leer de forma automática.",
  consentimiento: "Registrar el consentimiento de cada contacto y ofrecer la baja en cada envío (Ley 25.326).",
  base: "Armar una base única de contactos con email.",
  equipo: "Definir una persona responsable del lado de ustedes, con algunas horas por semana.",
}

export type Auto3 = { id: AutoId; nombre: string; que: string; necesidad: number; preparacion: number; servicioNombre: string; servicioHref: string }
export type Resultado3 = { nivel: 3; puntaje: number; etiqueta: string; canal: string; ranking: Auto3[]; primero: Auto3; antes: string[]; hojaDeRuta: { etapa: string; dias: string; tareas: string[] }[] }

export function calcular3(r: Respuestas): Resultado3 {
  const val = (id: string) => {
    const i = PREGUNTAS3.findIndex((q) => q.id === id)
    const q = PREGUNTAS3[i] as Escala
    const v = r[i] ?? 0
    return q.tipo === "escala" && q.valores ? q.valores[v - 1] ?? 0 : v
  }
  const canal = CANALES[val("canal") - 1] ?? ""
  const ranking: Auto3[] = AUTOMATIZACIONES.map((a) => {
    let nec = prom(a.necesidad.map(val))
    if (a.id === "whatsapp" && canal === "WhatsApp") nec += 0.5 // para ordenar; lo que se muestra se topea en 100
    if (a.id === "email" && val("base") === 1) nec = 1 // sin base no hay a quién escribirle
    return { id: a.id, nombre: a.nombre, que: a.que, necesidad: to100(nec), preparacion: to100(prom(a.preparacion.map(val))), servicioNombre: SERVICIOS[a.servicio].nombre, servicioHref: SERVICIOS[a.servicio].href, orden: nec }
  }).sort((a, b) => b.orden - a.orden || b.preparacion - a.preparacion).map(({ orden: _o, ...a }) => a)
  const [primero, segundo] = ranking
  const ids = new Set<string>()
  for (const a of [primero, segundo]) for (const k of AUTOMATIZACIONES.find((x) => x.id === a.id)!.preparacion) if (val(k) <= 2) ids.add(k)
  if (val("equipo") <= 2) ids.add("equipo")
  const antes = [...ids].map((k) => PRERREQ[k])
  const ind = (id: AutoId) => AUTOMATIZACIONES.find((x) => x.id === id)!.indicador
  const preparacion = ["numero", "respuestas", "datos", "consentimiento", "equipo"].map(val)
  const puntaje = to100(prom(preparacion))
  return {
    nivel: 3, puntaje, etiqueta: etiqueta(3, puntaje).nombre, canal, ranking, primero, antes,
    hojaDeRuta: [
      { etapa: "Preparar", dias: "Días 1 a 30", tareas: [...(antes.length ? antes : ["Revisar con el equipo el proceso actual y quién lo usa."]), `Medir cómo están hoy: ${ind(primero.id)}.`] },
      { etapa: "Piloto", dias: "Días 31 a 60", tareas: [`Poner en marcha: ${primero.nombre}, en un área o canal, con revisión semanal.`, "Ajustar textos, reglas y derivaciones con lo que se aprende en el piloto."] },
      { etapa: "Medir y ampliar", dias: "Días 61 a 90", tareas: [`Comparar ${ind(primero.id)} contra el punto de partida.`, `Extender a toda la organización y preparar lo siguiente: ${segundo.nombre}.`] },
    ],
  }
}

// ═════════════════════ Comunes ═════════════════════
export const PREGUNTAS: Record<Nivel, Pregunta[]> = { 1: PREGUNTAS1, 2: PREGUNTAS2, 3: PREGUNTAS3 }
export type Resultado = Resultado1 | Resultado2 | Resultado3

/** Valida la forma de las respuestas. Devuelve null si son válidas o el motivo. */
export function validarRespuestas(nivel: Nivel, r: unknown): string | null {
  const qs = PREGUNTAS[nivel]
  if (!Array.isArray(r) || r.length !== qs.length) return "Faltan respuestas."
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i], v = r[i]
    if (typeof v !== "number" || !Number.isFinite(v)) return "Respuesta inválida."
    if (q.tipo === "horas") { if (v < 0 || v > 2000) return "Las horas tienen que estar entre 0 y 2000."; continue }
    const max = q.opciones.length
    const min = q.tipo === "escala" && q.noAplica ? 0 : 1
    if (!Number.isInteger(v) || v < min || v > max) return "Respuesta inválida."
  }
  return null
}

/** Preguntas que se saltean: las horas de un proceso marcado como "no aplica". */
export function seSaltea(nivel: Nivel, i: number, r: (number | null)[]) {
  const q = PREGUNTAS[nivel][i]
  if (q.tipo !== "horas") return false
  return r[PREGUNTAS[nivel].findIndex((x) => x.id === q.de)] === 0
}

export function calcular(nivel: Nivel, r: Respuestas, rubro: string | null): Resultado {
  return nivel === 1 ? calcular1(r) : nivel === 2 ? calcular2(r, rubro) : calcular3(r)
}

// ── Programas de la Academia recomendados al completar los tres niveles ──
export const PROGRAMAS = [
  { id: "diplomatura-transformacion-digital-ia", nombre: "Diplomatura Ejecutiva en Transformación Digital e IA", motivo: "Tu nivel 1 marcó una madurez digital baja: la diplomatura ordena estrategia, cultura y tecnología con un método." },
  { id: "programa-ia-conversacional-whatsapp", nombre: "Programa Ejecutivo en IA Conversacional por WhatsApp", motivo: "Tu nivel 3 marcó la atención de consultas como una de las primeras cosas para automatizar." },
  { id: "programa-salud-digital", nombre: "Programa Ejecutivo en Salud Digital", motivo: "Tu organización es del rubro salud." },
] as const
export type ProgramaId = (typeof PROGRAMAS)[number]["id"]
export const URL_CURSOS = "https://academia.devisebit.com/cursos"

/** Programas según los resultados: nivel 1 bajo (menos de 50), atención/consultas en el nivel 3 (es lo primero o su necesidad es de 75 o más) y rubro salud. */
export function programasPara(o: { puntaje1: number | null; r3: Resultado3 | null; rubro: string | null }) {
  const wa = o.r3?.ranking.find((a) => a.id === "whatsapp")
  return PROGRAMAS.filter((p) =>
    (p.id === "diplomatura-transformacion-digital-ia" && o.puntaje1 != null && o.puntaje1 < 50) ||
    (p.id === "programa-ia-conversacional-whatsapp" && !!o.r3 && (o.r3.primero.id === "whatsapp" || (wa?.necesidad ?? 0) >= 75)) ||
    (p.id === "programa-salud-digital" && o.rubro === "Salud"),
  )
}

export const TEXTO_INSIGNIA = "Organización con diagnóstico digital completo · ACADEMIA DEVISEBIT"
export const urlInsignia = (codigo: string) => `${W}/diagnostico/insignia/${encodeURIComponent(codigo)}`
