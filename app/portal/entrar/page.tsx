import { redirect } from "next/navigation"
import { audit } from "@/lib/db"
import { clienteActual, pedirLink, usarCodigo, ipActual } from "@/lib/portal"
import { URL_ACADEMIA } from "@/lib/academia"

export const dynamic = "force-dynamic"

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const limpiarEmail = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase().slice(0, 160)

/** Paso 1: el email. Si no existe y la regla lo permite, la cuenta se crea sola. */
async function pedir(fd: FormData) {
  "use server"
  if (fd.get("website")) redirect("/portal/entrar?r=enviado")
  const email = limpiarEmail(fd.get("email"))
  if (!emailValido(email)) redirect("/portal/entrar?e=email")
  const r = await pedirLink(email, null, ipActual())
  await audit({ id: 0, usuario: `portal:${email}` }, `portal_pedido_${r.resultado}`, "portal", email, r.detalle)
  redirect(`/portal/entrar?r=${r.resultado}&m=${encodeURIComponent(email)}${r.nueva ? "&nueva=1" : ""}`)
}

/** Paso 2: el código de 6 dígitos que llegó por email (el link del mismo correo también sirve). */
async function validar(fd: FormData) {
  "use server"
  const email = limpiarEmail(fd.get("email"))
  const codigo = String(fd.get("codigo") ?? "").replace(/\D/g, "")
  const base = `/portal/entrar?r=enviado&m=${encodeURIComponent(email)}`
  if (!emailValido(email)) redirect("/portal/entrar?e=email")
  if (codigo.length !== 6) redirect(`${base}&c=formato`)
  const r = await usarCodigo(email, codigo)
  await audit({ id: 0, usuario: `portal:${email}` }, `portal_codigo_${r.resultado}`, "portal", email)
  if (r.resultado === "ok") redirect("/portal")
  if (r.resultado === "bloqueado") redirect(`/portal/entrar?r=bloqueado&m=${encodeURIComponent(email)}`)
  redirect(`${base}&c=${r.resultado}${r.quedan != null ? `&q=${r.quedan}` : ""}`)
}

const WA = "https://wa.me/5491173466490?text=Hola%2C%20necesito%20ayuda%20para%20entrar%20a%20mi%20cuenta%20DEVISEBIT"

const MENSAJES: Record<string, { t: string; d: (m: string) => string; tono: "ok" | "aviso" | "error" }> = {
  pendiente: { t: "Tu acceso está en revisión", d: (m) => `Todavía no tenemos ${m} habilitado. Ya avisamos al equipo: apenas lo validen te llega el acceso por email. Si es urgente, escribinos por WhatsApp.`, tono: "aviso" },
  bloqueado: { t: "Tu acceso está suspendido", d: () => "Esta cuenta no puede entrar por ahora. Para reactivarla, comunicate con el equipo de DEVISEBIT por WhatsApp.", tono: "error" },
  limite: { t: "Pediste varios códigos seguidos", d: () => "Por seguridad, esperá 15 minutos y usá el último que te llegó. Si no aparece, revisá spam o escribinos por WhatsApp.", tono: "aviso" },
  error: { t: "No pudimos mandarte el email", d: () => "Ya avisamos al equipo para resolverlo. Mientras tanto, escribinos por WhatsApp y te damos el acceso.", tono: "error" },
}
const ERR_CODIGO: Record<string, (q?: string) => string> = {
  formato: () => "El código tiene 6 números.",
  incorrecto: (q) => `Ese código no es correcto.${q ? ` Te quedan ${q} ${q === "1" ? "intento" : "intentos"}.` : ""}`,
  vencido: () => "Ese código ya se usó o venció (dura 15 minutos). Pedí uno nuevo.",
  agotado: () => "Hubo demasiados intentos con ese código. Pedí uno nuevo.",
}

type SP = { r?: string; m?: string; e?: string; c?: string; q?: string; nueva?: string; salio?: string; vencido?: string }

export default async function Entrar({ searchParams }: { searchParams: SP }) {
  if (await clienteActual()) redirect("/portal")
  const email = searchParams.m ?? ""
  const enviado = searchParams.r === "enviado" && emailValido(email)
  const msg = searchParams.r && searchParams.r !== "enviado" ? MENSAJES[searchParams.r] : null
  const errCodigo = searchParams.c ? ERR_CODIGO[searchParams.c]?.(searchParams.q) : null
  const pedirOtro = searchParams.c === "vencido" || searchParams.c === "agotado"

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card w-full max-w-md flex flex-col gap-4">
        <div>
          <h1 className="m-0">{enviado ? "Revisá tu correo" : "Ingresá con tu email"}</h1>
          <p className="m-0 mt-1 text-sm text-[#4A515C]">
            {enviado
              ? <>Te mandamos un código de 6 números a <strong className="text-[#0E1116]">{email}</strong>. Llega en un minuto; mirá también en spam o promociones.</>
              : "Tu cuenta DEVISEBIT: proyectos, pagos, reuniones y tus cursos de la Academia, todo en un solo lugar. Sin contraseñas."}
          </p>
        </div>

        {enviado && searchParams.nueva && (
          <p role="status" className="m-0 rounded-xl p-3 text-sm bg-emerald-50">¡Bienvenido! Creamos tu cuenta con ese email. Ingresá el código y ya estás adentro.</p>
        )}
        {msg && (
          <div role={msg.tono === "ok" ? "status" : "alert"} className={`rounded-xl p-4 text-sm ${msg.tono === "aviso" ? "bg-amber-50" : "bg-[#FDECEB]"}`}>
            <strong className="block mb-1">{msg.t}</strong>
            {msg.d(email || "tu email")}
          </div>
        )}

        {enviado && !pedirOtro ? (
          <form action={validar} className="flex flex-col gap-3">
            <input type="hidden" name="email" value={email} />
            {errCodigo && <p role="alert" className="m-0 text-sm text-rojo">{errCodigo}</p>}
            <label className="lbl">Código
              <input name="codigo" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7}
                className="inp text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" aria-describedby="ayuda-codigo" />
            </label>
            <button className="btn-p">Entrar</button>
            <p id="ayuda-codigo" className="m-0 text-xs text-[#4A515C]">También podés tocar el botón «Entrar a mi cuenta» del mismo correo. La sesión queda abierta 30 días en este dispositivo.</p>
          </form>
        ) : null}

        {(!enviado || pedirOtro) && (
          <form action={pedir} className="flex flex-col gap-3">
            {searchParams.salio && <p role="status" className="m-0 text-sm text-[#4A515C]">Cerraste la sesión.</p>}
            {searchParams.vencido && <p role="alert" className="m-0 text-sm text-rojo">Ese link ya se usó o venció. Pedí un código nuevo.</p>}
            {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">Revisá el email.</p>}
            {pedirOtro && errCodigo && <p role="alert" className="m-0 text-sm text-rojo">{errCodigo}</p>}
            <label className="lbl">Tu email<input name="email" type="email" required autoFocus={!enviado} autoComplete="email" inputMode="email" defaultValue={email} className="inp" placeholder="nombre@empresa.com" /></label>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button className="btn-p">{pedirOtro ? "Mandarme un código nuevo" : "Continuar"}</button>
            <p className="m-0 text-xs text-[#4A515C]">Si es tu primera vez, la cuenta se crea sola con tu email. Te mandamos un código y un link: usá el que te quede más cómodo.</p>
          </form>
        )}

        {enviado && !pedirOtro && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <form action={pedir}><input type="hidden" name="email" value={email} /><button className="underline text-[#4A515C] bg-transparent border-0 p-0 cursor-pointer">Mandarme otro código</button></form>
            <a href="/portal/entrar" className="underline text-[#4A515C]">Usar otro email</a>
          </div>
        )}

        <p className="m-0 text-xs text-[#4A515C] border-t border-[#EEF0F3] pt-3">
          Es la misma cuenta de <a href={URL_ACADEMIA} className="underline font-semibold">ACADEMIA DEVISEBIT</a>. ¿Problemas para entrar? Escribinos por <a target="_blank" rel="noopener noreferrer" className="underline" href={WA}>WhatsApp</a>.
        </p>
      </div>
    </div>
  )
}
