// Pieza de confianza: Bit en primer plano y tres compromisos.
const NO = t => `<div class="T" style="top:545px;font-size:98px" data-c="1" data-fx="up">${t}</div>`;
window.PIEZA = { portada: { t: 1.1, tit: '<span>3 COSAS QUE</span><br><b>NO HAGO</b>' }, etq: { esc: 's2', c: 4, dur: 2.6 },
 escenas: {
  gancho: { set: 'grilla', html: `<div class="hueco" style="left:40px;top:150px;font-size:560px" data-s="0.02" data-fx="slam">NO</div>`, bit: (X, t) => ({ x: 520, y: 900, S: 300, fl: pico(t, X.c(1), .5), look: [0, 0] }) },
  s1: punto(1, { entra: 'corte', tit: 'No <b>invento</b><br>respuestas', apunta: '.vid', kAp: 3, opAp: { ret: false, lado: -1 },
    vis: `<div class="vid" style="left:70px;top:800px;width:850px" data-c="3" data-fx="up"><div class="cab">RESPONDO CON LA INFORMACIÓN DE TU NEGOCIO</div><div class="fila" data-c="3" data-o=".15"><i class="ok">${OKSVG}</i>Horarios y servicios</div><div class="fila" data-c="4" data-o=".1"><i class="ok">${OKSVG}</i>Preguntas frecuentes</div><div class="fila" data-c="5"><i class="ok">${OKSVG}</i>Lo que vos cargues</div></div>` }),
  s2: punto(2, { tit: 'No me hago pasar<br>por <b>una persona</b>', titFs: 92, apunta: '.globo', kAp: 3, opAp: { ret: false, lado: -1 },
    vis: `<div class="globo" style="left:70px;top:830px;white-space:normal;width:820px;font-size:72px;line-height:1.08" data-c="3">Hola, soy Bit, el <span style="color:#B5201C">asistente con IA</span> de Tu negocio.</div><div class="ej" style="left:86px;top:1190px" data-c="3" data-o=".3" data-rot="-2">Así me presento · chat simulado</div>` }),
  s3: punto(3, { tit: 'Si <b>no sé</b>,<br>te paso con el equipo', titFs: 92, apunta: '.vid', kAp: 3, opAp: { ret: false, lado: -1 },
    vis: `<div class="vid" style="left:70px;top:830px;width:850px;display:flex;align-items:center;gap:30px;padding:44px 40px" data-c="2" data-fx="up"><div class="chipg" style="position:static;border-color:#FF6A63;font-size:56px;padding:18px 30px">BIT</div><svg width="110" height="50" viewBox="0 0 110 50"><path d="M4 25h92M78 8l20 17-20 17" fill="none" stroke="#6EE2FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg><div style="display:flex;align-items:center;gap:16px;font-size:60px;font-weight:900;white-space:nowrap"><svg width="92" height="92" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.2" fill="#fff"/><path d="M3.5 21c.6-5 4-7 8.500-7s7.900 2 8.500 7z" fill="#fff"/></svg>Tu equipo</div></div>
      <div class="fila" style="left:70px;top:1120px;width:850px;margin:0;background:rgba(13,16,24,.92);border:1.5px solid rgba(255,255,255,.22)" data-c="5"><i class="gr">≡</i>Con todo el historial de la charla</div>` }),
  cta: cierre({ tit: ['Probá cómo', '<span class="r">te respondo</span>'], kTit: 0, btn: 'PEDÍ LA DEMO', kBtn: 0, kLink: 1 }),
 } };
