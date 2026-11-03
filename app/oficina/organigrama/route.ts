import { NextResponse } from "next/server"
import { soloJulio, listar } from "@/lib/oficina"
import { AREAS } from "@/lib/oficina-seed"
import { POLITICA } from "@/lib/oficina-politica"

export const dynamic = "force-dynamic"

const e = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

export async function GET() {
  if (!(await soloJulio())) return NextResponse.redirect("https://oficina.devisebit.com/", 302)
  const ags = await listar("agentes", { orden: "orden", dir: "asc", limite: 200 })
  const porId = new Map(ags.map((a) => [a.id, a.data]))
  const jefe = porId.get("jefe-gabinete")
  const pisos = Object.keys(AREAS).map(Number).sort((a, b) => b - a)
  const tarjeta = (piso: number) => {
    const ar = AREAS[piso]
    const resp = ar.responsable ? porId.get(ar.responsable) : null
    const miembros = ags.filter((a) => a.data.piso === piso && a.id !== ar.responsable && a.id !== "jefe-gabinete" && a.id !== "barbara")
    const personas = miembros.filter((a) => a.data.tipo === "persona")
    const agentes = miembros.filter((a) => a.data.tipo !== "persona")
    return `<section class="area"><header><span class="pl">${piso === 0 ? "PB" : "Piso " + piso}</span><h3>${e(ar.titulo)}</h3></header>
<div class="resp"><small>${e(ar.cargo ?? "Responsable")}</small><b>${e(resp?.nombre ?? "A definir")}</b>${resp?.rol ? `<span>${e(resp.rol)}</span>` : ""}</div>
${personas.length ? `<p class="lb">Equipo</p><ul>${personas.map((a) => `<li><b>${e(a.data.nombre)}</b> · ${e(a.data.rol)}</li>`).join("")}</ul>` : ""}
<p class="lb">Agentes (${agentes.length})</p>${agentes.length ? `<ul>${agentes.map((a) => `<li><b>${e(a.data.nombre)}</b> · ${e(a.data.rol)}${a.data.horario ? `<em>${e(a.data.horario)}</em>` : ""}</li>`).join("")}</ul>` : `<p class="vacio">Todavía sin agentes asignados.</p>`}</section>`
  }
  const grupo = (k: keyof typeof POLITICA) => `<div class="pol ${k}"><h3>${e(POLITICA[k].titulo)}</h3><ul>${POLITICA[k].items.map((i) => `<li>${e(i)}</li>`).join("")}</ul></div>`
  const hoy = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", year: "numeric" })
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Organigrama · Oficina DEVISEBIT</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap">
<style>
:root{--ac:#C8231F;--ac2:#9E1A17;--suave:#FDECEB;--tinta:#0E1116;--gris:#4A515C;--borde:#E2E5EA;--fondo:#F5F6F8;--sup:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.55 Inter,system-ui,sans-serif}
.w{max-width:1040px;margin:0 auto;padding:0 16px 56px}
.top{background:var(--tinta);color:#fff;padding:28px 0 26px}.top .w{padding-bottom:0}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:18px}.brand img{height:34px;width:auto;background:#fff;border-radius:8px;padding:4px 8px}.brand span{font-weight:700;letter-spacing:.12em;font-size:12px;text-transform:uppercase;opacity:.8}
h1{font:700 clamp(28px,5vw,42px)/1.1 Fraunces,Georgia,serif;margin:0 0 8px}.top p{margin:0;opacity:.8;max-width:60ch}
.bar{height:6px;background:var(--ac)}
h2{font:700 24px/1.2 Fraunces,Georgia,serif;margin:40px 0 6px}.sub{color:var(--gris);margin:0 0 18px}
.flow{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.flow div{background:var(--sup);border:1px solid var(--borde);border-radius:14px;padding:14px 16px}.flow b{display:block;color:var(--ac);font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.org{display:grid;gap:12px;justify-items:center}.nodo{background:var(--sup);border:2px solid var(--tinta);border-radius:16px;padding:14px 20px;text-align:center;min-width:240px}.nodo.julio{background:var(--ac);border-color:var(--ac);color:#fff}.nodo small{display:block;opacity:.75;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.nodo b{font-size:19px}
.fila{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}.linea{width:2px;height:18px;background:var(--borde-f,#C3C8D1)}
.areas{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:14px}
.area{background:var(--sup);border:1px solid var(--borde);border-top:5px solid var(--ac);border-radius:14px;padding:16px 18px}
.area header{display:flex;align-items:center;gap:10px;margin-bottom:10px}.area h3{margin:0;font:700 19px/1.2 Fraunces,Georgia,serif}.pl{background:var(--suave);color:var(--ac2);font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:3px 9px;white-space:nowrap}
.resp{background:var(--tinta);color:#fff;border-radius:12px;padding:10px 14px;margin-bottom:10px}.resp small{display:block;opacity:.7;font-size:12px;text-transform:uppercase;letter-spacing:.07em}.resp b{font-size:18px;display:block}.resp span{display:block;opacity:.8;font-size:13px}
.lb{margin:12px 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--gris)}.area ul{margin:0;padding-left:18px}.area li{margin:4px 0;font-size:14.5px}.area li em{display:block;font-style:normal;color:var(--gris);font-size:13px}.vacio{color:var(--gris);font-size:14px;margin:0}
.pols{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.pol{background:var(--sup);border:1px solid var(--borde);border-radius:14px;padding:16px 18px;border-top:5px solid}.pol h3{margin:0 0 8px;font-size:17px}.pol ul{margin:0;padding-left:18px}.pol li{margin:6px 0;font-size:14.5px}
.pol.libre{border-top-color:#14935a}.pol.ok{border-top-color:#E0A100}.pol.nunca{border-top-color:var(--ac)}
.foot{margin-top:40px;color:var(--gris);font-size:13px;border-top:1px solid var(--borde);padding-top:14px}
a{color:var(--ac)}@media print{.top{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{background:#fff}.area,.pol,.flow div{break-inside:avoid}}
</style></head><body>
<div class="top"><div class="w"><div class="brand"><img src="/marca/logo-devisebit.png" alt="DEVISEBIT"><span>Oficina · Documento vivo</span></div><h1>Cómo se maneja la Oficina</h1><p>Organigrama, responsables, agentes y reglas. Se actualiza solo cuando se suman agentes, personas o áreas.</p></div></div><div class="bar"></div>
<div class="w">
<h2>Cómo funciona</h2><p class="sub">Una sola vez, siempre el mismo camino.</p>
<div class="flow"><div><b>1 · La orden</b>Julio la escribe, la dicta o la manda por WhatsApp o llamada de voz.</div><div><b>2 · La propuesta</b>El jefe de oficina (IA) la reparte entre agentes y personas de cada área.</div><div><b>3 · El OK</b>Julio aprueba. En los temas importantes, el OK final es siempre suyo.</div><div><b>4 · La ejecución</b>Cada agente lo hace en su próxima corrida y reporta el estado en la Oficina.</div></div>
<h2>Organigrama</h2><p class="sub">Dirección, coordinación y áreas.</p>
<div class="org"><div class="nodo julio"><small>Dirección general</small><b>${e(porId.get("julio")?.nombre ?? "Julio Miranda")}</b>OK final</div><div class="linea"></div>
<div class="fila"><div class="nodo"><small>Jefa de gabinete</small><b>${e(porId.get("barbara")?.nombre ?? "Bárbara")}</b>Coordina la operación</div><div class="nodo"><small>Jefe de oficina · IA</small><b>${e(jefe?.nombre ?? "Jefe de oficina")}</b>Recibe órdenes y propone el reparto</div></div></div>
<div class="areas">${pisos.map(tarjeta).join("")}</div>
<h2>Qué puede tocar la Oficina y qué no</h2><p class="sub">Regla de oro: los agentes preparan y proponen; Julio decide lo importante.</p>
<div class="pols">${grupo("libre")}${grupo("ok")}${grupo("nunca")}</div>
<p class="foot">Actualizado el ${e(hoy)} · ${ags.filter((a) => a.data.tipo !== "persona").length} agentes y ${ags.filter((a) => a.data.tipo === "persona").length} personas · <a href="/">Volver a la Oficina</a> · Para guardarlo como PDF usá imprimir del navegador.</p>
</div></body></html>`
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } })
}
