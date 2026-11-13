// Decorado propio: calle de noche con un local cerrado ("TU NEGOCIO"), farol y edificios. Devuelve SVG en coordenadas de mundo (x -600..1680, y 0..2300).
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function cieloSVG() { const r = rnd(11); let s = '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090B14"/><stop offset=".55" stop-color="#161A30"/><stop offset="1" stop-color="#3A1A2A"/></linearGradient><radialGradient id="lu"><stop offset="0" stop-color="#FFE9D6" stop-opacity=".5"/><stop offset="1" stop-color="#FFE9D6" stop-opacity="0"/></radialGradient></defs><rect x="-600" y="-200" width="2280" height="1100" fill="url(#cg)"/>';
  for (let i = 0; i < 70; i++) s += `<circle cx="${-600 + r() * 2280}" cy="${r() * 420}" r="${1 + r() * 2.2}" fill="#fff" opacity="${.25 + r() * .6}"/>`;
  return s + '<circle cx="905" cy="235" r="130" fill="url(#lu)"/><circle cx="905" cy="235" r="44" fill="#FFF1E2"/>'; }
function lejosSVG() { const r = rnd(5); let s = '', x = -600; while (x < 1680) { const w = 90 + r() * 150, h = 120 + r() * 250, y = 470 - h; s += `<rect x="${x}" y="${y}" width="${w}" height="${h + 40}" fill="#141829"/>`;
    for (let a = x + 14; a < x + w - 22; a += 30) for (let b = y + 18; b < 440; b += 40) if (r() < .3) s += `<rect x="${a}" y="${b}" width="14" height="20" fill="${r() < .3 ? '#FF8A7A' : '#FFD88A'}" opacity="${.35 + r() * .5}"/>`; x += w + 4; } return s; }
function calleSVG() { const r = rnd(23); let s = `<defs>
<linearGradient id="cono" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD2A8" stop-opacity=".42"/><stop offset="1" stop-color="#FFD2A8" stop-opacity=".03"/></linearGradient>
<radialGradient id="foco"><stop offset="0" stop-color="#FFF3E0"/><stop offset=".25" stop-color="#FFC592" stop-opacity=".7"/><stop offset="1" stop-color="#FFC592" stop-opacity="0"/></radialGradient>
<linearGradient id="vereda" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A5070"/><stop offset="1" stop-color="#2E3349"/></linearGradient>
<linearGradient id="toldo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3403A"/><stop offset="1" stop-color="#A51B18"/></linearGradient>
<radialGradient id="charco" ><stop offset="0" stop-color="#FFC592" stop-opacity=".28"/><stop offset="1" stop-color="#FFC592" stop-opacity="0"/></radialGradient></defs>`;
  // edificios
  s += `<rect x="-600" y="330" width="720" height="980" fill="#1D2236"/><rect x="100" y="400" width="880" height="910" fill="#2B3150"/><rect x="960" y="360" width="720" height="950" fill="#222841"/>`;
  s += `<rect x="100" y="400" width="880" height="16" fill="#3A4166"/><rect x="100" y="575" width="880" height="10" fill="#1F2440"/>`;
  for (let i = 0; i < 5; i++) { const x = 150 + i * 168, on = [1, 3].includes(i); s += `<rect x="${x}" y="445" width="106" height="110" rx="6" fill="${on ? '#FFD88A' : '#161A2C'}" opacity="${on ? .85 : 1}"/><path d="M${x + 53},445 v110 M${x},500 h106" stroke="#2B3150" stroke-width="5"/>`; }
  for (const [x0, x1, y0] of [[-560, 60, 380], [1010, 1640, 410]]) for (let x = x0; x < x1 - 80; x += 150) for (let y = y0; y < 1040; y += 165) { const on = r() < .28; s += `<rect x="${x}" y="${y}" width="92" height="112" rx="5" fill="${on ? '#FFD88A' : '#12162A'}" opacity="${on ? .7 : 1}"/>`; }
  s += `<rect x="-420" y="1040" width="330" height="270" fill="#141829"/><rect x="1180" y="1020" width="300" height="290" rx="4" fill="#151A2E"/>`;
  // local: cartel, toldo, vidriera y persiana baja
  s += `<rect x="170" y="604" width="760" height="116" rx="14" fill="#11142A" stroke="#454C74" stroke-width="5"/><g id="neon"><text x="550" y="692" text-anchor="middle" font-family="Inter" font-weight="900" font-size="84" letter-spacing="6" fill="#737A9C">TU NEGOCIO</text></g>`;
  s += `<path d="M150,728 H950 L990,812 H110 Z" fill="url(#toldo)"/>`; for (let i = 0; i < 8; i++) { const a = 200 + i * 100, b = a + 50, f = x => 550 + (x - 550) * 1.1; s += `<path d="M${a},728 H${b} L${f(b)},812 H${f(a)} Z" fill="#F4E9E2" opacity=".92"/>`; }
  for (let i = 0; i < 11; i++) s += `<path d="M${110 + i * 80},812 a40,40 0 0 0 80,0 Z" fill="${i % 2 ? '#F4E9E2' : '#B5201C'}"/>`;
  s += `<rect x="150" y="832" width="800" height="478" fill="#1A1F38"/><rect x="186" y="868" width="330" height="400" rx="8" fill="#0E1224" stroke="#3A4166" stroke-width="8"/><path d="M210,1240 L330,892 M290,1240 L410,892" stroke="#fff" stroke-opacity=".06" stroke-width="26"/>`;
  s += `<rect x="560" y="868" width="350" height="442" fill="#262C48" stroke="#3A4166" stroke-width="8"/>`; for (let y = 884; y < 1300; y += 26) s += `<rect x="568" y="${y}" width="334" height="15" rx="4" fill="#353C60"/>`;
  s += `<rect x="706" y="1272" width="58" height="26" rx="6" fill="#11142A"/>`;
  // farol y luz
  s += `<path d="M905,548 L560,1450 L1160,1450 Z" fill="url(#cono)"/><ellipse cx="850" cy="1380" rx="330" ry="70" fill="url(#charco)"/>`;
  // vereda, cordon y calle
  s += `<rect x="-600" y="1300" width="2280" height="150" fill="url(#vereda)"/>`; for (let x = -600; x < 1680; x += 120) s += `<path d="M${x},1300 l-36,150" stroke="#23283C" stroke-width="3"/>`;
  s += `<rect x="-600" y="1450" width="2280" height="24" fill="#5C6384"/><rect x="-600" y="1474" width="2280" height="900" fill="#12151F"/>`; for (let x = -560; x < 1680; x += 300) s += `<rect x="${x}" y="1760" width="150" height="14" rx="4" fill="#fff" opacity=".13"/>`;
  s += `<rect x="1003" y="540" width="16" height="770" fill="#0C0E18"/><rect x="993" y="1250" width="36" height="60" rx="6" fill="#0C0E18"/><path d="M1011,548 Q1005,500 905,512" fill="none" stroke="#0C0E18" stroke-width="14" stroke-linecap="round"/><path d="M868,508 h74 l-12,34 h-50 Z" fill="#0C0E18"/><circle id="foco_c" cx="905" cy="548" r="92" fill="url(#foco)"/>`;
  return s; }
// Cartel colgante de la puerta (se balancea): grupo aparte para poder rotarlo
function cartelSVG() { return `<g id="cartel"><path d="M735,930 L655,985 M735,930 L815,985" stroke="#C9CEDF" stroke-width="4" fill="none"/><circle cx="735" cy="930" r="7" fill="#C9CEDF"/><rect x="615" y="980" width="240" height="96" rx="14" fill="#F4E9E2" stroke="#B5201C" stroke-width="8"/><text x="735" y="1046" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" letter-spacing="2" fill="#B5201C">CERRADO</text></g>`; }
