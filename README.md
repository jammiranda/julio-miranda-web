# MateBot by DEVISEBIT

Asistente personal por audio (Telegram, pronto WhatsApp). Next.js en Vercel, proyecto `matebot-devisebit`, dominio matebot.devisebit.com.

Variables de entorno: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, DATABASE_URL (Neon), GROQ_API_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, NEXT_PUBLIC_BOT_USERNAME, CRON_SECRET, ADMIN_KEY, STATE_SECRET.

Puesta en marcha: cargar las variables y abrir `/api/setup?key=ADMIN_KEY` (crea tablas, webhook y comandos).
Contactos con permiso para el CRM: `/api/admin/leads?key=ADMIN_KEY` (CSV) o `&format=json`.
