import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { fechaHora } from "@/lib/consultas"
import { BOTS } from "@/lib/bots/conocimiento"
import { modoBot } from "@/lib/bot"

export const dynamic = "force-dynamic"

function empresaDe(_rol?: string, _pedida?: string) {
  return "sanpatricio" as const
}

async function agregar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, String(fd.get("e")))
  const respuesta = s(fd.get("respuesta"))
  if (respuesta) {
    await q("insert into bot_conocimiento(empresa,pregunta,respuesta,origen,creado_por) values ($1,$2,$3,'manual',$4)", [e, s(fd.get("pregunta")), respuesta, u.nombre])
    await audit(u, "bot_ensenar", "bot", e)
  }
  redirect(`/bot?e=${e}&ok=1`)
}

async function modo(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, String(fd.get("e")))
  const m = String(fd.get("modo"))
  if (["siempre", "fuera_horario", "nunca"].includes(m)) await q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [`bot_modo_${e}`, m])
  await audit(u, "bot_modo", "bot", e, m)
  redirect(`/bot?e=${e}`)
}

async function cambiar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const e = empresaDe(u.rol, String(fd.get("e")))
  if (fd.get("a") === "guardar") await q("update bot_conocimiento set pregunta=$1, respuesta=$2 where id=$3 and empresa=$4", [s(fd.get("pregunta")), s(fd.get("respuesta")) ?? "", id, e])
  else await q("update bot_conocimiento set activo = not activo where id=$1 and empresa=$2", [id, e])
  await audit(u, "bot_conocimiento_" + fd.get("a"), "bot", id)
  redirect(`/bot?e=${e}`)
}

export default async function Bot({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, searchParams.e)
  const rows = await q<any>("select * from bot_conocimiento where empresa=$1 order by activo desc, id desc", [e])
  const stats = await q<{ autor: string; n: number }>("select autor, count(*)::int n from wa_mensajes where empresa=$1 and creado > now() - interval '30 days' group by autor", [e])
  const st = Object.fromEntries(stats.map((x) => [x.autor, x.n]))
  const ia = !!process.env.ANTHROPIC_API_KEY
  const md = await modoBot(e as "sanpatricio")
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Bot · Conocimiento</h1>
          <p className="m-0 text-sm text-[#4F5C69]">Todo lo que el equipo le enseña al asistente de WhatsApp de {BOTS[e as "sanpatricio"].nombre}. Lo usa en cada respuesta.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4F5C69]">Mensajes recibidos (30 días)</div><div className="text-2xl font-extrabold">{st.cliente ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4F5C69]">Respondió el bot</div><div className="text-2xl font-extrabold">{st.bot ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4F5C69]">Respondió el equipo</div><div className="text-2xl font-extrabold">{st.equipo ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4F5C69]">Inteligencia artificial</div><div className={`text-lg font-extrabold ${ia ? "text-[#0B7A3B]" : "text-amber-700"}`}>{ia ? "Activa" : "Sin activar"}</div></div>
      </div>

      <form action={modo} className="card flex flex-col gap-3">
        <input type="hidden" name="e" value={e} />
        <h2 className="m-0 text-base">¿Cuándo responde el bot?</h2>
        <div className="flex flex-col gap-2 text-sm">
          {[["siempre", "Siempre", "Responde todos los mensajes al instante. Si alguien del equipo contesta (desde el sistema o desde el celular), el bot se corre 24 h en ese chat."],
            ["fuera_horario", "Solo fuera del horario de atención", "De lunes a viernes de 8 a 20 h responde el equipo (el bot solo registra y avisa); de noche y fines de semana atiende el bot."],
            ["nunca", "Nunca (solo registra y avisa)", "No responde: guarda cada conversación en el CRM y manda la notificación."]].map(([v, t, d]) => (
            <label key={v} className="flex gap-2 items-start"><input type="radio" name="modo" value={v} defaultChecked={md === v} className="mt-1" /><span><strong>{t}</strong><span className="block text-[#4F5C69]">{d}</span></span></label>
          ))}
        </div>
        <div><button className="btn-s">Guardar</button></div>
      </form>

      <form action={agregar} className="card flex flex-col gap-3">
        <input type="hidden" name="e" value={e} />
        <h2 className="m-0 text-base">Enseñarle algo nuevo</h2>
        <p className="m-0 text-sm text-[#4F5C69]">Escribilo como se lo explicarías a una persona nueva del equipo. También podés enseñarle desde cualquier conversación del CRM, con el botón "Enseñar al bot" debajo de una respuesta tuya.</p>
        <label className="lbl">Cuando pregunten… (opcional)<input name="pregunta" className="inp" placeholder="Ej.: ¿Atienden los fines de semana?" /></label>
        <label className="lbl">El bot tiene que saber / responder…<textarea name="respuesta" rows={3} required className="inp" placeholder="Ej.: Las visitas se programan de lunes a sábado; los domingos solo urgencias coordinadas." /></label>
        <div><button className="btn-p">Guardar</button>{searchParams.ok && <span className="ml-3 text-sm text-[#0B5E31]">Guardado. El bot ya lo usa.</span>}</div>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base">Lo que ya sabe ({rows.filter((r) => r.activo).length})</h2>
        {rows.map((r) => (
          <details key={r.id} className={`card ${r.activo ? "" : "opacity-50"}`}>
            <summary className="cursor-pointer">
              <strong>{r.pregunta ?? "Información general"}</strong>
              <div className="text-sm text-[#33414F] whitespace-pre-line">{r.respuesta}</div>
              <div className="text-xs text-[#4F5C69] mt-1">{r.origen === "conversacion" ? "Aprendido de una conversación" : "Cargado a mano"} · {r.creado_por ?? "—"} · {fechaHora(r.creado)}{r.activo ? "" : " · desactivado"}</div>
            </summary>
            <form action={cambiar} className="flex flex-col gap-2 mt-3">
              <input type="hidden" name="id" value={r.id} /><input type="hidden" name="e" value={e} />
              <input name="pregunta" defaultValue={r.pregunta ?? ""} className="inp" placeholder="Cuando pregunten…" />
              <textarea name="respuesta" defaultValue={r.respuesta} rows={3} className="inp" />
              <div className="flex gap-2">
                <button name="a" value="guardar" className="btn-s py-1.5">Guardar cambios</button>
                <button name="a" value="toggle" className="btn-s py-1.5">{r.activo ? "Desactivar" : "Activar"}</button>
              </div>
            </form>
          </details>
        ))}
        {!rows.length && <p className="text-sm text-[#4F5C69]">Todavía no le enseñaron nada. Hoy responde con la información base de la empresa.</p>}
      </section>
    </div>
  )
}
