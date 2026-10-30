import { q, one } from "./db"
import { LOTE_2026_10, GUIAS_2026_10 } from "./academia-lote-2026-10"
import { sembrarCursos } from "./academia-cursos-2026-11"
import { sembrarMateriales } from "./academia-archivos"

/** ACADEMIA DEVISEBIT (academia.devisebit.com): guías gratis, newsletter y productos digitales. */
export const URL_ACADEMIA = process.env.ACADEMIA_URL ?? "https://academia.devisebit.com"

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
/** Markdown simple → HTML para la web (títulos, párrafos, listas, negrita, links, citas, botones). */
export function mdWeb(md: string) {
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
  const out: string[] = []
  let lista: { tipo: "ul" | "ol"; items: string[] } | null = null
  let codigo: string[] | null = null
  const cerrar = () => { if (lista) { out.push(`<${lista.tipo}>${lista.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${lista.tipo}>`); lista = null } }
  for (const linea of md.replace(/\r/g, "").split("\n")) {
    // Bloques de código (```): se muestran tal cual, con scroll horizontal (fragmentos, diagramas en texto, plantillas para copiar)
    if (/^\s*```/.test(linea)) {
      if (codigo) { out.push(`<pre><code>${esc(codigo.join("\n"))}</code></pre>`); codigo = null } else { cerrar(); codigo = [] }
      continue
    }
    if (codigo) { codigo.push(linea); continue }
    const l = linea.trimEnd()
    let m
    if ((m = l.match(/^\s*[-*] (.+)/))) { if (lista?.tipo !== "ul") { cerrar(); lista = { tipo: "ul", items: [] } } lista.items.push(m[1]); continue }
    if ((m = l.match(/^\s*\d+[.)] (.+)/))) { if (lista?.tipo !== "ol") { cerrar(); lista = { tipo: "ol", items: [] } } lista.items.push(m[1]); continue }
    cerrar()
    if (!l.trim()) continue
    if ((m = l.match(/^### (.+)/))) out.push(`<h3>${inline(m[1])}</h3>`)
    else if ((m = l.match(/^## (.+)/))) out.push(`<h2>${inline(m[1])}</h2>`)
    else if ((m = l.match(/^> (.+)/))) out.push(`<blockquote>${inline(m[1])}</blockquote>`)
    else if ((m = l.match(/^\[\[(.+?)\|(.+?)\]\]$/))) out.push(`<p><a class="boton" href="${m[2]}">${esc(m[1])}</a></p>`)
    else out.push(`<p>${inline(l)}</p>`)
  }
  cerrar()
  if (codigo) out.push(`<pre><code>${esc(codigo.join("\n"))}</code></pre>`)
  return out.join("\n")
}

export const slugDe = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)

/** Mercado Pago Checkout Pro (MP_ACCESS_TOKEN). */
export const mpConfigurado = () => !!process.env.MP_ACCESS_TOKEN
/** `cuotas`: máximo de cuotas que ofrece el checkout (las cuotas sin interés se activan en la cuenta de Mercado Pago). */
export async function crearPreferencia(o: { orden: number; titulo: string; precio: number; email: string; token: string; cuotas?: number }) {
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ id: String(o.orden), title: o.titulo, quantity: 1, unit_price: o.precio, currency_id: "ARS" }],
      payer: { email: o.email }, external_reference: String(o.orden), statement_descriptor: "DEVISEBIT",
      back_urls: { success: `${URL_ACADEMIA}/gracias/${o.token}`, pending: `${URL_ACADEMIA}/gracias/${o.token}`, failure: `${URL_ACADEMIA}/gracias/${o.token}?e=1` },
      auto_return: "approved", notification_url: `https://sistema.devisebit.com/api/academia/mp`,
      ...(o.cuotas && o.cuotas > 1 ? { payment_methods: { installments: o.cuotas } } : {}),
    }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok ? { ok: true as const, id: j.id as string, url: j.init_point as string } : { ok: false as const, error: j.message ?? `Error ${r.status}` }
}

/** Carga inicial de guías y del primer producto (solo si no hay nada). */
export async function sembrar() {
  await sembrarCursos()
  await sembrarMateriales()
  const hay = await one<{ n: number }>("select count(*)::int n from am_guias")
  if ((hay?.n ?? 0) > 0) return sembrarLote(LOTE_2026_10, GUIAS_2026_10)
  for (const g of GUIAS) await q("insert into am_guias(slug,titulo,bajada,categoria,contenido,exclusiva,publicada,destacada) values ($1,$2,$3,$4,$5,$6,true,$7) on conflict do nothing", [g.slug, g.titulo, g.bajada, g.categoria, g.contenido, !!g.exclusiva, !!g.destacada])
  await q(`insert into am_productos(slug,titulo,bajada,descripcion,estado) values ($1,$2,$3,$4,'lista_espera') on conflict do nothing`, [
    "kit-ia-pymes", "Kit IA para pymes", "50 prompts listos para usar y 10 automatizaciones paso a paso para tu negocio.",
    "## Qué incluye\n- 50 prompts probados para ventas, atención, administración, marketing y RR. HH.\n- 10 automatizaciones paso a paso (WhatsApp, Gmail, planillas, formularios y CRM)\n- Plantillas listas para copiar y adaptar\n- Actualizaciones gratis cuando cambian las herramientas\n\n## Para quién es\nDueños, gerentes y equipos de pymes, instituciones y profesionales que quieren usar inteligencia artificial en el día a día, sin ser técnicos.",
  ])
}

type G = { slug: string; titulo: string; bajada: string; categoria: string; contenido: string; exclusiva?: boolean; destacada?: boolean }
const GUIAS: G[] = [
  {
    slug: "10-automatizaciones-ia-pymes", titulo: "10 automatizaciones con IA que tu pyme puede tener andando esta semana", categoria: "Automatización", exclusiva: true, destacada: true,
    bajada: "Tareas repetitivas que hoy te comen horas y que ya se pueden automatizar con herramientas accesibles.",
    contenido: `La inteligencia artificial no es un proyecto de dos años: hay tareas que se automatizan en días. Estas son las diez que más horas le devuelven a una pyme o institución argentina.

## 1. Responder las preguntas frecuentes por WhatsApp
Horarios, precios de referencia, cómo llegar, requisitos. Un asistente con IA las contesta a toda hora y te pasa a vos solo lo que necesita una persona. **Ahorro típico:** varias horas por día de quien atiende.

## 2. Tomar los datos de cada consulta
Nombre, empresa, qué necesita, email. El asistente los pide de a uno, como una persona, y los guarda en tu CRM o en una planilla.

## 3. Agendar reuniones o turnos
Ofrece horarios libres, confirma y manda recordatorio. Menos idas y vueltas, menos ausencias.

## 4. Pasar facturas y comprobantes a una planilla
La IA lee la foto o el PDF y completa proveedor, fecha, importe y concepto. Vos solo revisás.

## 5. Resumir reuniones y mails largos
Pegás el texto (o la transcripción) y te devuelve resumen, decisiones y pendientes con responsable.

## 6. Escribir primeras versiones
Propuestas, respuestas a clientes, publicaciones para redes, descripciones de productos. La IA arma el borrador; vos le ponés tu criterio.

## 7. Clasificar consultas y reclamos
Llega un mensaje y la IA lo etiqueta (venta, soporte, reclamo, administración) y lo asigna a quien corresponde.

## 8. Seguimiento de presupuestos enviados
Si un cliente no respondió en tres días, se le manda un recordatorio amable y te avisa.

## 9. Reporte semanal automático
Los números de la semana (ventas, consultas, cobranzas) en un mail cada lunes, sin armar nada a mano.

## 10. Bienvenida a clientes nuevos
Cuando alguien compra o se suscribe, recibe automáticamente la información que necesita para empezar.

## Por dónde empezar
Elegí **una** tarea que se repita todos los días y que no requiera criterio humano. Medí cuánto tiempo lleva hoy. Automatizala y medí de nuevo. Con ese resultado, vas por la siguiente.

> Consejo: empezá por WhatsApp. Es el canal donde más consultas se pierden fuera de horario.

[[Quiero automatizar mi atención por WhatsApp|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20le%C3%AD%20la%20gu%C3%ADa%20de%20automatizaciones]]`,
  },
  {
    slug: "cuanto-cuesta-digitalizar-una-pyme-argentina", titulo: "Cuánto cuesta digitalizar una pyme en Argentina (2026)", categoria: "Guías de compra", destacada: true,
    bajada: "Rangos reales de mercado para webs, tiendas, sistemas, apps, bots y tableros, y cómo no pagar de más.",
    contenido: `Pedir presupuesto sin tener referencia es la forma más fácil de pagar de más (o de contratar algo que no sirve). Estos son los rangos que se ven en el mercado argentino en 2026, según publicaciones de estudios y empresas del sector.

## Rangos de referencia
- **Sitio web institucional:** desde ARS 350.000 en estudios chicos; las empresas con equipo suelen cotizar entre USD 600 y 2.500 según secciones y contenidos.
- **Tienda online:** con plantilla, desde ARS 100.000; personalizada, entre ARS 400.000 y 1.200.000; a medida, entre ARS 1.500.000 y 5.000.000.
- **Sistema de gestión a medida:** los más simples arrancan en USD 1.500 a 4.500; los proyectos medianos van de USD 3.500 a 25.000, por etapas.
- **App para celular:** entre USD 3.000 y 8.000 una app simple; entre USD 10.000 y 30.000 con usuarios, pagos y panel.
- **Asistente de WhatsApp con IA a medida:** entre USD 1.500 y 6.000 la implementación, más USD 70 a 180 por mes de WhatsApp, IA y servidor.
- **Mantenimiento:** se calcula entre el 15 % y el 20 % del costo inicial por año.

## Qué mueve el precio
1. **El alcance:** cuántas pantallas, roles e integraciones.
2. **Las integraciones:** cada conexión externa (pagos, facturación, WhatsApp) suma.
3. **El diseño:** plantilla adaptada o diseño propio.
4. **Quién lo hace:** un freelancer suele ser más barato; una empresa con equipo cobra entre 30 % y 50 % más, a cambio de continuidad y soporte.

## Cómo no pagar de más
- Pedí **alcance, fecha y precio fijo por escrito**.
- Arrancá por una **primera etapa** que resuelva el problema principal.
- Preguntá qué pasa después: soporte, actualizaciones, quién es dueño del código y de los datos.
- Desconfiá de lo que parece demasiado barato: lo barato sin soporte termina saliendo caro.

### Fuentes
[SODI](https://sodi.com.ar/blog/cuanto-cuesta-software-a-medida-argentina) · [Tomás Web](https://tomasweb.com.ar/blog/cuanto-cuesta-una-pagina-web-en-argentina-en-2026-precios-reales) · [Pointweb](https://pointweb.com.ar/guias/cuanto-cuesta-una-tienda-online-en-argentina/) · [Prisys](https://prisys.com.ar/blog/cuanto-cuesta-sistema-de-gestion-argentina) · [DevelopArgentina](https://developargentina.com/blog/cuanto-cuesta-hacer-una-app-en-argentina-2026-guia-real) · [DoubleTick](https://www.doubletick.com.ar/cuanto-cuesta-chatbot-whatsapp-argentina/)

[[Pedí una propuesta con precio fijo|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20una%20propuesta]]`,
  },
  {
    slug: "asistente-whatsapp-ia-sin-perder-trato-humano", titulo: "Cómo poner un asistente de WhatsApp con IA sin perder el trato humano", categoria: "WhatsApp e IA",
    bajada: "Lo que tiene que hacer el bot, lo que nunca tiene que hacer y cómo se configura bien desde el día uno.",
    contenido: `Un buen asistente de WhatsApp no reemplaza a tu equipo: le saca de encima lo repetitivo para que pueda dedicarse a lo importante.

## Lo que sí tiene que hacer
- Responder al instante, también de noche y los fines de semana.
- Preguntar de a una cosa por vez, como una persona.
- Tomar los datos y dejarlos guardados en un CRM.
- Ofrecer un próximo paso concreto: un turno, una reunión, un link.
- Pasar a una persona cuando alguien lo pide o el tema es delicado.

## Lo que nunca tiene que hacer
- Inventar precios, plazos o información que no le diste.
- Dejar a alguien sin respuesta con un "te derivo".
- Insistir cuando la persona ya dijo que no.

## Cómo configurarlo bien
1. **Escribí tus preguntas frecuentes** con las respuestas que daría tu mejor vendedor.
2. **Definí cuándo deriva** a una persona y en qué horario atiende el equipo.
3. **Usá la API oficial de WhatsApp**: es la única forma segura y estable para empresas.
4. **Probalo con casos reales** de tu equipo antes de abrirlo al público.
5. **Enseñale todas las semanas**: cada respuesta nueva de tu equipo puede convertirse en conocimiento del bot.

## Cómo medir si funciona
- Porcentaje de consultas respondidas en menos de un minuto.
- Cuántas consultas terminan en un dato de contacto o una reunión.
- Cuántas necesitan una persona (y por qué).

> El mejor indicador: tu equipo deja de contestar lo mismo cien veces y empieza a cerrar más ventas.

[[Probá nuestro asistente ahora|https://wa.me/5491173466490?text=Hola]]`,
  },
  {
    slug: "prompts-que-funcionan-en-el-trabajo", titulo: "Prompts que funcionan: cómo pedirle cosas a la IA en el trabajo", categoria: "IA en el día a día",
    bajada: "Una fórmula simple para que ChatGPT, Claude o Gemini te den respuestas útiles a la primera.",
    contenido: `La diferencia entre una respuesta genérica y una que te sirve está en cómo pedís. Esta fórmula funciona con cualquier asistente de IA.

## La fórmula: rol, contexto, tarea, formato
1. **Rol:** "Actuá como un asesor comercial con experiencia en pymes."
2. **Contexto:** a quién le hablás, qué pasó, qué datos tenés.
3. **Tarea:** qué querés exactamente, con un verbo claro.
4. **Formato:** largo, tono, estructura (lista, tabla, mail).

## Ejemplos para copiar
- **Responder un reclamo:** "Sos responsable de atención de una empresa de servicios. Un cliente se queja porque el técnico llegó tarde. Escribí una respuesta breve, empática, que pida disculpas sin excusas y ofrezca reprogramar. Tono cálido, en español rioplatense."
- **Resumir una reunión:** "Te paso las notas de una reunión. Devolveme: 3 decisiones, pendientes con responsable y fecha, y riesgos. En lista."
- **Mejorar una propuesta:** "Revisá esta propuesta comercial. Marcá lo que no se entiende, lo que sobra y sugerí un cierre más convincente."
- **Analizar una planilla:** "Te paso ventas por mes y por vendedor. Decime tendencias, el mejor y el peor mes, y tres acciones concretas."

## Trucos que cambian todo
- Pedí **varias opciones** y elegí.
- Decile **qué no querés** ("sin tecnicismos", "sin emojis").
- Pedile que **te haga preguntas** antes de responder si le falta información.
- **Iterá:** "más corto", "más formal", "agregá un ejemplo".

## Cuidado con
- Datos personales o sensibles de clientes: no los pegues en herramientas sin acuerdos de privacidad.
- Números y fechas: verificalos siempre.

[[Sumate al newsletter: una guía nueva por semana|/#suscribirme]]`,
  },
  {
    slug: "de-excel-a-tablero-en-7-dias", titulo: "De Excel a tablero: empezá a medir tu negocio en 7 días", categoria: "Datos y tableros",
    bajada: "Un plan de una semana para pasar de planillas sueltas a indicadores que se miran todos los lunes.",
    contenido: `No necesitás un gran sistema para empezar a decidir con datos. Necesitás pocos indicadores, bien elegidos, y una rutina.

## Día 1: elegí 5 indicadores
Ventas del mes, consultas recibidas, tasa de cierre, cobranzas pendientes y un indicador propio de tu rubro. No más de cinco.

## Día 2: encontrá de dónde salen
Para cada indicador, anotá en qué planilla o sistema está el dato y quién lo carga.

## Día 3: ordená una planilla madre
Una fila por registro, una columna por dato, fechas en formato fecha. Sin celdas combinadas ni totales en el medio.

## Día 4: armá el tablero
Con Looker Studio (gratis), Power BI o tu propia herramienta. Un número grande por indicador y un gráfico de evolución.

## Día 5: poné alertas
Si las cobranzas pendientes superan un monto, o las consultas bajan, que llegue un aviso.

## Día 6: compartilo
Cada responsable ve lo suyo. La dirección ve todo.

## Día 7: instalá la rutina
Lunes 9 h, 15 minutos: se mira el tablero y se define una acción por indicador.

> Lo que no se mira todas las semanas, no se mejora.

[[Quiero mi tablero armado|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20un%20tablero]]`,
  },
  {
    slug: "ciberseguridad-basica-pymes", titulo: "Checklist de ciberseguridad básica para pymes e instituciones", categoria: "Seguridad",
    bajada: "Doce controles simples que evitan la mayoría de los problemas: claves, copias, accesos y phishing.",
    contenido: `La mayoría de los incidentes en pymes no son ataques sofisticados: son claves repetidas, copias que no existen y un mail engañoso. Este checklist cubre lo básico.

## Accesos
- Verificación en dos pasos en el correo, el banco y las redes de la empresa.
- Un gestor de contraseñas para el equipo; nada de claves en papelitos o planillas.
- Cuentas personales para cada persona (no compartidas) y baja inmediata cuando alguien se va.

## Copias de seguridad
- Copia automática diaria de lo importante, en un lugar distinto al original.
- Una vez por mes, probá recuperar un archivo: una copia que no se probó no es una copia.

## Equipos
- Sistemas y navegadores actualizados.
- Antivirus activo y bloqueo de pantalla con clave.

## Correo y mensajes
- Desconfiá de urgencias, cambios de CBU y links acortados.
- Antes de pagar algo pedido por mail, confirmá por otro canal.

## Datos de clientes
- Guardá solo lo necesario y con acceso restringido (Ley 25.326 de Protección de Datos Personales).
- Sabé quién puede ver qué, y dejá registro.

> Si tenés que elegir un solo punto para empezar hoy: activá la verificación en dos pasos en el correo.

[[Pedí un diagnóstico de seguridad|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20un%20diagn%C3%B3stico%20de%20seguridad]]`,
  },
]

/** Carga un lote de guías una sola vez (queda anotado en am_semillas; si después se borra una guía, no vuelve). */
async function sembrarLote(lote: string, guias: G[]) {
  const nuevo = await one<{ lote: string }>("insert into am_semillas(lote) values ($1) on conflict do nothing returning lote", [lote])
  if (!nuevo) return
  for (const g of guias) await q("insert into am_guias(slug,titulo,bajada,categoria,contenido,exclusiva,publicada,destacada) values ($1,$2,$3,$4,$5,$6,true,$7) on conflict do nothing", [g.slug, g.titulo, g.bajada, g.categoria, g.contenido, !!g.exclusiva, !!g.destacada])
}
