# Bit v3 · piloto "23:47, ¿quién le contesta?"

Bit v3 es el híbrido que eligió Julio entre el Núcleo (A) y la Cápsula (C): un cuerpo de vidrio oscuro con forma de bit y borde coral, y adentro el núcleo de luz con su anillo de voz. No tiene cara. Todo es código propio (canvas 2D + HTML/SVG + Playwright + ffmpeg + edge-tts); sin imágenes, música ni personajes de terceros, sin precios. Nada se publica solo.

## Regenerar
`bash hacer.sh` (unos 6 minutos). Requiere python3 con playwright (Chromium instalado), edge-tts, numpy, Pillow, y ffmpeg.

## Archivos
| Archivo | Qué hace |
|---|---|
| `bit3.js` | El personaje. `bit3(ctx, cx, cy, S, estado)` lo dibuja en un canvas. |
| `guion.py` | Guion, voz (`VOZ`), ritmo, tempo y `EXTRA` (segundos de aire por escena). |
| `voz.py` | Locución es-AR + `../trabajo/timeline.json` (cortes sobre el pulso, instante de cada palabra, volumen de la voz por cuadro). |
| `piloto.html` | La pieza: escenas A (calle + entrada de Bit), B (chat), C (cierre). `setT(t)` deja la página en el instante t. `?portada=1` arma la portada. |
| `motor.js` | Easings, claves (`kf`, ya corregido para duración 0), cámara con parallax, sacudida, subtítulos cinéticos. |
| `gente.js` | Peatones con ciclo de caminata (talón-punta, rodilla que amortigua, brazos con codo). |
| `calle.js`, `estilo.css` | Decorado de la calle y marca. |
| `render.py` | Captura cuadro a cuadro, un archivo por escena, y los une. `render.py cuadros 2.5 9` saca cuadros y controla la zona segura. `render.py solo 2` rehace una escena. Si una captura se cuelga, reabre la página y sigue. |
| `sonido.py`, `musica.py` | Música sintetizada, efectos, ducking y −14 LUFS. |
| `contacto.py`, `hoja.html`, `carrusel.html`, `estaticos.py` | Hoja de contacto, hoja de personaje, carrusel (`?n=1..5`) y capturas fijas. |

## Estados de Bit (campos de `estado`)
| Campo | Efecto |
|---|---|
| `v` (0 a 1) | Voz: deforma el anillo y enciende el medidor. En el video sale de `voz(t)`. |
| `look: [x, y]` (−1 a 1) | Mirada: el núcleo se desplaza y gira hacia ese lado. |
| `lid` (0 a 1) | Párpados de vidrio. 1 abierto, 0,5 entrecerrado, 0,1 cerrado (salida). Parpadeo: `1 - parp(t)`. |
| `think` (0 a 1) | Pensando: el núcleo gira, baja el párpado y aparece el arco de carga. |
| `joy` (0 a 1) | Celebrando: núcleo dilatado, destellos y saltito. |
| `ap` (0 a 1) | Entrada (0 a 1) y salida (1 a 0). |
| `fl` | Destello puntual. |
| `armL`, `armR` | Brazos: `{x, y, k}` lleva la mano a un punto; `{obj: rect, k}` señala un elemento (con retícula; `arr: 1` llega desde arriba, `lado: -1` desde la derecha); `card: {a, b, fs, ok}` sostiene una tarjeta. |

## Cómo hacer otra pieza con Bit v3
1. Copiá `guion.py` y `piloto.html` con otro nombre y apuntá `voz.py`, `render.py` y `sonido.py` a esos nombres.
2. Guion en grupos de 2 o 3 palabras (`*clave*` resaltada), frases cortas, voseo, sin precios. `python3 voz.py` muestra la duración (ideal 18 a 24 s).
3. Cada escena es una `<section class="esc">` con un `.cam` (fondo con parallax) y un `<canvas class="bc">` donde se dibuja Bit en coordenadas de pantalla.
4. La coreografía se escribe contra el guion: `cap('escena', k)` da el instante del grupo k. Cámara y posición de Bit con `kf([[t, duración, easing, valores...]], t)`. Para señalar algo de la página: `armL: { obj: rect(elemento), k }`.
5. `python3 render.py cuadros 0.5 3 7` antes del render completo (avisa textos fuera de la zona segura: 130 px arriba, 250 abajo, 140 a la derecha).
6. Tamaños: S = 55 a 70 para una esquina de chat, 180 a 230 como presentador, 300 o más en primer plano.

## Límites conocidos
- La voz se ve en el anillo y el medidor según el volumen, no por fonemas.
- Diseño propio sin búsqueda de parecidos ni registro de marca.
