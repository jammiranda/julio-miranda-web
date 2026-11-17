import { cfg } from '@/lib/config';
import { sql } from '@/lib/db';
import { send, esc } from '@/lib/telegram';
import { listEvents } from '@/lib/google';
import { agendaItems } from '@/lib/bot';
import { localParts, hora, dia } from '@/lib/time';

export const maxDuration = 60;

// Corre cada 5 minutos: avisos previos y resumen diario.
export async function GET(req) {
  const auth = req.headers.get('authorization');
  const q = new URL(req.url).searchParams.get('key');
  if (cfg.cronSecret && auth !== `Bearer ${cfg.cronSecret}` && q !== cfg.cronSecret) {
    return new Response('forbidden', { status: 401 });
  }
  const now = new Date();
  const stats = { reminders: 0, google: 0, digests: 0 };

  // 1) recordatorios y eventos guardados en MateBot
  const due = await sql`SELECT i.*, u.chat_id FROM items i JOIN users u ON u.id = i.user_id
    WHERE i.reminded = false AND i.remind_at IS NOT NULL AND i.remind_at <= ${now} LIMIT 200`;
  for (const it of due) {
    const txt = it.kind === 'reminder'
      ? `⏰ <b>Recordatorio:</b> ${esc(it.title)}`
      : `🔔 <b>${esc(it.title)}</b> — hoy a las ${hora(new Date(it.starts_at))}`;
    const targets = it.family_id
      ? await sql`SELECT chat_id FROM users WHERE family_id = ${it.family_id}`
      : [{ chat_id: it.chat_id }];
    for (const t of targets) await send(t.chat_id, txt);
    await sql`UPDATE items SET reminded = true WHERE id = ${it.id}`;
    stats.reminders++;
  }

  // 2) avisos de Google Calendar
  const gUsers = await sql`SELECT * FROM users WHERE google_refresh IS NOT NULL AND step = 'ready'`;
  for (const u of gUsers) {
    try {
      const to = new Date(now.getTime() + (u.remind_minutes + 5) * 60000);
      for (const e of await listEvents(u.google_refresh, now, to)) {
        if (e.allDay || e.start <= now) continue;
        const ins = await sql`INSERT INTO gcal_reminded (user_id, event_id) VALUES (${u.id}, ${e.id + '@' + e.start.toISOString()})
          ON CONFLICT DO NOTHING RETURNING user_id`;
        if (!ins.length) continue;
        const mins = Math.round((e.start - now) / 60000);
        await send(u.chat_id, `🔔 <b>${esc(e.title)}</b> — a las ${hora(e.start)} (en ${mins} min)`);
        stats.google++;
      }
    } catch (e) { console.error('google tick', u.id, e.message); }
  }

  // 3) resumen diario
  const lp = localParts(now);
  const ready = await sql`SELECT * FROM users WHERE step = 'ready' AND digest_hour <= ${lp.hour}
    AND digest_hour >= ${lp.hour - 2} AND (last_digest IS NULL OR last_digest < ${lp.date})`;
  for (const u of ready) {
    try {
      const items = await agendaItems(u, lp.date, 1);
      const body = items.length
        ? items.map((i) => `${i.icon} ${i.allDay ? 'Todo el día' : hora(i.start)} — ${esc(i.title)}`).join('\n')
        : 'Nada agendado para hoy. ¡Día libre para un mate tranquilo! 🧉';
      const tomorrow = await agendaItems(u, new Date(Date.parse(`${lp.date}T12:00:00-03:00`) + 86400000).toISOString().slice(0, 10), 1);
      const bdays = tomorrow.filter((i) => i.icon === '🎂').map((i) => `🎁 Mañana: ${esc(i.title)}`).join('\n');
      await send(u.chat_id, `☀️ <b>Buen día${u.first_name ? ', ' + esc(u.first_name) : ''}!</b> Esto tenés hoy, ${dia(now)}:\n\n${body}${bdays ? '\n\n' + bdays : ''}`);
      await sql`UPDATE users SET last_digest = ${lp.date} WHERE id = ${u.id}`;
      stats.digests++;
    } catch (e) { console.error('digest', u.id, e.message); }
  }

  return Response.json({ ok: true, ...stats });
}
