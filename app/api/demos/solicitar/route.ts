import { NextResponse, type NextRequest } from "next/server"
import { one, audit } from "@/lib/db"
import { notificar } from "@/lib/push"
import { conCors, preflight, ipDe } from "@/lib/cors-web"
import { validarEmail, crearAcceso, enviarAcceso, consultaYContacto, demoInfo, DEMOS } from "@/lib/demos"

export const dynamic = "force-dynamic"
const t = (v: unknown, n = 200) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))

export const OPTIONS = preflight

/**
 * Pedido de demo desde devisebit.com: { nombre, email, organizacion?, telefono?, demo (slug o "todas"), acepta, website }
 * Valida que el email sea real, registra la consulta y manda por correo un link personal (vence en 14 días).
 */
export async function POST(req: NextRequest) {
  return conCors(req, await pedir(req))
}

async function pedir(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (b.website) return NextResponse.json({ ok: true })
  const nombre = t(b.nombre, 120)
  if (!nombre) return NextResponse.json({ ok: false, error: "Contanos tu nombre." }, { status: 400 })
  if (!b.acepta) return NextResponse.json({ ok: false, error: "Tenés que aceptar la política de privacidad." }, { status: 400 })
  const v = await validarEmail(b.email)
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 })
  const ip = ipDe(req)
  const n = await one<{ ip: number; mail: number }>("select count(*) filter (where origen = $1)::int ip, count(*) filter (where lower(email)=$2)::int mail from demo_accesos where creado > now() - interval '1 hour'", [`web|${ip}`, v.email])
  if ((n?.ip ?? 0) >= 6 || (n?.mail ?? 0) >= 3) return NextResponse.json({ ok: false, error: "Ya te enviamos la demo hace un rato. Revisá tu correo (también promociones o spam)." }, { status: 429 })
  const slug = String(b.demo ?? "")
  const demos = slug && slug !== "todas" && demoInfo(slug) ? [slug] : DEMOS.map((d) => d.slug)
  const titulo = demos.length === 1 ? demoInfo(demos[0])!.titulo : "todas las demos"
  const { consultaId, contactoId } = await consultaYContacto({ nombre, email: v.email, organizacion: t(b.organizacion ?? b.org, 160), telefono: t(b.telefono ?? b.tel, 40), motivo: `Demo: ${titulo}`, mensaje: "Pidió la demo desde la web.", fuente: "Web (demo)" })
  const a = await crearAcceso({ email: v.email, nombre, demos, origen: `web|${ip}`, contactoId })
  const env = await enviarAcceso(a)
  await audit({ id: 0, usuario: "web" }, "demo_pedida", "demo_acceso", a.id, `${demos.join(",")} · ${env.ok ? "enviada" : env.error}`)
  await notificar(["gerente", "coordinacion"], "🎬 Pidieron una demo", `${nombre} (${v.email}) · ${titulo}`, `/consultas/${consultaId}`).catch(() => {})
  if (!env.ok) return NextResponse.json({ ok: false, error: "No pudimos enviar el correo ahora. Escribinos por WhatsApp y te la mandamos." }, { status: 502 })
  return NextResponse.json({ ok: true })
}
