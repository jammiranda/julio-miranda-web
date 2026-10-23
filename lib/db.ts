import { neon } from "@neondatabase/serverless"

type Row = Record<string, any>

let _sql: ReturnType<typeof neon> | null = null
function client() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!url) throw new Error("Falta DATABASE_URL")
    _sql = neon(url)
  }
  return _sql
}

/** Consulta parametrizada: q("select * from x where id=$1", [id]) */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema()
  return (await client().query(text, params)) as T[]
}
export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const r = await q<T>(text, params)
  return r[0] ?? null
}

const SCHEMA = `
create table if not exists usuarios (
  id serial primary key,
  usuario text unique not null,
  nombre text not null,
  rol text not null check (rol in ('gerente','coordinacion','consulta','profesional')),
  pass_hash text, invite_token text, invite_expira timestamptz,
  activo boolean not null default true,
  email text, telefono text, foto text,
  creado timestamptz not null default now()
);
create table if not exists consultas (
  id serial primary key,
  empresa text not null default 'devisebit',
  creado timestamptz not null default now(),
  canal text not null default 'whatsapp',
  nombre text, telefono text, organizacion text, email text,
  motivo text, mensaje text,
  estado text not null default 'nueva' check (estado in ('nueva','contactada','calificada','convertida','descartada')),
  asignado text, notas text,
  necesita_humano boolean not null default false,
  chat_id text,
  actualizado timestamptz not null default now()
);
create table if not exists wa_chats (
  empresa text not null default 'devisebit',
  wa_id text not null,
  nombre text,
  consulta_id int references consultas(id),
  bot_pausado_hasta timestamptz, pausa_motivo text,
  estado jsonb not null default '{}'::jsonb,
  ultimo_entrante timestamptz,
  actualizado timestamptz not null default now(),
  primary key (empresa, wa_id)
);
create table if not exists wa_mensajes (
  id bigserial primary key,
  empresa text not null default 'devisebit',
  wa_id text not null,
  autor text not null check (autor in ('cliente','bot','equipo')),
  texto text,
  tipo text not null default 'text',
  meta_id text, autor_nombre text,
  creado timestamptz not null default now()
);
create index if not exists wa_mensajes_chat on wa_mensajes(empresa, wa_id, creado);
create table if not exists bot_conocimiento (
  id serial primary key,
  empresa text not null default 'devisebit',
  pregunta text, respuesta text not null,
  activo boolean not null default true,
  origen text not null default 'manual',
  creado_por text,
  creado timestamptz not null default now()
);
create table if not exists config (clave text primary key, valor text not null);
create table if not exists push_subs (
  id serial primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null, auth text not null,
  creado timestamptz not null default now()
);
create table if not exists auditoria (
  id bigserial primary key,
  usuario_id int, usuario text,
  accion text not null, entidad text, entidad_id text, detalle text,
  ts timestamptz not null default now()
);
create table if not exists db_contactos (
  id serial primary key,
  nombre text not null, organizacion text, cargo text,
  email text, telefono text, sector text,
  etapa text not null default 'nuevo' check (etapa in ('nuevo','conversando','reunion','propuesta','ganado','perdido')),
  origen text, consulta_id int, notas text, proximo text, proximo_fecha date,
  creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists db_servicios (
  id serial primary key,
  nombre text not null unique, categoria text, descripcion text,
  precio_ref numeric, activo boolean not null default true,
  creado timestamptz not null default now()
);
create table if not exists db_proyectos (
  id serial primary key,
  nombre text not null,
  contacto_id int references db_contactos(id),
  servicio_id int references db_servicios(id),
  estado text not null default 'planificado' check (estado in ('planificado','en_curso','pausado','terminado','cancelado')),
  inicio date, entrega date, monto numeric, responsable text,
  trello_board text, trello_url text, notas text,
  creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
insert into db_servicios(nombre,categoria,descripcion) values
  ('Sistema web a medida','A medida','Sistemas de gestión web conectados a lo que el cliente ya usa'),
  ('App iOS y Android','A medida','Apps móviles a medida'),
  ('Sitio web','A medida','Webs institucionales y landing pages'),
  ('Asistente de WhatsApp con IA','Producto','Responde 24 h, da turnos, deriva y guarda todo en el CRM'),
  ('Tableros e indicadores','Producto','Power BI o web, alertas y reportes automáticos'),
  ('Sistema para clínicas e internación domiciliaria','Producto','Pacientes, órdenes, visitas, historia clínica y cierre mensual'),
  ('CRM de afiliados','Producto','Gestión de afiliados para gremios, mutuales y obras sociales'),
  ('App y credencial digital','Producto','Credencial digital y app para afiliados o socios'),
  ('Academia online','Producto','Cursos, inscripciones y certificados'),
  ('Votación y control de acceso','Producto','Elecciones y acreditación'),
  ('Gestor documental con firma digital','Producto','Expedientes, circuitos y firma')
  on conflict do nothing;
insert into usuarios(usuario,nombre,rol) values ('julio','Julio Miranda','gerente') on conflict do nothing;
`

let ready: Promise<void> | null = null
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      const sql = client()
      for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
        await sql.query(stmt)
      }
    })().catch((e) => {
      ready = null
      throw e
    })
  }
  return ready
}

export async function audit(user: { id: number; usuario: string } | null, accion: string, entidad?: string, entidadId?: string | number, detalle?: string) {
  try {
    await q("insert into auditoria(usuario_id,usuario,accion,entidad,entidad_id,detalle) values ($1,$2,$3,$4,$5,$6)", [
      user?.id ?? null, user?.usuario ?? null, accion, entidad ?? null, entidadId != null ? String(entidadId) : null, detalle ?? null,
    ])
  } catch {}
}
