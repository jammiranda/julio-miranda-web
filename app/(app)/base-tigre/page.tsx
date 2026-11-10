import { requerir } from "@/lib/auth"
import { Kpis } from "@/components/Kpi"
import BaseTigreCarga from "@/components/BaseTigreCarga"
import { resumen, ENVIOS_POR_DIA, TIPOS_EMAIL } from "@/lib/base-tigre"

export const dynamic = "force-dynamic"

const n = (v: number) => v.toLocaleString("es-AR")
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1).replace(".", ",")}%` : "—")
const dias = (v: number) => Math.ceil(v / ENVIOS_POR_DIA)
const href = (o: Record<string, string>) => `/api/base-tigre/exportar?${new URLSearchParams(o).toString()}`

export default async function BaseTigre() {
  await requerir(["gerente"])
  const r = await resumen()
  const max = Math.max(1, ...r.porBanda.map((x) => x.n))
  const tipo = (t: string) => r.porTipo.find((x) => x.tipo === t)?.n ?? 0
  const alta = r.porConfianza.find((x) => x.confianza === "alta")?.n ?? 0
  const b2b = tipo("corporativo") + tipo("gobierno") + tipo("educativo")
  const celda = (b: string, t: string) => r.cruce.find((x) => x.banda === b && x.tipo === t)?.n ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Base Tigre</h1>
        <p className="m-0 text-sm text-[#4A515C]">Usuarios de la app Soy Tigre, curados y divididos por rango etario (edad estimada desde el DNI). Vive aparte del CRM: no aparece en Contactos y <b>no está conectada a Envíos de email</b>.</p>
      </div>

      <section className="card flex flex-col gap-2 border-2 border-[#C8231F]">
        <strong>Antes de usarla para enviar</strong>
        <ul className="m-0 pl-5 text-sm flex flex-col gap-1">
          <li>Confirmar la <b>autorización por escrito del Municipio de Tigre</b> para este uso (Ley 25.326: finalidad y consentimiento).</li>
          <li>Todo envío debe llevar <b>baja en un clic</b>; los que se den de baja quedan marcados y no se vuelven a enviar.</li>
          <li>Con Brevo gratis el tope es de <b>{ENVIOS_POR_DIA} envíos por día</b>: toda la base llevaría {n(dias(r.activos))} días. Para este volumen hace falta un plan pago o enviar por segmentos chicos.</li>
          <li>Una base fría rebota y marca spam más que una propia: conviene empezar con segmentos de ≤ {n(ENVIOS_POR_DIA)} y mirar apertura y rebotes antes de subir.</li>
        </ul>
      </section>

      {r.total === 0 ? (
        <section className="card flex flex-col gap-2">
          <strong>Todavía no hay datos cargados</strong>
          <p className="m-0 text-sm text-[#4A515C]">Subí el archivo curado (CSV con columnas email, nombre, apellido, banda, edad, confianza, tipo_email). Se puede repetir sin duplicar.</p>
          <BaseTigreCarga />
        </section>
      ) : (
        <>
          <Kpis datos={[
            { t: "En la base", v: n(r.activos), d: r.bajas ? `${n(r.bajas)} dados de baja` : "todos activos", tono: "oscuro" },
            { t: "Edad con alta confianza", v: pct(alta, r.activos), d: "DNI y fecha declarada coinciden" },
            { t: "Mail corporativo, educativo o gobierno", v: n(b2b), d: "los más cercanos a la oferta de DEVISEBIT" },
            { t: "Último lote", v: r.ultimaCarga ? new Date(r.ultimaCarga).toLocaleDateString("es-AR") : "—" },
          ]} />

          <section className="card flex flex-col gap-3">
            <strong>Por rango etario</strong>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Rango</th><th>Personas</th><th className="min-w-[180px]">Peso</th><th>Días a {ENVIOS_POR_DIA}/día</th><th>Exportar</th></tr></thead>
                <tbody>
                  {r.porBanda.map((x) => (
                    <tr key={x.banda}>
                      <td className="font-semibold whitespace-nowrap">{x.banda}</td>
                      <td>{n(x.n)}</td>
                      <td><div className="h-2.5 rounded bg-[#E2E5EA]"><div className="h-2.5 rounded bg-[#C8231F]" style={{ width: `${Math.max(2, (100 * x.n) / max)}%` }} /></div></td>
                      <td>{n(dias(x.n))}</td>
                      <td className="whitespace-nowrap"><a className="underline" href={href({ banda: x.banda })}>CSV</a> · <a className="underline" href={href({ banda: x.banda, tipo: "corporativo" })}>corporativos</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-xs text-[#4A515C]">La edad sale del número de DNI (los DNI nacionales se emiten en orden, así que el número delata el año de nacimiento con un margen de ±2 años). Cerca del borde de un rango, una persona puede quedar en el vecino.</p>
          </section>

          <section className="card flex flex-col gap-3">
            <strong>Rango por tipo de mail</strong>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Rango</th>{TIPOS_EMAIL.map((t) => <th key={t} className="capitalize">{t}</th>)}</tr></thead>
                <tbody>
                  {r.porBanda.map((x) => (
                    <tr key={x.banda}><td className="font-semibold">{x.banda}</td>{TIPOS_EMAIL.map((t) => <td key={t}>{n(celda(x.banda, t))}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a className="underline" href={href({})}>Exportar toda la base</a>
              {TIPOS_EMAIL.map((t) => <a key={t} className="underline capitalize" href={href({ tipo: t })}>Solo {t}</a>)}
              <a className="underline" href={href({ confianza: "alta" })}>Solo edad con alta confianza</a>
            </div>
            <p className="m-0 text-xs text-[#4A515C]">Cada exportación queda registrada en Auditoría.</p>
          </section>

          <section className="card flex flex-col gap-2">
            <strong>Cómo se armó</strong>
            <ul className="m-0 pl-5 text-sm text-[#4A515C] flex flex-col gap-1">
              <li>Partida de 90.580 registros del panel de la app. Se corrigieron mayúsculas y espacios, ~885 mails con errores de tipeo (por ejemplo gmail.con) y se unificaron cuentas repetidas por DNI y nombre.</li>
              <li>Quedaron afuera: cuentas de prueba, mails inválidos o descartables, menores de 18, personal del municipio, mails sin confirmar y los corregidos que faltan validar.</li>
              <li><b>El DNI no se guarda en el sistema</b>: solo el rango de edad que se deduce de él.</li>
            </ul>
          </section>

          <section className="card flex flex-col gap-2">
            <strong>Actualizar o sumar un lote</strong>
            <BaseTigreCarga />
          </section>
        </>
      )}
    </div>
  )
}
