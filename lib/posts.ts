export type Post = { slug: string; date: string; dateTxt: string; kicker: string; title: string; desc: string; body: string[]; box?: string[]; sources: { t: string; u: string }[] }

export const posts: Post[] = [
  {
    slug: "salud-digital-2026-interoperabilidad",
    date: "2026-10-21",
    dateTxt: "21 de octubre de 2026",
    kicker: "Salud digital",
    title: "Salud digital en 2026: el desafío ya no es digitalizar, es que los sistemas se hablen",
    desc: "La receta electrónica es obligatoria y supera los 20 millones de prescripciones por mes. El próximo paso para clínicas y prestadores es la interoperabilidad.",
    body: [
      "Desde julio de 2025, la receta electrónica es obligatoria en la Argentina para cualquier prescripción médica, no solo para medicamentos, según la Resolución 2214/2025 del Ministerio de Salud de la Nación. En 2026 el país ya supera los 20 millones de prescripciones electrónicas por mes, de acuerdo con lo informado en un encuentro sobre salud digital realizado en junio en Buenos Aires.",
      "El problema que queda es otro: una receta emitida en un hospital de una provincia no siempre puede leerse en una farmacia de otra, ni en una clínica privada. Los sistemas existen, pero muchas veces no se hablan entre sí. Por eso la interoperabilidad es el eje de la Estrategia Nacional de Salud Digital 2025-2030 y de la Agenda Digital 2026-2027 presentadas en ese encuentro, con apoyo de la OPS/OMS.",
      "Para una clínica, un centro de día o un prestador de internación domiciliaria, esto tiene consecuencias concretas. La historia clínica electrónica pasa a ser el centro del sistema, y alrededor tienen que integrarse los turnos, la farmacia, las autorizaciones y la facturación a obras sociales. Un sistema aislado, por bueno que sea, empieza a quedar corto.",
      "La buena noticia es que no hace falta cambiar todo de golpe. El camino que recomendamos a las instituciones con las que trabajamos es ordenado: primero, que la historia clínica y los turnos estén en un mismo sistema; después, que la facturación salga de lo que ya está registrado; y recién entonces sumar integraciones con financiadores y farmacias."
    ],
    box: [
      "¿Tu historia clínica y tus turnos están en el mismo sistema?",
      "¿La facturación sale de lo registrado o se vuelve a cargar a mano?",
      "¿Podés exportar los datos de un paciente en un formato estándar?",
      "¿Quién es el dueño de tus datos: vos o tu proveedor?"
    ],
    sources: [
      { t: "Innovación Digital 360: digitalización del sistema de salud argentino en 2026 (12/06/2026)", u: "https://www.innovaciondigital360.com/software/software-digitalizacion-sistema-salud-argentina-2026-receta-electronica-interoperabilidad/" },
      { t: "DPL News: amplían el uso obligatorio de receta electrónica, Resolución 2214/2025 (22/07/2025)", u: "https://dplnews.com/?p=282312" },
      { t: "Ministerio de Salud: Resolución 2214/2025 (texto)", u: "https://e-legis-ar.msal.gov.ar/legisalud/migration/pdf/msres2214_2025.pdf" }
    ]
  },
  {
    "slug": "whatsapp-cobra-respuestas-octubre-2026",
    "date": "2026-09-15",
    "dateTxt": "15 de septiembre de 2026",
    "kicker": "WhatsApp",
    "title": "Desde octubre, WhatsApp Business también cobra las respuestas: cómo prepararse",
    "desc": "A partir del 1 de octubre de 2026 las respuestas dentro de la ventana de 24 horas pasan a cobrarse por mensaje, con 1.000 conversaciones de servicio gratis por mes. Qué revisar antes.",
    "body": [
      "Meta anunció un nuevo ajuste en la forma de cobrar la API de WhatsApp Business. Desde el 1 de octubre de 2026, las respuestas que una empresa envía dentro de la ventana de 24 horas que abre cada cliente dejan de ser gratuitas y pasan a facturarse por mensaje. Cada cuenta conserva 1.000 conversaciones de servicio gratuitas por mes antes de que se apliquen cargos.",
      "También vuelven a cobrarse las plantillas de utilidad (avisos de turno, confirmaciones, estados de pedido) que se envían dentro de esa ventana, y que habían quedado sin costo desde julio de 2025.",
      "Para una pyme que atiende por WhatsApp, el impacto depende del volumen. Con pocas decenas de consultas por día, la franquicia gratuita alcanza; con cientos, conviene medir. Lo primero es saber cuántas conversaciones abre tu negocio por mes y cuántos mensajes manda el equipo o el asistente en cada una.",
      "En los asistentes que implementamos, el bot resuelve la consulta en pocos mensajes, agrupa la información en una sola respuesta y deriva a una persona solo cuando hace falta. Esa forma de trabajar, que ya era buena para el cliente, ahora también cuida el costo."
    ],
    "box": [
      "¿Sabés cuántas conversaciones de WhatsApp abre tu negocio por mes?",
      "¿Tus respuestas resuelven en un mensaje o en cinco?",
      "¿Usás plantillas de marketing cuando alcanzaría con una de utilidad?",
      "¿Alguien revisa la facturación de Meta todos los meses?"
    ],
    "sources": [
      {
        "t": "Wati: precios basados en mensajes, todo lo que necesitás saber",
        "u": "https://support.wati.io/es/articles/11561662-precios-basados-en-mensajes-todo-lo-que-necesitas-saber"
      }
    ]
  },
  {
    "slug": "pymes-argentinas-usan-ia-2026",
    "date": "2026-05-28",
    "dateTxt": "28 de mayo de 2026",
    "kicker": "Inteligencia artificial",
    "title": "Cuatro de cada diez pymes argentinas ya usan inteligencia artificial: qué hacen con ella",
    "desc": "Una encuesta nacional de la Universidad Torcuato Di Tella, Fundar, el BID y el Observatorio Pyme muestra que el 41,6% de las pymes usa al menos una herramienta de IA, sobre todo en ventas y administración.",
    "body": [
      "La adopción de inteligencia artificial en las pymes argentinas dejó de ser una excepción. Según una encuesta nacional realizada por la Universidad Torcuato Di Tella, CEPE, Fundar, el BID y el Observatorio Pyme, el 41,6% de las empresas consultadas ya usa al menos una herramienta de IA. Si se excluye al sector de software, la cifra es 36,4%.",
      "Los usos más frecuentes están en marketing y ventas (54,7%), administración y gestión (41,5%) y producción y servicios (40%). Las herramientas de generación de texto, como ChatGPT, son las más difundidas: las usa el 77,9% de las empresas que adoptaron IA.",
      "Un dato importante para quienes temen por el empleo: el 91,2% de las empresas que adoptaron IA no redujo personal. Lo que sí falta es planificación: solo el 7,5% tiene una partida de presupuesto específica para IA, y casi ninguna contrató perfiles especializados.",
      "La conclusión práctica es que la mayoría de las pymes usa IA de forma suelta, sin integrarla a sus procesos. El salto de productividad aparece cuando la IA se conecta con lo que la empresa ya tiene: el WhatsApp de atención, el CRM, la planilla de ventas o el sistema de turnos."
    ],
    "box": [
      "¿Usás IA en tareas sueltas o integrada a tus procesos?",
      "¿Medís cuánto tiempo te ahorra?",
      "¿Tus datos de clientes están en un solo lugar?",
      "¿Tenés definido qué tareas automatizar primero?"
    ],
    "sources": [
      {
        "t": "Unidiversidad: cuatro de cada diez pymes argentinas ya usan IA (26/05/2026)",
        "u": "https://www.unidiversidad.com.ar/cuatro-de-cada-diez-pymes-argentinas-ya-usan-ia-y-la-mayoria-no-redujo-puestos-de-trabajo"
      }
    ]
  },
  {
    "slug": "google-modo-ia-espanol-seo-pymes",
    "date": "2025-09-26",
    "dateTxt": "26 de septiembre de 2025",
    "kicker": "Buscadores",
    "title": "Google lanzó el Modo IA en español: qué cambia para que tu negocio aparezca",
    "desc": "El nuevo modo de búsqueda con inteligencia artificial ya está disponible en la Argentina. Las consultas son más largas y las respuestas citan pocas fuentes: estar bien posicionado vale más que antes.",
    "body": [
      "Google presentó el Modo IA en español para la Argentina y el resto de Hispanoamérica. Funciona con el modelo Gemini 2.5, acepta preguntas por texto, voz o con la cámara del celular, y responde consultas largas o complejas con un texto armado por la IA y enlaces a las páginas que usó como fuente.",
      "Según Google, en la primera etapa los usuarios hicieron consultas bastante más extensas que en la búsqueda tradicional. Ya no se busca \"dentista Palermo\", sino \"dentista en Palermo que atienda sábados y tome mi obra social\".",
      "Para una pyme, esto cambia las prioridades. La IA arma su respuesta con pocas fuentes, así que una web lenta, sin información concreta o sin datos de contacto claros queda afuera. Ganan las páginas que responden preguntas completas: servicios, precios orientativos, zonas, horarios, medios de pago y preguntas frecuentes.",
      "La ficha de Google Business sigue siendo clave para las búsquedas locales, y los datos estructurados ayudan a que el buscador entienda qué ofrece cada página. Son tareas simples que conviene revisar en cualquier sitio."
    ],
    "box": [
      "¿Tu web responde las preguntas que te hacen por WhatsApp?",
      "¿Tenés tu ficha de Google Business completa y actualizada?",
      "¿Tu sitio carga rápido en el celular?",
      "¿Publicás horarios, zonas y medios de pago?"
    ],
    "sources": [
      {
        "t": "Revista Mercado: Google presenta el Modo IA en español para Argentina (24/09/2025)",
        "u": "https://mercado.com.ar/noticias/google-presenta-el-modo-ia-en-espanol-para-argentina-y-toda-hispanoamerica"
      },
      {
        "t": "Ayuda de Google: Modo IA en la Búsqueda",
        "u": "https://support.google.com/websearch/answer/16011537?hl=es"
      }
    ]
  },
  {
    "slug": "receta-electronica-obligatoria-toda-prescripcion",
    "date": "2025-07-24",
    "dateTxt": "24 de julio de 2025",
    "kicker": "Salud digital",
    "title": "La receta electrónica pasa a ser obligatoria para toda prescripción: qué tiene que revisar una clínica",
    "desc": "La Resolución 2214/2025 del Ministerio de Salud amplía la obligación a cualquier prescripción médica, no solo a medicamentos. Un repaso de lo que conviene ordenar en el sistema de la institución.",
    "body": [
      "El Ministerio de Salud de la Nación amplió el uso obligatorio de la receta electrónica a cualquier prescripción médica, no solo a la de medicamentos, mediante la Resolución 2214/2025.",
      "Para clínicas, consultorios, centros de día y prestadores de internación domiciliaria, el cambio implica que toda indicación tiene que emitirse en formato electrónico y quedar registrada de forma que pueda leerse en otra institución.",
      "La oportunidad es ordenar el circuito completo: que la indicación salga desde la historia clínica, que el turno y la práctica queden vinculados y que la facturación a la obra social se arme con lo que ya está registrado, sin volver a cargar datos a mano.",
      "En las instituciones de salud con las que trabajamos, el orden recomendado es primero unificar historia clínica y turnos, después integrar la prescripción y recién entonces automatizar la facturación."
    ],
    "box": [
      "¿Tus profesionales ya prescriben todo en formato electrónico?",
      "¿La prescripción queda vinculada a la historia clínica?",
      "¿La facturación sale de lo registrado o se carga dos veces?",
      "¿Podés auditar quién prescribió qué y cuándo?"
    ],
    "sources": [
      {
        "t": "DPL News: amplían el uso obligatorio de receta electrónica (22/07/2025)",
        "u": "https://dplnews.com/?p=282312"
      },
      {
        "t": "Ministerio de Salud: Resolución 2214/2025 (texto)",
        "u": "https://e-legis-ar.msal.gov.ar/legisalud/migration/pdf/msres2214_2025.pdf"
      }
    ]
  },
  {
    "slug": "whatsapp-business-cobro-por-mensaje-julio-2025",
    "date": "2025-07-03",
    "dateTxt": "3 de julio de 2025",
    "kicker": "WhatsApp",
    "title": "WhatsApp Business empezó a cobrar por mensaje: qué significa para tu negocio",
    "desc": "Desde el 1 de julio de 2025, Meta cobra la API de WhatsApp Business por cada plantilla enviada según su categoría, en lugar de por conversación. Las de utilidad dentro de las 24 horas quedan sin costo.",
    "body": [
      "El 1 de julio de 2025 Meta cambió el modelo de precios de la API de WhatsApp Business. En lugar de cobrar por conversación, ahora cobra por cada mensaje de plantilla entregado, según su categoría: marketing, utilidad o autenticación. Los mensajes que no llegan a enviarse no tienen cargo.",
      "Las plantillas de utilidad, como la confirmación de un turno o el aviso de un pedido, quedaron sin costo cuando se envían dentro de la ventana de 24 horas que abre el cliente al escribir. Las respuestas libres dentro de esa ventana también siguen sin cargo.",
      "El cambio premia a los negocios que responden rápido y usan bien cada categoría. Una promoción enviada como plantilla de marketing tiene costo; una confirmación de turno enviada a tiempo, no.",
      "Si atendés por WhatsApp con un asistente, conviene revisar qué plantillas tenés aprobadas, en qué categoría y cuándo se envían. Con ese ajuste, la mayoría de las pymes puede atender las 24 horas con un costo de mensajería muy bajo."
    ],
    "box": [
      "¿Respondés dentro de las 24 horas de cada consulta?",
      "¿Tus avisos de turno están cargados como plantillas de utilidad?",
      "¿Separás las promociones del resto de los mensajes?"
    ],
    "sources": [
      {
        "t": "Wati: precios basados en mensajes, todo lo que necesitás saber",
        "u": "https://support.wati.io/es/articles/11561662-precios-basados-en-mensajes-todo-lo-que-necesitas-saber"
      }
    ]
  }
]
