// Configuración central de MateBot. Todo lo sensible vive en variables de entorno de Vercel.
export const cfg = {
  brand: 'MateBot',
  tz: 'America/Argentina/Buenos_Aires',
  appUrl: (process.env.APP_URL || 'https://matebot.app').replace(/\/$/, ''),
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME || 'MateBotAR_bot',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  claudeModel: process.env.CLAUDE_MODEL || 'claude-haiku-5-5',
  groqKey: process.env.GROQ_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  cronSecret: process.env.CRON_SECRET,
  adminKey: process.env.ADMIN_KEY,
  stateSecret: process.env.STATE_SECRET || process.env.CRON_SECRET || 'cambiar-esto',
};
