import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir, puede } from "@/lib/auth"
import BotonConfirmar from "@/components/BotonConfirmar"
import { q, one, audit } from "@/lib/db"
import { horario, guardarHorario, gcalConfig, guardarGcalUrl, probarGcal, turnosLibres, leerFranjas, type HorarioAgenda } from "@/lib/agenda"
import { eventosCalendario } from "@/lib/integraciones"
import { URL_SISTEMA } from "@/lib/brief"
import Copiar from "@/components/Copiar"
import { codigoVigente, datosBot, desvincularTodo, enviarTelegram, estadoTelegram, fijarActivo, generarCodigo, registrarWebhook } from "@/lib/telegram"

export const dynamic = "force-dynamic"
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const h: HorarioAgenda = {
    dias: fd.getAll("dias").map(Number).filter((n) => n >= 0 && n <= 6),
    franjas: leerFranjas(String(fd.get("franjas") ?? "")),
    duracion: [15, 20, 30, 45, 60, 90].includes(Number(fd.get("duracion"))) ? Number(fd.get("duracion")) : 30,
    anticipacion: Math.max(0, Math.min(72, Number(fd.get("anticipacion")) || 2)),
    bloqueos: String(fd.get("bloqueos") ?? "").split(/[\s,;]+/).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
  }
  if (!h.dias.length) redirect("/agenda?e=" + encodeURIComponent("Elegí al menos un día."))
  if (!h.franjas.length) redirect("/agenda?e=" + encodeURIComponent("Cargá al menos una franja, por ejemplo 09:00-11:00."))
  await guardarHorario(h)
  await q("insert into config(clave,valor) values ('avisos_email',$1) on conflict (clave) do update set valor=excluded.valor", [fd.get("avisos_email") === "on" ? "si" : "no"])
  await audit(u, "edita_agenda", "config", 0, JSON.stringify(h))
  revalidatePath("/agenda")
  redirect("/agenda?ok=1")
}

async function eliminarReunion(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  if (id) {
    await q("delete from db_reuniones where id=$1", [id])
    await audit(u, "elimina_reunion", "db_reunion", id)
  }
  revalidatePath("/agenda")
  redirect("/agenda")
}

async function conectarGcal(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const url = String(fd.get("url") ?? "").trim()
  if (url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) redirect("/agenda?e=" + encodeURIComponent("La URL tiene que ser la de la aplicación web: https://script.google.com/macros/s/…/exec"))
  await guardarGcalUrl(url)
  await audit(u, "conecta_gcal", "config", 0, url ? "conectado" : "desconectado")
  if (!url) redirect("/agenda?ok=1")
  const t = await probarGcal()
  redirect(t.ok ? "/agenda?ok=" + encodeURIComponent("Google Calendar conectado") : "/agenda?e=" + encodeURIComponent(`Google no respondió bien (${t.error}). Revisá que la implementación sea "Cualquier persona" y que hayas autorizado el calendario.`))
}

async function conectarTelegram() {
  "use server"
  const u = await requerir(["gerente"])
  const w = await registrarWebhook()
  if (!w.ok) redirect("/agenda?e=" + encodeURIComponent(`Telegram no aceptó la conexión: ${w.error}`))
  await generarCodigo()
  await audit(u, "conecta_telegram", "config", 0, "webhook + código")
  revalidatePath("/agenda")
  redirect("/agenda?ok=" + encodeURIComponent("Bot conectado. Ahora mandale al bot el comando que aparece abajo."))
}
async function probarTelegram() {
  "use server"
  await requerir(["gerente"])
  const r = await enviarTelegram({ titulo: "Prueba de avisos ✅", cuerpo: "Si lees esto, Telegram está bien conectado al sistema de DEVISEBIT.", url: "/agenda" })
  redirect(r.ok ? "/agenda?ok=" + encodeURIComponent("Te mandé la prueba a Telegram.") : "/agenda?e=" + encodeURIComponent(`No salió la prueba: ${r.error ?? "error"}`))
}
async function ajustarTelegram(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const op = String(fd.get("op"))
  if (op === "pausar") await fijarActivo(false)
  if (op === "activar") await fijarActivo(true)
  if (op === "desvincular") await desvincularTodo()
  await audit(u, "ajusta_telegram", "config", 0, op)
  revalidatePath("/agenda")
  redirect("/agenda?ok=1")
}

export default async function Agenda({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const uAg = await requerir(["gerente", "coordinacion"])
  const adm = puede.admin(uAg)
  const esJulio = uAg.rol === "gerente"
  const tg = esJulio ? await estadoTelegram() : null
  const tgCodigo = esJulio ? await codigoVigente() : null
  const tgBot = esJulio && tg?.bot ? await datosBot() : null
  const [h, av, prox, libres, gc] = await Promise.all([
    horario(),
    one<{ valor: string }>("select valor from config where clave='avisos_email'"),
    q<any>("select r.id rid, r.inicio, r.modalidad, c.nombre, c.organizacion, c.id cid from db_reuniones r left join consultas c on c.id=r.consulta_id where r.estado='confirmada' and r.inicio > now() order by r.inicio limit 8"),
    turnosLibres(3),
    gcalConfig(),
  ])
  const cal = await eventosCalendario(14).catch(() => ({ eventos: [], ok: false, cuando: null }))
  const link = `${URL_SISTEMA}/agendar`
  const gcal = !!gc.url
  const fmt = (d: string) => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Agenda y avisos</h1>
        <p className="m-0 text-sm text-[#4A515C]">Los horarios en los que los clientes pueden reservar una reunión, sin Calendly: el bot ofrece estos turnos por WhatsApp y el link general sirve para la web, las firmas de email y las redes.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm font-semibold text-[#0B7A3B]">{searchParams.ok === "1" ? "Guardado." : searchParams.ok}</p>}
      {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-[#C8231F]">{searchParams.e}</p>}
      <section className="card text-sm flex flex-col gap-2">
        <strong>Link para agendar</strong>
        <div className="flex flex-wrap items-center gap-2"><a href={link} target="_blank" className="underline break-all">{link}</a><Copiar texto={link} etiqueta="Copiar link" /></div>
        <span className="text-[#4A515C]">Cada consulta tiene además su link propio, que el bot manda solo cuando el cliente quiere una reunión.</span>
      </section>
      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset className="md:col-span-2 border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="lbl mb-1">Días que se puede reservar</legend>
          <div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 0].map((d) => <label key={d} className="flex items-center gap-1 text-sm"><input type="checkbox" name="dias" value={d} defaultChecked={h.dias.includes(d)} /> {DIAS[d]}</label>)}</div>
        </fieldset>
        <label className="lbl md:col-span-2">Franjas horarias en las que se ofrecen turnos · separadas por coma
          <input name="franjas" defaultValue={h.franjas.join(", ")} placeholder="09:00-11:00, 14:00-15:00, 17:00-18:00" className="inp" />
        </label>
        <label className="lbl">Duración de la reunión
          <select name="duracion" defaultValue={h.duracion} className="inp">{[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutos</option>)}</select>
        </label>
        <label className="lbl">Anticipación mínima (horas)<input type="number" name="anticipacion" min={0} max={72} defaultValue={h.anticipacion} className="inp" /></label>
        <label className="lbl md:col-span-2">Días bloqueados (feriados, vacaciones) · formato AAAA-MM-DD, separados por coma
          <input name="bloqueos" defaultValue={h.bloqueos.join(", ")} placeholder="2026-11-20, 2026-12-08" className="inp" />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="avisos_email" defaultChecked={av?.valor !== "no"} /> Mandar también por email los avisos del sistema (consultas nuevas, piden una persona, reuniones agendadas, formularios). Llegan al email de cada usuario de Dirección y Coordinación.</label>
        <button className="btn-p md:col-span-2 justify-self-start">Guardar</button>
      </form>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">Próximas reuniones</h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {prox.map((r: any, i: number) => <li key={i} className="border-b border-[#EEF0F3] pb-1"><a href={`/consultas/${r.cid}`} className="font-semibold">{fmt(r.inicio)}</a> · {r.nombre ?? "Cliente"}{r.organizacion ? ` (${r.organizacion})` : ""} · {r.modalidad}{adm && <form className="inline-block ml-2"><input type="hidden" name="id" value={r.rid} /><BotonConfirmar chico accion={eliminarReunion} mensaje="¿Eliminar esta reunión reservada? Si está en tu Google Calendar, ese evento hay que borrarlo a mano.">Eliminar</BotonConfirmar></form>}</li>)}
            {!prox.length && <li className="text-[#4A515C]">No hay reuniones reservadas por clientes.</li>}
          </ul>
          <h3 className="m-0 mt-2 text-sm">En tu Google Calendar · 14 días</h3>
          {cal.ok ? (
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {cal.eventos.filter((e) => !e.todoElDia).slice(0, 12).map((e) => <li key={e.id} className="border-b border-[#EEF0F3] pb-1"><span className="font-semibold">{fmt(e.inicio)}</span> · {e.titulo}{e.meet && <> · <a href={e.meet} target="_blank" rel="noopener noreferrer" className="underline">Meet</a></>}</li>)}
              {!cal.eventos.length && <li className="text-[#4A515C]">Nada agendado.</li>}
            </ul>
          ) : <p className="m-0 text-[#4A515C]">Para ver acá todo tu calendario, actualizá el conector a la versión 2 en <a href="/integraciones" className="underline">Integraciones</a>.</p>}
          <h3 className="m-0 mt-2 text-sm">Turnos libres de los próximos días</h3>
          {libres.map((d) => <p key={d.fecha} className="m-0"><strong>{d.etiqueta}:</strong> {d.turnos.map((t) => t.hora).join(" · ") || "sin turnos"}</p>)}
        </div>
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">Google Calendar {gcal ? <span className="chip bg-emerald-100 text-emerald-800">conectado</span> : <span className="chip bg-amber-100 text-amber-800">sin conectar</span>}</h2>
          <p className="m-0 text-[#4A515C]">Conectado, el sistema no ofrece horarios en los que ya tengas algo en tu Google Calendar y cada reunión reservada se crea sola en tu calendario, con invitación al cliente.</p>
          {!gcal && <ol className="m-0 pl-5 flex flex-col gap-1">
            <li>Entrá a <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener noreferrer" className="underline">script.google.com</a> con la cuenta de Google del calendario y creá un proyecto nuevo (ponele de nombre «Agenda DEVISEBIT»).</li>
            <li>Borrá lo que trae y pegá el código de <a href="/agenda/script" target="_blank" className="underline">este archivo</a> (ya trae la clave puesta, no hay que cambiar nada). Guardá. Es el conector completo: Calendar, Drive y Gmail.</li>
            <li>Implementar → Nueva implementación → tipo «Aplicación web» · Ejecutar como: yo · Quién tiene acceso: cualquier persona → Implementar. Autorizá el acceso a tu calendario.</li>
            <li>Copiá la «URL de la aplicación web» y pegala acá abajo.</li>
          </ol>}
          <form action={conectarGcal} className="flex flex-wrap gap-2 items-end">
            <label className="lbl grow">URL de la aplicación web<input name="url" defaultValue={gc.url} placeholder="https://script.google.com/macros/s/…/exec" className="inp" /></label>
            <button className="btn-s">{gcal ? "Guardar y probar" : "Conectar"}</button>
          </form>
        </div>
      </section>
      {tg && (
        <section className="card text-sm flex flex-col gap-3">
          <h2 className="m-0 text-base">Telegram {tg.bot && tg.chats > 0 ? (tg.activo ? <span className="chip bg-emerald-100 text-emerald-800">avisando</span> : <span className="chip bg-amber-100 text-amber-800">en pausa</span>) : <span className="chip bg-amber-100 text-amber-800">sin conectar</span>}</h2>
          <p className="m-0 text-[#4A515C]">Todo lo que entra al sistema te llega a Telegram: consultas por WhatsApp, Instagram, web y portal, reuniones, pagos y compras, la Academia, lo que pasa en la Oficina (propuestas, tareas, agentes que fallan o te necesitan), cargas del Panel y los correos nuevos de tus casillas. Lo terminado llega en silencio; lo que necesita tu atención, con sonido.</p>
          {!tg.bot && <ol className="m-0 pl-5 flex flex-col gap-1">
            <li>En Telegram abrí <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a>, mandá <code>/newbot</code> y elegí nombre y usuario (por ejemplo «DEVISEBIT Avisos»). Te da un token.</li>
            <li>En Vercel, proyecto <strong>devisebit-sistema</strong> → Settings → Environment Variables, cargá <code>TELEGRAM_BOT_TOKEN</code> con ese token y volvé a desplegar.</li>
            <li>Volvé acá y tocá «Conectar bot».</li>
          </ol>}
          {tg.bot && <p className="m-0">Bot: {tgBot?.usuario ? <strong>@{tgBot.usuario}</strong> : <span className="text-[#C8231F]">{tgBot?.error ?? "no responde"}</span>} · Chats vinculados: <strong>{tg.chats}</strong>{tg.ultimo && <> · Último aviso: {tg.ultimo.ok ? "salió bien" : <span className="text-[#C8231F]">falló ({tg.ultimo.error})</span>} ({fmt(tg.ultimo.cuando)})</>}</p>}
          {tgCodigo && <p className="m-0 rounded-md bg-[#F5F6F8] p-3">Abrí el bot en Telegram y mandale: <strong className="select-all">/vincular {tgCodigo}</strong> <span className="text-[#4A515C]">(vale 15 minutos)</span></p>}
          <div className="flex flex-wrap gap-2">
            {tg.bot && <form action={conectarTelegram}><button className="btn-s">{tg.chats > 0 ? "Vincular otro chat" : "Conectar bot"}</button></form>}
            {tg.bot && tg.chats > 0 && <form action={probarTelegram}><button className="btn-s">Mandar prueba</button></form>}
            {tg.chats > 0 && <form action={ajustarTelegram}><input type="hidden" name="op" value={tg.activo ? "pausar" : "activar"} /><button className="btn-s">{tg.activo ? "Pausar avisos" : "Reactivar avisos"}</button></form>}
            {tg.chats > 0 && <form><input type="hidden" name="op" value="desvincular" /><BotonConfirmar chico accion={ajustarTelegram} mensaje="¿Desvincular todos los chats de Telegram? Dejás de recibir avisos hasta volver a vincular.">Desvincular chats</BotonConfirmar></form>}
          </div>
          <details className="text-[#4A515C]">
            <summary className="cursor-pointer font-semibold text-[#0E1116]">Correos nuevos a Telegram (casillas que reenvían a tu Gmail)</summary>
            <ol className="m-0 mt-2 pl-5 flex flex-col gap-1">
              <li>Actualizá el conector de Google: pegá el código de <a href="/agenda/script" target="_blank" className="underline">este archivo</a> en tu proyecto de Apps Script (ahora es la versión 3) y guardá. La URL de implementación sigue siendo la misma: usá «Administrar implementaciones → editar → Nueva versión».</li>
              <li>En el editor elegí la función <code>instalarAvisosDeCorreo</code> y tocá Ejecutar. Autorizá Gmail y conexiones externas. Se hace una sola vez.</li>
              <li>Desde ahí, cada 5 minutos revisa tu bandeja y manda a Telegram los correos no leídos que no sean promociones, redes ni notificaciones automáticas. Como info@devisebit.com y devisebit66@gmail.com reenvían a esa casilla, entran todas; el aviso dice a qué casilla llegó.</li>
            </ol>
          </details>
        </section>
      )}
      <section className="card text-sm flex flex-wrap items-center justify-between gap-2">
        <span>El perfil de WhatsApp (foto, descripción, webs) se edita en <a href="/whatsapp-business" className="underline font-semibold">WhatsApp Business</a>.</span>
      </section>
    </div>
  )
}
