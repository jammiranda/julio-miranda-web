import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { randomBytes } from "crypto"
import { one, q } from "@/lib/db"
import { horario } from "@/lib/agenda"
import { notificar } from "@/lib/push"
import Redes from "@/components/Redes"
import { leerToken } from "@/lib/diagnosticos"
import Enviar from "@/components/Enviar"

const TEST = "https://www.devisebit.com/diagnostico"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Agendá una reunión · DEVISEBIT", description: "Reunión de 30 minutos sin costo con DEVISEBIT, para quienes completaron el autodiagnóstico gratuito." }

/** Link general para agendar (reemplaza a Calendly): pide los datos, crea la consulta y pasa al calendario de turnos. */
async function empezar(fd: FormData) {
  "use server"
  if (fd.get("website")) redirect("/agendar")
  const s = (k: string, n = 160) => { const v = String(fd.get(k) ?? "").trim(); return v ? v.slice(0, n) : null }
  const nombre = s("nombre"), tel = s("telefono", 40)?.replace(/[^\d+]/g, "") || null, email = s("email")?.toLowerCase() || null
  if (!nombre || (!tel && !email)) redirect("/agendar?e=" + encodeURIComponent("Dejanos tu nombre y un WhatsApp o email."))
  // Filtro: la reunión gratuita se agenda después del autodiagnóstico gratis (nivel 1). Sin eso, se pide hacerlo primero.
  const porLink = await leerToken(String(fd.get("t") ?? ""))
  const hizo = porLink ? true : !!(await one(
    `select 1 from diag_respuestas where (email is not null and lower(email)=$1) or ($2::text is not null and regexp_replace(coalesce(telefono,''),'[^0-9+]','','g')=$2)
     union all select 1 from demo_diagnosticos where marca='devisebit' and email is not null and lower(email)=$1 limit 1`, [email ?? "", tel]))
  if (!hizo) redirect("/agendar?x=1")
  // Siempre una consulta nueva con su propio link: escribir el email o el teléfono de otra persona no da acceso a su ficha ni a su reunión.
  // Si ya había una consulta con esos datos, queda anotada solo para el equipo.
  const previa = await one<{ id: number }>(
    "select id from consultas where estado <> 'descartada' and ((telefono is not null and telefono=$1) or (email is not null and lower(email)=$2)) order by creado desc limit 1", [tel, email]).catch(() => null)
  const tok = randomBytes(9).toString("base64url")
  await q("insert into consultas(empresa,canal,nombre,telefono,email,organizacion,motivo,mensaje,brief_token,notas) values ('devisebit','web',$1,$2,$3,$4,$5,$6,$7,$8)",
    [nombre, tel, email, s("organizacion"), s("motivo") ?? "Reunión agendada desde el link general", s("motivo", 1000), tok, previa ? `Entró por el link general de agenda. Ya había una consulta con el mismo email o teléfono: #${previa.id}` : null])
  await notificar(["gerente", "coordinacion"], "🗓️ Están agendando una reunión", `${nombre}${s("organizacion") ? ` (${s("organizacion")})` : ""} entró al link de agenda`, "/consultas?v=bandeja")
  redirect(`/agendar/${tok}`)
}

export default async function AgendarGeneral({ searchParams }: { searchParams: { e?: string; x?: string; t?: string } }) {
  const h = await horario()
  const cid = await leerToken(searchParams.t)
  const pre = cid ? await one<{ nombre: string | null; email: string | null; telefono: string | null; organizacion: string | null }>("select nombre, email, telefono, organizacion from diag_respuestas where contacto_id=$1 order by creado desc limit 1", [cid]) : null
  return (
    <main className="min-h-screen bg-[var(--fondo)]">
      <header className="bg-[var(--tinta)] text-white"><div className="max-w-3xl mx-auto px-4 py-8">
        <a href="https://www.devisebit.com" className="text-xl font-extrabold tracking-[0.04em] text-white no-underline">DEVISE<span className="text-[#FF6A63]">BIT</span></a>
        <h1 className="m-0 mt-4 text-3xl text-white">Agendá una reunión</h1>
        <p className="m-0 mt-2 text-white/75">{h.duracion} minutos, sin costo, por videollamada o teléfono. La reunión es para quienes ya hicieron el autodiagnóstico gratis: así llegamos con tu resultado y la aprovechamos mejor.</p>
      </div></header>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {searchParams.x && (
          <section role="alert" className="card flex flex-col gap-3 mb-4 border-l-4 border-[var(--ac)]">
            <h2 className="m-0 text-lg">Primero el autodiagnóstico (5 minutos, gratis)</h2>
            <p className="m-0 text-[var(--gris)]">No encontramos un autodiagnóstico hecho con ese email o WhatsApp. Hacelo primero: con tu resultado agendamos la reunión sin costo. Si ya lo hiciste, ingresá el mismo email o teléfono que usaste.</p>
            <a href={TEST} className="btn-p self-start">Hacer el autodiagnóstico gratis</a>
          </section>
        )}
        <form action={empezar} className="card flex flex-col gap-3">
          <input type="hidden" name="t" value={searchParams.t ?? ""} />
          {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-[var(--ac)]">{searchParams.e}</p>}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="lbl">Nombre y apellido<input name="nombre" required autoComplete="name" defaultValue={pre?.nombre ?? ""} className="inp" /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="lbl">WhatsApp<input name="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="11 2345 6789" defaultValue={pre?.telefono ?? ""} className="inp" /></label>
            <label className="lbl">Email<input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" defaultValue={pre?.email ?? ""} className="inp" /></label>
          </div>
          <label className="lbl">Empresa u organización (opcional)<input name="organizacion" autoComplete="organization" defaultValue={pre?.organizacion ?? ""} className="inp" /></label>
          <label className="lbl">¿Sobre qué querés hablar?<textarea name="motivo" rows={3} placeholder="Ej.: quiero una página web para mi estudio / un bot de WhatsApp / un sistema para mi gremio" className="inp" /></label>
          <Enviar className="btn-p self-start" cargando="Un momento…">Elegir día y horario →</Enviar>
          <Redes />
          <p className="m-0 text-xs text-[var(--gris)]">Usamos tus datos solo para coordinar la reunión. DEVISEBIT SRL · WhatsApp +54 9 11 7346-6490.</p>
        </form>
      </div>
    </main>
  )
}
