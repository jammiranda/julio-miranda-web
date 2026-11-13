// Motor comun: easings, claves, camara con parallax, subtitulos cineticos. Todo depende solo de t (determinista): render.py llama setT(t) cuadro a cuadro.
const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, p) => a + (b - a) * p;
const E = { lin: x => x, out: x => 1 - Math.pow(1 - x, 3), in: x => x * x * x, io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }, exp: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x) };
const P = (t, a, d = .5, e = 'out') => E[e](cl((t - a) / d));
// claves de camara u otros: [[t, dur, ease, v1, v2, ...]] -> cada clave llega a sus valores en t+dur, partiendo de donde estaba
function kf(K, t) { let v = K[0].slice(3); for (const k of K) { if (t < k[0]) break; const p = k[1] > 0 ? E[k[2]](cl((t - k[0]) / k[1])) : 1, w = k.slice(3); v = v.map((x, i) => lerp(x, w[i], p)); } return v; }
// poses: [[t, dur, {pose}]] mezcla numeros y pares [x,y]; los campos no numericos saltan
function poseKF(K, t) { let v = Object.assign({}, K[0][2]); for (const k of K) { if (t < k[0]) break; const p = E.io(cl((t - k[0]) / k[1])), w = k[2];
    for (const n in w) { const a = v[n], b = w[n]; v[n] = Array.isArray(b) ? (a ? [lerp(a[0], b[0], p), lerp(a[1], b[1], p)] : b) : (typeof b === 'number' && typeof a === 'number') ? lerp(a, b, p) : (p > .5 ? b : a); } } return v; }
// camara: centra (cx,cy) del mundo en el centro de pantalla con zoom z; las capas .lay[data-d] se mueven distinto segun profundidad (parallax)
function camara(el, cx, cy, z, rot = 0) {
  el.style.transform = `translate(540px,960px) rotate(${rot}deg) scale(${z}) translate(${-cx}px,${-cy}px)`;
  for (const l of el._lays || (el._lays = $$('.lay[data-d]', el))) { const d = +l.dataset.d; l.style.transform = `translate(${(cx - 540) * (1 - d)}px,${(cy - 960) * (1 - d) * .5}px)`; }
}
function sacudida(t, L) { let x = 0, y = 0; for (const [a, k] of L) { const d = t - a; if (d >= 0 && d < .5) { const e = k * Math.exp(-9 * d); x += e * Math.sin(d * 70); y += e * Math.cos(d * 55); } } return [x, y]; }
const pulso = t => Math.exp(-5 * ((t * TL.bpm / 60) % 1));   // 1 en cada golpe de la musica, cae rapido
const cap = (s, k) => TL.caps.find(c => c.s === s && c.k === k).t0;
// Subtitulos cineticos: grupo de 2 o 3 palabras, cada palabra entra con su silaba; *clave* resaltada en rojo
let _subK = -1;
function subtitulos(t) {
  const el = $('#sub'), i = TL.caps.findIndex(c => t >= c.t0 && t < c.t1), c = TL.caps[i];
  if (!c || !c.w.length) { el.style.display = 'none'; _subK = -1; return; }
  const ult = TL.words.filter(w => w.t0 < c.t1 - .02).pop(); if (ult && t > ult.t1 + .4) { el.style.display = 'none'; _subK = -1; return; }
  el.style.display = 'block';
  if (_subK !== i) { _subK = i; let on = false; el.innerHTML = c.w.map(w => { let a = w.startsWith('*'); if (a) on = true; const k = on; if (w.endsWith('*')) on = false; return `<span class="${k ? 'k' : ''}">${w.replace(/\*/g, '')}</span>`; }).join(' ');
    el.style.fontSize = '112px'; el.style.transform = ''; const w = el.scrollWidth; el.style.fontSize = Math.floor(Math.min(112, 112 * 840 / w)) + 'px'; }
  [...el.children].forEach((s, j) => { const p = P(t, c.tw[j], .16, 'back'); s.style.opacity = cl((t - c.tw[j]) / .05); s.style.transform = `translateY(${(1 - p) * 34}px) scale(${.6 + .4 * p}) rotate(${s.className ? -2.500 : 0}deg)`; });
}
