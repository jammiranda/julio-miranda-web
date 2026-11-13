# Tanda 1 con Bit v3

Diez videos verticales (1080×1920, 30 fps) con Bit v3 en primera persona. Todo es código propio: HTML/CSS/SVG + canvas, capturado con Playwright y armado con ffmpeg; voz edge-tts es-AR (Tomás); música y efectos sintetizados. Sin precios, sin clientes reales. Nada se publica solo.

## Regenerar
`bash hacer.sh` produce las diez (unos 3 minutos cada una). `bash hacer.sh b03-dominio` produce una sola. `python3 textos.py` rearma `../textos.md`.

## Archivos
| Archivo | Qué hace |
|---|---|
| `guiones.py` | Los diez guiones, en grupos de 2 o 3 palabras (`*clave*` resaltada). Voz, ritmo y tempo. |
| `voz.py` | Locución + `../trabajo/<pieza>/timeline.json`. |
| `piezas/<pieza>.js` | Cada pieza: sus escenas (decorado, contenido, cámara y qué hace Bit). |
| `motor2.js` | Arma las escenas sobre la línea de tiempo, transiciones, etiqueta "BIT // ASISTENTE CON IA", subtítulos y `setT(t)`. |
| `sets.js` | Decorados (`marca`, `grilla`, `calle` de noche o de día, `oficina`, `mostrador`) y armados comunes (`cierre`, `punto`). |
| `bit3.js`, `gente.js`, `calle.js`, `motor.js`, `estilo.css`, `comun.css` | Personaje, peatones, calle, utilidades y estilos. Copiados de `bit-v3/fuentes` (no se modifica esa carpeta). |
| `pieza.html` | La página que se filma: `pieza.html?p=<pieza>` (con `&portada=1` arma la portada). |
| `render.py` | Captura y une. `render.py <pieza> cuadros` saca cuadros de control y avisa textos fuera de la zona segura o con precios. `render.py <pieza> portada`. |
| `sonido.py`, `musica.py` | Mezcla a −14 LUFS y une el audio. Cada pieza usa otra progresión de acordes. |
| `contacto.py` | Hoja de contacto de 8 fotogramas. |
| `textos.py` | Guion + textos de publicación. |

## Cómo hacer otra pieza
1. Agregá el guion en `guiones.py` (escenas con id propio; la última suele ser `cta`).
2. Creá `piezas/<nombre>.js` con `window.PIEZA = { portada, etq, escenas: { id: {...} } }`. Cada escena: `set` (decorado), `html` (contenido en coordenadas de pantalla), `bit(X, t)` (posición, tamaño y estado) y, si hace falta, `cam(X)` y `anim(X, t)`.
3. En el `html`, `data-c="k"` hace aparecer el elemento con el grupo k de subtítulos de esa escena; `data-fx` elige la entrada (pop, slam, up, left, right, fade).
4. Bit señala con `senala: [selector, desde]` y mira con `mira` o `look`. Estados: `think`, `joy`, `lid`, `fl` (ver `bit3.js`).
5. `python3 voz.py <nombre>` y `python3 render.py <nombre> cuadros` para revisar antes de `bash hacer.sh <nombre>`.

Zona segura de TikTok: nada importante en los 130 px de arriba, los 250 de abajo ni los 140 de la derecha.
