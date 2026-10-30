import { perfil } from "./equipo"

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

const slugsDocentes = (docenteSlug?: string | null) => String(docenteSlug ?? "").split(",").map((x) => x.trim()).filter(Boolean)
/** Firma propia de los perfiles del curso, si todos la comparten (p. ej. Julio: "Creado por"). */
const firmaPropia = (docenteSlug?: string | null) => {
  const s = slugsDocentes(docenteSlug)
  const f = s.map((x) => perfil(x)?.firma)
  return s.length && f.every((x) => x && x === f[0]) ? f[0]! : null
}
/**
 * Rótulo de quién hizo el curso, por persona: "Creado por" para los perfiles con esa firma (Julio)
 * y "Lo enseña" / "Lo enseñan" para el resto (Oscar, Matías…).
 */
export const firmaCurso = (docenteSlug?: string | null, n?: number) => firmaPropia(docenteSlug) ?? loEnsena(n ?? Math.max(1, slugsDocentes(docenteSlug).length))
/** Lo mismo en pasado, para el certificado: "Creado por" o "Lo enseñó" / "Lo enseñaron". */
export const firmaCertificado = (docenteSlug?: string | null) => firmaPropia(docenteSlug) ?? (slugsDocentes(docenteSlug).length > 1 ? "Lo enseñaron" : "Lo enseñó")
/** Con quién es la videollamada: el nombre de pila si es una sola persona ("con Julio"), si no "con quien lo enseña". */
export const conQuien = (docenteSlug?: string | null) => {
  const s = slugsDocentes(docenteSlug)
  const p = s.length === 1 ? perfil(s[0]) : null
  return p ? `con ${p.nombre.split(" ")[0]}` : firmaPropia(docenteSlug) ? "con quien lo creó" : "con quien lo enseña"
}
