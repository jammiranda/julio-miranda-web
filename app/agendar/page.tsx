import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { randomBytes } from "crypto"
import { one, q } from "@/lib/db"
import { horario } from "@/lib/agenda"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Agendá una reunión · DEVISEBIT", description: "Reunión sin costo con DEVISEBIT para tu proyecto web, de IA o de sistemas." }

/** Link general para agendar (reemplaza a Calendly): pide los datos, crea la consulta y pasa al calendario de turnos. */
async function empezar(fd: FormData) {
  "use server"
  if (fd.get("website")) redirect("/agendar")
  const s = (k: string, n = 160) => { const v = String(fd.get(k) ?? "").trim(); return v ? v.slice(0, n) : null }
  const nombre = s("nombre"), tel = s("telefono", 40)?.replace(/[^\d+]/g, "") || null, email = s("email")?.toLowerCase() || null
  if (!nombre || (!tel && !email)) redirect("/agendar?e=" + encodeURIComponent("Dejanos tu nombre y un WhatsApp o email."))
  const previa = await one<{ id: number; brief_token: string | null }>(
    "select id, brief_token from consultas where estado <> 'descartada' and ((telefono is not null and telefono=$1) or (email is not null and lower(email)=$2)) order by creado desc limit 1", [tel, email])
  const tok = previa?.brief_token ?? randomBytes(9).toString("base64url")
  if (previa) await q("update consultas set brief_token=coalesce(brief_token,$1), nombre=coalesce(nombre,$2), email=coalesce(email,$3), telefono=coalesce(telefono,$4), actualizado=now() where id=$5", [tok, nombre, email, tel, previa.id])
  else {
    await q("insert into consultas(empresa,canal,nombre,telefono,email,organizacion,motivo,mensaje,brief_token) values ('devisebit','web',$1,$2,$3,$4,$5,$6,$7)",
      [nombre, tel, email, s("organizacion"), s("motivo") ?? "Reunión agendada desde el link general", s("motivo", 1000), tok])
    await notificar(["gerente", "coordinacion"], "🗓️ Están agendando una reunión", `${nombre}${s("organizacion") ? ` (${s("organizacion")})` : ""} entró al link de agenda`, "/consultas?v=bandeja")
  }
  redirect(`/agendar/${tok}`)
}

export default async function AgendarGeneral({ searchParams }: { searchParams: { e?: string } }) {
  const h = await horario()
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <header className="bg-[#0E1116] text-white"><div className="max-w-3xl mx-auto px-4 py-8">
        <a href="https://www.devisebit.com" className="text-xl font-extrabold tracking-[0.04em] text-white no-underline">DEVISE<span className="text-[#FF6A63]">BIT</span></a>
        <h1 className="m-0 mt-4 text-3xl text-white">Agendá una reunión</h1>
        <p className="m-0 mt-2 text-white/75">{h.duracion} minutos, sin costo, por videollamada o teléfono. Primero tus datos; en el paso siguiente elegís día y horario.</p>
      </div></header>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form action={empezar} className="card flex flex-col gap-3">
          {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-[#C8231F]">{searchParams.e}</p>}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="lbl">Nombre y apellido<input name="nombre" required autoComplete="name" className="inp" /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="lbl">WhatsApp<input name="telefono" inputMode="tel" autoComplete="tel" placeholder="11 2345 6789" className="inp" /></label>
            <label className="lbl">Email<input name="email" type="email" autoComplete="email" className="inp" /></label>
          </div>
          <label className="lbl">Empresa u organización (opcional)<input name="organizacion" className="inp" /></label>
          <label className="lbl">¿Sobre qué querés hablar?<textarea name="motivo" rows={3} placeholder="Ej.: quiero una página web para mi estudio / un bot de WhatsApp / un sistema para mi gremio" className="inp" /></label>
          <button className="btn-p self-start">Elegir día y horario →</button>
          <p className="m-0 text-xs text-[#4A515C]">Usamos tus datos solo para coordinar la reunión. DEVISEBIT SRL · WhatsApp +54 9 11 7346-6490.</p>
        </form>
      </div>
    </main>
  )
}
