// BIT v3 (hibrido Nucleo + Capsula). Diseno propio de DEVISEBIT, dibujado en canvas 2D, sin imagenes.
// Un cuerpo de vidrio oscuro con forma de "bit" (cuadrado redondeado) y una ventana donde vive el nucleo: un bit incandescente con anillo de voz.
// No tiene cara: mira moviendo el nucleo, expresa con dos parpados de vidrio (se entrecierran al pensar, se abren al celebrar), habla con el anillo de voz
// y actua con dos brazos de interfaz que senalan y sostienen tarjetas.
// bit3(ctx, cx, cy, S, { t, v, look:[x,y], lid, think, joy, ap, fl, tilt, armL, armR })
//   v: voz 0..1 · look: -1..1 · lid: apertura de parpados 0..1 · think/joy: 0..1 · ap: aparicion 0..1 (0 = fuera de escena) · fl: destello
//   armL/armR: { x, y, k, obj:{x,y,w,h}, txt, card:{a,b,fs,ok} }  -> la mano va a (x,y) con avance k; obj dibuja reticula; card = tarjeta que sostiene
const TAU = Math.PI * 2, CORAL = [255, 106, 99], ROJO = [200, 35, 31], CAL = [255, 236, 232], FRIO = [110, 226, 255], MONO = '"DejaVu Sans Mono", monospace';
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`, Hh = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function rad(c, x, y, r, col, a) { if (!(r > 0) || a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function reticula(c, o, t, k, txt) { if (k <= .02) return; const m = 14 + 5 * Math.sin(t * 6), x = o.x - m, y = o.y - m, w = o.w + 2 * m, h = o.h + 2 * m, L = Math.min(30, w * .25, h * .4);
  c.save(); c.globalAlpha = k; c.strokeStyle = rgba(FRIO, .95); c.lineWidth = 4; c.shadowColor = rgba(FRIO, .9); c.shadowBlur = 16; c.lineCap = 'round'; c.beginPath();
  for (const [a, b, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { c.moveTo(a + sx * L, b); c.lineTo(a, b); c.lineTo(a, b + sy * L); } c.stroke();
  if (txt) { c.shadowBlur = 0; c.font = `700 22px ${MONO}`; c.fillStyle = rgba(FRIO, .95); c.textAlign = 'left'; c.fillText(txt, x + 4, y + h + 30); } c.restore(); }
function tarjeta(c, x, y, d, k) { const fs = d.fs || 22, w = d.w || fs * 12.5, h = fs * 3.5; c.save(); c.translate(x, y); c.scale(k, k); c.translate(-w / 2, -h / 2); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 24; c.shadowOffsetY = 10; c.fillStyle = 'rgba(15,18,26,.94)'; rr(c, 0, 0, w, h, fs * .6); c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0; c.strokeStyle = rgba(CAL, .3); c.lineWidth = 1.5; c.stroke();
  let tx = fs * .9; if (d.ok) { c.fillStyle = '#18A957'; c.beginPath(); c.arc(fs * 1.75, h / 2, fs * 1.05, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = fs * .2; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(fs * 1.25, h / 2 + fs * .05); c.lineTo(fs * 1.62, h / 2 + fs * .42); c.lineTo(fs * 2.3, h / 2 - fs * .38); c.stroke(); tx = fs * 3.3; } else { c.fillStyle = rgba(CORAL, 1); c.fillRect(fs * .7, fs * .7, fs * .22, h - fs * 1.4); tx = fs * 1.4; }
  c.textAlign = 'left'; c.font = `700 ${fs}px ${MONO}`; c.fillStyle = rgba(CAL, .98); c.fillText(d.a, tx, h * .45); c.font = `400 ${fs * .82}px ${MONO}`; c.fillStyle = rgba(FRIO, .95); c.fillText(d.b, tx, h * .8); c.restore(); }

function bit3(c, cx, cy, S, q) { const s = Object.assign({ t: 0, v: 0, look: [0, 0], lid: 1, think: 0, joy: 0, ap: 1, fl: 0, tilt: 0, armL: null, armR: null }, q), { t, v, think, joy, fl } = s; if (s.ap <= .001) return;
  const ap = Math.min(1.15, s.ap), lk = s.look, y0 = cy + Math.sin(t * 1.5) * S * .025 - joy * S * .1 * Math.abs(Math.sin(t * 7)), rot = s.tilt + lk[0] * .05 + Math.sin(t * 1.1) * .018, A = .78 * S, Wn = .56 * S;
  const lid = Math.max(.04, Math.min(1, s.lid * Math.min(1, s.ap * 1.4 - .25)));   // al entrar, los parpados abren despues de aparecer
  c.save(); c.globalCompositeOperation = 'lighter'; rad(c, cx, y0 + S * .15, S * 1.7 * ap, ROJO, (.26 + .18 * v + .4 * fl + .2 * joy) * ap); rad(c, cx, y0, S * 1.05 * ap, CORAL, (.14 + .14 * v + .3 * fl) * ap);
  // arcos de instrumento (frio, medido) y carga al pensar
  c.translate(cx, y0); c.scale(ap, ap); c.lineCap = 'round';
  for (const [r, a0, len, w, sp, col, al] of [[1.16, .5, .9, 2.5, -.3, FRIO, .55], [1.16, 3.5, .45, 2.5, -.3, FRIO, .35], [1.24, 2.2, .28, 5, .2, CORAL, .8]]) { c.strokeStyle = rgba(col, al); c.lineWidth = w * S / 250; c.beginPath(); c.arc(0, 0, S * r, a0 + t * sp, a0 + t * sp + len); c.stroke(); }
  if (think > .02) { c.strokeStyle = rgba(FRIO, .9 * think); c.lineWidth = 4 * S / 250; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, S * 1.06, t * 5 + i * TAU / 3, t * 5 + i * TAU / 3 + .55); c.stroke(); } }
  if (joy > .02) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + .2, r0 = S * (1.12 + .1 * Math.sin(t * 9 + i)), r1 = r0 + S * (.1 + .16 * joy) * (i % 2 ? 1 : .55); c.strokeStyle = rgba(i % 3 ? CORAL : CAL, .85 * joy); c.lineWidth = 4 * S / 250; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
  // particulas exteriores
  for (let i = 0; i < 46; i++) { const R = S * (.95 + .7 * Hh(i)) * (1 + .1 * v * Math.sin(t * 9 + i) + .25 * joy * Math.abs(Math.sin(t * 3 + i))), a = Hh(i + 9) * TAU + t * (.12 + .4 * Hh(i + 3)) * (i % 2 ? 1 : -1); rad(c, Math.cos(a) * R, Math.sin(a) * R * .9, S * (.012 + .022 * Hh(i + 5)), i % 4 ? CORAL : FRIO, .2 + .55 * Math.abs(Math.sin(t * 1.7 + i))); }
  // orbita exterior: la mitad de atras se dibuja antes del cuerpo
  const orb = (frente) => { c.save(); c.rotate(-.3 + .05 * Math.sin(t * .7) + rot); const R = S * 1.22, ry = .27; for (let i = 0; i < 80; i++) { const a = i / 80 * TAU, b = (i + 1) / 80 * TAU, fr = Math.sin(a) > 0; if (fr !== frente) continue; c.strokeStyle = rgba(CORAL, fr ? .75 : .28); c.lineWidth = (fr ? 2.6 : 1.4) * S / 250; c.beginPath(); c.moveTo(Math.cos(a) * R, Math.sin(a) * R * ry); c.lineTo(Math.cos(b) * R, Math.sin(b) * R * ry); c.stroke(); }
    const an = t * (1.1 + 2 * think + 1.5 * joy), nf = Math.sin(an) > 0; if (nf === frente) { rad(c, Math.cos(an) * R, Math.sin(an) * R * ry, S * .09, CORAL, .9); rad(c, Math.cos(an) * R, Math.sin(an) * R * ry, S * .03, CAL, 1); } c.restore(); };
  orb(false); c.restore();
  // ---- cuerpo: vidrio oscuro con borde coral ----
  c.save(); c.translate(cx, y0); c.rotate(rot); c.scale(ap, ap);
  c.shadowColor = 'rgba(0,0,0,.75)'; c.shadowBlur = S * .22; c.shadowOffsetY = S * .1; let g = c.createLinearGradient(0, -A, 0, A); g.addColorStop(0, '#3B4250'); g.addColorStop(.45, '#1B1F29'); g.addColorStop(1, '#0A0C11'); c.fillStyle = g; rr(c, -A, -A, 2 * A, 2 * A, S * .34); c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
  g = c.createLinearGradient(0, -A, 0, A); g.addColorStop(0, 'rgba(222,230,242,.95)'); g.addColorStop(.3, 'rgba(96,104,120,.55)'); g.addColorStop(.68, rgba(CORAL, .65)); g.addColorStop(1, rgba(CORAL, 1)); c.strokeStyle = g; c.lineWidth = Math.max(2, S * .016); rr(c, -A, -A, 2 * A, 2 * A, S * .34); c.stroke();
  c.save(); c.beginPath(); c.rect(-2 * A, A * .25, 4 * A, 2 * A); c.clip(); c.shadowColor = rgba(CORAL, 1); c.shadowBlur = S * .16; c.strokeStyle = rgba(CORAL, .95); c.lineWidth = Math.max(2, S * .014); rr(c, -A, -A, 2 * A, 2 * A, S * .34); c.stroke(); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.5; rr(c, -A + S * .045, -A + S * .045, 2 * A - S * .09, 2 * A - S * .09, S * .3); c.stroke();
  for (const sg of [-1, 1]) { c.fillStyle = '#07090D'; rr(c, sg * A - S * .035, S * .0, S * .07, S * .26, S * .035); c.fill(); c.fillStyle = rgba(FRIO, .9); c.fillRect(sg * A - S * .008, S * .06, S * .016, S * .14); }
  c.fillStyle = rgba(FRIO, .95); c.shadowColor = rgba(FRIO, 1); c.shadowBlur = 10; c.beginPath(); c.arc(0, -A + S * .11, Math.max(2.5, S * .016), 0, TAU); c.fill(); c.shadowBlur = 0;
  // medidor de voz en el marco inferior (dato, no cara)
  for (let i = 0; i < 11; i++) { const on = Math.abs(i - 5) < v * 6.2; c.fillStyle = on ? rgba(CORAL, 1) : 'rgba(255,255,255,.14)'; c.fillRect((i - 5) * S * .05 - S * .014, A - S * .13, S * .028, S * .04); }
  c.font = `700 ${S * .07}px ${MONO}`; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText('BIT', -A + S * .14, -A + S * .135); c.textAlign = 'right'; c.fillStyle = rgba(FRIO, .8); c.fillText('IA', A - S * .14, -A + S * .135);
  // ---- ventana: aca vive el nucleo ----
  c.fillStyle = '#040507'; rr(c, -Wn, -Wn, 2 * Wn, 2 * Wn, S * .24); c.fill(); c.save(); rr(c, -Wn, -Wn, 2 * Wn, 2 * Wn, S * .24); c.clip(); c.globalCompositeOperation = 'lighter';
  const lx = lk[0] * S * .1, ly = lk[1] * S * .09; rad(c, lx * .5, ly * .5, Wn * 1.5, ROJO, .5 + .25 * v + .4 * fl + .2 * joy); rad(c, lx, ly, Wn * .8, CORAL, .25 + .3 * v + .3 * fl);
  for (const [k2, al] of [[.82, .1], [.64, .07]]) { c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 1; rr(c, -Wn * k2, -Wn * k2, 2 * Wn * k2, 2 * Wn * k2, S * .24 * k2); c.stroke(); }
  [[.5, .34, .43, 1.5], [-.75, .5, .4, -1.9]].forEach(([tl, ry, R, vel], j) => { c.save(); c.translate(lx * .6, ly * .6); c.rotate(tl + t * (j ? -.1 : .12)); const Rr = S * R; c.strokeStyle = rgba(j ? FRIO : CORAL, .4); c.lineWidth = 1.5 * S / 250 + .5; c.beginPath(); c.ellipse(0, 0, Rr, Rr * ry, 0, 0, TAU); c.stroke(); const an = t * vel * (1 + 2 * think) + j * 2; rad(c, Math.cos(an) * Rr, Math.sin(an) * Rr * ry, S * .05, j ? FRIO : CORAL, .9); c.restore(); });
  for (let i = 0; i < 26; i++) { const R = S * (.16 + .42 * Hh(i + 40)), a = Hh(i + 49) * TAU + t * (.3 + .6 * Hh(i + 43)) * (i % 2 ? 1 : -1); rad(c, lx * .4 + Math.cos(a) * R, ly * .4 + Math.sin(a) * R, S * .018, i % 3 ? CORAL : FRIO, .3 + .5 * Math.abs(Math.sin(t * 2 + i))); }
  // anillo de voz
  const onda = (r0, amp, f, col, lw, al, bl) => { c.beginPath(); for (let i = 0; i <= 160; i++) { const a = i / 160 * TAU, r = r0 + amp * (Math.sin(6 * a + t * 7 * f) * .5 + Math.sin(11 * a - t * 9 * f) * .3 + Math.sin(17 * a + t * 13 * f) * .2) * (.55 + .45 * Math.sin(2 * a + t * 1.3)); c[i ? 'lineTo' : 'moveTo'](lx + Math.cos(a) * r, ly + Math.sin(a) * r); } c.closePath(); c.strokeStyle = rgba(col, al); c.lineWidth = lw; c.shadowColor = rgba(col, 1); c.shadowBlur = bl; c.stroke(); c.shadowBlur = 0; };
  const am = S * (.01 + .115 * v + .02 * joy); onda(S * .31, am, 1, CORAL, Math.max(2.5, S * .026), .8, S * .1); onda(S * .31, am, 1, CAL, Math.max(1, S * .008), .95, 0); onda(S * .23, am * .55, -1.4, FRIO, Math.max(1, S * .007), .65, S * .04);
  // el bit: nucleo cuadrado incandescente. Mira desplazandose; al pensar gira; al celebrar se dilata
  c.globalCompositeOperation = 'source-over'; const qn = S * (.1 + .028 * v + .035 * joy + .02 * fl) * (1 - .14 * think) * (1 + .04 * Math.sin(t * 3)); c.save(); c.translate(lx * 1.25, ly * 1.25); c.rotate(.1 * Math.sin(t * .8) + think * (Math.PI / 4 + t * 2.4) + lk[0] * .18);
  c.shadowColor = rgba(CORAL, 1); c.shadowBlur = S * .3; g = c.createLinearGradient(-qn, -qn, qn, qn); g.addColorStop(0, '#fff'); g.addColorStop(1, '#FFCDC6'); c.fillStyle = g; rr(c, -qn, -qn, 2 * qn, 2 * qn, qn * .32); c.fill(); c.fill(); c.shadowBlur = 0;
  const qi = qn * (.36 - .1 * joy); c.fillStyle = rgba(ROJO, .95); rr(c, -qi + lk[0] * qn * .34, -qi + lk[1] * qn * .34, 2 * qi, 2 * qi, qi * .3); c.fill(); c.restore();
  // parpados de vidrio (expresion): se cierran desde arriba y abajo
  const cv = Wn * .16, top = -Wn + (1 - Math.min(1, lid + .0)) * Wn * .98 + think * Wn * .12, bot = Wn - (1 - lid) * Wn * .98;
  for (const [yy, sg] of [[top, -1], [bot, 1]]) { if (lid > .985 && !(sg < 0 && think > 0)) continue; c.beginPath(); c.moveTo(-Wn - 2, sg * (Wn + 4)); c.lineTo(-Wn - 2, yy); c.quadraticCurveTo(0, yy - sg * cv * (1 - lid * .5) * -1, Wn + 2, yy); c.lineTo(Wn + 2, sg * (Wn + 4)); c.closePath(); g = c.createLinearGradient(0, sg * Wn, 0, yy); g.addColorStop(0, '#0C0E14'); g.addColorStop(1, '#232834'); c.fillStyle = g; c.fill();
    c.beginPath(); c.moveTo(-Wn - 2, yy); c.quadraticCurveTo(0, yy - sg * cv * (1 - lid * .5) * -1, Wn + 2, yy); c.strokeStyle = rgba(CORAL, .9); c.lineWidth = Math.max(1.5, S * .012); c.shadowColor = rgba(CORAL, 1); c.shadowBlur = S * .06; c.stroke(); c.shadowBlur = 0; }
  // dos destellos sobre el vidrio (se corren contra la mirada) y reflejo
  c.globalCompositeOperation = 'lighter'; rad(c, -Wn * .52 - lx * .5, -Wn * .55 - ly * .5, S * .11, CAL, .5); rad(c, Wn * .5 - lx * .4, Wn * .5 - ly * .4, S * .06, CAL, .28);
  g = c.createLinearGradient(-Wn, -Wn, Wn * .2, Wn * .5); g.addColorStop(0, 'rgba(255,255,255,.17)'); g.addColorStop(.48, 'rgba(255,255,255,.03)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-Wn, -Wn, 2 * Wn, 2 * Wn); c.restore();
  c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = Math.max(2, S * .03); rr(c, -Wn, -Wn, 2 * Wn, 2 * Wn, S * .24); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; rr(c, -Wn - S * .018, -Wn - S * .018, 2 * Wn + S * .036, 2 * Wn + S * .036, S * .255); c.stroke();
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; c.translate(cx, y0); c.scale(ap, ap); c.lineCap = 'round'; orb(true); if (fl > 0) rad(c, 0, 0, S * 1.6, CAL, fl * .35); c.restore();
  // ---- brazos de interfaz ----
  for (const [sg, a] of [[-1, s.armL], [1, s.armR]]) { const px = cx + sg * A * ap * Math.cos(rot), py = y0 + S * .13 * ap + sg * A * Math.sin(rot); let hx = px + sg * S * .2, hy = py + S * .3, k = 0;
    if (a && a.k > 0) { k = Math.min(1, a.k); let tx = a.x, ty = a.y; if (a.obj) { tx = a.obj.x + a.obj.w / 2 + (a.dx || 0); ty = a.arr ? a.obj.y - 22 : a.obj.y + a.obj.h + 18; if (a.lado) { tx = a.lado < 0 ? a.obj.x + a.obj.w + 20 : a.obj.x - 20; ty = a.obj.y + a.obj.h / 2; } } hx += (tx - hx) * k; hy += (ty - hy) * k; }
    const mx = (px + hx) / 2, my = (py + hy) / 2, dxx = hx - px, dyy = hy - py, n = Math.hypot(dxx, dyy) || 1, bend = S * .2 * (k > 0 ? 1 : .5), ex = mx + (-dyy / n) * bend * -sg, ey = my + (dxx / n) * bend * -sg * (dyy < 0 ? 1 : 1);
    c.save(); c.globalAlpha = Math.min(1, s.ap * 1.5); c.lineCap = 'round'; c.lineJoin = 'round'; const u = S / 250;
    c.strokeStyle = '#07090D'; c.lineWidth = 13 * u; c.beginPath(); c.moveTo(px, py); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke(); c.strokeStyle = 'rgba(158,168,186,.95)'; c.lineWidth = 5.5 * u; c.stroke(); c.strokeStyle = rgba(FRIO, .9); c.lineWidth = 1.6 * u; c.stroke();
    for (const [x, y] of [[px, py], [ex, ey]]) { c.fillStyle = '#07090D'; c.beginPath(); c.arc(x, y, 11 * u, 0, TAU); c.fill(); c.fillStyle = rgba(FRIO, .95); c.beginPath(); c.arc(x, y, 4.5 * u, 0, TAU); c.fill(); }
    c.translate(hx, hy); c.shadowColor = rgba(CORAL, 1); c.shadowBlur = 26 * u * (k > 0 ? 1 : .4); c.fillStyle = rgba(CORAL, 1); rr(c, -19 * u, -19 * u, 38 * u, 38 * u, 11 * u); c.fill(); c.shadowBlur = 0;
    c.rotate(k > 0 ? Math.atan2(hy - ey, hx - ex) + Math.PI / 2 : 0); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-8 * u, 9 * u); c.lineTo(0, -10 * u); c.lineTo(8 * u, 9 * u); c.lineTo(0, 4 * u); c.closePath(); c.fill(); c.restore();
    if (a && a.obj && a.ret !== false) reticula(c, a.obj, t, Math.max(0, k * 2 - 1), a.txt);
    if (a && a.card && k > .3) { const fs = a.card.fs || 22, w = a.card.w || fs * 12.5; tarjeta(c, hx + (a.card.dx != null ? a.card.dx : sg * (w / 2 + 26 * u)), hy + (a.card.dy || 0), a.card, Math.min(1, (k - .3) / .5)); } }
}
