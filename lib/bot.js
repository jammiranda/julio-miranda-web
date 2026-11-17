import crypto from 'crypto';
import { cfg } from './config';
import { sql } from './db';
import { send, tg, buttons, askContact, removeKeyboard, downloadFile, esc } from './telegram';
import { transcribe } from './transcribe';
import { interpret } from './ai';
import { authUrl, listEvents, createEvent } from './google';
import { localParts, fromLocal, dayRange, addDays, cuando, hora, dia } from './time';

const PRIV = `${cfg.appUrl}/privacidad`;

const AYUDA = `🧉 <b>Así me usás</b>
Mandame un <b>audio</b> o escribime como le hablarías a un amigo:
• "El jueves a las 10 tengo dentista con León"
• "Recordame mañana a las 18 llamar a mamá"
• "El 3 de diciembre cumple años la abuela"
• "Agregá leche, yerba y pan a la lista del súper"
• "¿Qué tengo mañana?"

<b>Comandos</b>
/hoy · /manana · /semana — tu agenda
/listas — tus listas
/conectar — sumar tu Google Calendar
/familia — compartir listas y fechas con tu familia
/resumen 8 — hora del resumen diario
/aviso 30 — minutos de anticipación de los avisos
/novedades — activar o quitar novedades de DEVISEBIT
/privacidad — qué hacemos con tus datos
/borrar — borrar tu cuenta y todos tus datos`;

// ---------- usuarios ----------
async function getUser(from, chatId) {
  const rows = await sql`SELECT * FROM users WHERE tg_id = ${from.id}`;
  if (rows[0]) {
    await sql`UPDATE users SET last_seen = now(), chat_id = ${chatId} WHERE id = ${rows[0].id}`;
    return rows[0];
  }
  const ins = await sql`INSERT INTO users (tg_id, chat_id, first_name, username)
    VALUES (${from.id}, ${chatId}, ${from.first_name || null}, ${from.username || null}) RETURNING *`;
  return ins[0];
}
const setStep = (id, step) => sql`UPDATE users SET step = ${step} WHERE id = ${id}`;

// ---------- entrada principal ----------
export async function handleUpdate(update) {
  if (update.callback_query) return await handleCallback(update.callback_query);
  const msg = update.message;
  if (!msg || msg.chat?.type !== 'private') return;
  const user = await getUser(msg.from, msg.chat.id);
  const chat = msg.chat.id;

  try {
    // Onboarding
    if (msg.text?.startsWith('/start')) return await start(user, chat);
    if (user.step === 'phone') return await onPhone(user, chat, msg);
    if (user.step === 'email') return await onEmail(user, chat, msg);
    if (user.step === 'optin') return await send(chat, '👆 Elegí una opción arriba para terminar (Sí o No, como prefieras).');
    if (user.step === 'new') return await start(user, chat);

    if (msg.text?.startsWith('/')) return await command(user, chat, msg.text.trim());

    let text = msg.text;
    if (msg.voice || msg.audio) {
      await tg('sendChatAction', { chat_id: chat, action: 'typing' });
      const { buf, path } = await downloadFile((msg.voice || msg.audio).file_id);
      text = await transcribe(buf, path);
      if (!text) return await send(chat, 'No llegué a entender el audio 😅 ¿Me lo mandás de nuevo?');
      await send(chat, `🎙️ <i>${esc(text)}</i>`);
    }
    if (!text) return await send(chat, 'Por ahora entiendo textos y audios 🧉');
    return await understand(user, chat, text);
  } catch (e) {
    console.error(e);
    return await send(chat, 'Uy, algo falló de mi lado. Probá de nuevo en un ratito 🙏');
  }
}

// ---------- onboarding ----------
async function start(user, chat) {
  if (user.step === 'ready') return send(chat, `¡Hola de nuevo, ${esc(user.first_name || '')}! 🧉\n\n${AYUDA}`);
  await setStep(user.id, 'phone');
  await send(chat,
    `¡Hola${user.first_name ? ' ' + esc(user.first_name) : ''}! Soy <b>MateBot</b> 🧉, tu asistente personal de <b>DEVISEBIT</b>.\n\n` +
    `Me mandás un audio como le hablarías a un amigo y yo te ordeno turnos, reuniones, cumpleaños y listas. Te aviso a tiempo y te mando un resumen cada mañana. <b>Es gratis.</b>\n\n` +
    `🔒 <b>Tu agenda, tus audios y tus listas son tuyos.</b> No los leemos, no los vendemos y no los usamos para nada que no sea darte el servicio. Los audios se transcriben y se descartan. <a href="${PRIV}">Ver privacidad</a>`);
  return send(chat, 'Para crear tu cuenta, ¿me compartís tu número? Sirve para identificarte y, más adelante, para usar MateBot también por WhatsApp.', askContact);
}

async function onPhone(user, chat, msg) {
  if (msg.contact) {
    if (msg.contact.user_id && msg.contact.user_id !== msg.from.id) {
      return send(chat, 'Necesito tu propio número 🙂 Tocá el botón "Compartir mi número".', askContact);
    }
    await sql`UPDATE users SET phone = ${msg.contact.phone_number} WHERE id = ${user.id}`;
  }
  await setStep(user.id, 'email');
  return send(chat, '¡Gracias! ¿Cuál es tu <b>mail</b>? Lo usamos para tu cuenta y para ayudarte si algo falla. Si preferís no darlo, escribí <i>saltar</i>.', removeKeyboard);
}

async function onEmail(user, chat, msg) {
  const t = (msg.text || '').trim();
  if (!/^saltar$/i.test(t)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return send(chat, 'Ese mail no parece válido 🤔 Probá de nuevo o escribí <i>saltar</i>.');
    await sql`UPDATE users SET email = ${t.toLowerCase()} WHERE id = ${user.id}`;
  }
  await setStep(user.id, 'optin');
  return send(chat,
    '📩 Última pregunta, y es <b>opcional</b>: ¿querés que DEVISEBIT te escriba de vez en cuando con novedades, otros productos y servicios? MateBot funciona igual elijas lo que elijas, y te das de baja cuando quieras con /novedades.',
    buttons([[['✅ Sí, quiero novedades', 'optin:1']], [['No, gracias', 'optin:0']]]));
}

async function finishOnboarding(user, chat) {
  await setStep(user.id, 'ready');
  await send(chat, `¡Listo, ya estamos! 🎉\n\n${AYUDA}`);
  return send(chat, '¿Querés que lea y escriba en tu <b>Google Calendar</b>? Así te aviso de todo lo que tengas, lo hayas cargado conmigo o no.',
    buttons([[['📅 Conectar Google Calendar', authUrl(user.id)]], [['Más tarde', 'noop']]]));
}

// ---------- comandos ----------
async function command(user, chat, text) {
  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ');
  const today = localParts().date;
  switch (cmd.split('@')[0].toLowerCase()) {
    case '/ayuda': case '/help': return send(chat, AYUDA);
    case '/hoy': return send(chat, await agendaText(user, today, 1));
    case '/manana': return send(chat, await agendaText(user, addDays(today, 1), 1));
    case '/semana': return send(chat, await agendaText(user, today, 7));
    case '/listas': case '/lista': return send(chat, await listsText(user, arg));
    case '/conectar':
      return send(chat, user.google_refresh ? `Ya tenés conectado Google Calendar (${esc(user.google_email || '')}) ✅` : 'Tocá para conectar tu Google Calendar:',
        user.google_refresh ? {} : buttons([[['📅 Conectar Google Calendar', authUrl(user.id)]]]));
    case '/resumen': {
      const h = parseInt(arg, 10);
      if (isNaN(h) || h < 0 || h > 23) return send(chat, 'Decime la hora en número, ej: <code>/resumen 7</code>');
      await sql`UPDATE users SET digest_hour = ${h} WHERE id = ${user.id}`;
      return send(chat, `Listo, tu resumen llega todos los días a las ${h}:00 ☀️`);
    }
    case '/aviso': {
      const m = parseInt(arg, 10);
      if (isNaN(m) || m < 0 || m > 1440) return send(chat, 'Decime los minutos, ej: <code>/aviso 30</code>');
      await sql`UPDATE users SET remind_minutes = ${m} WHERE id = ${user.id}`;
      return send(chat, `Te aviso ${m} minutos antes de cada evento ⏰`);
    }
    case '/novedades': {
      const v = !user.marketing_optin;
      await sql`UPDATE users SET marketing_optin = ${v}, optin_at = ${v ? new Date() : null} WHERE id = ${user.id}`;
      return send(chat, v ? '✅ Activaste las novedades de DEVISEBIT. Gracias 🙌' : '🔕 Listo, no te vamos a escribir con novedades.');
    }
    case '/privacidad':
      return send(chat, `🔒 <b>Tus datos</b>\n• Agenda, audios y listas: solo para darte el servicio. No los leemos ni los vendemos.\n• Los audios se transcriben y se descartan.\n• Nombre, mail y teléfono: para tu cuenta y, solo si aceptaste, para novedades de DEVISEBIT.\n• Hoy ${user.marketing_optin ? 'tenés <b>activadas</b>' : '<b>no</b> tenés activadas'} las novedades (/novedades para cambiarlo).\n• /borrar elimina tu cuenta y todo lo que guardaste.\n\n<a href="${PRIV}">Política completa</a>`);
    case '/familia': return family(user, chat);
    case '/unirme': return joinFamily(user, chat, arg);
    case '/borrar':
      return send(chat, '⚠️ Esto borra tu cuenta, tus listas, recordatorios y la conexión con Google. No se puede deshacer. ¿Seguro?',
        buttons([[['🗑️ Sí, borrar todo', 'del:yes']], [['No, me quedo', 'noop']]]));
    default: return send(chat, 'No conozco ese comando 🤔 Mirá /ayuda');
  }
}

// ---------- interpretación ----------
async function understand(user, chat, text) {
  await tg('sendChatAction', { chat_id: chat, action: 'typing' });
  const acts = await interpret(text);
  const toConfirm = [];
  const replies = [];
  for (const a of acts) {
    if (a.tipo === 'charla') replies.push(esc(a.respuesta || '¡Acá estoy! Contame qué querés agendar 🧉'));
    else if (a.tipo === 'lista_agregar') replies.push(await listAdd(user, a));
    else if (a.tipo === 'lista_quitar') replies.push(await listRemove(user, a));
    else if (a.tipo === 'lista_ver') replies.push(await listsText(user, a.lista));
    else if (a.tipo === 'agenda') {
      const today = localParts().date;
      replies.push(a.dia_consulta === 'semana' ? await agendaText(user, today, 7) : await agendaText(user, a.dia_consulta || today, 1));
    } else if (['evento', 'recordatorio', 'cumpleanios'].includes(a.tipo)) toConfirm.push(a);
  }
  for (const r of replies) await send(chat, r);
  if (!toConfirm.length) return replies.length ? null : send(chat, 'Mmm, no me quedó claro 🤔 Probá con algo como "el viernes a las 9 reunión con Ana".');

  const lines = [];
  for (const a of toConfirm) {
    if (a.tipo === 'cumpleanios') {
      lines.push(`🎂 <b>${esc(a.titulo)}</b> — todos los años el ${fmtMonthDay(a.fecha_cumple || a.inicio?.slice(5, 10))}`);
      continue;
    }
    const start = fromLocal(a.inicio);
    if (!start) { lines.push(`❓ <b>${esc(a.titulo)}</b> — no entendí la fecha`); continue; }
    const allDay = a.todo_el_dia || a.inicio.length === 10;
    lines.push(`${a.tipo === 'recordatorio' ? '⏰' : '📅'} <b>${esc(a.titulo)}</b> — ${cuando(start, allDay)}${a.familiar ? ' 👨‍👩‍👧 (familia)' : ''}`);
    const clash = await conflicts(user, start, fromLocal(a.fin) || new Date(start.getTime() + 3600000), allDay);
    if (clash) lines.push(`   ⚠️ Se pisa con: ${esc(clash)}`);
  }
  await sql`UPDATE users SET pending = ${JSON.stringify(toConfirm)} WHERE id = ${user.id}`;
  return send(chat, `¿Lo agendo así?\n\n${lines.join('\n')}`,
    buttons([[['✅ Agendar', 'ok'], ['❌ Cancelar', 'no']]]));
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fmtMonthDay(md = '') {
  const [m, d] = md.split('-').map(Number);
  return m ? `${d} de ${MESES[m - 1]}` : md;
}

async function conflicts(user, start, end, allDay) {
  if (allDay) return null;
  const local = await sql`SELECT title, starts_at FROM items
    WHERE kind = 'event' AND (user_id = ${user.id} OR (family_id IS NOT NULL AND family_id = ${user.family_id}))
    AND starts_at < ${end} AND COALESCE(ends_at, starts_at + interval '1 hour') > ${start} LIMIT 1`;
  if (local[0]) return `${local[0].title} (${hora(new Date(local[0].starts_at))})`;
  if (user.google_refresh) {
    try {
      const ev = (await listEvents(user.google_refresh, start, end)).find((e) => !e.allDay);
      if (ev) return `${ev.title} (${hora(ev.start)})`;
    } catch (e) { console.error(e); }
  }
  return null;
}

async function saveConfirmed(user, acts) {
  const fam = (a) => (a.familiar && user.family_id ? user.family_id : null);
  const done = [];
  for (const a of acts) {
    if (a.tipo === 'cumpleanios') {
      const md = a.fecha_cumple || a.inicio?.slice(5, 10);
      if (!md) continue;
      await sql`INSERT INTO items (user_id, family_id, kind, title, month_day) VALUES (${user.id}, ${fam(a)}, 'birthday', ${a.titulo}, ${md})`;
      if (user.google_refresh) {
        try {
          const y = localParts().date.slice(0, 4);
          await createEvent(user.google_refresh, { title: `🎂 ${a.titulo}`, start: fromLocal(`${y}-${md}`), allDay: true, yearly: true });
        } catch (e) { console.error(e); }
      }
      done.push(`🎂 ${a.titulo}`);
      continue;
    }
    const start = fromLocal(a.inicio);
    if (!start) continue;
    const allDay = a.todo_el_dia || a.inicio.length === 10;
    const end = fromLocal(a.fin);
    if (a.tipo === 'recordatorio') {
      const at = allDay ? new Date(start.getTime() + 9 * 3600000) : start;
      await sql`INSERT INTO items (user_id, family_id, kind, title, starts_at, all_day, remind_at)
        VALUES (${user.id}, ${fam(a)}, 'reminder', ${a.titulo}, ${start}, ${allDay}, ${at})`;
      done.push(`⏰ ${a.titulo}`);
      continue;
    }
    let gcalId = null;
    if (user.google_refresh) {
      try { gcalId = await createEvent(user.google_refresh, { title: a.titulo, start, end, allDay }); } catch (e) { console.error(e); }
    }
    // Si quedó en Google, los avisos salen leyendo el calendario; si no, los manejamos acá.
    const remindAt = gcalId || allDay ? null : new Date(start.getTime() - user.remind_minutes * 60000);
    await sql`INSERT INTO items (user_id, family_id, kind, title, starts_at, ends_at, all_day, gcal_id, remind_at)
      VALUES (${user.id}, ${fam(a)}, 'event', ${a.titulo}, ${start}, ${end}, ${allDay}, ${gcalId}, ${remindAt})`;
    done.push(`📅 ${a.titulo}${gcalId ? ' (en tu Google Calendar)' : ''}`);
  }
  return done;
}

// ---------- listas ----------
const listName = (n) => (n || 'super').toLowerCase().replace(/[^a-z0-9áéíóúñ ]/gi, '').trim() || 'super';

async function listAdd(user, a) {
  const name = listName(a.lista);
  const fam = user.family_id && (a.familiar || name === 'super') ? user.family_id : null;
  for (const el of a.elementos || []) {
    await sql`INSERT INTO items (user_id, family_id, kind, title, list_name) VALUES (${user.id}, ${fam}, 'list', ${el}, ${name})`;
  }
  return `🛒 Agregué a <b>${esc(name)}</b>: ${esc((a.elementos || []).join(', '))}${fam ? ' (compartida con tu familia)' : ''}`;
}

async function listRemove(user, a) {
  const name = listName(a.lista);
  let n = 0;
  for (const el of a.elementos || []) {
    const r = await sql`UPDATE items SET done = true WHERE kind = 'list' AND list_name = ${name} AND done = false
      AND (user_id = ${user.id} OR (family_id IS NOT NULL AND family_id = ${user.family_id}))
      AND lower(title) LIKE ${'%' + el.toLowerCase() + '%'} RETURNING id`;
    n += r.length;
  }
  return n ? `✔️ Taché ${n} de <b>${esc(name)}</b>.` : 'No encontré eso en la lista 🤔';
}

async function listsText(user, only) {
  const rows = await sql`SELECT list_name, title FROM items WHERE kind = 'list' AND done = false
    AND (user_id = ${user.id} OR (family_id IS NOT NULL AND family_id = ${user.family_id}))
    ORDER BY list_name, created_at`;
  const want = only ? listName(only) : null;
  const by = {};
  for (const r of rows) if (!want || r.list_name === want) (by[r.list_name] ||= []).push(r.title);
  const names = Object.keys(by);
  if (!names.length) return want ? `La lista <b>${esc(want)}</b> está vacía.` : 'No tenés listas todavía. Probá: "agregá yerba a la lista del súper" 🧉';
  return names.map((n) => `🗒️ <b>${esc(n)}</b>\n${by[n].map((t) => `• ${esc(t)}`).join('\n')}`).join('\n\n');
}

// ---------- agenda ----------
export async function agendaItems(user, fromDate, days) {
  const from = dayRange(fromDate).start;
  const to = new Date(from.getTime() + days * 86400000);
  const out = [];
  const rows = await sql`SELECT kind, title, starts_at, all_day, gcal_id, family_id FROM items
    WHERE kind IN ('event','reminder') AND starts_at >= ${from} AND starts_at < ${to}
    AND (user_id = ${user.id} OR (family_id IS NOT NULL AND family_id = ${user.family_id}))`;
  for (const r of rows) {
    if (r.gcal_id && user.google_refresh) continue; // ya viene de Google
    out.push({ title: r.title, start: new Date(r.starts_at), allDay: r.all_day, icon: r.kind === 'reminder' ? '⏰' : r.family_id ? '👨‍👩‍👧' : '📅' });
  }
  if (user.google_refresh) {
    try { for (const e of await listEvents(user.google_refresh, from, to)) out.push({ ...e, icon: '📅' }); } catch (e) { console.error(e); }
  }
  // cumpleaños dentro del rango
  const mds = [];
  for (let i = 0; i < days; i++) mds.push(addDays(fromDate, i).slice(5));
  const bd = await sql`SELECT title, month_day FROM items WHERE kind = 'birthday' AND month_day = ANY(${mds})
    AND (user_id = ${user.id} OR (family_id IS NOT NULL AND family_id = ${user.family_id}))`;
  for (const b of bd) {
    const date = addDays(fromDate, mds.indexOf(b.month_day));
    out.push({ title: `Cumple de ${b.title.replace(/^cumple(años)?\s+(de\s+)?/i, '')}`, start: fromLocal(date), allDay: true, icon: '🎂' });
  }
  return out.sort((a, b) => a.start - b.start || (a.allDay ? -1 : 1));
}

async function agendaText(user, fromDate, days) {
  const items = await agendaItems(user, fromDate, days);
  const title = days === 1 ? `📆 <b>${dia(fromLocal(fromDate))}</b>` : '📆 <b>Tus próximos 7 días</b>';
  if (!items.length) return `${title}\nNada agendado. ¡Día libre para un mate tranquilo! 🧉`;
  let lastDay = '';
  const lines = [];
  for (const i of items) {
    const d = dia(i.start);
    if (days > 1 && d !== lastDay) { lines.push(`\n<b>${d}</b>`); lastDay = d; }
    lines.push(`${i.icon} ${i.allDay ? 'Todo el día' : hora(i.start)} — ${esc(i.title)}`);
  }
  return `${title}\n${lines.join('\n')}`;
}

// ---------- familia ----------
async function family(user, chat) {
  if (user.family_id) {
    const f = await sql`SELECT code FROM families WHERE id = ${user.family_id}`;
    const m = await sql`SELECT first_name FROM users WHERE family_id = ${user.family_id}`;
    return send(chat, `👨‍👩‍👧 Tu familia: ${m.map((x) => esc(x.first_name || 'alguien')).join(', ')}\n\nPara sumar a alguien, que abra MateBot y escriba:\n<code>/unirme ${f[0]?.code}</code>\n\nComparten la lista del súper, los cumpleaños y lo que marques "para la familia".`);
  }
  return send(chat, 'Con una familia comparten la lista del súper, los cumpleaños y los eventos que marques "para la familia". ¿Creamos una?',
    buttons([[['👨‍👩‍👧 Crear mi familia', 'fam:new']]]));
}

async function joinFamily(user, chat, code) {
  const f = await sql`SELECT id FROM families WHERE code = ${String(code).trim().toUpperCase()}`;
  if (!f[0]) return send(chat, 'Ese código no existe 🤔 Pedíselo a quien creó la familia (lo ve con /familia).');
  await sql`UPDATE users SET family_id = ${f[0].id} WHERE id = ${user.id}`;
  const others = await sql`SELECT chat_id FROM users WHERE family_id = ${f[0].id} AND id <> ${user.id}`;
  for (const o of others) await send(o.chat_id, `👋 ${esc(user.first_name || 'Alguien')} se sumó a tu familia en MateBot.`);
  return send(chat, '¡Listo! Ya estás en la familia 👨‍👩‍👧 Ahora comparten la lista del súper y los cumpleaños.');
}

// ---------- botones ----------
async function handleCallback(q) {
  const chat = q.message.chat.id;
  const user = await getUser(q.from, chat);
  const data = q.data;
  await tg('answerCallbackQuery', { callback_query_id: q.id });
  const clear = () => tg('editMessageReplyMarkup', { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });

  try {
    if (data.startsWith('optin:')) {
      const v = data === 'optin:1';
      await sql`UPDATE users SET marketing_optin = ${v}, optin_at = ${v ? new Date() : null} WHERE id = ${user.id}`;
      await clear();
      await send(chat, v ? '✅ ¡Gracias! Te vamos a escribir solo con cosas que valgan la pena.' : 'Perfecto, no te vamos a escribir con novedades 👍');
      return await finishOnboarding(user, chat);
    }
    if (data === 'ok') {
      await clear();
      const acts = user.pending || [];
      await sql`UPDATE users SET pending = NULL WHERE id = ${user.id}`;
      if (!acts.length) return await send(chat, 'No tenía nada pendiente para agendar 🤔');
      const done = await saveConfirmed(user, acts);
      return await send(chat, `¡Agendado! 🧉\n${done.map(esc).join('\n')}\n\nTe aviso a tiempo.`);
    }
    if (data === 'no') {
      await clear();
      await sql`UPDATE users SET pending = NULL WHERE id = ${user.id}`;
      return await send(chat, 'Cancelado. Decímelo de nuevo cuando quieras.');
    }
    if (data === 'fam:new') {
      await clear();
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const f = await sql`INSERT INTO families (code, name, owner_id) VALUES (${code}, ${user.first_name}, ${user.id}) RETURNING id`;
      await sql`UPDATE users SET family_id = ${f[0].id} WHERE id = ${user.id}`;
      // lo que ya estaba en el súper pasa a ser compartido
      await sql`UPDATE items SET family_id = ${f[0].id} WHERE user_id = ${user.id} AND kind = 'list' AND list_name = 'super'`;
      return await send(chat, `¡Familia creada! 👨‍👩‍👧\n\nPasales este mensaje: "Abrí t.me/${cfg.botUsername} y escribí <code>/unirme ${code}</code>"`);
    }
    if (data === 'del:yes') {
      await clear();
      await sql`DELETE FROM users WHERE id = ${user.id}`;
      return await send(chat, 'Listo, borré tu cuenta y todos tus datos. Si querés volver, escribí /start 🧉', removeKeyboard);
    }
    if (data === 'noop') return await clear();
  } catch (e) {
    console.error(e);
    return await send(chat, 'Uy, algo falló. Probá de nuevo 🙏');
  }
}
