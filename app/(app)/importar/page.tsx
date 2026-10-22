import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { nombrePeriodo } from "@/lib/util"
import Importador from "@/components/Importador"

export const dynamic = "force-dynamic"

export default async function Importar() {
  await requerir(["gerente", "coordinacion"])
  const meses = await q<{ periodo: string; n: number; importado: string; origen: string }>(
    "select periodo, count(*)::int n, max(importado) importado, max(origen) origen from carga_mensual group by periodo order by periodo desc",
  )
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <h1 className="m-0">Importar la planilla mensual</h1>
      <div className="card text-sm leading-relaxed">
        <p className="m-0">Débora sigue cargando como siempre en la planilla de Drive <strong>“San Patricio · Carga mensual de prestaciones ID”</strong>. Hay dos formas de pasar los datos al sistema:</p>
        <ol className="mb-0">
          <li><strong>Desde la planilla:</strong> menú <em>San Patricio → Enviar al sistema</em> (un clic, sin descargar nada).</li>
          <li><strong>Desde acá:</strong> en Drive, <em>Archivo → Descargar → Microsoft Excel (.xlsx)</em> y subí ese archivo abajo.</li>
        </ol>
        <p className="mb-0">Cada importación reemplaza el mes completo con lo que dice la planilla. Los pacientes nuevos se crean solos.</p>
      </div>
      <div className="card"><Importador /></div>
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Mes</th><th>Pacientes</th><th>Última importación</th><th>Origen</th></tr></thead>
          <tbody>
            {meses.map((m) => <tr key={m.periodo}><td>{nombrePeriodo(m.periodo)}</td><td>{m.n}</td><td>{new Date(m.importado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</td><td>{m.origen}</td></tr>)}
            {!meses.length && <tr><td colSpan={4} className="text-[#4F5C69]">Todavía no se importó ningún mes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
