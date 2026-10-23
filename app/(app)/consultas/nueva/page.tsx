import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { MOTIVOS } from "@/lib/consultas"

export const dynamic = "force-dynamic"

async function nueva(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const r = await one<{ id: number }>(
    "insert into consultas(canal,nombre,telefono,organizacion,email,motivo,mensaje,asignado) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id",
    [s(fd.get("canal")) ?? "telefono", s(fd.get("nombre")), s(fd.get("telefono")), s(fd.get("organizacion")), s(fd.get("email")), s(fd.get("motivo")), s(fd.get("mensaje")), s(fd.get("asignado"))],
  )
  await audit(u, "alta_consulta", "consulta", r!.id)
  redirect(`/consultas/${r!.id}?nueva=1`)
}

export default async function Nueva() {
  const u = await requerir(["gerente", "coordinacion"])
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div><Link href="/consultas" className="text-sm text-[#4A515C]">← Conversaciones</Link><h1 className="m-0">Nueva consulta</h1><p className="m-0 text-sm text-[#4A515C]">Para llamados, mails, LinkedIn o referidos que no entraron por el bot.</p></div>
      <form action={nueva} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="lbl">Canal<select name="canal" className="inp"><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="referido">Referido</option><option value="web">Web</option><option value="instagram">Instagram</option><option value="otro">Otro</option></select></label>
        <label className="lbl">Nombre<input name="nombre" required className="inp" /></label>
        <label className="lbl">Organización<input name="organizacion" className="inp" /></label>
        <label className="lbl">Email<input name="email" type="email" className="inp" /></label>
        <label className="lbl">Teléfono<input name="telefono" className="inp" inputMode="tel" /></label>
        <label className="lbl">Responsable<input name="asignado" defaultValue={u.nombre} className="inp" /></label>
        <label className="lbl">Motivo<select name="motivo" className="inp">{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label className="lbl col-span-full">Detalle<textarea name="mensaje" rows={3} className="inp" /></label>
        <div className="col-span-full flex gap-2"><button className="btn-p">Guardar consulta</button><Link href="/consultas" className="btn-s">Cancelar</Link></div>
      </form>
    </div>
  )
}
