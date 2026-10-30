import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s, fecha } from "@/lib/util"
import { URL_ACADEMIA } from "@/lib/academia"
import { PERFILES_DOCENTES, altaAutor, invitarAutor, revertirCambio, resolverPedidoEstado, CAMPOS_CURSO, CAMPOS_LECCION, diferencias } from "@/lib/autores"

export const dynamic = "force-dynamic"

const volver = (p: Record<string, string>) => redirect(`/sistema/autores?${new URLSearchParams(p).toString()}`)

async function alta(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const r = await altaAutor(String(fd.get("email") ?? ""), String(fd.get("slug") ?? ""), s(fd.get("nombre")), u)
  volver(r.ok ? { ok: "alta" } : { err: r.error })
}

async function autor(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const op = String(fd.get("op"))
  if (op === "invitar") {
    const r = await invitarAutor(id, u)
    volver(r.ok ? { ok: "invitado" } : { err: r.error ?? "No se pudo enviar" })
  }
  if (op === "activar" || op === "desactivar") {
    await q("update am_autores set activo=$1 where id=$2", [op === "activar", id])
    await audit(u, `autor_${op}`, "am_autor", id)
  }
  volver({ ok: op })
}

async function cambio(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const op = String(fd.get("op"))
  let r: { ok: boolean; error?: string } = { ok: true }
  if (op === "revisado") {
    await q("update am_cambios_autor set estado='revisado', revisado_por=$1, revisado_en=now() where id=$2 and estado='pendiente' and tipo<>'pedido_estado'", [u.usuario, id])
  } else if (op === "todos") {
    await q("update am_cambios_autor set estado='revisado', revisado_por=$1, revisado_en=now() where estado='pendiente' and tipo<>'pedido_estado'", [u.usuario])
  } else if (op === "revertir") r = await revertirCambio(id, u)
  else if (op === "aprobar" || op === "rechazar") r = await resolverPedidoEstado(id, op === "aprobar", u)
  volver(r.ok ? { ok: op } : { err: r.error ?? "No se pudo" })
}

const OK: Record<string, string> = {
  alta: "Autor dado de alta. Ya puede entrar con su email en el panel de autor (o mandale el acceso con el botón).",
  invitado: "Le mandamos el email con el acceso al panel de autor.",
  activar: "Autor activado.", desactivar: "Autor desactivado: ya no puede entrar al panel de autor.",
  revisado: "Cambio marcado como revisado.", todos: "Todos los cambios de contenido quedaron revisados.",
  revertir: "Cambio revertido.", aprobar: "Pedido aprobado: el estado del curso ya cambió.", rechazar: "Pedido rechazado.",
}
const corto = (v: any) => {
  const t = v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)
  return t.length > 400 ? t.slice(0, 400) + "…" : t
}

/** Sistema Academia · Autores: alta de docentes con acceso propio y revisión de lo que cambian en sus cursos. */
export default async function Autores({ searchParams }: { searchParams: { ok?: string; err?: string; ver?: string } }) {
  await requerir(["gerente"])
  const verTodo = searchParams.ver === "todo"
  const [autores, cambios] = await Promise.all([
    q<any>(`select a.*, k.portal_ultimo,
              (select count(*)::int from am_cursos c where a.docente_slug = any(string_to_array(replace(coalesce(c.docente_slug,''),' ',''),','))) cursos
            from am_autores a left join db_contactos k on lower(k.email)=lower(a.email) order by a.activo desc, a.docente_slug, a.email`),
    q<any>(`select x.*, c.titulo curso from am_cambios_autor x left join am_cursos c on c.id=x.curso_id
            ${verTodo ? "" : "where x.estado='pendiente'"} order by x.tipo='pedido_estado' desc, x.id desc limit 100`),
  ])
  const pedidos = cambios.filter((x) => x.tipo === "pedido_estado" && x.estado === "pendiente")
  const resto = cambios.filter((x) => !(x.tipo === "pedido_estado" && x.estado === "pendiente"))
  const pendContenido = resto.filter((x) => x.estado === "pendiente").length
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Autores (docentes)</h1>
        <p className="m-0 mt-1 text-sm text-[#4A515C]">
          Cada autor entra a <a href={`${URL_ACADEMIA}/autor`} className="underline" target="_blank" rel="noopener noreferrer">{URL_ACADEMIA.replace(/^https?:\/\//, "")}/autor</a> con su email (código o link, sin contraseña) y ve solo los cursos cuyo campo «Docentes» incluye su perfil.
          Edita textos, lecciones, quiz y materiales; no puede cambiar precio, docentes ni requisitos, y publicar o archivar es un pedido que aprobás acá. No entra al sistema ni al panel.
        </p>
      </div>
      {searchParams.ok && OK[searchParams.ok] && <p role="status" className="m-0 card py-3 text-sm !border-emerald-300">{OK[searchParams.ok]}</p>}
      {searchParams.err && <p role="alert" className="m-0 card py-3 text-sm !border-red-300 text-rojo">{searchParams.err}</p>}

      {pedidos.length > 0 && (
        <section className="card flex flex-col gap-2 !border-[#C8231F]" aria-labelledby="t-ped">
          <h2 id="t-ped" className="m-0 text-base">Pedidos de cambio de estado ({pedidos.length})</h2>
          <ul className="m-0 p-0 list-none flex flex-col">
            {pedidos.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[#EEF0F3] last:border-0 text-sm">
                <span><Link href={`/sistema/cursos/${x.curso_id}`} className="font-semibold hover:underline">{x.curso}</Link>: {x.antes?.estado} → <strong>{x.despues?.estado}</strong>{x.despues?.motivo ? ` · «${x.despues.motivo}»` : ""}<span className="block text-xs text-[#4A515C]">{x.autor} · {fecha(x.creado)}</span></span>
                <form action={cambio} className="flex gap-1"><input type="hidden" name="id" value={x.id} />
                  <button name="op" value="aprobar" className="btn-p py-1">Aprobar</button><button name="op" value="rechazar" className="btn-s py-1">Rechazar</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card flex flex-col gap-2" aria-labelledby="t-cam">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="t-cam" className="m-0 text-base">{verTodo ? "Últimos cambios de autores" : `Cambios para revisar (${pendContenido})`}</h2>
          <span className="flex gap-2 text-sm">
            <Link href={verTodo ? "/sistema/autores" : "/sistema/autores?ver=todo"} className="underline">{verTodo ? "Ver solo pendientes" : "Ver historial"}</Link>
            {pendContenido > 1 && <form action={cambio}><input type="hidden" name="id" value="0" /><button name="op" value="todos" className="btn-s py-1">Marcar todos como revisados</button></form>}
          </span>
        </div>
        {!resto.length && <p className="m-0 text-sm text-[#4A515C]">No hay cambios {verTodo ? "registrados" : "pendientes de revisión"}.</p>}
        <ul className="m-0 p-0 list-none flex flex-col">
          {resto.map((x) => {
            const campos = x.tipo === "curso" ? diferencias(x.antes, x.despues, CAMPOS_CURSO) : x.tipo === "leccion" ? diferencias(x.antes, x.despues, CAMPOS_LECCION) : []
            const revertible = ["curso", "leccion", "leccion_nueva"].includes(x.tipo) && ["pendiente", "revisado"].includes(x.estado)
            return (
              <li key={x.id} className="py-2 border-b border-[#EEF0F3] last:border-0 text-sm flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><Link href={`/sistema/cursos/${x.curso_id}${x.leccion_id && x.tipo !== "leccion_orden" ? `?editar=${x.leccion_id}#editor` : ""}`} className="font-semibold hover:underline">{x.curso}</Link> · {x.resumen}<span className="block text-xs text-[#4A515C]">{x.autor} · {fecha(x.creado)}{x.estado !== "pendiente" ? ` · ${x.estado}${x.revisado_por ? ` por ${x.revisado_por}` : ""}` : ""}</span></span>
                  {(x.estado === "pendiente" || revertible) && (
                    <form action={cambio} className="flex gap-1"><input type="hidden" name="id" value={x.id} />
                      {x.estado === "pendiente" && <button name="op" value="revisado" className="btn-s py-1">Revisado ✓</button>}
                      {revertible && <button name="op" value="revertir" className="btn-s py-1 text-rojo">{x.tipo === "leccion_nueva" ? "Borrar lección" : "Revertir"}</button>}
                    </form>
                  )}
                </div>
                {campos.length > 0 && (
                  <details className="text-xs"><summary className="cursor-pointer text-[#4A515C]">Ver antes y después ({campos.join(", ")})</summary>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-x-3 gap-y-1 mt-2">
                      <strong>Campo</strong><strong>Antes</strong><strong>Después</strong>
                      {campos.map((k) => [<span key={k}>{k}</span>, <span key={k + "a"} className="whitespace-pre-wrap break-words bg-red-50 p-1 rounded">{corto(x.antes?.[k])}</span>, <span key={k + "d"} className="whitespace-pre-wrap break-words bg-emerald-50 p-1 rounded">{corto(x.despues?.[k])}</span>])}
                    </div>
                  </details>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card p-0 overflow-x-auto" aria-labelledby="t-aut">
        <h2 id="t-aut" className="m-0 text-base px-4 pt-4">Autores</h2>
        <table className="tbl">
          <thead><tr><th>Email</th><th>Perfil docente</th><th>Cursos</th><th>Último ingreso</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {autores.map((a) => (
              <tr key={a.id} className={a.activo ? "" : "opacity-50"}>
                <td className="font-mono text-sm">{a.email}{a.nombre && <span className="block font-sans text-xs text-[#4A515C]">{a.nombre}</span>}</td>
                <td>{PERFILES_DOCENTES.find((p) => p.slug === a.docente_slug)?.nombre ?? a.docente_slug}<span className="block text-xs text-[#4A515C]">{a.docente_slug}</span></td>
                <td>{a.cursos}</td>
                <td>{a.portal_ultimo ? fecha(a.portal_ultimo) : "Nunca"}</td>
                <td>{a.activo ? "Activo" : "Desactivado"}</td>
                <td>
                  <form action={autor} className="flex flex-wrap gap-1"><input type="hidden" name="id" value={a.id} />
                    {a.activo && <button name="op" value="invitar" className="btn-s py-1">Mandar acceso por email</button>}
                    <button name="op" value={a.activo ? "desactivar" : "activar"} className="btn-s py-1">{a.activo ? "Desactivar" : "Activar"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!autores.length && <tr><td colSpan={6} className="text-sm text-[#4A515C]">Todavía no hay autores. Dalos de alta abajo.</td></tr>}
          </tbody>
        </table>
      </section>

      <form action={alta} className="card grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <h2 className="m-0 col-span-full text-base">Dar de alta un autor</h2>
        <label className="lbl">Email con el que va a entrar<input name="email" type="email" required className="inp" placeholder="nombre@dominio.com" /></label>
        <label className="lbl">Perfil docente (de /equipo)<select name="slug" required defaultValue="" className="inp"><option value="" disabled>Elegí…</option>{PERFILES_DOCENTES.map((p) => <option key={p.slug} value={p.slug}>{p.nombre} ({p.slug})</option>)}</select></label>
        <label className="lbl">Nombre (opcional)<input name="nombre" className="inp" /></label>
        <button className="btn-p">Dar de alta</button>
        <p className="m-0 col-span-full text-xs text-[#4A515C]">El alta no manda ningún email: el autor entra solo con su email en el panel de autor, o le mandás el acceso con el botón. Para que vea un curso, ese perfil tiene que estar en el campo «Docentes» del curso. Una persona puede tener más de un perfil (otra alta con el mismo email).</p>
      </form>
    </div>
  )
}
