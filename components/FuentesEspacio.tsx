/**
 * Tipografías de las pantallas con `data-espacio` (sistema, Mi cuenta y el espacio del alumno): Instrument Sans (texto),
 * Bricolage Grotesque (títulos) y DM Mono (datos). El resto del sitio usa solo Inter, que carga el layout raíz:
 * así las páginas públicas no descargan hojas de fuentes que no usan. `precedence` hace que React la suba al <head>
 * y no la repita si dos componentes la piden.
 */
const HREF = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"

export default function FuentesEspacio() {
  return <link rel="stylesheet" href={HREF} {...({ precedence: "default" } as object)} />
}
