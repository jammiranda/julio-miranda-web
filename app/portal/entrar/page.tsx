import { redirect } from "next/navigation"
import { audit } from "@/lib/db"
import { clienteActual, pedirLink } from "@/lib/portal"

export const dynamic = "force-dynamic"

async function pedir(fd: FormData) {
  "use server"
  if (fd.get("website")) redirect("/portal/entrar?r=enviado")
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/portal/entrar?e=email")
  const r = await pedirLink(email)
  await audit({ id: 0, usuario: `portal:${email}` }, `portal_pedido_${r.resultado}`, "portal", email, r.detalle)
  redirect(`/portal/entrar?r=${r.resultado}&m=${encodeURIComponent(email)}`)
}

const WA = "https://wa.me/5491173466490?text=Hola%2C%20necesito%20acceso%20a%20mi%20cuenta%20DEVISEBIT"

const MENSAJES: Record<string, { t: string; d: (m: string) => string; tono: "ok" | "aviso" | "error" }> = {
  enviado: { t: "Revisá tu correo", d: (m) => `Te mandamos el link a ${m}. Llega en un par de minutos; mirá también en spam o promociones. Vale por 1 hora y se usa una sola vez.`, tono: "ok" },
  pendiente: { t: "Tu acceso está en revisión", d: (m) => `Todavía no tenemos ${m} habilitado. Ya avisamos al equipo: apenas lo validen te llega el acceso por email. Si es urgente, escribinos por WhatsApp.`, tono: "aviso" },
  bloqueado: { t: "Tu acceso está suspendido", d: () => "Para reactivarlo, comunicate con el equipo de DEVISEBIT por WhatsApp.", tono: "error" },
  limite: { t: "Ya te mandamos varios links", d: () => "Esperá 15 minutos y usá el último que te llegó. Si no aparece, revisá spam o escribinos.", tono: "aviso" },
  error: { t: "No pudimos mandarte el email", d: () => "Ya avisamos al equipo para resolverlo. Mientras tanto, escribinos por WhatsApp y te damos el acceso.", tono: "error" },
}

export default async function Entrar({ searchParams }: { searchParams: { r?: string; m?: string; e?: string; salio?: string; vencido?: string } }) {
  if (await clienteActual()) redirect("/portal")
  const msg = searchParams.r ? MENSAJES[searchParams.r] : null
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card w-full max-w-md flex flex-col gap-4">
        <div>
          <h1 className="m-0">Tu cuenta DEVISEBIT</h1>
          <p className="m-0 mt-1 text-sm text-[#4A515C]">Proyectos, pagos y cursos en un solo lugar: etapa, entregas, documentos, reuniones, aprobaciones y certificados.</p>
        </div>
        {msg && (
          <div role={msg.tono === "ok" ? "status" : "alert"} className={`rounded-xl p-4 text-sm ${msg.tono === "ok" ? "bg-emerald-50" : msg.tono === "aviso" ? "bg-amber-50" : "bg-[#FDECEB]"}`}>
            <strong className="block mb-1">{msg.t}</strong>
            {msg.d(searchParams.m ?? "tu email")}
          </div>
        )}
        {(!msg || searchParams.r !== "enviado") && (
          <form action={pedir} className="flex flex-col gap-3">
            {searchParams.salio && <p role="status" className="m-0 text-sm text-[#4A515C]">Cerraste la sesión.</p>}
            {searchParams.vencido && <p role="alert" className="m-0 text-sm text-rojo">Ese link ya se usó o venció. Pedí uno nuevo.</p>}
            {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">Revisá el email.</p>}
            <label className="lbl">Tu email<input name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={searchParams.m ?? ""} className="inp" placeholder="nombre@empresa.com" /></label>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button className="btn-p">Enviarme el link de acceso</button>
            <p className="m-0 text-xs text-[#4A515C]">Sin contraseñas: te mandamos un link seguro al email que usás con DEVISEBIT.</p>
          </form>
        )}
        {searchParams.r === "enviado" && <a href="/portal/entrar" className="text-sm underline text-[#4A515C]">Usar otro email</a>}
        <p className="m-0 text-xs text-[#4A515C] border-t border-[#EEF0F3] pt-3">¿Problemas para entrar? Escribinos por <a target="_blank" rel="noopener noreferrer" className="underline" href={WA}>WhatsApp</a>.</p>
      </div>
    </div>
  )
}
