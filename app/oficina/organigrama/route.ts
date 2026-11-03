import { NextResponse } from "next/server"
import { soloJulio, listar } from "@/lib/oficina"
import { AREAS } from "@/lib/oficina-seed"
import { POLITICA } from "@/lib/oficina-politica"
import { cara } from "@/lib/oficina-cara"

export const dynamic = "force-dynamic"

const e = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

export async function GET() {
  if (!(await soloJulio())) return NextResponse.redirect("https://oficina.devisebit.com/", 302)
  const ags = await listar("agentes", { orden: "orden", dir: "asc", limite: 200 })
  const porId = new Map(ags.map((a) => [a.id, a.data]))
  const jefe = porId.get("jefe-gabinete")
  const pisos = Object.keys(AREAS).map(Number).sort((a, b) => b - a)
  const fila = (a: { id: string; data: Record<string, any> }, extra = "") => `<li><span class="cara" style="--c:${e(a.data.look?.color ?? "#8a919e")}">${cara(a.id, a.data.look?.color, a.data.tipo !== "persona")}</span><div><b>${e(a.data.nombre)}</b><small>${e(a.data.rol)}</small>${extra}</div></li>`
  const tarjeta = (piso: number) => {
    const ar = AREAS[piso]
    const resp = ar.responsable ? ags.find((a) => a.id === ar.responsable) : null
    const miembros = ags.filter((a) => a.data.piso === piso && a.id !== ar.responsable && a.id !== "jefe-gabinete" && a.id !== "barbara")
    const personas = miembros.filter((a) => a.data.tipo === "persona")
    const agentes = miembros.filter((a) => a.data.tipo !== "persona")
    return `<section class="area"><header><span class="no">${piso === 0 ? "PB" : piso}</span><h3>${e(ar.titulo)}</h3></header>
<div class="resp">${resp ? `<span class="cara" style="--c:${e(resp.data.look?.color ?? "#8a919e")}">${cara(resp.id, resp.data.look?.color, false)}</span>` : ""}<div><small>${e(ar.cargo ?? "Responsable")}</small><b>${e(resp?.data.nombre ?? "A definir")}</b></div></div>
${personas.length ? `<p class="lb">Equipo</p><ul>${personas.map((a) => fila(a)).join("")}</ul>` : ""}
<p class="lb">Agentes · ${agentes.length}</p>${agentes.length ? `<ul>${agentes.map((a) => fila(a, a.data.horario ? `<em>${e(a.data.horario)}</em>` : "")).join("")}</ul>` : `<p class="vacio">Todavía sin agentes asignados.</p>`}</section>`
  }
  const grupo = (k: keyof typeof POLITICA) => `<div class="pol ${k}"><h3>${e(POLITICA[k].titulo)}</h3><ul>${POLITICA[k].items.map((i) => `<li>${e(i)}</li>`).join("")}</ul></div>`
  const hoy = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", year: "numeric" })
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Organigrama · Oficina DEVISEBIT</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root{--bg:#F1F2F4;--surface:#FFFFFF;--ink:#15171C;--muted:#5A616E;--line:#D3D7DE;--brand:#D7263D;--st-done:#12935A;--st-wait:#B86E00;--st-err:#D1343B;--f-display:"Bricolage Grotesque","Helvetica Neue",Arial,sans-serif;--f-body:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;--f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0D0E11;--surface:#16181D;--ink:#ECEEF2;--muted:#9AA1AE;--line:#2B2F38;--brand:#FF5468;--st-done:#3DD598;--st-wait:#F5A524;--st-err:#FF6B72}}
:root[data-theme="dark"]{--bg:#0D0E11;--surface:#16181D;--ink:#ECEEF2;--muted:#9AA1AE;--line:#2B2F38;--brand:#FF5468;--st-done:#3DD598;--st-wait:#F5A524;--st-err:#FF6B72}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 var(--f-body)}
h1,h2,h3{font-family:var(--f-display);margin:0}
.w{max-width:1120px;margin:0 auto;padding:12px 14px 56px}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.logo{display:flex;align-items:center;gap:10px}.mk{width:34px;height:34px;border-radius:10px;background:var(--brand);color:#fff;display:grid;place-items:center;font:800 18px var(--f-display)}
.lt b{display:block;font:700 18px/1.1 var(--f-display)}.lt small{color:var(--muted);font:500 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase}
.btn{display:inline-flex;text-decoration:none;border-radius:8px;padding:7px 14px;font:600 13px var(--f-body);border:1px solid var(--line);color:var(--ink);background:transparent}.btn.p{background:var(--ink);color:var(--bg);border-color:var(--ink)}
h1{font-size:clamp(28px,5vw,40px);line-height:1.08;margin:22px 0 6px}.lead{color:var(--muted);margin:0 0 6px;max-width:62ch}
h2{font-size:22px;margin:34px 0 4px}.sub{color:var(--muted);margin:0 0 14px}
.flow{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.flow div{background:#171A21;color:#ECEEF2;border:1px solid #2B2F38;border-radius:16px;padding:14px 16px}.flow b{display:block;color:#FF8A98;font:600 12px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.org{display:grid;gap:10px;justify-items:center}.nodo{display:flex;gap:12px;align-items:center;background:#171A21;color:#ECEEF2;border:1px solid #2B2F38;border-radius:16px;padding:10px 18px;min-width:250px}.nodo.julio{background:var(--brand);border-color:var(--brand);color:#fff}
.nodo small{display:block;opacity:.75;font:500 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase}.nodo b{font:700 18px var(--f-display)}
.fila{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.linea{width:2px;height:16px;background:var(--line)}
.cara{width:44px;height:44px;border-radius:50%;background:#222631;border:2px solid var(--c,#8a919e);display:grid;place-items:center;overflow:hidden;flex:none}.cara svg{width:100%;height:100%}
.areas{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));margin-top:14px}
.area{background:#171A21;color:#ECEEF2;border:1px solid #2B2F38;border-radius:16px;padding:14px 16px}
.area header{display:flex;align-items:center;gap:10px;margin-bottom:10px}.area h3{font-size:18px;line-height:1.15}.no{width:34px;height:34px;border-radius:10px;background:var(--brand);color:#fff;display:grid;place-items:center;font:700 15px var(--f-mono);flex:none}
.resp{display:flex;gap:10px;align-items:center;background:#ECEEF2;color:#15171C;border-radius:12px;padding:8px 12px;margin-bottom:6px}.resp small{display:block;color:#5A616E;font:500 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase}.resp b{font:700 17px var(--f-display)}
.lb{margin:12px 0 4px;font:600 11px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:#9AA1AE}
.area ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}.area li{display:flex;gap:10px;align-items:center;background:#222631;border-radius:12px;padding:6px 10px}.area li .cara{width:36px;height:36px}.area li b{font-size:14px;display:block;line-height:1.2}.area li small{display:block;color:#9AA1AE;font-size:12px;line-height:1.3}.area li em{display:block;font:400 11px var(--f-mono);color:#7C8493;font-style:normal;margin-top:1px}.vacio{color:#9AA1AE;font-size:14px;margin:0}
.pols{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.pol{background:#171A21;color:#ECEEF2;border:1px solid #2B2F38;border-top:5px solid;border-radius:16px;padding:14px 16px}.pol h3{font-size:17px;margin-bottom:8px}.pol ul{margin:0;padding-left:18px}.pol li{margin:6px 0;font-size:14px}
.pol.libre{border-top-color:#3DD598}.pol.ok{border-top-color:#F5A524}.pol.nunca{border-top-color:#FF5468}
.foot{margin-top:36px;color:var(--muted);font:400 12px var(--f-mono);border-top:1px solid var(--line);padding-top:12px}
a{color:var(--brand)}@media print{body{background:#fff}.area,.pol,.flow div{break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bar .btn{display:none}}
</style><script>try{var t=localStorage.getItem('oficina-tema');if(t)document.documentElement.dataset.theme=t}catch(e){}</script></head><body><div class="w">
<div class="bar"><div class="logo"><span class="mk">D</span><div class="lt"><b>Oficina</b><small>DEVISEBIT · Organigrama</small></div></div><a class="btn p" href="/api/oficina/vista" target="_top">Volver a la Oficina</a></div>
<h1>Cómo se maneja la Oficina</h1><p class="lead">Organigrama, responsables, agentes y reglas. Se actualiza solo cuando se suman agentes, personas o áreas.</p>
<h2>Cómo funciona</h2><p class="sub">Una sola vez, siempre el mismo camino.</p>
<div class="flow"><div><b>1 · La orden</b>Julio la escribe, la dicta o la manda por WhatsApp o llamada de voz.</div><div><b>2 · La propuesta</b>El jefe de oficina (IA) la reparte entre agentes y personas de cada área.</div><div><b>3 · El OK</b>Julio aprueba. En los temas importantes, el OK final es siempre suyo.</div><div><b>4 · La ejecución</b>Cada agente lo hace en su próxima corrida y reporta el estado en la Oficina.</div></div>
<h2>Organigrama</h2><p class="sub">Dirección, coordinación y áreas.</p>
<div class="org"><div class="nodo julio"><span class="cara" style="--c:#fff">${cara("julio", "#C8231F", false)}</span><div><small>Dirección general</small><b>${e(porId.get("julio")?.nombre ?? "Julio Miranda")}</b>OK final</div></div><div class="linea"></div>
<div class="fila"><div class="nodo"><span class="cara" style="--c:${e(porId.get("barbara")?.look?.color ?? "#F93498")}">${cara("barbara", porId.get("barbara")?.look?.color ?? "#F93498", false)}</span><div><small>Jefa de gabinete</small><b>${e(porId.get("barbara")?.nombre ?? "Bárbara")}</b>Coordina la operación</div></div><div class="nodo"><span class="cara" style="--c:${e(jefe?.look?.color ?? "#F59312")}">${cara("jefe-gabinete", jefe?.look?.color ?? "#F59312", true)}</span><div><small>Jefe de oficina · IA</small><b>${e(jefe?.nombre ?? "Jefe de oficina")}</b>Propone el reparto</div></div></div></div>
<div class="areas">${pisos.map(tarjeta).join("")}</div>
<h2>Qué puede tocar la Oficina y qué no</h2><p class="sub">Regla de oro: los agentes preparan y proponen; Julio decide lo importante.</p>
<div class="pols">${grupo("libre")}${grupo("ok")}${grupo("nunca")}</div>
<p class="foot">Actualizado el ${e(hoy)} · ${ags.filter((a) => a.data.tipo !== "persona").length} agentes y ${ags.filter((a) => a.data.tipo === "persona").length} personas · Para guardarlo como PDF usá imprimir del navegador.</p>
</div></body></html>`
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } })
}
