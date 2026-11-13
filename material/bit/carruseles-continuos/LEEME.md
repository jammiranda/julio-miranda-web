# Carruseles continuos · DEVISEBIT

Cuatro carruseles de 1080×1350 hechos con HTML/CSS/SVG + canvas (Bit v3) y capturados con Playwright. Sin fotos, sin precios, nada se publica solo.

## Regenerar
`python3 render.py` (todos) o `python3 render.py c2` (uno). Deja en `../<nombre>/` las placas `placa-N.png`, el PDF para LinkedIn y el panorama de control (2400 px de ancho).

## Cómo está armado
Cada `cN.html` dibuja UN lienzo de N × 1080 px de ancho. `render.py` lo captura entero y lo corta cada 1080 px; por eso lo que cruza un corte sigue sin costura.

| Archivo | Carrusel | Mecánica |
|---|---|---|
| `c1.html` | c1-caminando (7) | Panorama continuo de una calle, de la noche al amanecer. Bit está a caballo de los cortes 1/2, 3/4 y 5/6 y entero en la última. |
| `c2.html` | c2-recorrido (7) | Una línea punteada (`PT` = puntos de paso, `rulo()` = rulos) cruza todo el lienzo. Bit se ubica sobre la línea con `getPointAtLength`. |
| `c3.html` | c3-zoom (6) | Un único "mundo" (escritorio visto desde arriba) repetido en cada placa con otro `scale`. `V` = zoom y velos por placa. |
| `c4.html` | c4-borroso (6) | La misma tarjeta en el mismo lugar con `filter: blur()` decreciente (`BL`). Los párpados de Bit se abren a medida que enfoca. |

`base.css` = marca; `comun.js` = placas, cabecera y `bitEn()` (dibuja a Bit, con recorte por placa en c3 y c4); `bit3.js` y `gente.js` son copias sin cambios de Bit v3.

## Reglas para editar
- Los textos van dentro del contenedor de su placa (`P[i]`), entre x = 70 y x = 1010: así ninguno queda a menos de 70 px de un corte.
- Lo que cruza un corte tiene que ser dibujo (Bit, línea, fondo), nunca texto.
- Cuerpo mínimo 34 px, títulos de 80 px o más. Sin precios ni nombres de clientes.
- El puntaje de c4 (58 de 100) y sus prioridades son un ejemplo y la placa lo dice.
