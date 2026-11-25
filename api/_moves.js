// Convierte movimientos entendidos por la IA en operaciones del espacio (lo usa el bot de WhatsApp/Telegram).
import crypto from 'node:crypto';
const rid = () => crypto.randomBytes(6).toString('base64url');
const addM = (m, k) => { let [y, mo] = m.split('-').map(Number); mo += k; while (mo > 12) { mo -= 12; y++; } return y + '-' + String(mo).padStart(2, '0'); };
export const fmt = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');

export async function fxRate(type = 'blue') {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares');
    const j = await r.json();
    const d = j.find((x) => x.casa === type) || j.find((x) => x.casa === 'blue');
    return d ? d.venta : null;
  } catch (e) { return null; }
}

// Devuelve { ops, lines } (lines = resumen legible de lo cargado)
export async function buildOps(items, space, { pro, by }) {
  const ops = []; const lines = [];
  let rate = null;
  for (const it of items) {
    const cat = (space.cats || []).find((c) => c.id === it.cat) || { name: 'Sin categoría', emoji: '•' };
    let monto = it.monto; let usd = null; let moneda = 'ARS'; let detalle = it.detalle || '';
    if (it.moneda === 'USD') {
      rate = rate || (await fxRate((space.settings && space.settings.fx) || 'blue'));
      if (!rate) continue;
      usd = monto; monto = Math.round(monto * rate * 100) / 100;
      if (pro) moneda = 'USD'; else detalle = (detalle ? detalle + ' ' : '') + `(US$ ${usd})`;
    }
    const base = { tipo: it.tipo, cat: it.cat, moneda, usd: moneda === 'USD' ? usd : null, rate: moneda === 'USD' ? rate : null, quien: it.quien || by || '', pago: it.pago || '', detalle, ts: Date.now() };
    const n = it.tipo === 'out' && pro ? it.cuotas || 1 : 1;
    if (n > 1) {
      const grp = 'g' + rid(); const each = Math.round(monto / n * 100) / 100;
      for (let i = 0; i < n; i++) {
        const m = addM(it.fecha.slice(0, 7), i); const last = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
        ops.push({ col: 'movs', action: 'add', id: 'm' + rid(), data: { ...base, monto: each, usd: base.usd ? Math.round(base.usd / n * 100) / 100 : null, fecha: m + '-' + String(Math.min(+it.fecha.slice(8, 10), last)).padStart(2, '0'), grp, cuota: (i + 1) + '/' + n, ts: Date.now() + i } });
      }
      lines.push(`${cat.emoji} ${fmt(monto)} en ${cat.name}${detalle ? ' · ' + detalle : ''} (${n} cuotas de ${fmt(each)})`);
    } else {
      ops.push({ col: 'movs', action: 'add', id: 'm' + rid(), data: { ...base, monto, fecha: it.fecha } });
      lines.push(`${it.tipo === 'in' ? '⬆️' : cat.emoji} ${fmt(monto)}${usd ? ` (US$ ${usd})` : ''} ${it.tipo === 'in' ? 'de' : 'en'} ${cat.name}${detalle && !detalle.startsWith('(US$') ? ' · ' + detalle : ''}`);
    }
  }
  return { ops, lines };
}
