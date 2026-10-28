import Link from "next/link"
import { requerir, ROL_NOMBRE, espacioDelHost, type Espacio } from "@/lib/auth"
import Imprimir from "@/components/Imprimir"

export const dynamic = "force-dynamic"

type Sec = { id: string; t: string; para: string[]; en: Espacio[]; pasos: string[]; tips?: string[]; link?: string; ir?: string }
const SECCIONES: Sec[] = [
  {
    id: "inicio", t: "Primeros pasos", para: ["todos"], en: ["comercial", "academia"], link: "/cuenta", ir: "Mi perfil",
    pasos: [
      "Hay *dos sistemas separados*, cada uno con su dirección y su sesión: el *Sistema comercial* en sistema.devisebit.com (ventas, clientes, proyectos y bot) y el *Sistema Academia* en academia.devisebit.com/sistema (cursos, alumnos, guías y productos de ACADEMIA DEVISEBIT).",
      "Entrás con el mismo usuario y clave en los dos, si tenés acceso. Para pasar de uno al otro usá el cambio de sistema del menú lateral. Si es la primera vez, usá el enlace de activación que te mandó Dirección y elegí tu clave.",
      "En *Mi perfil* subí tu foto, cargá tu email (sirve para recuperar la clave) y activá los *avisos al celular*.",
      "Desde el celular: abrí el sistema en el navegador y elegí *Agregar a pantalla de inicio*. Queda como una app, con accesos rápidos abajo.",
      "La campanita reúne los avisos importantes (consultas sin atender, próximos pasos vencidos, pagos, pedidos de factura). Podés marcarlos como leídos o borrarlos.",
    ],
    tips: ["Horario de atención del equipo: lunes a viernes de 8 a 18 h. Fuera de ese horario responde Bit, el asistente."],
  },
  {
    id: "equipo", t: "Equipo y roles", para: ["todos"], en: ["comercial", "academia"],
    pasos: [
      "*Coordinadora general (Bárbara Zoltan)*: toma a los clientes que ya contrataron, los proyectos en curso, los pagos y las facturas, los cierres de venta (contrato, seña y alta del cliente) y la coordinación general del equipo. Es a quien Bit le deriva esos casos.",
      "*Dirección (Julio Miranda)*: propuestas, precios especiales, sistemas a medida, licitaciones y reuniones con decisores.",
      "Roles del sistema: *Dirección* ve y edita todo; *Comercial* atiende conversaciones, contactos, proyectos, demos, material de venta, envíos y el bot; *Desarrollo* y *Solo lectura* consultan.",
    ],
  },
  {
    id: "conversaciones", t: "Conversaciones (bot de WhatsApp e Instagram)", para: ["gerente", "coordinacion"], en: ["comercial"], link: "/consultas", ir: "Conversaciones",
    pasos: [
      "Todo lo que entra por WhatsApp, Instagram y el formulario de devisebit.com aparece acá. Bit responde solo y va tomando nombre, organización, necesidad y email.",
      "Las tarjetas de arriba filtran: *Sin atender*, *En seguimiento*, *Pasaron al CRM* y *Descartadas*. El chip rojo *Quiere una persona* marca a quien pidió hablar con alguien.",
      "Para responder vos, escribí en la caja de la conversación: sale por el mismo canal y el bot queda en pausa 24 h en ese chat. Podés reactivarlo con un botón.",
      "Si una respuesta tuya sirve para el futuro, tocá *Enseñar al bot* debajo del mensaje.",
      "Cuando el bot ya tiene nombre y necesidad, crea solo el contacto en el CRM. Si no, usá *Pasar a contacto del CRM*.",
    ],
    tips: ["WhatsApp solo deja responder libremente dentro de las 24 h del último mensaje del cliente. Pasado ese plazo, usá el botón de WhatsApp."],
  },
  {
    id: "contactos", t: "Contactos y embudo", para: ["todos"], en: ["comercial"], link: "/contactos",
    pasos: [
      "Cada contacto tiene una etapa: *Nuevo → Conversando → Reunión → Propuesta enviada → Ganado / Perdido*.",
      "Cargá siempre el *próximo paso* con fecha: el Resumen y la campanita te avisan cuando vence.",
      "Desde la ficha podés escribirle por WhatsApp o email, ver sus conversaciones con el bot, darle acceso al portal y crear un proyecto.",
      "*Importar* sube un Excel o CSV (lo importado queda en *Por clasificar*) y *Exportar* baja la lista a Excel (CSV).",
    ],
  },
  {
    id: "proyectos", t: "Proyectos y Trello", para: ["todos"], en: ["comercial"], link: "/proyectos",
    pasos: [
      "Los proyectos se ven en columnas por estado. Al pasar uno a *En curso*, el contacto queda como *Ganado*.",
      "Cargá cliente, servicio, fechas, monto y responsable. La campanita avisa si una entrega se vence.",
      "Los cobros y los hitos que marques como visibles los ve el cliente en su portal (portal.devisebit.com).",
      "Con Trello conectado, *Crear tablero en Trello* arma el tablero con listas Pendiente / En curso / Hecho, y desde el sistema ves el avance y sumás tareas.",
    ],
  },
  {
    id: "demos", t: "Demos", para: ["gerente", "coordinacion"], en: ["comercial"], link: "/demos-admin",
    pasos: [
      "Las demos no son públicas: cada persona recibe un *link personal que vence*. Las piden desde la web con su email, se las ofrece Bit por WhatsApp o se las mandás vos desde acá.",
      "En *Enviar demos a un cliente* elegí las demos (WhatsApp con IA, webs, sistemas, padrón…), cargá nombre y email, y el sistema le manda el link.",
      "En *Links enviados* ves quién abrió cada demo y cuántas veces; podés revocar un link.",
      "El *autodiagnóstico* de transformación digital es público: el resultado y el email quedan en *Autodiagnósticos* y entra como consulta.",
    ],
  },
  {
    id: "material", t: "Material de venta", para: ["gerente", "coordinacion"], en: ["comercial"], link: "/material",
    pasos: [
      "Todo lo que se le manda a un cliente en un clic: folletos, el PDF del Panel, piezas para redes y los videos de demos.",
      "En cada pieza podés *copiar el link*, *copiar el mensaje para WhatsApp* o mandarla *por email* desde el mismo lugar.",
      "Los videos de demos se suben a YouTube como *ocultos*: pegá el link en el sistema y solo lo ve quien lo recibe.",
      "Las demos interactivas se mandan desde *Demos*, con link personal.",
    ],
  },
  {
    id: "envios", t: "Envíos de email con plantillas", para: ["gerente", "coordinacion"], en: ["comercial", "academia"], link: "/email", ir: "Envíos de email",
    pasos: [
      "*Nuevo envío* → *Elegí una plantilla*: cada estilo (clásico, newsletter, promoción, evento, lanzamiento, carta personal, Academia, institucional) trae un texto de ejemplo.",
      "Cambiá el texto a mano o pedile a la IA que lo escriba con tu tema. Usá {{nombre}} para saludar a cada persona y [[Texto del botón|https://…]] para sumar un botón.",
      "Elegí a quién se manda por etapa, sector, categoría, origen o etiquetas. Mandate una *prueba* antes de enviar.",
      "Cada correo lleva link de baja en un clic y se miden aperturas y clics. Si hay más destinatarios que el límite diario, el envío sigue solo al día siguiente.",
    ],
  },
  {
    id: "bot", t: "Bot · Conocimiento", para: ["gerente", "coordinacion"], en: ["comercial"], link: "/bot", ir: "Bot · Conocimiento",
    pasos: [
      "Acá ves lo que el equipo le enseñó a Bit y podés agregar, editar o desactivar respuestas.",
      "*Modo del bot*: siempre, solo fuera del horario de atención (lunes a viernes de 8 a 18 h atiende el equipo) o nunca (solo registra y avisa).",
      "*Importar información al bot*: subí un archivo (PDF, TXT, MD o CSV, hasta 4 MB), pegá el link de una página o pegá el texto. La IA lo convierte en respuestas y te las deja como *sugerencias*.",
      "Revisá cada sugerencia y aprobala: el bot no usa nada importado hasta que lo aprobás.",
    ],
  },
  {
    id: "oferta", t: "Servicios, precios y portal de clientes", para: ["gerente", "coordinacion"], en: ["comercial"], link: "/precios", ir: "Precios",
    pasos: [
      "*Precios* tiene la lista vigente con la referencia de mercado de cada precio. La lista pública para mandar a clientes es sistema.devisebit.com/lista-precios.",
      "*Portal y accesos*: los clientes entran a portal.devisebit.com (Mi cuenta) con un link a su email. Ahí validás los pedidos de acceso y ves los pedidos de factura.",
      "*Agenda y avisos*: los horarios en los que los clientes reservan una reunión; Bit los ofrece por WhatsApp y el link general sirve para la web y las firmas.",
    ],
  },
  {
    id: "academia", t: "Sistema Academia", para: ["todos"], en: ["academia"], link: "/sistema", ir: "Inicio de la Academia",
    pasos: [
      "En academia.devisebit.com/sistema se maneja todo ACADEMIA DEVISEBIT: el sitio público academia.devisebit.com se alimenta de acá.",
      "*Inicio*: guías (se escriben a mano o con IA y se publican con un botón), productos a la venta y ventas recibidas.",
      "*Cursos*: cursos, ediciones, alumnos, clases en vivo, asistencia y certificados. Los alumnos ven sus clases y certificados en su portal.",
      "*Alumnos y suscriptos*: quién cursa, quién compró y quién recibe el newsletter.",
    ],
  },
  {
    id: "usuarios", t: "Usuarios y seguridad", para: ["gerente"], en: ["comercial", "academia"], link: "/usuarios",
    pasos: [
      "Para sumar a alguien: *Usuarios* → agregar, elegí su rol y a qué sistema entra (Comercial, Academia o los dos) y *Generar enlace de activación*; se lo mandás por WhatsApp.",
      "*Auditoría* (en el Sistema comercial) muestra quién cambió qué y cuándo.",
    ],
  },
]

export default async function Ayuda() {
  const u = await requerir()
  const espacio = espacioDelHost()
  const visibles = SECCIONES.filter((x) => x.en.includes(espacio) && (x.para.includes("todos") || x.para.includes(u.rol)))
  const fmt = (t: string) => t.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith("*") ? <strong key={i}>{p.slice(1, -1)}</strong> : p))
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Manual del {espacio === "academia" ? "Sistema Academia" : "Sistema comercial"}</h1>
          <p className="m-0 text-sm text-[#4A515C]">Guía paso a paso para tu rol: <strong>{ROL_NOMBRE[u.rol]}</strong>. Ante cualquier duda, consultá a la coordinadora general o a Dirección.</p>
        </div>
        <Imprimir texto="Descargar en PDF" />
      </div>
      <nav aria-label="Secciones del manual" className="card flex flex-wrap gap-2 no-print">
        {visibles.map((x) => <a key={x.id} href={`#${x.id}`} className="chip text-sm px-3 py-1 border bg-white border-[#C3C8D1] hover:border-[#C8231F]">{x.t}</a>)}
      </nav>
      {visibles.map((x, n) => (
        <section key={x.id} id={x.id} className="card flex flex-col gap-3 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0">{n + 1}. {x.t}</h2>
            {x.link && <Link href={x.link} className="btn-s py-1 px-3 text-xs no-print">Ir a {x.ir ?? x.t}</Link>}
          </div>
          <ol className="m-0 pl-5 flex flex-col gap-2 text-[15px] leading-relaxed list-decimal">{x.pasos.map((p, i) => <li key={i}>{fmt(p)}</li>)}</ol>
          {x.tips?.map((t, i) => <p key={i} className="m-0 text-sm bg-emerald-50 text-emerald-800 rounded-xl px-3 py-2">💡 {fmt(t)}</p>)}
        </section>
      ))}
    </div>
  )
}
