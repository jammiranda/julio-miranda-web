/**
 * Portadas originales de los cursos: public/academia/cursos/<slug>.jpg (1200×675), generadas con scripts/portadas-cursos.mjs.
 * Va como lista fija (y no leyendo el disco) porque en Vercel los archivos de public/ no están en el servidor de las páginas.
 * Para un curso nuevo: sumarlo al script, generar la imagen y agregar el slug acá (o cargar una imagen en Sistema Academia).
 */
const CON_PORTADA = new Set([
  "prompt-engineering-para-ejecutivos",
  "liderazgo-en-la-era-de-la-ia",
  "marca-personal-en-linkedin-para-lideres",
  "ia-para-tu-pyme-5-tareas-en-una-semana",
  "whatsapp-con-ia-asistente-de-tu-negocio",
  "introduccion-a-la-transformacion-digital",
  "panel-de-contenido-con-ia-de-cero-a-produccion",
  "transforma-tu-empresa-con-ia-el-ecosistema-digital",
])

/** La imagen cargada en Sistema Academia o, si no tiene, la portada original del curso. */
export function portada(c: { slug: string; imagen?: string | null }): string | null {
  if (c.imagen) return c.imagen
  return CON_PORTADA.has(c.slug) ? `/academia/cursos/${c.slug}.jpg` : null
}

/** Cómo se nombra a quien enseña un curso (en lugar de "Docente"). */
export const loEnsena = (n = 1) => (n > 1 ? "Lo enseñan" : "Lo enseña")
