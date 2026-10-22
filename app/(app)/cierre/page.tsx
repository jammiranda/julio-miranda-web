import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { datosMes } from "@/lib/tablero"
import { pesos, fecha, nombrePeriodo, periodoActual, periodosRecientes, s, MESES } from "@/lib/util"

export const dynamic = "force-dynamic"

async function guardarCierre(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const p = String(fd.get("p"))
  const fr = s(fd.get("factura_real"))
  const ff = s(fd.get("fecha_factura"))
  let cobra = s(fd.get("cobra_en"))
  if (!cobra && ff) {
    const [y, m] = ff.split("-").map(Number)
    const sig = new Date(Date.UTC(y, m, 1))
    cobra = `${MESES[sig.getUTCMonth()]} ${sig.getUTCFullYear()} (del 22 al 25)`
  }
  await q(
    `insert into cierres(periodo,factura_real,cobra_en,notas,cerrado,fecha_factura,actualizado) values ($1,$2,$3,$4,$5,$6,now())
     on conflict (periodo) do update set factura_real=$2, cobra_en=$3, notas=$4, cerrado=$5, fecha_factura=$6, actualizado=now()`,
    [p, fr ? Number(fr.replace(/\./g, "").replace(",", ".")) : null, cobra, s(fd.get("notas")), fd.get("cerrado") === "on", ff],
  )
  await audit(u, "cierre_mes", "cierre", p)
  redirect(`/cierre?p=${p}&ok=1`)
}

async function guardarTarifas(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  for (const k of ["enfermeria", "kinesiologia", "medico", "fonoaudiologia", "cuidador"]) {
    const v = Number(fd.get(k))
    if (v > 0) await q("update tarifas set valor=$1 where clave=$2", [v, k])
  }
  await audit(u, "tarifas")
  redirect(`/cierre?p=${fd.get("p")}`)
}

export default async function Cierre({ searchParams }: { searchParams: { p?: string; ok?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const p = /^\d{4}-\d{2}$/.test(searchParams.p ?? "") ? searchParams.p! : periodoActual()
  const { rows, tarifas, cierre } = await datosMes(p)
  const fin = puede.verFinanzas(u)
  const tot = rows.reduce((a, r) => ({ enf: a.enf + r.enf, kin: a.kin + r.kin, med: a.med + r.med, sinApp: a.sinApp + r.sin_app, sub: a.sub + r.sub }), { enf: 0, kin: 0, med: 0, sinApp: 0, sub: 0 })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0">Cierre mensual · {nombrePeriodo(p)}</h1><p className="m-0 text-sm text-[#4F5C69]">Prestaciones realizadas por paciente, listas para transmitir y facturar.</p></div>
        <div className="flex gap-2">
          <form className="flex gap-2"><select name="p" defaultValue={p} className="inp w-auto">{periodosRecientes(12).map((x) => <option key={x} value={x}>{nombrePeriodo(x)}</option>)}</select><button className="btn-s">Ver</button></form>
          <a href={`/api/cierre?p=${p}`} className="btn-p">Descargar Excel (CSV)</a>
        </div>
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-[#0B5E31]">Cierre guardado.</p>}
      {tot.sinApp > 0 && <p className="m-0 text-sm text-rojo font-semibold">Hay {tot.sinApp} visitas realizadas sin marcar como registradas en la APP PAMI.</p>}
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>#</th><th>Paciente</th><th>Mód.</th><th>Vence OP</th><th>Enf.</th><th>Kin.</th><th>Méd.</th><th>Otras</th><th>Equip.</th><th>Sin APP</th><th>Observación</th>{fin && <th className="text-right">Submód. $</th>}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td><td><Link href={`/pacientes/${r.id}`} className="font-semibold hover:underline">{r.apellido_nombre}</Link></td>
                <td>{r.modulo}</td><td>{fecha(r.fecha_vencimiento)}</td><td>{r.enf}</td><td>{r.kin}</td><td>{r.med}</td><td>{r.otras}</td><td>{r.equipos || "—"}</td>
                <td className={r.sin_app ? "text-rojo font-semibold" : ""}>{r.sin_app || "—"}</td><td className="text-xs">{r.estado_obs ?? ""}</td>{fin && <td className="text-right">{pesos(r.sub)}</td>}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={12} className="text-center text-[#4F5C69] py-6">Sin pacientes con OP en el mes.</td></tr>}
            {rows.length > 0 && <tr className="font-bold bg-[#F3F5F4]"><td></td><td>Total ({rows.length} pacientes)</td><td></td><td></td><td>{tot.enf}</td><td>{tot.kin}</td><td>{tot.med}</td><td></td><td></td><td>{tot.sinApp || "—"}</td><td></td>{fin && <td className="text-right">{pesos(tot.sub)}</td>}</tr>}
          </tbody>
        </table>
      </div>
      {fin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form action={guardarCierre} className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
            <h2 className="m-0 col-span-full">Factura del mes <span className="chip bg-amber-50 text-amber-700">Solo gerencia</span></h2>
            <input type="hidden" name="p" value={p} />
            <label className="lbl">Factura emitida a PAMI ($)<input name="factura_real" defaultValue={cierre?.factura_real ?? ""} inputMode="decimal" className="inp" /></label>
            <label className="lbl">Fecha de la factura<input name="fecha_factura" type="date" defaultValue={(cierre as any)?.fecha_factura ? new Date((cierre as any).fecha_factura).toISOString().slice(0, 10) : ""} className="inp" /></label>
            <label className="lbl col-span-full">Se cobra en<input name="cobra_en" defaultValue={cierre?.cobra_en ?? ""} placeholder="Si lo dejás vacío: mes siguiente a la factura, del 22 al 25" className="inp" /></label>
            <p className="m-0 col-span-full text-xs text-[#4F5C69]">Circuito: el último día hábil del mes se emite la factura y se cobra el mes siguiente, entre el 22 y el 25.</p>
            <label className="lbl col-span-full">Notas<input name="notas" className="inp" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="cerrado" defaultChecked={!!cierre?.cerrado} /> Mes cerrado</label>
            <div className="col-span-full"><button className="btn-p">Guardar</button></div>
          </form>
          <form action={guardarTarifas} className="card grid grid-cols-2 sm:grid-cols-3 gap-3">
            <h2 className="m-0 col-span-full">Valores de submódulos <span className="chip bg-amber-50 text-amber-700">Solo gerencia</span></h2>
            <input type="hidden" name="p" value={p} />
            {Object.entries(tarifas).map(([k, v]) => <label key={k} className="lbl capitalize">{k}<input name={k} defaultValue={v} inputMode="numeric" className="inp" /></label>)}
            <div className="col-span-full"><button className="btn-s">Actualizar valores</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
