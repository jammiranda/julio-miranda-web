/* MateCuentas · by DEVISEBIT — cliente web */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');
const fmtK = (n) => { const a = Math.abs(Math.round(Number(n) || 0)); return a >= 1e6 ? '$ ' + (a / 1e6).toLocaleString('es-AR', { maximumFractionDigits: a >= 1e7 ? 1 : 2 }) + ' M' : fmt(a); };
const fmtU = (n) => 'US$ ' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 });
const parseNum = (s) => { s = String(s || '').replace(/[^\d.,-]/g, ''); if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, ''); return Number(s) || 0; };
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const ym = (d) => d.slice(0, 7);
const addM = (m, k) => { let [y, mo] = m.split('-').map(Number); mo += k; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return y + '-' + String(mo).padStart(2, '0'); };
const mName = (m, short) => { const [y, mo] = m.split('-').map(Number); const s = new Date(y, mo - 1, 1).toLocaleDateString('es-AR', { month: short ? 'short' : 'long', year: 'numeric' }); return s.replace('.', ''); };
const dayLbl = (d) => { const t = today(); if (d === t) return 'Hoy'; const y = new Date(t); y.setDate(y.getDate() - 1); if (d === y.toISOString().slice(0, 10)) return 'Ayer'; return new Date(d + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }); };
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const FX_LBL = { oficial: 'oficial', blue: 'blue', bolsa: 'MEP', tarjeta: 'tarjeta' };
const CONTACT = 'mailto:info@devisebit.com?subject=MateCuentas';

const st = { me: null, spaces: [], S: null, month: ym(today()), tab: 'home', fx: null, q: '', pending: 0 };

// ---------- API ----------
async function api(path, body, method) {
  const r = await fetch('/api/' + path, {
    method: method || (body ? 'POST' : 'GET'), credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
  });
  let j = {}; try { j = await r.json(); } catch (e) { /* vacío */ }
  if (r.status === 401 && j.error === 'sesion') { showAuth(); throw new Error('Tu sesión terminó. Volvé a ingresar.'); }
  if (!r.ok) { const e = new Error(j.error || 'No pudimos conectar. Probá de nuevo.'); e.status = r.status; throw e; }
  return j;
}
function toast(msg, ms = 2600) {
  $$('.toast').forEach((x) => x.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function dot(s) { const d = $('#dot'); if (d) { d.className = 'dot ' + (s || ''); d.title = s === 'busy' ? 'Guardando…' : s === 'err' ? 'No se pudo guardar' : 'Sincronizado'; } }
function hashArg(k) { const m = location.hash.match(new RegExp('[#&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; }
function clearHash() { history.replaceState(null, '', location.pathname); }

// ---------- arranque ----------
async function boot() {
  // Link del mail con el código: entra directo
  const en = hashArg('entrar');
  if (en && en.includes('|')) {
    const [email, code] = en.split('|');
    try { const j = await api('auth?a=codelogin', { email, code }); st.me = j.user; st.spaces = j.spaces; clearHash(); await afterLogin(); return; }
    catch (e) { clearHash(); otpEmail = ''; showAuth('forgot'); setTimeout(() => { const er = $('#aerr'); if (er) er.innerHTML = `<div class="err">${esc(e.message)} Pedí un código nuevo.</div>`; }, 50); return; }
  }
  const cg = hashArg('codigo'); if (cg) { try { sessionStorage.setItem('mc_codigo', cg); } catch (e) { /* nada */ } }
  try {
    const j = await api('auth?a=me');
    st.me = j.user; st.spaces = j.spaces;
    await afterLogin();
  } catch (e) { if (!st.me) showAuth(/signup/.test(location.hash) || sessionStorage.getItem('pu_signup') ? 'signup' : 'login'); }
}
async function afterLogin() {
  let cod = null; try { cod = sessionStorage.getItem('mc_codigo'); } catch (e) { /* nada */ }
  if (cod) {
    try { sessionStorage.removeItem('mc_codigo'); } catch (e) { /* nada */ }
    try { const j = await api('billing?a=codigo', { codigo: cod }); st.me = j.user; toast(`🎁 ¡Listo! MateCuentas Pro activado por ${j.dias >= 3000 ? 'tiempo ilimitado' : j.dias + ' días'}.`, 5000); }
    catch (e) { toast(e.message, 5000); }
    if (/codigo=/.test(location.hash)) clearHash();
  }
  const join = hashArg('join');
  if (join) {
    try { const r = await api('space?a=join', { code: join }); toast('Te sumaste a “' + r.name + '”'); localStorage.setItem('pu_sid', r.id); await refreshMe(); }
    catch (e) { toast(e.message, 4000); }
    clearHash();
  }
  if (location.hash.includes('pro')) { clearHash(); try { const j = await api('billing?a=status'); st.me = j.user; if (st.me.plan === 'pro') toast('¡Listo! Ya tenés Pro activo. Gracias por bancar el proyecto.', 4000); else toast('Estamos esperando la confirmación de Mercado Pago. Puede tardar unos minutos.', 4500); } catch (e) { /* nada */ } }
  if (/baja/.test(location.hash)) { clearHash(); st.tab = 'mas'; }
  if (/pro-info/.test(location.hash)) { clearHash(); setTimeout(() => upsell('ai'), 600); }
  if (/conectar/.test(location.hash)) { clearHash(); st.tab = 'mas'; setTimeout(linkBot, 600); }
  if (/signup/.test(location.hash)) clearHash();
  try { sessionStorage.removeItem('pu_signup'); } catch (e) { /* privado */ }
  if (!st.spaces.length) return showOnboarding();
  let sid = null; try { sid = localStorage.getItem('pu_sid'); } catch (e) { /* privado */ }
  if (!st.spaces.some((s) => s.id === sid)) sid = st.spaces[0].id;
  await openSpace(sid);
}
async function refreshMe() { const j = await api('auth?a=me'); st.me = j.user; st.spaces = j.spaces; }
async function openSpace(id) {
  $('#boot').classList.remove('hidden'); $('#shell').classList.add('hidden'); $('#auth').classList.add('hidden');
  try { st.S = await api('space?id=' + encodeURIComponent(id)); }
  catch (e) { await refreshMe(); if (!st.spaces.length) return showOnboarding(); st.S = await api('space?id=' + encodeURIComponent(st.spaces[0].id)); }
  try { localStorage.setItem('pu_sid', st.S.id); } catch (e) { /* privado */ }
  $('#boot').classList.add('hidden'); $('#shell').classList.remove('hidden'); document.body.classList.add('app');
  loadFx();
  render();
}
async function loadFx() { if (st.fx) return; try { st.fx = await api('fx'); render(); } catch (e) { /* sin cotización */ } }
function fxRate() { const t = (st.S && st.S.settings && st.S.settings.fx) || 'blue'; const v = st.fx && st.fx[t]; return v ? v.venta : null; }

// ---------- auth ----------
let authMode = 'login';
let otpEmail = '';
async function showAuth(mode) {
  if (mode) authMode = mode;
  if (hashArg('reset')) authMode = 'reset';
  $('#boot').classList.add('hidden'); $('#shell').classList.add('hidden'); document.body.classList.remove('app');
  const box = $('#auth'); box.classList.remove('hidden');
  const join = hashArg('join');
  let banner = '';
  if (join) {
    try { const p = await api('space?a=peek&code=' + encodeURIComponent(join)); banner = `<div class="invite-banner">👋 <b>${esc(p.by)}</b> te invitó a <b>“${esc(p.name)}”</b>. Creá tu cuenta gratis o ingresá para sumarte.</div>`; if (authMode === 'login' && !box.dataset.touched) authMode = 'signup'; }
    catch (e) { banner = `<div class="err" style="margin-top:16px">${esc(e.message)}</div>`; }
  }
  let regalo = ''; try { regalo = sessionStorage.getItem('mc_codigo') || ''; } catch (e) { /* nada */ }
  if (regalo) banner += `<div class="invite-banner">🎁 Entrá o creá tu cuenta y activamos tu código <b>${esc(regalo)}</b> solo.</div>`;
  const T = {
    login: ['Hola de nuevo', 'Ingresá para ver las cuentas de tu casa.'],
    signup: ['Creá tu cuenta', 'Gratis, sin tarjeta. En un minuto tenés tu espacio listo.'],
    forgot: ['Entrar con un código', 'Te mandamos un código de 6 números a tu email. Sin contraseña.'],
    reset: ['Elegí una contraseña nueva', 'Mínimo 8 caracteres.'],
  }[authMode];
  let f = '';
  if (authMode === 'signup') f = `
    <label class="f">Tu nombre<input class="in" name="name" autocomplete="given-name" required maxlength="60"></label>
    <label class="f">Email<input class="in" name="email" type="email" autocomplete="email" required></label>
    <label class="f">Contraseña<input class="in" name="pass" type="password" autocomplete="new-password" minlength="8" required></label>
    <label class="chk"><input type="checkbox" name="terms" required><span>Acepto los <a href="/terminos" target="_blank">Términos</a> y la <a href="/privacidad" target="_blank">Política de privacidad</a>.</span></label>
    <label class="chk"><input type="checkbox" name="optin" id="optin"><span>Quiero recibir novedades y consejos de DEVISEBIT por email o WhatsApp. <span class="muted">(Opcional. Te podés dar de baja cuando quieras.)</span></span></label>
    <label class="f hidden" id="phoneWrap">WhatsApp (opcional)<input class="in" name="phone" type="tel" inputmode="tel" placeholder="+54 9 11 …" autocomplete="tel"></label>
    <button class="btn block">Crear cuenta gratis</button>
    <button type="button" class="linkbtn" data-m="login">Ya tengo cuenta</button>`;
  else if (authMode === 'login') f = `
    <label class="f">Email<input class="in" name="email" type="email" autocomplete="email" required></label>
    <label class="f">Contraseña<input class="in" name="pass" type="password" autocomplete="current-password" required></label>
    <button class="btn block">Ingresar</button>
    <button type="button" class="btn ghost block" data-m="forgot">✉️ Entrar con un código por email</button>
    <div style="display:flex;justify-content:space-between"><button type="button" class="linkbtn" data-m="signup">Crear cuenta</button><button type="button" class="linkbtn" data-m="forgot">Olvidé mi contraseña</button></div>`;
  else if (authMode === 'forgot') f = otpEmail ? `
    <p class="muted" style="margin:0">Lo mandamos a <b>${esc(otpEmail)}</b>. Revisá también spam o promociones.</p>
    <label class="f">Código<input class="in" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" required style="font-size:1.6rem;letter-spacing:.4em;text-align:center"></label>
    <button class="btn block">Entrar</button>
    <div style="display:flex;justify-content:space-between"><button type="button" class="linkbtn" id="otpOtro">Usar otro email</button><button type="button" class="linkbtn" id="otpRe">Mandar de nuevo</button></div>` : `
    <label class="f">Email<input class="in" name="email" type="email" autocomplete="email" required></label>
    <button class="btn block">Mandarme el código</button>
    <button type="button" class="linkbtn" data-m="login">Volver</button>`;
  else f = `
    <label class="f">Contraseña nueva<input class="in" name="pass" type="password" autocomplete="new-password" minlength="8" required></label>
    <button class="btn block">Guardar e ingresar</button>`;
  box.innerHTML = `<div class="authbox">
    <a class="logo" href="/"><img src="/icon.svg" alt="">MateCuentas</a>
    ${banner}
    <h1>${T[0]}</h1><p class="lead">${T[1]}</p>
    <form class="stack" id="af" novalidate>${f}<div id="aerr"></div></form>
    <p class="legal">Un producto de <b>DEVISEBIT</b> · <a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a></p></div>`;
  $$('[data-m]', box).forEach((b) => b.onclick = () => { box.dataset.touched = 1; showAuth(b.dataset.m); });
  if ($('#otpOtro')) $('#otpOtro').onclick = () => { otpEmail = ''; showAuth('forgot'); };
  if ($('#otpRe')) $('#otpRe').onclick = async () => { try { await api('auth?a=code', { email: otpEmail }); $('#aerr').innerHTML = '<div class="ok">Listo, te mandamos otro código.</div>'; } catch (e) { $('#aerr').innerHTML = `<div class="err">${esc(e.message)}</div>`; } };
  const ci = $('input[name=code]'); if (ci) { ci.focus(); ci.oninput = () => { ci.value = ci.value.replace(/\D/g, '').slice(0, 6); if (ci.value.length === 6) $('#af').requestSubmit(); }; }
  const oi = $('#optin'); if (oi) oi.onchange = () => $('#phoneWrap').classList.toggle('hidden', !oi.checked);
  $('#af').onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target)); const btn = $('button.btn', ev.target); const er = $('#aerr');
    er.innerHTML = ''; btn.disabled = true;
    try {
      let j;
      if (authMode === 'forgot' && !otpEmail) { await api('auth?a=code', { email: fd.email }); otpEmail = fd.email.trim().toLowerCase(); return showAuth('forgot'); }
      if (authMode === 'forgot') { j = await api('auth?a=codelogin', { email: otpEmail, code: fd.code }); otpEmail = ''; }
      else
      if (authMode === 'signup') {
        if (!fd.terms) throw new Error('Para seguir, aceptá los términos y la política de privacidad.');
        j = await api('auth?a=signup', { name: fd.name, email: fd.email, pass: fd.pass, terms: true, optin: !!fd.optin, phone: fd.phone || '', src: hashArg('join') ? 'invitacion' : 'web' });
      } else if (authMode === 'reset') { j = await api('auth?a=reset', { token: hashArg('reset'), pass: fd.pass }); clearHash(); }
      else j = await api('auth?a=login', { email: fd.email, pass: fd.pass });
      st.me = j.user; st.spaces = j.spaces; box.classList.add('hidden');
      await afterLogin();
    } catch (e) { er.innerHTML = `<div class="err">${esc(e.message)}</div>`; btn.disabled = false; }
  };
}

// ---------- onboarding ----------
const TPL = {
  hogar: ['🏠', 'Hogar / familia', 'Gastos de la casa, colegio, servicios.'],
  pareja: ['💞', 'Pareja', 'Lo compartido entre dos.'],
  personal: ['🙋', 'Personal', 'Solo tus gastos e ingresos.'],
  negocio: ['🧰', 'Emprendimiento', 'Ventas, insumos, impuestos.'],
  grupo: ['🧳', 'Viaje / grupo', 'Un viaje o un pozo común.'],
};
function showOnboarding(fromApp) {
  $('#boot').classList.add('hidden'); $('#auth').classList.add('hidden');
  let tpl = 'hogar';
  const html = `<div class="authbox">
    <a class="logo" href="/"><img src="/icon.svg" alt="">MateCuentas</a>
    <h1>${fromApp ? 'Nuevo espacio' : '¡Bienvenido, ' + esc(st.me.name) + '!'}</h1>
    <p class="lead">¿Para qué lo vas a usar? Te armamos las categorías y después las cambiás como quieras.</p>
    <div class="tplgrid" id="tg">${Object.entries(TPL).map(([k, v]) => `<button data-k="${k}" class="${k === tpl ? 'on' : ''}"><span>${v[0]}</span><b>${v[1]}</b><small class="muted">${v[2]}</small></button>`).join('')}</div>
    <form class="stack" id="of" style="margin-top:16px">
      <label class="f">Nombre del espacio<input class="in" name="name" maxlength="50" value="${fromApp ? '' : 'Casa de ' + esc(st.me.name)}" required></label>
      <button class="btn block">Crear y empezar</button>${fromApp ? '<button type="button" class="btn ghost block" id="ocancel">Cancelar</button>' : ''}<div id="oerr"></div>
    </form></div>`;
  if (fromApp) { openModal('', html, { bare: true }); }
  else { $('#shell').classList.add('hidden'); const a = $('#auth'); a.classList.remove('hidden'); a.innerHTML = html; }
  const root = fromApp ? $('#modals') : $('#auth');
  $$('#tg button', root).forEach((b) => b.onclick = () => { tpl = b.dataset.k; $$('#tg button', root).forEach((x) => x.classList.toggle('on', x === b)); const n = $('[name=name]', root); if (!n.dataset.t) n.value = { hogar: 'Casa', pareja: 'Nosotros', personal: 'Mis cuentas', negocio: 'Mi emprendimiento', grupo: 'Viaje' }[tpl] + (tpl === 'hogar' && !fromApp ? ' de ' + st.me.name : ''); });
  $('[name=name]', root).oninput = (e) => { e.target.dataset.t = 1; };
  const c = $('#ocancel', root); if (c) c.onclick = closeModal;
  $('#of', root).onsubmit = async (ev) => {
    ev.preventDefault(); const b = $('button.btn', ev.target); b.disabled = true;
    try {
      const s = await api('space?a=create', { name: ev.target.name.value, tpl });
      await refreshMe(); closeModal(); await openSpace(s.id);
      toast('Espacio creado. Tocá + para cargar el primer movimiento.');
    } catch (e) { b.disabled = false; if (e.status === 402) { closeModal(); upsell('espacios'); } else $('#oerr', root).innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
}

// ---------- operaciones con guardado optimista ----------
let chain = Promise.resolve();
function ops(list, okMsg) {
  applyLocal(list); render();
  st.pending++; dot('busy');
  chain = chain.then(async () => {
    try { const s = await api('space?a=ops', { id: st.S.id, ops: list }); st.pending--; if (!st.pending) { st.S = s; render(); dot(''); } if (okMsg) toast(okMsg); }
    catch (e) {
      st.pending--; dot('err');
      if (e.status === 402) upsell('cuotas'); else toast(e.message, 4000);
      try { st.S = await api('space?id=' + st.S.id); render(); dot(''); } catch (x) { /* sin red */ }
    }
  });
  return chain;
}
function applyLocal(list) {
  const S = st.S;
  for (const op of list) {
    if (op.col === 'settings') { S.settings = { ...S.settings, ...op.data }; if (op.data.name) S.name = op.data.name; continue; }
    const L = S[op.col] || (S[op.col] = []);
    if (op.action === 'add') L.push({ id: op.id, ...op.data, by: st.me.id });
    else if (op.action === 'upd') { const it = L.find((x) => x.id === op.id); if (it) Object.assign(it, op.data); }
    else if (op.action === 'del') S[op.col] = L.filter((x) => x.id !== op.id);
    else if (op.action === 'delgrp') S.movs = L.filter((x) => x.grp !== op.grp);
  }
}

// ---------- helpers de datos ----------
const cats = (tipo) => (st.S.cats || []).filter((c) => !tipo || c.tipo === tipo).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const catById = (id) => (st.S.cats || []).find((c) => c.id === id) || { emoji: '•', name: 'Sin categoría', tipo: 'out' };
const monthMovs = (m = st.month) => (st.S.movs || []).filter((x) => x.fecha && x.fecha.startsWith(m));
const sum = (L) => L.reduce((a, x) => a + (Number(x.monto) || 0), 0);
const people = () => (st.S.settings && st.S.settings.people && st.S.settings.people.length ? st.S.settings.people : [st.me.name]);
const pagos = () => (st.S.settings && st.S.settings.pagos) || ['Transferencia', 'Débito', 'Efectivo', 'Crédito'];
const isPro = () => !!(st.S && st.S.pro);

// ---------- render ----------
function render() {
  if (!st.S) return;
  $('#spaceName').textContent = st.S.name;
  $('#spaceSub').textContent = (isPro() ? 'Pro · ' : '') + (st.spaces.length > 1 ? 'Tocá para cambiar' : (st.S.members.length > 1 ? st.S.members.length + ' personas' : 'Solo vos'));
  $('#mesLbl').textContent = mName(st.month, innerWidth < 520);
  $('#mesBox').classList.toggle('hidden', st.tab === 'mas');
  $('#gear').classList.toggle('on', st.tab === 'mas');
  $$('#tabs [data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === st.tab));
  const m = $('#main');
  const keep = document.activeElement && document.activeElement.id === 'q' ? document.activeElement.selectionStart : null;
  m.innerHTML = { home: vHome, movs: vMovs, plan: vPlan, mas: vMas, data: vData }[st.tab]();
  bindView();
  if (keep !== null) { const q = $('#q'); if (q) { q.focus(); q.setSelectionRange(keep, keep); } }
}

function vHome() {
  const L = monthMovs();
  const outs = L.filter((x) => x.tipo === 'out'); const ins = L.filter((x) => x.tipo === 'in');
  const tOut = sum(outs), tIn = sum(ins), bal = tIn - tOut;
  const budget = cats('out').reduce((a, c) => a + (Number(c.plan) || 0), 0);
  const r = fxRate();
  const outRows = cats('out').map((c) => { const xs = outs.filter((x) => x.cat === c.id); return { c, xs, t: sum(xs) }; });
  const orphan = outs.filter((x) => !st.S.cats.some((c) => c.id === x.cat));
  if (orphan.length) outRows.push({ c: { id: '_', emoji: '•', name: 'Sin categoría' }, xs: orphan, t: sum(orphan) });
  const used = outRows.filter((o) => o.t || o.c.plan).sort((a, b) => b.t - a.t);
  const byPerson = {};
  for (const x of ins) (byPerson[x.quien || 'Sin asignar'] = byPerson[x.quien || 'Sin asignar'] || []).push(x);
  const nextCuotas = (st.S.movs || []).filter((x) => x.grp && x.fecha >= addM(st.month, 1) && x.fecha < addM(st.month, 2) + '-00');
  return `<section class="view">
    ${magicCard()}
    <div class="card hero">
      <div class="lbl">Saldo de ${esc(mName(st.month))}</div>
      <div class="big num">${bal < 0 ? '−' : ''}${fmt(Math.abs(bal))}</div>
      <div class="kp num">
        <div><span>Entró</span><b>${fmtK(tIn)}</b></div>
        <div><span>Salió</span><b>${fmtK(tOut)}</b></div>
        <div><span>${budget ? 'Presupuesto' : 'Movimientos'}</span><b>${budget ? Math.round(tOut / budget * 100) + '%' : L.length}</b></div>
      </div>
    </div>
    ${r ? `<div class="fx num">💵 Dólar ${FX_LBL[st.S.settings.fx || 'blue']}: <b style="color:var(--fg)">${fmt(r)}</b> <span>· dolarapi.com</span></div>` : ''}
    <div class="two">
      <div class="card kind">
        <div class="rowh"><div><h2>↓ Egresos</h2><p class="sub">Lo que salió, por categoría</p></div><span class="tag num">${outs.length}</span></div>
        ${used.length ? used.map((o) => { const pct = o.c.plan ? Math.min(100, o.t / o.c.plan * 100) : 0; return `<button class="row" data-cat="${esc(o.c.id)}"><span class="emo">${esc(o.c.emoji)}</span><span style="min-width:0"><div class="nm">${esc(o.c.name)}</div><div class="meta">${o.xs.length} mov.${o.c.plan ? ' · de ' + fmt(o.c.plan) : ''}</div>${o.c.plan ? `<div class="bar"><i class="${o.t > o.c.plan ? 'over' : ''}" style="width:${pct}%"></i></div>` : ''}</span><span class="r num">${fmt(o.t)}${o.c.plan ? `<small class="${o.t > o.c.plan ? 'neg' : ''}">${o.t > o.c.plan ? 'pasado ' + fmt(o.t - o.c.plan) : 'quedan ' + fmt(o.c.plan - o.t)}</small>` : ''}</span></button>`; }).join('') : `<div class="empty"><b>Todavía no hay gastos este mes</b>Tocá + para cargar el primero.</div>`}
      </div>
      <div class="card kind in">
        <div class="rowh"><div><h2>↑ Ingresos</h2><p class="sub">Lo que entró, por persona</p></div><span class="tag num">${ins.length}</span></div>
        ${Object.keys(byPerson).length ? Object.entries(byPerson).map(([p, xs]) => `<div class="grp">${esc(p)} · <span class="num">${fmt(sum(xs))}</span></div>` + xs.map((x) => { const c = catById(x.cat); return `<button class="row" data-mov="${esc(x.id)}"><span class="emo">${esc(c.emoji)}</span><span style="min-width:0"><div class="nm">${esc(x.detalle || c.name)}</div><div class="meta">${esc(c.name)} · ${esc(dayLbl(x.fecha))}</div></span><span class="r num pos">${fmt(x.monto)}</span></button>`; }).join('')).join('') : `<div class="empty"><b>Sin ingresos cargados</b>Cargá sueldos y extras para ver el saldo real.</div>`}
      </div>
    </div>
    ${nextCuotas.length ? `<div class="card"><div class="rowh"><div><h2>💳 Cuotas del mes que viene</h2><p class="sub">${esc(mName(addM(st.month, 1)))}</p></div><b class="num">${fmt(sum(nextCuotas))}</b></div>${nextCuotas.slice(0, 6).map((x) => `<div class="li"><div class="t"><b>${esc(x.detalle || catById(x.cat).name)}</b><small>Cuota ${esc(x.cuota)}</small></div><b class="num">${fmt(x.monto)}</b></div>`).join('')}</div>` : ''}
    ${!isPro() ? proTeaser() : ''}
  </section>`;
}
function proTeaser() {
  return `<button class="lock" data-up="ai"><span style="font-size:1.4rem">✦</span><span>Con <b>Pro</b>: cargas por audio y WhatsApp ilimitadas, tablero de datos, cuotas, dólares y varios espacios.</span></button>`;
}

function movRow(x) {
  const c = catById(x.cat);
  const extra = [x.quien, x.pago, x.cuota ? 'cuota ' + x.cuota : '', x.moneda === 'USD' ? fmtU(x.usd) : ''].filter(Boolean).join(' · ');
  return `<button class="row" data-mov="${esc(x.id)}"><span class="emo">${esc(c.emoji)}</span><span style="min-width:0"><div class="nm">${esc(x.detalle || c.name)}</div><div class="meta">${esc(c.name)}${extra ? ' · ' + esc(extra) : ''}</div></span><span class="r num ${x.tipo === 'in' ? 'pos' : ''}">${x.tipo === 'in' ? '+' : '−'}${fmt(x.monto)}</span></button>`;
}
function vMovs() {
  const q = st.q.trim().toLowerCase();
  let L = monthMovs().slice().sort((a, b) => (b.fecha + (b.ts || 0)).localeCompare(a.fecha + (a.ts || 0)));
  if (q) L = L.filter((x) => [x.detalle, catById(x.cat).name, x.quien, x.pago].join(' ').toLowerCase().includes(q));
  const days = {}; for (const x of L) (days[x.fecha] = days[x.fecha] || []).push(x);
  return `<section class="view">
    <div style="display:flex;gap:8px"><label class="search" style="flex:1"><input class="in" id="q" placeholder="Buscar en ${esc(mName(st.month))}" value="${esc(st.q)}" autocomplete="off"></label>
    <button class="chip gray" id="imp" title="Importar">⬆ Importar${isPro() ? '' : ' ✦'}</button><button class="chip gray" id="exp" title="Exportar">⬇ Excel${isPro() ? '' : ' ✦'}</button></div>
    <div class="card">${L.length ? Object.entries(days).map(([d, xs]) => `<div class="grp">${esc(dayLbl(d))} · <span class="num">${fmt(sum(xs.filter((x) => x.tipo === 'out')))}</span></div>` + xs.map(movRow).join('')).join('') : `<div class="empty"><b>${q ? 'Nada coincide' : 'Sin movimientos'}</b>${q ? 'Probá con otra palabra.' : 'Tocá + para cargar uno.'}</div>`}</div>
  </section>`;
}

function projection(n) {
  const fi = (st.S.fijos || []);
  const fIn = sum(fi.filter((f) => f.tipo === 'in')), fOut = sum(fi.filter((f) => f.tipo !== 'in'));
  const base = ym(today());
  const out = [];
  for (let k = 1; k <= n; k++) {
    const m = addM(base, k);
    const cu = (st.S.movs || []).filter((x) => x.grp && x.fecha.startsWith(m));
    const cuT = sum(cu);
    out.push({ m, fIn, fOut, cuT, cuN: cu.length, s: fIn - fOut - cuT });
  }
  return out;
}
function vPlan() {
  const fi = (st.S.fijos || []).slice().sort((a, b) => (a.tipo === b.tipo ? (a.order ?? 0) - (b.order ?? 0) : a.tipo === 'in' ? -1 : 1));
  const loaded = new Set(monthMovs().map((x) => x.fijo).filter(Boolean));
  const lim = isPro() ? 12 : 4;
  const P = projection(lim);
  const notas = (st.S.notas || []).slice().sort((a, b) => (a.done - b.done) || (b.order ?? 0) - (a.order ?? 0));
  return `<section class="view"><div class="two">
    <div class="card">
      <div class="rowh"><div><h2>📌 Fijos del mes</h2><p class="sub">Lo que se repite todos los meses. Tocá ＋ para pasarlo a ${esc(mName(st.month))}.</p></div><button class="chip" id="addFijo">Agregar</button></div>
      ${fi.length ? fi.map((f) => { const c = catById(f.cat); const ok = loaded.has(f.id); return `<div class="li"><span class="emo">${esc(c.emoji)}</span><div class="t" data-fijo="${esc(f.id)}" style="cursor:pointer"><b>${esc(f.name)}</b><small>${f.tipo === 'in' ? 'Ingreso' : esc(c.name)}${f.pago ? ' · ' + esc(f.pago) : ''}${f.quien ? ' · ' + esc(f.quien) : ''}</small></div><b class="num ${f.tipo === 'in' ? 'pos' : ''}">${fmt(f.monto)}</b><button class="ib" data-load="${esc(f.id)}" title="${ok ? 'Ya cargado este mes' : 'Cargar al mes'}" ${ok ? 'disabled style="opacity:.5"' : ''}>${ok ? '✓' : '＋'}</button></div>`; }).join('') + `<div class="li"><div class="t"><b>Total fijo</b></div><b class="num">${fmt(sum(fi.filter((f) => f.tipo !== 'in')))} <span class="muted small">salen</span></b></div>` : `<div class="empty"><b>Sin fijos todavía</b>Alquiler, colegio, prepaga, internet… cargalos una vez y los pasás cada mes con un toque.</div>`}
    </div>
    <div class="card">
      <div class="rowh"><div><h2>🔭 Proyección</h2><p class="sub">Próximos ${lim} meses: fijos + cuotas ya comprometidas.</p></div></div>
      <div class="proj">${P.map((p) => `<div class="pm"><span class="m">${esc(mName(p.m, true))}</span><span class="d num">+${fmt(p.fIn)} fijos<br>−${fmt(p.fOut)} fijos${p.cuT ? ' · −' + fmt(p.cuT) + ' en ' + p.cuN + ' cuota' + (p.cuN > 1 ? 's' : '') : ''}</span><span class="s num ${p.s < 0 ? 'neg' : 'pos'}">${p.s < 0 ? '−' : ''}${fmt(Math.abs(p.s))}</span></div>`).join('')}
      ${!isPro() ? '<button class="lock" data-up="proj"><span>✦</span><span>Ver 12 meses y sumar cuotas con Pro</span></button>' : ''}</div>
    </div></div>
    <div class="two">
    <div class="card">
      <div class="rowh"><div><h2>🎯 Presupuesto por categoría</h2><p class="sub">Un tope mensual para cada gasto. Se ve en Inicio.</p></div></div>
      ${cats('out').map((c) => `<div class="li"><span class="emo">${esc(c.emoji)}</span><div class="t"><b>${esc(c.name)}</b></div><input class="in num" style="max-width:9.5rem;text-align:right;padding:8px 10px" inputmode="numeric" data-plan="${esc(c.id)}" value="${c.plan ? Math.round(c.plan).toLocaleString('es-AR') : ''}" placeholder="sin tope"></div>`).join('')}
    </div>
    <div class="card">
      <div class="rowh"><div><h2>📝 Notas</h2><p class="sub">Pendientes, ideas, lo que hay que acordar.</p></div><button class="chip" id="addNota">Agregar</button></div>
      ${notas.length ? notas.map((n) => `<div class="li"><button class="ib" data-done="${esc(n.id)}">${n.done ? '✓' : '○'}</button><div class="t" data-nota="${esc(n.id)}" style="cursor:pointer;${n.done ? 'opacity:.55;text-decoration:line-through' : ''}"><b>${esc(n.title || 'Nota')}</b>${n.text ? `<small>${esc(n.text.slice(0, 90))}</small>` : ''}</div></div>`).join('') : '<div class="empty">Nada anotado.</div>'}
    </div></div>
  </section>`;
}

function vMas() {
  const S = st.S, me = st.me;
  return `<section class="view"><div class="two">
    <div class="card">
      <div class="rowh"><div><h2>${esc(S.name)}</h2><p class="sub">${esc((TPL[S.tpl] || TPL.hogar)[1])} · ${S.members.length} ${S.members.length === 1 ? 'persona' : 'personas'}${isPro() ? ' · <span class="tag pro">Pro</span>' : ''}</p></div>${S.isOwner ? '<button class="chip gray" id="ren">Renombrar</button>' : ''}</div>
      <h3>Quiénes tienen acceso</h3>
      <div class="lst">${S.members.map((m) => `<div class="li"><span class="emo">${m.role === 'owner' ? '👑' : '🙂'}</span><div class="t"><b>${esc(m.name)}${m.uid === me.id ? ' (vos)' : ''}</b><small>${m.role === 'owner' ? 'Creó el espacio' : 'Miembro'}</small></div>${S.isOwner && m.uid !== me.id ? `<button class="ib del" data-kick="${esc(m.uid)}" title="Sacar">✕</button>` : ''}</div>`).join('')}</div>
      ${S.isOwner ? `<button class="btn soft block" id="inv" style="margin-top:10px">Invitar a alguien</button><p class="hint" style="margin:8px 0 0">${isPro() ? 'Hasta ' + S.limits.members + ' personas.' : 'Plan gratis: hasta ' + S.limits.members + ' personas con cuenta.'}</p>` : ''}
      <h3>Personas para “quién”</h3><p class="hint" style="margin:0 0 8px">Pueden ser chicos o alguien sin cuenta: solo sirven para saber de quién es cada movimiento.</p>
      <div class="chips" id="ppl">${people().map((p) => `<button data-pp="${esc(p)}">${esc(p)} ✕</button>`).join('')}<button id="addP">＋ Agregar</button></div>
      <h3>Medios de pago</h3>
      <div class="chips" id="pgs">${pagos().map((p) => `<button data-pg="${esc(p)}">${esc(p)} ✕</button>`).join('')}<button id="addPg">＋ Agregar</button></div>
      <h3>Dólar de referencia</h3>
      <div class="seg" id="fxs">${Object.entries(FX_LBL).map(([k, v]) => `<button data-fx="${k}" class="${(S.settings.fx || 'blue') === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <h3>Categorías</h3>
      <button class="btn ghost block" id="editCats">Editar categorías</button>
    </div>
    <div class="view">
      <div class="card">${planBox()}</div>
      <div class="card">${botCard()}</div>
      <div class="card">
        <div class="rowh"><div><h2>Tus espacios</h2><p class="sub">Cada espacio tiene sus propias cuentas y personas.</p></div></div>
        <div class="lst">${st.spaces.map((s) => `<div class="li"><span class="emo">${esc((TPL[s.tpl] || TPL.hogar)[0])}</span><div class="t"><b>${esc(s.name)}</b><small>${s.owner ? 'Tuyo' : 'Compartido con vos'} · ${s.members} ${s.members === 1 ? 'persona' : 'personas'}</small></div>${s.id === S.id ? '<span class="tag">Abierto</span>' : `<button class="chip gray" data-open="${esc(s.id)}">Abrir</button>`}</div>`).join('')}</div>
        <button class="btn soft block" id="newSp" style="margin-top:10px">＋ Nuevo espacio${me.plan === 'pro' ? '' : ' ✦'}</button>
        <button class="linkbtn" id="leave" style="margin-top:6px;color:var(--out)">${S.isOwner ? 'Borrar este espacio' : 'Salir de este espacio'}</button>
      </div>
      <div class="card">
        <div class="rowh"><div><h2>Tu cuenta</h2><p class="sub">${esc(me.email)}</p></div></div>
        <label class="f">Tu nombre<input class="in" id="myName" value="${esc(me.name)}" maxlength="60"></label>
        <label class="chk" style="margin-top:12px"><input type="checkbox" id="myOpt" ${me.optin ? 'checked' : ''}><span>Recibir novedades y consejos de DEVISEBIT</span></label>
        <div style="display:grid;gap:8px;margin-top:14px">
          <button class="btn ghost block" id="chPass">Cambiar contraseña</button>
          <button class="btn ghost block" id="logout">Cerrar sesión</button>
        </div>
        <p class="legal" style="text-align:left"><a href="/privacidad" target="_blank">Privacidad</a> · <a href="/terminos" target="_blank">Términos</a> · <a href="${CONTACT}">Ayuda</a> · <button class="linkbtn small" id="delAcc" style="color:var(--out);padding:0">Borrar mi cuenta</button></p>
      </div>
    </div></div></section>`;
}
function planBox() {
  const me = st.me;
  if (me.plan === 'pro') {
    const s = me.subStatus;
    return `<div class="rowh"><div><h2>MateCuentas Pro <span class="tag pro">Activo</span></h2><p class="sub">${me.proUntil ? 'Hasta el ' + new Date(me.proUntil).toLocaleDateString('es-AR') : 'Se renueva todos los meses por Mercado Pago'}</p></div></div>
      <p class="small muted" style="margin:0 0 10px">Gracias por bancar el proyecto 🙌</p>
      ${s === 'authorized' ? '<button class="btn ghost block sm" id="cancelSub">Cancelar la suscripción</button>' : ''}`;
  }
  return `<div class="rowh"><div><h2>Plan gratis</h2><p class="sub">Todo lo esencial, para siempre.</p></div></div><button class="btn pro block" data-up="mas">✦ Conocer Pro · ${fmt(me.price)}/mes</button>`;
}

// ---------- eventos de las vistas ----------
function bindView() {
  const M = $('#main'); const $$ = (q) => [...M.querySelectorAll(q)];
  $$('[data-cat]').forEach((b) => b.onclick = () => openCat(b.dataset.cat));
  $$('[data-mov]').forEach((b) => b.onclick = () => openMov(b.dataset.mov));
  $$('[data-up]').forEach((b) => b.onclick = () => upsell(b.dataset.up));
  bindMagic(M);
  $$('[data-pro]').forEach((b) => b.onclick = () => upsell(b.dataset.pro));
  const lk = M.querySelector('#linkBot'); if (lk) lk.onclick = linkBot;
  $$('[data-unbot]').forEach((b) => b.onclick = async () => { const [ch, id] = b.dataset.unbot.split('|'); await api('space?a=unlinkbot', { id: st.S.id, ch, botId: id }); await refreshMe(); render(); toast('Chat desconectado'); });
  const q = $('#q'); if (q) q.oninput = () => { st.q = q.value; render(); };
  const ex = $('#exp'); if (ex) ex.onclick = exportCsv;
  const im = $('#imp'); if (im) im.onclick = importar;
  const ex2 = M.querySelector('#exp2'); if (ex2) ex2.onclick = exportCsv;
  // plan
  const af = $('#addFijo'); if (af) af.onclick = () => openFijo();
  $$('[data-fijo]').forEach((b) => b.onclick = () => openFijo(b.dataset.fijo));
  $$('[data-load]').forEach((b) => b.onclick = () => {
    const f = st.S.fijos.find((x) => x.id === b.dataset.load); if (!f) return;
    const fecha = st.month === ym(today()) ? today() : st.month + '-01';
    ops([{ col: 'movs', action: 'add', id: uid('m'), data: { fecha, tipo: f.tipo || 'out', cat: f.cat, monto: f.monto, moneda: 'ARS', quien: f.quien || '', pago: f.pago || '', detalle: f.name, fijo: f.id, ts: Date.now() } }], f.name + ' cargado en ' + mName(st.month));
  });
  $$('[data-plan]').forEach((i) => i.onchange = () => { const v = parseNum(i.value); ops([{ col: 'cats', action: 'upd', id: i.dataset.plan, data: { plan: v || null } }]); });
  const an = $('#addNota'); if (an) an.onclick = () => openNota();
  $$('[data-nota]').forEach((b) => b.onclick = () => openNota(b.dataset.nota));
  $$('[data-done]').forEach((b) => b.onclick = () => { const n = st.S.notas.find((x) => x.id === b.dataset.done); ops([{ col: 'notas', action: 'upd', id: n.id, data: { done: !n.done } }]); });
  // ajustes
  const on = (id, fn) => { const e = $('#' + id); if (e) e.onclick = fn; };
  on('ren', () => prompt2('Nombre del espacio', st.S.name, (v) => ops([{ col: 'settings', action: 'set', data: { name: v } }])));
  on('inv', invite);
  $$('[data-kick]').forEach((b) => b.onclick = () => confirm2('¿Sacar a esta persona del espacio?', 'Va a dejar de ver estas cuentas.', async () => { await api('space?a=kick', { id: st.S.id, uid: b.dataset.kick }); st.S = await api('space?id=' + st.S.id); render(); toast('Listo'); }));
  $$('[data-pp]').forEach((b) => b.onclick = () => { const p = people().filter((x) => x !== b.dataset.pp); if (!p.length) return toast('Tiene que quedar al menos una persona'); ops([{ col: 'settings', action: 'set', data: { people: p } }]); });
  on('addP', () => prompt2('Nombre de la persona', '', (v) => ops([{ col: 'settings', action: 'set', data: { people: [...people(), v] } }])));
  $$('[data-pg]').forEach((b) => b.onclick = () => ops([{ col: 'settings', action: 'set', data: { pagos: pagos().filter((x) => x !== b.dataset.pg) } }]));
  on('addPg', () => prompt2('Medio de pago', '', (v) => ops([{ col: 'settings', action: 'set', data: { pagos: [...pagos(), v] } }])));
  $$('[data-fx]').forEach((b) => b.onclick = () => ops([{ col: 'settings', action: 'set', data: { fx: b.dataset.fx } }]));
  on('editCats', openCats);
  $$('[data-open]').forEach((b) => b.onclick = () => { st.tab = 'home'; openSpace(b.dataset.open); });
  on('newSp', () => { if (st.me.plan !== 'pro' && st.spaces.filter((s) => s.owner).length >= 1) return upsell('espacios'); showOnboarding(true); });
  on('leave', () => confirm2(st.S.isOwner ? '¿Borrar “' + st.S.name + '”?' : '¿Salir de “' + st.S.name + '”?', st.S.isOwner ? 'Se borran todos sus movimientos para todos. No se puede deshacer.' : 'Vas a dejar de ver estas cuentas.', async () => {
    await api('space?a=' + (st.S.isOwner ? 'delete' : 'leave'), { id: st.S.id }); await refreshMe(); st.tab = 'home';
    if (st.spaces.length) openSpace(st.spaces[0].id); else { $('#shell').classList.add('hidden'); showOnboarding(); }
  }));
  const mn = $('#myName'); if (mn) mn.onchange = async () => { const j = await api('auth?a=profile', { name: mn.value }); st.me = j.user; toast('Guardado'); };
  const mo = $('#myOpt'); if (mo) mo.onchange = async () => { const j = await api('auth?a=profile', { optin: mo.checked, phone: st.me.phone }); st.me = j.user; toast(mo.checked ? 'Te vamos a avisar las novedades' : 'Listo, no te escribimos más'); };
  on('chPass', changePass);
  on('logout', async () => { await api('auth?a=logout', {}); location.href = '/'; });
  on('delAcc', deleteAccount);
  on('cancelSub', () => confirm2('¿Cancelar Pro?', 'Seguís con Pro hasta el final del mes pagado y después pasás al plan gratis. No se borra nada.', async () => { const j = await api('billing?a=cancel', {}); st.me = j.user; render(); toast('Suscripción cancelada'); }));
}

// ---------- modales ----------
function openModal(title, html, o = {}) {
  closeModal(true);
  const w = document.createElement('div'); w.className = 'modal';
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${o.bare ? '<div class="grab"></div>' + html : `<div class="grab"></div><div class="shead"><h2>${title}</h2><button class="x" aria-label="Cerrar">✕</button></div>${html}`}</div>`;
  $('#modals').appendChild(w);
  w.addEventListener('click', (e) => { if (e.target === w) closeModal(); });
  const x = $('.x', w); if (x) x.onclick = () => closeModal();
  const sh = $('.sheet', w); let y0 = null;
  sh.addEventListener('touchstart', (e) => { y0 = sh.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sh.addEventListener('touchend', (e) => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 110) closeModal(); y0 = null; });
  history.pushState({ m: 1 }, '');
  return w;
}
function closeModal(silent) { const m = $('#modals'); if (m.children.length) { m.innerHTML = ''; if (!silent && history.state && history.state.m) history.back(); } }
window.addEventListener('popstate', () => { $('#modals').innerHTML = ''; });
function confirm2(title, text, fn) {
  const w = openModal(esc(title), `<p class="muted" style="margin:0 0 16px">${esc(text)}</p><div class="g2"><button class="btn ghost" id="cn">Cancelar</button><button class="btn danger" id="cy">Sí, seguir</button></div>`);
  $('#cn', w).onclick = () => closeModal();
  $('#cy', w).onclick = async () => { $('#cy', w).disabled = true; try { await fn(); closeModal(); } catch (e) { toast(e.message, 4000); $('#cy', w).disabled = false; } };
}
function prompt2(title, val, fn) {
  const w = openModal(esc(title), `<form id="pf" class="stack"><input class="in" name="v" value="${esc(val)}" maxlength="50" required><button class="btn block">Guardar</button></form>`);
  const i = $('[name=v]', w); setTimeout(() => i.focus(), 50);
  $('#pf', w).onsubmit = (e) => { e.preventDefault(); const v = i.value.trim(); if (!v) return; closeModal(); fn(v); };
}

// Movimiento: alta y edición
function openMov(id, preset = {}) {
  const x = id ? st.S.movs.find((m) => m.id === id) : null;
  if (id && !x) return;
  const d = x ? { ...x } : { tipo: 'out', fecha: st.month === ym(today()) ? today() : st.month + '-01', moneda: 'ARS', quien: people()[0], pago: '', cat: '', ...preset };
  let cuotas = 1;
  const pro = isPro();
  const w = openModal(x ? 'Editar movimiento' : 'Nuevo movimiento', `<form id="mf" class="stack">
    <div class="seg" id="tp"><button type="button" data-v="out" class="out">Gasto</button><button type="button" data-v="in" class="in">Ingreso</button></div>
    <div class="amount"><span class="cur" id="curS">$</span><input id="amt" inputmode="decimal" placeholder="0" autocomplete="off" value="${x ? (x.moneda === 'USD' ? x.usd : Math.round(x.monto)).toLocaleString('es-AR') : ''}"><button type="button" class="cur-t" id="curT">${d.moneda === 'USD' ? 'USD' : 'ARS'}${pro ? '' : ' ✦'}</button></div>
    <div class="hint num" id="usdHint"></div>
    <div><div class="hint" style="margin-bottom:6px">Categoría</div><div class="chips" id="cc"></div></div>
    <label class="f">Detalle<input class="in" name="detalle" maxlength="200" placeholder="Ej: súper Coto, cuota colegio…" value="${esc(d.detalle || '')}"></label>
    <div class="g2">
      <label class="f">Fecha<input class="in" type="date" name="fecha" value="${esc(d.fecha)}" required></label>
      <label class="f">Quién<select class="in" name="quien">${[...new Set([...people(), d.quien].filter(Boolean))].map((p) => `<option ${p === d.quien ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    </div>
    <label class="f">Cómo se pagó<select class="in" name="pago"><option value="">—</option>${[...new Set([...pagos(), d.pago].filter(Boolean))].map((p) => `<option ${p === d.pago ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    ${x ? (x.grp ? `<p class="hint">Cuota ${esc(x.cuota)} de una compra en cuotas.</p>` : '') : `<div id="cuW"><div class="hint" style="margin-bottom:6px">Cuotas ${pro ? '' : '<span class="tag pro">Pro</span>'}</div><div class="chips" id="cuo">${[1, 3, 6, 9, 12, 18].map((n) => `<button type="button" data-n="${n}" class="${n === 1 ? 'on' : ''}">${n === 1 ? 'Un pago' : n}</button>`).join('')}</div><div class="hint num" id="cuH" style="margin-top:6px"></div></div>`}
    <button class="btn block" id="msave">${x ? 'Guardar cambios' : 'Guardar'}</button>
    ${x ? `<button type="button" class="btn danger block" id="mdel">${x.grp ? 'Borrar…' : 'Borrar'}</button>` : ''}
  </form>`);
  const amt = $('#amt', w);
  const paintTipo = () => {
    $$('#tp button', w).forEach((b) => b.classList.toggle('on', b.dataset.v === d.tipo));
    const L = cats(d.tipo);
    if (!L.some((c) => c.id === d.cat)) d.cat = (L[0] || {}).id || '';
    $('#cc', w).innerHTML = L.map((c) => `<button type="button" data-c="${esc(c.id)}" class="${c.id === d.cat ? 'on' : ''}">${esc(c.emoji)} ${esc(c.name)}</button>`).join('');
    $$('#cc button', w).forEach((b) => b.onclick = () => { d.cat = b.dataset.c; $$('#cc button', w).forEach((y) => y.classList.toggle('on', y === b)); });
    const cw = $('#cuW', w); if (cw) cw.classList.toggle('hidden', d.tipo === 'in');
  };
  const hint = () => {
    const v = parseNum(amt.value); const r = fxRate();
    $('#curS', w).textContent = d.moneda === 'USD' ? 'US$' : '$';
    $('#usdHint', w).textContent = d.moneda === 'USD' ? (r ? `≈ ${fmt(v * r)} al dólar ${FX_LBL[st.S.settings.fx || 'blue']} (${fmt(r)})` : 'Sin cotización disponible ahora.') : '';
    const ch = $('#cuH', w); if (ch) ch.textContent = cuotas > 1 && v ? `${cuotas} cuotas de ${fmt((d.moneda === 'USD' && r ? v * r : v) / cuotas)} desde ${mName(ym($('[name=fecha]', w).value || today()))}` : '';
  };
  $$('#tp button', w).forEach((b) => b.onclick = () => { d.tipo = b.dataset.v; paintTipo(); });
  $('#curT', w).onclick = () => { if (!pro) return upsell('usd'); d.moneda = d.moneda === 'USD' ? 'ARS' : 'USD'; $('#curT', w).textContent = d.moneda; hint(); };
  $$('#cuo button', w).forEach((b) => b.onclick = () => { const n = Number(b.dataset.n); if (n > 1 && !pro) return upsell('cuotas'); cuotas = n; $$('#cuo button', w).forEach((y) => y.classList.toggle('on', y === b)); hint(); });
  amt.oninput = hint; $('[name=fecha]', w).onchange = hint;
  paintTipo(); hint();
  if (!x) setTimeout(() => amt.focus(), 80);
  $('#mf', w).onsubmit = (e) => {
    e.preventDefault();
    const f = e.target; const v = parseNum(amt.value);
    if (!v || v <= 0) { amt.focus(); return toast('Poné un monto'); }
    if (!d.cat) return toast('Elegí una categoría');
    const r = fxRate();
    if (d.moneda === 'USD' && !r && !(x && x.rate)) return toast('No hay cotización ahora, probá en un rato');
    const rate = d.moneda === 'USD' ? (r || x.rate) : null;
    const ars = d.moneda === 'USD' ? v * rate : v;
    const base = { tipo: d.tipo, cat: d.cat, moneda: d.moneda, usd: d.moneda === 'USD' ? v : null, rate, quien: f.quien.value, pago: f.pago.value, detalle: f.detalle.value.trim() };
    if (x) { closeModal(); return ops([{ col: 'movs', action: 'upd', id: x.id, data: { ...base, monto: ars, fecha: f.fecha.value } }], 'Guardado'); }
    if (cuotas > 1 && d.tipo === 'out') {
      const grp = uid('g'); const list = []; const each = Math.round(ars / cuotas * 100) / 100;
      for (let i = 0; i < cuotas; i++) {
        const m = addM(ym(f.fecha.value), i); const day = f.fecha.value.slice(8, 10);
        const last = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();
        list.push({ col: 'movs', action: 'add', id: uid('m'), data: { ...base, monto: each, usd: base.usd ? Math.round(base.usd / cuotas * 100) / 100 : null, fecha: m + '-' + String(Math.min(Number(day), last)).padStart(2, '0'), grp, cuota: (i + 1) + '/' + cuotas, ts: Date.now() + i } });
      }
      closeModal(); return ops(list, `Cargado en ${cuotas} cuotas`);
    }
    closeModal(); ops([{ col: 'movs', action: 'add', id: uid('m'), data: { ...base, monto: ars, fecha: f.fecha.value, ts: Date.now() } }], d.tipo === 'in' ? 'Ingreso guardado' : 'Gasto guardado');
  };
  const del = $('#mdel', w);
  if (del) del.onclick = () => {
    if (!x.grp) { closeModal(); return ops([{ col: 'movs', action: 'del', id: x.id }], 'Borrado'); }
    const w2 = openModal('Borrar cuota', `<p class="muted" style="margin:0 0 14px">Esta es la cuota ${esc(x.cuota)}. ¿Qué querés borrar?</p><div style="display:grid;gap:8px"><button class="btn ghost block" id="d1">Solo esta cuota</button><button class="btn danger block" id="dall">Toda la compra (todas las cuotas)</button></div>`);
    $('#d1', w2).onclick = () => { closeModal(); ops([{ col: 'movs', action: 'del', id: x.id }], 'Cuota borrada'); };
    $('#dall', w2).onclick = () => { closeModal(); ops([{ col: 'movs', action: 'delgrp', grp: x.grp }], 'Compra borrada'); };
  };
}

function openCat(cid) {
  const c = cid === '_' ? { emoji: '•', name: 'Sin categoría' } : catById(cid);
  const xs = monthMovs().filter((x) => x.tipo === 'out' && (cid === '_' ? !st.S.cats.some((k) => k.id === x.cat) : x.cat === cid)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const by = {}; for (const x of xs) { const k = (x.detalle || '').trim() || c.name; (by[k] = by[k] || []).push(x); }
  const w = openModal(`${esc(c.emoji)} ${esc(c.name)}`, `<div class="rowh"><span class="muted">${esc(mName(st.month))} · ${xs.length} mov.</span><b class="num" style="font-size:1.2rem">${fmt(sum(xs))}</b></div>
    ${xs.length ? Object.entries(by).sort((a, b) => sum(b[1]) - sum(a[1])).map(([k, L]) => (L.length > 1 ? `<div class="grp">${esc(k)} · <span class="num">${fmt(sum(L))}</span></div>` : '') + L.map(movRow).join('')).join('') : '<div class="empty">Sin gastos en esta categoría este mes.</div>'}
    ${cid !== '_' ? `<button class="btn soft block" id="addHere" style="margin-top:12px">＋ Cargar en ${esc(c.name)}</button>` : ''}`);
  $$('[data-mov]', w).forEach((b) => b.onclick = () => openMov(b.dataset.mov));
  const ah = $('#addHere', w); if (ah) ah.onclick = () => openMov(null, { cat: cid, tipo: 'out' });
}

function openFijo(id) {
  const f = id ? st.S.fijos.find((x) => x.id === id) : { tipo: 'out', name: '', monto: '', cat: (cats('out')[0] || {}).id, quien: '', pago: '' };
  const w = openModal(id ? 'Editar fijo' : 'Nuevo fijo', `<form id="ff" class="stack">
    <div class="seg" id="ft"><button type="button" data-v="out" class="out">Gasto fijo</button><button type="button" data-v="in" class="in">Ingreso fijo</button></div>
    <label class="f">Nombre<input class="in" name="name" required maxlength="60" value="${esc(f.name)}" placeholder="Ej: Alquiler, Colegio, Sueldo"></label>
    <label class="f">Monto mensual<input class="in num" name="monto" inputmode="numeric" required value="${f.monto ? Math.round(f.monto).toLocaleString('es-AR') : ''}"></label>
    <label class="f">Categoría<select class="in" name="cat" id="fcat"></select></label>
    <div class="g2"><label class="f">Quién<select class="in" name="quien"><option value="">—</option>${people().map((p) => `<option ${p === f.quien ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    <label class="f">Pago<select class="in" name="pago"><option value="">—</option>${pagos().map((p) => `<option ${p === f.pago ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label></div>
    <button class="btn block">Guardar</button>${id ? '<button type="button" class="btn danger block" id="fdel">Borrar fijo</button>' : ''}</form>`);
  let tipo = f.tipo || 'out';
  const paint = () => { $$('#ft button', w).forEach((b) => b.classList.toggle('on', b.dataset.v === tipo)); $('#fcat', w).innerHTML = cats(tipo).map((c) => `<option value="${esc(c.id)}" ${c.id === f.cat ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join(''); };
  $$('#ft button', w).forEach((b) => b.onclick = () => { tipo = b.dataset.v; paint(); });
  paint();
  $('#ff', w).onsubmit = (e) => {
    e.preventDefault(); const t = e.target;
    const data = { tipo, name: t.name.value.trim(), monto: parseNum(t.monto.value), cat: t.cat.value, quien: t.quien.value, pago: t.pago.value };
    if (!data.monto) return toast('Poné el monto');
    closeModal(); ops([id ? { col: 'fijos', action: 'upd', id, data } : { col: 'fijos', action: 'add', id: uid('f'), data: { ...data, order: (st.S.fijos || []).length } }], 'Fijo guardado');
  };
  const d = $('#fdel', w); if (d) d.onclick = () => { closeModal(); ops([{ col: 'fijos', action: 'del', id }], 'Fijo borrado'); };
}

function openNota(id) {
  const n = id ? st.S.notas.find((x) => x.id === id) : { title: '', text: '' };
  const w = openModal(id ? 'Nota' : 'Nueva nota', `<form id="nf" class="stack"><input class="in" name="title" placeholder="Título" maxlength="120" value="${esc(n.title)}" required><textarea class="in" name="text" placeholder="Detalle (opcional)" maxlength="4000">${esc(n.text)}</textarea><button class="btn block">Guardar</button>${id ? '<button type="button" class="btn danger block" id="ndel">Borrar</button>' : ''}</form>`);
  $('#nf', w).onsubmit = (e) => { e.preventDefault(); const data = { title: e.target.title.value.trim(), text: e.target.text.value.trim() }; closeModal(); ops([id ? { col: 'notas', action: 'upd', id, data } : { col: 'notas', action: 'add', id: uid('n'), data: { ...data, done: false, order: Date.now() } }]); };
  const d = $('#ndel', w); if (d) d.onclick = () => { closeModal(); ops([{ col: 'notas', action: 'del', id }]); };
}

function openCats() {
  const draw = () => {
    const sec = (tipo, t) => `<div class="grp">${t}</div>` + cats(tipo).map((c, i, A) => `<div class="li"><button class="ib" data-emo="${esc(c.id)}">${esc(c.emoji)}</button><div class="t"><input class="in" data-nm="${esc(c.id)}" value="${esc(c.name)}" maxlength="40" style="padding:8px 10px"></div><button class="ib" data-cu="${esc(c.id)}" ${i ? '' : 'disabled style="opacity:.3"'}>↑</button><button class="ib" data-cd="${esc(c.id)}" ${i < A.length - 1 ? '' : 'disabled style="opacity:.3"'}>↓</button><button class="ib del" data-dc="${esc(c.id)}">✕</button></div>`).join('') + `<button class="chip" data-nc="${tipo}" style="margin-top:8px">＋ Agregar</button>`;
    return sec('out', 'Gastos') + sec('in', 'Ingresos');
  };
  const w = openModal('Categorías', '<div id="cl"></div>');
  const paint = () => {
    $('#cl', w).innerHTML = draw();
    $$('[data-nm]', w).forEach((i) => i.onchange = () => i.value.trim() && ops([{ col: 'cats', action: 'upd', id: i.dataset.nm, data: { name: i.value.trim() } }]));
    $$('[data-emo]', w).forEach((b) => b.onclick = () => { const v = window.prompt('Emoji para la categoría', b.textContent); if (v && v.trim()) { ops([{ col: 'cats', action: 'upd', id: b.dataset.emo, data: { emoji: [...v.trim()].slice(0, 2).join('') } }]); paint(); } });
    const move = (id, k) => { const c = catById(id); const L = cats(c.tipo); const i = L.findIndex((x) => x.id === id); const j = i + k; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; ops(L.map((x, n) => ({ col: 'cats', action: 'upd', id: x.id, data: { order: n } }))); paint(); };
    $$('[data-cu]', w).forEach((b) => b.onclick = () => move(b.dataset.cu, -1));
    $$('[data-cd]', w).forEach((b) => b.onclick = () => move(b.dataset.cd, 1));
    $$('[data-dc]', w).forEach((b) => b.onclick = () => { const n = (st.S.movs || []).filter((x) => x.cat === b.dataset.dc).length; if (n && !window.confirm(`Tiene ${n} movimientos. Van a quedar como “Sin categoría”. ¿Borrar igual?`)) return; ops([{ col: 'cats', action: 'del', id: b.dataset.dc }]); paint(); });
    $$('[data-nc]', w).forEach((b) => b.onclick = () => { const name = window.prompt('Nombre de la categoría'); if (!name || !name.trim()) return; ops([{ col: 'cats', action: 'add', id: uid('c'), data: { tipo: b.dataset.nc, emoji: b.dataset.nc === 'in' ? '💰' : '📦', name: name.trim(), order: cats(b.dataset.nc).length } }]); paint(); });
  };
  paint();
}

async function invite() {
  try {
    const { link } = await api('space?a=invite', { id: st.S.id });
    const txt = `Te invito a llevar las cuentas de “${st.S.name}” conmigo en MateCuentas: ${link}`;
    const w = openModal('Invitar', `<form id="ivf" class="stack" style="margin-bottom:14px"><label class="f">Invitar por email (recomendado)<input class="in" type="email" name="email" placeholder="email de la persona" required></label><button class="btn block">Mandar invitación</button><div id="ive"></div>
      <p class="muted" style="margin:0;font-size:.85rem">Le llega un mail con un botón. Entre como entre (con ese email, por el link o creando la cuenta después), queda adentro de este espacio.</p></form>
      <p class="muted" style="margin:0 0 10px">O mandale este enlace por donde quieras:</p>
      <input class="in" readonly value="${esc(link)}" id="lk">
      <div style="display:grid;gap:8px;margin-top:12px"><a class="btn block" style="text-decoration:none;background:#25d366" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">Enviar por WhatsApp</a><button class="btn ghost block" id="cp">Copiar enlace</button></div>`);
    $('#ivf', w).onsubmit = async (ev) => { ev.preventDefault(); const em = ev.target.email.value; const b = $('#ivf button', w); b.disabled = true;
      try { const r = await api('space?a=invitemail', { id: st.S.id, email: em }); $('#ive', w).innerHTML = `<div class="ok">${r.mailed ? 'Listo: le mandamos la invitación a ' + esc(em) + '.' : 'Quedó invitada/o: cuando entre con ' + esc(em) + ' se suma sola/o. (El mail no salió; pasale también el enlace.)'}</div>`; ev.target.reset(); }
      catch (e) { $('#ive', w).innerHTML = `<div class="err">${esc(e.message)}</div>`; }
      b.disabled = false; };
    $('#cp', w).onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Enlace copiado'); } catch (e) { $('#lk', w).select(); document.execCommand('copy'); toast('Enlace copiado'); } };
  } catch (e) { toast(e.message, 4000); }
}

function changePass() {
  const w = openModal('Cambiar contraseña', `<form id="cpf" class="stack"><label class="f">Actual<input class="in" type="password" name="old" autocomplete="current-password" required></label><label class="f">Nueva (mín. 8)<input class="in" type="password" name="pass" minlength="8" autocomplete="new-password" required></label><button class="btn block">Guardar</button><div id="cpe"></div></form>`);
  $('#cpf', w).onsubmit = async (e) => { e.preventDefault(); try { await api('auth?a=password', { old: e.target.old.value, pass: e.target.pass.value }); closeModal(); toast('Contraseña actualizada'); } catch (x) { $('#cpe', w).innerHTML = `<div class="err">${esc(x.message)}</div>`; } };
}
function deleteAccount() {
  const w = openModal('Borrar mi cuenta', `<p class="muted" style="margin:0 0 12px">Borramos tu cuenta y tus datos personales. Los espacios donde estás solo se borran; en los compartidos, las demás personas conservan las cuentas. ${st.me.subStatus === 'authorized' ? '<b>Antes cancelá tu suscripción Pro.</b>' : ''}</p><form id="daf" class="stack"><label class="f">Confirmá con tu contraseña<input class="in" type="password" name="pass" required></label><button class="btn danger block">Borrar definitivamente</button><div id="dae"></div></form>`);
  $('#daf', w).onsubmit = async (e) => { e.preventDefault(); try { await api('auth?a=delete', { pass: e.target.pass.value }); location.href = '/?bye=1'; } catch (x) { $('#dae', w).innerHTML = `<div class="err">${esc(x.message)}</div>`; } };
}

// ---------- Pro ----------
const UP_WHY = {
  importar: 'Traé tus gastos de otra planilla, app o banco: pegás las filas de Excel o subís un CSV y quedan cargados.',
  cuotas: 'Cargá una compra en cuotas y MateCuentas la reparte sola en los meses que vienen.',
  usd: 'Cargá gastos en dólares: se convierten solos con la cotización del día.',
  espacios: 'Tené espacios separados: la casa, tu emprendimiento, un viaje…',
  proj: 'Mirá 12 meses para adelante con fijos y cuotas comprometidas.',
  export: 'Bajá tus movimientos a Excel cuando quieras.',
  ai: 'Cargá todo lo que quieras por audio, foto o WhatsApp, sin límite.',
  data: 'Tu tablero completo: evolución, en qué se va la plata, quién gasta qué y alertas.',
};
function upsell(why) {
  const me = st.me;
  const w = openModal('✦ MateCuentas Pro', `<div class="probox">
    ${UP_WHY[why] ? `<p style="margin:0 0 10px;font-weight:650">${esc(UP_WHY[why])}</p>` : ''}
    <div class="price num">${fmt(me.price)}<small> /mes · cancelás cuando quieras</small></div>
    <ul>
      <li><span>🎙️</span><span><b>Cargas mágicas ilimitadas</b>: audio, foto del ticket y WhatsApp con MateBot</span></li>
      <li><span>📊</span><span><b>Tablero de datos</b>: evolución, categorías, personas y alertas</span></li>
      <li><span>💳</span><span><b>Compras en cuotas</b> que se proyectan solas</span></li>
      <li><span>💵</span><span><b>Gastos en dólares</b> con cotización automática</span></li>
      <li><span>🏠</span><span><b>Espacios ilimitados</b> y hasta ${me.limits && me.plan === 'pro' ? me.limits.members : 12} personas por espacio</span></li>
      <li><span>🔭</span><span><b>Proyección de 12 meses</b></span></li>
      <li><span>⬇</span><span><b>Exportar a Excel</b></span></li>
    </ul>
    <button class="btn pro block" id="buy">Pasarme a Pro</button>
    <p class="hint" style="text-align:center;margin:10px 0 0">El pago es por Mercado Pago, en pesos. Lo gratis sigue siendo gratis para siempre.</p>
    <p style="text-align:center;margin:14px 0 0"><a class="linkbtn" href="https://matebot.devisebit.com/codigo">🎁 ¿Tenés un código de regalo? Activalo acá</a></p>
  </div>`);
  $('#buy', w).onclick = async () => {
    const b = $('#buy', w); b.disabled = true; b.textContent = 'Abriendo Mercado Pago…';
    try { const { url } = await api('billing?a=checkout', {}); location.href = url; }
    catch (e) { b.disabled = false; b.textContent = 'Pasarme a Pro'; $('.probox', w).insertAdjacentHTML('beforeend', `<div class="ok" style="margin-top:10px">${esc(e.message)} <a href="${CONTACT}">info@devisebit.com</a></div>`); }
  };
}

// ---------- importar (Pro) ----------
const sinAcento = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
function parseFecha(v) {
  v = String(v || '').trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return '';
}
function parseMonto(v) {
  let t = String(v ?? '').replace(/[^\d,.-]/g, '');
  if (!t) return NaN;
  if (t.includes(',') && t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.'); // 1.234,56
  else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, '').replace(',', ''); // 1.234.567
  else t = t.replace(/,/g, '');
  return Number(t);
}
function parseTabla(txt) {
  const lines = txt.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = ['\t', ';', ','].map((c) => [c, lines[0].split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const split = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
  return lines.map(split);
}
function filasAMovs(rows) {
  const head = rows[0].map(sinAcento);
  const col = (...ks) => head.findIndex((h) => ks.some((k) => h.includes(k)));
  let iF = col('fecha', 'date', 'dia'), iT = col('tipo'), iC = col('categ', 'rubro'), iD = col('detalle', 'descrip', 'concepto', 'nombre', 'item'), iM = col('monto', 'importe', 'total', 'valor', 'precio', 'ars'), iQ = col('quien', 'persona', 'usuario'), iP = col('pago', 'medio', 'tarjeta', 'cuenta'), iU = col('usd', 'dolar');
  let data = rows.slice(1);
  if (iF < 0 && iM < 0) { data = rows; iF = 0; iD = 1; iM = rows[0].length - 1; } // sin encabezados: fecha, detalle, ..., monto
  const outs = cats('out'), ins = cats('in');
  const otros = (tipo) => (tipo === 'in' ? ins : outs).find((c) => /otro|varios/i.test(sinAcento(c.name))) || (tipo === 'in' ? ins : outs)[0];
  const movs = [], malos = [];
  const hayNeg = data.some((r) => parseMonto(r[iM]) < 0);
  for (const r of data) {
    const fecha = parseFecha(r[iF]); let monto = parseMonto(r[iM]);
    if (!fecha || !Number.isFinite(monto) || !monto) { if (r.some((x) => x)) malos.push(r); continue; }
    const tt = sinAcento(iT >= 0 ? r[iT] : '');
    // sin columna de tipo: si hay montos negativos (resumen de banco), los positivos son ingresos; si no, todo es gasto
    const tipo = /ingreso|entrada|cobro|^in$|credito|sueldo/.test(tt) ? 'in' : /gasto|egreso|salida|^out$|debito/.test(tt) ? 'out' : hayNeg ? (monto < 0 ? 'out' : 'in') : 'out';
    monto = Math.abs(monto);
    const cn = sinAcento(iC >= 0 ? r[iC] : '');
    const pool = tipo === 'in' ? ins : outs;
    const cat = cn ? (pool.find((c) => sinAcento(c.name) === cn) || pool.find((c) => sinAcento(c.name).includes(cn) || cn.includes(sinAcento(c.name)))) : otros(tipo);
    const m = { fecha, tipo, cat: cat ? cat.id : '', catNueva: cat ? '' : String(r[iC]).trim().slice(0, 40), monto, detalle: (iD >= 0 ? r[iD] : '') || (iC >= 0 ? r[iC] : ''), quien: iQ >= 0 ? r[iQ] : '', pago: iP >= 0 ? r[iP] : '' };
    const u = iU >= 0 ? parseMonto(r[iU]) : NaN; if (Number.isFinite(u) && u) { m.usd = Math.abs(u); }
    movs.push(m);
  }
  return { movs, malos };
}
function importar() {
  if (!isPro()) return upsell('importar');
  const w = openModal('⬆ Importar movimientos', `<div class="stack">
    <p class="muted" style="margin:0">Traé tus gastos e ingresos de otra planilla, app o banco. Tiene que tener al menos <b>fecha</b> y <b>monto</b>; si tiene tipo (gasto/ingreso), categoría, detalle, quién y medio de pago, también se usan.</p>
    <label class="f">Subí un archivo CSV<input class="in" type="file" id="impF" accept=".csv,.txt,.tsv,text/csv"></label>
    <label class="f">…o copiá las celdas de tu Excel o Google Sheets y pegalas acá<textarea class="in" id="impT" rows="6" placeholder="Fecha	Detalle	Categoría	Monto"></textarea></label>
    <div id="impR"></div>
    <button class="btn block" id="impGo" disabled>Importar</button></div>`);
  let res = null;
  const prev = (txt) => {
    const rows = parseTabla(txt); res = rows.length ? filasAMovs(rows) : null;
    const meses = res ? [...new Set(res.movs.map((m) => m.fecha.slice(0, 7)))].sort() : [];
    const nuevas = res ? [...new Set(res.movs.filter((m) => m.catNueva).map((m) => m.catNueva))] : [];
    $('#impR', w).innerHTML = !res ? '' : res.movs.length ? `<div class="ok">Encontramos <b>${res.movs.length}</b> movimientos${meses.length ? ` (${meses.map(mName).join(', ')})` : ''}: ${fmt(sum(res.movs.filter((m) => m.tipo === 'out')))} de gastos y ${fmt(sum(res.movs.filter((m) => m.tipo === 'in')))} de ingresos.${nuevas.length ? ` Se suman ${nuevas.length} categorías nuevas: ${esc(nuevas.join(', '))}.` : ''}${res.malos.length ? ` ${res.malos.length} filas sin fecha o monto quedan afuera.` : ''}</div>` : '<div class="err">No encontramos filas con fecha y monto. Revisá que la primera fila tenga los títulos de las columnas.</div>';
    $('#impGo', w).disabled = !(res && res.movs.length);
  };
  $('#impT', w).oninput = (e) => prev(e.target.value);
  $('#impF', w).onchange = async (e) => { const f = e.target.files[0]; if (f) { const t = await f.text(); $('#impT', w).value = t.slice(0, 200000); prev(t); } };
  $('#impGo', w).onclick = async () => {
    const b = $('#impGo', w); b.disabled = true;
    // categorías que no existen: se crean con el mismo nombre
    const nuevas = {};
    for (const m of res.movs) if (m.catNueva) { const k = m.tipo + '|' + sinAcento(m.catNueva); if (!nuevas[k]) nuevas[k] = { id: 'c' + Math.random().toString(36).slice(2, 9), tipo: m.tipo, name: m.catNueva }; m.cat = nuevas[k].id; }
    const catOps = Object.values(nuevas).map((c, i) => ({ col: 'cats', action: 'add', id: c.id, data: { tipo: c.tipo, name: c.name, emoji: c.tipo === 'in' ? '💰' : '🏷️', order: 100 + i } }));
    const ops = [...catOps, ...res.movs.map(({ catNueva, ...m }) => ({ col: 'movs', action: 'add', data: { ...m, ts: Date.now() } }))];
    try {
      let s;
      for (let i = 0; i < ops.length; i += 100) { b.textContent = `Importando ${Math.min(i + 100, ops.length)} de ${ops.length}…`; s = await api('space?a=ops', { id: st.S.id, ops: ops.slice(i, i + 100) }); }
      st.S = s; closeModal(); render(); toast(`✅ Importamos ${res.movs.length} movimientos`, 3500);
    } catch (e) { b.disabled = false; b.textContent = 'Importar'; $('#impR', w).innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
}

function exportCsv() {
  if (!isPro()) return upsell('export');
  const all = (st.S.movs || []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const head = ['Fecha', 'Tipo', 'Categoría', 'Detalle', 'Monto ARS', 'Moneda', 'Monto USD', 'Cotización', 'Quién', 'Pago', 'Cuota'];
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const n = (v) => v === null || v === undefined || v === '' ? '' : String(Math.round(v * 100) / 100).replace('.', ',');
  const rows = all.map((x) => [x.fecha, x.tipo === 'in' ? 'Ingreso' : 'Gasto', catById(x.cat).name, x.detalle, n(x.monto), x.moneda || 'ARS', n(x.usd), n(x.rate), x.quien, x.pago, x.cuota].map((v, i) => [4, 6, 7].includes(i) ? v : q(v)).join(';'));
  const blob = new Blob(['﻿' + head.join(';') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `matecuentas-${st.S.name.replace(/[^\w-]+/g, '_')}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function spaceSwitch() {
  const w = openModal('Tus espacios', `<div class="lst">${st.spaces.map((s) => `<button class="row" data-sp="${esc(s.id)}"><span class="emo">${esc((TPL[s.tpl] || TPL.hogar)[0])}</span><span style="min-width:0"><div class="nm">${esc(s.name)}</div><div class="meta">${s.owner ? 'Tuyo' : 'Compartido'} · ${s.members} ${s.members === 1 ? 'persona' : 'personas'}</div></span><span class="r">${s.id === st.S.id ? '✓' : ''}</span></button>`).join('')}</div><button class="btn soft block" id="nsp" style="margin-top:12px">＋ Nuevo espacio</button>`);
  $$('[data-sp]', w).forEach((b) => b.onclick = () => { closeModal(); if (b.dataset.sp !== st.S.id) { st.tab = 'home'; openSpace(b.dataset.sp); } });
  $('#nsp', w).onclick = () => { if (st.me.plan !== 'pro' && st.spaces.filter((s) => s.owner).length >= 1) return upsell('espacios'); showOnboarding(true); };
}

// ---------- carga mágica (texto, audio, foto) ----------
const IC = {
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
function aiInfo() { return (st.me && st.me.ai) || { left: 0, limit: 0 }; }
function magicCard() {
  const a = aiInfo(); const pro = st.me.plan === 'pro';
  return `<div class="card magic">
    <div class="t">✨ Contale a MateCuentas <small>${pro ? 'Pro · ilimitado' : `${a.left} de ${a.limit} gratis este mes`}</small></div>
    <div class="mrow">
      <input id="mtext" placeholder="Ej: gasté 12 lucas en el súper" autocomplete="off" enterkeyhint="send">
      <button class="mbtn" id="msend" aria-label="Cargar">${IC.send}</button>
      <button class="mbtn mic" id="mmic" aria-label="Dictar un audio">${IC.mic}</button>
      <button class="mbtn" id="mcam" aria-label="Foto del ticket">${IC.cam}</button>
    </div>
    <input type="file" id="mfile" accept="image/*" capture="environment" hidden>
    <div class="mhint">Hablá, escribí o sacale foto al ticket. También por WhatsApp con MateBot 🧉</div>
  </div>`;
}
let rec = null;
function bindMagic(M) {
  const t = M.querySelector('#mtext'); if (!t) return;
  const go = () => { const v = t.value.trim(); if (v) { t.value = ''; magic({ text: v }); } };
  t.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  M.querySelector('#msend').onclick = go;
  M.querySelector('#mcam').onclick = () => M.querySelector('#mfile').click();
  M.querySelector('#mfile').onchange = async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { magic({ image: await shrink(f) }); } catch (x) { toast('No pude leer esa imagen'); } };
  M.querySelector('#mmic').onclick = () => toggleRec(M.querySelector('#mmic'));
}
async function toggleRec(btn) {
  if (rec) { rec.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) return toast('Tu navegador no permite grabar audio. Probá escribiendo.');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast('Necesito permiso para usar el micrófono'); }
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '';
  const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined); const chunks = [];
  rec = r; btn.classList.add('rec'); btn.innerHTML = '■';
  toast('Te escucho… tocá ■ para terminar', 2500);
  const stopAt = setTimeout(() => r.state === 'recording' && r.stop(), 60000);
  r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  r.onstop = async () => {
    clearTimeout(stopAt); stream.getTracks().forEach((x) => x.stop()); rec = null;
    btn.classList.remove('rec'); btn.innerHTML = IC.mic;
    const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
    if (blob.size < 1500) return toast('Fue muy cortito. Mantené un poco más.');
    const b64 = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    magic({ audio: b64, mime: blob.type });
  };
  r.start();
}
function shrink(file) {
  return new Promise((ok, ko) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = ko; img.src = url;
  });
}
async function magic(input) {
  const a = aiInfo();
  if (st.me.plan !== 'pro' && a.left <= 0) return upsell('ai');
  const w = openModal('✨ Entendiendo…', `<div class="thinking"><div class="spin"></div><span>${input.audio ? 'Escuchando tu audio…' : input.image ? 'Leyendo la foto…' : 'Leyendo lo que escribiste…'}</span></div>`);
  try {
    const r = await api('ai', { id: st.S.id, ...input });
    if (st.me) st.me.ai = r.ai;
    if (!$('#modals').contains(w)) return;
    if (!r.items.length) { closeModal(); return toast(r.nota || 'No encontré un monto. Probá de nuevo.', 4000); }
    confirmItems(r);
  } catch (e) { closeModal(); if (e.status === 402) upsell('ai'); else toast(e.message, 4000); }
}
function movOps(base, ars, cuotas, fecha) {
  if (cuotas > 1 && base.tipo === 'out') {
    const grp = uid('g'); const list = []; const each = Math.round(ars / cuotas * 100) / 100;
    for (let i = 0; i < cuotas; i++) {
      const m = addM(ym(fecha), i); const last = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
      list.push({ col: 'movs', action: 'add', id: uid('m'), data: { ...base, monto: each, usd: base.usd ? Math.round(base.usd / cuotas * 100) / 100 : null, fecha: m + '-' + String(Math.min(+fecha.slice(8, 10), last)).padStart(2, '0'), grp, cuota: (i + 1) + '/' + cuotas, ts: Date.now() + i } });
    }
    return list;
  }
  return [{ col: 'movs', action: 'add', id: uid('m'), data: { ...base, monto: ars, fecha, ts: Date.now() } }];
}
function confirmItems(r) {
  const pro = isPro(); const items = r.items.map((x) => ({ ...x }));
  const w = openModal(`✨ ${items.length === 1 ? '¿Lo anoto así?' : `Encontré ${items.length} movimientos`}`, `${r.heard ? `<div class="heard">🎙️ “${esc(r.heard)}”</div>` : ''}${r.nota ? `<p class="hint" style="margin:0 0 10px">${esc(r.nota)}</p>` : ''}<div id="its"></div>
    <button class="btn block" id="saveAll">Guardar ${items.length === 1 ? '' : 'todo'}</button>
    <p class="hint" style="text-align:center;margin:8px 0 0">${st.me.plan === 'pro' ? 'Pro · cargas ilimitadas' : `Te quedan ${aiInfo().left} cargas mágicas este mes`}</p>`);
  const draw = () => {
    $('#its', w).innerHTML = items.map((it, i) => `<div class="it">
      <div class="top"><span class="tag ${it.tipo === 'in' ? '' : ''}">${it.tipo === 'in' ? '↑ Ingreso' : '↓ Gasto'}</span><input class="in num" data-k="monto" data-i="${i}" inputmode="decimal" value="${(Math.round(it.monto * 100) / 100).toLocaleString('es-AR')}"><b class="muted small">${it.moneda === 'USD' ? 'USD' : 'ARS'}</b><button class="ib del rm" data-rm="${i}" aria-label="Quitar">✕</button></div>
      <select class="in" data-k="cat" data-i="${i}">${cats(it.tipo).map((c) => `<option value="${esc(c.id)}" ${c.id === it.cat ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select>
      <div class="g2"><input class="in" data-k="detalle" data-i="${i}" value="${esc(it.detalle)}" placeholder="Detalle"><input class="in" type="date" data-k="fecha" data-i="${i}" value="${esc(it.fecha)}"></div>
      ${it.cuotas > 1 && it.tipo === 'out' ? `<div class="hint">${pro ? `En ${it.cuotas} cuotas de ${fmt(it.monto / it.cuotas * (it.moneda === 'USD' ? (fxRate() || 1) : 1))}` : `En ${it.cuotas} cuotas: con <b>Pro</b> se reparten solas. Ahora lo anoto en un pago.`}</div>` : ''}
      ${it.moneda === 'USD' ? `<div class="hint">≈ ${fmt(it.monto * (fxRate() || 0))} al dólar ${FX_LBL[st.S.settings.fx || 'blue']}</div>` : ''}
    </div>`).join('') || '<div class="empty">No queda nada para guardar.</div>';
    $$('[data-k]', w).forEach((el) => el.onchange = () => { const it = items[+el.dataset.i]; const k = el.dataset.k; it[k] = k === 'monto' ? parseNum(el.value) : el.value; });
    $$('[data-rm]', w).forEach((b) => b.onclick = () => { items.splice(+b.dataset.rm, 1); draw(); });
  };
  draw();
  $('#saveAll', w).onclick = () => {
    const rate = fxRate(); const list = [];
    for (const it of items) {
      if (!it.monto) continue;
      let ars = it.monto, moneda = 'ARS', usd = null, detalle = it.detalle;
      if (it.moneda === 'USD') { if (!rate) return toast('No hay cotización ahora, probá en un rato'); usd = it.monto; ars = Math.round(it.monto * rate * 100) / 100; if (pro) moneda = 'USD'; else detalle = (detalle ? detalle + ' ' : '') + `(US$ ${usd})`; }
      const base = { tipo: it.tipo, cat: it.cat, moneda, usd: moneda === 'USD' ? usd : null, rate: moneda === 'USD' ? rate : null, quien: people().includes(it.quien) ? it.quien : (st.S.members.find((m) => m.uid === st.me.id) || {}).name || people()[0], pago: it.pago || '', detalle };
      list.push(...movOps(base, ars, pro ? it.cuotas : 1, it.fecha));
    }
    if (!list.length) return closeModal();
    closeModal(); ops(list, items.length === 1 ? '✅ Anotado' : `✅ ${items.length} movimientos anotados`);
  };
}

// ---------- MateBot por WhatsApp / Telegram ----------
function botCard() {
  const bots = (st.me.bots || []);
  return `<div class="rowh"><div><h2>🧉 Cargá por WhatsApp</h2><p class="sub">Con MateBot: mandá un audio, una foto del ticket o un mensaje y se anota solo.</p></div></div>
    ${bots.length ? `<div class="lst">${bots.map((b) => { const sp = st.spaces.find((x) => x.id === b.space); return `<div class="li"><span class="emo">${b.ch === 'tg' ? '✈️' : '💬'}</span><div class="t"><b>${b.ch === 'tg' ? 'Telegram' : 'WhatsApp'}${b.name ? ' · ' + esc(b.name) : ''}</b><small>Anota en ${esc(sp ? sp.name : 'tu espacio')}</small></div><button class="ib del" data-unbot="${esc(b.ch + '|' + b.id)}" title="Desconectar">✕</button></div>`; }).join('')}</div>` : ''}
    <button class="btn block wa" id="linkBot" style="margin-top:10px">${bots.length ? 'Conectar otro chat' : 'Conectar WhatsApp o Telegram'}</button>
    ${st.me.plan === 'pro' ? '' : `<p class="hint" style="margin:8px 0 0">Plan gratis: ${aiInfo().limit} cargas mágicas por mes (app + chat). Con Pro, ilimitadas.</p>`}`;
}
async function linkBot() {
  try {
    const r = await api('space?a=linkcode', { id: st.S.id });
    const w = openModal('Conectar con MateBot', `<p class="muted" style="margin:0 0 6px">Tocá un botón y mandá el mensaje que se abre. Desde ese chat, todo lo que le cuentes a MateBot se anota en <b>${esc(st.S.name)}</b>.</p>
      <div class="code num">${esc(r.code)}</div>
      <div style="display:grid;gap:8px"><a class="btn block wa" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(r.wa)}">Abrir WhatsApp</a><a class="btn block tg" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(r.tg)}">Abrir Telegram</a></div>
      <p class="hint" style="margin:10px 0 0">Si no se abre, escribile a MateBot <b>vincular ${esc(r.code)}</b>. El código vence en 30 minutos.</p>
      <button class="btn ghost block" id="chk" style="margin-top:12px">Ya lo mandé</button>`);
    $('#chk', w).onclick = async () => { await refreshMe(); closeModal(); render(); toast((st.me.bots || []).length ? '¡Conectado! Ya podés mandarle gastos a MateBot 🧉' : 'Todavía no me llegó. Mandá el mensaje y volvé a tocar.', 3500); };
  } catch (e) { toast(e.message, 4000); }
}

// ---------- tablero ----------
const PAL = ['#138a45', '#f2b42c', '#2f6fd6', '#e5484d', '#8e4ec6', '#12a594', '#e5762e', '#6b7d71', '#d6409f', '#99a12b'];
function monthsBack(n) { const out = []; for (let k = n - 1; k >= 0; k--) out.push(addM(st.month, -k)); return out; }
function svgBars(months) {
  const data = months.map((m) => { const L = monthMovs(m); return { m, i: sum(L.filter((x) => x.tipo === 'in')), o: sum(L.filter((x) => x.tipo === 'out')) }; });
  const max = Math.max(1, ...data.map((d) => Math.max(d.i, d.o)));
  const W = 600, H = 220, pad = 26, bw = (W - pad * 2) / data.length;
  const bars = data.map((d, k) => { const x = pad + k * bw; const hi = (d.i / max) * (H - 50), ho = (d.o / max) * (H - 50);
    return `<rect x="${x + bw * .14}" y="${H - 28 - hi}" width="${bw * .32}" height="${hi}" rx="4" fill="var(--in)"><title>Entró ${fmt(d.i)}</title></rect><rect x="${x + bw * .5}" y="${H - 28 - ho}" width="${bw * .32}" height="${ho}" rx="4" fill="var(--out)"><title>Salió ${fmt(d.o)}</title></rect><text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="13" fill="var(--muted)" style="text-transform:capitalize">${esc(mName(d.m, true).split(' ')[0])}</text>`; }).join('');
  const line = data.map((d, k) => `${pad + k * bw + bw / 2},${H - 28 - (Math.max(0, d.i - d.o) / max) * (H - 50)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos y egresos por mes"><line x1="${pad}" y1="${H - 28}" x2="${W - pad}" y2="${H - 28}" stroke="var(--line)"/>${bars}<polyline points="${line}" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function svgDonut(parts) {
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1; let a0 = -Math.PI / 2; const R = 80, r = 50, C = 100;
  const arcs = parts.map((p, i) => { const a1 = a0 + (p.v / tot) * Math.PI * 2; const big = a1 - a0 > Math.PI ? 1 : 0;
    const pt = (a, rr) => `${C + rr * Math.cos(a)},${C + rr * Math.sin(a)}`;
    const d = parts.length === 1 ? `M${C - R},${C}a${R},${R} 0 1,0 ${R * 2},0a${R},${R} 0 1,0 -${R * 2},0M${C - r},${C}a${r},${r} 0 1,1 ${r * 2},0a${r},${r} 0 1,1 -${r * 2},0` : `M${pt(a0, R)}A${R},${R} 0 ${big} 1 ${pt(a1, R)}L${pt(a1, r)}A${r},${r} 0 ${big} 0 ${pt(a0, r)}Z`;
    a0 = a1; return `<path d="${d}" fill="${PAL[i % PAL.length]}" fill-rule="evenodd"><title>${esc(p.l)}: ${fmt(p.v)}</title></path>`; }).join('');
  return `<svg viewBox="0 0 200 200" style="max-width:220px;margin:0 auto" role="img" aria-label="Gastos por categoría">${arcs}<text x="100" y="96" text-anchor="middle" font-size="11" fill="var(--muted)">Total</text><text x="100" y="114" text-anchor="middle" font-size="15" font-weight="800" fill="var(--fg)">${fmtK(tot)}</text></svg>`;
}
function hbars(rows) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return rows.map((r, i) => `<div class="hbar"><span>${esc(r.l)}</span><div class="tr"><i style="width:${(r.v / max) * 100}%;background:${PAL[i % PAL.length]}"></i></div><b class="num">${fmtK(r.v)}</b></div>`).join('') || '<div class="empty">Sin datos este mes.</div>';
}
function groupSum(L, key) { const o = {}; for (const x of L) { const k = key(x) || 'Sin dato'; o[k] = (o[k] || 0) + (Number(x.monto) || 0); } return Object.entries(o).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v); }
function insights() {
  const L = monthMovs(), P = monthMovs(addM(st.month, -1));
  const out = L.filter((x) => x.tipo === 'out'), pout = P.filter((x) => x.tipo === 'out');
  const tIn = sum(L.filter((x) => x.tipo === 'in')), tOut = sum(out);
  const res = [];
  const now = ym(today()) === st.month; const day = +today().slice(8, 10); const days = new Date(+st.month.slice(0, 4), +st.month.slice(5, 7), 0).getDate();
  if (now && day > 3 && tOut) res.push(['🔮', `A este ritmo vas a cerrar el mes en <b>${fmt(tOut / day * days)}</b> de gastos.`]);
  if (tIn) res.push([tIn >= tOut ? '🟢' : '🔴', tIn >= tOut ? `Estás ahorrando el <b>${Math.round((tIn - tOut) / tIn * 100)}%</b> de lo que entra.` : `Estás gastando <b>${fmt(tOut - tIn)}</b> más de lo que entró.`]);
  const byC = (A) => { const o = {}; for (const x of A) o[x.cat] = (o[x.cat] || 0) + x.monto; return o; };
  const a = byC(out), b = byC(pout); let worst = null;
  for (const [k, v] of Object.entries(a)) { const pv = b[k] || 0; if (pv > 0 && v > pv * 1.15 && (!worst || v - pv > worst.d)) worst = { k, d: v - pv, p: Math.round((v / pv - 1) * 100) }; }
  if (worst) res.push(['📈', `<b>${esc(catById(worst.k).name)}</b> subió ${worst.p}% contra el mes pasado (+${fmt(worst.d)}).`]);
  const over = cats('out').filter((c) => c.plan && (a[c.id] || 0) > c.plan);
  if (over.length) res.push(['⚠️', `Te pasaste del presupuesto en ${over.map((c) => '<b>' + esc(c.name) + '</b>').join(', ')}.`]);
  const big = out.slice().sort((x, y) => y.monto - x.monto)[0];
  if (big) res.push(['💸', `El gasto más grande fue <b>${esc(big.detalle || catById(big.cat).name)}</b>: ${fmt(big.monto)}.`]);
  const cu = (st.S.movs || []).filter((x) => x.grp && x.fecha > st.month + '-31');
  if (cu.length) res.push(['💳', `Tenés <b>${fmt(sum(cu))}</b> en cuotas por pagar en los próximos meses.`]);
  return res.length ? res : [['🧉', 'Cargá algunos movimientos y acá te voy contando qué ver.']];
}
function vData() {
  const pro = isPro();
  const L = monthMovs(), P = monthMovs(addM(st.month, -1));
  const out = L.filter((x) => x.tipo === 'out'), ins = L.filter((x) => x.tipo === 'in');
  const tIn = sum(ins), tOut = sum(out), pOut = sum(P.filter((x) => x.tipo === 'out'));
  const day = ym(today()) === st.month ? +today().slice(8, 10) : new Date(+st.month.slice(0, 4), +st.month.slice(5, 7), 0).getDate();
  const delta = pOut ? Math.round((tOut / pOut - 1) * 100) : null;
  const catRows = groupSum(out, (x) => { const c = catById(x.cat); return c.emoji + ' ' + c.name; });
  const top = catRows.slice(0, 7); if (catRows.length > 7) top.push({ l: 'Otras', v: catRows.slice(7).reduce((a, r) => a + r.v, 0) });
  const lock = (html) => html;
  return `<section class="view">
    <div class="kpis">
      <div class="kpi"><span>Entró</span><b class="num pos">${fmtK(tIn)}</b></div>
      <div class="kpi"><span>Salió</span><b class="num">${fmtK(tOut)}</b>${delta !== null ? `<small class="${delta > 0 ? 'neg' : 'pos'}">${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs mes pasado</small>` : ''}</div>
      <div class="kpi"><span>Ahorro</span><b class="num ${tIn - tOut < 0 ? 'neg' : ''}">${tIn ? Math.round((tIn - tOut) / tIn * 100) + '%' : '—'}</b></div>
      <div class="kpi"><span>Gasto por día</span><b class="num">${fmtK(tOut / Math.max(1, day))}</b></div>
    </div>
    <div class="card"><div class="rowh"><div><h2>💡 Lo que tenés que saber</h2><p class="sub">${esc(mName(st.month))}</p></div></div>${insights().map(([i, t]) => `<div class="insight"><span>${i}</span><span>${t}</span></div>`).join('')}</div>
    ${pro ? '' : '<div class="locked"><div class="blur">'}<div class="view">
    <div class="card chart"><div class="rowh"><div><h2>Evolución</h2><p class="sub">Entró, salió y lo que quedó, últimos 6 meses</p></div></div>${lock(svgBars(monthsBack(6)), 'data')}<div class="legend"><span><i style="background:var(--in)"></i>Entró</span><span><i style="background:var(--out)"></i>Salió</span><span><i style="background:var(--gold)"></i>Quedó</span></div></div>
    <div class="two">
      <div class="card chart"><div class="rowh"><div><h2>¿En qué se va?</h2><p class="sub">Gastos por categoría</p></div></div>${lock(`${top.length ? svgDonut(top) : ''}<div class="legend">${top.map((r, i) => `<span><i style="background:${PAL[i % PAL.length]}"></i>${esc(r.l)} · ${Math.round(r.v / (tOut || 1) * 100)}%</span>`).join('')}</div>`, 'data')}</div>
      <div class="card"><div class="rowh"><div><h2>¿Quién gasta qué?</h2><p class="sub">Por persona</p></div></div>${lock(hbars(groupSum(out, (x) => x.quien || 'Sin asignar')), 'data')}<h3>Por medio de pago</h3>${lock(hbars(groupSum(out, (x) => x.pago || 'Sin dato')), 'data')}</div>
    </div>
    <div class="card"><div class="rowh"><div><h2>Top gastos del mes</h2><p class="sub">Los que más pesaron</p></div><button class="chip gray" data-pro="export" id="exp2">⬇ Excel${pro ? '' : ' ✦'}</button></div>${lock(out.slice().sort((a, b) => b.monto - a.monto).slice(0, 6).map(movRow).join('') || '<div class="empty">Sin gastos este mes.</div>', 'data')}</div>
    </div>${pro ? '' : `</div><div class="over" style="align-items:start;padding-top:40px"><div><b>📊 Tablero de control Pro</b><p class="small muted" style="margin:6px 0 12px">${esc(UP_WHY.data)}</p><button class="btn pro sm" data-pro="data">Ver Pro</button></div></div></div>`}
  </section>`;
}

// ---------- controles fijos ----------
$$('#tabs [data-t]').forEach((b) => b.onclick = () => { st.tab = b.dataset.t; st.q = ''; render(); scrollTo(0, 0); });
$('#fab').onclick = () => openMov();
$('#prevM').onclick = () => { st.month = addM(st.month, -1); render(); };
$('#nextM').onclick = () => { st.month = addM(st.month, 1); render(); };
$('#spaceBtn').onclick = spaceSwitch;
$('#gear').onclick = () => { st.tab = 'mas'; render(); scrollTo(0, 0); };
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && st.S && !st.pending && !$('#modals').children.length) { try { const s = await api('space?id=' + st.S.id); if (!st.pending) { st.S = s; render(); } } catch (e) { /* sin red */ } }
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
boot();
