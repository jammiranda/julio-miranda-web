import { SignJWT, jwtVerify } from "jose"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto"
import { q, one, audit } from "./db"
import { secret } from "./auth"
import { URL_SISTEMA } from "./brief"
import { aHtml, plantilla, enviarBrevo } from "./email"
import { accesoDe, config } from "./cobros"
import { notificar } from "./push"
import { URL_ACADEMIA } from "./academia"

/**
 * Portal del cliente: cada cliente entra con un link por email (sin contraseña)
 * y ve la trazabilidad de sus proyectos: fase, novedades, entregas, documentos,
 * reuniones y lo que necesita aprobar.
 */

export const FASES = [
  { v: "inicio", n: "Contratación e inicio", d: "Firmamos, armamos el equipo y el plan de trabajo." },
  { v: "relevamiento", n: "Relevamiento", d: "Entendemos tus procesos, datos y necesidades." },
  { v: "diseno", n: "Diseño", d: "Definimos pantallas, flujos y la identidad visual." },
  { v: "desarrollo", n: "Desarrollo", d: "Construimos e integramos con lo que ya usás." },
  { v: "pruebas", n: "Pruebas y ajustes", d: "Probamos juntos y corregimos antes de salir." },
  { v: "entrega", n: "Entrega y capacitación", d: "Publicamos, capacitamos y entregamos la documentación." },
  { v: "soporte", n: "Soporte y mejora continua", d: "Acompañamiento, mantenimiento y nuevas mejoras." },
] as const
export type Fase = (typeof FASES)[number]["v"]
export const faseIdx = (v: string | null | undefined) => Math.max(0, FASES.findIndex((f) => f.v === v))
export const fase = (v: string | null | undefined) => FASES[faseIdx(v)]

export const TIPOS_HITO = [
  { v: "avance", n: "Avance", i: "▲" },
  { v: "entrega", n: "Entrega", i: "★" },
  { v: "documento", n: "Documento", i: "▤" },
  { v: "reunion", n: "Reunión", i: "◷" },
  { v: "pago", n: "Pago / factura", i: "$" },
  { v: "aprobacion", n: "Para aprobar", i: "✓" },
  { v: "cliente", n: "Mensaje del cliente", i: "✉" },
  { v: "sistema", n: "Registro automático", i: "•" },
] as const
export const tipoHito = (v: string) => TIPOS_HITO.find((t) => t.v === v) ?? TIPOS_HITO[0]

export type Hito = {
  id: number; proyecto_id: number; tipo: string; titulo: string; detalle: string | null; url: string | null
  fecha: string; visible: boolean; requiere_ok: boolean; ok_en: string | null; ok_comentario: string | null; autor: string | null
}

/** Rutas del portal: si existe PORTAL_URL (p. ej. https://portal.devisebit.com) se usa ese dominio. */
export function urlPortal(path = "") {
  const base = process.env.PORTAL_URL?.replace(/\/$/, "")
  return base ? `${base}${path || "/"}` : `${URL_SISTEMA}/portal${path}`
}

// ── Sesión del cliente o alumno (separada de la del equipo) ──
// En producción la cookie vale para todo *.devisebit.com: el mismo ingreso sirve en portal y academia.
// "db_cuenta" (antes "db_cliente"): se renombró para que ninguna sesión vieja de un solo subdominio quede trabada al salir.
const COOKIE = "db_cuenta"
export type Cliente = { id: number; nombre: string; organizacion: string | null; email: string; acceso: "ok" | "bloqueado" | "deuda"; atraso: number; deuda: string }

/** En producción (cualquier *.devisebit.com) la cookie se emite para ".devisebit.com": vale en portal y academia. En localhost, sin dominio. */
export function dominioCookie() {
  const h = headers()
  const host = [h.get("x-forwarded-host"), h.get("host")].map((x) => (x ?? "").toLowerCase().split(",")[0].trim().split(":")[0]).find(Boolean) ?? ""
  return host === "devisebit.com" || host.endsWith(".devisebit.com") ? ".devisebit.com" : undefined
}

async function crearSesionCliente(contactoId: number) {
  const token = await new SignJWT({ cid: contactoId, typ: "cliente" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(await secret())
  cookies().set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, domain: dominioCookie() })
}
/** Cierra la sesión. Una sola instrucción por cookie: si se mandan dos con el mismo nombre, la segunda pisa a la primera y la sesión no se borra. */
export function cerrarSesionCliente() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0, expires: new Date(0), domain: dominioCookie() })
}

export async function clienteActual(): Promise<Cliente | null> {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  try {
    const { payload } = await jwtVerify(t, await secret())
    if (payload.typ !== "cliente") return null
    const c = await one<Omit<Cliente, "acceso" | "atraso" | "deuda">>("select id, nombre, organizacion, email from db_contactos where id=$1 and email is not null", [payload.cid])
    if (!c) return null
    const a = await accesoDe(c.id)
    return { ...c, acceso: a.estado, atraso: a.atraso, deuda: a.deuda }
  } catch { return null }
}
// ── Destino después de entrar ("volver a") ──
/**
 * Solo rutas relativas del mismo sitio: empiezan con "/" y no con "//" ni "/\\" (si no, sería una redirección abierta).
 * Sin espacios ni barras invertidas, y con un largo razonable. Si no sirve, devuelve `defecto`.
 */
export function rutaSegura(a: unknown, defecto: string) {
  const v = typeof a === "string" ? a.trim() : ""
  return v.length <= 400 && /^\/(?![\/\\])[^\s\\]*$/.test(v) ? v : defecto
}
/** Ruta que pidió el navegador (la deja el middleware en x-ruta, antes de reescribirla). */
export function rutaActual() {
  return rutaSegura(headers().get("x-ruta"), "")
}
/** Link a la pantalla de ingreso con el destino: /portal/entrar?a=/cursos/3 */
export const conDestino = (entrar: string, a?: string | null) => (a ? `${entrar}?a=${encodeURIComponent(a).replace(/%2F/g, "/")}` : entrar)

/** Lectura liviana de la sesión (solo nombre y email, sin estado de cuenta): para el header de la Academia. */
export async function sesionCuenta(): Promise<{ id: number; nombre: string; email: string } | null> {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  try {
    const { payload } = await jwtVerify(t, await secret())
    if (payload.typ !== "cliente") return null
    return await one<{ id: number; nombre: string; email: string }>("select id, nombre, email from db_contactos where id=$1 and email is not null and portal_acceso<>'bloqueado'", [payload.cid])
  } catch { return null }
}

/** Exige sesión. Con deuda vencida o bloqueo, lo manda a la pantalla de cuenta suspendida (salvo `suspendidoOk`). Al entrar, vuelve a la misma página. */
export async function requerirCliente(suspendidoOk = false): Promise<Cliente> {
  const c = await clienteActual()
  if (!c) redirect(conDestino("/portal/entrar", rutaActual()))
  if (!suspendidoOk && c.acceso !== "ok") redirect("/portal/suspendido")
  return c
}

/** Lo mismo, para el espacio del alumno en academia.devisebit.com/mi-cuenta (mismo ingreso, misma cookie). */
export async function requerirAlumno(): Promise<Cliente> {
  const c = await clienteActual()
  if (!c) redirect(conDestino("/mi-cuenta/entrar", rutaActual() || "/mi-cuenta"))
  // Con deuda o bloqueo, el estado de cuenta y los pagos viven en el portal.
  if (c.acceso !== "ok") redirect(urlPortal("/suspendido"))
  return c
}

/** Dónde se pidió el ingreso: cambia el link del email, el texto y el origen del alta automática. */
export type Sitio = "portal" | "academia"
export const SITIOS: Record<Sitio, { entrar: string; inicio: string; nombre: string }> = {
  portal: { entrar: "/portal/entrar", inicio: "/portal", nombre: "DEVISEBIT Mi cuenta" },
  academia: { entrar: "/mi-cuenta/entrar", inicio: "/mi-cuenta", nombre: "ACADEMIA DEVISEBIT" },
}
export const esSitio = (v: unknown): v is Sitio => v === "portal" || v === "academia"

// ── Links de acceso de un solo uso ──
const hash = (t: string) => createHash("sha256").update(t).digest("hex")

/** ¿El contacto tiene algo para ver? (proyecto activo, cobros o inscripción a un curso) */
export async function tienePortal(contactoId: number) {
  return !!(await one(
    `select 1 where exists (select 1 from db_proyectos where contacto_id=$1 and estado<>'cancelado')
       or exists (select 1 from am_inscripciones where contacto_id=$1 and estado<>'baja')
       or exists (select 1 from db_cobros where contacto_id=$1 and estado<>'anulado')`,
    [contactoId],
  ))
}

/** Política de ingreso: quién puede entrar. La primera es la recomendada (y la que rige si nunca se eligió otra). */
export const POLITICAS = [
  { v: "libre", n: "Ingreso libre con alta automática", d: "Entra cualquiera con su email: si no existe, se crea la cuenta y el contacto (lista «Por clasificar», origen portal) y el equipo recibe un aviso. Después se puede bloquear o quitar desde acá." },
  { v: "crm", n: "Contactos del sistema comercial", d: "Entra cualquier persona cargada en Contactos. Los emails desconocidos quedan pendientes hasta que el equipo los habilite." },
  { v: "validado", n: "Solo clientes y alumnos validados", d: "Entran quienes tienen un proyecto, cobros o un curso, o fueron habilitados a mano. El resto queda pendiente." },
  { v: "abierto", n: "Abierto sin aviso", d: "Como el ingreso libre, pero sin avisar al equipo de cada cuenta nueva." },
] as const
export const POLITICA_DEFECTO = "libre"
export const politica = async () => {
  const v = await config("portal_politica", POLITICA_DEFECTO)
  return POLITICAS.some((p) => p.v === v) ? v : POLITICA_DEFECTO
}

export type ResultadoPedido = "enviado" | "pendiente" | "bloqueado" | "limite" | "error"

// ── Límites de pedidos (por email y por IP) ──
const LIM_EMAIL = 3 // pedidos por email cada 15 minutos
const LIM_IP = 10 // pedidos por IP cada 15 minutos
const LIM_ALTAS_IP = 3 // cuentas nuevas por IP por hora

async function excedeLimite(email: string, ip: string | null) {
  const r = await one<{ e: number; i: number }>(
    `select count(*) filter (where lower(email)=$1)::int e, count(*) filter (where $2::text is not null and ip=$2)::int i
     from portal_solicitudes where creado > now() - interval '15 minutes' and (lower(email)=$1 or ($2::text is not null and ip=$2))`,
    [email, ip],
  )
  return (r?.e ?? 0) >= LIM_EMAIL || (r?.i ?? 0) >= LIM_IP
}
async function excedeAltas(ip: string | null) {
  if (!ip) return false
  const r = await one<{ n: number }>("select count(*)::int n from portal_solicitudes where ip=$1 and detalle like 'Cuenta nueva%' and creado > now() - interval '1 hour'", [ip])
  return (r?.n ?? 0) >= LIM_ALTAS_IP
}
/** IP de quien hace el pedido (Vercel la manda en x-forwarded-for). */
export function ipActual() {
  return (headers().get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || null
}

type ContactoIngreso = { id: number; nombre: string; portal_acceso: string; clase: string | null }

/**
 * Pedido de ingreso desde la pantalla única: manda por email un código de 6 dígitos y un link (sirven los dos).
 * Con la política "libre" o "abierto", si el email no existe se crea la cuenta en el momento. Queda todo registrado.
 */
export async function pedirLink(email: string, nombre?: string | null, ip: string | null = null, opc: { sitio?: Sitio; a?: string | null } = {}): Promise<{ resultado: ResultadoPedido; detalle?: string; nueva?: boolean }> {
  const sitio: Sitio = opc.sitio ?? "portal"
  const acad = sitio === "academia"
  const pol = await politica()
  let c = await one<ContactoIngreso>("select id, nombre, portal_acceso, clase from db_contactos where lower(email)=$1", [email])
  const registrar = async (resultado: ResultadoPedido, detalle?: string) => {
    await q("insert into portal_solicitudes(email, contacto_id, resultado, detalle, ip) values ($1,$2,$3,$4,$5)", [email, c?.id ?? null, resultado, detalle ?? null, ip]).catch(() => {})
    return { resultado, detalle }
  }
  if (c?.portal_acceso === "bloqueado") return registrar("bloqueado", "Acceso bloqueado a mano")
  // El límite va antes de crear nada: así nadie puede llenar Contactos ni la bandeja del equipo a fuerza de pedidos.
  if (await excedeLimite(email, ip)) return registrar("limite", "Demasiados pedidos en 15 minutos (email o IP)")
  const libre = pol === "libre" || pol === "abierto"
  let puede = false
  let nueva = false
  if (c) puede = libre || c.portal_acceso === "habilitado" || (await tienePortal(c.id)) || (pol === "crm" && !!c.clase && c.clase !== "descartado")
  if (!c && libre) {
    if (await excedeAltas(ip)) return registrar("limite", "Demasiadas cuentas nuevas desde la misma IP")
    // Lista «Por clasificar» (clase sin definir) y origen portal o academia, igual que el resto de las altas automáticas.
    c = await one<ContactoIngreso>(
      `insert into db_contactos(nombre,email,etapa,origen,fuente,categoria) values ($1,$2,'base',$3,$4,$3)
       on conflict (lower(email)) where email is not null do update set actualizado=now() returning id, nombre, portal_acceso, clase`,
      [nombre || email.split("@")[0], email, acad ? "Academia" : "Portal", acad ? "academia" : "portal"],
    )
    puede = !!c
    nueva = !!c
  }
  if (!puede) {
    const r = await registrar("pendiente", !c ? "Email que no está en Contactos" : !c.clase ? "Contacto todavía sin clasificar" : c.clase === "descartado" ? "Contacto descartado" : "Contacto sin proyecto ni curso")
    await notificar(["gerente", "coordinacion"], "🔑 Pedido de acceso al portal", `${email}${c ? ` (${c.nombre})` : " · no está en Contactos"}: validalo en Portal y accesos`, "/portal-admin").catch(() => {})
    return r
  }
  const env = await enviarAcceso(c!.id, "ingreso", { sitio, a: opc.a })
  if (!env.ok) {
    await notificar(["gerente", "coordinacion"], "⚠️ No salió el código del portal", `${email}: ${env.error}`, "/portal-admin").catch(() => {})
    return registrar("error", env.error)
  }
  if (nueva) {
    if (pol === "libre") await notificar(["gerente", "coordinacion"], acad ? "🆕 Cuenta nueva en la Academia" : "🆕 Cuenta nueva en el portal", `${email} creó su cuenta${acad ? " desde ACADEMIA DEVISEBIT" : ""} (quedó en Por clasificar). Si no corresponde, bloqueala en Portal y accesos.`, `/contactos/${c!.id}`).catch(() => {})
    return { ...(await registrar("enviado", "Cuenta nueva (alta automática)")), nueva: true }
  }
  return registrar("enviado")
}

/** El equipo habilita un pedido pendiente: crea el contacto si hace falta, lo habilita y le manda la invitación. */
export async function habilitarSolicitud(id: number, por: string) {
  const s = await one<{ email: string; contacto_id: number | null }>("select email, contacto_id from portal_solicitudes where id=$1", [id])
  if (!s) return { ok: false, error: "No existe el pedido" }
  let cid = s.contacto_id ?? (await one<{ id: number }>("select id from db_contactos where lower(email)=$1", [s.email]))?.id ?? null
  if (!cid) cid = (await one<{ id: number }>("insert into db_contactos(nombre,email,etapa,origen,fuente,categoria) values ($1,$2,'base','Portal','portal','Portal') returning id", [s.email.split("@")[0], s.email]))!.id
  await q("update db_contactos set portal_acceso='habilitado', actualizado=now() where id=$1", [cid])
  await q("update portal_solicitudes set resuelta='habilitada', resuelta_por=$1, resuelta_en=now(), contacto_id=$2 where lower(email)=lower($3) and resultado='pendiente' and resuelta is null", [por, cid, s.email])
  const r = await enviarAcceso(cid, "invitacion")
  return r.ok ? { ok: true, contacto: cid } : { ok: false, error: r.error, contacto: cid }
}

// ── Código de 6 dígitos (se guarda solo su HMAC) ──
const CODIGO_MIN = 15
const CODIGO_INTENTOS = 5
async function hashCodigo(contactoId: number, codigo: string) {
  return createHmac("sha256", Buffer.from(await secret())).update(`${contactoId}:${codigo}`).digest("hex")
}

/**
 * Crea un link de un solo uso (y un código en los ingresos). Con `sitio: "academia"` el link abre
 * academia.devisebit.com/mi-cuenta/acceso/… (la persona no sale de la Academia); `a` es el destino al entrar.
 */
export async function crearAcceso(contactoId: number, motivo: "ingreso" | "invitacion", opc: { sitio?: Sitio; a?: string | null } = {}) {
  const tok = randomBytes(32).toString("base64url")
  const horas = motivo === "invitacion" ? 24 * 7 : 1
  // El código acompaña a los pedidos de ingreso: sirve cuando el link se abre en otro navegador (celulares).
  const codigo = motivo === "ingreso" ? String(randomInt(0, 1_000_000)).padStart(6, "0") : null
  await q(
    `insert into portal_accesos(contacto_id, token_hash, expira, motivo, codigo_hash, codigo_expira)
     values ($1,$2, now() + ($3 || ' hours')::interval, $4, $5, case when $5::text is null then null else now() + ($6 || ' minutes')::interval end)`,
    [contactoId, hash(tok), String(horas), motivo, codigo ? await hashCodigo(contactoId, codigo) : null, String(CODIGO_MIN)],
  )
  const a = rutaSegura(opc.a, "")
  const url = (opc.sitio === "academia" ? `${URL_ACADEMIA.replace(/\/$/, "")}/mi-cuenta/acceso/${tok}` : urlPortal(`/acceso/${tok}`)) + (a ? `?a=${encodeURIComponent(a).replace(/%2F/g, "/")}` : "")
  return { url, horas, codigo }
}

/** Manda el acceso por email (código + link en los ingresos; link de 7 días en las invitaciones). */
export async function enviarAcceso(contactoId: number, motivo: "ingreso" | "invitacion", opc: { sitio?: Sitio; a?: string | null } = {}) {
  const c = await one<{ nombre: string; email: string | null; organizacion: string | null }>("select nombre, email, organizacion from db_contactos where id=$1", [contactoId])
  if (!c?.email) return { ok: false, error: "El contacto no tiene email cargado." }
  const { url, horas, codigo } = await crearAcceso(contactoId, motivo, opc)
  if (motivo === "ingreso" && opc.sitio === "academia") {
    const md = `# Tu código: ${codigo}\n\nHola {{nombre}}, escribí este código en la pantalla de ingreso de ACADEMIA DEVISEBIT para entrar a tus cursos, clases y certificados. Vence en ${CODIGO_MIN} minutos.\n\n**${codigo}**\n\nO, si preferís, entrá directo con este botón (vale por 1 hora):\n\n[[Entrar a mi cuenta de la Academia|${url}]]\n\nEs la misma cuenta DEVISEBIT de siempre. Si no lo pediste vos, ignorá este correo: nadie puede entrar sin este código.`
    const r = await enviarBrevo({ email: c.email, name: c.nombre }, `${codigo} es tu código para entrar a ACADEMIA DEVISEBIT`, plantilla(aHtml(md), { nombre: c.nombre, preheader: `Tu código vence en ${CODIGO_MIN} minutos` }))
    return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar el email" }
  }
  const vence = horas >= 24 ? `${horas / 24} días` : "1 hora"
  const md = motivo === "invitacion"
    ? `# Tu cuenta DEVISEBIT ya está activa\n\nHola {{nombre}}, desde hoy tenés todo en un solo lugar: tus proyectos (etapa, entregas, documentos, reuniones y aprobaciones), tu estado de cuenta y tus cursos de ACADEMIA DEVISEBIT.\n\nNo necesitás contraseña: entrás con este botón y, las próximas veces, con tu email en ${urlPortal()} (te mandamos un código).\n\n[[Entrar a mi cuenta|${url}]]\n\nEl botón vale por ${vence} y se usa una sola vez. Cualquier duda, respondé este correo o escribinos por WhatsApp.`
    : `# Tu código: ${codigo}\n\nHola {{nombre}}, escribí este código en la pantalla de ingreso de tu cuenta DEVISEBIT (proyectos, pagos y cursos de la Academia). Vence en ${CODIGO_MIN} minutos.\n\n**${codigo}**\n\nO, si preferís, entrá directo con este botón (vale por ${vence}):\n\n[[Entrar a mi cuenta|${url}]]\n\nSi no lo pediste vos, ignorá este correo: nadie puede entrar sin este código.`
  const asunto = motivo === "invitacion" ? "Tu cuenta DEVISEBIT está activa" : `${codigo} es tu código para entrar a DEVISEBIT`
  const r = await enviarBrevo({ email: c.email, name: c.nombre }, asunto, plantilla(aHtml(md), { nombre: c.nombre, preheader: motivo === "invitacion" ? "Seguí tu proyecto en un solo lugar" : `Tu código vence en ${CODIGO_MIN} minutos` }))
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar el email" }
}

export type ResultadoCodigo = "ok" | "incorrecto" | "vencido" | "agotado" | "bloqueado"

/** Valida el código de 6 dígitos del último pedido de ese email. Máximo 5 intentos por código. */
export async function usarCodigo(email: string, codigo: string): Promise<{ resultado: ResultadoCodigo; quedan?: number }> {
  const c = await one<{ id: number; portal_acceso: string }>("select id, portal_acceso from db_contactos where lower(email)=$1", [email])
  if (!c) return { resultado: "vencido" }
  if (c.portal_acceso === "bloqueado") return { resultado: "bloqueado" }
  const a = await one<{ id: number; codigo_hash: string; intentos: number; vigente: boolean }>(
    `select id, codigo_hash, intentos, (usado is null and codigo_expira > now()) vigente from portal_accesos
     where contacto_id=$1 and motivo='ingreso' and codigo_hash is not null order by creado desc limit 1`,
    [c.id],
  )
  if (!a || !a.vigente) return { resultado: "vencido" }
  if (a.intentos >= CODIGO_INTENTOS) return { resultado: "agotado" }
  const esperado = Buffer.from(a.codigo_hash, "hex")
  const recibido = Buffer.from(await hashCodigo(c.id, codigo.replace(/\D/g, "").slice(0, 6)), "hex")
  if (esperado.length !== recibido.length || !timingSafeEqual(esperado, recibido)) {
    const r = await one<{ intentos: number }>("update portal_accesos set intentos=intentos+1 where id=$1 returning intentos", [a.id])
    const quedan = CODIGO_INTENTOS - (r?.intentos ?? CODIGO_INTENTOS)
    return quedan > 0 ? { resultado: "incorrecto", quedan } : { resultado: "agotado" }
  }
  // Un solo uso: lo marcamos solo si nadie lo usó en el medio (carrera entre dos pestañas).
  const ok = await one<{ id: number }>("update portal_accesos set usado=now() where id=$1 and usado is null returning id", [a.id])
  if (!ok) return { resultado: "vencido" }
  await abrirSesion(c.id, "codigo")
  return { resultado: "ok" }
}

async function abrirSesion(contactoId: number, via: "link" | "codigo") {
  await crearSesionCliente(contactoId)
  await q("update db_contactos set portal_ultimo=now() where id=$1", [contactoId])
  await audit({ id: 0, usuario: `cliente:${contactoId}` }, "portal_ingreso", "db_contacto", contactoId, via)
}

/** Valida el token sin consumirlo (para mostrar la página de ingreso). */
export async function verAcceso(tok: string) {
  return await one<{ id: number; contacto_id: number; nombre: string }>(
    "select a.id, a.contacto_id, c.nombre from portal_accesos a join db_contactos c on c.id=a.contacto_id where a.token_hash=$1 and a.usado is null and a.expira > now()",
    [hash(tok)],
  )
}

/** Consume el token (un solo uso) y abre la sesión. */
export async function usarAcceso(tok: string) {
  const a = await one<{ contacto_id: number }>("update portal_accesos set usado=now() where token_hash=$1 and usado is null and expira > now() returning contacto_id", [hash(tok)])
  if (!a) return false
  await abrirSesion(a.contacto_id, "link")
  return true
}

/** ¿Es una cuenta recién creada, sin proyecto, curso ni cobros? (para mostrarle un Inicio de bienvenida) */
export async function esCuentaNueva(contactoId: number) {
  return !(await tienePortal(contactoId))
}

// ── Novedades del proyecto ──
export async function registrarHito(pid: number, h: { tipo: string; titulo: string; detalle?: string | null; url?: string | null; fecha?: string | null; visible?: boolean; requiere_ok?: boolean; autor?: string | null }) {
  return await one<{ id: number }>(
    "insert into db_hitos(proyecto_id,tipo,titulo,detalle,url,fecha,visible,requiere_ok,autor) values ($1,$2,$3,$4,$5,coalesce($6::timestamptz, now()),$7,$8,$9) returning id",
    [pid, h.tipo, h.titulo.slice(0, 200), h.detalle ?? null, h.url ?? null, h.fecha && h.fecha.length === 10 ? `${h.fecha}T12:00:00-03:00` : h.fecha ?? null, h.visible ?? true, h.requiere_ok ?? false, h.autor ?? null],
  )
}

/** Avisa al cliente por email de una novedad (con link directo al proyecto en el portal). */
export async function avisarNovedad(pid: number, hito: { titulo: string; detalle?: string | null; requiere_ok?: boolean }) {
  const p = await one<{ nombre: string; contacto_id: number | null }>("select nombre, contacto_id from db_proyectos where id=$1", [pid])
  if (!p?.contacto_id) return { ok: false, error: "El proyecto no tiene cliente asignado." }
  const c = await one<{ nombre: string; email: string | null }>("select nombre, email from db_contactos where id=$1", [p.contacto_id])
  if (!c?.email) return { ok: false, error: "El cliente no tiene email cargado." }
  const { url: acceso } = await crearAcceso(p.contacto_id, "invitacion")
  const url = `${acceso}?ir=${encodeURIComponent(`/portal/p/${pid}`)}`
  const md = `# ${hito.requiere_ok ? "Necesitamos tu aprobación" : "Novedad en tu proyecto"}\n\nHola {{nombre}}, hay una novedad en **${p.nombre}**:\n\n**${hito.titulo}**${hito.detalle ? `\n\n${hito.detalle.slice(0, 600)}` : ""}\n\n[[${hito.requiere_ok ? "Revisar y aprobar" : "Ver en mi portal"}|${url}]]\n\nTodo el historial del proyecto queda guardado en tu portal.`
  const r = await enviarBrevo({ email: c.email, name: c.nombre }, `${hito.requiere_ok ? "Para aprobar" : "Novedad"} · ${p.nombre}`, plantilla(aHtml(md), { nombre: c.nombre, preheader: hito.titulo }))
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "No se pudo enviar" }
}

/** Proyectos que puede ver el cliente (solo los suyos). */
export async function proyectosDe(cid: number) {
  return await q<any>(
    `select p.id, p.nombre, p.estado, p.fase, p.inicio, p.entrega, p.responsable, p.trello_board, p.actualizado, s.nombre servicio,
       (select count(*)::int from db_hitos h where h.proyecto_id=p.id and h.visible and h.requiere_ok and h.ok_en is null) pendientes,
       (select max(h.fecha) from db_hitos h where h.proyecto_id=p.id and h.visible) ultima
     from db_proyectos p left join db_servicios s on s.id=p.servicio_id
     where p.contacto_id=$1 and p.estado<>'cancelado' order by p.estado='terminado', p.actualizado desc`,
    [cid],
  )
}
export async function proyectoDe(cid: number, pid: number) {
  return await one<any>(
    `select p.*, s.nombre servicio from db_proyectos p left join db_servicios s on s.id=p.servicio_id where p.id=$1 and p.contacto_id=$2 and p.estado<>'cancelado'`,
    [pid, cid],
  )
}
