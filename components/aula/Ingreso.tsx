import { pedirIngreso, validarIngreso, entrarConLink } from "@/lib/ingreso"
import { SITIOS, conDestino, type Sitio } from "@/lib/portal"

/**
 * Pantalla de ingreso sin contraseña (email → código de 6 dígitos o link), compartida por
 * portal.devisebit.com/entrar y academia.devisebit.com/mi-cuenta/entrar. `a` es a dónde vuelve al entrar.
 */

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
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

export type SPIngreso = { r?: string; m?: string; e?: string; c?: string; q?: string; nueva?: string; salio?: string; vencido?: string; a?: string }

const TEXTOS: Record<Sitio, { intro: string; pie: React.ReactNode }> = {
  portal: {
    intro: "Tu cuenta DEVISEBIT: proyectos, pagos, reuniones y tus cursos de la Academia, todo en un solo lugar. Sin contraseñas.",
    pie: <>Es la misma cuenta de <a href="https://academia.devisebit.com/mi-cuenta" className="underline font-semibold">ACADEMIA DEVISEBIT</a>.</>,
  },
  academia: {
    intro: "Entrá a tus cursos, clases en vivo, avance y certificados de ACADEMIA DEVISEBIT. Sin contraseñas: te mandamos un código por email.",
    pie: <>Es la misma cuenta DEVISEBIT que usás para proyectos y pagos.</>,
  },
}

export function PantallaIngreso({ sitio, a, sp }: { sitio: Sitio; a: string; sp: SPIngreso }) {
  const email = sp.m ?? ""
  const enviado = sp.r === "enviado" && emailValido(email)
  const msg = sp.r && sp.r !== "enviado" ? MENSAJES[sp.r] : null
  const errCodigo = sp.c ? ERR_CODIGO[sp.c]?.(sp.q) : null
  const pedirOtro = sp.c === "vencido" || sp.c === "agotado"
  const ocultos = <><input type="hidden" name="sitio" value={sitio} /><input type="hidden" name="a" value={a} /></>

  return (
    <div className="card w-full max-w-md flex flex-col gap-4">
      <div>
        <h1 className="m-0">{enviado ? "Revisá tu correo" : sitio === "academia" ? "Entrá a tu Academia" : "Ingresá con tu email"}</h1>
        <p className="m-0 mt-1 text-sm text-[#4A515C]">
          {enviado
            ? <>Te mandamos un código de 6 números a <strong className="text-[#0E1116]">{email}</strong>. Llega en un minuto; mirá también en spam o promociones.</>
            : TEXTOS[sitio].intro}
        </p>
      </div>

      {enviado && sp.nueva && (
        <p role="status" className="m-0 rounded-xl p-3 text-sm bg-emerald-50">¡Bienvenido! Creamos tu cuenta con ese email. Ingresá el código y ya estás adentro.</p>
      )}
      {msg && (
        <div role={msg.tono === "ok" ? "status" : "alert"} className={`rounded-xl p-4 text-sm ${msg.tono === "aviso" ? "bg-amber-50" : "bg-[#FDECEB]"}`}>
          <strong className="block mb-1">{msg.t}</strong>
          {msg.d(email || "tu email")}
        </div>
      )}

      {enviado && !pedirOtro ? (
        <form action={validarIngreso} className="flex flex-col gap-3">
          {ocultos}
          <input type="hidden" name="email" value={email} />
          {errCodigo && <p role="alert" className="m-0 text-sm text-rojo">{errCodigo}</p>}
          <label className="lbl">Código
            <input name="codigo" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7}
              className="inp text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" aria-describedby="ayuda-codigo" />
          </label>
          <button className="btn-p">Entrar</button>
          <p id="ayuda-codigo" className="m-0 text-xs text-[#4A515C]">También podés tocar el botón «Entrar» del mismo correo. La sesión queda abierta 30 días en este dispositivo.</p>
        </form>
      ) : null}

      {(!enviado || pedirOtro) && (
        <form action={pedirIngreso} className="flex flex-col gap-3">
          {ocultos}
          {sp.salio && <p role="status" className="m-0 text-sm text-[#4A515C]">Cerraste la sesión.</p>}
          {sp.vencido && <p role="alert" className="m-0 text-sm text-rojo">Ese link ya se usó o venció. Pedí un código nuevo.</p>}
          {sp.e && <p role="alert" className="m-0 text-sm text-rojo">Revisá el email.</p>}
          {pedirOtro && errCodigo && <p role="alert" className="m-0 text-sm text-rojo">{errCodigo}</p>}
          <label className="lbl">Tu email<input name="email" type="email" required autoFocus={!enviado} autoComplete="email" inputMode="email" defaultValue={email} className="inp" placeholder="nombre@empresa.com" /></label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <button className="btn-p">{pedirOtro ? "Mandarme un código nuevo" : "Continuar"}</button>
          <p className="m-0 text-xs text-[#4A515C]">Si es tu primera vez, la cuenta se crea sola con tu email. Te mandamos un código y un link: usá el que te quede más cómodo.</p>
        </form>
      )}

      {enviado && !pedirOtro && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <form action={pedirIngreso}>{ocultos}<input type="hidden" name="email" value={email} /><button className="underline text-[#4A515C] bg-transparent border-0 p-0 cursor-pointer">Mandarme otro código</button></form>
          <a href={conDestino(SITIOS[sitio].entrar, a)} className="underline text-[#4A515C]">Usar otro email</a>
        </div>
      )}

      <p className="m-0 text-xs text-[#4A515C] border-t border-[#EEF0F3] pt-3">
        {TEXTOS[sitio].pie} ¿Problemas para entrar? Escribinos por <a target="_blank" rel="noopener noreferrer" className="underline" href={WA}>WhatsApp</a>.
      </p>
    </div>
  )
}

/** Confirmación del link mágico (un botón, para que los antivirus no gasten el acceso). */
export function ConfirmarLink({ sitio, tok, a, nombre }: { sitio: Sitio; tok: string; a: string; nombre: string }) {
  return (
    <form action={entrarConLink} className="card w-full max-w-md flex flex-col gap-4 text-center">
      <input type="hidden" name="sitio" value={sitio} />
      <input type="hidden" name="tok" value={tok} />
      <input type="hidden" name="a" value={a} />
      <h1 className="m-0">Hola, {nombre.split(" ")[0]}</h1>
      <p className="m-0 text-sm text-[#4A515C]">Tocá el botón para entrar{sitio === "academia" ? " a tu cuenta de ACADEMIA DEVISEBIT" : " a tu cuenta"}. La sesión queda abierta 30 días en este dispositivo.</p>
      <button className="btn-p">{sitio === "academia" ? "Entrar a mi Academia" : "Entrar a mi cuenta"}</button>
    </form>
  )
}
