import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { audit } from "@/lib/db"
import { gcalConfig } from "@/lib/agenda"
import {
  estadoGoogle, eventosCalendario, driveConfig, guardarDriveConfig, sincronizarDrive, gmailConfig, guardarGmailConfig, correosGmail,
  imapConfig, guardarImap, correosImap, limpiarCache, GMAIL_DEF,
} from "@/lib/integraciones"
import { Aviso } from "@/components/Registro"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const ir = (ok?: string, e?: string) => redirect(`/integraciones?${ok ? `ok=${encodeURIComponent(ok)}` : `error=${encodeURIComponent(e ?? "")}`}`)

async function probarGoogle() {
  "use server"
  await requerir(["gerente", "coordinacion"])
  await limpiarCache("g:")
  const e = await estadoGoogle(true)
  if (!e.conectado) ir(undefined, "Google no está conectado: pegá la URL del conector en Agenda y avisos.")
  if (e.version < 2) ir(undefined, e.error ?? "El conector sigue en la versión 1. Pegá el código nuevo y creá una versión nueva de la implementación.")
  const ev = await eventosCalendario(30, true)
  ir(`Conector v${e.version} funcionando${e.cuenta ? ` (${e.cuenta})` : ""}: ${ev.eventos.length} eventos en los próximos 30 días.`)
}
async function guardarDrive(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const carpeta = String(fd.get("carpeta") ?? "").trim() || "DEVISEBIT"
  await guardarDriveConfig(carpeta)
  await audit(u, "integracion", "drive", 0, carpeta)
  const r = await sincronizarDrive(u.usuario)
  revalidatePath("/", "layout")
  r.ok ? ir(r.mensaje) : ir(undefined, r.mensaje)
}
async function guardarGmail(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  await guardarGmailConfig(String(fd.get("consulta") ?? "").trim())
  await limpiarCache("g:gmail")
  await audit(u, "integracion", "gmail", 0)
  const r = await correosGmail(true)
  r.ok ? ir(`Gmail conectado: ${r.hilos.length} conversaciones con esa búsqueda.`) : ir(undefined, "Gmail no respondió. Revisá que el conector esté en la versión 2 y autorizado.")
}
async function guardarCasilla(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const t = (k: string) => String(fd.get(k) ?? "").trim()
  await guardarImap({ host: t("host"), puerto: Number(t("puerto")) || 993, usuario: t("usuario"), clave: t("clave") || undefined, webmail: t("webmail") })
  await audit(u, "integracion", "imap", 0, t("usuario"))
  const r = await correosImap(true)
  r.ok ? ir(`Casilla conectada: ${r.mails.length} correos recientes, ${r.noLeidos ?? 0} sin leer.`) : ir(undefined, `No pude entrar a la casilla: ${r.error ?? "revisá servidor, usuario y clave"}.`)
}

function Estado({ ok, si, no }: { ok: boolean; si: string; no: string }) {
  return <span className={`chip ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{ok ? si : no}</span>
}

export default async function Integraciones({ searchParams: sp }: { searchParams: { ok?: string; error?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const [g, gc, dr, gm, im] = await Promise.all([estadoGoogle(), gcalConfig(), driveConfig(), gmailConfig(), imapConfig()])
  const v2 = g.version >= 2

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <header className="pag-cab">
        <div><div className="eyebrow">Administración</div><h1 className="m-0">Integraciones</h1><p>El sistema se conecta con el resto del ecosistema: tu Google (Calendar, Drive y Gmail) y la casilla info@devisebit.com de Donweb. Todo queda en un solo lugar sin copiar a mano.</p></div>
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section className="card flex flex-col gap-3" aria-label="Conector de Google">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-base">Conector de Google</h2>
          <span className="flex gap-2">{!g.conectado ? <Estado ok={false} si="" no="Sin conectar" /> : v2 ? <Estado ok si={`Versión ${g.version} · al día`} no="" /> : <Estado ok={false} si="" no="Versión 1 · falta actualizar" />}</span>
        </div>
        <p className="m-0 text-sm text-[var(--gris)]">Un solo script en tu cuenta de Google conecta Calendar, Drive y Gmail. Corre en tu cuenta: el sistema solo recibe lo que pide, con una clave propia.{g.cuenta ? ` Cuenta: ${g.cuenta}.` : ""}</p>
        {(!g.conectado || !v2) && (
          <ol className="m-0 pl-5 text-sm flex flex-col gap-1.5">
            {g.conectado ? (
              <>
                <li>Abrí tu proyecto «Agenda DEVISEBIT» en <a href="https://script.google.com/home" target="_blank" rel="noopener noreferrer" className="underline font-semibold">script.google.com</a>.</li>
                <li>Borrá todo el código y pegá el de <a href="/agenda/script" target="_blank" className="underline font-semibold">este archivo</a> (versión 2, ya trae tu clave). Guardá.</li>
                <li>Implementar → <strong>Gestionar implementaciones</strong> → lápiz → Versión: <strong>Nueva versión</strong> → Implementar. La URL no cambia.</li>
                <li>Google te va a pedir permiso para Drive y Gmail: aceptá con tu cuenta (dice «no verificada» porque el script es tuyo; tocá Avanzado → Ir a Agenda DEVISEBIT).</li>
                <li>Volvé acá y tocá <strong>Probar conexión</strong>.</li>
              </>
            ) : (
              <li>Primero conectá Google Calendar en <Link href="/agenda" className="underline font-semibold">Agenda y avisos</Link> con el código de <a href="/agenda/script" target="_blank" className="underline">este archivo</a>; ya trae Calendar, Drive y Gmail.</li>
            )}
          </ol>
        )}
        <form action={probarGoogle}><button className="btn-s">Probar conexión</button></form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card flex flex-col gap-3" aria-label="Google Calendar">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Google Calendar</h2><Estado ok={v2} si="Eventos sincronizados" no={gc.url ? "Solo horarios ocupados" : "Sin conectar"} /></div>
          <ul className="m-0 pl-5 text-sm text-[var(--gris)] flex flex-col gap-1">
            <li>Las reuniones que anotás en tu calendario aparecen en el Tablero de dirección, en el Resumen comercial y en Agenda, con el link de Meet.</li>
            <li>Si un invitado es un contacto del CRM, la reunión se enlaza con su ficha.</li>
            <li>Las reuniones que reservan los clientes se siguen creando solas en tu calendario.</li>
          </ul>
        </section>

        <section className="card flex flex-col gap-3" aria-label="Google Drive">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Google Drive → Documentos</h2><Estado ok={v2 && !!dr.ultima && !/no |falta|error/i.test(dr.resultado ?? "")} si="Sincronizado" no="Sin sincronizar" /></div>
          <p className="m-0 text-sm text-[var(--gris)]">Todo lo que esté en esta carpeta de Drive (y sus subcarpetas) aparece en Documentos, todos los días. La categoría sale del nombre de la subcarpeta: Legal, Contable, Comercial, Técnico, Equipo, Plantillas, Licitaciones. Lo legal y contable entra como confidencial.</p>
          <form action={guardarDrive} className="flex flex-wrap gap-2 items-end">
            <label className="lbl grow">Carpeta (nombre o ID)<input name="carpeta" defaultValue={dr.carpeta} className="inp" /></label>
            <button className="btn-p" disabled={!v2}>Guardar y sincronizar</button>
          </form>
          {dr.ultima && <p className="m-0 text-xs text-[var(--gris)]">Última: {fecha(dr.ultima)} · {dr.resultado}</p>}
        </section>

        <section className="card flex flex-col gap-3" aria-label="Gmail">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Gmail</h2><Estado ok={v2} si="Conectado" no="Sin conectar" /></div>
          <p className="m-0 text-sm text-[var(--gris)]">Los correos de tu Gmail que coinciden con esta búsqueda se ven en <Link href="/correos" className="underline">Correo</Link> y en el Tablero. En cada contacto del CRM aparecen los correos con esa persona.</p>
          <form action={guardarGmail} className="flex flex-col gap-2">
            <label className="lbl">Búsqueda (como en el buscador de Gmail)<input name="consulta" defaultValue={gm.consulta} className="inp font-mono !text-sm" /></label>
            <span className="text-xs text-[var(--gris)]">Ejemplo solo DEVISEBIT: <code>label:devisebit newer_than:30d</code> · por defecto: <code>{GMAIL_DEF}</code></span>
            <div><button className="btn-s" disabled={!v2}>Guardar y probar</button></div>
          </form>
        </section>

        <section className="card flex flex-col gap-3" aria-label="Casilla de Donweb">
          <div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">info@devisebit.com · Donweb</h2><Estado ok={im.tieneClave && !!im.host} si="Conectada" no="Sin conectar" /></div>
          <p className="m-0 text-sm text-[var(--gris)]">La casilla de Donweb se lee por IMAP: los correos nuevos aparecen en Correo y en el Tablero, enlazados con el contacto si ya está en el CRM. El servidor y el usuario ya están cargados desde el panel de Donweb (hosting devisebit.com): solo falta la clave de info@devisebit.com.</p>
          {u.rol === "gerente" ? (
            <form action={guardarCasilla} className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2">
              <label className="lbl">Servidor IMAP<input name="host" defaultValue={im.host} placeholder="mail.devisebit.com" className="inp" /></label>
              <label className="lbl">Puerto<input name="puerto" defaultValue={im.puerto} inputMode="numeric" className="inp" /></label>
              <label className="lbl">Usuario<input name="usuario" defaultValue={im.usuario} className="inp" autoComplete="off" /></label>
              <label className="lbl">Clave<input name="clave" type="password" placeholder={im.tieneClave ? "Guardada · dejala vacía para no cambiarla" : ""} className="inp" autoComplete="new-password" /></label>
              <label className="lbl sm:col-span-2">Webmail (opcional, para el botón «Abrir»)<input name="webmail" defaultValue={im.webmail} placeholder="https://…" className="inp" /></label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><button className="btn-s">Guardar y probar</button><span className="text-xs text-[var(--gris)]">La clave se guarda cifrada y no se vuelve a mostrar.</span></div>
            </form>
          ) : <p className="m-0 text-sm">La configura Dirección.</p>}
        </section>
      </div>

      <section className="card flex flex-col gap-2" aria-label="Donweb dominios y hosting">
        <h2 className="m-0 text-base">Dominios, hosting y SSL de Donweb</h2>
        <p className="m-0 text-sm text-[var(--gris)]">Todo lo contratado en Donweb (29 dominios, 11 certificados SSL, el plan revendedor y sus 31 cuentas de hosting) está en <strong>Activos digitales</strong>, con cliente, vencimiento y costo, y las facturas de Donweb están en Finanzas. Las renovaciones de los próximos 30 días aparecen en el Tablero de dirección. Donweb no tiene API pública, así que los cambios nuevos se cargan a mano en Activos.</p>
        <div><Link href="/activos" className="btn-s">Ver activos digitales</Link></div>
      </section>
    </div>
  )
}
