/** Mapa único de secciones del panel: lo usan el menú lateral y el buscador (Ctrl+K). */
export type Seccion = { s: string; t: string; claves: string }
export type GrupoNav = { g: string; items: Seccion[]; soloGerente?: boolean }

export const GRUPOS: GrupoNav[] = [
  {
    g: "Resumen",
    items: [
      { s: "", t: "Inicio", claves: "resumen inicio atención alertas indicadores tablero general" },
      { s: "analisis", t: "Análisis", claves: "indicadores métricas engagement seguidores mejor día formato horario hallazgos embudo comparación período" },
      { s: "competencia", t: "Competencia", claves: "competidores mercado benchmark comparar cuentas" },
    ],
  },
  {
    g: "Canales",
    items: [
      { s: "publicaciones", t: "Publicaciones", claves: "posts historial contenido instagram facebook linkedin youtube buscar texto" },
      { s: "youtube", t: "YouTube", claves: "videos shorts suscriptores vistas canal academia" },
      { s: "linkedin", t: "LinkedIn", claves: "página perfil julio exportación seguidores impresiones" },
      { s: "email", t: "Email", claves: "campañas envíos aperturas clics brevo newsletter" },
      { s: "anuncios", t: "Anuncios", claves: "meta ads google ads inversión gasto costo por consulta campañas pauta" },
    ],
  },
  {
    g: "Negocio",
    items: [
      { s: "crm", t: "CRM y ventas", claves: "consultas contactos proyectos reuniones whatsapp ventas clientes conversión embudo" },
      { s: "prospeccion", t: "Prospección", claves: "mails gmail invitaciones linkedin socios comerciales búsqueda laboral postulaciones respuestas seguimiento trazabilidad campañas tandas" },
      { s: "academia", t: "Academia", claves: "cursos alumnos suscriptores guías ventas certificados órdenes" },
      { s: "web", t: "Web", claves: "sitios estado visitas blog novedades notas velocidad" },
      { s: "usuarios", t: "Usuarios", claves: "portal clientes alumnos equipo accesos" },
    ],
  },
  { g: "Gestión", soloGerente: true, items: [{ s: "oficina", t: "Oficina", claves: "agentes bots equipo jefe de gabinete tareas" }] },
]

/** Cuentas que se pueden mirar por separado en Análisis y Publicaciones. */
export const CUENTAS: [id: string, nombre: string][] = [
  ["instagram", "Instagram @devisebit"],
  ["facebook", "Facebook · página"],
  ["youtube", "YouTube · ACADEMIA DEVISEBIT"],
  ["linkedin", "LinkedIn · página DEVISEBIT"],
  ["linkedin_julio", "LinkedIn · Julio Miranda"],
]
