import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { ESTADOS_LIC, dinero, isoD, sumarDias } from "@/lib/gestion"
import { fecha, hoyISO } from "@/lib/util"
import { TablaRegistro, Aviso, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type SP = { editar?: string; nuevo?: string; ok?: string; error?: string; cerradas?: string }
const ABIERTAS = ["detectada", "analizando", "preparando", "presentada"]

export default async function Licitaciones({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir()
  const edita = u.rol === "gerente" || u.rol === "coordinacion"
  const hoy = hoyISO()
  const filas = await q<any>(`select * from g_licitaciones ${sp.cerradas ? "" : "where estado = any($1)"} order by case when estado = any($1) then 0 else 1 end, apertura nulls last`, [ABIERTAS])
  const todas = await q<{ estado: string; n: number; monto: string }>("select estado, count(*)::int n, coalesce(sum(monto_estimado) filter (where moneda='ARS'),0) monto from g_licitaciones group by 1")
  const N = Object.fromEntries(todas.map((t) => [t.estado, t]))
  const abiertas = filas.filter((f) => ABIERTAS.includes(f.estado))
  const semana = abiertas.filter((f) => { const a = isoD(f.apertura); return a && a >= hoy && a <= sumarDias(hoy, 7) })
  const enJuego = ABIERTAS.reduce((a, e) => a + Number(N[e]?.monto ?? 0), 0)
  const presentadas = (N.presentada?.n ?? 0) + (N.adjudicada?.n ?? 0) + (N.perdida?.n ?? 0)
  const volver = `/licitaciones${sp.cerradas ? "?cerradas=1" : ""}`

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Gestión</div><h1 className="m-0">Licitaciones</h1><p>Compras públicas y privadas donde compite DEVISEBIT SRL: software y sistemas, comunicación y marketing.</p></div>
        {edita && <div className="pag-acc"><Link href={`${volver}${sp.cerradas ? "&" : "?"}nuevo=1`} className="btn-p">+ Licitación</Link></div>}
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Resumen de licitaciones" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi t="Abiertas" v={abiertas.length} d="De detectada a presentada" />
        <Kpi t="Abren esta semana" v={semana.length} d={semana[0] ? `${semana[0].organismo} · ${fecha(isoD(semana[0].apertura))}` : "Ninguna"} tono={semana.length ? "ambar" : undefined} />
        <Kpi t="Presupuesto en juego" v={dinero(enJuego)} d="Suma de las abiertas (ARS)" />
        <Kpi t="Adjudicadas" v={`${N.adjudicada?.n ?? 0} de ${presentadas}`} d="Sobre las presentadas" tono={N.adjudicada?.n ? "verde" : undefined} />
      </section>

      <section aria-label="Embudo" className="flex flex-wrap gap-2">
        {ESTADOS_LIC.map((e) => <span key={e.v} className={`chip ${e.c} !px-3 !py-1`}>{e.n} · {N[e.v]?.n ?? 0}</span>)}
      </section>

      <TablaRegistro clave="licitaciones" filas={filas} volver={volver} editar={Number(sp.editar) || null} nuevo={!!sp.nuevo} puedeEditar={edita}
        abierto={(r) => ABIERTAS.includes(r.estado)}
        vacio="Sin licitaciones cargadas. Cada mañana revisá el radar (COMPR.AR, BAC, PBAC, San Luis, Córdoba, Catamarca, Salta y PAMI) y cargá acá las que valga la pena analizar." />
      <Link href={sp.cerradas ? "/licitaciones" : "/licitaciones?cerradas=1"} className="text-sm underline text-[var(--gris)] w-fit">{sp.cerradas ? "Ocultar cerradas" : "Ver también adjudicadas, perdidas y descartadas"}</Link>
    </div>
  )
}
