import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { ESTADOS_MOD, MODULOS_DB, isoD } from "@/lib/gestion"
import { guardarModulo } from "@/lib/gestion-acciones"
import { fecha, hoyISO } from "@/lib/util"
import { Aviso, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

const BARRA: Record<string, string> = { sin_empezar: "#94A3B8", en_curso: "#D97706", trabado: "#DC2626", listo: "#059669" }

export default async function Modulos({ searchParams: sp }: { searchParams: { ok?: string } }) {
  const u = await requerir()
  const edita = u.rol === "gerente" || u.rol === "coordinacion"
  const mods = await q<any>("select * from g_modulos order by orden")
  const hoy = hoyISO()
  const cuenta = (e: string) => mods.filter((m) => m.estado === e).length
  const ultima = mods.reduce<Date | null>((a, m) => (!a || new Date(m.actualizado) > a ? new Date(m.actualizado) : a), null)

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Dirección</div><h1 className="m-0">Módulos de DEVISEBIT</h1><p>La empresa se maneja en 10 módulos. Cada uno tiene un responsable y un entregable semanal. Coordinación lo actualiza los lunes y Dirección lo lee de un vistazo.</p></div>
        <div className="pag-acc"><Link href="/gestion" className="btn-s">Tablero de dirección</Link></div>
      </header>
      <Aviso ok={sp.ok} />

      <section aria-label="Estado general" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi t="Listos" v={cuenta("listo")} tono="verde" />
        <Kpi t="En curso" v={cuenta("en_curso")} tono="ambar" />
        <Kpi t="Trabados" v={cuenta("trabado")} tono={cuenta("trabado") ? "rojo" : undefined} d={cuenta("trabado") ? "Necesitan una decisión" : "Nada trabado"} />
        <Kpi t="Sin empezar" v={cuenta("sin_empezar")} d={ultima ? `Última actualización ${fecha(ultima)}` : undefined} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mods.map((m, i) => {
          const est = ESTADOS_MOD.find((e) => e.v === m.estado) ?? ESTADOS_MOD[0]
          const ref = MODULOS_DB.find((x) => x.c === m.codigo)
          const f = isoD(m.fecha)
          const tarde = f && f < hoy && m.estado !== "listo"
          return (
            <section key={m.codigo} id={m.codigo} aria-label={m.nombre} className="card relative overflow-hidden flex flex-col gap-3 scroll-mt-24">
              <span className="absolute left-0 inset-y-0 w-1" style={{ background: BARRA[m.estado] }} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-[0.12em] text-[var(--ac-texto)] tabular-nums">{String(i + 1).padStart(2, "0")}</div>
                  <h2 className="m-0 text-lg">{m.nombre}</h2>
                  <p className="m-0 text-sm text-[var(--gris)]">{m.responsable} · {m.entregable}</p>
                </div>
                <span className={`chip shrink-0 ${est.c}`}>{est.n}</span>
              </div>
              {edita ? (
                <form action={guardarModulo} className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2.5">
                  <input type="hidden" name="codigo" value={m.codigo} />
                  <fieldset className="sm:col-span-2 flex flex-wrap gap-1.5 border-0 p-0 m-0">
                    <legend className="sr-only">Estado de {m.nombre}</legend>
                    {ESTADOS_MOD.map((e) => (
                      <label key={e.v} className="cursor-pointer">
                        <input type="radio" name="estado" value={e.v} defaultChecked={m.estado === e.v} className="peer sr-only" />
                        <span className="chip border border-[var(--borde-fuerte)] bg-white text-[var(--gris)] !px-3 !py-1 peer-checked:bg-[#0E1116] peer-checked:text-white peer-checked:border-[#0E1116] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ac)]">{e.n}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label className="lbl text-xs" htmlFor={`${m.codigo}-p`}>Próximo paso<input id={`${m.codigo}-p`} name="proximo" defaultValue={m.proximo ?? ""} placeholder="Qué sigue y quién" className="inp !py-2" /></label>
                  <label className="lbl text-xs" htmlFor={`${m.codigo}-f`}>Fecha<input id={`${m.codigo}-f`} name="fecha" type="date" defaultValue={f ?? ""} className="inp !py-2" /></label>
                  <label className="lbl text-xs sm:col-span-2" htmlFor={`${m.codigo}-b`}>Bloqueo<input id={`${m.codigo}-b`} name="bloqueo" defaultValue={m.bloqueo ?? ""} placeholder="Nada trabado" className="inp !py-2" /></label>
                  <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs ${tarde ? "text-rojo font-semibold" : "text-[var(--gris)]"}`}>{tarde ? `Fecha vencida (${fecha(f)})` : m.actualizado_por ? `Actualizó ${m.actualizado_por} · ${fecha(m.actualizado)}` : "Sin actualizar todavía"}</span>
                    <span className="flex gap-2">
                      {ref && <Link href={ref.href} className="btn-s py-1.5 px-3 text-xs">Abrir módulo</Link>}
                      <button className="btn-p py-1.5 px-3 text-xs">Guardar</button>
                    </span>
                  </div>
                </form>
              ) : (
                <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-[var(--gris)]">Próximo paso</dt><dd className="m-0">{m.proximo ?? "—"}{f ? ` · ${fecha(f)}` : ""}</dd>
                  <dt className="text-[var(--gris)]">Bloqueo</dt><dd className="m-0">{m.bloqueo ?? "Nada trabado"}</dd>
                </dl>
              )}
            </section>
          )
        })}
      </div>

      <section className="card flex flex-col gap-2" aria-label="Rutina semanal">
        <h2 className="m-0 text-base">Rutina semanal</h2>
        <ul className="m-0 pl-5 text-sm flex flex-col gap-1 text-[var(--gris)]">
          <li><strong className="text-[var(--tinta)]">Lunes · Bárbara:</strong> actualiza estos 10 módulos y revisa correos y consultas pendientes.</li>
          <li><strong className="text-[var(--tinta)]">Martes · Jime:</strong> grilla de redes y nota semanal del blog.</li>
          <li><strong className="text-[var(--tinta)]">Miércoles · Julio y Bárbara:</strong> pipeline comercial y licitaciones con fecha.</li>
          <li><strong className="text-[var(--tinta)]">Jueves · Jonathan y Bárbara:</strong> avance de desarrollos y demos listas.</li>
          <li><strong className="text-[var(--tinta)]">Viernes · Bárbara a Julio:</strong> resumen ejecutivo de una página.</li>
          <li><strong className="text-[var(--tinta)]">Fin de mes · Julio y contador:</strong> cierre en Finanzas y cobranzas.</li>
        </ul>
      </section>
    </div>
  )
}
