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
  pass_hash text,
  invite_token text,
  invite_expira timestamptz,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create table if not exists profesionales (
  id serial primary key,
  nombre text not null,
  especialidad text not null,
  matricula text, telefono text, localidad text,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create table if not exists pacientes (
  id serial primary key,
  apellido_nombre text not null,
  dni text, nro_afiliado text,
  obra_social text not null default 'PAMI',
  fecha_nac date, domicilio text, localidad text, telefono text,
  contacto_familiar text, tel_familiar text,
  diagnostico text, medico_cabecera text,
  estado text not null default 'activo' check (estado in ('activo','alta','fallecido','suspendido')),
  notas text,
  creado timestamptz not null default now()
);
create table if not exists ordenes (
  id serial primary key,
  paciente_id int not null references pacientes(id) on delete cascade,
  nro_op text, modulo text not null,
  fecha_inicio date not null, fecha_vencimiento date,
  estado text not null default 'vigente' check (estado in ('vigente','vencida','renovada','baja')),
  enf_mes int default 0, kin_mes int default 0, med_mes int default 1,
  notas text,
  creado timestamptz not null default now()
);
create table if not exists visitas (
  id serial primary key,
  paciente_id int not null references pacientes(id) on delete cascade,
  profesional_id int references profesionales(id),
  fecha date not null,
  tipo text not null check (tipo in ('enfermeria','kinesiologia','medico','fonoaudiologia','cuidador')),
  estado text not null default 'programada' check (estado in ('programada','realizada','no_realizada')),
  app_pami boolean not null default false,
  ta text, fc text, temp text, sat text,
  evolucion text,
  creado_por int references usuarios(id),
  creado timestamptz not null default now()
);
create index if not exists visitas_fecha on visitas(fecha);
create index if not exists visitas_pac on visitas(paciente_id);
create table if not exists equipamiento (
  id serial primary key,
  paciente_id int not null references pacientes(id) on delete cascade,
  item text not null, fecha_entrega date, fecha_retiro date,
  creado timestamptz not null default now()
);
create table if not exists cierres (
  periodo text primary key,
  factura_real numeric, cobra_en text, notas text,
  cerrado boolean not null default false,
  actualizado timestamptz not null default now()
);
create table if not exists tarifas (
  clave text primary key,
  valor numeric not null
);
insert into tarifas(clave, valor) values ('enfermeria',6500),('kinesiologia',8500),('medico',19500),('fonoaudiologia',8500),('cuidador',6500)
  on conflict do nothing;
create table if not exists historico (
  periodo text primary key,
  padron int, facturacion numeric, enf int, kin int, med int, cobra_en text
);
insert into historico(periodo,padron,facturacion,enf,kin,med,cobra_en) values ('2026-09',65,20000000,703,165,61,'Diciembre 2026')
  on conflict do nothing;
create table if not exists carga_mensual (
  periodo text not null,
  paciente_id int not null references pacientes(id) on delete cascade,
  modulo text,
  enf int not null default 0, kin int not null default 0, med int not null default 0,
  fono int not null default 0, cuidador int not null default 0, insumos int not null default 0,
  equipos text, estado_obs text,
  origen text, importado timestamptz not null default now(),
  primary key (periodo, paciente_id)
);
create table if not exists consultas (
  id serial primary key,
  creado timestamptz not null default now(),
  canal text not null default 'whatsapp',
  nombre text, telefono text, paciente_nombre text,
  obra_social text, nro_afiliado text, localidad text,
  motivo text, mensaje text,
  estado text not null default 'nueva' check (estado in ('nueva','contactada','evaluacion','ingreso','descartada')),
  asignado text, notas text,
  paciente_id int references pacientes(id),
  actualizado timestamptz not null default now()
);
alter table cierres add column if not exists fecha_factura date;
update historico set cobra_en='Octubre 2026 (del 22 al 25)' where periodo='2026-09' and cobra_en='Diciembre 2026';
alter table usuarios add column if not exists email text;
alter table usuarios add column if not exists telefono text;
alter table usuarios add column if not exists foto text;
alter table pacientes add column if not exists antecedentes text;
alter table pacientes add column if not exists alergias text;
alter table pacientes add column if not exists medicacion text;
create table if not exists hc_registros (
  id serial primary key,
  paciente_id int not null references pacientes(id) on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in ('ingreso','evolucion','indicacion','estudio','interconsulta','epicrisis','nota')),
  profesional text,
  texto text not null,
  creado_por int references usuarios(id),
  creado_por_nombre text,
  creado timestamptz not null default now(),
  anulado boolean not null default false,
  anulado_motivo text
);
create index if not exists hc_pac on hc_registros(paciente_id, fecha desc);
create table if not exists adjuntos (
  id serial primary key,
  paciente_id int not null references pacientes(id) on delete cascade,
  hc_id int references hc_registros(id),
  nombre text, mime text, tam int,
  datos bytea not null,
  creado_por_nombre text,
  creado timestamptz not null default now()
);
alter table consultas add column if not exists empresa text not null default 'sanpatricio';
alter table consultas add column if not exists organizacion text;
alter table consultas add column if not exists email text;
alter table consultas add column if not exists necesita_humano boolean not null default false;
create table if not exists wa_chats (
  empresa text not null,
  wa_id text not null,
  nombre text,
  consulta_id int references consultas(id),
  bot_pausado_hasta timestamptz,
  ultimo_entrante timestamptz,
  actualizado timestamptz not null default now(),
  primary key (empresa, wa_id)
);
alter table wa_chats add column if not exists estado jsonb not null default '{}'::jsonb;
alter table wa_chats add column if not exists pausa_motivo text;
create table if not exists wa_mensajes (
  id bigserial primary key,
  empresa text not null,
  wa_id text not null,
  autor text not null check (autor in ('cliente','bot','equipo')),
  texto text,
  tipo text not null default 'text',
  meta_id text,
  autor_nombre text,
  creado timestamptz not null default now()
);
create index if not exists wa_mensajes_chat on wa_mensajes(empresa, wa_id, creado);
create table if not exists bot_conocimiento (
  id serial primary key,
  empresa text not null,
  pregunta text,
  respuesta text not null,
  activo boolean not null default true,
  origen text not null default 'manual',
  creado_por text,
  creado timestamptz not null default now()
);
create table if not exists auditoria (
  id bigserial primary key,
  usuario_id int, usuario text,
  accion text not null, entidad text, entidad_id text, detalle text,
  ts timestamptz not null default now()
);
insert into usuarios(usuario,nombre,rol) values ('julio','Julio Miranda','gerente'),('debora','Débora','coordinacion'),('luciano','Luciano','consulta')
  on conflict do nothing;
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
