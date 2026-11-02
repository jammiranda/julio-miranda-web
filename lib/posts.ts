export type Post = { slug: string; seoTitle?: string; seoDesc?: string; date: string; dateTxt: string; kicker: string; title: string; desc: string; body: string[]; box?: string[]; sources: { t: string; u: string }[] }

export const posts: Post[] = [
  {
    "slug": "ciberseguridad-2026-identidad-cuentas-pymes",
    "seoTitle": "Ciberseguridad 2026: la puerta es la cuenta",
    "seoDesc": "Argentina es sexta en las Américas por impacto de actividad cibernética, según Microsoft. Por qué proteger cuentas e identidades es la prioridad.",
    "date": "2026-11-02",
    "dateTxt": "2 de noviembre de 2026",
    "kicker": "Ciberseguridad",
    "title": "Ciberseguridad en 2026: los atacantes ya no rompen la puerta, entran con tu contraseña",
    "desc": "El informe anual de defensa digital de Microsoft ubica a la Argentina sexta en las Américas por impacto de actividad cibernética. La prioridad para empresas y organismos: proteger las cuentas.",
    "body": [
      "Microsoft publicó en octubre la séptima edición de su Digital Defense Report, que analiza las amenazas detectadas entre el 1 de julio de 2025 y el 30 de junio de 2026 a partir de más de 165 billones de señales de seguridad que la compañía procesa cada día. La Argentina aparece en el puesto 40 a nivel mundial y sexta en las Américas entre los países cuyos clientes fueron afectados con mayor frecuencia por actividad cibernética.",
      "El ranking no mide cuántos ataques recibe el país ni qué tan segura es su infraestructura, pero confirma una tendencia que se repite en otros relevamientos. Según Check Point Research, en marzo de 2026 cada organización argentina recibió en promedio 2.470 intentos de ataque por semana, un 2% más que un año antes, mientras que América Latina fue la región con mayor volumen del mundo.",
      "El dato más útil del informe de Microsoft no es el ranking, sino cómo entran los atacantes. El phishing, es decir los mensajes falsos que buscan que alguien haga clic o entregue sus datos, explicó el 23% de las intrusiones observadas a nivel global. Y en más de la mitad de los casos en que se comprometió una cuenta, los atacantes la usaron para robar más credenciales. Una sola contraseña filtrada alcanza para abrir el correo, el sistema de gestión, la nube y, desde ahí, llegar a clientes y proveedores.",
      "La inteligencia artificial acelera ese proceso. Los mensajes de phishing ya no llegan con errores de ortografía: están bien redactados y mencionan bancos, trámites o proveedores reales. Además, el informe advierte que el tiempo entre que se descubre una vulnerabilidad y se la explota puede ser inferior a 24 horas, lo que deja poco margen para actualizar los sistemas.",
      "Hay un frente nuevo que las empresas suelen pasar por alto: el uso cotidiano de herramientas de IA generativa. Check Point detectó que 1 de cada 28 consultas enviadas desde entornos corporativos implicaba un riesgo alto de fuga de información confidencial, y que cada organización usa en promedio nueve herramientas distintas.",
      "Las recomendaciones de Microsoft se ordenan en tres prioridades: proteger las identidades, responder más rápido y estar preparados para recuperarse. En la práctica, eso significa activar la verificación en dos pasos en todas las cuentas, reducir la dependencia de las contraseñas, cuidar especialmente a los usuarios con más permisos, mantener los sistemas actualizados y probar de vez en cuando el plan de respaldo.",
      "Qué significa para tu empresa: la ciberseguridad no empieza por comprar un antivirus más caro, sino por saber quién entra a cada sistema y con qué permisos. Para una pyme, una clínica o un organismo, el primer paso es inventariar las cuentas, cerrar las que nadie usa, exigir doble factor y definir qué información puede cargarse en herramientas de IA. En DEVISEBIT desarrollamos sistemas con accesos por rol, registro de actividad y respaldos desde el diseño, para que la seguridad no dependa de la memoria de nadie. Conocé cómo trabajamos en www.devisebit.com/sistemas."
    ],
    "box": [
      "¿Todas las cuentas de tu empresa tienen verificación en dos pasos?",
      "¿Sabés quién tiene acceso a cada sistema y con qué permisos?",
      "¿Cerrás las cuentas cuando alguien deja la empresa?",
      "¿Tu equipo sabe qué datos no debe cargar en herramientas de IA?",
      "¿Probaste alguna vez recuperar tu información desde un respaldo?"
    ],
    "sources": [
      {
        "t": "Infobae: Argentina se ubica sexta en las Américas por impacto de actividad cibernética (09/10/2026)",
        "u": "https://www.infobae.com/tecno/2026/10/09/argentina-se-ubica-sexta-en-las-americas-por-impacto-de-actividad-cibernetica-nuevas-dinamicas-de-amenazas-digitales/"
      },
      {
        "t": "Infosertecla: Microsoft Digital Defense Report 2026, Argentina sexta en las Américas (10/10/2026)",
        "u": "https://infosertecla.com/2026/10/10/microsoft-digital-defense-report-2026-argentina/"
      },
      {
        "t": "ITSitio: ciberataques en Argentina crecen un 2% y superan los 2.400 intentos semanales por organización (13/04/2026)",
        "u": "https://www.itsitio.com/ar/seguridad/ciberataques-en-argentina-crecen-un-2-y-superan-los-2400-intentos-semanales-por-organizacion/"
      }
    ]
  },
  {
    slug: "salud-digital-2026-interoperabilidad",
    seoTitle: "Salud digital 2026: sistemas que se hablan",
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
    "seoTitle": "WhatsApp Business cobra respuestas desde octubre",
    "seoDesc": "Desde el 1 de octubre de 2026 las respuestas en la ventana de 24 horas se cobran por mensaje, con 1.000 conversaciones gratis al mes. Qué revisar antes.",
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
    "seoTitle": "4 de cada 10 pymes argentinas ya usan IA",
    "seoDesc": "Una encuesta de la UTDT, Fundar, el BID y el Observatorio Pyme muestra que el 41,6% de las pymes usa IA, sobre todo en ventas y administración.",
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
    "seoTitle": "Modo IA de Google en español y tu negocio",
    "seoDesc": "El Modo IA de Google ya está en la Argentina: consultas más largas y respuestas que citan pocas fuentes. Estar bien posicionado vale más que antes.",
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
    "seoTitle": "Receta electrónica obligatoria: guía para clínicas",
    "seoDesc": "La Resolución 2214/2025 extiende la receta electrónica a toda prescripción médica. Qué conviene ordenar en el sistema de tu institución.",
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
    "seoTitle": "WhatsApp Business cobra por mensaje: qué cambia",
    "seoDesc": "Desde el 1 de julio de 2025, Meta cobra la API de WhatsApp Business por cada plantilla enviada según su categoría, y no por conversación.",
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
