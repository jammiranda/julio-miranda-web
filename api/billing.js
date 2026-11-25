// Membresía Pro con suscripciones de Mercado Pago, a través del puente de DEVISEBIT (sistema.devisebit.com),
// que es el que tiene el token de la cuenta. MateCuentas nunca ve el token.
import { APP, readJ, mutate, userPath, idxPath, currentUser, publicUser, send, guard, fail } from './_core.js';

const on = () => !!(process.env.MP_BRIDGE_URL && process.env.MP_BRIDGE_KEY);

async function bridge(accion, data = {}) {
  const r = await fetch(process.env.MP_BRIDGE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-matecuentas-key': process.env.MP_BRIDGE_KEY },
    body: JSON.stringify({ accion, ...data }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('Mercado Pago: ' + (j.error || r.status)); e.status = 502; throw e; }
  return j;
}

// Aplica el estado real de la suscripción (siempre leído desde Mercado Pago).
export async function syncPreapproval(id) {
  const p = await bridge('ver', { id });
  const uid = String(p.external_reference || '').replace(/^matecuentas:/, '');
  const { data: ix } = await readJ(idxPath(uid));
  if (!ix) return { ok: false, reason: 'usuario' };
  const status = p.status; // pending | authorized | paused | cancelled
  const next = p.next_payment_date ? Date.parse(p.next_payment_date) : null;
  await mutate(userPath(ix.email), (u) => {
    u.sub = { id: p.id, status, next, amount: p.amount, ts: Date.now() };
    if (status === 'authorized') { u.plan = 'pro'; u.proUntil = null; u.proSince = u.proSince || Date.now(); }
    else if (status === 'paused' || status === 'cancelled') {
      // Mantiene Pro hasta el final del período ya pagado.
      if (u.plan === 'pro' && !u.grant) u.proUntil = next && next > Date.now() ? next : Date.now();
    }
  });
  return { ok: true, status };
}

export default guard(async (req, res) => {
  const a = String(req.query.a || '');
  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });

  if (a === 'status') {
    if (on() && me.sub && me.sub.id) await syncPreapproval(me.sub.id).catch(() => {});
    const { data: u } = await readJ(userPath(me.email));
    return send(res, 200, { user: publicUser(u || me) });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'metodo' });

  if (a === 'checkout') {
    if (!on()) throw fail(503, 'Los pagos se habilitan en breve. Escribinos y te activamos Pro a mano.');
    const p = await bridge('crear', { usuario: me.id, email: me.email, monto: APP.priceArs });
    await mutate(userPath(me.email), (u) => { u.sub = { id: p.id, status: p.status, ts: Date.now() }; });
    return send(res, 200, { url: p.init_point });
  }

  if (a === 'cancel') {
    if (!on() || !me.sub || !me.sub.id) throw fail(400, 'No hay una suscripción activa.');
    await bridge('cancelar', { id: me.sub.id });
    await syncPreapproval(me.sub.id);
    const { data: u } = await readJ(userPath(me.email));
    return send(res, 200, { user: publicUser(u) });
  }

  return send(res, 404, { error: 'accion' });
});
