// Serie "Casos reales" · c01: una prestadora de salud que hacia todo a mano. Caso anonimizado; hechos publicados en julio.devisebit.com.
const BARRAS = '<svg width="760" height="230" viewBox="0 0 760 230">' + [120, 170, 95, 205, 150, 185].map((h, i) => `<rect class="bar" x="${i * 128 + 10}" y="${225 - h}" width="96" height="${h}" rx="12" fill="${i === 3 ? '#FF6A63' : '#2F7D5B'}"/>`).join('') + '</svg>';
const GIRA2 = '<svg class="gira" width="64" height="64" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3"/><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#FF6A63" stroke-width="3" stroke-linecap="round"/></svg>';
window.PIEZA = { portada: { t: 1.6, tit: '<span>CASO REAL</span><br><b>SALUD</b>' }, etq: { esc: 'gancho', c: 1 },
 escenas: {
  gancho: { set: 'oficina', setOpt: { dof: .35 },
    html: `<div class="gt" style="left:70px;top:290px;background:var(--r)" data-s="0.05" data-fx="slam" data-rot="-4">CASO REAL</div>
      <div class="T" style="top:500px;font-size:100px" data-c="1" data-fx="up">Una prestadora<br>de <b>salud</b></div>
      <div class="gt" style="left:150px;top:820px;background:#F4F1EC;color:#11141B;font-size:88px" data-c="3" data-fx="right" data-rot="3">TODO A MANO</div>`,
    bit: (X, t) => ({ x: 560, y: 1180, S: 215, fondo: .4, look: [-.4, -.7], fl: pico(t, X.c(3), .5) }) },
  s1: { set: 'grilla', anim: (X, t) => X.qq('.gira').forEach(g => g.style.transform = `rotate(${t * 300}deg)`),
    html: `<div class="gt" style="left:60px;top:300px;background:#F4F1EC;color:#11141B" data-c="0" data-fx="left" data-rot="-5">PLANILLAS</div>
      <div class="gt" style="left:300px;top:490px;background:#F4F1EC;color:#11141B" data-c="1" data-fx="right" data-rot="4">PAPELES</div>
      <div class="gt" style="left:90px;top:690px;background:#18A957" data-c="2" data-fx="left" data-rot="-3">WHATSAPP</div>
      <div class="fila" style="position:absolute;left:150px;top:900px;width:640px" data-c="3" data-fx="pop"><i>${GIRA2}</i>No paraba</div>`,
    bit: (X, t) => ({ x: 760, y: 1250, S: 165, think: .8 * (1 - P(t, X.c(3), .3, 'out')), senala: ['.fila', X.c(3) + .1, null, { ret: false, lado: -1 }] }) },
  s2: { set: 'marca',
    html: `<div class="vid" style="left:70px;top:300px;width:780px" data-c="0" data-fx="up"><div class="cab">SISTEMA DE GESTIÓN PROPIO</div>
      <div class="fila" data-c="2"><i class="ok">${OKSVG}</i>Historia clínica digital</div>
      <div class="fila" data-c="3"><i class="ok">${OKSVG}</i>Cierre del mes</div>
      <div class="fila" data-c="4"><i class="gr">≡</i>Ordenado</div></div>`,
    bit: (X, t) => { const k = [2, 3, 4].filter(i => t >= X.c(i) - .02).pop() ?? 2; return { x: 720, y: 1230, S: 190, senala: [X.qq('.vid .fila')[[2, 3, 4].indexOf(k)], X.c(k) + .05, null, { lado: -1, ret: false }], joy: pico(t, X.c(4), 1) * .7 }; } },
  s3: { set: 'oficina', setOpt: { dof: .8 }, entra: 'wipe',
    html: `<div class="tarj" style="left:70px;top:300px;width:780px" data-c="1" data-fx="up"><div class="cab">TABLERO GERENCIAL</div><div style="margin-top:22px">${BARRAS}</div></div>
      <div class="fila" style="position:absolute;left:70px;top:760px;width:780px;background:rgba(13,16,24,.92)" data-c="3" data-fx="pop"><i class="ok">${WA.replace('width="74" height="74"', 'width="44" height="44"')}</i>WhatsApp con IA</div>
      <div class="ej" style="left:500px;top:276px" data-c="1" data-rot="-3">Datos ilustrativos</div>`,
    anim: (X, t) => X.qq('.bar').forEach((b, i) => { const p = P(t, X.c(1) + .15 + i * .08, .45, 'out'); b.style.transform = `scaleY(${p})`; b.style.transformOrigin = '50% 100%'; b.style.transformBox = 'fill-box'; }),
    bit: (X, t) => ({ x: 720, y: 1240, S: 190, senala: ['.fila', X.c(3) + .1, null, { ret: false, lado: -1 }], joy: pico(t, X.c(4), 1.2) * .8, fl: pico(t, X.c(4), .5) }) },
  cta: cierre({ tit: ['¿Tu empresa', 'está', '<span class="r">igual?</span>'], kTit: 0, btn: 'PEDÍ TU DIAGNÓSTICO', btnFs: 60, kBtn: 2, kLink: 3, pill: 'Casos reales' }),
 } };
