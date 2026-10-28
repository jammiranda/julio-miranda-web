import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { isoD, sumarDias } from "@/lib/gestion"
import { hoyISO } from "@/lib/util"
import { TablaRegistro, Aviso, Pestanias, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type SP = { ver?: string; editar?: string; nuevo?: string; ok?: string; error?: string; todos?: string }

export default async function Legales({ searchParams: sp }: { searchParams: SP }) {
  await requerir(["gerente", "coordinacion"])
  const ver = sp.ver === "vencimientos" ? "vencimientos" : "contratos"
  const hoy = hoyISO()
  const editar = Number(sp.editar) || null
  const [contratos, venc] = await Promise.all([
    q<any>(`select * from g_contratos ${sp.todos ? "" : "where estado not in ('rescindido')"} order by case estado when 'en_revision' then 0 when 'borrador' then 1 when 'firmado' then 2 else 3 end, vence nulls last`),
    q<any>(`select * from g_vencimientos ${sp.todos ? "" : "where estado='pendiente' or vence >= current_date - 30"} order by case estado when 'pendiente' then 0 else 1 end, vence`),
  ])
  const en60 = sumarDias(hoy, 60)
  const en30 = sumarDias(hoy, 30)
  const vigentes = contratos.filter((c) => c.estado === "firmado")
  const porVencer = vigentes.filter((c) => { const v = isoD(c.vence); return v && v <= en60 })
  const revision = contratos.filter((c) => ["borrador", "en_revision"].includes(c.estado))
  const vPend = venc.filter((v) => v.estado === "pendiente")
  const vVencidos = vPend.filter((v) => isoD(v.vence)! < hoy)
  const v30 = vPend.filter((v) => { const d = isoD(v.vence)!; return d >= hoy && d <= en30 })
  const volver = `/legales?ver=${ver}${sp.todos ? "&todos=1" : ""}`

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Gestión</div><h1 className="m-0">Legales</h1><p>Contratos con clientes, proveedores y equipo, y los vencimientos que no se pueden pasar: impuestos, dominios, seguros y registros.</p></div>
        <div className="pag-acc">
          <Link href="/legales?ver=vencimientos&nuevo=1" className="btn-s">+ Vencimiento</Link>
          <Link href="/legales?ver=contratos&nuevo=1" className="btn-p">+ Contrato</Link>
        </div>
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Estado legal" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi t="Contratos vigentes" v={vigentes.length} d={`${porVencer.length} vencen en 60 días`} tono={porVencer.length ? "ambar" : undefined} href="/legales?ver=contratos" />
        <Kpi t="En borrador o revisión" v={revision.length} d="Esperan firma" href="/legales?ver=contratos" />
        <Kpi t="Vencimientos en 30 días" v={v30.length} d="Pendientes" tono={v30.length ? "ambar" : undefined} href="/legales?ver=vencimientos" />
        <Kpi t="Vencidos sin resolver" v={vVencidos.length} d={vVencidos.length ? "Resolver hoy" : "Todo al día"} tono={vVencidos.length ? "rojo" : "verde"} href="/legales?ver=vencimientos" />
      </section>

      <Pestanias base="/legales" actual={ver} items={[{ v: "contratos", n: "Contratos", cant: contratos.length }, { v: "vencimientos", n: "Vencimientos", cant: vPend.length }]} />

      {ver === "contratos" ? (
        <TablaRegistro clave="contratos" filas={contratos} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar
          abierto={(r) => r.estado === "firmado"}
          vacio="Sin contratos cargados. Empezá por los clientes activos: el contrato de servicio, el NDA si hay datos sensibles y los acuerdos con freelancers." />
      ) : (
        <TablaRegistro clave="vencimientos" filas={venc} volver={volver} editar={editar} nuevo={!!sp.nuevo} puedeEditar
          abierto={(r) => r.estado === "pendiente"} rapido={{ etiqueta: "Hecho", si: (r) => r.estado === "pendiente" }}
          vacio="Sin vencimientos cargados. Sugerencia: IVA y Ganancias (ARCA), Ingresos Brutos, renovación de dominios, hosting, seguros y la reinscripción en registros de proveedores." />
      )}
      <Link href={sp.todos ? `/legales?ver=${ver}` : `/legales?ver=${ver}&todos=1`} className="text-sm underline text-[var(--gris)] w-fit">{sp.todos ? "Ocultar históricos" : "Ver también rescindidos y vencimientos viejos"}</Link>
      <p className="m-0 text-xs text-[var(--gris)]">El sistema ordena y avisa. Antes de firmar, que el abogado o el contador revise lo que tenga plata o responsabilidad en juego.</p>
    </div>
  )
}
