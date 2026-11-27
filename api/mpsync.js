// Carga automática de los gastos de Mercado Pago de Julio en MateCuentas.
// - Lo laboral (Google Ads, Meta, Claude, Vercel, DonWeb, oficina…) va al espacio DEVISEBIT SRL.
// - Todo lo demás va al espacio familiar Varela Miranda.
// Los datos los pide al puente de sistema.devisebit.com (que tiene el token); MateCuentas nunca ve el token.
// No usa IA: clasifica por palabras. Corre una vez por día con el cron y se puede correr a mano (dueño de DEVISEBIT).
import { readJ, writeJ, mutate, currentUser, spacePath, send, guard, fail, same } from './_core.js';

const DEVISEBIT = 'scpzKYE3QekU';
const FAMILIA = 'skIaY1BzkvvM';
const STATE = 'mpsync/state.json';
const INICIO = '2026-11-28'; // primer día que entra solo (lo anterior ya está cargado a mano)

// Reglas laborales: [patrón, categoría en DEVISEBIT SRL, detalle]
const LABORAL = [
  [/google\s*\*?\s*ads|adwords|google ads/i, 'cH6a387I', 'Publicidad DEVISEBIT · Google Ads'],
  [/facebk|facebook|meta\s*(ads|platforms)|instagram/i, 'cH6a387I', 'Publicidad DEVISEBIT · Meta Ads'],
  [/tiktok/i, 'cH6a387I', 'Publicidad DEVISEBIT · TikTok'],
  [/anthropic|claude\.ai/i, 'cI0D4hpM', 'Claude (Anthropic)'],
  [/vercel/i, 'cI0D4hpM', 'Vercel'],
  [/donweb|hosting para revendedores|dattatec/i, 'cI0D4hpM', 'DonWeb'],
  [/gd\s*work|circular/i, 'cdn84lGY', 'Oficina Circular (Gd Work SA)'],
  [/telnyx|twilio|retell|upwork|workana|linkedin|openai|elevenlabs|metricool|buffer|brevo|mailrelay|resend|neon|github|figma|canva|notion|google\s*one|google\s*workspace/i, 'cI0D4hpM', null],
];
// Categorías del espacio familiar (lo que no es laboral)
const CASA = [
  [/pedidosya|rappi|jumbo|coto|carrefour|disco|vea|\bdia\b|chango|super|almac|verduler|carnicer|panader/i, 'cy60vMuA'],
  [/farmac|farmacity|osde|swiss|medic|odont|laborat/i, 'cJF3Zl3c'],
  [/axion|shell|ypf|energy|puma|peaje|autopista|estacionam|uber|cabify|didi|sube|seguro/i, 'cDveB4xY'],
  [/movistar|personal|claro|starlink|edenor|edesur|metrogas|naturgy|aysa|telecentro|fibertel/i, 'cmYw13Zg'],
  [/netflix|spotify|disney|hbo|max\b|youtube|apple|cine|restaur|bar\b|cafe|café/i, 'clfSAVys'],
  [/colegio|school|escuela|jard[ií]n/i, 'cZyN9nOE'],
  [/veterin|pet|mascota/i, 'cWDZu2VE'],
];
const VARIOS = 'cJTxE0zg';
const PAGO = { account_money: 'Mercado Pago', credit_card: 'Crédito', debit_card: 'Débito', prepaid_card: 'Mercado Pago' };

async function bridge(accion, data = {}) {
  const r = await fetch(process.env.MP_BRIDGE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-matecuentas-key': process.env.MP_BRIDGE_KEY },
    body: JSON.stringify({ accion, ...data }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(502, 'Mercado Pago: ' + (j.error || r.status));
  return j;
}

// Fecha en hora de Argentina (aaaa-mm-dd)
const dia = (iso) => new Date(Date.parse(iso) - 3 * 3600e3).toISOString().slice(0, 10);
const diff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 864e5;
const sumar = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);

export function clasificar(m) {
  for (const [re, cat, det] of LABORAL) {
    if (re.test(m.detalle)) return { space: DEVISEBIT, cat, detalle: det ? `${det} · ${m.detalle}` : m.detalle, clave: det || m.detalle };
  }
  const c = CASA.find(([re]) => re.test(m.detalle));
  return { space: FAMILIA, cat: c ? c[1] : VARIOS, detalle: m.detalle, clave: null };
}

// Arma lo que hay que agregar en cada espacio, sin repetir lo ya cargado (a mano o por una corrida anterior).
export async function planificar(desde, seen = []) {
  const { movimientos } = await bridge('movimientos', { desde });
  const spaces = {};
  for (const id of [DEVISEBIT, FAMILIA]) spaces[id] = (await readJ(spacePath(id))).data;
  const plan = { [DEVISEBIT]: [], [FAMILIA]: [] };
  const reemplazos = [];
  for (const m of movimientos || []) {
    if (m.moneda && m.moneda !== 'ARS') continue;
    const fecha = dia(m.creado);
    const c = clasificar(m);
    const sp = spaces[c.space]; if (!sp) continue;
    const movs = sp.movs || [];
    if (seen.includes(m.id) || movs.some((x) => x.ref === 'mp:' + m.id)) continue; // ya entró antes (o se borró a propósito)
    // Ya cargado a mano: mismo monto con un día de diferencia como mucho
    if (movs.some((x) => x.tipo === 'out' && Math.abs((x.monto || 0) - m.monto) < 1 && diff(x.fecha, fecha) <= 1)) continue;
    // Si había un estimado del mismo concepto en ese mes, el gasto real lo reemplaza
    const est = c.clave && movs.find((x) => x.tipo === 'out' && /estimad/i.test(x.detalle || '') && (x.fecha || '').slice(0, 7) === fecha.slice(0, 7) && (x.detalle || '').toLowerCase().includes(c.clave.split(' · ').pop().toLowerCase().slice(0, 12)) && !reemplazos.some((r) => r.id === x.id));
    const data = { tipo: 'out', cat: c.cat, moneda: 'ARS', usd: null, rate: null, quien: 'julio', pago: PAGO[m.tipo] || 'Mercado Pago', detalle: c.detalle, monto: Math.round(m.monto * 100) / 100, fecha, ts: Date.now(), ref: 'mp:' + m.id, by: 'mp' };
    if (est) reemplazos.push({ space: c.space, id: est.id, data, antes: est.detalle + ' ' + est.monto });
    else plan[c.space].push(data);
  }
  return { plan, reemplazos, leidos: (movimientos || []).length };
}

export async function aplicar(desde, seen = []) {
  const r = await planificar(desde, seen);
  let n = 0;
  for (const id of [DEVISEBIT, FAMILIA]) {
    const adds = r.plan[id]; const reps = r.reemplazos.filter((x) => x.space === id);
    if (!adds.length && !reps.length) continue;
    await mutate(spacePath(id), (sp) => {
      sp.movs = sp.movs || [];
      for (const d of adds) { if (sp.movs.some((x) => x.ref === d.ref)) continue; sp.movs.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ...d }); n++; }
      for (const rep of reps) { const x = sp.movs.find((m) => m.id === rep.id); if (x) { Object.assign(x, rep.data); n++; } }
      sp.updatedAt = Date.now();
    });
  }
  return { ...r, cargados: n };
}

export async function correrDiario() {
  const { data: st } = await readJ(STATE);
  const desde = st && st.last ? sumar(st.last, -2) : INICIO; // dos días de margen por pagos que aparecen tarde
  const r = await aplicar(desde < INICIO ? INICIO : desde, (st && st.seen) || []);
  const nuevos = [...r.plan[DEVISEBIT], ...r.plan[FAMILIA], ...r.reemplazos.map((x) => x.data)].map((d) => d.ref.slice(3));
  const seen = [...new Set([...((st && st.seen) || []), ...nuevos])].slice(-1500);
  await writeJ(STATE, { last: dia(new Date().toISOString()), ts: Date.now(), cargados: r.cargados, seen }, null);
  return { desde, leidos: r.leidos, cargados: r.cargados };
}

export default guard(async (req, res) => {
  const want = process.env.CRON_SECRET;
  const got = String(req.headers.authorization || '').replace('Bearer ', '');
  if (want && got && same(got, want)) return send(res, 200, await correrDiario());
  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });
  const { data: sp } = await readJ(spacePath(DEVISEBIT));
  if (!sp || sp.owner !== me.id) return send(res, 403, { error: 'no' });
  const a = String(req.query.a || '');
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.desde || '')) ? String(req.query.desde) : INICIO;
  if (a === 'preview') return send(res, 200, await planificar(desde));
  if (a === 'run') return send(res, 200, await correrDiario());
  return send(res, 404, { error: 'accion' });
});
