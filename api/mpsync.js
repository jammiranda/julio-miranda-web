// Carga automática de gastos de Mercado Pago en los espacios de Julio (DEVISEBIT SRL y Varela Miranda).
// Los datos de MP los pide al puente de sistema.devisebit.com (que tiene el token); MateCuentas nunca ve el token.
import { readJ, currentUser, spacePath, send, guard, fail } from './_core.js';

const DEVISEBIT = 'scpzKYE3QekU';

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

export default guard(async (req, res) => {
  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });
  const { data: sp } = await readJ(spacePath(DEVISEBIT));
  if (!sp || sp.owner !== me.id) return send(res, 403, { error: 'no' });
  const a = String(req.query.a || '');
  if (a === 'diag') return send(res, 200, await bridge('diag'));
  return send(res, 404, { error: 'accion' });
});
