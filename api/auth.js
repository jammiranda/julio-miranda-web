import crypto from 'crypto';
import { sendMail, mailOn } from './_mail.js';
import { joinPending } from './_invites.js';
import {
  APP, readJ, writeJ, mutate, delJ, userPath, idxPath, spacePath, resetPath, normEmail, okEmail, hashPass, checkPass,
  setSession, clearSession, currentUser, publicUser, body, str, send, guard, fail, rid, sleep, sha,
} from './_core.js';

async function spacesSummary(u) {
  const out = [];
  for (const id of u.spaces || []) {
    const { data } = await readJ(spacePath(id));
    if (data && (data.members || []).some((m) => m.uid === u.id)) {
      out.push({ id, name: data.name, tpl: data.tpl, owner: data.owner === u.id, members: data.members.length });
    }
  }
  return out;
}

// Código de 6 números por email: sirve para entrar sin contraseña y para recuperar la cuenta.
const otpPath = (email) => 'otp/' + sha('otp:' + email) + '.json';
const mailHtml = (code, email) => {
  const link = APP.url + '/app#entrar=' + encodeURIComponent(email + '|' + code);
  const digits = code.split('').map((d) => `<td style="width:46px;height:58px;background:#ffffff;border:2px solid #cfe8d6;border-radius:12px;text-align:center;font:800 30px/58px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#14231a">${d}</td>`).join('<td style="width:6px"></td>');
  return `<!doctype html><html><body style="margin:0;background:#f3f1ea;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#14231a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:22px;overflow:hidden">
    <tr><td style="background:#2f7d4f;padding:22px 24px" align="left">
      <img src="${APP.url}/icon-192.png" width="40" height="40" alt="" style="vertical-align:middle;border-radius:10px">
      <span style="font:800 22px -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;vertical-align:middle;margin-left:10px">MateCuentas</span>
    </td></tr>
    <tr><td style="padding:26px 24px 8px">
      <p style="margin:0 0 6px;font-size:18px;font-weight:700">Tu código para entrar</p>
      <p style="margin:0 0 18px;color:#5b6a60;font-size:15px">Escribilo en la pantalla de MateCuentas. Vence en 10 minutos.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>${digits}</tr></table>
    </td></tr>
    <tr><td style="padding:22px 24px 6px" align="center">
      <a href="${link}" style="display:inline-block;background:#2f7d4f;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:14px">Entrar sin escribir el código</a>
    </td></tr>
    <tr><td style="padding:18px 24px 24px;color:#7a857e;font-size:13px">Si no lo pediste, ignorá este mail: nadie puede entrar sin el código. 🧉</td></tr>
  </table>
  <p style="color:#8b8f88;font-size:12px;margin:14px 0 0">MateCuentas · un producto de DEVISEBIT · Buenos Aires</p>
  </td></tr></table></body></html>`;
};

export async function makeResetLink(email) {
  const u = (await readJ(userPath(email))).data;
  if (!u) return null;
  const tok = rid(24);
  await writeJ(resetPath(tok), { email: u.email, exp: Date.now() + 2 * 3600e3 }, null, null);
  return APP.url + '/app#reset=' + tok;
}

export default guard(async (req, res) => {
  const a = String(req.query.a || '');
  const b = body(req);

  if (req.method === 'GET' && a === 'me') {
    const u = await currentUser(req);
    if (!u) return send(res, 401, { error: 'sesion' });
    const u2 = await joinPending(u).catch(() => u);
    return send(res, 200, { user: publicUser(u2), spaces: await spacesSummary(u2) });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo' });

  if (a === 'signup') {
    const email = normEmail(b.email);
    const name = str(b.name, 60);
    const pass = String(b.pass || '');
    if (!name) throw fail(400, 'Poné tu nombre.');
    if (!okEmail(email)) throw fail(400, 'Revisá el email.');
    if (pass.length < 8) throw fail(400, 'La contraseña tiene que tener al menos 8 caracteres.');
    if (!b.terms) throw fail(400, 'Tenés que aceptar los términos y la política de privacidad.');
    const phone = str(b.phone, 30).replace(/[^\d+ ]/g, '');
    const id = 'u' + rid(8);
    const user = {
      id, email, name, pass: hashPass(pass), created: Date.now(), plan: 'free', sv: 0, spaces: [],
      terms: { ok: true, ts: Date.now(), v: '2026-11' },
      optin: { ok: !!b.optin, ts: Date.now(), phone: b.optin ? phone : '', src: str(b.src, 40) || 'web' },
    };
    try { await writeJ(userPath(email), user, null, 'create'); }
    catch (e) { if (/exists/i.test(String(e.message))) throw fail(409, 'Ya hay una cuenta con ese email. Probá ingresar.'); throw e; }
    await writeJ(idxPath(id), { email }, null, null);
    setSession(res, user);
    const u2 = await joinPending(user).catch(() => user);
    return send(res, 200, { user: publicUser(u2), spaces: await spacesSummary(u2) });
  }

  if (a === 'login') {
    const email = normEmail(b.email);
    const { data: u } = await readJ(userPath(email));
    if (u && u.lockUntil && u.lockUntil > Date.now()) throw fail(429, 'Demasiados intentos. Probá de nuevo en unos minutos.');
    if (!u || !checkPass(b.pass, u.pass)) {
      await sleep(700);
      if (u) await mutate(userPath(email), (d) => { d.fails = (d.fails || 0) + 1; if (d.fails >= 8) { d.lockUntil = Date.now() + 10 * 60e3; d.fails = 0; } }).catch(() => {});
      throw fail(401, 'Email o contraseña incorrectos.');
    }
    if (u.fails) await mutate(userPath(email), (d) => { d.fails = 0; d.lockUntil = 0; }).catch(() => {});
    setSession(res, u);
    const u2 = await joinPending(u).catch(() => u);
    return send(res, 200, { user: publicUser(u2), spaces: await spacesSummary(u2) });
  }

  if (a === 'logout') { clearSession(res); return send(res, 200, { ok: true }); }

  if (a === 'forgot') {
    const email = normEmail(b.email);
    const link = okEmail(email) ? await makeResetLink(email) : null;
    let mailed = false;
    if (link) {
      mailed = await sendMail(email, `Recuperá tu contraseña de ${APP.name}`,
        `<p>Hola,</p><p>Para elegir una contraseña nueva entrá acá (vale por 2 horas):</p><p><a href="${link}">${link}</a></p><p>Si no lo pediste, ignorá este mensaje.</p>`).catch(() => false);
    }
    await sleep(400);
    return send(res, 200, { ok: true, mailed: mailOn() });
  }

  if (a === 'code') {
    const email = normEmail(b.email);
    if (!okEmail(email)) throw fail(400, 'Revisá el email.');
    const { data: u } = await readJ(userPath(email));
    const { data: prev } = await readJ(otpPath(email));
    if (prev && prev.sent && Date.now() - prev.sent < 30e3) throw fail(429, 'Ya te mandamos un código. Esperá unos segundos para pedir otro.');
    if (u) {
      const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
      await writeJ(otpPath(email), { h: sha(email + ':' + code), exp: Date.now() + 10 * 60e3, tries: 0, sent: Date.now() }, null, null);
      await sendMail(email, `${code} es tu código de MateCuentas`, mailHtml(code, email)).catch(() => false);
    } else await sleep(600);
    return send(res, 200, { ok: true, mailOn: mailOn() });
  }

  if (a === 'codelogin') {
    const email = normEmail(b.email);
    const code = String(b.code || '').replace(/\D/g, '');
    const { data: o } = await readJ(otpPath(email));
    if (!o || o.exp < Date.now() || o.tries >= 5) { await sleep(500); throw fail(400, 'El código venció. Pedí uno nuevo.'); }
    if (o.h !== sha(email + ':' + code)) {
      await mutate(otpPath(email), (d) => { d.tries = (d.tries || 0) + 1; }).catch(() => {});
      await sleep(600);
      throw fail(400, o.tries >= 4 ? 'Demasiados intentos. Pedí un código nuevo.' : 'Ese código no es correcto. Revisalo.');
    }
    await delJ(otpPath(email));
    const { data: u } = await mutate(userPath(email), (d) => { d.fails = 0; d.lockUntil = 0; d.otpAt = Date.now(); });
    if (!u) throw fail(400, 'La cuenta ya no existe.');
    setSession(res, u);
    const u2 = await joinPending(u).catch(() => u);
    return send(res, 200, { user: publicUser(u2), spaces: await spacesSummary(u2) });
  }

  if (a === 'reset') {
    const tok = String(b.token || '');
    const pass = String(b.pass || '');
    if (pass.length < 8) throw fail(400, 'La contraseña tiene que tener al menos 8 caracteres.');
    const { data: r } = await readJ(resetPath(tok));
    if (!r || r.exp < Date.now()) throw fail(400, 'El enlace venció o ya se usó. Pedí uno nuevo.');
    const { data: u } = await mutate(userPath(r.email), (d) => { d.pass = hashPass(pass); d.sv = (d.sv || 0) + 1; d.fails = 0; d.lockUntil = 0; });
    await delJ(resetPath(tok));
    if (!u) throw fail(400, 'La cuenta ya no existe.');
    setSession(res, u);
    return send(res, 200, { user: publicUser(u), spaces: await spacesSummary(u) });
  }

  // --- desde acá, con sesión ---
  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });

  if (a === 'profile') {
    const { data: u } = await mutate(userPath(me.email), (d) => {
      if ('name' in b) d.name = str(b.name, 60) || d.name;
      if ('optin' in b) d.optin = { ok: !!b.optin, ts: Date.now(), phone: b.optin ? str(b.phone, 30).replace(/[^\d+ ]/g, '') : '', src: (d.optin && d.optin.src) || 'web' };
    });
    return send(res, 200, { user: publicUser(u) });
  }

  if (a === 'password') {
    const viaCodigo = me.otpAt && Date.now() - me.otpAt < 30 * 60e3; // entró recién con código por email
    if (!viaCodigo && !checkPass(b.old, me.pass)) throw fail(400, 'La contraseña actual no coincide.');
    if (String(b.pass || '').length < 8) throw fail(400, 'La nueva tiene que tener al menos 8 caracteres.');
    const { data: u } = await mutate(userPath(me.email), (d) => { d.pass = hashPass(b.pass); d.sv = (d.sv || 0) + 1; });
    setSession(res, u);
    return send(res, 200, { ok: true });
  }

  if (a === 'delete') {
    if (!checkPass(b.pass, me.pass)) throw fail(400, 'La contraseña no coincide.');
    for (const sid of me.spaces || []) {
      let drop = false;
      await mutate(spacePath(sid), (s) => {
        s.members = (s.members || []).filter((m) => m.uid !== me.id);
        if (!s.members.length) { drop = true; return false; }
        if (s.owner === me.id) s.owner = s.members[0].uid;
      }).catch(() => {});
      if (drop) await delJ(spacePath(sid));
    }
    await delJ(idxPath(me.id));
    await delJ(userPath(me.email));
    clearSession(res);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'accion' });
});
