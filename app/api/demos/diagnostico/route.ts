import { NextResponse, type NextRequest } from "next/server"
import { one, q, audit } from "@/lib/db"
import { notificar } from "@/lib/push"
import { enviarBrevo, plantilla } from "@/lib/email"
import { conCors, preflight, ipDe } from "@/lib/cors-web"
import { validarEmail, consultaYContacto } from "@/lib/demos"

export const dynamic = "force-dynamic"
const t = (v: unknown, n = 200) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const N = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)))
const DIM: Record<string, string> = { procesos: "Procesos", datos: "Datos", atencion: "Atención al cliente", equipo: "Equipo y cultura", tecnologia: "Tecnología", seguridad: "Seguridad" }

export const OPTIONS = preflight

/** Autodiagnóstico público: guarda el resultado, lo manda por email y suma el contacto al CRM. */
export async function POST(req: NextRequest) {
  return conCors(req, await guardar(req))
}

async function guardar(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (b.website) return NextResponse.json({ ok: true })
  const nombre = t(b.nombre, 120)
  if (!nombre) return NextResponse.json({ ok: false, error: "Contanos tu nombre." }, { status: 400 })
  if (!b.acepta) return NextResponse.json({ ok: false, error: "Tenés que aceptar la política de privacidad." }, { status: 400 })
  const v = await validarEmail(b.email)
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 })
  const n = await one<{ c: number }>("select count(*)::int c from demo_diagnosticos where creado > now() - interval '1 hour' and (lower(email)=$1 or origen like $2)", [v.email, `%|${ipDe(req)}`])
  if ((n?.c ?? 0) >= 5) return NextResponse.json({ ok: false, error: "Demasiados envíos seguidos. Probá en un rato." }, { status: 429 })

  const blanca = b.marca === "blanca"
  const puntaje = N(b.puntaje)
  const nivel = t(b.nivel, 40) ?? "—"
  const dims = Object.fromEntries(Object.keys(DIM).map((k) => [k, N(b.dimensiones?.[k])]))
  const prio = (Array.isArray(b.prioridades) ? b.prioridades : []).slice(0, 3).map((p: any) => ({ titulo: t(p?.titulo, 120) ?? "", paso: t(p?.paso, 300) ?? "" }))
  const resp = (Array.isArray(b.respuestas) ? b.respuestas : []).slice(0, 12).map((x: unknown) => Math.max(1, Math.min(4, Number(x) || 1)))

  let contactoId: number | null = null, consultaId: number | null = null
  if (!blanca) {
    const r = await consultaYContacto({ nombre, email: v.email, organizacion: t(b.organizacion, 160), telefono: t(b.telefono, 40), motivo: "Autodiagnóstico de madurez digital", mensaje: `Resultado: ${puntaje}/100 · ${nivel}`, fuente: "Web (autodiagnóstico)" })
    contactoId = r.contactoId; consultaId = r.consultaId
    if (contactoId) await q("update db_contactos set tags = (select array(select distinct unnest(coalesce(tags,'{}') || '{autodiagnostico}'::text[]))) where id=$1", [contactoId]).catch(() => {})
  }
  const d = await one<{ id: number }>(
    "insert into demo_diagnosticos(email,nombre,organizacion,telefono,puntaje,nivel,dimensiones,prioridades,respuestas,marca,origen,contacto_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id",
    [v.email, nombre, t(b.organizacion, 160), t(b.telefono, 40), puntaje, nivel, JSON.stringify(dims), JSON.stringify(prio), JSON.stringify(resp), blanca ? "blanca" : "devisebit", `${t(b.origen, 300) ?? ""}|${ipDe(req)}`, contactoId],
  )

  const barras = Object.entries(DIM).map(([k, label]) => `<tr><td style="padding:5px 10px 5px 0;font-size:14px;color:#262C37;white-space:nowrap">${label}</td><td style="padding:5px 0;width:100%"><div style="background:#EEF0F3;border-radius:6px;height:12px"><div style="width:${dims[k]}%;background:${blanca ? "#1D4E89" : "#C8231F"};height:12px;border-radius:6px"></div></div></td><td style="padding:5px 0 5px 10px;font-size:13px;font-weight:700;text-align:right">${dims[k]}</td></tr>`).join("")
  const prioHtml = prio.map((p: { titulo: string; paso: string }, i: number) => `<li style="margin-bottom:10px"><strong>${i + 1}. ${esc(p.titulo)}</strong><br><span style="color:#4A515C">${esc(p.paso)}</span></li>`).join("")
  const cuerpo = `<p style="margin:0 0 12px;font-size:16px">Hola ${esc(nombre.split(" ")[0])} 👋</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#262C37">Este es el resultado de tu autodiagnóstico de madurez digital${t(b.organizacion, 160) ? ` para <strong>${esc(t(b.organizacion, 160)!)}</strong>` : ""}.</p>
<div style="background:#F5F6F8;border-radius:14px;padding:18px 20px;margin:0 0 18px"><div style="font-size:13px;color:#4A515C">Tu nivel</div><div style="font-size:28px;font-weight:800;color:#0E1116">${esc(nivel)} · ${puntaje}/100</div></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px">${barras}</table>
${prio.length ? `<p style="margin:0 0 8px;font-weight:800;font-size:15px">Tus 3 prioridades</p><ol style="margin:0 0 18px;padding-left:0;list-style:none;font-size:14px;line-height:1.5">${prioHtml}</ol>` : ""}
${blanca ? "" : `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#262C37">Si querés, lo repasamos juntos en una reunión de 30 minutos sin cargo y te decimos por dónde empezar.</p>
<p style="margin:0 0 8px"><a href="https://sistema.devisebit.com/agendar" style="display:inline-block;background:#C8231F;color:#fff;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px">Agendar una reunión</a></p>
<p style="margin:12px 0 0;font-size:13px;color:#4A515C">Para profundizar: <a href="https://academia.devisebit.com/productos/guia-transformacion-digital" style="color:#C8231F">Guía práctica de transformación digital</a>.</p>`}`
  const html = blanca
    ? `<!doctype html><html><body style="margin:0;background:#F5F6F8;font-family:Inter,Segoe UI,Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:16px"><tr><td style="padding:28px">${cuerpo}</td></tr></table></td></tr></table></body></html>`
    : plantilla(cuerpo, { preheader: `Tu nivel: ${nivel} · ${puntaje}/100` })
  const env = await enviarBrevo({ email: v.email, name: nombre }, "Tu resultado: autodiagnóstico de madurez digital", html)
  await q("update demo_diagnosticos set enviado=$1 where id=$2", [env.ok, d!.id])
  await audit({ id: 0, usuario: "web" }, "autodiagnostico", "demo_diagnostico", d!.id, `${puntaje} ${nivel}`)
  if (!blanca) await notificar(["gerente", "coordinacion"], "📊 Nuevo autodiagnóstico", `${nombre}${t(b.organizacion, 80) ? ` (${t(b.organizacion, 80)})` : ""}: ${nivel} · ${puntaje}/100`, consultaId ? `/consultas/${consultaId}` : "/demos-admin").catch(() => {})
  return NextResponse.json({ ok: env.ok, ...(env.ok ? {} : { error: "No pudimos enviar el email ahora." }) })
}
