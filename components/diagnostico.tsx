"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Lock, Mail, CalendarClock, Award, Check, ExternalLink, GraduationCap } from "lucide-react"
import {
  type Nivel, type Pregunta, type Resultado, type Resultado1, type Resultado2, type Resultado3,
  PREGUNTAS, NIVELES, RUBROS, nivelInfo, calcular, seSaltea, etiqueta, URL_CURSOS, TEXTO_INSIGNIA,
} from "@/lib/diagnosticos"

const API = `${process.env.NEXT_PUBLIC_SISTEMA_URL ?? "https://sistema.devisebit.com"}/api/diagnosticos`
const AGENDA = `${process.env.NEXT_PUBLIC_SISTEMA_URL ?? "https://sistema.devisebit.com"}/agendar`
const PORTAL = "https://portal.devisebit.com/diagnosticos"
const CLAVE = "db_diag_token"
const TYPOS: Record<string, string> = { "gmal.com": "gmail.com", "gmial.com": "gmail.com", "gmail.con": "gmail.com", "gmail.co": "gmail.com", "gamil.com": "gmail.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com", "outlok.com": "outlook.com", "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com" }

type Perfil = { nombre: string; organizacion: string | null; rubro: string | null; email: string; acepto: boolean; completados: { nivel: number; puntaje: number; etiqueta: string; fecha: string }[]; token: string; insignia: { codigo: string; url: string } | null }
type Programa = { id: string; nombre: string; motivo: string; url: string }
type Respuesta = { resultado: Resultado; enviado: boolean; insignia: { codigo: string; url: string } | null; programas: Programa[]; comparacion: { organizaciones: number; dimensiones: Record<string, number> } | null; token: string | null; siguiente: string | null; porEmail: boolean }

const leer = () => { try { return localStorage.getItem(CLAVE) } catch { return null } }
const guardarToken = (t: string) => { try { localStorage.setItem(CLAVE, t) } catch {} }
const borrarToken = () => { try { localStorage.removeItem(CLAVE) } catch {} }

async function llamar(body: Record<string, unknown>) {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, ...j } as { status: number; ok?: boolean; error?: string; sinLink?: boolean; [k: string]: unknown }
}

const input = "w-full min-h-[48px] rounded-xl border border-[#8A919C] bg-white px-4 py-3 text-base text-[#0E1116] outline-none focus:border-[#C8231F] focus:ring-2 focus:ring-[#C8231F]/40"
const lbl = "flex flex-col gap-1.5 text-[15px] font-semibold"
const btnP = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 font-bold text-white text-base transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0E1116]"
const btnS = "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0E1116] px-5 py-3 font-bold text-base text-[#0E1116] hover:bg-[#0E1116] hover:text-white transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#C8231F]"

/** Escalera de autodiagnósticos: la misma pantalla sirve para los 3 niveles. */
export default function Diagnostico({ nivel }: { nivel: Nivel }) {
  const info = nivelInfo(nivel)
  const preguntas = PREGUNTAS[nivel]
  const [cargando, setCargando] = useState(true)
  const [errorRed, setErrorRed] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [paso, setPaso] = useState<"inicio" | "preguntas" | "datos" | "enviando" | "resultado">("inicio")
  const [i, setI] = useState(0)
  const [r, setR] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [datos, setDatos] = useState({ nombre: "", email: "", organizacion: "", rubro: "", telefono: "", acepta: false, recordatorio: false, website: "" })
  const [error, setError] = useState("")
  const [res, setRes] = useState<Respuesta | null>(null)
  const [local, setLocal] = useState(false)
  const foco = useRef<HTMLHeadingElement | null>(null)

  const cargarPerfil = useCallback(async () => {
    setCargando(true); setErrorRed(false)
    const url = new URL(window.location.href)
    const t = url.searchParams.get("t") || leer()
    if (url.searchParams.has("t")) { url.searchParams.delete("t"); window.history.replaceState(null, "", url.pathname + url.search + url.hash) }
    try {
      const j = await llamar({ accion: "perfil", token: t })
      const p = (j.perfil as Perfil | null) ?? null
      if (p) { setPerfil(p); setToken(p.token); guardarToken(p.token); setDatos((d) => ({ ...d, organizacion: p.organizacion ?? "", rubro: p.rubro ?? "" })) }
      else if (t) borrarToken()
    } catch { setErrorRed(true) }
    setCargando(false)
  }, [])
  useEffect(() => { cargarPerfil() }, [cargarPerfil])
  useEffect(() => { foco.current?.focus() }, [paso, i])

  const hechos = perfil?.completados.map((c) => c.nivel) ?? []
  const bloqueado = nivel > 1 && !hechos.includes(nivel - 1)
  const q = preguntas[i]
  const respondidas = r.filter((x, k) => x != null || seSaltea(nivel, k, r)).length
  const previo = useMemo(() => (paso === "datos" && r.every((x) => x != null) ? calcular(nivel, r as number[], datos.rubro || null) : null), [paso, r, nivel, datos.rubro])

  const set = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDatos({ ...datos, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })
  const responder = (v: number) => setR((x) => x.map((y, k) => (k === i ? v : y)))

  const mover = (dir: 1 | -1) => {
    let k = i + dir
    const nr = [...r]
    while (k >= 0 && k < preguntas.length && seSaltea(nivel, k, nr)) { nr[k] = 0; k += dir }
    setR(nr)
    if (k < 0) { setPaso("inicio"); return }
    if (k >= preguntas.length) { if (perfil) enviar(nr as number[]); else setPaso("datos"); return }
    setI(k)
  }

  async function enviar(resp: number[]) {
    setError(""); setPaso("enviando")
    const origen = window.location.origin + window.location.pathname
    try {
      const j = await llamar({ accion: "guardar", nivel, respuestas: resp, token, nombre: datos.nombre, email: datos.email, organizacion: datos.organizacion, rubro: datos.rubro, telefono: datos.telefono, acepta: datos.acepta, recordatorio: datos.recordatorio, website: datos.website, origen })
      if (!j.ok) {
        if (j.sinLink) { borrarToken(); setPerfil(null); setToken(null); setPaso("inicio"); return }
        setError(j.error ?? "No pudimos guardar el resultado."); setPaso(perfil ? "preguntas" : "datos"); return
      }
      const out = j as unknown as Respuesta
      if (out.token) {
        setToken(out.token); guardarToken(out.token)
        // Actualiza la escalera del encabezado (el nivel siguiente queda destrabado)
        llamar({ accion: "perfil", token: out.token }).then((x) => { if (x.perfil) setPerfil(x.perfil as Perfil) }).catch(() => {})
      }
      setRes(out); setLocal(false); setPaso("resultado")
      window.scrollTo({ top: 0 })
    } catch {
      // Sin conexión con el sistema: mostramos el resultado igual, calculado acá, pero sin guardar ni destrabar el siguiente.
      setRes({ resultado: calcular(nivel, resp, datos.rubro || null), enviado: false, insignia: null, programas: [], comparacion: null, token: null, siguiente: null, porEmail: false })
      setLocal(true); setPaso("resultado")
    }
  }

  const submitDatos = (e: React.FormEvent) => { e.preventDefault(); enviar(r as number[]) }
  const dom = datos.email.split("@")[1]?.toLowerCase() ?? ""
  const sugerencia = TYPOS[dom] ? datos.email.split("@")[0] + "@" + TYPOS[dom] : null

  return (
    <>
      <section className="db-tech bg-[#0B0D12] text-white">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-12 pb-12 flex flex-col gap-4">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Autodiagnóstico gratis · {info.corto} de 3</p>
          <h1 className="m-0 font-tight text-[34px] md:text-[48px] leading-[1.06] font-extrabold max-w-[900px]">{info.titulo}</h1>
          <p className="m-0 text-lg text-[#C3C8D1] max-w-[760px]">{info.bajada}</p>
          <Escalera nivel={nivel} hechos={hechos} token={token} />
        </div>
        <div className="db-scan"><i /></div>
      </section>

      <section className="bg-[#F5F6F8]">
        <div className="max-w-[960px] mx-auto px-4 md:px-8 py-10 md:py-14">
          {cargando ? (
            <p role="status" aria-busy="true" className="m-0 rounded-2xl border border-[#E2E5EA] bg-white p-8 text-[#4A515C]">Cargando…</p>
          ) : errorRed && nivel > 1 ? (
            <div role="alert" className="rounded-2xl border border-[#E2E5EA] bg-white p-8 flex flex-col gap-3">
              <h2 className="m-0 font-tight text-2xl font-extrabold">No pudimos conectarnos</h2>
              <p className="m-0 text-[#4A515C]">Revisá tu conexión y probá de nuevo.</p>
              <button type="button" onClick={cargarPerfil} className={btnP + " self-start"}>Reintentar</button>
            </div>
          ) : bloqueado && paso !== "resultado" ? (
            <Bloqueado nivel={nivel} perfil={perfil} token={token} />
          ) : paso === "inicio" ? (
            <Inicio nivel={nivel} perfil={perfil} datos={datos} set={set} foco={foco} onEmpezar={() => { setI(0); setPaso("preguntas") }} />
          ) : paso === "preguntas" ? (
            <div className="flex flex-col gap-4">
              <Progreso actual={i + 1} total={preguntas.length} hechas={respondidas} />
              <PreguntaCard key={q.id} q={q} n={i + 1} valor={r[i]} onResp={responder} foco={foco} />
              {error && <p role="alert" className="m-0 font-semibold text-[#B42318]">{error}</p>}
              <div className="flex flex-wrap justify-between gap-3">
                <button type="button" onClick={() => mover(-1)} className={btnS}><ArrowLeft size={18} aria-hidden="true" /> Anterior</button>
                <button type="button" onClick={() => mover(1)} disabled={r[i] == null} className={btnP}>{i === preguntas.length - 1 ? (perfil ? "Ver mi resultado" : "Terminar") : "Siguiente"} <ArrowRight size={18} aria-hidden="true" /></button>
              </div>
            </div>
          ) : paso === "datos" ? (
            <form onSubmit={submitDatos} className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 grid gap-4 sm:grid-cols-2" noValidate={false}>
              <div className="sm:col-span-2 flex flex-col gap-2">
                <h2 ref={foco} tabIndex={-1} className="m-0 font-tight text-[26px] md:text-[30px] font-extrabold outline-none">¡Listo! Tu resultado está por aparecer</h2>
                {previo && <p className="m-0 text-[17px] text-[#262C37]">Puntaje general: <strong>{previo.puntaje}/100 · {previo.etiqueta}</strong>. Dejanos tus datos para ver el detalle, recibir el informe por email y destrabar el nivel 2.</p>}
              </div>
              <label className={lbl}>Nombre y apellido *<input required value={datos.nombre} onChange={set("nombre")} className={input} autoComplete="name" /></label>
              <label className={lbl}>Email *<input required type="email" inputMode="email" value={datos.email} onChange={set("email")} className={input} autoComplete="email" />
                {sugerencia && <button type="button" onClick={() => setDatos({ ...datos, email: sugerencia })} className="self-start text-sm font-normal text-[#C8231F] underline">¿Quisiste decir {sugerencia}?</button>}
              </label>
              <label className={lbl}>Organización<input value={datos.organizacion} onChange={set("organizacion")} className={input} autoComplete="organization" /></label>
              <label className={lbl}>WhatsApp (opcional)<input type="tel" inputMode="tel" value={datos.telefono} onChange={set("telefono")} className={input} autoComplete="tel" /></label>
              <label className="sm:col-span-2 flex items-start gap-3 text-[15px]"><input type="checkbox" required checked={datos.acepta} onChange={set("acepta")} className="mt-1 w-5 h-5 shrink-0 accent-[#C8231F]" /> <span>Acepto la <a href="/privacidad" target="_blank" className="underline">política de privacidad</a>. Usamos tus datos para enviarte el informe y crear tu cuenta, conforme a la Ley 25.326.</span></label>
              <label className="sm:col-span-2 flex items-start gap-3 text-[15px]"><input type="checkbox" checked={datos.recordatorio} onChange={set("recordatorio")} className="mt-1 w-5 h-5 shrink-0 accent-[#C8231F]" /> <span>Avisame por email si no sigo con el nivel siguiente (un solo recordatorio; podés darte de baja en cualquier correo).</span></label>
              <input type="text" name="website" value={datos.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {error && <p role="alert" className="sm:col-span-2 m-0 font-semibold text-[#B42318]">{error}</p>}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setPaso("preguntas")} className={btnS}><ArrowLeft size={18} aria-hidden="true" /> Revisar respuestas</button>
                <button type="submit" className={btnP}>Ver mi resultado completo</button>
              </div>
              <p className="sm:col-span-2 m-0 text-sm text-[#4A515C]">Con tu email se crea tu cuenta gratis en DEVISEBIT: ahí quedan guardados tus resultados y entrás sin contraseña.</p>
            </form>
          ) : paso === "enviando" ? (
            <p role="status" aria-busy="true" className="m-0 rounded-2xl border border-[#E2E5EA] bg-white p-8 text-[#4A515C]">Calculando tu resultado…</p>
          ) : res ? (
            <ResultadoVista nivel={nivel} res={res} local={local} token={token} foco={foco} />
          ) : null}
        </div>
      </section>
    </>
  )
}

function Escalera({ nivel, hechos, token }: { nivel: Nivel; hechos: number[]; token: string | null }) {
  return (
    <ol aria-label="Los 3 niveles" className="m-0 mt-2 p-0 list-none grid grid-cols-3 gap-2 max-w-[640px]">
      {NIVELES.map((n) => {
        const hecho = hechos.includes(n.n)
        const disp = n.n === 1 || hechos.includes(n.n - 1)
        const actual = n.n === nivel
        const cls = `flex flex-col rounded-xl border px-3 py-2 text-[13px] leading-tight ${actual ? "border-[#FF6A63] bg-white/10" : "border-white/15"} ${!disp ? "text-[#9AA3AF]" : "text-white"}`
        const cont = <><span className="font-bold flex items-center gap-1">{hecho ? <Check size={14} aria-hidden="true" className="text-[#2BD576]" /> : !disp ? <Lock size={13} aria-hidden="true" /> : null}{n.corto}</span><span className="text-[#C3C8D1]">{n.titulo}</span><span className="sr-only">{hecho ? " (hecho)" : !disp ? " (bloqueado)" : ""}</span></>
        return <li key={n.n}>{disp && !actual ? <a href={n.ruta} className={cls + " hover:border-[#FF6A63]"}>{cont}</a> : <span className={cls} aria-current={actual ? "step" : undefined}>{cont}</span>}</li>
      })}
    </ol>
  )
}

function Inicio({ nivel, perfil, datos, set, foco, onEmpezar }: { nivel: Nivel; perfil: Perfil | null; datos: { organizacion: string; rubro: string }; set: (k: "organizacion" | "rubro") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; foco: React.RefObject<HTMLHeadingElement | null>; onEmpezar: () => void }) {
  const info = nivelInfo(nivel)
  const pedirRubro = !perfil?.rubro
  const pedirOrg = !perfil?.organizacion
  const ya = perfil?.completados.find((c) => c.nivel === nivel)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onEmpezar() }} className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 ref={foco} tabIndex={-1} className="m-0 font-tight text-[26px] md:text-[30px] font-extrabold outline-none">{perfil ? `Hola, ${perfil.nombre.split(" ")[0]}` : "Antes de empezar"}</h2>
        <ul className="m-0 p-0 list-none flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-[#4A515C]">
          <li><strong className="text-[#0E1116]">{PREGUNTAS[nivel].length}</strong> preguntas</li>
          <li>Unos <strong className="text-[#0E1116]">{info.minutos} minutos</strong></li>
          <li>Resultado <strong className="text-[#0E1116]">al instante</strong> y por email</li>
          <li><strong className="text-[#0E1116]">Gratis</strong></li>
        </ul>
        {perfil && <p className="m-0 text-[15px] text-[#262C37]">Respondés{perfil.organizacion ? <> por <strong>{perfil.organizacion}</strong></> : ""}. El informe va a <strong>{perfil.email}</strong>: no hace falta que cargues tus datos de nuevo.</p>}
        {ya && <p className="m-0 text-[15px] text-[#4A515C]">Ya hiciste este nivel ({ya.puntaje}/100 · {ya.etiqueta}). Si lo hacés de nuevo, guardamos el resultado nuevo.</p>}
      </div>
      {(pedirOrg || pedirRubro) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pedirOrg && <label className={lbl}>Organización (opcional)<input value={datos.organizacion} onChange={set("organizacion")} className={input} autoComplete="organization" /></label>}
          {pedirRubro && (
            <label className={lbl}>Rubro {nivel === 2 ? "" : "(opcional)"}
              <select value={datos.rubro} onChange={set("rubro")} className={input} required={nivel === 2}>
                <option value="">Elegí una opción</option>
                {RUBROS.map((x) => <option key={x.v} value={x.v}>{x.n}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
      <p className="m-0 text-sm text-[#4A515C]">Respondé pensando en cómo trabajan hoy, no en cómo les gustaría. No hay respuestas buenas o malas.</p>
      <button type="submit" className={btnP + " self-start"}>Empezar <ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  )
}

function Bloqueado({ nivel, perfil, token }: { nivel: Nivel; perfil: Perfil | null; token: string | null }) {
  const ant = nivelInfo(nivel - 1)
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle")
  const [err, setErr] = useState("")
  const titulo = useRef<HTMLHeadingElement | null>(null)
  useEffect(() => { titulo.current?.focus() }, [])
  const reenviar = async (e: React.FormEvent) => {
    e.preventDefault(); setEstado("enviando"); setErr("")
    try { const j = await llamar({ accion: "reenviar", email }); if (j.ok) setEstado("ok"); else { setEstado("error"); setErr(j.error ?? "No pudimos enviarlo.") } }
    catch { setEstado("error"); setErr("No pudimos conectarnos. Probá de nuevo.") }
  }
  return (
    <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
      <span className="w-12 h-12 rounded-2xl bg-[#0E1116] text-white flex items-center justify-center" aria-hidden="true"><Lock size={22} /></span>
      <h2 ref={titulo} tabIndex={-1} className="m-0 font-tight text-[26px] md:text-[30px] font-extrabold outline-none">Este nivel se destraba al terminar el {ant.corto.toLowerCase()}</h2>
      <p className="m-0 text-[17px] text-[#262C37]">{perfil ? `Primero hacé el ${ant.corto.toLowerCase()} (${ant.titulo}): son unos ${ant.minutos} minutos.` : `Al terminar el ${ant.corto.toLowerCase()} te mandamos por email un link personal para seguir, sin contraseña.`}</p>
      <a href={ant.ruta} className={btnP + " self-start"}>Ir al {ant.corto.toLowerCase()}: {ant.titulo}</a>
      {!perfil && (
        <form onSubmit={reenviar} className="mt-2 border-t border-[#E2E5EA] pt-5 flex flex-col gap-3">
          <h3 className="m-0 text-lg font-bold">¿Ya lo hiciste y no encontrás el link?</h3>
          {estado === "ok" ? (
            <p role="status" className="m-0 text-[#0B7A3B] font-semibold">Si ese email ya hizo un autodiagnóstico, en unos minutos le llega el link. Revisá también promociones o spam.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <label className={lbl + " flex-1"}>Tu email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" inputMode="email" /></label>
              <button type="submit" disabled={estado === "enviando"} className={btnS}><Mail size={18} aria-hidden="true" /> {estado === "enviando" ? "Enviando…" : "Reenviarme el link"}</button>
            </div>
          )}
          {estado === "error" && <p role="alert" className="m-0 text-[#B42318] font-semibold">{err}</p>}
          <p className="m-0 text-sm text-[#4A515C]">Si tenés cuenta en DEVISEBIT, también podés <a href={PORTAL} className="underline">entrar a Mi cuenta</a>.</p>
        </form>
      )}
    </div>
  )
}

function Progreso({ actual, total, hechas }: { actual: number; total: number; hechas: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 rounded-full bg-[#E2E5EA] overflow-hidden" role="progressbar" aria-label="Avance" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechas}><div className="h-full bg-[#C8231F] transition-[width] duration-300" style={{ width: `${(hechas / total) * 100}%` }} /></div>
      <span className="text-sm font-semibold tabular-nums whitespace-nowrap">Pregunta {actual} de {total}</span>
    </div>
  )
}

function PreguntaCard({ q, n, valor, onResp, foco }: { q: Pregunta; n: number; valor: number | null; onResp: (v: number) => void; foco: React.RefObject<HTMLHeadingElement | null> }) {
  const id = `p-${q.id}`
  if (q.tipo === "horas") {
    return (
      <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
        <h2 ref={foco} tabIndex={-1} className="m-0 font-tight text-[22px] md:text-[28px] leading-tight font-extrabold outline-none"><span className="sr-only">Pregunta {n}: </span><label htmlFor={id}>{q.texto}</label></h2>
        {q.ayuda && <p id={`${id}-a`} className="m-0 text-[15px] text-[#4A515C]">{q.ayuda}</p>}
        <div className="flex items-center gap-3">
          <input id={id} type="number" inputMode="numeric" min={0} max={2000} step={1} value={valor ?? ""} aria-describedby={q.ayuda ? `${id}-a` : undefined}
            onChange={(e) => { const v = e.target.value === "" ? null : Math.max(0, Math.min(2000, Math.round(Number(e.target.value)))); if (v == null || Number.isFinite(v)) onResp(v as number) }}
            className={input + " max-w-[160px] text-xl font-bold"} />
          <span className="text-[17px] font-semibold">horas por mes</span>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Valores rápidos">
          {[0, 5, 10, 20, 40, 80].map((h) => <button key={h} type="button" onClick={() => onResp(h)} aria-pressed={valor === h} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${valor === h ? "border-[#C8231F] bg-[#FBEAEA]" : "border-[#C9CED6] hover:border-[#0E1116]"}`}>{h === 0 ? "Ninguna" : `${h} h`}</button>)}
        </div>
      </div>
    )
  }
  const opciones = q.tipo === "escala" && q.noAplica ? [...q.opciones.map((t, k) => ({ v: k + 1, t })), { v: 0, t: q.noAplica }] : q.opciones.map((t, k) => ({ v: k + 1, t }))
  return (
    <fieldset className="m-0 rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 min-w-0" aria-describedby={q.ayuda ? `${id}-a` : undefined}>
      <legend className="contents"><h2 ref={foco} tabIndex={-1} className="m-0 mb-4 font-tight text-[22px] md:text-[28px] leading-tight font-extrabold outline-none"><span className="sr-only">Pregunta {n}: </span>{q.texto}</h2></legend>
      {q.ayuda && <p id={`${id}-a`} className="m-0 mb-4 text-[15px] text-[#4A515C]">{q.ayuda}</p>}
      <div className="grid gap-2.5">
        {opciones.map((o, k) => {
          const sel = valor === o.v
          return (
            <label key={o.v} className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 cursor-pointer text-[16px] transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0E1116] ${sel ? "border-[#C8231F] bg-[#FBEAEA]" : "border-[#E2E5EA] hover:border-[#8A919C]"} ${o.v === 0 ? "border-dashed" : ""}`}>
              <input type="radio" name={q.id} value={o.v} checked={sel} onChange={() => onResp(o.v)} className="sr-only" />
              <span aria-hidden="true" className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold tabular-nums ${sel ? "bg-[#C8231F] border-[#C8231F] text-white" : "border-[#B5BBC4]"}`}>{o.v === 0 ? "–" : k + 1}</span>
              <span>{o.t}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// ═════════════════════ Resultados ═════════════════════
function Cabecera({ nivel, puntaje, nombre, foco }: { nivel: Nivel; puntaje: number; nombre: string; foco: React.RefObject<HTMLHeadingElement | null> }) {
  const e = etiqueta(nivel, puntaje)
  return (
    <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[#4A515C]">Tu resultado · {nivelInfo(nivel).titulo}</p>
      <h2 ref={foco} tabIndex={-1} className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 outline-none">
        <span className="font-tight text-[56px] md:text-[64px] leading-none font-extrabold tabular-nums">{puntaje}<span className="text-2xl text-[#4A515C]">/100</span></span>
        <span className="rounded-xl bg-[#C8231F] px-4 py-1.5 font-tight text-xl font-extrabold text-white">{nombre}</span>
      </h2>
      <ol aria-label="Escala" className="m-0 p-0 list-none grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {e.todos.map((t, k) => <li key={t} aria-current={k === e.indice ? "true" : undefined} className={`rounded-lg px-2 py-2 text-center text-[13px] font-semibold ${k === e.indice ? "bg-[#0E1116] text-white" : "bg-[#EEF0F3] text-[#4A515C]"}`}>{t}</li>)}
      </ol>
    </div>
  )
}

function Barras({ items, comparacion }: { items: { k: string; n: string; puntaje: number }[]; comparacion: Respuesta["comparacion"] }) {
  return (
    <div className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
      <h3 className="m-0 font-tight text-xl font-extrabold">Tu puntaje por dimensión</h3>
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {items.map((d) => {
          const prom = comparacion?.dimensiones[d.k]
          return (
            <li key={d.k} className="grid grid-cols-[minmax(0,8.5rem)_1fr_3rem] sm:grid-cols-[11rem_1fr_3rem] items-center gap-3 text-[15px]">
              <span className="font-semibold">{d.n}</span>
              <span className="relative h-3.5 rounded-full bg-[#EEF0F3]" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 rounded-full bg-[#C8231F]" style={{ width: `${Math.max(2, d.puntaje)}%` }} />
                {prom != null && <span className="absolute -top-1 -bottom-1 w-0.5 bg-[#0E1116]" style={{ left: `${prom}%` }} />}
              </span>
              <strong className="text-right tabular-nums">{d.puntaje}<span className="sr-only"> de 100{prom != null ? `; promedio de las organizaciones: ${prom}` : ""}</span></strong>
            </li>
          )
        })}
      </ul>
      {comparacion && <p className="m-0 text-sm text-[#4A515C]"><span aria-hidden="true" className="inline-block w-0.5 h-3 bg-[#0E1116] align-middle mr-2" />Línea negra: promedio real de las {comparacion.organizaciones} organizaciones que hicieron este autodiagnóstico.</p>}
    </div>
  )
}

function Servicio({ nombre, href }: { nombre: string; href: string }) {
  return <a href={href} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#0E1116] hover:bg-[#262C37] px-3.5 py-2 text-sm font-bold text-white">Cómo lo resolvemos: {nombre} <ExternalLink size={14} aria-hidden="true" /></a>
}

function Vista1({ r, comparacion }: { r: Resultado1; comparacion: Respuesta["comparacion"] }) {
  return (
    <>
      <Barras items={r.dimensiones} comparacion={comparacion} />
      <section aria-labelledby="t-acc" className="flex flex-col gap-3">
        <h3 id="t-acc" className="m-0 font-tight text-2xl font-extrabold">Tus 3 acciones prioritarias</h3>
        {!r.acciones.length && <p className="m-0 rounded-2xl border border-[#E2E5EA] bg-white p-6">Respondiste el nivel más alto en todo. Tu desafío es sostenerlo: el nivel 2 te ayuda a encontrar lo que todavía lleva horas.</p>}
        <ol className="m-0 p-0 list-none flex flex-col gap-3">
          {r.acciones.map((a, k) => (
            <li key={a.titulo} className="rounded-2xl border border-[#E2E5EA] bg-white p-5 md:p-6 grid grid-cols-[3rem_1fr] gap-4">
              <span aria-hidden="true" className={`w-12 h-12 rounded-2xl flex items-center justify-center font-tight text-2xl font-extrabold text-white ${k === 0 ? "bg-[#C8231F]" : "bg-[#0E1116]"}`}>{k + 1}</span>
              <div className="flex flex-col gap-2 min-w-0">
                <h4 className="m-0 text-lg font-bold">{a.titulo}</h4>
                <p className="m-0 text-[15px] text-[#4A515C]">{a.porque}</p>
                <p className="m-0 text-[15px] rounded-lg bg-[#F5F6F8] px-3 py-2"><strong>Primer paso:</strong> {a.paso}</p>
                <Servicio nombre={a.servicioNombre} href={a.servicioHref} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

function Vista2({ r }: { r: Resultado2 }) {
  return (
    <section aria-labelledby="t-proc" className="flex flex-col gap-3">
      <h3 id="t-proc" className="m-0 font-tight text-2xl font-extrabold">Los 3 procesos que más conviene digitalizar</h3>
      <p className="m-0 text-[15px] text-[#4A515C]">Ordenados por las horas que nos dijiste que llevan y por qué tan manuales son hoy.{r.horasTotales > 0 && <> En total estimaste <strong className="text-[#0E1116]">{r.horasTotales} horas por mes</strong> en estas tareas.</>}</p>
      {!r.prioridades.length && <p className="m-0 rounded-2xl border border-[#E2E5EA] bg-white p-6">No marcaste procesos manuales: tus procesos ya están digitalizados. El nivel 3 te muestra qué automatizar con IA.</p>}
      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {r.prioridades.map((p, k) => (
          <li key={p.id} className="rounded-2xl border border-[#E2E5EA] bg-white p-5 md:p-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{k + 1} · {p.area}</span><h4 className="m-0 text-lg font-bold">{p.nombre}</h4></div>
              <span className="rounded-xl bg-[#F5F6F8] px-3 py-1.5 text-center"><strong className="block font-tight text-2xl tabular-nums">{p.horas}</strong><span className="text-xs text-[#4A515C]">h/mes según vos</span></span>
            </div>
            <p className="m-0 text-[15px] text-[#4A515C]">Hoy: {p.respuesta.toLowerCase()}.</p>
            <p className="m-0 text-[15px]"><strong>Lo cubre: {p.moduloNombre}.</strong> {p.moduloDetalle}</p>
            <Servicio nombre={p.servicioNombre} href={p.servicioHref} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function Vista3({ r }: { r: Resultado3 }) {
  return (
    <>
      <section aria-labelledby="t-prim" className="rounded-2xl border-2 border-[#C8231F] bg-white p-6 md:p-8 flex flex-col gap-3">
        <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[#C8231F]">Qué automatizar primero</p>
        <h3 id="t-prim" className="m-0 font-tight text-2xl md:text-3xl font-extrabold">{r.primero.nombre}</h3>
        <p className="m-0 text-[16px] text-[#262C37]">{r.primero.que}</p>
        <Servicio nombre={r.primero.servicioNombre} href={r.primero.servicioHref} />
        <h4 className="m-0 mt-2 text-base font-bold">Cómo quedaron las cuatro opciones</h4>
        <ol className="m-0 pl-5 text-[15px] text-[#262C37] flex flex-col gap-1">
          {r.ranking.map((a) => <li key={a.id}><strong>{a.nombre}</strong>: necesidad {a.necesidad}/100 · preparación {a.preparacion}/100</li>)}
        </ol>
      </section>
      {r.antes.length > 0 && (
        <section aria-labelledby="t-antes" className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-3">
          <h3 id="t-antes" className="m-0 font-tight text-xl font-extrabold">Qué hace falta antes</h3>
          <ul className="m-0 pl-5 text-[15px] flex flex-col gap-1.5">{r.antes.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      <section aria-labelledby="t-ruta" className="flex flex-col gap-3">
        <h3 id="t-ruta" className="m-0 font-tight text-2xl font-extrabold">Tu hoja de ruta de 90 días</h3>
        <ol className="m-0 p-0 list-none grid gap-3 md:grid-cols-3">
          {r.hojaDeRuta.map((h, k) => (
            <li key={h.etapa} className="rounded-2xl border border-[#E2E5EA] bg-white p-5 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">Etapa {k + 1} · {h.dias}</span>
              <h4 className="m-0 text-lg font-bold">{h.etapa}</h4>
              <ul className="m-0 pl-5 text-[15px] text-[#262C37] flex flex-col gap-1">{h.tareas.map((t) => <li key={t}>{t}</li>)}</ul>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

function Programas({ programas, token }: { programas: Programa[]; token: string | null }) {
  const [hecho, setHecho] = useState<Record<string, "enviando" | "ok" | "error">>({})
  if (!programas.length) return null
  const interes = async (id: string) => {
    setHecho((h) => ({ ...h, [id]: "enviando" }))
    try { const j = await llamar({ accion: "interes", programa: id, token }); setHecho((h) => ({ ...h, [id]: j.ok ? "ok" : "error" })) }
    catch { setHecho((h) => ({ ...h, [id]: "error" })) }
  }
  return (
    <section id="academia" aria-labelledby="t-acad" className="scroll-mt-24 rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-3">
      <h3 id="t-acad" className="m-0 font-tight text-xl font-extrabold flex items-center gap-2"><GraduationCap size={22} aria-hidden="true" className="text-[#0F766E]" /> Te recomendamos de la ACADEMIA DEVISEBIT</h3>
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {programas.map((p) => (
          <li key={p.id} className="rounded-xl border border-[#E2E5EA] p-4 flex flex-col gap-2">
            <strong className="text-[17px]">{p.nombre}</strong>
            <span className="text-[15px] text-[#4A515C]">{p.motivo}</span>
            <span className="text-sm font-semibold text-[#0F766E]">Próximamente</span>
            {hecho[p.id] === "ok"
              ? <p role="status" className="m-0 text-[15px] font-semibold text-[#0B7A3B]">¡Anotado! Te avisamos cuando abra la inscripción.</p>
              : <button type="button" onClick={() => interes(p.id)} disabled={hecho[p.id] === "enviando"} className="self-start rounded-lg border-2 border-[#0F766E] px-4 py-2 text-sm font-bold text-[#0F766E] hover:bg-[#0F766E] hover:text-white disabled:opacity-50">Dejá tu interés</button>}
            {hecho[p.id] === "error" && <p role="alert" className="m-0 text-sm text-[#B42318]">No pudimos registrarlo. Probá de nuevo.</p>}
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-[#4A515C]">Mirá los cursos disponibles en <a href={URL_CURSOS} className="underline">academia.devisebit.com/cursos</a>.</p>
    </section>
  )
}

function ResultadoVista({ nivel, res, local, token, foco }: { nivel: Nivel; res: Respuesta; local: boolean; token: string | null; foco: React.RefObject<HTMLHeadingElement | null> }) {
  const r = res.resultado
  const sig = nivel < 3 ? nivelInfo(nivel + 1) : null
  return (
    <div className="flex flex-col gap-5">
      {local
        ? <p role="alert" className="m-0 rounded-xl border border-[#F5B83D] bg-[#FFF8E6] px-4 py-3 text-[15px]">No pudimos conectarnos para guardar tu resultado ni enviarte el informe. Lo ves igual acá; probá de nuevo en un rato para destrabar el nivel siguiente.</p>
        : <p role="status" className="m-0 rounded-xl border border-[#BFE3CC] bg-[#EEF8F1] px-4 py-3 text-[15px]">{res.enviado ? "Te mandamos el informe por email. Si no lo ves, revisá promociones o spam." : "Guardamos tu resultado, pero no pudimos enviarte el email ahora. Lo ves en Mi cuenta."}</p>}
      <Cabecera nivel={nivel} puntaje={r.puntaje} nombre={r.etiqueta} foco={foco} />
      {r.nivel === 1 ? <Vista1 r={r} comparacion={res.comparacion} /> : r.nivel === 2 ? <Vista2 r={r} /> : <Vista3 r={r} />}

      {sig && !local && (
        <section aria-labelledby="t-sig" className="rounded-2xl bg-[#0E1116] text-white p-6 md:p-8 flex flex-col gap-3">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[#FF6A63]">Desbloqueaste el {sig.corto.toLowerCase()}</p>
          <h3 id="t-sig" className="m-0 font-tight text-2xl md:text-3xl font-extrabold">{sig.titulo}</h3>
          <p className="m-0 text-[#C3C8D1]">{sig.bajada} Unos {sig.minutos} minutos, sin volver a cargar tus datos.</p>
          {res.siguiente
            ? <a href={sig.ruta} className={btnP + " self-start"}>Seguir al {sig.corto.toLowerCase()} <ArrowRight size={18} aria-hidden="true" /></a>
            : <p className="m-0 font-semibold">Te mandamos el link personal para seguir a tu email.</p>}
        </section>
      )}

      {nivel === 3 && res.insignia && (
        <section aria-labelledby="t-ins" className="rounded-2xl border-2 border-[#0E1116] bg-white p-6 md:p-8 flex flex-wrap items-center gap-5">
          <span className="w-16 h-16 rounded-2xl bg-[#0E1116] text-white flex items-center justify-center shrink-0" aria-hidden="true"><Award size={32} /></span>
          <div className="flex-1 min-w-[220px] flex flex-col gap-1">
            <h3 id="t-ins" className="m-0 font-tight text-xl font-extrabold">{TEXTO_INSIGNIA}</h3>
            <p className="m-0 text-[15px] text-[#4A515C]">Código de verificación <strong className="font-mono text-[#0E1116]">{res.insignia.codigo}</strong>. Cualquiera puede verificarla.</p>
          </div>
          <Link href={`/diagnostico/insignia/${res.insignia.codigo}`} className={btnS}>Ver la insignia</Link>
        </section>
      )}

      {nivel === 3 && !local && (
        <section aria-labelledby="t-dev" className="rounded-2xl border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-3">
          <h3 id="t-dev" className="m-0 font-tight text-xl font-extrabold">Reunión de devolución sin costo</h3>
          <p className="m-0 text-[15px] text-[#262C37]">30 minutos con el equipo de DEVISEBIT para repasar los tres resultados y bajar la hoja de ruta a tu organización.</p>
          <div className="flex flex-wrap gap-3">
            <a href={AGENDA} className={btnP}><CalendarClock size={18} aria-hidden="true" /> Elegir día y horario</a>
            <Link href="/contacto#formulario" className={btnS}>Prefiero que me contacten</Link>
          </div>
        </section>
      )}
      {nivel === 3 && <Programas programas={res.programas} token={token} />}

      {!local && <p className="m-0 text-sm text-[#4A515C]">Todos tus resultados quedan en <a href={PORTAL} className="underline">Mi cuenta</a>: entrás con tu email, sin contraseña.</p>}
    </div>
  )
}
