// Motor de piezas: arma las escenas que declara window.PIEZA sobre la linea de tiempo TL y deja setT(t) listo para el render.
// Escena = { set, setOpt, html, hud, cam(X), anim(X,t), bit(X,t), entra:'whip'|'wipe'|'corte' }.
// En el html: data-c="k" (aparece con el grupo k de subtitulos de la escena), data-s="seg" (segundos desde el inicio), data-o (desfase), data-fx (pop|slam|up|down|left|right|fade), data-out="k" (se va con el grupo k), data-rot (grados).
const Q = new URLSearchParams(location.search), PZ = window.PIEZA, pant = $('#pant'), escD = $('#esc'), wipe = $('#wipe'), etq = $('#etq'), sub = $('#sub');
const voz = t => { const f = t * 30, i = Math.floor(f), e = TL.env, a = e[Math.min(e.length - 1, Math.max(0, i))] || 0, b = e[Math.min(e.length - 1, Math.max(0, i + 1))] || 0; return Math.pow(a + (b - a) * (f - i), .75); };
const parp = (t, cada = 2.7, fase = .9) => { const u = ((t + fase) % cada); return u < .16 ? Math.sin(Math.PI * u / .16) : 0; };
const pico = (t, a, d = .9) => t > a ? Math.exp(-(t - a) / d * 3) : 0;
const rectDe = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
function ver(el, t, t0, fx = 'pop', d = .3, tOut = null) { const p = P(t, t0, d, fx === 'fade' ? 'out' : 'back'), q = 1 - p, o = tOut != null ? 1 - P(t, tOut, .18, 'in') : 1, rot = el.dataset.rot ? ` rotate(${el.dataset.rot}deg)` : '';
  el.style.opacity = cl((t - t0) / .07) * o; el.style.transform = (fx === 'pop' ? `scale(${p * (.3 + .7 * o)})` : fx === 'slam' ? `scale(${1 + (1 - cl((t - t0) / .22)) * .7 - .0 * q})` : fx === 'up' ? `translateY(${q * 60}px)` : fx === 'down' ? `translateY(${-q * 60}px)` : fx === 'left' ? `translateX(${-q * 90}px)` : fx === 'right' ? `translateX(${q * 90}px)` : '') + rot; }
const ESC = TL.scenes.map((s, i) => { const def = PZ.escenas[s.id]; if (!def) throw new Error('falta la escena ' + s.id); const set = SETS[def.set || 'marca'](def.setOpt || {}), caps = TL.caps.filter(c => c.s === s.id);
  const el = document.createElement('section'); el.className = 'esc'; el.innerHTML = `<div class="cam bg">${set.html}</div><div class="cam cont">${def.html || ''}</div><canvas class="bc" width="1080" height="1920"></canvas><div class="hud">${def.hud || ''}</div>`; escD.appendChild(el); set.init(el);
  const X = { s0: s.start, s1: s.end, el, caps, c: k => (caps[Math.min(k, caps.length - 1)] || { t0: s.start }).t0, q: q => el.querySelector(q), qq: q => [...el.querySelectorAll(q)], rect: q => rectDe(typeof q === 'string' ? el.querySelector(q) : q) };
  const autos = [...el.querySelectorAll('[data-c],[data-s]')].map(e => ({ e, t0: (e.dataset.c != null ? X.c(+e.dataset.c) : s.start + +e.dataset.s) + (+e.dataset.o || 0), fx: e.dataset.fx || 'pop', out: e.dataset.out != null ? X.c(+e.dataset.out) - .05 : null }));
  const claves = caps.filter(c => c.w.some(w => w.includes('*'))).map(c => c.tw[Math.max(0, c.w.findIndex(w => w.includes('*')))]);
  return { ...s, i, def, set, el, X, autos, claves, g: el.querySelector('canvas').getContext('2d'), bg: el.querySelector('.bg'), cont: el.querySelector('.cont'), tipo: i ? (def.entra || ['whip', 'wipe', 'whipR'][i % 3]) : null }; });
const BIT0 = (ESC.find(e => e.def.bit) || ESC[0]).start + (PZ.bitEntra || 0), ETQ = PZ.etq || {}, ETQ0 = ETQ.esc ? ESC.find(e => e.id === ETQ.esc).X.c(ETQ.c || 0) : BIT0 + .5, ETQ1 = ETQ0 + (ETQ.dur || 3.6);
const GOLPES = [].concat(...ESC.map(e => [[e.start, e.i ? 11 : 0]].concat(e.claves.map(t => [t, 6]))));
window.SFX = { whoosh: ESC.filter(e => e.i && e.tipo !== 'corte').map(e => e.start), pop: [...new Set([].concat(...ESC.map(e => e.autos.filter(a => a.fx === 'pop').map(a => Math.round(a.t0 * 8) / 8))))].slice(0, 16), ping: [BIT0 + .2].concat(...ESC.map(e => e.autos.filter(a => a.fx === 'slam').map(a => a.t0))), golpe: ESC.filter(e => e.tipo === 'corte').map(e => e.start).concat(...ESC.map(e => e.autos.filter(a => a.fx === 'slam').map(a => a.t0))) };
let _bit = null;
function escena(e, t) { const X = e.X; X.t = t;
  let c = e.def.cam ? kf(e.def.cam(X), t) : [500, 960, 1 + .03 * cl((t - e.start) / (e.end - e.start))]; if (!e.def.sinPunch) for (const tc of e.claves) if (t >= tc) c[2] += .045 * Math.exp(-3.2 * (t - tc)) * cl((t - tc) / .08);
  camara(e.cont, c[0], c[1], c[2], 0); const zb = 1.05 + (c[2] - 1) * .7 + .05 * cl((t - e.start) / (e.end - e.start)) + [].concat(e.claves).reduce((m, tc) => m + (t >= tc ? .05 * Math.exp(-3.2 * (t - tc)) * cl((t - tc) / .08) : 0), 0); camara(e.bg, 540 + (c[0] - 540) * .6, 960 + (c[1] - 960) * .6, zb, .3 * Math.sin(t * .8)); e.set.upd(t);
  for (const a of e.autos) ver(a.e, t, a.t0, a.fx, .3, a.out); if (e.def.anim) e.def.anim(X, t);
  e.g.clearRect(0, 0, 1080, 1920); const b = e.def.bit && e.def.bit(X, t); _bit = null; if (!b || t < BIT0 - .02) return;
  const st = Object.assign({ t, v: voz(t), ap: P(t, BIT0, .42, 'back') }, b); st.lid = (b.lid ?? 1) * (1 - parp(t)); if (b.fondo !== false) rad(e.g, b.x, b.y, b.S * 2.3, [8, 9, 14], b.fondo ?? .55);
  if (b.mira) { const r = X.rect(b.mira); st.look = [cl((r.x + r.w / 2 - b.x) / 320, -1, 1), cl((r.y + r.h / 2 - b.y) / 320, -1, 1)]; }
  if (b.senala) { const [q, t0, t1, op] = b.senala, r = X.rect(q), k = P(t, t0, .3, 'out') * (t1 ? 1 - P(t, t1, .2) : 1), izq = r.x + r.w / 2 < b.x; if (k > 0) { st[izq ? 'armL' : 'armR'] = Object.assign({ obj: r, k }, op || {}); if (!b.mira && !b.look) st.look = [cl((r.x + r.w / 2 - b.x) / 320, -1, 1) * k, cl((r.y + r.h / 2 - b.y) / 320, -1, 1) * k]; } }
  bit3(e.g, b.x, b.y, b.S, st); _bit = b; }
function setT(t) { const ix = ESC.findIndex(e => t < e.end), ci = ix < 0 ? ESC.length - 1 : ix, cur = ESC[ci], sig = ESC[ci + 1], ant = ESC[ci - 1]; let dos = null, pw = 0, dir = 1;
  if (sig && sig.tipo.startsWith('whip') && t > sig.start - .12) { dos = [cur, sig]; pw = E.io(cl((t - (sig.start - .12)) / .27)); dir = sig.tipo === 'whipR' ? -1 : 1; }
  else if (ant && cur.tipo.startsWith('whip') && t < cur.start + .15) { dos = [ant, cur]; pw = E.io(cl((t - (cur.start - .12)) / .27)); dir = cur.tipo === 'whipR' ? -1 : 1; }
  for (const e of ESC) { const on = e === cur || (dos && dos.includes(e)); e.el.style.display = on ? 'block' : 'none'; if (!on) continue; let tr = '', fl = '';
    if (dos) { const sale = e === dos[0]; tr = `translateX(${(sale ? -pw : 1 - pw) * 1080 * dir}px) skewX(${-10 * dir * Math.sin(Math.PI * pw)}deg)`; fl = `blur(${Math.sin(Math.PI * pw) * 16}px)`; }
    else if (e.tipo === 'corte' && t < e.start + .25) tr = `scale(${1 + .12 * (1 - E.out(cl((t - e.start) / .25)))})`;
    e.el.style.transform = tr; e.el.style.filter = fl; escena(e, t); }
  const w = [sig, cur].find(e => e && e.tipo === 'wipe' && Math.abs(t - e.start) < .2), d = .38; if (w) { const p = (t - (w.start - .51 * d)) / d; wipe.style.display = p > 0 && p < 1 ? 'block' : 'none'; wipe.style.transform = `translateX(${lerp(-2500, 1400, E.io(cl(p)))}px) skewX(-12deg)`; } else wipe.style.display = 'none';
  const b = _bit, pq = P(t, ETQ0, .28, 'back') * (1 - P(t, ETQ1, .2, 'in')); etq.style.display = b && pq > .01 ? '' : 'none'; if (b) etq.style.transform = `translate(${cl(b.x, 330, 650)}px,${b.etqArriba ? Math.max(170, b.y - b.S * 1.42) : Math.min(1360, b.y + b.S * 1.5)}px) translate(-50%,-50%) scale(${pq})`;
  subtitulos(t); const [sx, sy] = sacudida(t, GOLPES); pant.style.transform = `translate(${sx}px,${sy}px) scale(1.02)`; return 1; }
if (Q.get('portada')) { const p = PZ.portada; setT(p.t); sub.style.display = 'none'; etq.style.display = 'none'; pant.style.transform = ''; $('#P').innerHTML = p.tit; $('#P').style.display = 'block'; if (p.top) $('#P').style.top = p.top + 'px'; }
else setT(+Q.get('t') || 0);
