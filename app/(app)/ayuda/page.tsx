import Link from "next/link"
import { requerir, ROL_NOMBRE } from "@/lib/auth"
import Imprimir from "@/components/Imprimir"

export const dynamic = "force-dynamic"

type Sec = { id: string; t: string; para: string[]; pasos: string[]; tips?: string[]; link?: string }
const SECCIONES: Sec[] = [
  {
    id: "inicio", t: "Primeros pasos", para: ["todos"], link: "/cuenta",
    pasos: [
      "Ingresá en sistema.sanpatricio.ar con tu usuario y clave. Si es la primera vez, usá el enlace de activación que te mandó la gerencia y elegí tu clave.",
      "Tocá tu nombre arriba a la derecha para entrar a *Mi cuenta*: ahí cambiás la clave y cargás tu email (sirve para recuperarla si te la olvidás).",
      "Desde el celular: abrí el sistema en el navegador y elegí *Agregar a pantalla de inicio*. Queda como una app, con una barra abajo para Tablero, Consultas, Pacientes y Agenda.",
      "¿Te olvidaste la clave? En el ingreso tocá *¿Olvidaste tu clave?*, o pedile a la gerencia un enlace nuevo desde Usuarios.",
    ],
    tips: ["La sesión dura 12 horas. Si usás una compu compartida, tocá *Salir* al terminar."],
  },
  {
    id: "tablero", t: "Tablero de control", para: ["todos"], link: "/",
    pasos: [
      "Muestra el mes elegido: padrón activo, visitas realizadas, facturación (solo gerencia) y porcentaje de visitas registradas en la APP PAMI.",
      "Cambiá el mes con el selector de arriba a la derecha.",
      "Revisá todos los días los avisos: OP vencidas, OP que vencen en 7 días y pacientes sin visita hace más de 7 días. Tocá un nombre para ir a su ficha.",
      "Cuando el mes se carga desde la planilla de Drive, el subtítulo lo indica.",
    ],
  },
  {
    id: "consultas", t: "Consultas · CRM", para: ["gerente", "coordinacion"], link: "/consultas",
    pasos: [
      "Acá entra todo lo que llega por WhatsApp (el bot), la web, teléfono o derivaciones, hasta que se convierte en paciente.",
      "Las tarjetas de arriba separan *Sin atender*, *En seguimiento*, *Ingresaron* y *Descartadas*. Empezá siempre por Sin atender: las que llevan más de 4 horas se marcan en rojo.",
      "Tocá *Abrir* para ver la consulta: datos, conversación completa de WhatsApp y el panel de seguimiento (estado, responsable y notas).",
      "Para responder por WhatsApp desde el sistema escribí abajo de la conversación y tocá *Enviar*. Mientras el equipo responde, el bot queda en pausa en ese chat 24 horas.",
      "Si la persona ya es paciente, tocá *Pasar a paciente*: se crea la ficha con los datos de la consulta.",
      "Para cargar una consulta que entró por teléfono, usá *+ Nueva consulta*.",
    ],
    tips: ["Las marcadas *Quiere una persona* pidieron hablar con alguien del equipo: respondelas primero.", "WhatsApp solo deja responder libremente dentro de las 24 horas del último mensaje del cliente."],
  },
  {
    id: "bot", t: "Bot · Conocimiento", para: ["gerente", "coordinacion"], link: "/bot",
    pasos: [
      "El asistente de WhatsApp responde con la información de la empresa y con todo lo que el equipo le enseña.",
      "Para enseñarle algo: entrá a *Bot · Conocimiento*, escribí la pregunta típica y la respuesta como se la explicarías a alguien nuevo, y guardá.",
      "También podés enseñarle desde una conversación: debajo de cada respuesta tuya aparece *Enseñar al bot*.",
      "Si algo dejó de ser cierto, desactivalo o editalo. El cambio se aplica en el siguiente mensaje.",
    ],
    tips: ["Cuanto más le enseñen, mejor responde: conviene cargar cada pregunta nueva que se repita."],
  },
  {
    id: "pacientes", t: "Pacientes", para: ["todos"], link: "/pacientes",
    pasos: [
      "Buscá por nombre, DNI o número de afiliado y filtrá por estado (activos, suspendidos, alta, fallecidos).",
      "*+ Nuevo paciente* abre la ficha vacía. Desde la ficha se cargan las OP (órdenes de prestación), el equipamiento entregado y los datos de contacto.",
      "Para una renovación cargá la OP nueva con *Es renovación* tildado: la anterior queda como renovada.",
      "Cada vez que alguien abre una ficha queda registrado en Auditoría (datos de salud, Ley 25.326).",
    ],
  },
  {
    id: "historia", t: "Historia clínica", para: ["gerente", "coordinacion", "profesional"],
    pasos: [
      "Desde la ficha del paciente, botón *Historia clínica*.",
      "Arriba está el resumen clínico: diagnóstico, antecedentes, alergias y medicación habitual.",
      "*Cargar desde un documento*: sacale una foto a la evolución, indicación o informe (o subí el PDF). La IA lo transcribe; revisalo, corregí lo que haga falta y guardá. El documento original queda adjunto.",
      "*Escribir un registro a mano*: elegí el tipo (evolución, indicación, estudio…), la fecha y el profesional.",
      "Los registros no se editan ni se borran: si hay un error se anulan con motivo y quedan tachados.",
      "*Imprimir / PDF* arma la historia lista para enviar.",
    ],
  },
  {
    id: "agenda", t: "Agenda y visitas", para: ["todos"], link: "/agenda",
    pasos: [
      "Muestra las visitas del día; avanzá o retrocedé con los botones o elegí una fecha.",
      "*+ Programar o registrar visita*: paciente, profesional, tipo y fecha. Se puede repetir semanalmente.",
      "Al registrar una visita realizada marcá si se cargó en la APP PAMI: lo que no se registra no se paga.",
    ],
  },
  {
    id: "cierre", t: "Cierre mensual y facturación", para: ["gerente", "coordinacion"], link: "/cierre",
    pasos: [
      "El último día hábil del mes se emite la factura; se cobra el mes siguiente, del 22 al 25.",
      "En Cierre mensual se ve lo prestado por paciente, se carga la factura real y la fecha de facturación, y se descarga el CSV.",
      "El día 15 del mes siguiente es el límite para transmitir consumos en Efectores Web (meta interna: día 12).",
    ],
  },
  {
    id: "datos", t: "Importar y exportar", para: ["gerente", "coordinacion"], link: "/importar",
    pasos: [
      "La planilla mensual de Drive se sube con el menú *San Patricio → Enviar este mes al sistema* dentro de la misma planilla, o desde *Importar planilla*.",
      "En Pacientes, OP, Agenda, Profesionales y Consultas están los botones *Importar* y *Exportar*: aceptan Excel o CSV y reconocen las columnas por su nombre. Si el registro ya existe, se actualiza.",
      "Si no sabés qué columnas usar, al importar aparece *Descargar plantilla con las columnas*.",
    ],
  },
  {
    id: "usuarios", t: "Usuarios y seguridad", para: ["gerente"], link: "/usuarios",
    pasos: [
      "Roles: Gerencia ve todo; Coordinación carga y gestiona sin ver importes; Consulta solo mira; Profesional registra visitas e historia clínica.",
      "Para sumar a alguien: *Usuarios* → agregar, y *Generar enlace de activación*; se lo mandás por WhatsApp.",
      "Auditoría muestra quién vio o cambió qué y cuándo.",
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
          <p className="m-0 text-sm text-[#4F5C69]">Guía paso a paso para tu rol: <strong>{ROL_NOMBRE[u.rol]}</strong>. Ante cualquier duda, consultá a la gerencia.</p>
        </div>
        <Imprimir texto="Descargar en PDF" />
      </div>
      <nav className="card flex flex-wrap gap-2 no-print">
        {visibles.map((x) => <a key={x.id} href={`#${x.id}`} className="chip text-sm px-3 py-1 border bg-white border-[#C9D3CD] hover:border-[#0B7A3B]">{x.t}</a>)}
      </nav>
      {visibles.map((x, n) => (
        <section key={x.id} id={x.id} className="card flex flex-col gap-3 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0">{n + 1}. {x.t}</h2>
            {x.link && <Link href={x.link} className="btn-s py-1 px-3 text-xs no-print">Ir a {x.t}</Link>}
          </div>
          <ol className="m-0 pl-5 flex flex-col gap-2 text-[15px] leading-relaxed">{x.pasos.map((p, i) => <li key={i}>{fmt(p)}</li>)}</ol>
          {x.tips?.map((t, i) => <p key={i} className="m-0 text-sm bg-[#E3F2E8] text-[#0B5E31] rounded-xl px-3 py-2">💡 {fmt(t)}</p>)}
        </section>
      ))}
    </div>
  )
}
