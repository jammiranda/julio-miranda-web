import { NextResponse, type NextRequest } from "next/server"
import { one } from "@/lib/db"
import { conCors, preflight, ipDe } from "@/lib/cors-web"
import { validarEmail } from "@/lib/demos"
import { clienteActual } from "@/lib/portal"
import { leerToken, perfil, guardar, registrarInteres, reenviarLink, verificarInsignia, nivelesDe } from "@/lib/diagnosticos"

export const dynamic = "force-dynamic"
export const OPTIONS = preflight

const t = (v: unknown, n = 200) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))
const json = (req: NextRequest, body: unknown, status = 200) => conCors(req, NextResponse.json(body, { status, headers: { "cache-control": "no-store" } }))

/** Quién es: link firmado (?t= en la web) o sesión de Mi cuenta. */
async function quien(token: unknown) {
  const porToken = await leerToken(t(token, 600))
  if (porToken) return porToken
  const c = await clienteActual().catch(() => null)
  return c?.acceso === "ok" ? c.id : null
}

/** Verificación pública de la insignia: GET /api/diagnosticos?insignia=CODIGO */
export async function GET(req: NextRequest) {
  const cod = req.nextUrl.searchParams.get("insignia")
  if (!cod) return json(req, { ok: false }, 400)
  const r = await verificarInsignia(cod)
  return json(req, r ? { ok: true, insignia: r } : { ok: false }, r ? 200 : 404)
}

/**
 * Autodiagnósticos de www.devisebit.com/diagnostico. Acciones:
 * - perfil   { token? }                               → datos para no volver a pedirlos y niveles hechos
 * - guardar  { nivel, respuestas, token?, nombre, email, organizacion, rubro, telefono, acepta, recordatorio }
 * - interes  { token?, programa }                     → interés en un programa de la Academia (CRM)
 * - reenviar { email }                                → manda por email el link al nivel que le toca
 */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (b.website) return json(req, { ok: true })
  const accion = String(b.accion ?? "")

  if (accion === "perfil") {
    const cid = await quien(b.token)
    return json(req, { ok: true, perfil: cid ? await perfil(cid) : null })
  }

  if (accion === "reenviar") {
    const v = await validarEmail(b.email)
    if (!v.ok) return json(req, { ok: false, error: v.error }, 400)
    await reenviarLink(v.email)
    return json(req, { ok: true })
  }

  if (accion === "interes") {
    const cid = await quien(b.token)
    if (!cid) return json(req, { ok: false, error: "Tu link venció. Volvé a entrar desde el email." }, 401)
    const r = await registrarInteres(cid, String(b.programa ?? ""))
    return json(req, r, r.ok ? 200 : 400)
  }

  if (accion === "guardar") {
    const nivel = Number(b.nivel)
    if (![1, 2, 3].includes(nivel)) return json(req, { ok: false, error: "Nivel inválido." }, 400)
    const ip = ipDe(req)
    let cid = await quien(b.token)
    let email: string | null = null
    let previos = 0
    if (!cid && nivel > 1) return json(req, { ok: false, error: "Para este nivel necesitás el link que te mandamos por email al terminar el anterior.", sinLink: true }, 401)
    if (!cid) {
      if (!t(b.nombre, 120)) return json(req, { ok: false, error: "Contanos tu nombre." }, 400)
      if (!b.acepta) return json(req, { ok: false, error: "Tenés que aceptar la política de privacidad." }, 400)
      const v = await validarEmail(b.email)
      if (!v.ok) return json(req, { ok: false, error: v.error }, 400)
      email = v.email
      const ya = await one<{ id: number }>("select id from db_contactos where lower(email)=$1", [email])
      previos = ya ? (await nivelesDe(ya.id)).length : 0
    }
    const lim = await one<{ ip: number; em: number }>(
      `select count(*) filter (where ip=$1)::int ip, count(*) filter (where ($2::int is not null and contacto_id=$2) or ($3::text is not null and lower(email)=$3))::int em
       from diag_respuestas where creado > now() - interval '1 hour'`, [ip, cid, email])
    if ((lim?.ip ?? 0) >= 15 || (lim?.em ?? 0) >= 6) return json(req, { ok: false, error: "Demasiados envíos seguidos. Probá en un rato." }, 429)

    const r = await guardar({
      nivel: nivel as 1 | 2 | 3, respuestas: b.respuestas, contactoId: cid,
      nombre: t(b.nombre, 120), email, organizacion: t(b.organizacion, 160), telefono: t(b.telefono, 40), rubro: t(b.rubro, 40),
      recordatorio: !!b.recordatorio, origen: t(b.origen, 300), ip,
    })
    if (!r.ok) return json(req, { ok: false, error: r.error }, r.status)
    // Sin link ni sesión (solo nivel 1), el link al nivel siguiente se devuelve en pantalla únicamente si ese email no tenía
    // autodiagnósticos previos. Si ya tenía, va solo por email: así nadie entra a resultados ajenos escribiendo un email que no es suyo.
    const devolverToken = !!cid || previos === 0
    return json(req, {
      ok: true, resultado: r.resultado, enviado: r.enviado, insignia: devolverToken ? r.insignia : null, programas: devolverToken ? r.programas : [], comparacion: r.comparacion,
      token: devolverToken ? r.token : null, siguiente: devolverToken ? r.siguiente : null, porEmail: !devolverToken,
    })
  }
  return json(req, { ok: false, error: "Acción desconocida." }, 400)
}
