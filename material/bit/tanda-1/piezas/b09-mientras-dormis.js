// Bit de turno noche: la hora avanza de escena en escena y a la manana (calle de dia) esta el resumen.
window.PIEZA = { portada: { t: 1.3, tit: '<span>MIENTRAS</span><br><b>DORMÍS</b>' }, etq: { esc: 'gancho', c: 1 },
 escenas: {
  gancho: { set: 'calle', setOpt: { dof: .55 }, html: HORA('01:12') + `<div class="T" style="top:290px;font-size:128px" data-s="0.1" data-fx="up">Turno<br><b>noche</b></div>`,
    bit: (X, t) => ({ x: 540, y: 960, S: 250, fl: pico(t, X.c(1), .5) }) },
  s1: { set: 'marca', html: HORA('02:30') + `<div class="tel" style="left:60px;top:300px;width:480px;height:980px;transform:rotate(-2deg)">${TELTOP()}
      <div class="bub in" style="top:136px" data-c="0">Hola, ¿hasta qué hora atienden?<small>02:30</small></div><div class="bub out" style="top:332px" data-c="1">¡Hola! Soy Bit, asistente con IA. De 9 a 20 h.<small>02:30</small></div>
      <div class="bub in" style="top:566px" data-c="2">¿Tienen turno para mañana?<small>02:31</small></div><div class="turno" style="top:762px" data-c="3"><div class="ok">${OKSVG}</div><div><div class="t1">Turno agendado</div><div class="t2">Mañana · 16:30</div></div></div></div>`,
    cam: X => [[0, 0, 'lin', 540, 960, 1], [X.c(0), .26, 'back', 470, 790, 1.2], [X.c(2) - .1, .3, 'io', 470, 1010, 1.2], [X.c(3), .22, 'back', 480, 1090, 1.24]],
    bit(X, t) { const k = [0, 1, 2, 3].filter(i => t >= X.c(i) - .02).pop() ?? 0, el = X.qq('.bub,.turno')[k]; return { x: 778, y: 800, S: 196, senala: [el, X.c(k) + .05, null, { lado: -1, ret: k === 3 }], joy: pico(t, X.c(3), 1.4), fl: pico(t, X.c(3), .5) }; } },
  s2: { set: 'calle', setOpt: { dof: .78, t0: 9 }, html: HORA('04:05') + `<div class="vid" style="left:70px;top:300px;width:850px" data-s="0.05" data-fx="up"><div class="cab">DERIVACIÓN · chat simulado</div>
      <div class="fila" data-s=".2"><i>?</i>Una consulta que necesita a una persona</div><div class="fila" data-c="2"><i class="ok">${OKSVG}</i>Pasa a tu equipo</div><div class="fila" data-c="3" data-o=".25"><i class="gr">≡</i>Con todo el historial</div></div>`,
    bit: (X, t) => ({ x: 700, y: 1160, S: 205, senala: ['.vid', X.c(1), null, { ret: false, dx: 240 }] }) },
  s3: { set: 'calle', setOpt: { dia: 1, abierto: 1, dof: .5, t0: 20 }, entra: 'wipe', html: HORA('07:30') + `<div class="tarj" style="left:70px;top:330px;width:850px" data-s="0.08" data-fx="up"><div class="cab">RESUMEN DE LA NOCHE</div>
      <div class="fila" data-c="0" data-o=".25"><i class="gr">6</i>Consultas respondidas</div><div class="fila" data-c="0" data-o=".45"><i class="ok">2</i>Turnos agendados</div><div class="fila" data-c="0" data-o=".65"><i>1</i>Para tu equipo</div></div><div class="ej" style="left:560px;top:306px" data-s="0.3" data-rot="-3">Ejemplo ilustrativo</div>`,
    bit: (X, t) => ({ x: 700, y: 1170, S: 205, senala: ['.tarj', X.c(1), null, { ret: false, dx: 240 }], joy: pico(t, X.c(1), 1) * .7 }) },
  cta: cierre({ tit: ['Soy Bit,', 'tu asistente', '<span class="r">con IA</span>'], kTit: 0, btn: 'PEDÍ LA DEMO', kBtn: 3, kLink: 4 }),
 } };
