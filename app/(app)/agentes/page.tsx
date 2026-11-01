import Link from "next/link"
import { requerir } from "@/lib/auth"

export const dynamic = "force-dynamic"

const BITACORA = "https://claude.ai/artifact/A3bCp4fngB5f8R2Jbw9diD"
const DOC_EQUIPO = "https://claude.ai/artifact/XDzM3Yyu88voYG31XyFKxx"

type Agente = { n: string; puesto: string; cuando: string; hace: string[]; limites: string; reporta: string }

const AGENTES: Agente[] = [
  { n: "Control diario", puesto: "Jefe de gabinete", cuando: "Todos los días · 07:50", reporta: "Julio", hace: ["Lee los partes del equipo y avisa quién no entregó", "Revisa las tareas programadas, los despliegues y lo publicado", "Te manda el semáforo del día por mail y al celular"], limites: "Solo lee y avisa. No publica, no envía, no borra." },
  { n: "Administrativo", puesto: "Asistente de dirección", cuando: "Lun a vie · 06:21", reporta: "Julio", hace: ["Agenda de hoy y mañana, con huecos para vender", "Ficha de cada reunión con terceros", "Mails que necesitan respuesta, con borradores listos", "Vencimientos de servicios, dominios e impuestos"], limites: "Solo deja borradores en Gmail. Nunca envía ni borra." },
  { n: "Finanzas", puesto: "Control financiero", cuando: "Lun a vie · 06:34 (informe completo los viernes)", reporta: "Julio", hace: ["Vencimientos y cobros pendientes de las empresas", "Comisiones y liquidaciones que informan por mail", "Alertas de planillas desactualizadas o números que no cierran"], limites: "Solo mira y avisa. No mueve plata ni modifica planillas. Cita la fuente de cada cifra." },
  { n: "Ventas", puesto: "Seguimiento comercial", cuando: "Lun a vie · 06:47", reporta: "Julio", hace: ["Respuestas nuevas de interesados", "Borradores de seguimiento para quienes no contestaron", "Resumen post-reunión para los asistentes", "Estado del pipeline y prioridades sin movimiento"], limites: "Solo borradores. Sin precios. No entra a LinkedIn." },
  { n: "Comercial", puesto: "Propuestas y licitaciones", cuando: "Martes y jueves · 07:13", reporta: "Julio", hace: ["Elige una oportunidad abierta del Radar de licitaciones", "Arma el borrador de propuesta con requisitos y documentación", "Deja dudas para consultar al organismo"], limites: "No presenta nada ni inventa experiencia. Los montos los define Julio." },
  { n: "Contenido", puesto: "Plan de contenido", cuando: "Viernes · 07:36", reporta: "Julio y Jime", hace: ["Qué rindió mejor en redes la semana", "Plan de la semana siguiente día por día", "Piezas listas para que Jime diseñe, con texto y pedido de imagen"], limites: "No publica ni programa: eso lo hacen las tareas de publicación." },
]

export default async function Agentes() {
  await requerir()
  return (
    <div className="flex flex-col gap-6">
      <header className="pag-cab">
        <div><div className="eyebrow">Dirección</div><h1 className="m-0">Equipo de agentes</h1><p>Los agentes trabajan como parte de la empresa: cada uno tiene un puesto, un horario, un entregable y límites claros. Reportan todos los días en la Bitácora del equipo.</p></div>
        <div className="pag-acc"><a href={BITACORA} target="_blank" rel="noopener noreferrer" className="btn-p">Abrir la Bitácora</a><a href={DOC_EQUIPO} target="_blank" rel="noopener noreferrer" className="btn-s">Reglas del equipo</a></div>
      </header>

      <ul className="m-0 p-0 list-none grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTES.map((a) => (
          <li key={a.n} className="card flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="shrink-0 w-11 h-11 rounded-full bg-[#0E1116] text-[#FF6A63] font-extrabold flex items-center justify-center">{a.n.slice(0, 1)}</span>
              <div className="min-w-0"><h2 className="m-0 text-lg">{a.n}</h2><p className="m-0 text-sm text-[var(--gris)]">{a.puesto} · reporta a {a.reporta}</p></div>
            </div>
            <p className="m-0 text-sm"><span className="chip bg-emerald-50 text-emerald-700">Activo</span> <span className="ml-1 text-[var(--gris)]">{a.cuando}</span></p>
            <ul className="m-0 pl-5 text-sm flex flex-col gap-1">{a.hace.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="m-0 mt-auto text-xs text-[var(--gris)]"><strong className="text-[var(--tinta)]">Límite:</strong> {a.limites}</p>
          </li>
        ))}
      </ul>

      <p className="m-0 text-sm text-[var(--gris)]">También trabajan en el equipo los agentes de Radar de licitaciones, publicación diaria en redes, YouTube semanal, nota semanal del blog y noticias del panel. Todos siguen las mismas reglas compartidas. <Link href="/gestion" className="underline">Volver al tablero de dirección</Link></p>
    </div>
  )
}
