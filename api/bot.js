// Puente con MateBot (WhatsApp y Telegram). Autenticado con BOT_KEY compartida entre ambos proyectos.
import {
  APP, readJ, writeJ, mutate, delJ, userPath, idxPath, spacePath, linkPath, botPath, same, sleep, isPro,
  takeAi, giveBackAi, aiLeft, body, send, guard, fail,
} from './_core.js';
import { parseMoves } from './_ai.js';
import { buildOps, fmt } from './_moves.js';
const esc = (x = '') => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function linked(ch, chatId) {
  const { data: l } = await readJ(botPath(ch, chatId));
  if (!l) return null;
  const { data: ix } = await readJ(idxPath(l.uid));
  if (!ix) return null;
  const { data: u } = await readJ(userPath(ix.email));
  if (!u || !(u.spaces || []).includes(l.space)) return null;
  return { l, u };
}

export default guard(async (req, res) => {
  const key = process.env.BOT_KEY;
  if (!key || !same(req.headers['x-bot-key'], key)) { await sleep(600); return send(res, 401, { error: 'no' }); }
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo' });
  const a = String(req.query.a || '');
  const b = body(req);
  const ch = b.channel === 'tg' ? 'tg' : 'wa';
  const chatId = String(b.chatId || '').slice(0, 60);
  if (!chatId) throw fail(400, 'chat');

  if (a === 'link') {
    const code = ((String(b.code || '').toUpperCase().match(/MC[A-Z0-9]{6}/) || [''])[0]);
    const { data: lk } = await readJ(linkPath(code));
    if (!lk || lk.exp < Date.now()) return send(res, 200, { ok: false, reply: 'Ese código no existe o venció 🤔 Generá uno nuevo en MateCuentas → Ajustes → Conectar WhatsApp.' });
    const { data: sp } = await readJ(spacePath(lk.space));
    if (!sp) return send(res, 200, { ok: false, reply: 'Ese espacio ya no existe.' });
    await writeJ(botPath(ch, chatId), { uid: lk.uid, space: lk.space, ts: Date.now() }, null, null);
    const { data: ix } = await readJ(idxPath(lk.uid));
    if (ix) await mutate(userPath(ix.email), (u) => {
      u.bots = (u.bots || []).filter((x) => !(x.ch === ch && x.id === chatId));
      u.bots.push({ ch, id: chatId, name: String(b.name || '').slice(0, 40), space: lk.space, ts: Date.now() });
    });
    await delJ(linkPath(code));
    return send(res, 200, { ok: true, reply: `✅ ¡Listo! Conecté este chat con <b>${esc(sp.name)}</b> en MateCuentas 💰\n\nAhora mandame tus gastos como te salgan:\n• 🎙️ un audio: "gasté 12 lucas en el súper"\n• 📸 la foto del ticket\n• ✍️ "cobré el sueldo, 1.500.000"\n\nY lo anoto al toque.` });
  }

  if (a === 'status') {
    const r = await linked(ch, chatId);
    if (!r) return send(res, 200, { linked: false });
    const { data: sp } = await readJ(spacePath(r.l.space));
    return send(res, 200, { linked: true, space: sp && sp.name, ai: aiLeft(r.u), pro: isPro(r.u) });
  }

  if (a === 'unlink') {
    const r = await linked(ch, chatId);
    await delJ(botPath(ch, chatId));
    if (r) await mutate(userPath(r.u.email), (u) => { u.bots = (u.bots || []).filter((x) => !(x.ch === ch && x.id === chatId)); });
    return send(res, 200, { ok: true, reply: 'Listo, desconecté este chat de MateCuentas.' });
  }

  if (a === 'add') {
    const r = await linked(ch, chatId);
    if (!r) return send(res, 200, { ok: false, linked: false, reply: `💰 Para anotar gastos necesito conectarte con <b>MateCuentas</b>, la app gratis para las cuentas de la casa.\n\n1️⃣ Creá tu cuenta en ${APP.url}\n2️⃣ Andá a Ajustes → <b>Conectar WhatsApp</b>\n3️⃣ Mandame el código que te da.` });
    const { u, l } = r;
    const { data: space } = await readJ(spacePath(l.space));
    if (!space || !space.members.some((m) => m.uid === u.id)) return send(res, 200, { ok: false, reply: 'No encuentro tu espacio en MateCuentas. Volvé a conectar desde Ajustes.' });
    if (!(await takeAi(u))) return send(res, 200, { ok: false, reply: `Usaste tus ${APP.free.ai} cargas gratis por chat de este mes 🙌 Podés seguir cargando en la app, o pasarte a <b>Pro</b> (${fmt(APP.priceArs)}/mes) para cargar ilimitado por audio y foto: ${APP.url}/app#pro-info` });
    // El bot puede mandar ítems ya interpretados o el texto/imagen crudo.
    let items = Array.isArray(b.items) ? b.items : null; let nota = '';
    try {
      if (!items || !items.length) {
        const out = await parseMoves(req, { text: String(b.text || '').slice(0, 2000), image: typeof b.image === 'string' ? b.image : null, space });
        items = out.items; nota = out.nota;
      }
    } catch (e) { await giveBackAi(u); console.error('bot parse', e.message); return send(res, 200, { ok: false, reply: 'Uy, no pude anotarlo ahora 😅 Probá de nuevo en un ratito.' }); }
    if (!items.length) { await giveBackAi(u); return send(res, 200, { ok: false, reply: nota || 'No encontré un monto claro 🤔 Probá con algo como "gasté 8500 en la verdulería".' }); }
    const owner = space.owner === u.id ? u : (await (async () => { const { data: ix } = await readJ(idxPath(space.owner)); return ix ? (await readJ(userPath(ix.email))).data : null; })());
    const pro = isPro(owner);
    const meName = (space.members.find((m) => m.uid === u.id) || {}).name || u.name;
    const { ops, lines } = await buildOps(items, space, { pro, by: meName });
    await mutate(spacePath(l.space), (s) => {
      for (const op of ops) { s.movs = s.movs || []; s.movs.push({ id: op.id, ...op.data, by: u.id, via: ch }); }
      s.updatedAt = Date.now();
    });
    const { data: u2 } = await readJ(userPath(u.email));
    const left = aiLeft(u2 || u);
    const extra = !isPro(u2 || u) ? `\n\n🎁 Te quedan ${left.left} de ${left.limit} cargas gratis por chat este mes.` : '';
    const lost = !pro && items.some((it) => it.cuotas > 1 && it.tipo === 'out') ? '\nℹ️ Las cuotas se reparten solas con Pro; lo anoté como un solo pago.' : '';
    return send(res, 200, { ok: true, reply: `✅ Anotado en <b>${esc(space.name)}</b>:\n${esc(lines.join('\n'))}${lost}${nota ? '\n' + esc(nota) : ''}\n\nVer o corregir: ${APP.url}/app${extra}` });
  }

  return send(res, 404, { error: 'accion' });
});
