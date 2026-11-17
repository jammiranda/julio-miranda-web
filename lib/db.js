import { neon } from '@neondatabase/serverless';

let _sql;
export function sql(strings, ...values) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql(strings, ...values);
}

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    owner_id INT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tg_id BIGINT UNIQUE NOT NULL,
    chat_id BIGINT NOT NULL,
    first_name TEXT,
    username TEXT,
    email TEXT,
    phone TEXT,
    marketing_optin BOOLEAN DEFAULT false,
    optin_at TIMESTAMPTZ,
    tz TEXT DEFAULT 'America/Argentina/Buenos_Aires',
    digest_hour INT DEFAULT 8,
    remind_minutes INT DEFAULT 30,
    google_refresh TEXT,
    google_email TEXT,
    family_id INT REFERENCES families(id) ON DELETE SET NULL,
    step TEXT DEFAULT 'new',
    pending JSONB,
    last_digest DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_seen TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    family_id INT REFERENCES families(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    month_day TEXT,
    list_name TEXT,
    done BOOLEAN DEFAULT false,
    gcal_id TEXT,
    remind_at TIMESTAMPTZ,
    reminded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS items_remind ON items (remind_at) WHERE reminded = false`,
  `CREATE INDEX IF NOT EXISTS items_user ON items (user_id, kind)`,
  `CREATE TABLE IF NOT EXISTS gcal_reminded (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT,
    PRIMARY KEY (user_id, event_id)
  )`,
];

export async function setupSchema() {
  const { neon } = await import('@neondatabase/serverless');
  const raw = neon(process.env.DATABASE_URL);
  for (const stmt of SCHEMA) await raw.query(stmt);
}
