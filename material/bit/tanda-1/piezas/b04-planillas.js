// Pantalla partida: la misma tarea con planillas y con un sistema. Sin cifras: un indicador que sigue girando y otro que termina.
const GIRA = '<svg class="gira" width="56" height="56" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3"/><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#FF6A63" stroke-width="3" stroke-linecap="round"/></svg>';
const HOJA = '<svg width="378" height="150" viewBox="0 0 378 150">' + Array.from({ length: 20 }, (_, i) => `<rect x="${(i % 5) * 76}" y="${Math.floor(i / 5) * 38}" width="72" height="34" rx="5" fill="${i < 5 ? '#2F7D5B' : 'rgba(255,255,255,.12)'}"/>`).join('') + '</svg>';
const PANELES = (act, c) => `<div class="vid pan p-izq" style="left:60px;top:290px;width:430px;height:690px;opacity:${act ? 1 : .45}"><div class="cab" style="color:#FF6A63">CON PLANILLAS</div><div style="margin-top:16px">${HOJA}</div>
   <div class="paso" ${c(1)}><i>1</i>Buscar el archivo</div><div class="paso" ${c(2)}><i>2</i>Copiar y pegar</div><div class="paso" ${c(3)}><i>3</i>Avisar a mano</div><div class="est">${GIRA}Sigue…</div></div>
  <div class="vid pan p-der" style="left:510px;top:290px;width:430px;height:690px;opacity:${act ? .35 : 1}"><div class="cab">CON UN SISTEMA</div><div style="margin-top:16px;border-radius:16px;background:rgba(110,226,255,.1);border:1.5px solid rgba(110,226,255,.4);height:150px;padding:18px">${lineas(3, 100, 'rgba(255,255,255,.3)', 16, 14)}</div>
   <div class="paso" ${act ? '' : c(1)}><i style="background:#18A957">1</i>Cargar una vez</div><div class="paso" ${act ? '' : c(2)}><i style="background:#18A957">2</i>Todos lo ven</div><div class="est" style="background:#18A957" ${act ? 'style="opacity:0"' : c(3)}>${OKSVG}Listo</div></div>
  <div class="ej" style="left:300px;top:1004px">Comparación ilustrativa</div>`;
const gira = (X, t) => X.qq('.gira').forEach(g => g.style.transform = `rotate(${t * 300}deg)`);
window.PIEZA = { portada: { t: 1.8, tit: '<span>PLANILLA</span><br><b>CONTRA SISTEMA</b>' }, etq: { esc: 'gancho', c: 0 },
 escenas: {
  gancho: { set: 'oficina', setOpt: { dof: .35 }, html: `<div class="gt" style="left:70px;top:300px;background:#F4F1EC;color:#11141B" data-s="0.05" data-fx="left" data-rot="-4">PLANILLA</div><div class="gt" style="left:330px;top:520px;background:var(--r)" data-c="1" data-fx="right" data-rot="3">SISTEMA</div>`,
    bit: (X, t) => ({ x: 520, y: 1010, S: 225, fondo: .4 }) },
  s1: { set: 'grilla', html: PANELES(1, k => `data-c="${k}" data-fx="left"`).replace('<div class="est" style="background:#18A957" style="opacity:0">', '<div class="est" style="background:#18A957;opacity:0">'), anim: gira,
    bit: (X, t) => ({ x: 500, y: 1235, S: 170, senala: ['.p-izq', X.c(0) + .2, null, { ret: false, arr: 0, lado: 0, dx: -40 }], look: [-.8, -.8] }) },
  s2: { set: 'grilla', entra: 'corte', html: PANELES(0, k => `data-c="${k}" data-fx="right"`), anim: gira,
    bit: (X, t) => ({ x: 500, y: 1235, S: 170, senala: ['.p-der', X.c(0) + .2, null, { ret: false, dx: 40 }], look: [.8, -.8], joy: pico(t, X.c(3), 1) * .7 }) },
  s3: { set: 'oficina', setOpt: { dof: .82 }, html: `<div class="T" style="top:300px;font-size:88px" data-c="0" data-fx="up">Un módulo base<br>suele estar en</div><div class="num" style="left:60px;top:530px;font-size:250px;white-space:nowrap" data-c="2" data-fx="slam">3 a 6</div><div class="T" style="top:790px;font-size:150px" data-c="2" data-o=".2" data-fx="up">semanas</div>`,
    bit: (X, t) => ({ x: 720, y: 1230, S: 175, fl: pico(t, X.c(2), .5) }) },
  cta: cierre({ tit: ['Diagnóstico', 'de 30 minutos,', '<span class="r">sin cargo</span>'], kTit: 0, btn: 'PEDÍ EL DIAGNÓSTICO', btnFs: 64, kBtn: 0, kLink: 1, pill: 'Sistemas a medida' }),
 } };
