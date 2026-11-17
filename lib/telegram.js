import { cfg } from './config';

const api = (method) => `https://api.telegram.org/bot${cfg.telegramToken}/${method}`;

export async function tg(method, body) {
  const r = await fetch(api(method), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error('telegram', method, j.description);
  return j.result;
}

export function send(chatId, text, extra = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });
}

export const buttons = (rows) => ({
  reply_markup: { inline_keyboard: rows.map((r) => r.map(([text, data]) => (data.startsWith('http') ? { text, url: data } : { text, callback_data: data }))) },
});

export const removeKeyboard = { reply_markup: { remove_keyboard: true } };

export const askContact = {
  reply_markup: {
    keyboard: [[{ text: '📱 Compartir mi número', request_contact: true }], [{ text: 'Prefiero no compartirlo' }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

export async function downloadFile(fileId) {
  const f = await tg('getFile', { file_id: fileId });
  if (!f?.file_path) throw new Error('No pude bajar el audio');
  const r = await fetch(`https://api.telegram.org/file/bot${cfg.telegramToken}/${f.file_path}`);
  return { buf: Buffer.from(await r.arrayBuffer()), path: f.file_path };
}

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
