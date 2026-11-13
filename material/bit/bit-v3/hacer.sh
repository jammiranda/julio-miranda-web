#!/bin/bash
# Regenera todo Bit v3. Uso: bash hacer.sh   (unos 6 minutos; no publica ni sube nada)
set -e; cd "$(dirname "$0")"
python3 voz.py            # voz + linea de tiempo (../trabajo/timeline.json); si la voz ya esta en ../trabajo/voz no vuelve a pedirla
python3 render.py         # video sin audio (../trabajo/video.mp4), una parte por escena
python3 sonido.py         # musica + efectos + voz a -14 LUFS -> ../bit-v3-piloto-2347.mp4
python3 contacto.py       # ../contacto.png
python3 estaticos.py      # hoja de personaje, carrusel (PNG + PDF) y portada
