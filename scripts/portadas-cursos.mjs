// Genera las portadas originales de los cursos de ACADEMIA DEVISEBIT (1200x675, JPG) con arte generativo en SVG.
// Uso: node scripts/portadas-cursos.mjs public/academia/cursos   (necesita Playwright: npx playwright install chromium). Para un curso nuevo, sumalo a CURSOS.
import { chromium } from "playwright"
import { writeFileSync } from "fs"

const OUT = process.argv[2]
const W = 1200, H = 675

// Pseudoaleatorio con semilla (cada curso siempre da la misma portada)
function rnd(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

const CURSOS = [
  { slug: "prompt-engineering-para-ejecutivos", tema: "IA aplicada", t: ["Prompt", "engineering para", "ejecutivos"], bg: "#12151C", fg: "#FFFFFF", ac: "#FF6A63", motivo: "prompt" },
  { slug: "liderazgo-en-la-era-de-la-ia", tema: "Liderazgo", t: ["Liderazgo en la", "era de la IA"], bg: "#2B1636", fg: "#FFFFFF", ac: "#F5B83D", motivo: "radar" },
  { slug: "marca-personal-en-linkedin-para-lideres", tema: "Comunicación", t: ["Marca", "personal", "en LinkedIn"], bg: "#0B3A73", fg: "#FFFFFF", ac: "#7CC4FF", motivo: "red" },
  { slug: "ia-para-tu-pyme-5-tareas-en-una-semana", tema: "Automatización", t: ["IA para tu pyme:", "5 tareas en", "una semana"], bg: "#F3B23C", fg: "#14110A", ac: "#C8231F", motivo: "tareas" },
  { slug: "whatsapp-con-ia-asistente-de-tu-negocio", tema: "WhatsApp e IA", t: ["WhatsApp con IA", "para tu negocio"], bg: "#0D5E46", fg: "#FFFFFF", ac: "#7BE0A8", motivo: "chat" },
  { slug: "introduccion-a-la-transformacion-digital", tema: "Transformación digital", t: ["Introducción", "a la transformación", "digital"], bg: "#1F3FB0", fg: "#FFFFFF", ac: "#FFD166", motivo: "escalera" },
  { slug: "panel-de-contenido-con-ia-de-cero-a-produccion", tema: "Desarrollo con IA", t: ["Creá tu panel", "de contenido", "con IA"], bg: "#0E1116", fg: "#FFFFFF", ac: "#2EC4B6", motivo: "barras" },
  { slug: "transforma-tu-empresa-con-ia-el-ecosistema-digital", tema: "Transformación digital", t: ["Transformá", "tu empresa", "con IA"], bg: "#B51F1B", fg: "#FFFFFF", ac: "#FFC2BE", motivo: "orbitas" },
]

function motivo(c) {
  const r = rnd(c.slug), a = c.ac, f = c.fg
  const X0 = 700 // el arte vive a la derecha; el título a la izquierda
  let s = ""
  switch (c.motivo) {
    case "prompt": {
      const filas = [["rol", 120], ["contexto", 200], ["tarea", 150], ["formato", 180]]
      filas.forEach(([t, w], i) => {
        const y = 120 + i * 92, x = X0 + 20 + i * 26
        s += `<rect x="${x}" y="${y}" width="${w + 120}" height="64" rx="14" fill="${i === 2 ? a : "rgba(255,255,255,.07)"}" stroke="${i === 2 ? a : "rgba(255,255,255,.22)"}" />`
        s += `<text x="${x + 22}" y="${y + 41}" font-size="26" font-weight="700" fill="${i === 2 ? "#12151C" : "rgba(255,255,255,.85)"}" font-family="Inter">[ ${t} ]</text>`
      })
      s += `<rect x="${X0 + 108}" y="508" width="5" height="40" fill="${a}"/>`
      s += `<text x="${X0 + 40}" y="540" font-size="40" font-weight="800" fill="rgba(255,255,255,.9)" font-family="Inter Display">&gt;_</text>`
      break
    }
    case "radar": {
      const cx = 930, cy = 300
      for (let i = 1; i <= 7; i++) s += `<circle cx="${cx}" cy="${cy}" r="${i * 46}" fill="none" stroke="rgba(255,255,255,${0.05 + i * 0.025})" stroke-width="2" />`
      s += `<path d="M${cx} ${cy} L${cx + 322} ${cy - 40} A322 322 0 0 0 ${cx + 250} ${cy - 205} Z" fill="${a}" opacity=".22"/>`
      for (let i = 0; i < 9; i++) { const ang = r() * Math.PI * 2, rad = 60 + r() * 250; s += `<circle cx="${cx + Math.cos(ang) * rad}" cy="${cy + Math.sin(ang) * rad}" r="${i === 0 ? 14 : 6}" fill="${i === 0 ? a : "rgba(255,255,255,.75)"}" />` }
      s += `<circle cx="${cx}" cy="${cy}" r="10" fill="${a}" />`
      break
    }
    case "red": {
      const pts = Array.from({ length: 16 }, () => [X0 + 60 + r() * 480, 60 + r() * 420])
      pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 170) s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="rgba(255,255,255,.28)" stroke-width="2"/>` }))
      pts.forEach((p, i) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 3 ? 26 : 7 + r() * 8}" fill="${i === 3 ? a : "rgba(255,255,255,.9)"}" />` })
      s += `<text x="${pts[3][0] - 12}" y="${pts[3][1] + 10}" font-size="28" font-weight="800" fill="#0B3A73" font-family="Inter">in</text>`
      break
    }
    case "tareas": {
      const etq = ["Respuestas", "Pedidos", "Seguimiento", "Actas", "Informe"]
      etq.forEach((t, i) => {
        const y = 70 + i * 82, x = X0 + 30 + (i % 2) * 36
        s += `<rect x="${x}" y="${y}" width="390" height="62" rx="16" fill="rgba(20,17,10,${i < 3 ? 0.92 : 0.12})" />`
        s += `<circle cx="${x + 34}" cy="${y + 31}" r="15" fill="${i < 3 ? a : "none"}" stroke="${i < 3 ? a : "rgba(20,17,10,.5)"}" stroke-width="3"/>`
        if (i < 3) s += `<path d="M${x + 26} ${y + 31} l6 7 l11 -13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
        s += `<text x="${x + 64}" y="${y + 40}" font-size="25" font-weight="700" fill="${i < 3 ? "#F3B23C" : "rgba(20,17,10,.7)"}" font-family="Inter">Día ${i + 1} · ${t}</text>`
      })
      break
    }
    case "chat": {
      const b = [[0, 230, "Hola, ¿tienen turno el jueves?"], [1, 260, "Sí: 10:30 o 16:00. ¿Cuál te queda mejor?"], [0, 120, "16:00"], [1, 250, "Listo, te agendé. Te llega el recordatorio."]]
      let y = 70
      b.forEach(([lado, w, t], i) => {
        const ancho = Math.min(440, t.length * 11 + 40), x = lado ? 1150 - ancho : X0 + 40
        s += `<rect x="${x}" y="${y}" width="${ancho}" height="74" rx="22" fill="${lado ? a : "rgba(255,255,255,.12)"}" />`
        s += `<text x="${x + 22}" y="${y + 46}" font-size="19" font-weight="600" fill="${lado ? "#0D5E46" : "rgba(255,255,255,.92)"}" font-family="Inter">${t}</text>`
        y += 100
      })
      break
    }
    case "escalera": {
      for (let i = 0; i < 5; i++) {
        const w = 80, x = X0 + 20 + i * (w + 12), h = 70 + i * 82
        s += `<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" rx="14" fill="${i === 4 ? a : `rgba(255,255,255,${0.1 + i * 0.07})`}" />`
        s += `<text x="${x + 18}" y="${545}" font-size="22" font-weight="800" fill="${i === 4 ? "#1F3FB0" : "rgba(255,255,255,.85)"}" font-family="Inter">N${i + 1}</text>`
      }
      s += `<path d="M${X0 + 90} ${470} C ${X0 + 200} 420, ${X0 + 320} 250, ${X0 + 440} 90" fill="none" stroke="${a}" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>`
      break
    }
    case "barras": {
      s += `<rect x="${X0}" y="60" width="460" height="470" rx="22" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)"/>`
      for (let i = 0; i < 3; i++) { s += `<rect x="${X0 + 22 + i * 142}" y="90" width="130" height="86" rx="12" fill="rgba(255,255,255,.07)"/><text x="${X0 + 36 + i * 142}" y="148" font-size="30" font-weight="800" fill="${i === 0 ? a : "#fff"}" font-family="Inter Display">${["+38%", "12,4k", "2.310"][i]}</text>` }
      for (let i = 0; i < 10; i++) { const h = 60 + r() * 230; s += `<rect x="${X0 + 30 + i * 42}" y="${500 - h}" width="28" height="${h}" rx="6" fill="${i === 7 ? "#FF6A63" : a}" opacity="${i === 7 ? 1 : 0.35 + i * 0.06}"/>` }
      break
    }
    case "orbitas": {
      const cx = 960, cy = 300
      ;[110, 185, 260].forEach((rad, i) => { s += `<ellipse cx="${cx}" cy="${cy}" rx="${rad}" ry="${rad * 0.78}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" transform="rotate(${-18 + i * 14} ${cx} ${cy})"/>` })
      s += `<circle cx="${cx}" cy="${cy}" r="58" fill="#fff"/><text x="${cx - 34}" y="${cy + 12}" font-size="32" font-weight="900" fill="#B51F1B" font-family="Inter Display">CRM</text>`
      const sat = [["Web", 0.3, 185], ["WhatsApp", 2.2, 260], ["Blog", 4.0, 110], ["Portal", 5.2, 260], ["Datos", 3.3, 185]]
      sat.forEach(([t, ang, rad]) => { const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.78; s += `<rect x="${x - 58}" y="${y - 22}" width="116" height="44" rx="22" fill="${a}"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="19" font-weight="700" fill="#7A1411" font-family="Inter">${t}</text>` })
      break
    }
  }
  return s
}

function html(c) {
  const claro = c.fg !== "#FFFFFF"
  // trama de puntos de fondo, común a todas las portadas
  const trama = `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${claro ? "rgba(20,17,10,.10)" : "rgba(255,255,255,.07)"}"/></pattern>`
  const tam = Math.min(84, Math.floor(600 / (Math.max(...c.t.map((l) => l.length)) * 0.53)))
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${c.bg}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${trama}<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${claro ? "#E89A22" : "#000"}" stop-opacity="${claro ? 1 : 0.35}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#p)"/>
${motivo(c)}
<rect x="64" y="64" width="${c.tema.length * 11.5 + 40}" height="40" rx="20" fill="${claro ? "rgba(20,17,10,.9)" : "rgba(255,255,255,.12)"}"/>
<text x="84" y="91" font-size="19" font-weight="700" fill="${claro ? "#F3B23C" : c.ac}" font-family="Inter">${c.tema}</text>
${c.t.map((l, i) => `<text x="64" y="${470 + i * (tam + 6) - (c.t.length - 1) * (tam + 6)}" font-size="${tam}" font-weight="800" letter-spacing="-2" fill="${c.fg}" font-family="Inter Display">${l}</text>`).join("")}
<rect x="64" y="${H - 104}" width="56" height="6" rx="3" fill="${claro ? "#C8231F" : c.ac}"/>
<text x="64" y="${H - 60}" font-size="22" font-weight="800" letter-spacing="1" fill="${c.fg}" font-family="Inter">DEVISE<tspan fill="${claro ? "#C8231F" : "#FF6A63"}">BIT</tspan><tspan font-weight="600" fill-opacity=".7" dx="10" font-size="17" letter-spacing="3">ACADEMIA</tspan></text>
</svg></body></html>`
}

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
for (const c of CURSOS) {
  await p.setContent(html(c))
  await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/${c.slug}.jpg`, type: "jpeg", quality: 84, clip: { x: 0, y: 0, width: W, height: H } })
  console.log(c.slug)
}
await b.close()
