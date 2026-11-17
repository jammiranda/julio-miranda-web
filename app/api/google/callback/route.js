import { cfg } from '@/lib/config';
import { sql } from '@/lib/db';
import { exchangeCode, verifyState, encrypt } from '@/lib/google';
import { send, esc } from '@/lib/telegram';

const page = (title, msg) => new Response(
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#f5f5f5;font-family:system-ui,sans-serif;text-align:center;padding:24px}
  .c{max-width:420px}h1{font-size:28px}a{display:inline-block;margin-top:20px;background:#e30613;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700}</style></head>
  <body><div class="c"><div style="font-size:56px">🧉</div><h1>${title}</h1><p>${msg}</p><a href="https://t.me/${cfg.botUsername}">Volver a MateBot</a></div></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8' } },
);

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  if (p.get('error')) return page('Conexión cancelada', 'No pasa nada: podés conectar tu calendario más tarde con /conectar.');
  const uid = verifyState(p.get('state'));
  if (!uid) return page('El link venció', 'Pedí uno nuevo en MateBot con /conectar.');
  try {
    const { refresh, email } = await exchangeCode(p.get('code'));
    const rows = await sql`UPDATE users SET google_refresh = ${encrypt(refresh)}, google_email = ${email},
      email = COALESCE(email, ${email}) WHERE id = ${uid} RETURNING chat_id`;
    if (rows[0]) await send(rows[0].chat_id, `📅 ¡Listo! Conecté tu Google Calendar${email ? ` (${esc(email)})` : ''}. Desde ahora te aviso de todo lo que tengas y lo que me dictes queda en tu calendario.`);
    return page('¡Calendario conectado!', 'Ya podés volver a Telegram. MateBot te va a avisar de todo lo que tengas.');
  } catch (e) {
    console.error(e);
    return page('No se pudo conectar', 'Probá de nuevo con /conectar en MateBot.');
  }
}
