"use client"

import { useMemo, useState } from "react"
import { Check, X, Copy, MessageCircle } from "lucide-react"

/** Herramienta del Programa KIT 4.0: elegibilidad, kit recomendado, cofinanciamiento estimado y carpeta de documentos.
 *  Todo se calcula en el navegador; no se envía ningún dato. Valores según la normativa vigente al 31/10/2026 (verificar siempre en la fuente oficial). */

const REQUISITOS = [
  { id: "anios", t: "Tengo al menos 2 años de actividad en lo que voy a presentar", d: "Con comprobantes (facturas, inscripciones, balances)." },
  { id: "pais", t: "La actividad se desarrolla en Argentina", d: "" },
  { id: "mipyme", t: "Tengo el Certificado MiPyME vigente", d: "Se tramita en ARCA / Ministerio de Economía; es gratuito." },
  { id: "deuda", t: "No tengo deuda fiscal ni previsional exigible", d: "ARCA y seguridad social al día al momento de presentar." },
  { id: "tad", t: "Tengo CUIT activo, clave fiscal y adhesión a Trámites a Distancia (TAD)", d: "Si es una sociedad, con la delegación de servicios en ARCA." },
]

type Kit = { id: string; nombre: string; para: string; incluye: string; tope?: number; nota: string }
const KITS: Kit[] = [
  { id: "COM-01", nombre: "Canales y comercio digital", para: "Vender, recibir pedidos, presupuestos, reservas o turnos online.", incluye: "Un canal digital para 1 CUIT y unidad de negocio, hasta 250 productos o servicios, 15 usuarios, 3 integraciones simples y licencias o hosting hasta 12 meses.", nota: "No cubre marca, publicidad, redes, SEO continuo, operación diaria ni comisiones de cobro." },
  { id: "COM-02", nombre: "CRM, automatización y experiencia del cliente", para: "Ordenar contactos, seguimiento comercial, posventa y fidelización.", incluye: "CRM nuevo o ampliado: hasta 25 usuarios, 2 embudos de venta, 5.000 registros, 8 automatizaciones, 2 integraciones y 2 tableros.", nota: "Exige al menos un canal de consultas activo. Mejora una operación comercial existente; no la crea. No cubre vendedores, bases de datos, call center ni la operación mensual." },
  { id: "COM-03", nombre: "Analítica e inteligencia artificial comercial", para: "Priorizar clientes, pronosticar demanda, segmentar o sumar un asistente con IA.", incluye: "Uno o dos casos de uso de IA o analítica, implementados y en uso.", tope: 15_000_000, nota: "Requiere datos suficientes y utilizables. No se financian diagnósticos, tableros descriptivos como único resultado ni prototipos sin operación." },
  { id: "CAL-01", nombre: "Sistema de gestión (ISO)", para: "Implementar ISO 9001, 14001 o 45001.", incluye: "Hasta 160 horas de consultoría para un establecimiento productivo: diagnóstico, documentación, capacitación, implementación y auditoría interna.", nota: "Una norma por solicitud. No cubre software de oficina genérico, almacenamiento ni firma electrónica." },
  { id: "IND", nombre: "Kits industriales (básicos, de gestión y avanzados)", para: "Planta: conectividad, ERP/MES, control de piso, IoT, mantenimiento predictivo.", incluye: "Catálogo de 12 kits del programa original para pymes industriales.", nota: "Los topes dependen del kit; se confirman en el catálogo oficial." },
]

const NECESIDADES = [
  { id: "vender", t: "Quiero vender o recibir pedidos, reservas o turnos online", kit: "COM-01" },
  { id: "clientes", t: "Quiero ordenar mis clientes y automatizar el seguimiento", kit: "COM-02" },
  { id: "ia", t: "Quiero usar datos o inteligencia artificial para vender mejor", kit: "COM-03" },
  { id: "iso", t: "Quiero certificar ISO 9001, 14001 o 45001", kit: "CAL-01" },
  { id: "planta", t: "Tengo una planta y quiero digitalizarla", kit: "IND" },
]

const DOCS = [
  "CUIT activo y clave fiscal con nivel de seguridad suficiente",
  "Adhesión a Trámites a Distancia (TAD) y, si sos sociedad, delegación de servicios en ARCA",
  "Certificado MiPyME vigente",
  "Constancias de actividad de al menos 2 años (inscripciones, facturas, balances)",
  "Libre de deuda fiscal y previsional exigible",
  "Presupuesto del proveedor desglosado: software, implementación, servicios profesionales, integraciones, capacitación y soporte",
  "Descripción del problema, del uso esperado y del alcance del kit elegido",
  "Para analítica e IA: descripción de los datos disponibles y cómo se usan hoy",
  "Solicitud de Elegibilidad presentada en TAD con el presupuesto adjunto",
  "Ticket de reserva de cupo y acta de inicio firmada con el proveedor",
  "Al finalizar: Acta de Recepción Conforme firmada",
]

const ars = (n: number) => "$" + Math.round(n).toLocaleString("es-AR")
const WA = "https://wa.me/5491173466490?text="

export default function Kit40Herramienta() {
  const [req, setReq] = useState<Record<string, boolean>>({})
  const [nec, setNec] = useState<Record<string, boolean>>({})
  const [monto, setMonto] = useState("")
  const [copiado, setCopiado] = useState(false)

  const cumple = REQUISITOS.filter((r) => req[r.id]).length
  const falta = REQUISITOS.filter((r) => !req[r.id])
  const completo = cumple === REQUISITOS.length
  const elegidos = useMemo(() => KITS.filter((k) => NECESIDADES.some((n) => nec[n.id] && n.kit === k.id)), [nec])
  const neto = Number(monto.replace(/\D/g, "")) || 0
  const principal = elegidos.find((k) => k.tope) ?? null
  const bruto = neto * 0.5
  const apoyo = principal?.tope && elegidos.length === 1 ? Math.min(bruto, principal.tope) : bruto
  const hayTope = elegidos.length === 1 && !!principal?.tope
  const tocaTope = hayTope && bruto > (principal?.tope ?? 0)

  const resumen = [
    "Kit 4.0: mi resumen",
    `Requisitos cumplidos: ${cumple}/${REQUISITOS.length}`,
    falta.length ? "Me falta: " + falta.map((f) => f.t).join("; ") : "Cumplo todos los requisitos.",
    elegidos.length ? "Kits de interés: " + elegidos.map((k) => `${k.id} ${k.nombre}`).join("; ") : "",
    neto ? `Proyecto neto estimado: ${ars(neto)} (cofinanciamiento estimado hasta ${ars(apoyo)})` : "",
  ].filter(Boolean).join("\n")

  const copiar = async () => {
    try { await navigator.clipboard.writeText(resumen + "\n\nDocumentos:\n" + DOCS.map((d) => "☐ " + d).join("\n")); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch {}
  }

  const check = "h-6 w-6 shrink-0 rounded-md border-2 border-[#C3C8D1] accent-[#C8231F]"

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="k-req" className="rounded-[20px] border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="k-req" className="m-0 font-tight text-2xl font-extrabold">1. ¿Cumplís los requisitos?</h3>
          <span className={"rounded-full px-3 py-1 text-sm font-bold " + (completo ? "bg-[#E3F2E8] text-[#0B7A3B]" : "bg-[#F5F6F8] text-[#4A515C]")} role="status">{cumple} de {REQUISITOS.length}</span>
        </div>
        <ul className="m-0 p-0 list-none flex flex-col gap-3">
          {REQUISITOS.map((r) => (
            <li key={r.id}>
              <label className="flex gap-3 items-start cursor-pointer">
                <input type="checkbox" className={check + " mt-0.5"} checked={!!req[r.id]} onChange={(e) => setReq({ ...req, [r.id]: e.target.checked })} />
                <span><span className="font-semibold">{r.t}</span>{r.d && <span className="block text-sm text-[#4A515C]">{r.d}</span>}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[15px] flex items-start gap-2" role="status">
          {completo
            ? <><Check size={20} className="text-[#0B7A3B] shrink-0 mt-0.5" aria-hidden="true" /> <span>Cumplís los requisitos generales. El siguiente paso es elegir el kit y pedir el presupuesto a un proveedor del programa.</span></>
            : <><X size={20} className="text-[#C8231F] shrink-0 mt-0.5" aria-hidden="true" /> <span>Todavía no cumplís: {falta.map((f) => f.t.toLowerCase()).join("; ")}. Se puede resolver antes de presentar: te ayudamos a ordenarlo.</span></>}
        </p>
      </section>

      <section aria-labelledby="k-kit" className="rounded-[20px] border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
        <h3 id="k-kit" className="m-0 font-tight text-2xl font-extrabold">2. ¿Qué querés lograr?</h3>
        <ul className="m-0 p-0 list-none flex flex-col gap-3">
          {NECESIDADES.map((n) => (
            <li key={n.id}>
              <label className="flex gap-3 items-start cursor-pointer">
                <input type="checkbox" className={check + " mt-0.5"} checked={!!nec[n.id]} onChange={(e) => setNec({ ...nec, [n.id]: e.target.checked })} />
                <span className="font-semibold">{n.t}</span>
              </label>
            </li>
          ))}
        </ul>
        {elegidos.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {elegidos.map((k) => (
              <article key={k.id} className="rounded-2xl bg-[#F5F6F8] p-5 flex flex-col gap-2">
                <span className="text-xs font-bold tracking-[0.14em] text-[#C8231F]">KIT {k.id}</span>
                <h4 className="m-0 font-tight text-lg font-bold">{k.nombre}</h4>
                <p className="m-0 text-[15px] text-[#4A515C]">{k.incluye}</p>
                <p className="m-0 text-sm text-[#4A515C]"><strong>Ojo:</strong> {k.nota}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="k-monto" className="rounded-[20px] border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
        <h3 id="k-monto" className="m-0 font-tight text-2xl font-extrabold">3. ¿Cuánto cofinancia el programa?</h3>
        <label className="flex flex-col gap-1.5 max-w-[420px] font-semibold text-[15px]">
          Monto neto del proyecto (sin IVA), en pesos
          <input inputMode="numeric" value={monto ? Number(monto.replace(/\D/g, "")).toLocaleString("es-AR") : ""} onChange={(e) => setMonto(e.target.value)} placeholder="Ej.: 12.000.000" className="rounded-xl border border-[#C3C8D1] px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-[#C8231F]/40 focus:border-[#C8231F]" />
        </label>
        {neto > 0 && (
          <div className="rounded-2xl bg-[#0B0D12] text-white p-6 grid gap-4 sm:grid-cols-3" role="status">
            <div><span className="block text-sm text-[#C3C8D1]">Cofinanciamiento estimado</span><span className="font-tight text-3xl font-extrabold text-[#FF6A63]">{ars(apoyo)}</span></div>
            <div><span className="block text-sm text-[#C3C8D1]">Tu parte estimada</span><span className="font-tight text-3xl font-extrabold">{ars(neto - apoyo)}</span></div>
            <div><span className="block text-sm text-[#C3C8D1]">Cobertura</span><span className="font-tight text-3xl font-extrabold">{Math.round((apoyo / neto) * 100)}%</span></div>
          </div>
        )}
        <p className="m-0 text-sm text-[#4A515C]">
          Estimación: el programa cubre hasta el 50% del valor neto del proyecto{tocaTope ? `, con un tope de ${ars(principal!.tope!)} para el kit ${principal!.id}` : ", con un tope que depende de cada kit"}. El monto final lo define el catálogo oficial y la aprobación del cupo. Esta cuenta orienta; no es una promesa de aprobación.
        </p>
      </section>

      <section aria-labelledby="k-docs" className="rounded-[20px] border border-[#E2E5EA] bg-white p-6 md:p-8 flex flex-col gap-4">
        <h3 id="k-docs" className="m-0 font-tight text-2xl font-extrabold">4. Tu carpeta de documentación</h3>
        <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
          {DOCS.map((d) => <li key={d} className="flex gap-3 text-[15px]"><span className="text-[#C8231F] font-extrabold" aria-hidden="true">☐</span>{d}</li>)}
        </ul>
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button type="button" onClick={copiar} className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0E1116] hover:bg-[#0E1116] hover:text-white px-5 py-3 font-bold transition-colors"><Copy size={18} aria-hidden="true" /> {copiado ? "¡Copiado!" : "Copiar mi resumen y la lista"}</button>
          <a href={WA + encodeURIComponent(resumen)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1EB956] px-5 py-3 font-bold text-[#0B0D12] transition-colors"><MessageCircle size={18} aria-hidden="true" /> Pedir la revisión gratis por WhatsApp</a>
        </div>
      </section>
    </div>
  )
}
