// Núcleo compartido: almacenamiento en Blob privado, sesiones, utilidades.
import { get, put, head, del, list } from '@vercel/blob';
import crypto from 'node:crypto';

export const APP = {
  name: process.env.APP_NAME || 'MateCuentas',
  url: process.env.APP_URL || 'https://matecuentas.devisebit.com',
  priceArs: Number(process.env.PRO_PRICE_ARS || 3990),
  free: { spaces: 1, members: 2, projMonths: 4, ai: 5 },
  pro: { spaces: 20, members: 12, projMonths: 12, ai: 600 },
};

const SECRET = () => process.env.SESSION_SECRET || process.env.ADMIN_KEY || 'dev-secret';

export const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const rid = (n = 9) => crypto.randomBytes(n).toString('base64url');
export const normEmail = (e) => String(e || '').trim().toLowerCase().slice(0, 160);
export const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

// ---------- Blob JSON con concurrencia optimista ----------
export async function readJ(path) {
  let etag = null;
  try { const h = await head(path); etag = h && h.etag; } catch (e) { return { data: null, etag: null }; }
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (!r || !r.stream) return { data: null, etag: null };
    const txt = await new Response(r.stream).text();
    return { data: JSON.parse(txt), etag: etag || (r.blob && r.blob.etag) };
  } catch (e) { return { data: null, etag: null }; }
}
export async function writeJ(path, data, etag, mode) {
  const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };
  if (mode === 'create') opts.allowOverwrite = false;
  else if (etag) opts.ifMatch = etag;
  else opts.allowOverwrite = true;
  return put(path, JSON.stringify(data), opts);
}
// Lee, modifica y guarda con reintentos si alguien escribió en el medio.
export async function mutate(path, fn, { create } = {}) {
  let last = '';
  for (let i = 0; i < 6; i++) {
    const { data, etag } = await readJ(path);
    if (!data && !create) return { data: null, missing: true };
    const draft = data ? structuredClone(data) : create();
    const out = await fn(draft);
    if (out === false) return { data, unchanged: true };
    try {
      await writeJ(path, draft, etag, data ? null : 'create');
      return { data: draft };
    } catch (e) {
      last = String(e && (e.name + ': ' + e.message));
      if (!/precondition|exists|etag|match/i.test(last)) throw e;
      await sleep(100 + Math.random() * 300);
    }
  }
  const err = new Error('conflict'); err.status = 409; err.detail = last; throw err;
}
export async function delJ(path) { try { await del(path); } catch (e) { /* ya no existe */ } }
export async function listPaths(prefix, max = 5000) {
  const out = []; let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) out.push(b.pathname);
    cursor = r.hasMore ? r.cursor : null;
  } while (cursor && out.length < max);
  return out;
}

export const userPath = (email) => 'u/' + sha('u:' + normEmail(email)) + '.json';
export const idxPath = (uid) => 'id/' + uid + '.json'; // uid -> email
export const spacePath = (id) => 's/' + id + '.json';
export const invPath = (code) => 'inv/' + code + '.json';
export const linkPath = (code) => 'lnk/' + code + '.json';
export const botPath = (ch, id) => 'bot/' + ch + '_' + sha(String(id)).slice(0, 32) + '.json';
export const resetPath = (tok) => 'rst/' + sha(tok) + '.json';

// ---------- Contraseñas ----------
export function hashPass(p, salt = rid(12)) {
  const h = crypto.scryptSync(String(p), salt, 64, { N: 16384, r: 8, p: 1 }).toString('base64url');
  return { salt, h };
}
export function checkPass(p, rec) {
  if (!rec || !rec.salt) return false;
  const { h } = hashPass(p, rec.salt);
  return same(h, rec.h);
}

// ---------- Sesión en cookie firmada ----------
const DAYS = 60;
export function sign(payload) {
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const s = crypto.createHmac('sha256', SECRET()).update(b).digest('base64url');
  return b + '.' + s;
}
export function unsign(tok) {
  if (!tok || typeof tok !== 'string' || !tok.includes('.')) return null;
  const [b, s] = tok.split('.');
  const want = crypto.createHmac('sha256', SECRET()).update(b).digest('base64url');
  if (!same(s, want)) return null;
  try { const p = JSON.parse(Buffer.from(b, 'base64url').toString()); if (p.exp && p.exp < Date.now()) return null; return p; } catch (e) { return null; }
}
export function cookies(req) {
  const o = {}; const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) { const i = part.indexOf('='); if (i > 0) o[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return o;
}
export function setSession(res, user) {
  const tok = sign({ e: user.email, v: user.sv || 0, exp: Date.now() + DAYS * 864e5 });
  res.setHeader('Set-Cookie', `pu=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`);
}
export function clearSession(res) {
  res.setHeader('Set-Cookie', 'pu=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}
export async function currentUser(req) {
  const p = unsign(cookies(req).pu);
  if (!p || !p.e) return null;
  const { data } = await readJ(userPath(p.e));
  if (!data || (data.sv || 0) !== (p.v || 0)) return null;
  return data;
}

export function isPro(u) { return !!(u && u.plan === 'pro' && (!u.proUntil || u.proUntil > Date.now())); }
export function limits(u) { return isPro(u) ? APP.pro : APP.free; }

export const monthKey = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 7);
export function aiLeft(u) {
  const lim = limits(u).ai; const used = u.aiUse && u.aiUse.m === monthKey() ? u.aiUse.n : 0;
  return { used, limit: lim, left: Math.max(0, lim - used) };
}
// Descuenta una carga con IA del mes. Devuelve false si no quedan.
export async function takeAi(u) {
  let ok = false;
  await mutate(userPath(u.email), (d) => {
    const m = monthKey(); if (!d.aiUse || d.aiUse.m !== m) d.aiUse = { m, n: 0 };
    if (d.aiUse.n >= limits(d).ai) return false;
    d.aiUse.n++; ok = true;
  });
  return ok;
}
export async function giveBackAi(u) {
  await mutate(userPath(u.email), (d) => { if (d.aiUse && d.aiUse.n > 0) d.aiUse.n--; }).catch(() => {});
}

export function body(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return req.body;
}
export function str(v, max = 200) { return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }

export function publicUser(u) {
  return {
    id: u.id, email: u.email, name: u.name, plan: isPro(u) ? 'pro' : 'free', proUntil: u.proUntil || null,
    subStatus: u.sub ? u.sub.status : null, spaces: u.spaces || [], optin: !!(u.optin && u.optin.ok),
    phone: (u.optin && u.optin.phone) || '', created: u.created, limits: limits(u), price: APP.priceArs,
    billing: !!process.env.MP_BRIDGE_URL, ai: aiLeft(u), bots: (u.bots || []).map((b) => ({ id: b.id, ch: b.ch, name: b.name, space: b.space, ts: b.ts })),
  };
}

export function send(res, code, obj) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).json(obj);
}
export function guard(fn) {
  return async (req, res) => {
    try { return await fn(req, res); }
    catch (e) { return send(res, e.status || 500, { error: e.status ? e.message : 'Error interno', detail: e.status ? undefined : String(e && e.message || e) }); }
  };
}
export function fail(status, msg) { const e = new Error(msg); e.status = status; return e; }
