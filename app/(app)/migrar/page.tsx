import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const EST: Record<string, string> = { nueva: "nueva", contactada: "contactada", evaluacion: "calificada", ingreso: "convertida", descartada: "descartada" }

/** Importa una sola vez lo que DEVISEBIT tenía guardado en el sistema anterior (archivo JSON exportado desde allá). */
async function importar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const f = fd.get("archivo") as File | null
  if (!f || !f.size) redirect("/migrar?e=archivo")
  let d: any
  try { d = JSON.parse(await f!.text()) } catch { redirect("/migrar?e=json") }
  const mapa = new Map<number, number>()
  let n = { consultas: 0, chats: 0, mensajes: 0, conocimiento: 0, contactos: 0, proyectos: 0 }
  for (const c of d.consultas ?? []) {
    if (await one("select 1 from consultas where chat_id is not distinct from $1 and creado=$2", [c.chat_id, c.creado])) continue
    const r = await one<{ id: number }>(
      `insert into consultas(creado,canal,nombre,telefono,organizacion,email,motivo,mensaje,estado,asignado,notas,necesita_humano,chat_id,actualizado)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
      [c.creado, c.canal ?? "whatsapp", c.nombre, c.telefono, c.organizacion, c.email, c.motivo, c.mensaje, EST[c.estado] ?? "nueva", c.asignado, c.notas, !!c.necesita_humano, c.chat_id, c.actualizado ?? c.creado],
    )
    mapa.set(c.id, r!.id); n.consultas++
  }
  for (const w of d.wa_chats ?? []) {
    await q(
      `insert into wa_chats(empresa,wa_id,nombre,consulta_id,bot_pausado_hasta,pausa_motivo,estado,ultimo_entrante,actualizado) values ('devisebit',$1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (empresa,wa_id) do nothing`,
      [w.wa_id, w.nombre, w.consulta_id ? mapa.get(w.consulta_id) ?? null : null, w.bot_pausado_hasta, w.pausa_motivo, JSON.stringify(w.estado ?? {}), w.ultimo_entrante, w.actualizado],
    ); n.chats++
  }
  for (const m of d.wa_mensajes ?? []) {
    if (m.meta_id && (await one("select 1 from wa_mensajes where meta_id=$1", [m.meta_id]))) continue
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,meta_id,autor_nombre,creado) values ('devisebit',$1,$2,$3,$4,$5,$6,$7)", [m.wa_id, m.autor, m.texto, m.tipo ?? "text", m.meta_id, m.autor_nombre, m.creado])
    n.mensajes++
  }
  for (const k of d.bot_conocimiento ?? []) {
    if (await one("select 1 from bot_conocimiento where respuesta=$1", [k.respuesta])) continue
    await q("insert into bot_conocimiento(empresa,pregunta,respuesta,activo,origen,creado_por,creado) values ('devisebit',$1,$2,$3,$4,$5,$6)", [k.pregunta, k.respuesta, k.activo, k.origen ?? "manual", k.creado_por, k.creado])
    n.conocimiento++
  }
  const mc = new Map<number, number>()
  for (const c of d.db_contactos ?? []) {
    const r = await one<{ id: number }>(
      `insert into db_contactos(nombre,organizacion,cargo,email,telefono,sector,etapa,origen,consulta_id,notas,proximo,proximo_fecha,creado,actualizado)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
      [c.nombre, c.organizacion, c.cargo, c.email, c.telefono, c.sector, c.etapa, c.origen, c.consulta_id ? mapa.get(c.consulta_id) ?? null : null, c.notas, c.proximo, c.proximo_fecha, c.creado, c.actualizado],
    )
    mc.set(c.id, r!.id); n.contactos++
  }
  for (const p of d.db_proyectos ?? []) {
    const s = p.servicio ? await one<{ id: number }>("select id from db_servicios where nombre=$1", [p.servicio]) : null
    await q(
      `insert into db_proyectos(nombre,contacto_id,servicio_id,estado,inicio,entrega,monto,responsable,trello_board,trello_url,notas,creado)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.nombre, p.contacto_id ? mc.get(p.contacto_id) ?? null : null, s?.id ?? null, p.estado, p.inicio, p.entrega, p.monto, p.responsable, p.trello_board, p.trello_url, p.notas, p.creado],
    ); n.proyectos++
  }
  if (d.bot_modo) await q("insert into config(clave,valor) values ('bot_modo_devisebit',$1) on conflict (clave) do update set valor=excluded.valor", [d.bot_modo])
  await audit(u, "migracion", "sistema", undefined, JSON.stringify(n))
  redirect(`/migrar?ok=${encodeURIComponent(JSON.stringify(n))}`)
}

export default async function Migrar({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  await requerir(["gerente"])
  const ok = searchParams.ok ? JSON.parse(searchParams.ok) : null
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div><h1 className="m-0">Traer datos del sistema anterior</h1><p className="m-0 text-sm text-[#4A515C]">Se usa una sola vez: subí el archivo de DEVISEBIT exportado del sistema anterior. Si lo subís dos veces, no duplica conversaciones ni mensajes.</p></div>
      {ok && <p role="status" className="m-0 card text-sm text-emerald-700">Listo: {ok.consultas} conversaciones, {ok.mensajes} mensajes, {ok.chats} chats, {ok.conocimiento} respuestas del bot, {ok.contactos} contactos y {ok.proyectos} proyectos.</p>}
      {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.e === "json" ? "El archivo no es válido." : "Elegí el archivo."}</p>}
      <form action={importar} className="card flex flex-col gap-3">
        <input type="file" name="archivo" accept="application/json,.json" required className="inp" />
        <div><button className="btn-p">Importar</button></div>
      </form>
    </div>
  )
}
