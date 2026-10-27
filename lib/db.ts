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
alter table db_contactos add column if not exists categoria text;
alter table db_contactos add column if not exists consentimiento text;
alter table db_contactos add column if not exists ultimo_contacto date;
alter table db_contactos add column if not exists interacciones int;
alter table db_contactos drop constraint if exists db_contactos_etapa_check;
alter table db_contactos add constraint db_contactos_etapa_check check (etapa in ('base','nuevo','conversando','reunion','propuesta','ganado','perdido'));
create unique index if not exists db_contactos_email on db_contactos (lower(email)) where email is not null;
alter table consultas add column if not exists fuente text;
alter table consultas add column if not exists campania text;
alter table consultas add column if not exists utm_source text;
alter table consultas add column if not exists utm_medium text;
alter table consultas add column if not exists utm_campaign text;
alter table consultas add column if not exists gclid text;
alter table consultas add column if not exists origen_detalle jsonb;
alter table db_contactos add column if not exists fuente text;
alter table db_contactos add column if not exists campania text;
alter table consultas add column if not exists brief_token text;
alter table consultas add column if not exists brief jsonb;
alter table consultas add column if not exists brief_en timestamptz;
alter table consultas add column if not exists propuesta text;
create unique index if not exists consultas_brief_token on consultas(brief_token) where brief_token is not null;
alter table db_servicios add column if not exists precio_desde numeric;
alter table db_servicios add column if not exists precio_hasta numeric;
alter table db_servicios add column if not exists moneda text not null default 'USD';
alter table db_servicios add column if not exists plazo text;
alter table db_servicios add column if not exists link text;
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
create table if not exists db_reuniones (
  id serial primary key,
  consulta_id int references consultas(id), contacto_id int references db_contactos(id),
  nombre text, email text, telefono text,
  inicio timestamptz not null, fin timestamptz not null,
  modalidad text not null default 'videollamada', link text, calendar_id text,
  estado text not null default 'confirmada' check (estado in ('confirmada','realizada','cancelada','no_asistio')),
  notas text, creado timestamptz not null default now()
);
create index if not exists db_reuniones_inicio on db_reuniones(inicio);
alter table db_reuniones add column if not exists recordado timestamptz;
insert into db_servicios(nombre,categoria,descripcion) values ('Tienda online','A medida','Venta por web con catálogo, carrito, Mercado Pago y envíos') on conflict do nothing;
update db_servicios set precio_desde=v.d, precio_hasta=v.h, plazo=coalesce(db_servicios.plazo,v.p), descripcion=case when v.x<>'' then db_servicios.descripcion||' · '||v.x else db_servicios.descripcion end from (values
  ('Sitio web',600,2500,'2 a 5 semanas',''),
  ('Tienda online',1200,5000,'3 a 8 semanas','más plataforma y hosting mensual'),
  ('Sistema web a medida',3500,25000,'6 a 20 semanas, por etapas',''),
  ('App iOS y Android',5000,30000,'2 a 5 meses',''),
  ('Asistente de WhatsApp con IA',1500,6000,'3 a 8 semanas','más costo mensual de WhatsApp, IA y hosting (USD 70 a 180)'),
  ('Tableros e indicadores',1000,6000,'2 a 6 semanas',''),
  ('Sistema para clínicas e internación domiciliaria',3000,12000,'4 a 10 semanas','más abono mensual de soporte'),
  ('CRM de afiliados',3000,12000,'4 a 10 semanas',''),
  ('App y credencial digital',3000,12000,'4 a 10 semanas',''),
  ('Academia online',1500,6000,'3 a 6 semanas',''),
  ('Votación y control de acceso',1500,8000,'3 a 8 semanas',''),
  ('Gestor documental con firma digital',3000,12000,'6 a 12 semanas','')
) as v(n,d,h,p,x) where db_servicios.nombre=v.n and db_servicios.precio_desde is null;
update db_servicios set link='https://sistema.devisebit.com/fichas/'||v.s from (values ('Sitio web','sitio-web'),('Tienda online','tienda-online'),('Sistema web a medida','sistema-a-medida'),('App iOS y Android','app'),('Asistente de WhatsApp con IA','asistente-whatsapp-ia'),('Tableros e indicadores','tableros'),('Academia online','academia-online'),('Sistema para clínicas e internación domiciliaria','sistema-clinicas'),('CRM de afiliados','crm-afiliados'),('App y credencial digital','credencial-digital'),('Votación y control de acceso','votacion-acceso'),('Gestor documental con firma digital','gestor-documental')) as v(n,s) where db_servicios.nombre=v.n and db_servicios.link is null;
alter table db_contactos add column if not exists email_estado text not null default 'activo';
alter table db_contactos add column if not exists email_token text;
alter table db_contactos add column if not exists tags text[] not null default '{}';
alter table db_contactos add column if not exists suscrito_en timestamptz;
alter table db_contactos add column if not exists baja_en timestamptz;
alter table db_contactos alter column email_token set default md5(random()::text || clock_timestamp()::text);
create unique index if not exists db_contactos_email_token on db_contactos(email_token) where email_token is not null;
update db_contactos set email_token=md5(random()::text || id::text || clock_timestamp()::text) where email_token is null;
create table if not exists em_campanias (
  id serial primary key,
  asunto text not null, preheader text, contenido text not null default '',
  segmento jsonb not null default '{}'::jsonb,
  estado text not null default 'borrador' check (estado in ('borrador','enviando','enviada','pausada')),
  creado_por text, creado timestamptz not null default now(), lanzada timestamptz, terminada timestamptz
);
create table if not exists em_envios (
  id bigserial primary key,
  campania_id int not null references em_campanias(id) on delete cascade,
  contacto_id int references db_contactos(id), email text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','enviado','error','omitido')),
  error text, proveedor_id text,
  enviado_en timestamptz, abierto_en timestamptz, aperturas int not null default 0, clic_en timestamptz, clics int not null default 0, baja boolean not null default false,
  unique (campania_id, email)
);
create index if not exists em_envios_cola on em_envios(estado, campania_id);
create table if not exists em_log (id bigserial primary key, tipo text not null, email text, creado timestamptz not null default now());
create table if not exists am_guias (
  id serial primary key, slug text unique not null, titulo text not null, bajada text, categoria text, contenido text not null default '',
  exclusiva boolean not null default false, publicada boolean not null default false, destacada boolean not null default false,
  vistas int not null default 0, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists am_semillas (lote text primary key, creado timestamptz not null default now());
create table if not exists am_productos (
  id serial primary key, slug text unique not null, titulo text not null, bajada text, descripcion text not null default '',
  precio numeric, moneda text not null default 'ARS', estado text not null default 'lista_espera' check (estado in ('venta','lista_espera','oculto')),
  archivo_url text, creado timestamptz not null default now()
);
create table if not exists am_ordenes (
  id serial primary key, producto_id int references am_productos(id), email text not null, nombre text,
  monto numeric, moneda text, estado text not null default 'pendiente' check (estado in ('pendiente','pagada','cancelada')),
  mp_preferencia text, mp_pago text, token text not null default md5(random()::text || clock_timestamp()::text), fuente text,
  creado timestamptz not null default now(), pagada_en timestamptz
);
create table if not exists avisos_estado (
  usuario_id int not null, clave text not null,
  estado text not null check (estado in ('leido','borrado')),
  n int not null default 0, dia date not null,
  primary key (usuario_id, clave)
);
create table if not exists avisos_email (clave text primary key, enviado timestamptz not null default now());
create table if not exists pv_visitas (
  dia date not null, host text not null, path text not null, ref text not null default '', disp text not null default '',
  n int not null default 0,
  primary key (dia, host, path, ref, disp)
);
insert into am_productos(slug,titulo,bajada,descripcion,precio,moneda,estado) values ('prueba-de-pago','Pago de prueba','Producto de prueba para verificar el cobro con Mercado Pago.','## Pago de prueba\nEste producto sirve solo para probar que el cobro con Mercado Pago funciona de punta a punta: pago, aviso y página de gracias.',100,'ARS','venta') on conflict (slug) do nothing;
alter table db_proyectos add column if not exists fase text not null default 'inicio';
create table if not exists db_hitos (
  id serial primary key,
  proyecto_id int not null references db_proyectos(id) on delete cascade,
  tipo text not null default 'avance',
  titulo text not null, detalle text, url text,
  fecha timestamptz not null default now(),
  visible boolean not null default true,
  requiere_ok boolean not null default false,
  ok_en timestamptz, ok_comentario text,
  autor text, creado timestamptz not null default now()
);
create index if not exists db_hitos_proy on db_hitos(proyecto_id, fecha desc);
create table if not exists portal_accesos (
  id serial primary key,
  contacto_id int not null references db_contactos(id) on delete cascade,
  token_hash text unique not null, expira timestamptz not null, usado timestamptz,
  motivo text not null default 'ingreso',
  creado timestamptz not null default now()
);
alter table db_contactos add column if not exists portal_ultimo timestamptz;
alter table db_contactos add column if not exists portal_acceso text not null default 'auto';
alter table db_contactos drop constraint if exists db_contactos_portal_acceso_check;
alter table db_contactos add constraint db_contactos_portal_acceso_check check (portal_acceso in ('auto','habilitado','bloqueado'));
alter table db_contactos add column if not exists portal_nota text;
create table if not exists portal_solicitudes (
  id bigserial primary key,
  email text not null, contacto_id int references db_contactos(id) on delete set null,
  resultado text not null, detalle text,
  resuelta text, resuelta_por text, resuelta_en timestamptz,
  creado timestamptz not null default now()
);
create index if not exists portal_solicitudes_creado on portal_solicitudes(creado desc);
alter table db_proyectos add column if not exists abono_monto numeric;
alter table db_proyectos add column if not exists abono_moneda text not null default 'ARS';
alter table db_proyectos add column if not exists abono_dia int;
alter table db_proyectos add column if not exists abono_desde date;
alter table db_proyectos add column if not exists abono_hasta date;
alter table db_proyectos add column if not exists moneda text not null default 'USD';
create table if not exists db_cobros (
  id serial primary key,
  contacto_id int not null references db_contactos(id) on delete cascade,
  proyecto_id int references db_proyectos(id) on delete set null,
  tipo text not null default 'cuota' check (tipo in ('anticipo','cuota','saldo','abono','otro')),
  concepto text not null, monto numeric not null, moneda text not null default 'ARS',
  vence date not null, periodo text,
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado','anulado')),
  pagado_en timestamptz, medio text, comprobante text, nota text,
  mp_pago text, creado_por text, creado timestamptz not null default now()
);
create unique index if not exists db_cobros_abono on db_cobros(proyecto_id, periodo) where tipo='abono' and estado<>'anulado';
create index if not exists db_cobros_contacto on db_cobros(contacto_id, estado, vence);
alter table db_cobros add column if not exists informado_en timestamptz;
alter table db_cobros add column if not exists informado_detalle text;
create table if not exists am_cursos (
  id serial primary key, slug text unique not null, titulo text not null, bajada text,
  descripcion text not null default '', imagen text, categoria text, nivel text, docente text,
  horas numeric, modalidad text not null default 'online' check (modalidad in ('online','en_vivo','presencial','mixta')),
  precio numeric, moneda text not null default 'ARS',
  estado text not null default 'borrador' check (estado in ('borrador','publicado','archivado')),
  req_lecciones int not null default 100, req_asistencia int not null default 75,
  certifica boolean not null default true, destacado boolean not null default false,
  creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists am_ediciones (
  id serial primary key, curso_id int not null references am_cursos(id) on delete cascade,
  nombre text not null default 'Siempre disponible', inicio date, fin date, horario text, lugar text, link text,
  cupo int, estado text not null default 'inscripcion' check (estado in ('inscripcion','en_curso','finalizada','cancelada')),
  creado timestamptz not null default now()
);
create table if not exists am_lecciones (
  id serial primary key, curso_id int not null references am_cursos(id) on delete cascade,
  orden int not null default 0, modulo text, titulo text not null,
  tipo text not null default 'lectura' check (tipo in ('video','lectura','descarga','tarea')),
  contenido text not null default '', video_url text, archivo_url text, duracion_min int,
  publicada boolean not null default true, creado timestamptz not null default now()
);
create table if not exists am_clases (
  id serial primary key, edicion_id int not null references am_ediciones(id) on delete cascade,
  fecha timestamptz not null, horas numeric not null default 2, tema text, link text, grabacion text,
  creado timestamptz not null default now()
);
create table if not exists am_inscripciones (
  id serial primary key, edicion_id int not null references am_ediciones(id) on delete cascade,
  contacto_id int not null references db_contactos(id) on delete cascade,
  estado text not null default 'inscripto' check (estado in ('inscripto','cursando','aprobado','desaprobado','baja')),
  nota text, origen text, aprobado_en timestamptz, ultima_actividad timestamptz,
  creado timestamptz not null default now(),
  unique (edicion_id, contacto_id)
);
create table if not exists am_progreso (
  inscripcion_id int not null references am_inscripciones(id) on delete cascade,
  leccion_id int not null references am_lecciones(id) on delete cascade,
  completada timestamptz not null default now(),
  primary key (inscripcion_id, leccion_id)
);
create table if not exists am_asistencias (
  clase_id int not null references am_clases(id) on delete cascade,
  inscripcion_id int not null references am_inscripciones(id) on delete cascade,
  presente boolean not null default true,
  primary key (clase_id, inscripcion_id)
);
create table if not exists am_certificados (
  id serial primary key, inscripcion_id int unique not null references am_inscripciones(id) on delete cascade,
  codigo text unique not null, nombre text not null, curso text not null, horas numeric, edicion text,
  emitido timestamptz not null default now(), anulado boolean not null default false
);
create table if not exists am_eventos (
  id bigserial primary key, contacto_id int, inscripcion_id int, tipo text not null, ref text,
  creado timestamptz not null default now()
);
create index if not exists am_eventos_contacto on am_eventos(contacto_id, creado desc);
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
