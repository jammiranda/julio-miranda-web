import { NextResponse, type NextRequest } from "next/server"
import { one, audit } from "@/lib/db"
import { claveOk } from "@/lib/clave"

export const dynamic = "force-dynamic"
const t = (v: unknown, n = 500) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n))

/** Alta de consulta desde el bot de WhatsApp o el formulario de la web. Requiere la clave de integración. */
export async function POST(req: NextRequest) {
  if (!claveOk(req.headers.get("x-api-key"), "CONSULTAS_KEY") && !claveOk(req.headers.get("x-api-key"))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }
  const b = await req.json().catch(() => ({}))
  const canal = ["whatsapp", "web", "telefono", "derivacion", "instagram", "otro"].includes(b.canal) ? b.canal : "otro"
  // si ya hay una consulta abierta del mismo teléfono en los últimos 7 días, se agrega el mensaje
  const tel = t(b.telefono, 40)
  const abierta = tel
    ? await one<{ id: number }>("select id from consultas where telefono=$1 and estado in ('nueva','contactada','evaluacion') and creado > now() - interval '7 days' order by id desc limit 1", [tel])
    : null
  if (abierta) {
    await one("update consultas set mensaje = coalesce(mensaje,'') || E'\\n' || $1, actualizado=now() where id=$2", [t(b.mensaje, 2000) ?? "", abierta.id])
    return NextResponse.json({ ok: true, id: abierta.id, actualizada: true })
  }
  const r = await one<{ id: number }>(
    `insert into consultas(canal,nombre,telefono,paciente_nombre,obra_social,nro_afiliado,localidad,motivo,mensaje)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [canal, t(b.nombre, 120), tel, t(b.paciente_nombre, 120), t(b.obra_social, 80), t(b.nro_afiliado, 40), t(b.localidad, 80), t(b.motivo, 120), t(b.mensaje, 2000)],
  )
  await audit({ id: 0, usuario: "integracion-" + canal }, "alta_consulta", "consulta", r!.id)
  return NextResponse.json({ ok: true, id: r!.id })
}
