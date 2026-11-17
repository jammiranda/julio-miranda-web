import { cfg } from '@/lib/config';
import { setupSchema } from '@/lib/db';
import { tg } from '@/lib/telegram';

// Uso único: /api/setup?key=ADMIN_KEY — crea tablas y registra webhook y comandos en Telegram.
export async function GET(req) {
  if (!cfg.adminKey || new URL(req.url).searchParams.get('key') !== cfg.adminKey) {
    return new Response('forbidden', { status: 401 });
  }
  const out = {};
  await setupSchema();
  out.db = 'ok';
  out.webhook = await tg('setWebhook', {
    url: `${cfg.appUrl}/api/telegram`,
    secret_token: cfg.telegramSecret,
    allowed_updates: ['message', 'callback_query'],
  });
  out.commands = await tg('setMyCommands', {
    commands: [
      { command: 'hoy', description: 'Tu agenda de hoy' },
      { command: 'manana', description: 'Tu agenda de mañana' },
      { command: 'semana', description: 'Los próximos 7 días' },
      { command: 'listas', description: 'Tus listas (súper, tareas...)' },
      { command: 'conectar', description: 'Conectar Google Calendar' },
      { command: 'familia', description: 'Compartir con tu familia' },
      { command: 'resumen', description: 'Hora del resumen diario (ej: /resumen 8)' },
      { command: 'aviso', description: 'Minutos de anticipación (ej: /aviso 30)' },
      { command: 'novedades', description: 'Activar o quitar novedades de DEVISEBIT' },
      { command: 'privacidad', description: 'Qué hacemos con tus datos' },
      { command: 'borrar', description: 'Borrar tu cuenta y tus datos' },
      { command: 'ayuda', description: 'Cómo usar MateBot' },
    ],
  });
  await tg('setMyDescription', {
    description: 'Soy MateBot 🧉, tu asistente personal de DEVISEBIT. Mandame un audio y te ordeno turnos, reuniones, cumpleaños y listas; te aviso a tiempo y te mando un resumen cada mañana. Gratis. Tus datos son tuyos: no los leemos ni los vendemos.',
  });
  await tg('setMyShortDescription', { short_description: 'Tu agenda por audio, gratis. By DEVISEBIT 🧉' });
  return Response.json(out);
}
