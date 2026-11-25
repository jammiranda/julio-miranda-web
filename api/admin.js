import { put } from '@vercel/blob';
import { readJ, mutate, listPaths, userPath, spacePath, same, sleep, body, send, guard, fail, normEmail } from './_core.js';
import { makeResetLink } from './auth.js';
const SITE = ['index.html', 'app.html', 'app.js', 'terminos.html', 'privacidad.html', 'manifest.webmanifest', 'sw.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'og.png', 'icon.svg', 'robots.txt', 'sitemap.xml', 'matebot.svg', 'devisebit.png', 'landing.js'];
const csv = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
export default guard(async (req, res) => {
  const key = process.env.ADMIN_KEY;
  const pub = process.env.PUBLISH_KEY; // solo sirve para publicar archivos del sitio (a=put)
  const stk = process.env.STATS_KEY; // solo sirve para leer números agregados (a=stats), para el panel de DEVISEBIT
  const given = req.headers['x-admin'] || req.query.key;
  const a = String(req.query.a || '');
  const ok = (key && same(given, key)) || (pub && a === 'put' && same(given, pub)) || (stk && a === 'stats' && same(given, stk));
  if (!ok) { await sleep(800); return send(res, 401, { error: 'no' }); }
  const b = body(req);

  if (a === 'put' && req.method === 'POST') {
    if (!SITE.includes(b.path) || typeof b.content !== 'string') throw fail(400, 'archivo');
    const content = b.b64 ? Buffer.from(b.content, 'base64') : b.content;
    await put('site/' + b.path, content, { access: 'private', contentType: 'application/octet-stream', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
    return send(res, 200, { ok: true, bytes: content.length });
  }

  if (a === 'leads' || a === 'stats') {
    const paths = (await listPaths('u/')).filter((p) => p.endsWith('.json'));
    const rows = [];
    for (const p of paths) { const { data: u } = await readJ(p); if (u) rows.push(u); }
    if (a === 'stats') {
      const pro = rows.filter((u) => u.plan === 'pro' && (!u.proUntil || u.proUntil > Date.now())).length;
      // Solo números agregados: ningún dato personal ni montos
      const D = 86400e3, now = Date.now(), d30 = now - 30 * D, d7 = now - 7 * D;
      const sp = (await listPaths('s/')).filter((p) => p.endsWith('.json'));
      let movs = 0, movs30 = 0, movs7 = 0, act30 = new Set(), act7 = new Set(), spAct30 = 0, members = 0;
      const via = {}, porDia = {};
      for (const p of sp) {
        const { data: s } = await readJ(p); if (!s) continue;
        members += (s.members || []).length;
        const ms = s.movs || []; movs += ms.length;
        let recent = false;
        for (const m of ms) {
          const t = Number(m.ts) || 0;
          if (t > d30) {
            movs30++; recent = true; if (m.by) act30.add(m.by);
            const k = new Date(t - 3 * 3600e3).toISOString().slice(0, 10); porDia[k] = (porDia[k] || 0) + 1;
            const v = m.via || 'app'; via[v] = (via[v] || 0) + 1;
          }
          if (t > d7) { movs7++; if (m.by) act7.add(m.by); }
        }
        if (recent || (s.updatedAt || 0) > d30) spAct30++;
      }
      const mk = new Date(now - 3 * 3600e3).toISOString().slice(0, 7);
      const ai = rows.reduce((x, u) => x + (u.aiUse && u.aiUse.m === mk ? u.aiUse.n : 0), 0);
      return send(res, 200, {
        users: rows.length, optin: rows.filter((u) => u.optin && u.optin.ok).length, pro, spaces: sp.length,
        altas7: rows.filter((u) => u.created > d7).length, altas30: rows.filter((u) => u.created > d30).length,
        activos7: act7.size, activos30: act30.size, espaciosActivos30: spAct30, miembros: members,
        movs, movs30, movs7, cargasIaMes: ai, conBot: rows.filter((u) => u.bots && Object.keys(u.bots).length).length,
        via30: via, porDia30: porDia,
      });
    }
    const leads = rows.filter((u) => u.optin && u.optin.ok).sort((x, y) => x.created - y.created)
      .map((u) => ({ nombre: u.name, email: u.email, whatsapp: u.optin.phone || '', alta: new Date(u.created).toISOString(), consentimiento: new Date(u.optin.ts).toISOString(), plan: u.plan, origen: u.optin.src || 'web' }));
    if (req.query.format === 'json') return send(res, 200, leads);
    const head = ['nombre', 'email', 'whatsapp', 'alta', 'consentimiento', 'plan', 'origen'];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contactos-matecuentas.csv"');
    return res.status(200).send('﻿' + [head.join(','), ...leads.map((l) => head.map((h) => csv(l[h])).join(','))].join('\n'));
  }

  if (a === 'grant' && req.method === 'POST') {
    const months = Math.max(0, Math.min(36, Number(b.months || 1)));
    const { data: u } = await mutate(userPath(normEmail(b.email)), (d) => {
      if (!months) { d.plan = 'free'; d.proUntil = null; return; }
      d.plan = 'pro'; const base = d.proUntil && d.proUntil > Date.now() ? d.proUntil : Date.now();
      d.proUntil = base + months * 30 * 864e5; d.grant = { months, ts: Date.now() };
    });
    if (!u) throw fail(404, 'usuario');
    return send(res, 200, { email: u.email, plan: u.plan, proUntil: u.proUntil });
  }

  if (a === 'purgeqa' && req.method === 'POST') {
    // Borra solo las cuentas de prueba internas (emails qa-…@devisebit.com) y sus espacios.
    const { delJ, idxPath, spacePath } = await import('./_core.js');
    const out = [];
    for (const p of await listPaths('u/')) {
      const { data: u } = await readJ(p);
      if (!u || !/^qa-[\w-]+@devisebit\.com$/.test(u.email)) continue;
      for (const sid of u.spaces || []) { const { data: s } = await readJ(spacePath(sid)); if (s && s.owner === u.id) await delJ(spacePath(sid)); }
      await delJ(idxPath(u.id)); await delJ(p); out.push(u.email);
    }
    return send(res, 200, { borradas: out.length });
  }

  if (a === 'resetlink' && req.method === 'POST') {
    const link = await makeResetLink(normEmail(b.email));
    if (!link) throw fail(404, 'usuario');
    return send(res, 200, { link });
  }
  return send(res, 404, { error: 'accion' });
});
