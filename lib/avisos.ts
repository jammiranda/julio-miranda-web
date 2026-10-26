import { one, q } from "./db"
import type { Usuario } from "./auth"
import { hoyISO } from "./util"

export type Aviso = { clave: string; t: string; d: string; href: string; nivel: "alta" | "media"; n: number; leido?: boolean }

/** Avisos importantes: lo que hay que mirar hoy. */
async function calcular(u: Usuario): Promise<Aviso[]> {
  const out: Aviso[] = []
  if (u.rol === "consulta") return out
  try {
    const c = await one<{ humano: number; nuevas: number; demoradas: number }>(
      `select count(*) filter (where necesita_humano and estado <> 'descartada')::int humano,
              count(*) filter (where estado='nueva')::int nuevas,
              count(*) filter (where estado='nueva' and creado < now() - interval '4 hours')::int demoradas
       from consultas`,
    )
    if (c?.humano) out.push({ clave: "humano", t: "Piden hablar con una persona", d: "Conversaciones esperando respuesta del equipo", href: "/consultas?v=bandeja", nivel: "alta", n: c.humano })
    if (c?.demoradas) out.push({ clave: "demoradas", t: "Consultas sin atender hace más de 4 h", d: "Respondelas antes de que se enfríen", href: "/consultas?v=bandeja", nivel: "alta", n: c.demoradas })
    else if (c?.nuevas) out.push({ clave: "nuevas", t: "Consultas nuevas", d: "Entraron y todavía nadie respondió", href: "/consultas?v=bandeja", nivel: "media", n: c.nuevas })
    const px = await one<{ n: number }>("select count(*)::int n from db_contactos where etapa not in ('ganado','perdido') and proximo_fecha <= (now() at time zone 'America/Argentina/Buenos_Aires')::date")
    if (px?.n) out.push({ clave: "seguimientos", t: "Seguimientos para hoy", d: "Contactos con próximo paso vencido o de hoy", href: "/", nivel: "media", n: px.n })
    const pr = await one<{ n: number }>("select count(*)::int n from db_proyectos where estado in ('planificado','en_curso') and entrega < (now() at time zone 'America/Argentina/Buenos_Aires')::date")
    if (pr?.n) out.push({ clave: "entregas", t: "Proyectos con entrega vencida", d: "Revisá fechas o estado", href: "/proyectos", nivel: "alta", n: pr.n })
    const rh = await one<{ n: number }>("select count(*)::int n from db_reuniones where estado='confirmada' and inicio between now() and now() + interval '24 hours'")
    if (rh?.n) out.push({ clave: "reuniones", t: "Reuniones en las próximas 24 h", d: "Revisá el brief y la propuesta antes de entrar", href: "/", nivel: "alta", n: rh.n })
  } catch {}
  return out
}

/**
 * Avisos del usuario, aplicando lo que marcó como leído o borró.
 * Una marca vale para el día y mientras la cantidad no crezca: si entra algo nuevo, el aviso vuelve.
 * Los leídos se siguen viendo (atenuados) pero no suman al contador; los borrados no se muestran.
 */
export async function avisos(u: Usuario): Promise<Aviso[]> {
  const todos = await calcular(u)
  if (!todos.length) return todos
  const marcas = await q<{ clave: string; estado: string; n: number; dia: string }>(
    "select clave, estado, n, to_char(dia,'YYYY-MM-DD') dia from avisos_estado where usuario_id=$1", [u.id],
  ).catch(() => [])
  const hoy = hoyISO()
  const out: Aviso[] = []
  for (const a of todos) {
    const m = marcas.find((x) => x.clave === a.clave)
    const vigente = m && m.dia === hoy && a.n <= m.n
    if (vigente && m!.estado === "borrado") continue
    out.push(vigente ? { ...a, leido: true } : a)
  }
  return out
}

/** Marca uno o todos los avisos como leídos o borrados. */
export async function marcarAvisos(u: Usuario, estado: "leido" | "borrado", clave?: string) {
  const lista = (await calcular(u)).filter((a) => !clave || a.clave === clave)
  const hoy = hoyISO()
  for (const a of lista) {
    await q(
      `insert into avisos_estado(usuario_id, clave, estado, n, dia) values ($1,$2,$3,$4,$5)
       on conflict (usuario_id, clave) do update set estado=excluded.estado, n=excluded.n, dia=excluded.dia`,
      [u.id, a.clave, estado, a.n, hoy],
    )
  }
}

/** Vuelve a mostrar todos los avisos del día. */
export async function restaurarAvisos(u: Usuario) {
  await q("delete from avisos_estado where usuario_id=$1", [u.id])
}
