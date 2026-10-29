import { neon } from "@neondatabase/serverless"

type Row = Record<string, any>

let _sql: ReturnType<typeof neon> | null = null
function client() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!url) throw new Error("Falta DATABASE_URL")
    // Sin caché de Next: cada consulta va a la base (si no, Vercel puede devolver resultados viejos entre despliegues)
    _sql = neon(url, { fetchOptions: { cache: "no-store" } })
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
alter table am_productos add column if not exists servicio boolean not null default false;
insert into am_productos(slug,titulo,bajada,descripcion,precio,moneda,estado,archivo_url) values ('guia-transformacion-digital','Guía de Transformación Digital para pymes y organizaciones','Diagnóstico de madurez, hoja de ruta en 14 pasos, pilotos, gestión del cambio, indicadores y el Programa Kit 4.0. PDF de 13 páginas con plantillas.',E'## Qué incluye\n- Qué es (y qué no es) la transformación digital, y sus tres pilares: estrategia, cultura y tecnología.\n- **Autodiagnóstico de madurez digital** en 4 ejes y 4 niveles, con cómo leer el resultado.\n- Cadena de valor, PEST, cinco fuerzas y **Canvas del modelo de negocio** con preguntas guía.\n- **Hoja de ruta en 14 pasos** y cómo empezar con un piloto o producto mínimo viable.\n- Gestión del cambio: qué hacer cuando la cultura no acompaña.\n- Qué tecnologías mirar primero y cuándo conviene cada una.\n- **Programa Kit 4.0**: qué cofinancia, requisitos y pasos (resumen a octubre de 2026).\n- Tablero de indicadores y checklist final.\n\n## Para quién\nDirectores, gerentes, dueños de pymes y empresas familiares, gremios, mutuales y organismos públicos que quieren ordenar la transformación digital con un método.\n\nElaborada por el equipo de DEVISEBIT a partir de su experiencia en proyectos y de su formación en la Diplomatura en Transformación Digital (Universidad de Belgrano).',19900,'ARS','venta','enc:private/guia-transformacion-digital.enc') on conflict (slug) do nothing;
insert into am_productos(slug,titulo,bajada,descripcion,precio,moneda,estado,servicio) values ('taller-transformacion-digital','Taller de Transformación Digital','Una jornada de 3 horas para directivos y equipos, con autodiagnóstico de madurez digital y certificado de la ACADEMIA DEVISEBIT.',E'## Qué incluye\n- Jornada de 3 horas, virtual o presencial (CABA y GBA), para hasta 15 personas de tu organización.\n- Transformación digital e industria 4.0 explicadas simple, con casos reales.\n- **Autodiagnóstico de madurez digital** en vivo con tu equipo.\n- Primeros retos priorizados y una idea de piloto para empezar.\n- Material descargable y **certificado de la ACADEMIA DEVISEBIT** para cada participante.\n- La **Guía de Transformación Digital** en PDF para cada asistente.\n\n## Cómo sigue\nDespués del pago te escribimos en menos de 24 horas hábiles para coordinar la fecha.',390000,'ARS','venta',true) on conflict (slug) do nothing;
insert into am_productos(slug,titulo,bajada,descripcion,precio,moneda,estado,servicio) values ('diagnostico-transformacion-digital','Diagnóstico y hoja de ruta de Transformación Digital','Relevamos tu organización y te entregamos el nivel de madurez digital, los retos priorizados y el plan por etapas con indicadores.',E'## Qué incluye\n- Entrevistas con dirección y áreas clave, y relevamiento de procesos.\n- **Diagnóstico de madurez digital** en 4 ejes: liderazgo y estrategia, relación con el cliente, integración del negocio y gestión interna.\n- Análisis de cadena de valor y modelo de negocio.\n- **Hoja de ruta por etapas** con indicadores, recursos y plazos, y las líneas de financiamiento que apliquen (por ejemplo, el Programa Kit 4.0).\n- Informe escrito, tablero de indicadores y presentación al directorio.\n\nPara pymes y organizaciones de hasta 50 personas. Para estructuras más grandes, lo cotizamos a medida.\n\n## Cómo sigue\nDespués del pago te escribimos en menos de 24 horas hábiles para agendar la primera reunión.',890000,'ARS','venta',true) on conflict (slug) do nothing;
update am_productos set precio=290000, titulo='Taller de Transformación Digital · básico', bajada='Una jornada de 3 horas para hasta 5 personas de tu equipo, con autodiagnóstico de madurez digital y certificado de la ACADEMIA DEVISEBIT. Para más personas, consultanos.', descripcion=replace(descripcion, 'para hasta 15 personas de tu organización', 'para hasta 5 personas de tu organización (para equipos más grandes, lo cotizamos)') where slug='taller-transformacion-digital' and precio=390000;
update am_productos set estado='oculto' where slug='diagnostico-transformacion-digital' and precio=890000 and estado='venta';
update am_productos set estado='oculto', descripcion=replace(descripcion, chr(92)||'n', chr(10)) where slug='prueba-de-pago' and estado<>'oculto';
alter table am_productos add column if not exists precio_usd numeric;
alter table am_ordenes add column if not exists pasarela text;
update am_productos set precio=40000, precio_usd=29 where slug='guia-transformacion-digital' and precio=19900;
create table if not exists am_recursos (
  palabra text primary key, titulo text not null, url text not null, mensaje text, activo boolean not null default true,
  usos int not null default 0, emails int not null default 0, creado timestamptz not null default now()
);
insert into am_recursos(palabra,titulo,url,mensaje) values ('DIAGNOSTICO','Autodiagnóstico de madurez digital (gratis)','https://www.devisebit.com/demos/transformacion-digital.html','12 preguntas, 5 minutos: te dice en qué nivel está tu organización y por dónde empezar.') on conflict (palabra) do nothing;
insert into am_recursos(palabra,titulo,url,mensaje) values ('GUIAS','Las guías gratis de la ACADEMIA DEVISEBIT','https://academia.devisebit.com/guias','Guías prácticas y cortas de IA, automatización, WhatsApp, datos y seguridad.') on conflict (palabra) do nothing;
insert into am_recursos(palabra,titulo,url,mensaje) values ('KIT','Kit IA para pymes','https://academia.devisebit.com/productos/kit-ia-pymes',null) on conflict (palabra) do nothing;
insert into am_recursos(palabra,titulo,url,mensaje) values ('TD','Guía de Transformación Digital + bonus','https://academia.devisebit.com/productos/guia-transformacion-digital','Autodiagnóstico, hoja de ruta en 14 pasos, planilla editable y una reunión de 30 minutos sin cargo.') on conflict (palabra) do nothing;
update am_productos set bajada=replace(bajada,'Academia DEVISEBIT','ACADEMIA DEVISEBIT'), descripcion=replace(descripcion,'Academia DEVISEBIT','ACADEMIA DEVISEBIT') where slug='taller-transformacion-digital' and (bajada like '%Academia DEVISEBIT%' or descripcion like '%Academia DEVISEBIT%');
update am_productos set archivo_url='enc:private/guia-transformacion-digital.zip.enc', titulo='Guía de Transformación Digital + bonus', bajada='Guía práctica de 13 páginas en español e inglés, planilla de autodiagnóstico editable, reunión de 30 minutos sin cargo y el valor de la guía a cuenta del taller.', descripcion=E'## Qué te llevás\n- **Guía práctica de 13 páginas**, en español y en inglés: autodiagnóstico de madurez digital, cadena de valor y Canvas, hoja de ruta en 14 pasos, pilotos, gestión del cambio, indicadores y el **Programa Kit 4.0** (qué cofinancia y cómo se pide).\n- **Planilla de autodiagnóstico editable** (Excel): elegís el nivel en cada eje y te muestra tu etapa y el eje a mejorar primero. Incluye tablero de indicadores y la hoja de ruta para completar con tu equipo.\n\n## Bonus\n- **Reunión de 30 minutos sin cargo** con nuestro equipo para revisar tu autodiagnóstico.\n- **El valor de la guía queda a cuenta** si después contratás el taller o el diagnóstico.\n\n## Cómo la recibís\nPagás con Mercado Pago y te llega al instante el link de descarga por email (y en la página de confirmación). Es un archivo .zip con todo.\n\n## Para quién\nDirectores, gerentes y dueños de pymes, empresas familiares, gremios, mutuales y organismos que quieren ordenar la transformación digital con un método.\n\nElaborada por el equipo de DEVISEBIT a partir de su experiencia en proyectos y de su formación en la Diplomatura en Transformación Digital (Universidad de Belgrano).' where slug='guia-transformacion-digital' and archivo_url='enc:private/guia-transformacion-digital.enc';
alter table em_campanias add column if not exists estilo text not null default 'clasico';
alter table usuarios add column if not exists espacios text[] not null default '{comercial,academia}';
create table if not exists demo_accesos (
  id serial primary key, token text unique not null, email text not null, nombre text, demos text[] not null, blanca boolean not null default false,
  expira timestamptz not null, origen text, creado_por text, contacto_id int references db_contactos(id) on delete set null,
  visitas int not null default 0, ultima timestamptz, vistas jsonb not null default '{}'::jsonb, revocado boolean not null default false,
  creado timestamptz not null default now()
);
create index if not exists demo_accesos_email on demo_accesos(lower(email));
create table if not exists material_links (k text primary key, url text not null, actualizado timestamptz not null default now(), por text);
create table if not exists ads_diario (
  plataforma text not null, fecha date not null, campania text not null, campania_id text not null default '', gasto numeric not null default 0, moneda text not null default 'ARS',
  impresiones int not null default 0, clics int not null default 0, conversiones numeric not null default 0, actualizado timestamptz not null default now(),
  primary key (plataforma, fecha, campania_id, campania)
);
create table if not exists demo_diagnosticos (
  id serial primary key, email text not null, nombre text, organizacion text, telefono text, puntaje int, nivel text,
  dimensiones jsonb, prioridades jsonb, respuestas jsonb, marca text, origen text, contacto_id int references db_contactos(id) on delete set null,
  enviado boolean not null default false, creado timestamptz not null default now()
);
alter table em_campanias add column if not exists portada text;
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
create sequence if not exists db_recibo_seq;
alter table db_cobros add column if not exists recibo_nro int;
create unique index if not exists db_cobros_recibo on db_cobros(recibo_nro) where recibo_nro is not null;
alter table db_cobros add column if not exists factura_estado text;
alter table db_cobros add column if not exists factura_pedida_en timestamptz;
alter table db_cobros add column if not exists factura_tipo text;
alter table db_cobros add column if not exists factura_datos jsonb;
alter table db_cobros add column if not exists factura_nro text;
alter table db_cobros add column if not exists factura_url text;
alter table db_cobros add column if not exists factura_emitida_en timestamptz;
alter table db_contactos add column if not exists fact jsonb;
alter table db_contactos add column if not exists clase text;
alter table db_contactos drop constraint if exists db_contactos_clase_check;
alter table db_contactos add constraint db_contactos_clase_check check (clase is null or clase in ('cliente','oportunidad','suscriptor','alumno','aliado','descartado'));
alter table db_contactos add column if not exists clasificado_en timestamptz;
alter table db_contactos add column if not exists clasificado_por text;
create index if not exists db_contactos_clase on db_contactos(clase);
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
create table if not exists g_proveedores (
  id serial primary key,
  nombre text not null, rubro text, cuit text, condicion_iva text, contacto text, email text, telefono text, notas text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists g_movimientos (
  id serial primary key,
  tipo text not null default 'egreso' check (tipo in ('ingreso','egreso')),
  concepto text not null, categoria text, monto numeric not null, moneda text not null default 'ARS',
  estado text not null default 'pagado' check (estado in ('pagado','pendiente','anulado')),
  fecha date, vence date,
  proveedor_id int references g_proveedores(id) on delete set null,
  proyecto_id int references db_proyectos(id) on delete set null,
  medio text, comprobante text, nota text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create index if not exists g_movimientos_fecha on g_movimientos(fecha desc);
create table if not exists g_contratos (
  id serial primary key,
  titulo text not null, tipo text not null default 'cliente', contraparte text,
  contacto_id int references db_contactos(id) on delete set null,
  proyecto_id int references db_proyectos(id) on delete set null,
  estado text not null default 'borrador' check (estado in ('borrador','en_revision','firmado','vencido','rescindido')),
  inicio date, vence date, renovacion_auto boolean not null default false,
  monto numeric, moneda text not null default 'ARS', documento_url text, responsable text, notas text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists g_vencimientos (
  id serial primary key,
  titulo text not null, area text not null default 'otro', vence date not null,
  recurrencia text not null default 'unica' check (recurrencia in ('unica','mensual','anual')),
  estado text not null default 'pendiente' check (estado in ('pendiente','hecho')),
  monto numeric, responsable text, nota text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists g_documentos (
  id serial primary key,
  titulo text not null, categoria text not null default 'institucional', url text not null, version text,
  contacto_id int references db_contactos(id) on delete set null,
  proyecto_id int references db_proyectos(id) on delete set null,
  responsable text, confidencial boolean not null default false, descripcion text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists g_licitaciones (
  id serial primary key,
  objeto text not null, organismo text not null, jurisdiccion text, numero text, rubro text,
  estado text not null default 'detectada' check (estado in ('detectada','analizando','preparando','presentada','adjudicada','perdida','descartada')),
  consultas_hasta date, apertura date, monto_estimado numeric, moneda text not null default 'ARS',
  link text, responsable text, notas text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create table if not exists g_modulos (
  codigo text primary key, nombre text not null, responsable text, entregable text, orden int not null default 0,
  estado text not null default 'sin_empezar' check (estado in ('sin_empezar','en_curso','trabado','listo')),
  proximo text, fecha date, bloqueo text,
  actualizado timestamptz not null default now(), actualizado_por text
);
insert into g_modulos(codigo,nombre,responsable,entregable,orden) values
  ('m01','Dirección y coordinación','Julio + Bárbara','Tablero del lunes y resumen del viernes',1),
  ('m02','Ventas y comercial','Julio · Bárbara agenda y sigue','Propuestas enviadas, reuniones y estado de cada oportunidad',2),
  ('m03','Licitaciones públicas','Julio · Bárbara arma carpetas','Licitaciones abiertas, en preparación y presentadas',3),
  ('m04','Marketing y redes','Jime','Grilla de redes, nota del blog publicada y métricas',4),
  ('m05','Diseño y web','Jime + Jonathan','devisebit.com, casos de éxito y piezas aprobadas',5),
  ('m06','Desarrollo y producto','Jonathan','Roadmap por producto y avance de cada desarrollo',6),
  ('m07','Demos, testing y UX','Bárbara','Demo lista por producto y reporte de errores',7),
  ('m08','Bots y automatización','Julio + Jonathan','Bot de WhatsApp probado y conectado a todo',8),
  ('m09','Administración, finanzas y legal','Julio · contador y abogado validan','Cierre de mes, cobranzas y contratos revisados',9),
  ('m10','ACADEMIA DEVISEBIT','Julio + Jime','Plan de cursos y avales para certificar',10)
  on conflict (codigo) do nothing;
create table if not exists g_cache (clave text primary key, valor jsonb, actualizado timestamptz not null default now());
create table if not exists pc_ig_seguidores (dia date primary key, seguidores int not null, siguiendo int, publicaciones int, actualizado timestamptz not null default now());
create table if not exists pc_competencia (
  id serial primary key, cuenta text not null, red text not null default 'instagram', seguidores int not null,
  fecha date not null default current_date, nota text, creado_por text, creado timestamptz not null default now()
);
create index if not exists pc_competencia_cuenta on pc_competencia(lower(cuenta), fecha desc);
alter table g_documentos add column if not exists origen text not null default 'manual';
alter table g_documentos add column if not exists externo_id text;
alter table g_documentos add column if not exists ruta text;
alter table g_documentos add column if not exists mime text;
create unique index if not exists g_documentos_externo on g_documentos(externo_id) where externo_id is not null;
create table if not exists g_activos (
  id serial primary key,
  tipo text not null default 'dominio' check (tipo in ('dominio','hosting','ssl','correo','servidor','otro')),
  nombre text not null, cliente text, proveedor text,
  estado text not null default 'activo' check (estado in ('activo','a_revisar','dar_de_baja','dado_de_baja')),
  alta date, vence date, periodicidad text not null default 'anual', costo numeric, moneda text not null default 'ARS',
  se_cobra boolean not null default false, precio numeric, complementos text, notas text, externo_id text,
  creado_por text, creado timestamptz not null default now(), actualizado timestamptz not null default now()
);
create unique index if not exists g_activos_externo on g_activos(externo_id);
alter table g_movimientos add column if not exists externo_id text;
create unique index if not exists g_movimientos_externo on g_movimientos(externo_id) where externo_id is not null;
insert into g_proveedores(nombre,rubro,condicion_iva,email,notas,creado_por)
select 'Donweb','Hosting, dominios y SSL','Responsable inscripto','info@donweb.com','Cliente N.º 22783467 (Devisebit SRL). Paga con tarjeta y saldo a favor. Panel micuenta.donweb.com','donweb'
where not exists (select 1 from g_proveedores where nombre='Donweb');
insert into g_activos(tipo,nombre,cliente,proveedor,estado,alta,vence,periodicidad,costo,moneda,complementos,notas,externo_id)
select tipo,nombre,cliente,proveedor,estado,alta::date,vence::date,periodicidad,costo::numeric,moneda,complementos,notas,externo_id from (values
  ('dominio','carlosdalessandro.ar','Carlos D''Alessandro','Donweb','activo',null,'2027-04-09','anual',65000,'ARS',null,'Registro .AR','donweb:dom:carlosdalessandro.ar'),
  ('dominio','casabuena.com.ar','Residencia Casa Buena','Donweb','activo',null,'2027-07-06','anual',32000,'ARS','Seguridad Premium','Registro .COM.AR','donweb:dom:casabuena.com.ar'),
  ('dominio','casabuena.online','Residencia Casa Buena','Donweb','activo',null,'2027-07-06','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:casabuena.online'),
  ('dominio','casabuena.site','Residencia Casa Buena','Donweb','activo',null,'2027-07-06','anual',52580,'ARS',null,'Registro .SITE','donweb:dom:casabuena.site'),
  ('dominio','centrosagradocorazon.com','Centro Médico Sagrado Corazón','Donweb','activo',null,'2027-08-05','anual',63100,'ARS','Privacidad, Seguridad Premium','Registro .COM','donweb:dom:centrosagradocorazon.com'),
  ('dominio','centrosagradocorazon.online','Centro Médico Sagrado Corazón','Donweb','activo',null,'2027-08-05','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:centrosagradocorazon.online'),
  ('dominio','centrosagradocorazon.store','Centro Médico Sagrado Corazón','Donweb','activo',null,'2027-08-05','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:centrosagradocorazon.store'),
  ('dominio','clinicasangabriel.ar','Grupo San Gabriel','Donweb','activo',null,'2027-04-14','anual',67000,'ARS','Seguridad Premium','Registro .AR','donweb:dom:clinicasangabriel.ar'),
  ('dominio','clinicasangabriel.online','Grupo San Gabriel','Donweb','activo',null,'2027-04-14','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:clinicasangabriel.online'),
  ('dominio','clinicasangabriel.store','Grupo San Gabriel','Donweb','activo',null,'2027-04-14','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:clinicasangabriel.store'),
  ('dominio','clinicasangrabriel.com','Grupo San Gabriel','Donweb','activo',null,'2027-04-08','anual',46900,'ARS',null,'Registro .COM','donweb:dom:clinicasangrabriel.com'),
  ('dominio','comunidadusl.com','UTHGRA San Luis','Donweb','activo',null,'2027-06-02','anual',69600,'ARS','Seguro de renovación, Seguridad Premium, Privacidad','Registro .COM','donweb:dom:comunidadusl.com'),
  ('dominio','comunidadusl.com.ar','UTHGRA San Luis','Donweb','activo',null,'2027-06-02','anual',32000,'ARS','Seguridad Premium','Registro .COM.AR','donweb:dom:comunidadusl.com.ar'),
  ('dominio','comunidadusl.online','UTHGRA San Luis','Donweb','activo',null,'2027-06-02','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:comunidadusl.online'),
  ('dominio','comunidadusl.store','UTHGRA San Luis','Donweb','activo',null,'2027-06-02','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:comunidadusl.store'),
  ('dominio','devisebit.com','DEVISEBIT (propio)','Donweb','activo',null,'2027-07-20','anual',46900,'ARS',null,'Registro .COM','donweb:dom:devisebit.com'),
  ('dominio','devisebit.site','DEVISEBIT (propio)','Donweb','activo',null,'2027-07-13','anual',52580,'ARS',null,'Registro .SITE','donweb:dom:devisebit.site'),
  ('dominio','gruposangabriel.ar','Grupo San Gabriel','Donweb','activo',null,'2027-03-15','anual',70000,'ARS','Seguridad Premium','Registro .AR','donweb:dom:gruposangabriel.ar'),
  ('dominio','gruposangabriel.online','Grupo San Gabriel','Donweb','activo',null,'2027-03-15','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:gruposangabriel.online'),
  ('dominio','gruposangabriel.store','Grupo San Gabriel','Donweb','activo',null,'2027-03-15','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:gruposangabriel.store'),
  ('dominio','hightech.ar',null,'Donweb','activo',null,'2027-07-30','anual',70000,'ARS','Seguridad Premium','Registro .AR','donweb:dom:hightech.ar'),
  ('dominio','lasaludmentalesunderecho.com',null,'Donweb','activo',null,'2027-08-18','anual',69600,'ARS','Privacidad, Seguridad Premium, Seguro de renovación','Registro .COM','donweb:dom:lasaludmentalesunderecho.com'),
  ('dominio','lasaludmentalesunderecho.online',null,'Donweb','activo',null,'2027-08-18','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:lasaludmentalesunderecho.online'),
  ('dominio','lasaludmentalesunderecho.store',null,'Donweb','activo',null,'2027-08-18','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:lasaludmentalesunderecho.store'),
  ('dominio','mcsaludsas.com','MC SALUD SAS','Donweb','activo',null,'2027-03-15','anual',69600,'ARS','Seguro de renovación, Seguridad Premium, Privacidad','Registro .COM','donweb:dom:mcsaludsas.com'),
  ('dominio','mcsaludsas.online','MC SALUD SAS','Donweb','activo',null,'2027-03-15','anual',52580,'ARS',null,'Registro .ONLINE','donweb:dom:mcsaludsas.online'),
  ('dominio','mcsaludsas.store','MC SALUD SAS','Donweb','activo',null,'2027-03-15','anual',63320,'ARS',null,'Registro .STORE','donweb:dom:mcsaludsas.store'),
  ('dominio','sanpatricio.ar','San Patricio SRL','Donweb','activo',null,'2027-10-19','anual',67000,'ARS','Seguridad Premium','Registro .AR','donweb:dom:sanpatricio.ar'),
  ('dominio','uthgrasanluis.com','UTHGRA San Luis','Donweb','activo',null,'2027-06-07','anual',63100,'ARS','Seguridad Premium, Privacidad','Registro .COM','donweb:dom:uthgrasanluis.com'),
  ('ssl','academiasodetec.ar','Fundación SODETEC','Donweb','activo',null,'2027-04-09','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:academiasodetec.ar'),
  ('ssl','gruposangabriel.ar','Grupo San Gabriel','Donweb','activo',null,'2027-04-13','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:gruposangabriel.ar'),
  ('ssl','carlosdalessandro.ar','Carlos D''Alessandro','Donweb','activo',null,'2027-04-14','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:carlosdalessandro.ar'),
  ('ssl','clinicasangabriel.ar','Grupo San Gabriel','Donweb','activo',null,'2027-04-16','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:clinicasangabriel.ar'),
  ('ssl','uthgrasanluis.com','UTHGRA San Luis','Donweb','activo',null,'2027-06-07','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:uthgrasanluis.com'),
  ('ssl','mcsaludsas.com','MC SALUD SAS','Donweb','activo',null,'2027-06-23','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:mcsaludsas.com'),
  ('ssl','casabuena.com.ar','Residencia Casa Buena','Donweb','activo',null,'2027-07-08','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:casabuena.com.ar'),
  ('ssl','hightech.ar',null,'Donweb','activo',null,'2027-08-05','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:hightech.ar'),
  ('ssl','trasandinocomex.com.ar','Trasandino Comex','Donweb','activo',null,'2027-08-12','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:trasandinocomex.com.ar'),
  ('ssl','centrosagradocorazon.com','Centro Médico Sagrado Corazón','Donweb','activo',null,'2027-08-16','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:centrosagradocorazon.com'),
  ('ssl','sanpatricio.ar','San Patricio SRL','Donweb','activo',null,'2027-10-19','anual',36000,'ARS',null,'Certificado SSL Sectigo Positive','donweb:ssl:sanpatricio.ar'),
  ('hosting','Plan revendedor de 32 cuentas','DEVISEBIT (propio)','Donweb','activo',null,'2026-11-28','mensual',47218,'ARS',null,'31 de 32 cuentas en uso. Las cuentas de hosting están incluidas en este plan.','donweb:plan:2198211'),
  ('hosting','Cuenta de hosting: San Patricio SRL','San Patricio SRL','Donweb','activo','2026-10-22',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1260394.','donweb:host:1260394'),
  ('hosting','Cuenta de hosting: Casa Buena','Residencia Casa Buena','Donweb','activo','2026-07-06',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1234777.','donweb:host:1234777'),
  ('hosting','Cuenta de hosting: Grupo San Gabriel','Grupo San Gabriel','Donweb','activo','2026-04-11',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1213355.','donweb:host:1213355'),
  ('hosting','Cuenta de hosting: hightech.ar',null,'Donweb','activo','2025-07-30',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1150442.','donweb:host:1150442'),
  ('hosting','Cuenta de hosting: MC SALUD SAS','MC SALUD SAS','Donweb','activo','2025-05-14',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1129807.','donweb:host:1129807'),
  ('hosting','Cuenta de hosting: ACADEMIAUSL','UTHGRA San Luis','Donweb','activo','2024-04-25',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1026463.','donweb:host:1026463'),
  ('hosting','Cuenta de hosting: urobaires.com','Urobaires','Donweb','activo','2024-01-24',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 1003181.','donweb:host:1003181'),
  ('hosting','Cuenta de hosting: carlosdalessandro.ar','Carlos D''Alessandro','Donweb','activo','2023-12-18',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 995181.','donweb:host:995181'),
  ('hosting','Cuenta de hosting: Academia SODETEC','Fundación SODETEC','Donweb','activo','2023-10-10',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 976832.','donweb:host:976832'),
  ('hosting','Cuenta de hosting: sodetec','Fundación SODETEC','Donweb','activo','2023-09-12',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 968877.','donweb:host:968877'),
  ('hosting','Cuenta de hosting: DB ACADEMIA',null,'Donweb','activo','2023-09-11',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 968453.','donweb:host:968453'),
  ('hosting','Cuenta de hosting: SALA DE ESCAPE LAB','Sala de Escape Lab','Donweb','activo','2022-11-14',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 881531.','donweb:host:881531'),
  ('hosting','Cuenta de hosting: devisebit.com','DEVISEBIT (propio)','Donweb','activo','2022-07-20',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. Casillas info@devisebit.com y ppalombo@devisebit.com (IMAP c1381774.ferozo.com, puerto 993). ID 845464.','donweb:host:845464'),
  ('hosting','Cuenta de hosting: app nacelle',null,'Donweb','activo','2022-06-16',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 835334.','donweb:host:835334'),
  ('hosting','Cuenta de hosting: app trade marketing',null,'Donweb','activo','2022-06-16',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 835332.','donweb:host:835332'),
  ('hosting','Cuenta de hosting: atlas uba','UBA','Donweb','activo','2022-05-16',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 826072.','donweb:host:826072'),
  ('hosting','Cuenta de hosting: Observatorio UBA','UBA','Donweb','activo','2022-04-05',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 814294.','donweb:host:814294'),
  ('hosting','Cuenta de hosting: Incubate','UBA','Donweb','activo','2022-03-17',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 809014.','donweb:host:809014'),
  ('hosting','Cuenta de hosting: lasaludmentalesunderecho',null,'Donweb','activo','2021-12-29',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 789746.','donweb:host:789746'),
  ('hosting','Cuenta de hosting: Academia BA','GCBA','Donweb','activo','2021-07-08',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 741083.','donweb:host:741083'),
  ('hosting','Cuenta de hosting: catamarca minera','Catamarca Minera','Donweb','activo','2021-03-03',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 713766.','donweb:host:713766'),
  ('hosting','Cuenta de hosting: proyectouba','UBA','Donweb','activo','2021-02-28',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 713130.','donweb:host:713130'),
  ('hosting','Cuenta de hosting: Think Solutions','Think Solutions','Donweb','activo','2020-10-26',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 695155.','donweb:host:695155'),
  ('hosting','Cuenta de hosting: Proyecto Axion',null,'Donweb','activo','2020-09-08',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 686710.','donweb:host:686710'),
  ('hosting','Cuenta de hosting: River Play Digital','River Play Digital','Donweb','activo','2019-04-11',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 616062.','donweb:host:616062'),
  ('hosting','Cuenta de hosting: TRASANDINOCOMEX','Trasandino Comex','Donweb','activo','2019-02-11',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 609675.','donweb:host:609675'),
  ('hosting','Cuenta de hosting: Eduardo Duhalde','Eduardo Duhalde','Donweb','activo','2018-10-04',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 597080.','donweb:host:597080'),
  ('hosting','Cuenta de hosting: Carlos Brown','Carlos Brown','Donweb','activo','2018-10-04',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 597079.','donweb:host:597079'),
  ('hosting','Cuenta de hosting: El Suizo Turismo','El Suizo Turismo','Donweb','activo','2018-09-27',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 596256.','donweb:host:596256'),
  ('hosting','Cuenta de hosting: Apthgra - Uthgra','UTHGRA San Luis','Donweb','activo','2018-09-24',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 595896.','donweb:host:595896'),
  ('hosting','Cuenta de hosting: Web y Graf','DEVISEBIT (propio)','Donweb','activo','2018-09-24',null,'mensual',null,'ARS',null,'Incluida en el plan revendedor. ID 595868.','donweb:host:595868')
) v(tipo,nombre,cliente,proveedor,estado,alta,vence,periodicidad,costo,moneda,complementos,notas,externo_id)
where not exists (select 1 from config where clave='seed_donweb_2026_10')
on conflict (externo_id) do nothing;
insert into g_movimientos(tipo,concepto,categoria,monto,moneda,estado,fecha,medio,externo_id,proveedor_id,nota,creado_por)
select v.tipo,v.concepto,v.categoria,v.monto::numeric,v.moneda,v.estado,v.fecha::date,v.medio,v.externo_id,(select id from g_proveedores where nombre='Donweb' limit 1),'Importada del panel de Donweb (Pagos y facturación).','donweb' from (values
  ('egreso','Donweb · Factura A 0002-01905653','Hosting y dominios','47218','ARS','pagado','2026-10-21','Tarjeta','donweb:fc:0002-01905653'),
  ('egreso','Donweb · Factura A 0002-01904405','Hosting y dominios','2300','ARS','pagado','2026-10-19','Tarjeta','donweb:fc:0002-01904405'),
  ('egreso','Donweb · Factura A 0002-01904404','Hosting y dominios','25080','ARS','pagado','2026-10-19','Tarjeta','donweb:fc:0002-01904404'),
  ('egreso','Donweb · Factura A 0002-01904403','Hosting y dominios','29900','ARS','pagado','2026-10-19','Tarjeta','donweb:fc:0002-01904403'),
  ('egreso','Donweb · Factura A 0002-01881458','Hosting y dominios','47218','ARS','pagado','2026-09-21','Tarjeta','donweb:fc:0002-01881458'),
  ('egreso','Donweb · Factura A 0002-01855161','Hosting y dominios','47218','ARS','pagado','2026-08-21','Tarjeta','donweb:fc:0002-01855161'),
  ('egreso','Donweb · Factura A 0002-01853063','Hosting y dominios','4290','ARS','pagado','2026-08-18','Tarjeta','donweb:fc:0002-01853063'),
  ('egreso','Donweb · Factura A 0002-01853062','Hosting y dominios','2490','ARS','pagado','2026-08-18','Tarjeta','donweb:fc:0002-01853062'),
  ('egreso','Donweb · Factura A 0002-01853061','Hosting y dominios','3290','ARS','pagado','2026-08-18','Tarjeta','donweb:fc:0002-01853061'),
  ('egreso','Donweb · Factura A 0002-01853060','Hosting y dominios','16900','ARS','pagado','2026-08-18','Tarjeta','donweb:fc:0002-01853060')
) v(tipo,concepto,categoria,monto,moneda,estado,fecha,medio,externo_id)
where not exists (select 1 from config where clave='seed_donweb_2026_10')
on conflict (externo_id) where externo_id is not null do nothing;
insert into config(clave,valor) values ('seed_donweb_2026_10','ok') on conflict (clave) do nothing;
alter table em_campanias add column if not exists clave text;
create unique index if not exists em_campanias_clave on em_campanias(clave) where clave is not null;
alter table em_envios add column if not exists entregado_en timestamptz;
alter table em_envios add column if not exists rebote text;
create index if not exists em_envios_proveedor on em_envios(proveedor_id) where proveedor_id is not null;
create table if not exists em_clics (id bigserial primary key, envio_id bigint references em_envios(id) on delete cascade, campania_id int, url text not null, creado timestamptz not null default now());
create index if not exists em_clics_campania on em_clics(campania_id, creado);
insert into config(clave,valor) values ('relanzamiento_auto','esperando_dominio') on conflict (clave) do nothing;
alter table em_envios add column if not exists bot boolean not null default false;
alter table em_envios add column if not exists bot_en timestamptz;
alter table em_envios add column if not exists bot_clics int not null default 0;
create table if not exists bib_docs (id serial primary key, slug text unique not null, titulo text not null, descripcion text, confidencial boolean not null default false, orden int not null default 0, creado timestamptz not null default now());
create table if not exists bib_versiones (
  id serial primary key, doc_id int not null references bib_docs(id) on delete cascade, version int not null, notas text,
  nombre text not null, mime text not null default 'application/pdf', tamano int not null default 0, partes int not null default 0, completo boolean not null default false,
  estado text not null default 'borrador' check (estado in ('borrador','vigente','anterior')), subido_por text, creado timestamptz not null default now(), publicado timestamptz,
  unique (doc_id, version)
);
create table if not exists bib_partes (version_id int not null references bib_versiones(id) on delete cascade, n int not null, datos text not null, primary key (version_id, n));
create table if not exists bib_envios (
  id serial primary key, token text unique not null, doc_id int not null references bib_docs(id) on delete cascade, email text, nombre text,
  canal text not null default 'email', expira timestamptz not null, revocado boolean not null default false, visitas int not null default 0, descargas int not null default 0,
  ultima timestamptz, creado_por text, contacto_id int references db_contactos(id) on delete set null, creado timestamptz not null default now()
);
create index if not exists bib_envios_doc on bib_envios(doc_id, creado desc);
insert into bib_docs(slug,titulo,descripcion,confidencial,orden) values
 ('manual-general','Manual general de DEVISEBIT','Cómo funciona toda la empresa: sitios, sistemas, procesos, reglas y rutinas. Sirve para incorporar gente o para una entrega completa de la empresa. Nunca lleva usuarios ni contraseñas.',true,1),
 ('presentacion','Todo sobre DEVISEBIT','Presentación institucional: qué es la empresa, qué hace, para quién y cómo trabaja. Para contarle a quien quiera de qué se trata.',false,2),
 ('manual-coordinacion','Manual de Coordinación general','Versión del manual para el rol de Coordinación general: rutina, pendientes y plan de inducción.',true,3)
on conflict (slug) do nothing;
update bib_docs set titulo='Todo sobre DEVISEBIT · Dossier institucional', descripcion='Informe completo de 17 páginas: quiénes somos, trayectoria, servicios, productos, casos, equipo y cómo trabajamos. Para clientes que evalúan contratarnos, socios u organismos. Se comparte con link personal, no se publica.' where slug='presentacion' and titulo='Todo sobre DEVISEBIT';
insert into bib_docs(slug,titulo,descripcion,confidencial,orden) values
 ('conoce-devisebit','Conocé DEVISEBIT · Presentación corta','Versión pública en 12 placas, la misma del video de YouTube. Es la que va en LinkedIn y la que se manda para presentar la empresa en dos minutos.',false,0),
 ('ecosistema-2026','Ecosistema digital 2026','Presentación de todo lo que se armó en octubre de 2026: web, sistema, bot, landings, medición, email y redes. Uso interno: muestra cifras y herramientas propias.',true,4)
on conflict (slug) do nothing;
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
