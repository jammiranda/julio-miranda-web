"use client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { BLOQUES, LATERAL, TARJETAS, type Prefs } from "@/lib/panel-prefs"
import { guardarPrefs, restablecerPrefs } from "./_prefs-acciones"

/** Botón "Personalizar": elegir y ordenar las tarjetas de Inicio, los bloques y el indicador del menú lateral. */
export default function Personalizar({ actual }: { actual: Prefs }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [p, setP] = useState<Prefs>(actual)
  const [pend, ir] = useTransition()
  const [error, setError] = useState("")
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    caja.current?.focus()
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false) }
    window.addEventListener("keydown", f)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", f) }
  }, [abierto])

  const abrir = () => { setP(actual); setError(""); setAbierto(true) }
  const nombre = (id: string) => TARJETAS.find((t) => t.id === id)?.t ?? id
  const ocultas = TARJETAS.filter((t) => !p.tarjetas.includes(t.id))
  const mover = (i: number, d: -1 | 1) => setP((s) => { const a = [...s.tarjetas]; const j = i + d; if (j < 0 || j >= a.length) return s; [a[i], a[j]] = [a[j], a[i]]; return { ...s, tarjetas: a } })
  const quitar = (id: string) => setP((s) => ({ ...s, tarjetas: s.tarjetas.filter((x) => x !== id) }))
  const agregar = (id: string) => setP((s) => ({ ...s, tarjetas: [...s.tarjetas, id] }))
  const bloque = (id: string) => setP((s) => ({ ...s, bloques: s.bloques.includes(id) ? s.bloques.filter((x) => x !== id) : BLOQUES.map((b) => b.id).filter((x) => x === id || s.bloques.includes(x)) }))

  const guardar = () => ir(async () => {
    const r = await guardarPrefs(p)
    if (!r.ok) { setError("No se pudo guardar. Probá de nuevo."); return }
    setAbierto(false); router.refresh()
  })
  const restablecer = () => ir(async () => { await restablecerPrefs(); setAbierto(false); router.refresh() })

  return (
    <>
      <button type="button" className="pc-btn" onClick={abrir}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
        Personalizar
      </button>
      {abierto && (
        <div className="pc-bus" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setAbierto(false) }}>
          <div ref={caja} tabIndex={-1} className="pc-bus-box pc-pers" role="dialog" aria-modal="true" aria-label="Personalizar el Inicio">
            <div className="pc-pers-hd"><h2>Personalizar el Inicio</h2><button type="button" className="pc-x" onClick={() => setAbierto(false)}>Cerrar</button></div>
            <div className="pc-pers-bd">
              <section>
                <h3>Tarjetas de indicadores</h3>
                <p className="pc-sub">La primera es la grande, de color oscuro. Ordenalas con las flechas.</p>
                <ol className="pc-pers-lista">
                  {p.tarjetas.map((id, i) => (
                    <li key={id}>
                      <span className="n">{i + 1}</span><span className="t">{nombre(id)}{i === 0 ? <em> · destacada</em> : null}</span>
                      <button type="button" className="pc-ic" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${nombre(id)}`}>↑</button>
                      <button type="button" className="pc-ic" onClick={() => mover(i, 1)} disabled={i === p.tarjetas.length - 1} aria-label={`Bajar ${nombre(id)}`}>↓</button>
                      <button type="button" className="pc-ic" onClick={() => quitar(id)} aria-label={`Quitar ${nombre(id)}`}>✕</button>
                    </li>
                  ))}
                  {!p.tarjetas.length && <li className="vacia">No hay tarjetas: Inicio mostrará solo los bloques de abajo.</li>}
                </ol>
                {ocultas.length > 0 && (
                  <div className="pc-pers-add"><span className="pc-k">Agregar</span>{ocultas.map((t) => <button key={t.id} type="button" className="pc-btn" onClick={() => agregar(t.id)}>+ {t.t}</button>)}</div>
                )}
              </section>
              <section>
                <h3>Bloques de la página</h3>
                {BLOQUES.map((b) => (
                  <label key={b.id} className="pc-chk"><input type="checkbox" checked={p.bloques.includes(b.id)} onChange={() => bloque(b.id)} />{b.t}</label>
                ))}
              </section>
              <section>
                <h3>Indicador destacado del menú lateral</h3>
                <div className="pc-pers-op">
                  {LATERAL.map((l) => (
                    <label key={l.id} className="pc-chk"><input type="radio" name="lateral" checked={p.lateral === l.id} onChange={() => setP((s) => ({ ...s, lateral: l.id }))} />{l.t}</label>
                  ))}
                </div>
              </section>
            </div>
            <div className="pc-pers-ft">
              {error && <span role="alert" style={{ color: "var(--red)", fontSize: 13 }}>{error}</span>}
              <button type="button" className="pc-x" onClick={restablecer} disabled={pend}>Volver a lo original</button>
              <span style={{ flex: 1 }} />
              <button type="button" className="pc-btn" onClick={() => setAbierto(false)}>Cancelar</button>
              <button type="button" className="pc-btn pri" onClick={guardar} disabled={pend}>{pend ? "Guardando…" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
