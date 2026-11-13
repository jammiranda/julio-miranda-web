// Mostrador de un local: las cinco preguntas de todos los dias llegan como globos.
const GL = (n, q, top, c, fs = 58, o = 0) => `<div class="globo" style="left:70px;top:${top}px;font-size:${fs}px" data-c="${c}" data-o="${o}"><i>${n}</i>${q}</div>`;
window.PIEZA = { portada: { t: 1.4, tit: '<span>5 PREGUNTAS QUE</span><br><b>CONTESTO SOLO</b>', top: 1300 }, etq: { esc: 'gancho', c: 1 },
 escenas: {
  gancho: { set: 'mostrador', setOpt: { dof: .15 }, html: `<div class="num" style="left:50px;top:300px;font-size:560px" data-s="0.02" data-fx="slam">5</div>`, bit: (X, t) => ({ x: 660, y: 760, S: 215, fondo: .4 }) },
  s1: { set: 'mostrador', setOpt: { dof: .8 }, html: GL(1, '¿Qué horario tienen?', 300, 0) + GL(2, '¿Cuánto sale?', 470, 1) + `<div class="vid" style="left:70px;top:680px;width:850px" data-c="2" data-fx="up"><div class="cab">CÓMO LO RESPONDO</div><div style="font-size:66px;font-weight:900;letter-spacing:-.03em;line-height:1.06;margin-top:14px">Con la info que carga <span class="r">tu negocio</span></div></div>`,
    bit: (X, t) => ({ x: 700, y: 1180, S: 200, senala: t < X.c(2) ? [X.qq('.globo')[t < X.c(1) ? 0 : 1], X.c(t < X.c(1) ? 0 : 1) + .05, null, { ret: false, lado: -1 }] : ['.vid', X.c(2) + .1, null, { ret: false, dx: 250 }] }) },
  s2: { set: 'mostrador', setOpt: { dof: .8, tf: 4.5 }, html: GL(3, '¿Cómo llego?', 300, 0) + GL(4, '¿Qué requisitos piden?', 470, 1) + GL(5, '¿Qué medios de pago aceptan?', 640, 2, 47) + `<div class="tag" style="left:70px;top:830px;font-size:44px" data-c="3" data-o=".35" data-rot="-3">Todos los días, las mismas</div>`,
    bit(X, t) { const k = [0, 1, 2].filter(i => t >= X.c(i) - .02).pop() ?? 0; return { x: 700, y: 1150, S: 200, senala: [X.qq('.globo')[k], X.c(k) + .05, null, { ret: false, lado: k === 2 ? 0 : -1 }], joy: pico(t, X.c(3) + .3, 1) * .6 }; } },
  cta: cierre({ tit: ['Soy Bit,', 'un asistente', '<span class="r">con IA</span>'], kTit: 0, btn: 'PEDÍ LA DEMO', kBtn: 3, kLink: 4 }),
 } };
