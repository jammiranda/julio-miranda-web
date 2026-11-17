import crypto from 'crypto';
import { cfg } from './config';

export const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events'];
const redirect = () => `${cfg.appUrl}/api/google/callback`;

// state firmado para que nadie pueda conectar un calendario a la cuenta de otro
export function signState(userId) {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', cfg.stateSecret).update(payload).digest('hex').slice(0, 32);
  return `${payload}.${sig}`;
}
export function verifyState(state) {
  const [uid, ts, sig] = String(state).split('.');
  const good = crypto.createHmac('sha256', cfg.stateSecret).update(`${uid}.${ts}`).digest('hex').slice(0, 32);
  if (sig !== good || Date.now() - Number(ts) > 3600 * 1000) return null;
  return Number(uid);
}

// Cifrado del refresh token en reposo
const key = () => crypto.createHash('sha256').update(cfg.stateSecret).digest();
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
export function decrypt(blob) {
  const [iv, tag, enc] = blob.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export function authUrl(userId) {
  const p = new URLSearchParams({
    client_id: cfg.googleClientId,
    redirect_uri: redirect(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: signState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: cfg.googleClientId, client_secret: cfg.googleClientSecret,
      redirect_uri: redirect(), grant_type: 'authorization_code',
    }),
  });
  const j = await r.json();
  if (!j.refresh_token) throw new Error(j.error_description || 'Google no devolvió permiso offline');
  let email = null;
  if (j.id_token) {
    try { email = JSON.parse(Buffer.from(j.id_token.split('.')[1], 'base64url').toString()).email; } catch {}
  }
  return { refresh: j.refresh_token, email };
}

async function accessToken(encRefresh) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: decrypt(encRefresh), client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret, grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('No pude renovar el acceso a Google Calendar');
  return j.access_token;
}

const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export async function listEvents(encRefresh, from, to) {
  const tok = await accessToken(encRefresh);
  const p = new URLSearchParams({
    timeMin: from.toISOString(), timeMax: to.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
  });
  const r = await fetch(`${CAL}?${p}`, { headers: { authorization: `Bearer ${tok}` } });
  const j = await r.json();
  return (j.items || []).filter((e) => e.status !== 'cancelled').map((e) => ({
    id: e.id,
    title: e.summary || '(sin título)',
    allDay: !!e.start?.date,
    start: new Date(e.start?.dateTime || `${e.start?.date}T00:00:00-03:00`),
    end: new Date(e.end?.dateTime || `${e.end?.date}T00:00:00-03:00`),
  }));
}

export async function createEvent(encRefresh, { title, start, end, allDay, yearly }) {
  const tok = await accessToken(encRefresh);
  const d = (x) => x.toISOString().slice(0, 10);
  const body = allDay
    ? { summary: title, start: { date: d(start) }, end: { date: d(new Date(start.getTime() + 86400000)) } }
    : {
        summary: title,
        start: { dateTime: start.toISOString(), timeZone: cfg.tz },
        end: { dateTime: (end || new Date(start.getTime() + 3600000)).toISOString(), timeZone: cfg.tz },
      };
  if (yearly) body.recurrence = ['RRULE:FREQ=YEARLY'];
  body.description = 'Agendado con MateBot by DEVISEBIT';
  const r = await fetch(CAL, {
    method: 'POST',
    headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.id) throw new Error('Google Calendar no aceptó el evento');
  return j.id;
}
