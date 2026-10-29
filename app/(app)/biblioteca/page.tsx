import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { validarEmail } from "@/lib/demos"
import { docs, publicar, crearEnvio, mandarEnvio, mensajeWA, linkEnvio, peso, type Version, type Envio } from "@/lib/biblioteca"
import Copiar from "@/components/Copiar"
import SubirVersion from "@/components/SubirVersion"

export const dynamic = "force-dynamic"

function vuelta(p: Record<string, string | number>): never {
  redirect("/biblioteca?" + new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)])).toString())
}

async function compartir(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const d = await one<any>("select * from bib_docs where id=$1", [Number(fd.get("doc"))])
  if (!d) vuelta({ err: "Documento no encontrado." })
  const canal = fd.get("canal") === "whatsapp" ? "whatsapp" : "email"
  if (d.confidencial && fd.get("confirmo") !== "on") vuelta({ err: `${d.titulo} es interno: marcá que la persona puede recibirlo.`, doc: d.id })
  let email: string | null = null
  if (canal === "email" || s(fd.get("email"))) {
    const v = await validarEmail(s(fd.get("email")))
    if (!v.ok) vuelta({ err: v.error, doc: d.id })
    else email = v.email
  }
  const ct = email ? await one<{ id: number; nombre: string }>("select id, nombre from db_contactos where lower(email)=$1 limit 1", [email]) : null
  const e = await crearEnvio({ docId: d.id, email, nombre: s(fd.get("nombre")) ?? ct?.nombre ?? null, canal, dias: Number(fd.get("dias")) || (d.confidencial ? 7 : 30), por: u.nombre, contactoId: ct?.id ?? null })
  if (canal === "email") {
    const r = await mandarEnvio(e, d, s(fd.get("nota")))
    await audit(u, "doc_compartido", "bib_envios", e.id, `${d.slug} email`)
    vuelta({ ok: r.ok ? `${d.titulo} enviado a ${email}` : `Link creado, pero el email falló: ${(r as any).error}`, doc: d.id })
  }
  await audit(u, "doc_compartido", "bib_envios", e.id, `${d.slug} whatsapp`)
  vuelta({ ok: "Link creado: copiá el mensaje y mandalo por WhatsApp.", doc: d.id, nuevo: e.id })
}

async function publicarV(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  await publicar(id)
  await audit(u, "doc_version_publicada", "bib_versiones", id)
  revalidatePath("/biblioteca")
}

async function descartarV(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  await q("delete from bib_versiones where id=$1 and estado='borrador'", [id])
  await audit(u, "doc_version_descartada", "bib_versiones", id)
  revalidatePath("/biblioteca")
}

async function revocar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  await q("update bib_envios set revocado=true where id=$1", [id])
  await audit(u, "doc_link_revocado", "bib_envios", id)
  revalidatePath("/biblioteca")
}

const ESTADO: Record<Version["estado"], string> = { vigente: "bg-emerald-50 text-emerald-700", borrador: "bg-amber-50 text-amber-700", anterior: "bg-[#EEF0F3] text-[#4A515C]" }

export default async function Biblioteca({ searchParams: sp }: { searchParams: { ok?: string; err?: string; doc?: string; nuevo?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const [lista, versiones, envios] = await Promise.all([
    docs(),
    q<Version>("select id, doc_id, version, notas, nombre, mime, tamano, partes, completo, estado, subido_por, creado, publicado from bib_versiones where completo order by version desc"),
    q<Envio>("select * from bib_envios order by creado desc limit 300"),
  ])
  const nuevo = sp.nuevo ? envios.find((e) => e.id === Number(sp.nuevo)) : null
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Documentos de la empresa</h1>
        <p className="m-0 text-sm text-[#4A515C]">El manual general, la presentación institucional y los manuales por rol, siempre en su última versión. Se comparten con un link personal que vence, se puede revocar y avisa cuando lo abren. El link siempre abre la versión vigente: si subís una nueva, los links ya enviados la muestran sola. Los manuales son internos y nunca llevan usuarios ni contraseñas.</p>
      </div>
      {sp.ok && <p className="m-0 text-sm text-emerald-700" role="status">{sp.ok}</p>}
      {sp.err && <p className="m-0 text-sm text-rojo" role="alert">{sp.err}</p>}

      {lista.map((d) => {
        const vs = versiones.filter((v) => v.doc_id === d.id)
        const vig = vs.find((v) => v.estado === "vigente")
        const es = envios.filter((e) => e.doc_id === d.id)
        const abiertos = es.filter((e) => e.visitas > 0).length
        return (
          <section key={d.id} id={`doc-${d.id}`} className="card flex flex-col gap-4" aria-labelledby={`t-${d.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`t-${d.id}`} className="m-0 text-lg">{d.titulo}</h2>
                  <span className={`chip ${d.confidencial ? "bg-red-50 text-rojo" : "bg-sky-50 text-sky-700"}`}>{d.confidencial ? "Interno · confidencial" : "Para compartir"}</span>
                </div>
                {d.descripcion && <p className="m-0 mt-1 text-sm text-[#4A515C]">{d.descripcion}</p>}
                <p className="m-0 mt-1 text-sm">{vig ? <>Vigente: <strong>versión {vig.version}</strong> · {fecha(vig.publicado ?? vig.creado)} · {peso(vig.tamano)}</> : <span className="text-amber-700">Todavía no hay versión publicada.</span>}{es.length ? ` · ${es.length} links, ${abiertos} abiertos` : ""}</p>
              </div>
              {vig && <a href={`/api/biblioteca/archivo/${vig.id}`} target="_blank" rel="noopener noreferrer" className="btn-s">Ver vigente</a>}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-bold">Compartir</h3>
                {vig ? (
                  <form action={compartir} className="flex flex-col gap-2">
                    <input type="hidden" name="doc" value={d.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="email" type="email" className="inp !py-1.5" placeholder="Email" aria-label="Email" autoComplete="off" />
                      <input name="nombre" className="inp !py-1.5" placeholder="Nombre" aria-label="Nombre" />
                    </div>
                    <input name="nota" className="inp !py-1.5" placeholder="Mensaje del email (opcional)" aria-label="Mensaje" />
                    <label className="flex items-center gap-2 text-sm">Vence en <input name="dias" type="number" min={1} max={180} defaultValue={d.confidencial ? 7 : 30} className="inp !py-1 !w-20" /> días</label>
                    {d.confidencial && <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmo" className="mt-1" /> Confirmo que esta persona puede recibir un documento interno de DEVISEBIT.</label>}
                    <div className="flex flex-wrap gap-2">
                      <button name="canal" value="email" className="btn-p !py-1.5">Mandar por email</button>
                      <button name="canal" value="whatsapp" className="btn-s !py-1.5">Crear link para WhatsApp</button>
                    </div>
                  </form>
                ) : <p className="m-0 text-sm text-[#4A515C]">Subí una versión para poder compartirlo.</p>}
                {nuevo && nuevo.doc_id === d.id && (
                  <div className="rounded-lg border border-[#E2E5EA] p-3 flex flex-col gap-2">
                    <p className="m-0 text-sm break-all">{linkEnvio(nuevo)}</p>
                    <div className="flex gap-1.5"><Copiar texto={mensajeWA(nuevo, d)} etiqueta="Copiar mensaje WhatsApp" /><Copiar texto={linkEnvio(nuevo)} etiqueta="Copiar link" /></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-bold">Subir versión nueva</h3>
                <SubirVersion doc={d.id} />
              </div>
            </div>

            {vs.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">Versiones ({vs.length})</summary>
                <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-1.5">
                  {vs.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-[#E2E5EA] pb-1.5">
                      <strong>v{v.version}</strong>
                      <span className={`chip ${ESTADO[v.estado]}`}>{v.estado}</span>
                      <span className="text-[#4A515C]">{fecha(v.creado)} · {v.subido_por ?? "—"} · {peso(v.tamano)}{v.notas ? ` · ${v.notas}` : ""}</span>
                      <span className="ml-auto flex gap-1.5">
                        <a href={`/api/biblioteca/archivo/${v.id}`} target="_blank" rel="noopener noreferrer" className="btn-s !py-1 !px-3 !text-xs">Ver</a>
                        {v.estado !== "vigente" && <form action={publicarV}><input type="hidden" name="id" value={v.id} /><button className="btn-s !py-1 !px-3 !text-xs">Hacer vigente</button></form>}
                        {v.estado === "borrador" && <form action={descartarV}><input type="hidden" name="id" value={v.id} /><button className="btn-s !py-1 !px-3 !text-xs">Descartar</button></form>}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {es.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">Links enviados ({es.length})</summary>
                <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-1.5">
                  {es.map((e) => {
                    const activo = !e.revocado && new Date(e.expira) > new Date()
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-[#E2E5EA] pb-1.5">
                        <span className="min-w-[180px] flex-1">{e.nombre ?? e.email ?? "Link"}{e.email && e.nombre ? ` · ${e.email}` : ""}</span>
                        <span className="text-[#4A515C]">{e.canal} · {fecha(e.creado)} · {e.visitas ? `abierto ${e.visitas}× (último ${fecha(e.ultima)})${e.descargas ? `, ${e.descargas} descargas` : ""}` : "sin abrir"} · {e.revocado ? "revocado" : activo ? `vence ${fecha(e.expira)}` : "vencido"}</span>
                        {activo && <span className="flex gap-1.5"><Copiar texto={linkEnvio(e)} etiqueta="Copiar link" /><form action={revocar}><input type="hidden" name="id" value={e.id} /><button className="btn-s !py-1 !px-3 !text-xs">Revocar</button></form></span>}
                      </li>
                    )
                  })}
                </ul>
              </details>
            )}
          </section>
        )
      })}
    </div>
  )
}
