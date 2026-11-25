import { APP } from './_core.js';

// Los mails salen por el sistema de DEVISEBIT (que tiene los proveedores configurados); Resend directo como respaldo.
export const mailOn = () => !!((process.env.FAMILIA_MAIL_URL && process.env.FAMILIA_MAIL_KEY) || process.env.RESEND_API_KEY);
export async function sendMail(to, subject, html) {
  if (process.env.FAMILIA_MAIL_URL && process.env.FAMILIA_MAIL_KEY) {
    const r = await fetch(process.env.FAMILIA_MAIL_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-familia-key': process.env.FAMILIA_MAIL_KEY },
      body: JSON.stringify({ app: 'matecuentas', email: to, asunto: subject, html }) }).catch(() => null);
    if (r && r.ok) return true;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM || `${APP.name} <no-reply@devisebit.com>`, to: [to], subject, html }),
  });
  return r.ok;
}

