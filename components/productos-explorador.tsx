"use client"

import { useState } from "react"
import Link from "next/link"

/**
 * Explorador de productos de /productos: lista a la izquierda, ficha con vista previa a la derecha.
 * Sin scroll "pegado": todo cambia en el lugar al elegir un producto.
 */
export type ProductoFicha = {
  id: string
  grupo: string
  title: string
  bajada: string
  items: string[]
  prueba: string
  planes?: string
  demo?: string
  vista: "clinicas" | "whatsapp" | "crm" | "tableros" | "app" | "academias" | "votacion" | "documental"
}

const ventana = "rounded-2xl border border-[#262C37] bg-[#11151C] overflow-hidden shadow-[0_30px_80px_-40px_rgba(200,35,31,.55)]"

function Barra({ t }: { t: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#262C37] bg-[#0B0D12]">
      <i className="w-2.5 h-2.5 rounded-full bg-[#3A404B]" /><i className="w-2.5 h-2.5 rounded-full bg-[#3A404B]" /><i className="w-2.5 h-2.5 rounded-full bg-[#3A404B]" />
      <span className="ml-3 font-mono text-[12px] text-[#8A919C]">{t}</span>
    </div>
  )
}

function Pill({ c, t }: { c: "ok" | "warn" | "red"; t: string }) {
  const cls = c === "ok" ? "bg-[#163A28] text-[#7FE0A8]" : c === "warn" ? "bg-[#3A2E12] text-[#F2C66D]" : "bg-[#3A1416] text-[#FF8A85]"
  return <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold ${cls}`}>{t}</span>
}

function Vista({ v }: { v: ProductoFicha["vista"] }) {
  if (v === "whatsapp")
    return (
      <div className={ventana}>
        <Barra t="Asistente · WhatsApp" />
        <div className="p-5 flex flex-col gap-2.5 text-[14px] text-white">
          <div className="self-end bg-[#1F6F43] px-3.5 py-2.5 rounded-[12px_12px_2px_12px] max-w-[80%]">Hola, ¿tienen turno con kinesiología esta semana?</div>
          <div className="self-start bg-[#1B2029] border border-[#262C37] px-3.5 py-2.5 rounded-[12px_12px_12px_2px] max-w-[80%]">Tengo jueves 10:00 o viernes 16:30. ¿Cuál te queda mejor?</div>
          <div className="self-end bg-[#1F6F43] px-3.5 py-2.5 rounded-[12px_12px_2px_12px]">Jueves 10</div>
          <div className="self-start bg-[#1B2029] border border-[#262C37] px-3.5 py-2.5 rounded-[12px_12px_12px_2px] max-w-[80%]">Listo, quedó agendado. Te recuerdo el día anterior. ✅</div>
          <div className="grid grid-cols-3 gap-2 pt-3 mt-1 border-t border-white/10">
            {[["312", "consultas"], ["74%", "resueltas solas"], ["58", "turnos"]].map(([n, l]) => (
              <div key={l} className="rounded-lg bg-[#161A22] border border-[#262C37] p-2.5"><strong className="block font-tight text-xl">{n}</strong><span className="text-[11px] text-[#9AA1AD]">{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    )
  if (v === "clinicas")
    return (
      <div className={ventana}>
        <Barra t="Agenda · Consultorio 2" />
        <div className="p-5 grid grid-cols-[56px_1fr] gap-x-3 gap-y-2 text-[13px] text-white">
          {[["08:00", "Pérez, Ana · Control", "ok"], ["08:30", "Gómez, Luis · Primera vez", "warn"], ["09:00", "Libre", ""], ["09:30", "Sosa, Marta · Kinesiología", "ok"], ["10:00", "Ruiz, Pablo · Receta", "ok"]].map(([h, p, c]) => (
            <div key={h} className="contents">
              <span className="font-mono text-[#8A919C] pt-2">{h}</span>
              <div className={`rounded-lg px-3 py-2 flex items-center justify-between ${c ? "bg-[#161A22] border border-[#262C37]" : "border border-dashed border-[#3A404B] text-[#8A919C]"}`}>
                <span>{p}</span>{c && <Pill c={c as "ok" | "warn"} t={c === "ok" ? "Confirmado" : "A confirmar"} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  if (v === "crm")
    return (
      <div className={ventana}>
        <Barra t="Padrón · Afiliados" />
        <div className="p-4 text-[13px] text-white">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-2 pb-2 text-[11px] uppercase tracking-widest text-[#8A919C]"><span>Afiliado</span><span>Aportes</span><span>Orden</span></div>
          {[["Fernández, J. · grupo 3", "ok", "Autorizada"], ["Domínguez, R.", "ok", "Pendiente"], ["Lucero, M. · grupo 2", "red", "—"], ["Ortiz, C.", "ok", "Autorizada"]].map(([n, a, o]) => (
            <div key={n} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center rounded-lg px-2 py-2.5 border-t border-[#1E232C]">
              <span>{n}</span><Pill c={a as "ok" | "red"} t={a === "ok" ? "Al día" : "Debe 2"} /><span className="text-[#C3C8D1] w-[76px] text-right">{o}</span>
            </div>
          ))}
        </div>
      </div>
    )
  if (v === "tableros")
    return (
      <div className={ventana}>
        <Barra t="Tablero · Dirección" />
        <div className="p-5 flex flex-col gap-4 text-white">
          <div className="grid grid-cols-3 gap-2">
            {[["$18,4 M", "ingresos del mes", "+12%"], ["1.284", "atenciones", "+6%"], ["3", "alertas", "revisar"]].map(([n, l, d]) => (
              <div key={l} className="rounded-lg bg-[#161A22] border border-[#262C37] p-2.5"><strong className="block font-tight text-lg">{n}</strong><span className="block text-[11px] text-[#9AA1AD]">{l}</span><span className="text-[11px] font-bold text-[#FF8A85]">{d}</span></div>
            ))}
          </div>
          <div className="flex items-end gap-2 h-[110px] px-1">
            {[38, 52, 47, 63, 58, 71, 66, 84, 79, 92].map((h, i) => (
              <span key={i} className={`flex-1 rounded-t ${i === 9 ? "bg-[#FF6A63]" : "bg-[#3A404B]"}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  if (v === "app")
    return (
      <div className="flex justify-center">
        <div className="w-[230px] rounded-[34px] border-[6px] border-[#262C37] bg-[#11151C] p-4 flex flex-col gap-3 text-white shadow-[0_30px_80px_-40px_rgba(200,35,31,.55)]">
          <span className="mx-auto w-16 h-1.5 rounded-full bg-[#262C37]" />
          <div className="rounded-2xl bg-gradient-to-br from-[#C8231F] to-[#7E1512] p-4 flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Credencial digital</span>
            <strong className="font-tight text-lg leading-tight">María Lucero</strong>
            <div className="flex items-end justify-between"><span className="text-[11px] text-white/80">Socia N.º 10.482<br />Al día</span><span className="w-12 h-12 rounded-md bg-white grid grid-cols-4 gap-[2px] p-1">{Array.from({ length: 16 }).map((_, i) => <i key={i} className={(i * 7) % 3 ? "bg-[#0B0D12]" : "bg-white"} />)}</span></div>
          </div>
          {["Beneficios cerca tuyo", "Novedades", "Mis pagos"].map((t) => <div key={t} className="rounded-xl bg-[#161A22] border border-[#262C37] px-3 py-2.5 text-[13px]">{t}</div>)}
        </div>
      </div>
    )
  if (v === "academias")
    return (
      <div className={ventana}>
        <Barra t="Campus · Mi curso" />
        <div className="p-5 flex flex-col gap-3 text-white text-[13px]">
          <strong className="font-tight text-lg">Atención al afiliado · Módulo 3</strong>
          <div className="h-2 rounded-full bg-[#262C37]"><span className="block h-full w-[72%] rounded-full bg-[#FF6A63]" /></div>
          <span className="text-[#9AA1AD]">72% completado · 8 de 11 clases</span>
          {[["Clase en vivo · jueves 19 h", "warn", "Próxima"], ["Examen del módulo 2", "ok", "Aprobado"]].map(([t, c, l]) => (
            <div key={t} className="rounded-lg bg-[#161A22] border border-[#262C37] px-3 py-2.5 flex items-center justify-between"><span>{t}</span><Pill c={c as "ok" | "warn"} t={l} /></div>
          ))}
          <div className="rounded-lg border border-[#FF6A63]/40 bg-[#C8231F]/10 px-3 py-2.5 flex items-center justify-between"><span>Certificado verificable</span><span className="font-mono text-[11px] text-[#FF8A85]">CERT-7F3A</span></div>
        </div>
      </div>
    )
  if (v === "votacion")
    return (
      <div className={ventana}>
        <Barra t="Elección · Consejo" />
        <div className="p-5 flex flex-col gap-3 text-white text-[13px]">
          <div className="flex justify-between text-[#9AA1AD]"><span>Participación</span><strong className="text-white">87%</strong></div>
          {[["Lista 1", 54], ["Lista 2", 38], ["En blanco", 8]].map(([l, p]) => (
            <div key={l as string} className="flex flex-col gap-1">
              <div className="flex justify-between"><span>{l}</span><span className="font-mono">{p}%</span></div>
              <div className="h-2.5 rounded-full bg-[#262C37]"><span className="block h-full rounded-full bg-[#FF6A63]" style={{ width: `${p}%` }} /></div>
            </div>
          ))}
          <div className="mt-1 rounded-lg bg-[#161A22] border border-[#262C37] px-3 py-2.5 flex items-center justify-between"><span>Acceso con QR · Molinete 3</span><Pill c="ok" t="Habilitado" /></div>
        </div>
      </div>
    )
  return (
    <div className={ventana}>
      <Barra t="Documentos · Expediente 2026-114" />
      <div className="p-4 flex flex-col gap-2 text-white text-[13px]">
        {[["Contrato de prestación.pdf", "ok", "Firmado"], ["Anexo de precios.pdf", "warn", "Falta 1 firma"], ["Acta de inicio.pdf", "ok", "Firmado"], ["Póliza vigente.pdf", "red", "Vence en 5 días"]].map(([n, c, l]) => (
          <div key={n} className="rounded-lg bg-[#161A22] border border-[#262C37] px-3 py-2.5 flex items-center justify-between gap-3"><span className="truncate">📄 {n}</span><Pill c={c as "ok" | "warn" | "red"} t={l} /></div>
        ))}
      </div>
    </div>
  )
}

export default function ProductosExplorador({ productos }: { productos: ProductoFicha[] }) {
  const [sel, setSel] = useState(productos[0].id)
  const p = productos.find((x) => x.id === sel) ?? productos[0]
  const grupos = Array.from(new Set(productos.map((x) => x.grupo)))
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-10 items-start">
      <div role="tablist" aria-label="Productos" aria-orientation="vertical" className="flex flex-wrap lg:flex-nowrap lg:flex-col gap-2">
        {grupos.map((g) => (
          <div key={g} className="contents lg:flex lg:flex-col lg:gap-1.5">
            <span className="hidden lg:block mt-3 first:mt-0 mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A919C]">{g}</span>
            {productos.filter((x) => x.grupo === g).map((x) => {
              const on = x.id === sel
              return (
                <button
                  key={x.id}
                  id={x.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls="ficha-producto"
                  onClick={() => { setSel(x.id); if (window.innerWidth < 1024) requestAnimationFrame(() => document.getElementById("ficha-producto")?.scrollIntoView({ behavior: "smooth", block: "start" })) }}
                  className={`scroll-mt-28 text-left rounded-xl px-3.5 py-2.5 lg:px-4 lg:py-3 border transition-colors ${on ? "border-[#FF6A63] bg-[#1B1012] text-white" : "border-[#262C37] bg-[#11151C] text-[#C3C8D1] hover:border-[#3A404B] hover:text-white"}`}
                >
                  <span className="block font-semibold text-[14px] lg:text-[15px]">{x.title}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div id="ficha-producto" role="tabpanel" aria-live="polite" className="scroll-mt-24 grid xl:grid-cols-[1fr_1fr] gap-8 items-center rounded-[24px] border border-[#262C37] bg-[#0F1218] p-5 md:p-9 lg:min-h-[460px]">
        <div key={p.id} className="db-rise flex flex-col gap-4">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF6A63]">{p.grupo}</span>
          <h3 className="m-0 font-tight text-[28px] md:text-[34px] leading-[1.1] font-extrabold text-white">{p.title}</h3>
          <p className="m-0 text-[17px] leading-relaxed text-[#C3C8D1]">{p.bajada}</p>
          <ul className="m-0 p-0 list-none grid sm:grid-cols-2 gap-x-4 gap-y-2">
            {p.items.map((i) => <li key={i} className="flex gap-2 text-[15px] text-white"><span className="text-[#FF6A63] font-extrabold" aria-hidden="true">—</span>{i}</li>)}
          </ul>
          <p className="m-0 rounded-xl border border-[#262C37] bg-[#11151C] px-4 py-3 text-[14px] text-[#C3C8D1]"><strong className="text-white">En producción:</strong> {p.prueba}</p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {p.demo && <a href={p.demo} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Pedir la demo</a>}
            {p.planes && <Link href={p.planes} className="rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[18px] py-[10px] font-bold text-white transition-colors">Planes y precios</Link>}
            <Link href={`/contacto?tema=${encodeURIComponent("Producto: " + p.title)}#formulario`} className="inline-flex items-center px-2 py-3 font-semibold text-[#FF8A85] hover:text-white">Hablar con nosotros →</Link>
          </div>
        </div>
        <div key={p.id + "-v"} className="db-rise3"><Vista v={p.vista} /></div>
      </div>
    </div>
  )
}
