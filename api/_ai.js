// Inteligencia artificial vía Vercel AI Gateway: transcribir audios y entender gastos (texto o foto).
const GW = 'https://ai-gateway.vercel.sh';
const MODEL = process.env.AI_MODEL || 'anthropic/claude-haiku-5.5';
const STT = process.env.STT_MODEL || 'openai/gpt-4o-mini-transcribe';

function token(req) {
  return process.env.AI_GATEWAY_API_KEY || (req && req.headers['x-vercel-oidc-token']) || process.env.VERCEL_OIDC_TOKEN || '';
}

const PROXY = () => process.env.AI_PROXY_URL;
async function proxy(body) {
  const r = await fetch(PROXY(), { method: 'POST', headers: { 'content-type': 'application/json', 'x-bot-key': process.env.BOT_KEY }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('proxy ' + r.status);
  return (await r.json()).text || '';
}

export async function transcribe(req, b64, mediaType) {
  if (PROXY()) return String(await proxy({ op: 'transcribe', audio: b64, mime: mediaType })).trim();
  const r = await fetch(GW + '/v4/ai/transcription-model', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token(req), 'Content-Type': 'application/json',
      'ai-gateway-protocol-version': '0.0.1', 'ai-transcription-model-specification-version': '4', 'ai-model-id': STT,
    },
    body: JSON.stringify({ audio: b64, mediaType: mediaType || 'audio/webm', providerOptions: { openai: { language: 'es' } } }),
  });
  if (!r.ok) throw new Error('transcripción ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const j = await r.json();
  return String(j.text || '').trim();
}

async function chat(req, messages, maxTokens = 900) {
  if (PROXY()) {
    const sys = messages[0].content; const u = messages[1].content;
    const content = (Array.isArray(u) ? u : [{ type: 'text', text: String(u) }]).map((c) => {
      if (c.type !== 'image_url') return { type: 'text', text: c.text };
      const m = c.image_url.url.match(/^data:(image\/[a-z]+|application\/pdf);base64,(.*)$/);
      return { type: m[1] === 'application/pdf' ? 'document' : 'image', source: { type: 'base64', media_type: m[1], data: m[2] } };
    });
    return proxy({ op: 'chat', system: sys, content, max_tokens: maxTokens });
  }
  const r = await fetch(GW + '/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token(req), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature: 0, messages }),
  });
  if (!r.ok) throw new Error('modelo ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const j = await r.json();
  return String((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '');
}

function firstJson(txt) {
  const a = txt.indexOf('{'); const b = txt.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(txt.slice(a, b + 1)); } catch (e) { return null; }
}

function todayAr() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }

// Devuelve { items: [...], nota } a partir de texto libre o una imagen (ticket, factura, resumen de tarjeta).
export async function parseMoves(req, { text, image, space }) {
  const cats = (space.cats || []).map((c) => `${c.id} | ${c.tipo === 'in' ? 'ingreso' : 'gasto'} | ${c.name}`).join('\n');
  const people = ((space.settings && space.settings.people) || []).join(', ');
  const pagos = ((space.settings && space.settings.pagos) || []).join(', ');
  const sys = `Sos MateCuentas, el que lleva las cuentas de una casa argentina. Convertís lo que te cuentan (o una foto de ticket, factura o resumen) en movimientos de dinero.
Hoy es ${todayAr()} (Argentina).
Categorías disponibles (id | tipo | nombre):
${cats}
Personas: ${people || '—'}. Medios de pago: ${pagos || '—'}.
Reglas:
- Respondé SOLO un JSON: {"items":[{"tipo":"out"|"in","monto":number,"moneda":"ARS"|"USD","cat":"<id>","detalle":"texto corto","fecha":"YYYY-MM-DD","quien":"nombre o vacío","pago":"medio o vacío","cuotas":number}],"nota":""}
- "lucas" o "k" = miles (12 lucas = 12000). "palo" = millón. "verdes", "dólares", "USD" = moneda USD.
- Elegí siempre el id de categoría más razonable de la lista. Gastos usan categorías de gasto; ingresos, de ingreso.
- Fechas relativas ("ayer", "el lunes") → fecha concreta pasada. Si no dice, usá hoy.
- "en 6 cuotas" → cuotas 6 (monto = total de la compra). Si no dice, cuotas 1.
- "quien": solo si nombra a alguien de la lista o dice "yo" (dejá vacío). "pago": solo si lo dice ("con débito", "con la Visa" → el medio de la lista más parecido).
- Ticket o factura: un solo item con el TOTAL y el comercio como detalle. Resumen de tarjeta: un item por consumo.
- Nunca inventes montos. Si no hay ningún monto claro, devolvé items vacío y explicá en nota en una línea, en argentino.
- "nota" va vacía siempre que haya al menos un item: no pidas datos que faltan (medio de pago, quién, detalle).
- Electrodomésticos, muebles y arreglos de la casa van a la categoría de hogar/alquiler/varios más parecida.`;
  const content = [];
  if (image) content.push({ type: 'image_url', image_url: { url: image } });
  content.push({ type: 'text', text: text ? `Mensaje: ${text}` : 'Leé la imagen o el PDF y cargá lo que corresponda.' });
  const out = await chat(req, [{ role: 'system', content: sys }, { role: 'user', content }], 1500);
  const j = firstJson(out) || { items: [], nota: 'No pude entenderlo, probá de nuevo con el monto y en qué fue.' };
  const ids = new Set((space.cats || []).map((c) => c.id));
  const items = (Array.isArray(j.items) ? j.items : []).slice(0, 40).map((it) => ({
    tipo: it.tipo === 'in' ? 'in' : 'out',
    monto: Math.abs(Number(it.monto) || 0),
    moneda: it.moneda === 'USD' ? 'USD' : 'ARS',
    cat: ids.has(it.cat) ? it.cat : '',
    detalle: String(it.detalle || '').slice(0, 120),
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(it.fecha || '') ? it.fecha : todayAr(),
    quien: String(it.quien || '').slice(0, 40),
    pago: String(it.pago || '').slice(0, 30),
    cuotas: Math.max(1, Math.min(36, Math.round(Number(it.cuotas) || 1))),
  })).filter((it) => it.monto > 0);
  for (const it of items) if (!it.cat) { const c = (space.cats || []).find((x) => x.tipo === it.tipo); it.cat = c ? c.id : ''; }
  return { items, nota: String(j.nota || '').slice(0, 200) };
}
