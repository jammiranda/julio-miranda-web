import { SignJWT, jwtVerify } from "jose"
import { randomBytes } from "crypto"
import { q, one, audit } from "./db"
import { secret } from "./auth"
import { URL_SISTEMA } from "./brief"
import { enviarBrevo, EXCLUIDOS_SQL } from "./email"
import { emailConEstilo } from "./email-estilos"
import { notificar } from "./push"
import { crearCuenta, urlPortal } from "./portal"
import { consultaYContacto } from "./demos"
import {
  type Nivel, type Respuestas, type Resultado, type Resultado1, type Resultado2, type Resultado3,
  calcular, validarRespuestas, nivelInfo, urlNivel, rubroValido, programasPara, PROGRAMAS, URL_CURSOS, TEXTO_INSIGNIA, urlInsignia, DIMS1, VERSION,
} from "./diagnosticos-datos"

/**
 * Autodiagnósticos en 3 niveles (la web los muestra en www.devisebit.com/diagnostico).
 * Acá se guardan, se recalculan los puntajes (no se confía en lo que manda el navegador),
 * se suma el contacto al CRM, se manda el informe por email con el link firmado al nivel siguiente,
 * se emite la insignia al completar los tres y se hace el seguimiento a los 3 días.
 */

export const NIVEL_TAG = (n: number) => `diagnostico-nivel-${n}`
export const AGENDA = `${URL_SISTEMA}/agendar`
export const CONTACTO_WEB = "https://www.devisebit.com/contacto"
/** Mínimo de organizaciones reales para mostrar una comparación (regla de Julio: nada de promedios inventados). */
export const MIN_COMPARACION = 20

// ── Link firmado (sin contraseña) ──
// Identifica al contacto; qué nivel puede hacer lo decide la base (terminó el anterior o no).
export async function firmarToken(contactoId: number) {
  return await new SignJWT({ typ: "diag", cid: contactoId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("90d").sign(await secret())
}
export async function leerToken(t: string | null | undefined): Promise<number | null> {
  if (!t || t.length > 600) return null
  try {
    const { payload } = await jwtVerify(t, await secret())
    return payload.typ === "diag" && typeof payload.cid === "number" ? payload.cid : null
  } catch { return null }
}

export const enmascarar = (e: string) => { const [u, d] = e.split("@"); return `${u.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d}` }

export type Fila = { id: number; nivel: Nivel; contacto_id: number; email: string; nombre: string; organizacion: string | null; rubro: string | null; puntaje: number; etiqueta: string; resultado: Resultado; creado: string; recordatorio: boolean; enviado: boolean }

/** Último resultado de cada nivel del contacto. */
export async function nivelesDe(contactoId: number): Promise<Fila[]> {
  return await q<Fila>("select distinct on (nivel) id, nivel, contacto_id, email, nombre, organizacion, rubro, puntaje, etiqueta, resultado, creado, recordatorio, enviado from diag_respuestas where contacto_id=$1 order by nivel, creado desc", [contactoId])
}
export const puedeHacer = (hechos: Fila[], nivel: Nivel) => nivel === 1 || hechos.some((h) => h.nivel === nivel - 1)

export async function insigniaDe(contactoId: number) {
  return await one<{ codigo: string; emitido: string }>("select codigo, emitido from diag_insignias where contacto_id=$1 and not anulado", [contactoId])
}

/** Perfil para la web: con link firmado o sesión del portal. No devuelve el email completo. */
export async function perfil(contactoId: number) {
  const c = await one<{ id: number; nombre: string; organizacion: string | null; email: string; sector: string | null }>("select id, nombre, organizacion, email, sector from db_contactos where id=$1 and email is not null", [contactoId])
  if (!c) return null
  const hechos = await nivelesDe(c.id)
  const ultimo = hechos[hechos.length - 1]
  const ins = await insigniaDe(c.id)
  return {
    nombre: c.nombre, organizacion: ultimo?.organizacion ?? c.organizacion, rubro: ultimo?.rubro ?? rubroValido(c.sector), email: enmascarar(c.email),
    acepto: hechos.length > 0,
    completados: hechos.map((h) => ({ nivel: h.nivel, puntaje: h.puntaje, etiqueta: h.etiqueta, fecha: h.creado })),
    token: await firmarToken(c.id),
    insignia: ins ? { codigo: ins.codigo, url: urlInsignia(ins.codigo) } : null,
  }
}

/** Promedio real por dimensión del nivel 1, solo si hay al menos MIN_COMPARACION organizaciones distintas. */
export async function comparacion1() {
  const r = await one<{ n: number; prom: Record<string, number> | null }>(
    `with u as (select distinct on (contacto_id) resultado from diag_respuestas where nivel=1 order by contacto_id, creado desc)
     select count(*)::int n, (select jsonb_object_agg(k, round(v)) from (select d->>'k' k, avg((d->>'puntaje')::numeric) v from u, jsonb_array_elements(u.resultado->'dimensiones') d group by 1) x) prom from u`,
  ).catch(() => null)
  return r && r.n >= MIN_COMPARACION && r.prom ? { organizaciones: r.n, dimensiones: r.prom } : null
}

// ── Guardado ──
export type Entrada = {
  nivel: Nivel; respuestas: Respuestas; contactoId: number | null
  nombre?: string | null; email?: string | null; organizacion?: string | null; telefono?: string | null; rubro?: string | null
  recordatorio?: boolean; origen?: string | null; ip?: string | null
}

export async function guardar(e: Entrada) {
  const err = validarRespuestas(e.nivel, e.respuestas)
  if (err) return { ok: false as const, error: err, status: 400 }

  // 1. Contacto: el mismo alta automática que usa el portal (así después ve todo en Mi cuenta)
  let cid = e.contactoId
  let nueva = false
  if (!cid) {
    if (!e.email || !e.nombre) return { ok: false as const, error: "Faltan tu nombre y tu email.", status: 400 }
    const r = await crearCuenta(e.email, e.nombre, { origen: "Autodiagnóstico", fuente: "autodiagnostico", categoria: "Autodiagnóstico" })
    if (!r) return { ok: false as const, error: "No pudimos guardar tus datos. Probá de nuevo.", status: 500 }
    cid = r.id; nueva = r.nueva
  }
  const c = await one<{ id: number; nombre: string; email: string; organizacion: string | null; sector: string | null; email_token: string | null }>("select id, nombre, email, organizacion, sector, email_token from db_contactos where id=$1", [cid])
  if (!c?.email) return { ok: false as const, error: "No encontramos tu cuenta. Empezá por el nivel 1.", status: 404 }

  const hechos = await nivelesDe(c.id)
  if (!puedeHacer(hechos, e.nivel)) return { ok: false as const, error: `Primero completá el nivel ${e.nivel - 1}.`, status: 403 }
  const previo = hechos[hechos.length - 1]
  const organizacion = e.organizacion || previo?.organizacion || c.organizacion || null
  const rubro = rubroValido(e.rubro) ?? previo?.rubro ?? rubroValido(c.sector)
  const nombre = previo?.nombre ?? e.nombre ?? c.nombre

  // 2. Puntajes recalculados en el servidor
  const resultado = calcular(e.nivel, e.respuestas, rubro)
  const info = nivelInfo(e.nivel)
  const fila = await one<{ id: number }>(
    `insert into diag_respuestas(nivel, contacto_id, email, nombre, organizacion, rubro, telefono, respuestas, resultado, puntaje, etiqueta, version, origen, ip, recordatorio)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
    [e.nivel, c.id, c.email, nombre, organizacion, rubro, e.telefono ?? null, JSON.stringify(e.respuestas), JSON.stringify(resultado), resultado.puntaje, resultado.etiqueta, VERSION, e.origen ?? null, e.ip ?? null, !!e.recordatorio || hechos.some((h) => h.recordatorio)],
  )

  // 3. CRM: origen autodiagnóstico, etiqueta del nivel, sector y organización si faltaban
  await q(
    `update db_contactos set tags=(select array(select distinct unnest(coalesce(tags,'{}') || array['autodiagnostico',$2::text]))),
       organizacion=coalesce(organizacion,$3), telefono=coalesce(telefono,$4), sector=coalesce(sector,$5), origen=coalesce(origen,'Autodiagnóstico'),
       fuente=coalesce(fuente,'autodiagnostico'), clase=coalesce(clase,'oportunidad'), etapa=case when etapa='base' then 'nuevo' else etapa end, actualizado=now() where id=$1`,
    [c.id, NIVEL_TAG(e.nivel), organizacion, e.telefono ?? null, rubro],
  )
  let consultaId: number | null = null
  if (e.nivel === 1 || e.nivel === 3) {
    // Entra a la bandeja del equipo como el resto de las consultas web (avisos de "consultas nuevas")
    const r = await consultaYContacto({ nombre, email: c.email, organizacion, telefono: e.telefono ?? null, motivo: `Autodiagnóstico ${info.corto.toLowerCase()} · ${info.titulo}`, mensaje: resumen(resultado), fuente: "Web (autodiagnóstico)" }).catch(() => null)
    consultaId = r?.consultaId ?? null
  }
  if (e.nivel === 3) {
    // Completó la escalera: oportunidad caliente (etiqueta + próximo paso para hoy, que dispara el aviso de seguimientos)
    await q(
      `update db_contactos set tags=(select array(select distinct unnest(tags || array['oportunidad-caliente']::text[]))), clase='oportunidad',
         etapa=case when etapa in ('base','nuevo') then 'nuevo' else etapa end,
         proximo='Llamar: completó los 3 autodiagnósticos (ofrecer la devolución de 30 min)', proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date, actualizado=now() where id=$1`,
      [c.id],
    )
  }
  await q("insert into am_eventos(contacto_id, tipo, ref) values ($1,'autodiagnostico',$2)", [c.id, `nivel-${e.nivel}`]).catch(() => {})
  await audit({ id: 0, usuario: "web" }, "autodiagnostico", "diag_respuesta", fila!.id, `nivel ${e.nivel} · ${resultado.puntaje} ${resultado.etiqueta}`)

  // 4. Insignia al completar los tres
  let insignia: { codigo: string; url: string } | null = null
  const completos = new Set([...hechos.map((h) => h.nivel), e.nivel])
  if (completos.has(1) && completos.has(2) && completos.has(3)) insignia = await emitirInsignia(c.id, organizacion ?? nombre, nombre)

  // 5. Link firmado al siguiente nivel, informe por email y aviso al equipo
  const token = await firmarToken(c.id)
  const siguiente = e.nivel < 3 ? urlNivel(e.nivel + 1, token) : null
  const r1 = e.nivel === 1 ? (resultado as Resultado1) : (hechos.find((h) => h.nivel === 1)?.resultado as Resultado1 | undefined)
  const r3 = e.nivel === 3 ? (resultado as Resultado3) : null
  const programas = insignia ? programasPara({ puntaje1: r1?.puntaje ?? null, r3, rubro }) : []
  const env = await enviarInforme({ nombre, email: c.email, organizacion, emailToken: c.email_token }, resultado, { siguiente, insignia, programas: programas.map((p) => p.nombre) })
  await q("update diag_respuestas set enviado=$1 where id=$2", [env.ok, fila!.id])
  const quien = `${nombre}${organizacion ? ` (${organizacion})` : ""}`
  await notificar(["gerente", "coordinacion"], e.nivel === 3 ? "🔥 Completó los 3 autodiagnósticos" : `📊 Autodiagnóstico ${info.corto.toLowerCase()}`,
    `${quien}: ${info.titulo} · ${resultado.etiqueta} · ${resultado.puntaje}/100${e.nivel === 3 ? ". Oportunidad caliente: ofrecé la devolución de 30 minutos." : ""}`,
    consultaId ? `/consultas/${consultaId}` : `/contactos/${c.id}`).catch(() => {})

  return {
    ok: true as const, id: fila!.id, nueva, resultado, token, siguiente, enviado: env.ok, insignia,
    programas: programas.map((p) => ({ id: p.id, nombre: p.nombre, motivo: p.motivo, url: URL_CURSOS })),
    comparacion: e.nivel === 1 ? await comparacion1() : null,
  }
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const codigoInsignia = () => { const b = randomBytes(8); let s = ""; for (const x of b) s += CHARS[x % CHARS.length]; return `DD-${s.slice(0, 4)}-${s.slice(4)}` }

export async function emitirInsignia(contactoId: number, organizacion: string, nombre: string) {
  const ya = await insigniaDe(contactoId)
  if (ya) return { codigo: ya.codigo, url: urlInsignia(ya.codigo) }
  for (let i = 0; i < 5; i++) {
    const r = await one<{ codigo: string }>(
      "insert into diag_insignias(codigo, contacto_id, organizacion, nombre) values ($1,$2,$3,$4) on conflict (contacto_id) do update set anulado=false returning codigo",
      [codigoInsignia(), contactoId, organizacion, nombre],
    ).catch(() => null)
    if (r) {
      await q("update db_contactos set tags=(select array(select distinct unnest(tags || array['insignia-diagnostico']::text[]))) where id=$1", [contactoId]).catch(() => {})
      return { codigo: r.codigo, url: urlInsignia(r.codigo) }
    }
  }
  return null
}

/** Verificación pública de la insignia (la usa la página de la web). */
export async function verificarInsignia(codigo: string) {
  const cod = codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20)
  const r = await one<{ codigo: string; organizacion: string; emitido: string; anulado: boolean; contacto_id: number }>("select codigo, organizacion, emitido, anulado, contacto_id from diag_insignias where codigo=$1", [cod])
  if (!r || r.anulado) return null
  const niveles = await q<{ nivel: number; creado: string }>("select nivel, max(creado) creado from diag_respuestas where contacto_id=$1 group by nivel order by nivel", [r.contacto_id])
  return { codigo: r.codigo, organizacion: r.organizacion, emitido: r.emitido, texto: TEXTO_INSIGNIA, niveles: niveles.map((n) => ({ nivel: n.nivel, titulo: nivelInfo(n.nivel).titulo, fecha: n.creado })) }
}

/** Interés en un programa de la Academia que todavía no tiene ficha: queda en el CRM y avisa al equipo. */
export async function registrarInteres(contactoId: number, programa: string) {
  const p = PROGRAMAS.find((x) => x.id === programa)
  if (!p) return { ok: false, error: "Programa desconocido." }
  await q("update db_contactos set tags=(select array(select distinct unnest(coalesce(tags,'{}') || array['academia', $2::text]))), actualizado=now() where id=$1", [contactoId, `interes:${p.id}`])
  const ya = await one("select 1 from am_eventos where contacto_id=$1 and tipo='interes' and ref=$2", [contactoId, p.id])
  if (!ya) {
    await q("insert into am_eventos(contacto_id, tipo, ref) values ($1,'interes',$2)", [contactoId, p.id])
    const c = await one<{ nombre: string; organizacion: string | null }>("select nombre, organizacion from db_contactos where id=$1", [contactoId])
    await notificar(["gerente", "coordinacion"], "🎓 Interés en un programa", `${c?.nombre ?? "Alguien"}${c?.organizacion ? ` (${c.organizacion})` : ""}: ${p.nombre}`, `/contactos/${contactoId}`).catch(() => {})
  }
  return { ok: true }
}

// ── Informe por email ──
function resumen(r: Resultado) {
  if (r.nivel === 1) return `Madurez digital: ${r.puntaje}/100 · ${r.etiqueta}. Prioridades: ${r.acciones.map((a) => a.titulo).join("; ")}`
  if (r.nivel === 2) return `Procesos: ${r.puntaje}/100 · ${r.etiqueta}. A digitalizar: ${r.prioridades.map((p) => `${p.nombre} (${p.horas} h/mes, ${p.moduloNombre})`).join("; ")}`
  return `Automatización e IA: ${r.puntaje}/100 · ${r.etiqueta}. Primero: ${r.primero.nombre}. Canal principal: ${r.canal}`
}

function cuerpo(r: Resultado) {
  if (r.nivel === 1) {
    return `## Tu puntaje por dimensión\n\n${r.dimensiones.map((d) => `- **${d.n}:** ${d.puntaje}/100`).join("\n")}\n\n## Tus 3 acciones prioritarias\n\n${r.acciones.map((a, i) => `**${i + 1}. ${a.titulo}.** ${a.porque} Primer paso: ${a.paso} [${a.servicioNombre}](${a.servicioHref})`).join("\n\n")}`
  }
  if (r.nivel === 2) {
    const ps = r.prioridades.map((p, i) => `**${i + 1}. ${p.nombre}** (${p.area}). Hoy: ${p.respuesta.toLowerCase()}. ${p.horas ? `Nos dijiste que lleva unas **${p.horas} horas por mes**.` : "No estimaste las horas."} Lo cubre: [${p.moduloNombre}](${p.servicioHref}) — ${p.moduloDetalle}`).join("\n\n")
    return `## Los 3 procesos que más conviene digitalizar\n\n${ps || "No marcaste procesos con tareas manuales: ¡muy bien!"}\n\n${r.horasTotales ? `En total, estimaste **${r.horasTotales} horas por mes** en estas tareas repetitivas.` : ""}`
  }
  return `## Qué automatizar primero\n\n**${r.primero.nombre}.** ${r.primero.que} [Ver ${r.primero.servicioNombre}](${r.primero.servicioHref})\n\n${r.antes.length ? `## Qué hace falta antes\n\n${r.antes.map((x) => `- ${x}`).join("\n")}\n\n` : ""}## Tu hoja de ruta de 90 días\n\n${r.hojaDeRuta.map((h) => `**${h.etapa} (${h.dias}).** ${h.tareas.join(" ")}`).join("\n\n")}`
}

export async function enviarInforme(
  p: { nombre: string; email: string; organizacion: string | null; emailToken: string | null },
  r: Resultado,
  o: { siguiente: string | null; insignia: { codigo: string; url: string } | null; programas: string[] },
) {
  const info = nivelInfo(r.nivel)
  const sig = r.nivel < 3 ? nivelInfo(r.nivel + 1) : null
  const md = `# Tu resultado: ${info.titulo}\n\nHola {{nombre}}, este es el informe del autodiagnóstico ${info.corto.toLowerCase()}${p.organizacion ? ` para **${p.organizacion}**` : ""}.\n\n**${r.etiqueta} · ${r.puntaje}/100**\n\n${cuerpo(r)}\n\n---\n\n${
    sig && o.siguiente
      ? `## Seguí con el ${sig.corto.toLowerCase()}: ${sig.titulo}\n\n${sig.bajada} Te lleva unos ${sig.minutos} minutos y no tenés que volver a cargar tus datos.\n\n[[Hacer el ${sig.corto.toLowerCase()}|${o.siguiente}]]`
      : `## ¡Completaste los tres niveles!\n\n${o.insignia ? `Tu organización tiene la insignia **${TEXTO_INSIGNIA}**. Código de verificación: **${o.insignia.codigo}** ([verificala acá](${o.insignia.url})).\n\n` : ""}Te ofrecemos una **reunión de devolución de 30 minutos, sin costo**, para repasar los tres resultados y armar el plan.\n\n[[Agendar la devolución|${AGENDA}]]${o.programas.length ? `\n\nPara seguir aprendiendo, te recomendamos de la ACADEMIA DEVISEBIT: ${o.programas.map((x) => `**${x}**`).join(", ")} (próximamente: [dejá tu interés](${URL_CURSOS})).` : ""}`
  }\n\nTodos tus resultados quedan guardados en [Mi cuenta](${urlPortal("/diagnosticos")}): entrás con tu email, sin contraseña.`
  const baja = p.emailToken ? `${URL_SISTEMA}/baja/${p.emailToken}` : null
  return enviarBrevo({ email: p.email, name: p.nombre }, `Tu resultado: ${info.titulo} (${info.corto.toLowerCase()})`, emailConEstilo(md, { estilo: "clasico", nombre: p.nombre, preheader: `${r.etiqueta} · ${r.puntaje}/100`, baja }), baja)
}

// ── Seguimiento automático (cron diario) ──
/**
 * A los 3 días de terminar un nivel, si no empezó el siguiente, un recordatorio con el link.
 * Solo a quien pidió el recordatorio o aceptó comunicaciones, con el email activo (sin baja ni rebote) y fuera de las exclusiones.
 * Un solo recordatorio por nivel; no se mandan los de más de 30 días.
 */
export async function seguimientoDiagnosticos(max = 80) {
  const filas = await q<{ id: number; nivel: Nivel; contacto_id: number; nombre: string; email: string; email_token: string | null }>(
    `select d.id, d.nivel, d.contacto_id, c.nombre, c.email, c.email_token from diag_respuestas d join db_contactos c on c.id=d.contacto_id
     where d.nivel < 3 and d.seguimiento_en is null and d.creado < now() - interval '3 days' and d.creado > now() - interval '30 days'
       and (d.recordatorio or c.consentimiento='Sí') and c.email is not null and coalesce(c.email_estado,'activo')='activo' and not ${EXCLUIDOS_SQL}
       and not exists (select 1 from diag_respuestas x where x.contacto_id=d.contacto_id and x.nivel > d.nivel)
       and d.id = (select max(y.id) from diag_respuestas y where y.contacto_id=d.contacto_id and y.nivel=d.nivel)
     order by d.creado limit $1`,
    [max],
  )
  let enviados = 0
  for (const f of filas) {
    const sig = nivelInfo(f.nivel + 1)
    const link = urlNivel(f.nivel + 1, await firmarToken(f.contacto_id))
    const baja = f.email_token ? `${URL_SISTEMA}/baja/${f.email_token}` : null
    const md = `# Te falta el ${sig.corto.toLowerCase()}\n\nHola {{nombre}}, hace unos días hiciste el autodiagnóstico ${nivelInfo(f.nivel).corto.toLowerCase()}. El siguiente paso es **${sig.titulo}**: ${sig.bajada.charAt(0).toLowerCase() + sig.bajada.slice(1)}\n\nSon unos ${sig.minutos} minutos y no tenés que volver a cargar tus datos.\n\n[[Seguir con el ${sig.corto.toLowerCase()}|${link}]]\n\nSi preferís verlo con nosotros, [agendá 30 minutos sin costo](${AGENDA}).`
    const r = await enviarBrevo({ email: f.email, name: f.nombre }, `Te falta el ${sig.corto.toLowerCase()}: ${sig.titulo}`, emailConEstilo(md, { estilo: "personal", nombre: f.nombre, preheader: `${sig.minutos} minutos, sin volver a cargar tus datos`, baja }), baja)
    // Se marca aunque falle, para no insistir todos los días con un email que rebota
    await q("update diag_respuestas set seguimiento_en=now(), seguimiento_ok=$2 where id=$1", [f.id, r.ok])
    if (r.ok) enviados++
  }
  return `${enviados} recordatorios de autodiagnóstico (${filas.length} pendientes)`
}

/** Reenvía el link al nivel que le toca, a un email que ya hizo algún nivel (para quien llega sin link). */
export async function reenviarLink(email: string) {
  const c = await one<{ id: number; nombre: string; email: string; email_token: string | null }>("select id, nombre, email, email_token from db_contactos where lower(email)=$1", [email])
  if (!c) return { ok: true } // no revelamos si el email existe
  const hechos = await nivelesDe(c.id)
  if (!hechos.length) return { ok: true }
  const ya = await one<{ n: number }>("select count(*)::int n from am_eventos where contacto_id=$1 and tipo='diag-reenvio' and creado > now() - interval '1 hour'", [c.id])
  if ((ya?.n ?? 0) >= 3) return { ok: true }
  await q("insert into am_eventos(contacto_id, tipo) values ($1,'diag-reenvio')", [c.id])
  const tope = Math.max(...hechos.map((h) => h.nivel))
  const token = await firmarToken(c.id)
  const md = `# Tus autodiagnósticos\n\nHola {{nombre}}, acá tenés tu link personal.\n\n${tope < 3 ? `[[Seguir con el ${nivelInfo(tope + 1).corto.toLowerCase()}: ${nivelInfo(tope + 1).titulo}|${urlNivel(tope + 1, token)}]]` : `Ya completaste los tres niveles. [[Ver mis resultados|${urlPortal("/diagnosticos")}]]`}\n\nSi no lo pediste vos, ignorá este correo.`
  const baja = c.email_token ? `${URL_SISTEMA}/baja/${c.email_token}` : null
  await enviarBrevo({ email: c.email, name: c.nombre }, "Tu link para seguir con los autodiagnósticos", emailConEstilo(md, { estilo: "clasico", nombre: c.nombre, preheader: "Seguí donde dejaste", baja }), baja)
  return { ok: true }
}

export { DIMS1 }
