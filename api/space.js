import {
  readJ, writeJ, mutate, delJ, userPath, idxPath, spacePath, invPath, linkPath, botPath, currentUser, isPro, limits,
  body, str, send, guard, fail, rid, APP,
} from './_core.js';
import { TEMPLATES } from './_tpl.js';

const COLS = {
  movs: ['fecha', 'tipo', 'cat', 'monto', 'moneda', 'usd', 'rate', 'quien', 'pago', 'detalle', 'grp', 'cuota', 'fijo', 'ts', 'by'],
  cats: ['tipo', 'emoji', 'name', 'plan', 'order'],
  fijos: ['name', 'tipo', 'monto', 'cat', 'quien', 'pago', 'order'],
  notas: ['title', 'text', 'done', 'order'],
};
import crypto from 'node:crypto';
const require_bytes = (n) => crypto.randomBytes(n);
const NUM = ['monto', 'usd', 'rate', 'plan', 'order', 'ts'];
const MAX = { movs: 30000, cats: 80, fijos: 120, notas: 200 };

function clean(col, data) {
  const out = {};
  for (const k of COLS[col]) {
    if (!(k in data)) continue;
    let v = data[k];
    if (NUM.includes(k)) { v = v === null || v === '' ? null : Number(v); if (v !== null && !Number.isFinite(v)) v = 0; if (v !== null) v = Math.round(v * 100) / 100; }
    else if (k === 'done') v = !!v;
    else if (k === 'fecha') { v = String(v || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) v = new Date().toISOString().slice(0, 10); }
    else if (k === 'tipo') v = v === 'in' ? 'in' : 'out';
    else v = str(v, k === 'text' ? 4000 : 200);
    out[k] = v;
  }
  return out;
}

async function ownerOf(space, me) {
  if (space.owner === me.id) return me;
  const { data: ix } = await readJ(idxPath(space.owner));
  if (!ix) return null;
  return (await readJ(userPath(ix.email))).data;
}

function view(space, me, owner) {
  const pro = isPro(owner);
  return {
    ...space, invite: undefined,
    hasInvite: !!space.invite, me: me.id, isOwner: space.owner === me.id,
    pro, limits: pro ? APP.pro : APP.free,
  };
}

async function loadMember(id, me) {
  if (!id || !(me.spaces || []).includes(id)) throw fail(404, 'No encontramos ese espacio.');
  const { data, etag } = await readJ(spacePath(id));
  if (!data || !(data.members || []).some((m) => m.uid === me.id)) throw fail(404, 'No encontramos ese espacio.');
  return { data, etag };
}

function newSpace(id, name, tpl, me) {
  const t = TEMPLATES[tpl] || TEMPLATES.hogar;
  return {
    id, name, tpl: TEMPLATES[tpl] ? tpl : 'hogar', created: Date.now(), owner: me.id,
    members: [{ uid: me.id, name: me.name, role: 'owner', joined: Date.now() }],
    settings: { people: [me.name], pagos: t.pagos, fx: 'blue' },
    cats: t.cats.map((c, i) => ({ id: 'c' + rid(5), ...c, order: i })),
    movs: [], fijos: [], notas: [], updatedAt: Date.now(),
  };
}

export default guard(async (req, res) => {
  const a = String(req.query.a || '');
  const b = body(req);

  // Vista previa de invitación (sin sesión): solo nombre del espacio.
  if (req.method === 'GET' && a === 'peek') {
    const code = String(req.query.code || '').slice(0, 40);
    const { data: inv } = await readJ(invPath(code));
    if (!inv) throw fail(404, 'La invitación no existe o fue renovada.');
    const { data: s } = await readJ(spacePath(inv.space));
    if (!s || s.invite !== code) throw fail(404, 'La invitación no existe o fue renovada.');
    return send(res, 200, { name: s.name, by: inv.by, members: s.members.length });
  }

  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });

  if (req.method === 'GET') {
    const { data } = await loadMember(String(req.query.id || ''), me);
    return send(res, 200, view(data, me, await ownerOf(data, me)));
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo' });

  if (a === 'templates') return send(res, 200, Object.fromEntries(Object.entries(TEMPLATES).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])));

  if (a === 'create') {
    const name = str(b.name, 50) || 'Mi espacio';
    const owned = [];
    for (const sid of me.spaces || []) { const { data } = await readJ(spacePath(sid)); if (data && data.owner === me.id) owned.push(sid); }
    if (owned.length >= limits(me).spaces) throw fail(402, 'El plan gratis incluye 1 espacio. Pasate a Pro para crear más.');
    const id = 's' + rid(8);
    const s = newSpace(id, name, String(b.tpl || 'hogar'), me);
    await writeJ(spacePath(id), s, null, 'create');
    await mutate(userPath(me.email), (u) => { u.spaces = [...new Set([...(u.spaces || []), id])]; });
    return send(res, 200, view(s, me, me));
  }

  if (a === 'join') {
    const code = String(b.code || '').slice(0, 40);
    const { data: inv } = await readJ(invPath(code));
    if (!inv) throw fail(404, 'La invitación no existe o fue renovada.');
    let full = false;
    const { data: s } = await mutate(spacePath(inv.space), async (s) => {
      if (s.invite !== code) throw fail(404, 'La invitación no existe o fue renovada.');
      if (s.members.some((m) => m.uid === me.id)) return false;
      const owner = await ownerOf(s, me);
      const lim = isPro(owner) ? APP.pro.members : APP.free.members;
      if (s.members.length >= lim) { full = true; return false; }
      s.members.push({ uid: me.id, name: me.name, role: 'member', joined: Date.now() });
      s.settings = s.settings || {};
      s.settings.people = [...new Set([...(s.settings.people || []), me.name])];
      s.updatedAt = Date.now();
    });
    if (!s) throw fail(404, 'El espacio ya no existe.');
    if (full) throw fail(402, `Este espacio llegó al límite de ${APP.free.members} personas del plan gratis. Quien lo creó puede pasarse a Pro para sumar más.`);
    await mutate(userPath(me.email), (u) => { u.spaces = [...new Set([...(u.spaces || []), s.id])]; });
    return send(res, 200, { id: s.id, name: s.name });
  }

  const id = String(b.id || '');
  const { data: cur } = await loadMember(id, me);
  const owner = await ownerOf(cur, me);
  const pro = isPro(owner);
  const isOwner = cur.owner === me.id;

  if (a === 'ops') {
    const ops = Array.isArray(b.ops) ? b.ops.slice(0, 120) : [];
    for (const op of ops) {
      const d = op.data || {};
      if (!pro && op.col === 'movs' && (d.moneda === 'USD' || d.grp)) throw fail(402, 'Las cuotas y los movimientos en dólares son de Pro.');
    }
    const { data } = await mutate(spacePath(id), (s) => {
      for (const op of ops) {
        if (op.col === 'settings' && op.action === 'set') {
          const d = op.data || {};
          s.settings = s.settings || {};
          if (Array.isArray(d.people)) s.settings.people = [...new Set(d.people.map((x) => str(x, 40)).filter(Boolean))].slice(0, 20);
          if (Array.isArray(d.pagos)) s.settings.pagos = [...new Set(d.pagos.map((x) => str(x, 30)).filter(Boolean))].slice(0, 15);
          if (['oficial', 'blue', 'bolsa', 'tarjeta'].includes(d.fx)) s.settings.fx = d.fx;
          if ('name' in d && isOwner) s.name = str(d.name, 50) || s.name;
          continue;
        }
        if (!COLS[op.col]) continue;
        const list = s[op.col] || (s[op.col] = []);
        if (op.action === 'add') {
          if (list.length >= MAX[op.col]) continue;
          const nid = String(op.id || (op.col[0] + rid(7))).slice(0, 40);
          if (list.some((x) => x.id === nid)) continue;
          const row = { id: nid, ...clean(op.col, op.data || {}) };
          if (op.col === 'movs') { row.by = me.id; row.ts = row.ts || Date.now(); }
          list.push(row);
        } else if (op.action === 'upd') {
          const it = list.find((x) => x.id === op.id);
          if (it) Object.assign(it, clean(op.col, op.data || {}));
        } else if (op.action === 'del') {
          s[op.col] = list.filter((x) => x.id !== op.id);
        } else if (op.action === 'delgrp' && op.col === 'movs') {
          s.movs = list.filter((x) => x.grp !== op.grp || !op.grp);
        }
      }
      s.updatedAt = Date.now();
    });
    return send(res, 200, view(data, me, owner));
  }

  if (a === 'invite') {
    if (!isOwner) throw fail(403, 'Solo quien creó el espacio puede invitar.');
    const code = rid(9);
    const old = cur.invite;
    await writeJ(invPath(code), { space: id, by: me.name, ts: Date.now() }, null, null);
    await mutate(spacePath(id), (s) => { s.invite = code; });
    if (old) await delJ(invPath(old));
    return send(res, 200, { link: APP.url + '/app#join=' + code });
  }

  if (a === 'linkcode') {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MC'; for (const byte of require_bytes(6)) code += abc[byte % abc.length];
    await writeJ(linkPath(code), { uid: me.id, space: id, exp: Date.now() + 30 * 60e3 }, null, null);
    const wa = process.env.MATEBOT_WA || '5491177488220';
    const tg = process.env.MATEBOT_TG || 'MateBotAR_bot';
    return send(res, 200, { code, wa: `https://wa.me/${wa}?text=${encodeURIComponent('vincular ' + code)}`, tg: `https://t.me/${tg}?start=${code}` });
  }

  if (a === 'unlinkbot') {
    const ch = b.ch === 'tg' ? 'tg' : 'wa';
    const bot = (me.bots || []).find((x) => x.ch === ch && x.id === String(b.botId || ''));
    if (bot) { await delJ(botPath(ch, bot.id)); await mutate(userPath(me.email), (u) => { u.bots = (u.bots || []).filter((x) => !(x.ch === ch && x.id === bot.id)); }); }
    return send(res, 200, { ok: true });
  }

  if (a === 'kick') {
    if (!isOwner) throw fail(403, 'Solo quien creó el espacio puede sacar personas.');
    const uid = String(b.uid || '');
    if (uid === me.id) throw fail(400, 'No podés sacarte a vos. Usá “Salir del espacio”.');
    await mutate(spacePath(id), (s) => { s.members = s.members.filter((m) => m.uid !== uid); });
    const { data: ix } = await readJ(idxPath(uid));
    if (ix) await mutate(userPath(ix.email), (u) => { u.spaces = (u.spaces || []).filter((x) => x !== id); }).catch(() => {});
    return send(res, 200, { ok: true });
  }

  if (a === 'leave' || a === 'delete') {
    if (a === 'delete' && !isOwner) throw fail(403, 'Solo quien creó el espacio puede borrarlo.');
    let drop = a === 'delete';
    const removed = [];
    if (!drop) {
      await mutate(spacePath(id), (s) => {
        s.members = s.members.filter((m) => m.uid !== me.id);
        if (!s.members.length) { drop = true; return false; }
        if (s.owner === me.id) { s.owner = s.members[0].uid; s.members[0].role = 'owner'; }
      });
    } else removed.push(...cur.members.map((m) => m.uid));
    if (drop) { await delJ(spacePath(id)); if (cur.invite) await delJ(invPath(cur.invite)); }
    await mutate(userPath(me.email), (u) => { u.spaces = (u.spaces || []).filter((x) => x !== id); });
    for (const uid of removed) {
      if (uid === me.id) continue;
      const { data: ix } = await readJ(idxPath(uid));
      if (ix) await mutate(userPath(ix.email), (u) => { u.spaces = (u.spaces || []).filter((x) => x !== id); }).catch(() => {});
    }
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'accion' });
});
