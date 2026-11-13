#!/bin/bash
# Produce las piezas de la tanda, de a una (dos procesos de render por pieza). Uso: bash hacer.sh [pieza ...]   (sin argumentos: las 10)
# No publica ni sube nada. Cada pieza tarda unos 3 minutos.
cd "$(dirname "$0")"
PIEZAS=${@:-$(ls piezas | sed 's/\.js$//')}
for p in $PIEZAS; do
  python3 voz.py "$p" && python3 render.py "$p" && python3 sonido.py "$p" && python3 render.py "$p" portada && python3 contacto.py "$p" || echo "FALLO $p"
done
echo FIN
