import Link from "next/link"
import { requerir, ROL_NOMBRE } from "@/lib/auth"
import Imprimir from "@/components/Imprimir"

export const dynamic = "force-dynamic"

type Sec = { id: string; t: string; para: string[]; pasos: string[]; tips?: string[]; link?: string }
const SECCIONES: Sec[] = [
  {
    id: "inicio", t: "Primeros pasos", para: ["todos"], link: "/cuenta",
    pasos: [
      "Entrá en sistema.devisebit.com con tu usuario y clave. Si es la primera vez, usá el enlace de activación que te mandó Dirección y elegí tu clave.",
      "En *Mi perfil* subí tu foto, cargá tu email (sirve para recuperar la clave) y activá los *avisos al celular*.",
      "Desde el celular: abrí el sistema en el navegador y elegí *Agregar a pantalla de inicio*. Queda como una app con accesos a Resumen, Chats, Contactos y Proyectos.",
    ],
  },
  {
    id: "conversaciones", t: "Conversaciones (bot de WhatsApp e Instagram)", para: ["gerente", "coordinacion"], link: "/consultas",
    pasos: [
      "Todo lo que entra por WhatsApp, Instagram y el formulario de devisebit.com aparece acá. El bot responde solo y va tomando nombre, organización, necesidad y email.",
      "Las tarjetas de arriba filtran: *Sin atender*, *En seguimiento*, *Pasaron al CRM* y *Descartadas*. El chip rojo *Quiere una persona* marca a quien pidió hablar con alguien.",
      "Para responder vos, escribí en la caja de la conversación: sale por el mismo canal y el bot queda en pausa 24 h en ese chat. Podés reactivarlo con un botón.",
      "Si una respuesta tuya sirve para el futuro, tocá *Enseñar al bot* debajo del mensaje.",
      "Cuando el bot ya tiene nombre y necesidad, crea solo el contacto en el CRM. Si no, usá *Pasar a contacto del CRM*.",
    ],
    tips: ["WhatsApp solo deja responder libremente dentro de las 24 h del último mensaje del cliente. Pasado ese plazo, usá el botón de WhatsApp."],
  },
  {
    id: "contactos", t: "Contactos y embudo", para: ["todos"], link: "/contactos",
    pasos: [
      "Cada contacto tiene una etapa: *Nuevo → Conversando → Reunión → Propuesta enviada → Ganado / Perdido*.",
      "Cargá siempre el *próximo paso* con fecha: el Resumen y la campanita te avisan cuando vence.",
      "Desde la ficha podés escribirle por WhatsApp o email, ver sus conversaciones con el bot y crear un proyecto.",
      "*Exportar* baja la lista a Excel (CSV).",
    ],
  },
  {
    id: "proyectos", t: "Proyectos y Trello", para: ["todos"], link: "/proyectos",
    pasos: [
      "Los proyectos se ven en columnas por estado. Al pasar uno a *En curso*, el contacto queda como *Ganado*.",
      "Cargá cliente, servicio, fechas, monto y responsable. La campanita avisa si una entrega se vence.",
      "Con Trello conectado, *Crear tablero en Trello* arma el tablero con listas Pendiente / En curso / Hecho, y desde el sistema ves el avance y sumás tareas.",
    ],
  },
  {
    id: "bot", t: "Bot · Conocimiento", para: ["gerente", "coordinacion"], link: "/bot",
    pasos: [
      "Acá ves lo que el equipo le enseñó al asistente y podés agregar, editar o desactivar respuestas.",
      "*Modo del bot*: siempre, solo fuera de horario (lunes a viernes de 8 a 20 h atiende el equipo) o nunca (solo registra y avisa).",
    ],
  },
  {
    id: "usuarios", t: "Usuarios y seguridad", para: ["gerente"], link: "/usuarios",
    pasos: [
      "Roles: *Dirección* ve y edita todo; *Comercial* atiende conversaciones, contactos, proyectos y el bot; *Desarrollo* y *Solo lectura* consultan.",
      "Para sumar a alguien: *Usuarios* → agregar, y *Generar enlace de activación*; se lo mandás por WhatsApp.",
      "Auditoría muestra quién cambió qué y cuándo.",
    ],
  },
]

export default async function Ayuda() {
  const u = await requerir()
  const visibles = SECCIONES.filter((x) => x.para.includes("todos") || x.para.includes(u.rol))
  const fmt = (t: string) => t.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith("*") ? <strong key={i}>{p.slice(1, -1)}</strong> : p))
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Manual del sistema</h1>
          <p className="m-0 text-sm text-[#4A515C]">Guía paso a paso para tu rol: <strong>{ROL_NOMBRE[u.rol]}</strong>. Ante cualquier duda, consultá a Dirección.</p>
        </div>
        <Imprimir texto="Descargar en PDF" />
      </div>
      <nav className="card flex flex-wrap gap-2 no-print">
        {visibles.map((x) => <a key={x.id} href={`#${x.id}`} className="chip text-sm px-3 py-1 border bg-white border-[#C3C8D1] hover:border-[#C8231F]">{x.t}</a>)}
      </nav>
      {visibles.map((x, n) => (
        <section key={x.id} id={x.id} className="card flex flex-col gap-3 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0">{n + 1}. {x.t}</h2>
            {x.link && <Link href={x.link} className="btn-s py-1 px-3 text-xs no-print">Ir a {x.t}</Link>}
          </div>
          <ol className="m-0 pl-5 flex flex-col gap-2 text-[15px] leading-relaxed">{x.pasos.map((p, i) => <li key={i}>{fmt(p)}</li>)}</ol>
          {x.tips?.map((t, i) => <p key={i} className="m-0 text-sm bg-emerald-50 text-emerald-700 rounded-xl px-3 py-2">💡 {fmt(t)}</p>)}
        </section>
      ))}
    </div>
  )
}
