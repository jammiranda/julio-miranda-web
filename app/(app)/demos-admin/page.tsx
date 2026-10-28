import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { DEMOS, demoInfo, validarEmail, crearAcceso, enviarAcceso, linkAcceso } from "@/lib/demos"
import Copiar from "@/components/Copiar"

export const dynamic = "force-dynamic"

async function enviar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const v = await validarEmail(s(fd.get("email")))
  if (!v.ok) redirect(`/demos-admin?err=${encodeURIComponent(v.error)}`)
  const demos = fd.getAll("demos").map(String).filter((d) => demoInfo(d))
  if (!demos.length) redirect("/demos-admin?err=" + encodeURIComponent("Elegí al menos una demo."))
  const ct = await q<{ id: number; nombre: string }>("select id, nombre from db_contactos where lower(email)=$1 limit 1", [v.email])
  const a = await crearAcceso({ email: v.email, nombre: s(fd.get("nombre")) ?? ct[0]?.nombre ?? null, demos, blanca: fd.get("blanca") === "on", dias: Number(fd.get("dias")) || 14, origen: "equipo", por: u.nombre, contactoId: ct[0]?.id ?? null })
  const mandar = fd.get("mandar") === "on"
  const env = mandar ? await enviarAcceso(a) : { ok: true }
  await audit(u, "demo_enviada", "demo_acceso", a.id, `${demos.join(",")}${mandar ? "" : " (solo link)"}`)
  redirect(`/demos-admin?nuevo=${a.id}&ok=${encodeURIComponent(mandar ? (env.ok ? `Demo enviada a ${v.email}` : `Link creado, pero el email falló: ${(env as any).error}`) : "Link creado: copialo y mandalo por WhatsApp")}`)
}

async function revocar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  await q("update demo_accesos set revocado=true where id=$1", [id])
  await audit(u, "demo_revocada", "demo_acceso", id)
  revalidatePath("/demos-admin")
}

const fecha = (d: Date | string | null) => (d ? new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—")

export default async function DemosAdmin({ searchParams }: { searchParams: { ok?: string; err?: string; nuevo?: string; email?: string; nombre?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const [accesos, diag] = await Promise.all([
    q<any>("select * from demo_accesos order by creado desc limit 100").catch(() => []),
    q<any>("select id, nombre, email, organizacion, puntaje, nivel, enviado, creado, contacto_id from demo_diagnosticos order by creado desc limit 50").catch(() => []),
  ])
  const nuevo = searchParams.nuevo ? accesos.find((x: any) => String(x.id) === searchParams.nuevo) : null
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Demos</h1>
        <p className="m-0 text-sm text-[#4A515C]">Las demos no son públicas: cada persona recibe un link personal que vence. Las piden desde la web con su email, se las ofrece Bit por WhatsApp o se las mandás vos desde acá. El autodiagnóstico de transformación digital es público y deja el email al final.</p>
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p className="m-0 text-sm text-rojo">{searchParams.err}</p>}
      {nuevo && (
        <div className="card border-[#C8231F] flex flex-col gap-2">
          <strong>Link para {nuevo.email}</strong>
          <code className="break-all text-sm bg-[#F5F6F8] p-2 rounded-lg">{linkAcceso(nuevo)}</code>
          <div className="flex flex-wrap gap-2"><Copiar texto={linkAcceso(nuevo)} etiqueta="Copiar link" />
          <Copiar etiqueta="Copiar mensaje para WhatsApp" texto={`Hola${nuevo.nombre ? ` ${nuevo.nombre.split(" ")[0]}` : ""}! Te dejo ${nuevo.demos.length > 1 ? "las demos" : "la demo"} para que lo pruebes vos mismo, con datos de ejemplo: ${linkAcceso(nuevo)} (link personal, vale unos días). Cualquier duda me escribís 🙌`} /></div>
        </div>
      )}

      <form action={enviar} className="card grid gap-3 sm:grid-cols-2">
        <h2 className="m-0 text-base sm:col-span-2">Enviar demos a un cliente</h2>
        <label className="lbl">Email *<input name="email" type="email" required defaultValue={searchParams.email ?? ""} className="inp" autoComplete="off" /></label>
        <label className="lbl">Nombre<input name="nombre" defaultValue={searchParams.nombre ?? ""} className="inp" /></label>
        <fieldset className="sm:col-span-2 flex flex-col gap-2 border-0 p-0 m-0">
          <legend className="lbl mb-1">Demos</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DEMOS.map((d) => (
              <label key={d.slug} className="flex items-center gap-2 rounded-lg border border-[#E2E5EA] px-3 py-2 text-sm"><input type="checkbox" name="demos" value={d.slug} />{d.titulo}</label>
            ))}
          </div>
        </fieldset>
        <label className="lbl">Vence en<select name="dias" defaultValue="14" className="inp"><option value="3">3 días</option><option value="7">7 días</option><option value="14">14 días</option><option value="30">30 días</option></select></label>
        <div className="flex flex-col gap-2 justify-end text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="mandar" defaultChecked /> Mandarlo por email ahora</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="blanca" /> Marca blanca (para revendedores: sin DEVISEBIT)</label>
        </div>
        <button className="btn-p sm:col-span-2 sm:justify-self-start">Crear link</button>
      </form>

      <section className="card p-0 overflow-x-auto">
        <h2 className="m-0 px-5 pt-4 text-base">Links enviados</h2>
        <table className="tbl">
          <thead><tr><th>Para</th><th>Demos</th><th>Origen</th><th>Aperturas</th><th>Última vez</th><th>Vence</th><th></th></tr></thead>
          <tbody>
            {accesos.map((a: any) => {
              const vencido = a.revocado || new Date(a.expira) < new Date()
              return (
                <tr key={a.id} className={vencido ? "opacity-50" : ""}>
                  <td><strong>{a.nombre ?? "—"}</strong><div className="text-xs text-[#4A515C]">{a.email}{a.blanca ? " · marca blanca" : ""}</div></td>
                  <td className="text-xs">{a.demos.length === DEMOS.length ? "Todas" : a.demos.map((d: string) => demoInfo(d)?.titulo ?? d).join(", ")}</td>
                  <td className="text-xs">{String(a.origen ?? "").startsWith("web") ? "Web" : a.origen === "bot" ? "Bit (WhatsApp)" : a.creado_por ?? a.origen}</td>
                  <td>{a.visitas}{a.visitas > 0 && <div className="text-xs text-[#4A515C]">{Object.entries(a.vistas ?? {}).map(([k, v]) => `${demoInfo(k)?.titulo ?? k}: ${v}`).join(" · ")}</div>}</td>
                  <td>{fecha(a.ultima)}</td>
                  <td>{a.revocado ? "Revocado" : fecha(a.expira)}</td>
                  <td>{!vencido && <div className="flex flex-col gap-1"><Copiar texto={linkAcceso(a)} etiqueta="Copiar link" /><form action={revocar}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-rojo underline">Revocar</button></form></div>}</td>
                </tr>
              )
            })}
            {!accesos.length && <tr><td colSpan={7} className="text-center text-[#4A515C] py-6">Todavía no se envió ninguna demo.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-0 overflow-x-auto">
        <h2 className="m-0 px-5 pt-4 text-base">Autodiagnósticos (públicos)</h2>
        <table className="tbl">
          <thead><tr><th>Persona</th><th>Resultado</th><th>Email</th><th>Fecha</th></tr></thead>
          <tbody>
            {diag.map((d: any) => (
              <tr key={d.id}><td>{d.contacto_id ? <a href={`/contactos/${d.contacto_id}`} className="font-semibold underline">{d.nombre}</a> : <strong>{d.nombre}</strong>}<div className="text-xs text-[#4A515C]">{d.email}{d.organizacion ? ` · ${d.organizacion}` : ""}</div></td><td>{d.nivel} · {d.puntaje}/100</td><td>{d.enviado ? "Enviado" : "No se pudo enviar"}</td><td>{fecha(d.creado)}</td></tr>
            ))}
            {!diag.length && <tr><td colSpan={4} className="text-center text-[#4A515C] py-6">Todavía nadie completó el autodiagnóstico.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}
