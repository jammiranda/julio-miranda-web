import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { randomBytes } from "crypto"
import { requerir, ROL_NOMBRE, type Rol } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { fecha, s } from "@/lib/util"

export const dynamic = "force-dynamic"

async function invitar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const tok = randomBytes(24).toString("base64url")
  await q("update usuarios set invite_token=$1, invite_expira=now() + interval '7 days' where id=$2", [tok, id])
  await audit(u, "invitacion", "usuario", id)
  redirect(`/usuarios?link=${id}`)
}

async function accion(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const a = String(fd.get("a"))
  if (id === u.id) redirect("/usuarios")
  if (a === "toggle") await q("update usuarios set activo = not activo where id=$1", [id])
  if (a === "reset") await q("update usuarios set pass_hash=null where id=$1", [id])
  if (a === "espacios") { const e = ESP[String(fd.get("espacios"))]; if (e) await q("update usuarios set espacios=$1 where id=$2", [e, id]) }
  if (a === "rol") { const r = String(fd.get("rol")); if (["gerente", "coordinacion", "consulta", "profesional"].includes(r)) await q("update usuarios set rol=$1 where id=$2", [r, id]) }
  await audit(u, "usuario_" + a, "usuario", id)
  redirect("/usuarios")
}

const ESP: Record<string, string[]> = { ambos: ["comercial", "academia"], comercial: ["comercial"], academia: ["academia"] }
const ESP_NOMBRE: Record<string, string> = { ambos: "Comercial y Academia", comercial: "Solo Comercial", academia: "Solo Academia" }
const espDe = (e: string[] | null) => (!e || e.length !== 1 ? "ambos" : e[0])

async function crear(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const usuario = (s(fd.get("usuario")) ?? "").toLowerCase().replace(/[^a-z0-9._-]/g, "")
  if (!usuario) redirect("/usuarios")
  await q("insert into usuarios(usuario,nombre,rol,espacios) values ($1,$2,$3,$4) on conflict do nothing", [usuario, s(fd.get("nombre")), s(fd.get("rol")), ESP[String(fd.get("espacios"))] ?? ESP.ambos])
  await audit(u, "alta_usuario", "usuario", usuario)
  redirect("/usuarios")
}

export default async function Usuarios({ searchParams }: { searchParams: { link?: string } }) {
  const u = await requerir(["gerente"])
  const rows = await q<any>("select id, usuario, nombre, rol, espacios, email, activo, pass_hash is not null tiene_clave, invite_expira, creado from usuarios order by id")
  let link: string | null = null
  if (searchParams.link) {
    const r = await one<{ invite_token: string }>("select invite_token from usuarios where id=$1 and invite_expira > now()", [Number(searchParams.link)])
    const h = headers()
    if (r?.invite_token) link = `https://${h.get("host")}/activar/${r.invite_token}`
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0">Usuarios</h1>
      <div className="card text-sm text-[#262C37]">
        <strong>Roles:</strong> Dirección ve y edita todo, incluidos usuarios y auditoría. Comercial atiende conversaciones, contactos, proyectos y el bot. Desarrollo y Solo lectura ven el CRM sin editar. <strong>Sistemas:</strong> cada persona puede ver el Sistema comercial, el Sistema Academia o los dos (por ejemplo, la dirección académica solo Academia).
      </div>
      {link && (
        <div className="card border-[#C8231F]">
          <p className="m-0 font-semibold">Enlace de activación (vale 7 días, se usa una sola vez):</p>
          <p className="m-0 mt-2 break-all font-mono text-sm bg-[#F5F6F8] p-2 rounded-lg">{link}</p>
          <p className="m-0 mt-2 text-xs text-[#4A515C]">Mandáselo por WhatsApp a la persona. Con ese enlace elige su propia clave.</p>
        </div>
      )}
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Sistemas</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.activo ? "" : "opacity-50"}>
                <td className="font-mono">{r.usuario}</td><td>{r.nombre}{!r.email && r.activo && (r.rol === "gerente" || r.rol === "coordinacion") && <div className="text-xs text-amber-700">Sin email: no recibe las reuniones en su calendario (se carga en Mi perfil)</div>}</td>
                <td>
                  {r.id === u.id ? ROL_NOMBRE[r.rol as Rol] : (
                    <form action={accion} className="flex gap-1"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="a" value="rol" />
                      <select name="rol" defaultValue={r.rol} className="inp py-1 w-auto">{Object.entries(ROL_NOMBRE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button className="btn-s py-1">OK</button></form>
                  )}
                </td>
                <td>
                  {r.id === u.id ? ESP_NOMBRE[espDe(r.espacios)] : (
                    <form action={accion} className="flex gap-1"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="a" value="espacios" />
                      <select name="espacios" defaultValue={espDe(r.espacios)} className="inp py-1 w-auto">{Object.entries(ESP_NOMBRE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button className="btn-s py-1">OK</button></form>
                  )}
                </td>
                <td>{!r.activo ? "Desactivado" : r.tiene_clave ? "Activo" : r.invite_expira ? `Invitación hasta ${fecha(r.invite_expira)}` : "Sin activar"}</td>
                <td>
                  {r.id !== u.id && (
                    <div className="flex flex-wrap gap-1">
                      <form action={invitar}><input type="hidden" name="id" value={r.id} /><button className="btn-s py-1">{r.tiene_clave ? "Nuevo enlace de clave" : "Generar enlace de activación"}</button></form>
                      <form action={accion}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="a" value="toggle" /><button className="btn-s py-1">{r.activo ? "Desactivar" : "Activar"}</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={crear} className="card grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <h2 className="m-0 col-span-full text-base">Agregar usuario</h2>
        <label className="lbl">Usuario<input name="usuario" required placeholder="nombre en minúsculas" className="inp" /></label>
        <label className="lbl">Nombre<input name="nombre" required className="inp" /></label>
        <label className="lbl">Rol<select name="rol" className="inp">{Object.entries(ROL_NOMBRE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="lbl">Sistemas<select name="espacios" className="inp">{Object.entries(ESP_NOMBRE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <button className="btn-p">Agregar</button>
      </form>
    </div>
  )
}
