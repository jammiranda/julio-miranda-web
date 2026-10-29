import { revalidatePath } from "next/cache"
import { q, audit } from "@/lib/db"
import { instagram } from "@/lib/instagram"
import { acceso, Head, Sec, Barras, Delta, SinDatos, fmt, fechaCorta } from "../_ui"

export const dynamic = "force-dynamic"

const REDES: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", x: "X" }
type Fila = { id: number; cuenta: string; red: string; seguidores: number; fecha: string; nota: string | null; creado_por: string | null }

async function agregar(fd: FormData) {
  "use server"
  const u = await acceso()
  if (!u) return
  const cuenta = String(fd.get("cuenta") ?? "").trim().replace(/^@?/, "@").slice(0, 80)
  const red = String(fd.get("red") ?? "instagram")
  const seguidores = Math.round(Number(String(fd.get("seguidores") ?? "").replace(/\./g, "").replace(",", ".")))
  const fecha = String(fd.get("fecha") ?? "")
  if (cuenta.length < 2 || !REDES[red] || !Number.isFinite(seguidores) || seguidores < 0) return
  await q(`insert into pc_competencia(cuenta,red,seguidores,fecha,nota,creado_por) values ($1,$2,$3,coalesce(nullif($4,'')::date,current_date),nullif($5,''),$6)`, [cuenta, red, seguidores, /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : "", String(fd.get("nota") ?? "").trim().slice(0, 200), u.usuario])
  await audit(u, "competencia_carga", "pc_competencia", cuenta)
  revalidatePath("/panel-contenido/competencia")
}

async function borrar(fd: FormData) {
  "use server"
  const u = await acceso()
  if (!u) return
  const id = Number(fd.get("id"))
  if (!Number.isInteger(id)) return
  await q(`delete from pc_competencia where id=$1`, [id])
  await audit(u, "competencia_borrado", "pc_competencia", id)
  revalidatePath("/panel-contenido/competencia")
}

export default async function Competencia() {
  if (!(await acceso())) return null
  const [filas, ig] = await Promise.all([
    q<Fila>(`select id, cuenta, red, seguidores, to_char(fecha,'YYYY-MM-DD') fecha, nota, creado_por from pc_competencia order by fecha desc, id desc limit 300`).catch(() => [] as Fila[]),
    instagram(),
  ])
  // Último y anterior registro por cuenta y red
  const grupos = new Map<string, Fila[]>()
  for (const f of filas) { const k = `${f.red}|${f.cuenta.toLowerCase()}`; grupos.set(k, [...(grupos.get(k) ?? []), f]) }
  const resumen = [...grupos.values()].map((g) => ({ ult: g[0], prev: g[1] ?? null, n: g.length })).sort((a, b) => b.ult.seguidores - a.ult.seguidores)
  const igComp = resumen.filter((r) => r.ult.red === "instagram")
  const comparar = [...(ig.ok ? [{ k: `@${ig.perfil.username} (DEVISEBIT)`, v: ig.perfil.seguidores }] : []), ...igComp.map((r) => ({ k: r.ult.cuenta, v: r.ult.seguidores }))].sort((a, b) => b.v - a.v)
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })

  return (
    <>
      <Head t="Competencia" sub="Seguidores de cuentas de referencia, cargados a mano desde el panel" />
      <div className="pc-card">
        <div className="pc-ch"><h2>Cargar un dato</h2><span className="pc-k">mirá el perfil y anotá los seguidores</span></div>
        <form action={agregar} className="pc-form">
          <label className="pc-lbl">Cuenta<input className="pc-inp" name="cuenta" required placeholder="@cuenta" autoCapitalize="none" /></label>
          <label className="pc-lbl">Red<select className="pc-inp" name="red" defaultValue="instagram">{Object.entries(REDES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
          <label className="pc-lbl">Seguidores<input className="pc-inp" name="seguidores" required inputMode="numeric" pattern="[0-9.]+" placeholder="12500" /></label>
          <label className="pc-lbl">Fecha<input className="pc-inp" name="fecha" type="date" defaultValue={hoy} max={hoy} /></label>
          <label className="pc-lbl">Nota (opcional)<input className="pc-inp" name="nota" maxLength={200} placeholder="Ej.: lanzó campaña" /></label>
          <button className="pc-btn pri" style={{ justifyContent: "center" }}>Guardar</button>
        </form>
      </div>

      {resumen.length ? (
        <>
          <div className="pc-grid pc-g2">
            <div className="pc-card"><div className="pc-ch"><h2>Instagram: DEVISEBIT frente a la competencia</h2></div>
              {comparar.length ? <Barras filas={comparar} color="var(--ig)" /> : <div className="pc-empty">Cargá cuentas de Instagram para comparar.</div>}
            </div>
            <div className="pc-card"><div className="pc-ch"><h2>Último dato por cuenta</h2></div>
              <div className="pc-tw"><table><thead><tr><th>Cuenta</th><th>Red</th><th className="n">Seguidores</th><th>Cambio</th><th>Fecha</th></tr></thead>
                <tbody>{resumen.map((r) => <tr key={r.ult.id}><td style={{ overflowWrap: "anywhere" }}>{r.ult.cuenta}</td><td className="pc-muted">{REDES[r.ult.red] ?? r.ult.red}</td><td className="n">{fmt(r.ult.seguidores)}</td><td>{r.prev ? <Delta v={r.ult.seguidores - r.prev.seguidores} /> : <span className="pc-muted" style={{ fontSize: 12 }}>primer dato</span>}</td><td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{fechaCorta(r.ult.fecha)}</td></tr>)}</tbody>
              </table></div>
            </div>
          </div>
          <Sec t="Historial de cargas" />
          <div className="pc-card">
            <div className="pc-tw"><table><thead><tr><th>Fecha</th><th>Cuenta</th><th>Red</th><th className="n">Seguidores</th><th>Nota</th><th>Cargó</th><th></th></tr></thead>
              <tbody>{filas.map((f) => <tr key={f.id}><td className="pc-muted" style={{ whiteSpace: "nowrap" }}>{fechaCorta(f.fecha)} {f.fecha.slice(0, 4)}</td><td style={{ overflowWrap: "anywhere" }}>{f.cuenta}</td><td className="pc-muted">{REDES[f.red] ?? f.red}</td><td className="n">{fmt(f.seguidores)}</td><td className="pc-muted">{f.nota ?? ""}</td><td className="pc-muted">{f.creado_por ?? ""}</td><td><form action={borrar}><input type="hidden" name="id" value={f.id} /><button className="pc-x" aria-label={`Borrar el dato de ${f.cuenta} del ${f.fecha}`}>Borrar</button></form></td></tr>)}</tbody>
            </table></div>
          </div>
        </>
      ) : (
        <SinDatos><b>Todavía no hay datos de la competencia.</b> No hay una fuente automática para cuentas de otros: cargá a mano los seguidores de las cuentas que quieras seguir (por ejemplo, una vez por semana) y acá se arma la comparación y la evolución.</SinDatos>
      )}
    </>
  )
}
