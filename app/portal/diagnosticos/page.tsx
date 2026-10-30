import Link from "next/link"
import { requerirCliente } from "@/lib/portal"
import { nivelesDe, insigniaDe, firmarToken, AGENDA, type Fila } from "@/lib/diagnosticos"
import { NIVELES, urlNivel, urlInsignia, programasPara, URL_CURSOS, TEXTO_INSIGNIA, type Resultado1, type Resultado2, type Resultado3 } from "@/lib/diagnosticos-datos"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

function Barra({ n, v }: { n: string; v: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-2 text-sm">
      <span className="truncate">{n}</span>
      <span className="h-2.5 rounded-full bg-[#EEF0F3] overflow-hidden" aria-hidden="true"><span className="block h-full rounded-full bg-[#C8231F]" style={{ width: `${v}%` }} /></span>
      <strong className="text-right tabular-nums">{v}<span className="sr-only"> de 100</span></strong>
    </li>
  )
}

function Detalle({ f }: { f: Fila }) {
  if (f.nivel === 1) {
    const r = f.resultado as Resultado1
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div><h4 className="m-0 mb-2 text-sm">Puntaje por dimensión</h4><ul className="m-0 p-0 list-none flex flex-col gap-1.5">{r.dimensiones.map((d) => <Barra key={d.k} n={d.n} v={d.puntaje} />)}</ul></div>
        <div><h4 className="m-0 mb-2 text-sm">Acciones prioritarias</h4><ol className="m-0 pl-5 flex flex-col gap-1.5 text-sm">{r.acciones.map((a) => <li key={a.titulo}><strong>{a.titulo}.</strong> <a href={a.servicioHref} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] underline">{a.servicioNombre}</a></li>)}</ol></div>
      </div>
    )
  }
  if (f.nivel === 2) {
    const r = f.resultado as Resultado2
    return (
      <div className="flex flex-col gap-2 text-sm">
        <h4 className="m-0 text-sm">Procesos para digitalizar primero</h4>
        <ol className="m-0 pl-5 flex flex-col gap-1.5">{r.prioridades.map((p) => <li key={p.id}><strong>{p.nombre}</strong>{p.horas ? ` · ${p.horas} h/mes según tu estimación` : ""} → <a href={p.servicioHref} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] underline">{p.moduloNombre}</a></li>)}</ol>
        {r.horasTotales > 0 && <p className="m-0 text-[#4A515C]">Estimaste {r.horasTotales} horas por mes en tareas repetitivas.</p>}
      </div>
    )
  }
  const r = f.resultado as Resultado3
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="m-0"><strong>Primero:</strong> <a href={r.primero.servicioHref} target="_blank" rel="noopener noreferrer" className="text-[#C8231F] underline">{r.primero.nombre}</a></p>
      {r.antes.length > 0 && <><h4 className="m-0 text-sm">Qué hace falta antes</h4><ul className="m-0 pl-5">{r.antes.map((x) => <li key={x}>{x}</li>)}</ul></>}
      <h4 className="m-0 text-sm">Hoja de ruta de 90 días</h4>
      <ol className="m-0 pl-5">{r.hojaDeRuta.map((h) => <li key={h.etapa}><strong>{h.etapa}</strong> ({h.dias}): {h.tareas.join(" ")}</li>)}</ol>
    </div>
  )
}

/** Mi cuenta: los autodiagnósticos hechos, sus resultados y la insignia. */
export default async function Diagnosticos() {
  const c = await requerirCliente()
  const [hechos, ins] = await Promise.all([nivelesDe(c.id), insigniaDe(c.id)])
  const token = await firmarToken(c.id)
  const tope = hechos.length ? Math.max(...hechos.map((h) => h.nivel)) : 0
  const r1 = hechos.find((h) => h.nivel === 1)?.resultado as Resultado1 | undefined
  const r3 = hechos.find((h) => h.nivel === 3)?.resultado as Resultado3 | undefined
  const rubro = hechos[hechos.length - 1]?.rubro ?? null
  const programas = ins ? programasPara({ puntaje1: r1?.puntaje ?? null, r3: r3 ?? null, rubro }) : []
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="m-0"><Link href="/portal" className="text-sm text-[#4A515C] hover:underline">← Inicio</Link></p>
        <h1 className="m-0 mt-1">Mis autodiagnósticos</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Tres niveles gratis: cada uno destraba el siguiente y te recomienda por dónde avanzar.</p>
      </div>

      {ins && (
        <section aria-labelledby="t-ins" className="card !border-[#0E1116] flex flex-wrap items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-[#0E1116] text-white flex items-center justify-center text-2xl shrink-0" aria-hidden="true">★</span>
          <div className="flex-1 min-w-[220px]">
            <h2 id="t-ins" className="m-0 text-base">{TEXTO_INSIGNIA}</h2>
            <p className="m-0 text-sm text-[#4A515C]">Código de verificación <strong className="font-mono text-[#0E1116]">{ins.codigo}</strong> · emitida el {fecha(ins.emitido)}</p>
          </div>
          <a href={urlInsignia(ins.codigo)} target="_blank" rel="noopener noreferrer" className="btn-s">Ver y compartir</a>
        </section>
      )}

      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {NIVELES.map((n) => {
          const f = hechos.find((h) => h.nivel === n.n)
          const disponible = n.n <= tope + 1
          return (
            <li key={n.n} className={`card flex flex-col gap-3 ${!f && !disponible ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{n.corto}</span>
                  <h2 className="m-0 text-lg">{n.titulo}</h2>
                  <p className="m-0 text-sm text-[#4A515C]">{n.bajada}</p>
                </div>
                {f ? (
                  <div className="text-right">
                    <strong className="block text-2xl tabular-nums">{f.puntaje}<span className="text-sm text-[#4A515C]">/100</span></strong>
                    <span className="chip bg-[#F5F6F8] text-[#262C37]">{f.etiqueta}</span>
                    <span className="block text-xs text-[#4A515C] mt-1">{fecha(f.creado)}</span>
                  </div>
                ) : disponible ? (
                  <a href={urlNivel(n.n, token)} className="btn-p">Hacerlo ahora</a>
                ) : (
                  <span className="chip bg-[#F5F6F8] text-[#4A515C]">🔒 Se destraba al terminar el {NIVELES[n.n - 2].corto.toLowerCase()}</span>
                )}
              </div>
              {f && (
                <details className="rounded-xl border border-[#E2E5EA]">
                  <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">Ver el informe</summary>
                  <div className="px-4 pb-4"><Detalle f={f} /></div>
                </details>
              )}
              {f && <a href={urlNivel(n.n, token)} className="self-start text-sm text-[#4A515C] underline">Volver a hacerlo</a>}
            </li>
          )
        })}
      </ol>

      {tope === 3 && (
        <section aria-labelledby="t-dev" className="card flex flex-col gap-3">
          <h2 id="t-dev" className="m-0 text-base">Reunión de devolución sin costo</h2>
          <p className="m-0 text-sm text-[#4A515C]">30 minutos con el equipo para repasar los tres resultados y armar el plan.</p>
          <div className="flex flex-wrap gap-2"><Link href="/portal/reuniones" className="btn-p">Agendar la devolución</Link><a href={AGENDA} className="btn-s" target="_blank" rel="noopener noreferrer">Abrir la agenda</a></div>
          {programas.length > 0 && (
            <>
              <h3 className="m-0 mt-2 text-sm">Recomendado en la ACADEMIA DEVISEBIT</h3>
              <ul className="m-0 pl-5 text-sm flex flex-col gap-2">{programas.map((p) => <li key={p.id}><strong>{p.nombre}</strong> · <span className="text-[#4A515C]">{p.motivo}</span> <a href={`${urlNivel(3, token)}#academia`} className="text-[#C8231F] underline">Próximamente: dejá tu interés</a></li>)}</ul>
              <p className="m-0 text-xs text-[#4A515C]">Mirá los cursos disponibles en <a href={URL_CURSOS} target="_blank" rel="noopener noreferrer" className="underline">academia.devisebit.com/cursos</a>.</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}
