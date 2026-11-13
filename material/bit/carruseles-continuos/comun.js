// Utilidades comunes de los 4 carruseles. Cada HTML arma un lienzo de N x 1080 de ancho; render.py lo captura entero y lo corta en placas.
const PW = 1080, PH = 1350;
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// Crea las N placas (contenedores de texto). rec = true recorta lo que se salga (carruseles 3 y 4, donde cada placa es independiente).
function placas(N, rec) { document.body.style.width = N * PW + 'px'; const out = [];
  for (let i = 0; i < N; i++) { const d = document.createElement('div'); d.className = 'pl' + (rec ? ' rec' : ''); d.style.left = i * PW + 'px'; document.getElementById('pls').appendChild(d); out.push(d); } return out; }
const cab = (i, N) => `<div class="cab"><div class="logo">DEVISE<b>BIT</b></div><div class="n">${i + 1} / ${N}</div></div>`;
const WA = (s = 60) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 3.5a8.3 8.3 0 0 0-7.1 12.6L4 20.5l4.5-1A8.3 8.3 0 1 0 12 3.5z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M9.2 8.4c-.6 2.6 2.6 6.300 5.600 6.300l.9-1.300-1.700-1-1 .7c-.9-.4-1.900-1.400-2.300-2.300l.7-1-1-1.700z" fill="#fff"/></svg>`;
// Dibuja a Bit; si placa != null recorta a esa placa (para que el brillo no invada la vecina). sombra = y del piso
function bitEn(c, placa, x, y, S, est, sombra) { c.save(); if (placa != null) { c.beginPath(); c.rect(placa * PW, 0, PW, PH); c.clip(); }
  if (sombra) { c.save(); c.globalAlpha = .5; c.fillStyle = '#000'; c.filter = 'blur(12px)'; c.beginPath(); c.ellipse(x, sombra, S * .8, S * .1, 0, 0, 7); c.fill(); c.restore(); }
  bit3(c, x, y, S, est); c.restore(); }
