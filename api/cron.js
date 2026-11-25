// Revisión diaria: sincroniza el estado de las suscripciones Pro con Mercado Pago.
import { readJ, listPaths, same, send } from './_core.js';
import { syncPreapproval } from './billing.js';
export default async function handler(req, res) {
  const want = process.env.CRON_SECRET;
  const got = String(req.headers.authorization || '').replace('Bearer ', '');
  if (!want || !same(got, want)) return send(res, 401, { error: 'no' });
  if (!process.env.MP_BRIDGE_URL) return send(res, 200, { skipped: true });
  let n = 0;
  for (const p of await listPaths('u/')) {
    const { data: u } = await readJ(p);
    if (u && u.sub && u.sub.id && ['authorized', 'pending', 'paused'].includes(u.sub.status)) { await syncPreapproval(u.sub.id).catch(() => {}); n++; }
  }
  return send(res, 200, { synced: n });
}
