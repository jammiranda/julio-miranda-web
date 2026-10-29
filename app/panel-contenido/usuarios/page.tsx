import { panelMetricas, safe } from "@/lib/panel"
import { acceso, Head, Sec, Kpi, Barras, SinDatos, fmt } from "../_ui"

export const dynamic = "force-dynamic"

export default async function Usuarios() {
  if (!(await acceso())) return null
  const m = await safe(panelMetricas())
  if (!m) return (<><Head t="Usuarios" /><SinDatos>No se pudo leer la base del sistema en este momento.</SinDatos></>)
  const d = m.usuarios.devisebit, a = m.usuarios.academia
  return (
    <>
      <Head t="Usuarios" sub="Cuentas de clientes, de la Academia y del equipo (solo cifras, sin datos personales)" />
      <Sec t="Mi cuenta · portal.devisebit.com" />
      <div className="pc-kpis">
        <Kpi k="Clientes habilitados" v={fmt(d?.habilitados)} ft="Con email y proyecto o acceso" />
        <Kpi k="Ingresaron alguna vez" v={fmt(d?.ingresaron)} ft={d?.habilitados ? `${fmt((d.ingresaron / d.habilitados) * 100, 0)}% de los habilitados` : ""} color="var(--ok)" />
        <Kpi k="Activos (30 días)" v={fmt(d?.activos30)} ft="Entraron en el último mes" color="var(--info)" />
        <Kpi k="Accesos nuevos (30 días)" v={fmt(d?.nuevos30)} ft="Primer acceso en el último mes" />
      </div>
      <Sec t="ACADEMIA DEVISEBIT" />
      <div className="pc-kpis">
        <Kpi k="Registrados" v={fmt(a?.registrados)} ft={a ? `${fmt(a.nuevos30)} nuevos en 30 días` : ""} color="var(--ok)" />
        <Kpi k="Alumnos" v={fmt(a?.alumnos)} ft={a ? `${fmt(a.alumnosActivos30)} activos en 30 días` : ""} />
        <Kpi k="Compradores" v={fmt(a?.compradores)} ft="Con al menos una compra pagada" color="var(--warn)" />
        <Kpi k="Certificados" v={fmt(a?.certificados)} ft="Emitidos y vigentes" color="var(--info)" />
      </div>
      <div className="pc-grid pc-g2">
        <div className="pc-card"><div className="pc-ch"><h2>Embudo de la Academia</h2></div>
          {a ? <Barras filas={[{ k: "Registrados", v: a.registrados }, { k: "Alumnos", v: a.alumnos }, { k: "Compradores", v: a.compradores }, { k: "Certificados", v: a.certificados }]} color="var(--ok)" /> : <div className="pc-empty">Sin datos.</div>}
        </div>
        <div className="pc-card"><div className="pc-ch"><h2>Equipo</h2></div>
          <div className="pc-big">{fmt(m.usuarios.equipo)}</div>
          <p className="pc-sub">usuarios activos del sistema interno</p>
        </div>
      </div>
    </>
  )
}
