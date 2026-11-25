# Conocé DEVISEBIT · fuentes

No se publican (están fuera de `public/`). Datos tomados de `lib/marca.ts`: si cambian soluciones, productos o equipo, actualizar acá también.

- v3 (25/11/2026): Páginas web por suscripción o a medida, consultor tecnológico, 12 productos propios (suma Web por Suscripción, gestión y portal, MateBot y MateCuentas) y redes con TikTok y Facebook.
- `slides.html` + `render.py`: las 12 placas 1920×1080 y el PDF (`Conoce-DEVISEBIT.pdf`). El PDF publicado está en `public/mv-8f92ddf28895/conoce-devisebit.pdf` (documento de LinkedIn y Destacados del perfil de Julio, página `conoce-devisebit.html`).
- `anim.html`: el video animado (función `setT(t)`, escenas en `S`). `escena.py NOMBRE INICIO FIN` renderiza una escena a 30 fps; `musica.py` genera la música (120 bpm, 64 s). Se unen con el concat de ffmpeg y se suma la música con `-c:v copy`.
- Versión WhatsApp: los primeros 0,4 s con el logo armado, para que esa sea la vista previa.
- Video publicado: https://youtu.be/Hou4qFpNC4k (avance del canal y destacado para suscriptores).
