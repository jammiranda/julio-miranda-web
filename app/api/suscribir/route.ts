import { NextResponse, type NextRequest } from "next/server"
import { one, q, audit } from "@/lib/db"
import { aHtml, plantilla, enviarBrevo } from "@/lib/email"
import { URL_SISTEMA } from "@/lib/brief"
import { desdeUtm } from "@/lib/origen"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"
const ORIGENES = ["https://www.devisebit.com", "https://devisebit.com", "https://academia.devisebit.com", "https://sistema.devisebit.com"]
const cors = (req: NextRequest): Record<string, string> => { const o = req.headers.get("origin") ?? ""; return ORIGENES.includes(o) ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {} }
export function OPTIONS(req: NextRequest) { return new NextResponse(null, { status: 204, headers: cors(req) }) }

/** Alta al newsletter (formularios de devisebit.com y academia.devisebit.com). Cuerpo: { email, nombre?, origen?, tag?, utm_* } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const h = cors(req)
  if (b.website) return NextResponse.json({ ok: true }, { headers: h })
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400, headers: h })
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim()
  const n = await one<{ n: number }>("select count(*)::int n from em_log where tipo='alta:'||$1 and creado > now() - interval '1 hour'", [ip])
  if ((n?.n ?? 0) > 10) return NextResponse.json({ ok: false, error: "Demasiados intentos" }, { status: 429, headers: h })
  await q("insert into em_log(tipo,email) values ($1,$2)", ["alta:" + ip, email])
  const nombre = String(b.nombre ?? "").trim().slice(0, 120) || null
  const tag = String(b.tag ?? "newsletter").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "newsletter"
  const og = desdeUtm(b)
  const c = await one<{ id: number; email_token: string; nuevo: boolean }>(
    `insert into db_contactos(nombre,email,etapa,origen,fuente,categoria,tags,suscrito_en,consentimiento,email_token,clase)
     values (coalesce($1,split_part($2,'@',1)),$2,'base',$3,$4,'Suscriptor',array[$5::text],now(),'Sí',md5(random()::text||clock_timestamp()::text),'suscriptor')
     on conflict (lower(email)) where email is not null do update set tags=(select array(select distinct unnest(db_contactos.tags || array[$5::text]))),
       suscrito_en=coalesce(db_contactos.suscrito_en, now()), clase=coalesce(db_contactos.clase,'suscriptor'), consentimiento='Sí', email_estado=case when db_contactos.email_estado='baja' then 'activo' else db_contactos.email_estado end, actualizado=now()
     returning id, email_token, (xmax = 0) nuevo`,
    [nombre, email, String(b.origen ?? "Formulario newsletter").slice(0, 80), og.fuente, tag],
  )
  await audit({ id: 0, usuario: "web" }, "suscripcion", "db_contacto", c!.id, tag)
  if (c?.nuevo) {
    await notificar(["gerente", "coordinacion"], "📬 Nuevo suscriptor", `${email} · ${tag}`, `/contactos/${c.id}`).catch(() => {})
    const baja = `${URL_SISTEMA}/baja/${c.email_token}`
    const cuerpo = `# ¡Bienvenido${nombre ? `, ${nombre.split(" ")[0]}` : ""}!\n\nGracias por sumarte. Cada tanto te vamos a mandar guías prácticas, herramientas de inteligencia artificial que ya funcionan y casos reales de empresas e instituciones que se digitalizaron.\n\nNada de spam: poco y útil.${b.regalo ? `\n\n[[Descargar tu guía|${String(b.regalo)}]]` : ""}\n\nMientras tanto, mirá lo que estamos haciendo:\n\n[[Ver novedades|https://www.devisebit.com/novedades]]`
    await enviarBrevo({ email, name: nombre }, "Bienvenido a DEVISEBIT", plantilla(aHtml(cuerpo), { preheader: "Guías, IA aplicada y casos reales", baja }), baja).catch(() => {})
  }
  return NextResponse.json({ ok: true }, { headers: h })
}
