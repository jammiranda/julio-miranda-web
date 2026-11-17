import { cfg } from '@/lib/config';
import { handleUpdate } from '@/lib/bot';

export const maxDuration = 60;

export async function POST(req) {
  if (cfg.telegramSecret && req.headers.get('x-telegram-bot-api-secret-token') !== cfg.telegramSecret) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json();
  try {
    await handleUpdate(update);
  } catch (e) {
    console.error('update error', e);
  }
  return Response.json({ ok: true });
}
