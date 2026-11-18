import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { audit } from "@/lib/db"
import { modelos, guardarModelos, esBase, BASE, VARIABLES, type Modelo } from "@/lib/modelos"

export const dynamic = "force-dynamic"

const ir = (m: string, ok = true) => redirect(`/modelos?${ok ? "ok" : "e"}=${encodeURIComponent(m)}`)

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const t = (k: string, n: number) => String(fd.get(k) ?? "").replace(/\r/g, "").trim().slice(0, n)
  const lista = await modelos()
  const acc = String(fd.get("acc") ?? "guardar")
  let id = t("id", 60)
  if (acc === "borrar") {
    if (esBase(id)) ir("Los modelos de base no se borran; se pueden volver al original.", false)
    await guardarModelos(lista.filter((m) => m.id !== id))
    await audit(u, "modelo_borra", "config", 0, id)
    revalidatePath("/modelos"); ir("Modelo eliminado.")
  }
  if (acc === "original" && esBase(id)) {
    await guardarModelos(lista.map((m) => (m.id === id ? BASE.find((b) => b.id === id)! : m)))
    revalidatePath("/modelos"); ir("Modelo vuelto al texto original.")
  }
  const m: Modelo = { id, nombre: t("nombre", 80), canal: fd.get("canal") === "whatsapp" ? "whatsapp" : "email", asunto: t("asunto", 150), cuerpo: t("cuerpo", 1700) }
  if (!m.nombre || !m.cuerpo) ir("Falta el nombre o el texto del modelo.", false)
  if (m.canal === "email" && !m.asunto) ir("Un modelo de email necesita asunto.", false)
  if (!id) { id = m.id = "m" + Date.now().toString(36); lista.push(m) }
  else if (esBase(id)) m.canal = BASE.find((b) => b.id === id)!.canal
  await guardarModelos(lista.map((x) => (x.id === id ? m : x)))
  await audit(u, "modelo_guarda", "config", 0, m.nombre)
  revalidatePath("/modelos"); ir(`«${m.nombre}» guardado.`)
}

function Form({ m }: { m: Modelo | null }) {
  const base = !!m && esBase(m.id)
  return (
    <form action={guardar} className="card flex flex-col gap-3">
      <input type="hidden" name="id" value={m?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <label className="lbl">Nombre del modelo<input name="nombre" className="inp" defaultValue={m?.nombre ?? ""} placeholder="Ej.: Presupuesto enviado, sin respuesta" required maxLength={80} /></label>
        <label className="lbl">Canal
          <select name="canal" className="inp" defaultValue={m?.canal ?? "email"} disabled={base}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
        </label>
      </div>
      {(!m || m.canal === "email") && <label className="lbl">Asunto (solo email)<input name="asunto" className="inp" defaultValue={m?.asunto ?? ""} maxLength={150} /></label>}
      <label className="lbl">Mensaje<textarea name="cuerpo" className="inp font-[inherit]" rows={m ? Math.min(18, Math.max(6, m.cuerpo.split("\n").length + 2)) : 8} defaultValue={m?.cuerpo ?? ""} required maxLength={1700} /></label>
      <div className="flex flex-wrap gap-2">
        <button name="acc" value="guardar" className="btn-p py-2 px-4 text-sm">{m ? "Guardar cambios" : "Agregar modelo"}</button>
        {base && <button name="acc" value="original" formNoValidate className="btn-s py-2 px-4 text-sm">Volver al texto original</button>}
        {m && !base && <button name="acc" value="borrar" formNoValidate className="btn-s py-2 px-4 text-sm">Eliminar</button>}
      </div>
    </form>
  )
}

export default async function Modelos({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const lista = await modelos()
  return (
    <div className="flex flex-col gap-5 max-w-[860px]">
      <header>
        <h1 className="m-0">Modelos de mensaje</h1>
        <p className="m-0 mt-1 text-sm text-[#4A515C]">Textos listos para reutilizar. Se aplican desde la ficha de una consulta («Mensaje con modelo») y quedan en Acercamientos para revisar y enviar.</p>
      </header>
      {searchParams.ok && <p className="m-0 card !py-2 text-sm border-l-4 border-[#1E8E5A]" role="status">{searchParams.ok}</p>}
      {searchParams.e && <p className="m-0 card !py-2 text-sm border-l-4 border-[#C8231F]" role="alert">{searchParams.e}</p>}
      <section className="card text-sm">
        <strong>Datos que se completan solos</strong>
        <ul className="m-0 mt-1 pl-5">{VARIABLES.map(([v, d]) => <li key={v}><code>{v}</code>: {d}</li>)}</ul>
      </section>
      {lista.map((m) => <Form key={m.id + m.cuerpo.length} m={m} />)}
      <h2 className="m-0 text-lg">Nuevo modelo</h2>
      <Form m={null} />
    </div>
  )
}
