export type Post = { slug: string; seoTitle?: string; seoDesc?: string; date: string; dateTxt: string; kicker: string; title: string; desc: string; body: string[]; box?: string[]; link?: { t: string; u: string }; sources: { t: string; u: string }[] }

// El cuerpo admite subtítulos: un párrafo que empieza con "## " se muestra como subtítulo (h2).
// `link` es el enlace interno al servicio relacionado (se muestra antes del formulario de la nota).
export const posts: Post[] = [
  {
    "slug": "matebot-asistente-personal-por-audio",
    "seoTitle": "Asistente personal por audio con IA: así funciona MateBot",
    "seoDesc": "MateBot convierte tus audios en turnos, recordatorios y listas. Así funciona el asistente personal con IA que lanzamos gratis en DEVISEBIT.",
    "date": "2026-11-17",
    "dateTxt": "17 de noviembre de 2026",
    "kicker": "Lanzamiento",
    "title": "Asistente personal por audio: cómo la IA convierte un mensaje de voz en tu agenda",
    "desc": "Mandamos audios todo el día. Con inteligencia artificial, ese mismo gesto puede ordenar turnos, recordatorios y listas sin abrir otra app. Así funciona MateBot, el asistente gratuito que lanzamos en DEVISEBIT.",
    "body": [
      "## Hablamos más de lo que escribimos",
      "El audio se volvió la forma más natural de comunicarnos por chat. WhatsApp informó en marzo de 2022 que sus usuarios envían en promedio 7.000 millones de mensajes de voz por día. Telegram, por su parte, superó en marzo de 2025 los 1.000 millones de usuarios activos mensuales, según anunció su fundador, Pavel Durov.",
      "La conclusión es simple: la gente ya está en el chat y ya habla. Lo que faltaba era que alguien escuchara esos audios y los convirtiera en algo útil.",
      "## De un audio a un evento en el calendario",
      "Detrás de un asistente como MateBot hay tres pasos que hoy se resuelven en segundos. Primero, un modelo de reconocimiento de voz transcribe el audio a texto. Segundo, un modelo de lenguaje interpreta lo que la persona quiso decir: entiende que «el jueves a las 10» es una fecha concreta, que «recordame» pide un aviso y que «agregá yerba» va a una lista. Tercero, el sistema guarda el resultado, programa los avisos y ofrece un botón para sumar el evento al calendario que cada uno use: Google Calendar, iPhone u Outlook, sin conectar cuentas.",
      "La clave está en el último detalle: antes de agendar, el asistente muestra lo que entendió y pide confirmación. Si algo se superpone con otro compromiso, lo advierte. La IA hace el trabajo pesado, pero la decisión sigue siendo de la persona.",
      "## Qué hace MateBot",
      "MateBot funciona por Telegram y muy pronto también por WhatsApp. Recibe audios o textos y los transforma en eventos, recordatorios, cumpleaños y listas. Cada mañana manda un resumen del día, avisa un rato antes de cada compromiso y permite compartir la lista del súper y las fechas importantes con la familia. No hay que instalar nada más que Telegram ni crear contraseñas, y es gratis.",
      "## Privacidad desde el diseño",
      "Un asistente que escucha tu agenda tiene que ganarse la confianza. Por eso definimos reglas claras: la agenda, los audios y las listas se usan solo para prestar el servicio, no se venden ni se comparten, y los audios se descartan después de transcribirlos. Los datos de contacto se usan para la cuenta y, solo si la persona lo acepta, para enviarle novedades. Con un comando se borra todo.",
      "Qué significa para tu empresa: la misma tecnología que ordena la agenda de una familia puede ordenar la de un negocio. Confirmar turnos de pacientes, recordar vencimientos a clientes, tomar pedidos por audio o coordinar la agenda de un equipo, todo desde el chat que la gente ya usa. En DEVISEBIT diseñamos estas automatizaciones conversacionales a medida, integradas con el CRM y los sistemas de cada organización. MateBot es la demostración más directa: probalo gratis en matebot.devisebit.com."
    ],
    "box": [
      "¿Cuántos turnos o citas se pierden por olvidos en tu negocio?",
      "¿Tus clientes ya te mandan audios por WhatsApp?",
      "¿Los recordatorios hoy los manda una persona a mano?",
      "¿Tu agenda está conectada con tu CRM?"
    ],
    "link": {
      "t": "Probá MateBot gratis",
      "u": "https://matebot.devisebit.com"
    },
    "sources": [
      {
        "t": "Blog de WhatsApp: We’re Making Voice Messages Even Better (30 de marzo de 2022)",
        "u": "https://blog.whatsapp.com/making-voice-messages-better"
      },
      {
        "t": "TechCrunch: Telegram founder Pavel Durov says app now has 1B users (19 de marzo de 2025)",
        "u": "https://techcrunch.com/2025/03/19/telegram-founder-pavel-durov-says-app-now-has-1b-users-calls-whatsapp-a-cheap-watered-down-imitation"
      }
    ]
  },
  {
    "slug": "bot-de-telegram-para-empresas",
    "seoTitle": "Bot de Telegram para empresas: qué es y para qué sirve",
    "seoDesc": "Qué es un bot de Telegram, qué puede hacer por una empresa, cuánto cuesta la plataforma y en qué se diferencia de un asistente de WhatsApp.",
    "date": "2026-11-17",
    "dateTxt": "17 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Bot de Telegram para empresas: qué es, para qué sirve y en qué se diferencia de WhatsApp",
    "desc": "Telegram ya supera los 1.000 millones de usuarios y su plataforma de bots es gratuita. Qué puede hacer un bot por una organización, qué límites tiene y cuándo conviene sumarlo a WhatsApp.",
    "body": [
      "Cuando una empresa piensa en atender por chat, piensa en WhatsApp. Tiene sentido: es donde está la mayoría de sus clientes. Pero hay otra plataforma que creció en silencio y que resuelve muy bien un tipo de tarea: Telegram y sus bots.",
      "## Qué es un bot de Telegram",
      "La documentación oficial de Telegram define a los bots como pequeñas aplicaciones que funcionan dentro de la propia app. El usuario no instala nada: abre un enlace, toca «Iniciar» y conversa con el bot como con cualquier contacto. Del otro lado no hay una persona, sino un programa que responde, guarda datos o ejecuta una tarea.",
      "Según esa misma documentación, la plataforma aloja más de 10 millones de bots y es gratuita tanto para los usuarios como para quienes los desarrollan. Un bot se registra con @BotFather, la herramienta oficial, que entrega una clave de acceso. A partir de ahí, lo que el bot sepa hacer depende del sistema que tenga detrás.",
      "## Para qué le sirve a una empresa",
      "Un bot bien diseñado cubre tareas concretas: responder preguntas frecuentes, tomar pedidos o reservas, enviar recordatorios, avisar al equipo cuando entra una consulta o entregar un informe diario. Telegram suma herramientas propias: botones y menús de comandos, mini aplicaciones dentro del chat y la posibilidad de cobrar productos y servicios.",
      "La documentación también contempla los asistentes con inteligencia artificial, que se integran de forma nativa, y un modo para negocios que permite conectar un bot a una cuenta de Telegram Business para que responda mensajes en su nombre.",
      "Hay un uso menos visible y muy valioso: los avisos internos. Un bot puede mandarle al dueño o al equipo cada consulta nueva, cada pago y cada alerta de un sistema, con sonido solo cuando hace falta. En DEVISEBIT lo usamos así todos los días.",
      "## En qué se diferencia de WhatsApp",
      "La primera diferencia es de alcance. Telegram anunció en marzo de 2025 que superó los 1.000 millones de usuarios activos por mes; WhatsApp tiene más de 2.000 millones. Conviene preguntarles a los propios clientes qué usan antes de elegir.",
      "La segunda es de costo de plataforma. Según su documentación, la plataforma de bots de Telegram es gratuita para usuarios y desarrolladores. En la Plataforma de WhatsApp Business, Meta cobra por mensaje entregado según la categoría y el país, como explicamos en nuestra guía sobre la API de WhatsApp. En los dos casos hay que sumar el desarrollo y, si el bot usa inteligencia artificial, el consumo de esos modelos.",
      "La tercera es una regla que comparten con matices: en Telegram un bot no puede iniciar una conversación; la persona tiene que escribirle primero o abrir su enlace. En WhatsApp, fuera de la ventana de 24 horas, la empresa solo puede escribir con plantillas aprobadas.",
      "## Cuándo conviene",
      "Telegram conviene cuando el público ya lo usa, para comunidades y canales de difusión, para herramientas internas del equipo y para probar una idea rápido y sin costo de mensajería. WhatsApp conviene para la atención al cliente masiva. No son excluyentes: el mismo asistente puede atender en los dos canales con la misma información y el mismo registro.",
      "Qué significa para tu empresa: empezá por una tarea, no por la tecnología. Elegí algo que hoy se hace a mano y se repite todos los días, como confirmar turnos, avisar vencimientos o reportar las ventas del día, y probalo con un grupo chico. Para ver cómo se siente hablarle a un bot, MateBot, nuestro asistente gratuito por audio, está disponible en Telegram: se le dicta un compromiso y lo ordena. En DEVISEBIT desarrollamos bots de Telegram y asistentes de WhatsApp con IA a medida, integrados con el CRM y los sistemas de cada organización."
    ],
    "box": [
      "¿Tus clientes o tu equipo ya usan Telegram?",
      "¿Qué aviso o respuesta repetís a mano todos los días?",
      "¿Cómo se entera hoy tu equipo de que entró una consulta?",
      "¿Tu atención por chat depende de una sola persona y de un solo canal?"
    ],
    "link": {
      "t": "Probá MateBot gratis en Telegram",
      "u": "https://matebot.devisebit.com"
    },
    "sources": [
      {
        "t": "Telegram: Bots: An introduction for developers",
        "u": "https://core.telegram.org/bots"
      },
      {
        "t": "TechCrunch: Telegram founder Pavel Durov says app now has 1B users (19 de marzo de 2025)",
        "u": "https://techcrunch.com/2025/03/19/telegram-founder-pavel-durov-says-app-now-has-1b-users-calls-whatsapp-a-cheap-watered-down-imitation"
      },
      {
        "t": "Meta for Developers: Pricing on the WhatsApp Business Platform",
        "u": "https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing"
      }
    ]
  },
  {
    "slug": "pasar-audios-de-whatsapp-a-texto",
    "seoTitle": "Cómo pasar audios de WhatsApp a texto, paso a paso",
    "seoDesc": "Cómo activar la transcripción de mensajes de voz en WhatsApp, qué límites tiene y cómo una empresa puede atender audios con inteligencia artificial.",
    "date": "2026-11-17",
    "dateTxt": "17 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Cómo pasar audios de WhatsApp a texto: la función oficial y qué puede hacer una empresa",
    "desc": "WhatsApp ya transcribe los mensajes de voz desde la propia aplicación. Cómo se activa, qué límites tiene y por qué una empresa que atiende por chat necesita algo más para entender los audios de sus clientes.",
    "body": [
      "El audio es cómodo para quien lo manda y no siempre para quien lo recibe. WhatsApp informó que sus usuarios envían en promedio 7.000 millones de mensajes de voz por día. Para una persona, escucharlos lleva tiempo; para una empresa que atiende por chat, además, es información que queda fuera de sus registros.",
      "## La función oficial: transcripciones de mensajes de voz",
      "Desde noviembre de 2024 WhatsApp incluye una función propia para leer los audios en lugar de escucharlos. Según el blog oficial, se activa en Ajustes, Chats, Transcripciones de mensajes de voz. Ahí se enciende la opción y se elige el idioma; el español está entre los disponibles desde el lanzamiento.",
      "Una vez activada, se mantiene presionado el mensaje de voz y se toca «Transcribir». El texto aparece en el mismo chat, junto al audio.",
      "## Qué pasa con la privacidad",
      "WhatsApp explica que las transcripciones se generan en el propio teléfono. Por eso nadie más, ni siquiera WhatsApp, puede escuchar ni leer esos mensajes, que siguen protegidos con cifrado de extremo a extremo.",
      "## Los límites que conviene conocer",
      "La función viene desactivada: hay que encenderla a mano. Funciona con una lista acotada de idiomas, que WhatsApp publica en su Centro de ayuda y va ampliando. Y, como toda transcripción automática, puede fallar con ruido de fondo, nombres propios o varias personas hablando.",
      "Hay otro límite menos evidente: es una herramienta para la persona que recibe el audio en su teléfono. No resuelve el caso de una empresa que atiende un número con varias personas o con un asistente automático.",
      "## Qué cambia cuando la que recibe audios es una empresa",
      "Cuando una organización atiende por la Plataforma de WhatsApp Business, los mensajes llegan a un sistema, no a un teléfono. Si ese sistema no sabe qué hacer con un audio, pasa lo peor: el asistente contesta cualquier cosa o le pide al cliente que escriba, y muchos no vuelven.",
      "La solución es la misma tecnología, aplicada del lado de la empresa. Un modelo de reconocimiento de voz convierte el audio en texto en segundos y un modelo de lenguaje interpreta lo que la persona pidió. Con eso el asistente puede responder, tomar un pedido o dar un turno, y la consulta queda escrita en el historial para quien la retome después.",
      "Tres cuidados hacen la diferencia. Avisarle al cliente qué se hace con sus audios y no guardarlos más de lo necesario. Mostrar lo que se entendió y pedir confirmación antes de agendar o cobrar algo. Y derivar a una persona cuando el audio no se entiende, en lugar de insistir.",
      "Qué significa para tu empresa: revisá cuántos de los mensajes que recibís por semana son audios y qué pasa hoy con ellos. Si los escucha una persona, medí cuánto tiempo le lleva. Si atiende un asistente, mandale vos un audio y mirá qué responde. En DEVISEBIT los asistentes de WhatsApp con IA que desarrollamos entienden los audios de los clientes, y con MateBot, nuestro asistente gratuito, llevamos la misma idea a la agenda personal: se le dicta un compromiso y lo ordena."
    ],
    "box": [
      "¿Qué porcentaje de las consultas te llega por audio?",
      "¿Quién escucha esos audios y cuánto tarda en responder?",
      "¿Lo que el cliente dice en un audio queda registrado en algún sistema?",
      "¿Qué responde tu asistente cuando recibe un mensaje de voz?",
      "¿Tus clientes saben qué hacés con sus audios?"
    ],
    "link": {
      "t": "Asistente de WhatsApp con IA para empresas",
      "u": "/whatsapp"
    },
    "sources": [
      {
        "t": "Blog de WhatsApp: Presentamos las transcripciones de mensajes de voz (21 de noviembre de 2024)",
        "u": "https://blog.whatsapp.com/introducing-voice-message-transcripts?lang=es"
      },
      {
        "t": "Blog de WhatsApp: We’re Making Voice Messages Even Better (30 de marzo de 2022)",
        "u": "https://blog.whatsapp.com/making-voice-messages-better"
      },
      {
        "t": "Xataka México: Las transcripciones de voz llegan a WhatsApp, de forma oficial y en español",
        "u": "https://www.xataka.com.mx/aplicaciones/transcripciones-voz-llegan-a-whatsapp-asi-puedes-convertir-audios-a-texto-forma-oficial-espanol"
      }
    ]
  },
  {
    "slug": "recordatorios-de-turnos-por-whatsapp",
    "seoTitle": "Recordatorios de turnos por WhatsApp: guía y evidencia",
    "seoDesc": "Qué dice la evidencia sobre los recordatorios de turnos, cómo se envían por WhatsApp con plantillas y qué debe tener un buen recordatorio.",
    "date": "2026-11-17",
    "dateTxt": "17 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Recordatorios de turnos por WhatsApp: qué dice la evidencia y cómo implementarlos",
    "desc": "Un turno al que nadie va es una hora perdida para el profesional y para otro paciente que lo necesitaba. Qué mostró la investigación sobre los recordatorios por mensaje y cómo armarlos bien en WhatsApp.",
    "body": [
      "Consultorios, centros de salud, estudios y talleres conviven con el mismo problema: turnos dados a los que la persona no llega. Muchas veces no hay mala voluntad, hay olvido. Y el olvido se puede prevenir con un mensaje a tiempo.",
      "## Qué dice la evidencia",
      "La referencia más citada es una revisión Cochrane de 2013, que reunió ocho ensayos controlados con 6.615 participantes. Comparó los recordatorios por mensaje de texto con no recordar, con el correo postal y con la llamada telefónica.",
      "El resultado: los recordatorios por mensaje aumentaron la asistencia frente a no enviar nada. En los estudios incluidos, la asistencia fue de 67,8 % sin recordatorio, 78,6 % con mensaje y 80,3 % con llamada. Es decir, el mensaje rindió casi lo mismo que el llamado, y los dos estudios que midieron costos lo encontraron más económico.",
      "Conviene leerlo con cuidado. Los autores califican la evidencia como de calidad baja a moderada, y los estudios se hicieron con SMS, no con WhatsApp. Lo que se puede trasladar es la conclusión de fondo: un recordatorio escrito, enviado a tiempo al teléfono de la persona, mejora la asistencia.",
      "## Cómo funcionan en WhatsApp",
      "Un recordatorio se envía uno o dos días antes del turno, cuando el cliente no le está escribiendo a la empresa. En la Plataforma de WhatsApp Business, fuera de la ventana de 24 horas solo se puede escribir con plantillas: mensajes con un formato aprobado de antemano por Meta. Un aviso de turno entra en la categoría de utilidad, y Meta cobra por cada mensaje entregado, con una tarifa que depende del país.",
      "Dos condiciones previas: la persona tiene que haber aceptado recibir mensajes por ese canal, y el sistema de turnos tiene que estar conectado, para que el aviso salga solo y con los datos correctos.",
      "## Qué debe tener un buen recordatorio",
      "Lo justo: día, hora, lugar y con quién. Si es un turno de salud, sin datos clínicos: alcanza con «tenés un turno», no hace falta decir para qué.",
      "Botones para responder: Confirmo, Cancelo, Reprogramar. Ese es el salto frente al SMS, porque el mensaje deja de ser un aviso y pasa a ser una gestión. Si la persona cancela, el turno se libera y puede ofrecerse a otra.",
      "Un segundo aviso corto, el mismo día, para turnos tomados con mucha anticipación. Y una salida a una persona del equipo para lo que el mensaje no resuelve.",
      "## Qué medir",
      "Antes de empezar, registrá el ausentismo actual: cuántos turnos dados no se concretan por semana. Después medí cuántos recordatorios se entregan, cuántos se confirman, cuántos se cancelan con tiempo y cuántos de esos turnos se reasignan. Sin el número de partida no hay forma de saber si funcionó.",
      "Qué significa para tu empresa: si hoy los recordatorios los manda una persona de a uno, ese es el primer proceso para automatizar. Devuelve horas al equipo y turnos a la agenda. En DEVISEBIT desarrollamos asistentes de WhatsApp con IA que dan turnos, los recuerdan y toman la confirmación, integrados con la agenda y el sistema de cada organización. Y para la agenda personal lanzamos MateBot, un asistente gratuito que avisa antes de cada compromiso."
    ],
    "box": [
      "¿Cuántos turnos por semana se pierden por ausencias?",
      "¿Quién manda hoy los recordatorios y cuánto tiempo le lleva?",
      "¿Tus clientes pueden confirmar o cancelar con un toque?",
      "¿Un turno cancelado vuelve a ofrecerse a otra persona?",
      "¿Tu agenda está conectada con WhatsApp y con tu sistema?"
    ],
    "link": {
      "t": "Asistente de WhatsApp con IA para empresas",
      "u": "/whatsapp"
    },
    "sources": [
      {
        "t": "Cochrane: Mobile phone messaging reminders for attendance at healthcare appointments (Gurol-Urganci y otros, 2013)",
        "u": "https://www.cochrane.org/evidence/CD007458_mobile-phone-messaging-reminders-attendance-healthcare-appointments"
      },
      {
        "t": "Meta for Developers: Pricing on the WhatsApp Business Platform",
        "u": "https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing"
      }
    ]
  },
  {
    "slug": "gobierno-digital-ia-atencion-ciudadana",
    "seoTitle": "IA en la atención ciudadana: qué enseñan Boti y la Provincia",
    "seoDesc": "Ciudad y Provincia de Buenos Aires ya atienden con IA por WhatsApp. Qué normas lo respaldan y qué lecciones sirven a cualquier organismo.",
    "date": "2026-11-16",
    "dateTxt": "16 de noviembre de 2026",
    "kicker": "Gobierno digital",
    "title": "Gobierno digital: la atención ciudadana con inteligencia artificial ya es política pública",
    "desc": "La Ciudad y la Provincia de Buenos Aires formalizaron en 2026 el uso de inteligencia artificial para atender a los vecinos. Qué dicen las normas y qué lecciones deja la experiencia de Boti.",
    "body": [
      "Durante años, los asistentes virtuales en el Estado fueron pruebas piloto. En 2026 eso cambió: dos de los gobiernos más grandes del país pasaron a tratar la inteligencia artificial en la atención ciudadana como una política con norma propia, autoridad responsable y canales oficiales.",
      "## La Ciudad: prioridad por decreto",
      "El Decreto 97/2026 de la Ciudad de Buenos Aires, publicado en el Boletín Oficial porteño el 9 de marzo, ordena a las áreas del gobierno potenciar y asegurar la implementación de soluciones de IA en la gestión y en la relación con la ciudadanía. Define como trámites prioritarios las habilitaciones de actividades económicas, los permisos y avisos de obra, la tramitación de actas de infracción y todos los procedimientos que pasan por los canales de atención. La Secretaría de Innovación y Transformación Digital queda a cargo de ejecutar y reglamentar la medida.",
      "## La Provincia: un asistente oficial por WhatsApp y web",
      "En abril, la Provincia de Buenos Aires oficializó por la Resolución 147/2026 del Ministerio de Gobierno el «Asistente Virtual de Consultas y Atención Ciudadana». Según informó Ámbito, funciona por WhatsApp Business con número verificado y por webchat en los sitios oficiales, y responde trámites, reclamos y consultas. El punto clave es su diseño: un «modelo híbrido» que combina respuestas automáticas con intervención humana y deriva a las áreas específicas cuando hace falta. La Subsecretaría de Gobierno Digital es la autoridad de aplicación, y el tratamiento de datos se rige por la Ley de Protección de Datos Personales.",
      "## Lo que enseña Boti después de siete años",
      "La Ciudad no empieza de cero. Su chatbot Boti se lanzó oficialmente en WhatsApp en febrero de 2019, y el documento «Caso Boti», publicado por el propio gobierno porteño en 2025, repasa su recorrido: en el primer trimestre de 2022 superó los 26 millones de interacciones y cerró ese año con 58 millones. El informe deja lecciones que sirven a cualquier organismo:",
      "Primero, ir adonde ya está la gente. El documento cuenta que, antes del salto a WhatsApp, el 80% de los usuarios consultaba por la web, y que ese 80% migró al nuevo canal. Segundo, la tecnología sola no alcanza: el informe sostiene que el bot «solo funciona con humanos detrás» que le indican qué está bien y qué está mal. Tercero, hay que probar siempre, porque quedan situaciones sin cubrir o mal cubiertas. Y cuarto, una sola voz: mensajes concisos, claros y ordenados, con una guía de estilo escrita.",
      "## Del chatbot de menús al asistente que resuelve",
      "El cambio de fondo es que el objetivo ya no es contestar preguntas frecuentes, sino resolver trámites: iniciar un reclamo, consultar un expediente, pedir un turno. Eso exige conectar el asistente con los sistemas internos, registrar cada interacción y definir con claridad cuándo interviene una persona.",
      "Qué significa para tu organismo o empresa: municipios, entes, colegios profesionales y prestadores de salud pueden aplicar la misma receta a su escala. Conviene empezar por los tres o cuatro trámites que más consultas generan, usar un número oficial de WhatsApp verificado, prever siempre la derivación a una persona y cumplir la Ley 25.326 desde el diseño. En DEVISEBIT desarrollamos asistentes de WhatsApp con IA y sistemas de gestión para organismos y empresas, pensados para resolver y no solo para responder."
    ],
    "box": [
      "¿Cuáles son los tres trámites que más consultas generan en tu organización?",
      "¿Tu canal de WhatsApp es un número oficial y verificado?",
      "¿Qué pasa hoy cuando el asistente no sabe la respuesta?",
      "¿Las consultas quedan registradas y conectadas con tus sistemas?",
      "¿Quién revisa y mejora las respuestas cada mes?"
    ],
    "link": {
      "t": "Asistente de WhatsApp con IA para organismos y empresas",
      "u": "/whatsapp"
    },
    "sources": [
      {
        "t": "Liga del Consorcista: CABA – Decreto 97/26, IA en la gestión gubernamental (texto del decreto)",
        "u": "https://ligadelconsorcista.org/caba-decreto-97-2026-inteligencia-artificial-en-gestion-gubernamental"
      },
      {
        "t": "Ámbito: La provincia de Buenos Aires lanzó un asistente virtual con inteligencia artificial para trámites y consultas",
        "u": "https://www.ambito.com/la-provincia-buenos-aires-lanzo-un-asistente-virtual-inteligencia-artificial-tramites-y-consultas-n6272448"
      },
      {
        "t": "Gobierno de la Ciudad de Buenos Aires: Caso Boti (julio de 2025)",
        "u": "https://static.buenosaires.gob.ar/sites/default/files/2025-07/Caso_Boti.pdf"
      }
    ]
  },
  {
    "slug": "mensajes-automaticos-whatsapp-business",
    "seoTitle": "Mensajes automáticos en WhatsApp Business: guía",
    "seoDesc": "Cómo poner mensajes automáticos en WhatsApp Business: bienvenida, ausencia y respuestas rápidas, paso a paso, con sus límites.",
    "date": "2026-11-15",
    "dateTxt": "15 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Cómo poner mensajes automáticos en WhatsApp Business: bienvenida, ausencia y respuestas rápidas",
    "desc": "La aplicación WhatsApp Business trae tres herramientas para responder cuando no hay nadie del otro lado. Cómo se configura cada una, qué límites tiene y cuándo conviene dar el paso siguiente.",
    "body": [
      "Quien atiende clientes por WhatsApp conoce el problema: los mensajes llegan a cualquier hora y no siempre hay alguien para responder. La aplicación WhatsApp Business incluye tres herramientas para cubrir ese hueco sin instalar nada más: el mensaje de bienvenida, el mensaje de ausencia y las respuestas rápidas. Las tres se configuran desde la pestaña Herramientas.",
      "## Mensaje de bienvenida: la primera respuesta",
      "Según el Centro de ayuda de WhatsApp, el mensaje de bienvenida se envía solo cuando un cliente escribe por primera vez o cuando vuelve a escribir después de 14 días sin actividad en el chat. Para activarlo, en Herramientas tocá Mensaje de bienvenida, activá Enviar mensaje de bienvenida, editá el texto y elegí los destinatarios: todos, solo quienes no están en tu libreta de contactos, todos excepto algunos o solo contactos específicos.",
      "Un buen mensaje de bienvenida dice quién responde, en qué horario y qué dato conviene que el cliente mande primero. Por ejemplo: «Hola, gracias por escribirnos. Atendemos de lunes a viernes de 9 a 18. Contanos tu nombre y qué necesitás, y te respondemos a la brevedad».",
      "## Mensaje de ausencia: avisar cuando no hay nadie",
      "El mensaje de ausencia responde automáticamente cuando no podés contestar. Se configura en Herramientas, Mensaje de ausencia, y tiene tres modos: enviarlo siempre, en un horario personalizado o solo fuera del horario comercial. Esta última opción aparece únicamente si cargaste el horario en el perfil de la empresa. También se puede elegir a quiénes se les envía.",
      "## Respuestas rápidas: atajos para lo que se repite",
      "Las respuestas rápidas no se envían solas: son textos guardados que se insertan escribiendo «/» en el chat. Sirven para la dirección, los medios de pago o los requisitos de un trámite. WhatsApp permite guardar hasta 50 y aclara que en WhatsApp Web y en la versión de escritorio no admiten archivos multimedia.",
      "## Los límites que conviene conocer",
      "Estas herramientas tienen tres límites. Primero, el teléfono tiene que estar conectado a internet para que los mensajes automáticos salgan. Segundo, son textos fijos: no entienden la consulta, no buscan un dato ni reservan un turno. Tercero, el Centro de ayuda indica que el mensaje de bienvenida se desactiva cuando la cuenta tiene conectado Meta Business Agent, el asistente de Meta.",
      "Si recibís pocas consultas y parecidas entre sí, con esto alcanza. Cuando el volumen crece, o cuando cada consulta necesita un dato distinto, el paso siguiente es un asistente con inteligencia artificial conectado a la Plataforma de WhatsApp Business, que responde con la información real de la organización y deriva a una persona cuando hace falta.",
      "Qué significa para tu empresa: empezá por lo simple. Cargá el horario comercial en el perfil, activá bienvenida y ausencia, y guardá como respuesta rápida las cinco preguntas que más se repiten. Medí durante un mes cuántas consultas quedan sin resolver con esos textos: ese número indica si necesitás automatizar más. En DEVISEBIT desarrollamos asistentes de WhatsApp con IA que responden, toman datos y dan turnos con la información de cada organización."
    ],
    "box": [
      "¿Tu perfil de WhatsApp Business tiene cargado el horario comercial?",
      "¿Qué recibe hoy un cliente que escribe un sábado a la noche?",
      "¿Cuáles son las cinco preguntas que más se repiten?",
      "¿Cuántas consultas por semana quedan sin respuesta en el día?",
      "¿Las consultas de WhatsApp quedan registradas en algún sistema?"
    ],
    "link": {
      "t": "Asistente de WhatsApp con IA para empresas",
      "u": "/whatsapp"
    },
    "sources": [
      {
        "t": "Centro de ayuda de WhatsApp: Cómo usar los mensajes de bienvenida",
        "u": "https://faq.whatsapp.com/501866148528310/?locale=es_LA"
      },
      {
        "t": "Centro de ayuda de WhatsApp: Cómo usar los mensajes de ausencia",
        "u": "https://faq.whatsapp.com/2565868990219715/?locale=es_LA"
      },
      {
        "t": "Centro de ayuda de WhatsApp: Cómo usar las respuestas rápidas",
        "u": "https://faq.whatsapp.com/es/android/26000101/"
      }
    ]
  },
  {
    "slug": "api-de-whatsapp-business-que-es",
    "seoTitle": "API de WhatsApp Business: qué es y cómo se cobra",
    "seoDesc": "Qué es la API de WhatsApp Business, cómo funciona la ventana de 24 horas, qué cambió en el cobro desde octubre de 2026 y cuándo conviene.",
    "date": "2026-11-15",
    "dateTxt": "15 de noviembre de 2026",
    "kicker": "Guía",
    "title": "API de WhatsApp Business: qué es, cómo se cobra y cuándo conviene",
    "desc": "La API es lo que permite conectar WhatsApp a un sistema, un CRM o un asistente con IA. Cómo funciona la ventana de 24 horas y qué cambió en el cobro desde el 1 de octubre de 2026.",
    "body": [
      "WhatsApp tiene dos productos para empresas que suelen confundirse. La aplicación WhatsApp Business se usa desde un teléfono y está pensada para negocios chicos. La Plataforma de WhatsApp Business, conocida como «la API de WhatsApp», no tiene pantalla propia: es la conexión que permite que un sistema, un CRM o un asistente con IA envíe y reciba mensajes en nombre de la empresa.",
      "## Para qué sirve",
      "Con la API, varias personas atienden el mismo número desde un sistema, las consultas quedan registradas y se pueden automatizar avisos como confirmaciones de turno, estados de pedido o recordatorios. También es la base de los asistentes con inteligencia artificial que responden las 24 horas.",
      "## La ventana de 24 horas",
      "La regla central está en la documentación de Meta: cuando un usuario le escribe a la empresa se abre una ventana de atención de 24 horas, que se reinicia con cada mensaje nuevo del usuario. Mientras está abierta, la empresa puede responder con mensajes libres. Fuera de la ventana solo puede escribir con plantillas, que son mensajes con un formato aprobado de antemano.",
      "## Cómo se cobra",
      "Meta cobra por mensaje entregado, no por mensaje enviado, y la tarifa depende de dos cosas: la categoría del mensaje y el país del número que lo recibe. Las categorías son cuatro: marketing (plantillas promocionales), utilidad (plantillas transaccionales o informativas, como un aviso de turno), autenticación (códigos de verificación) y servicio (respuestas libres dentro de la ventana, escritas por una persona o por una IA de terceros).",
      "## Qué cambió en octubre de 2026",
      "Según la documentación oficial, desde el 1 de octubre de 2026 Meta volvió a cobrar los mensajes de servicio y las plantillas de utilidad enviados dentro de la ventana abierta, que hasta entonces eran gratuitos. Para los mensajes de servicio hay un cupo de 1.000 mensajes sin cargo por mes para cada número de la empresa: se cobra a partir del 1.001 y el cupo no se acumula de un mes a otro.",
      "Hay otra excepción útil para quien hace publicidad. Si el usuario escribe desde un anuncio que abre un chat de WhatsApp y la empresa responde dentro de la ventana, se abre un período sin cargo de hasta 7 días para los mensajes de marketing, utilidad, autenticación y servicio.",
      "## Cuándo conviene",
      "La API conviene cuando atiende más de una persona, cuando hace falta registrar las consultas en un sistema, cuando hay que enviar avisos automáticos o cuando se quiere un asistente con IA. Si el negocio recibe pocas consultas y las atiende una sola persona, la aplicación WhatsApp Business suele alcanzar.",
      "Qué significa para tu empresa: antes de contratar, estimá cuántas conversaciones tenés por mes y de qué tipo. Con el cambio de octubre, el costo depende de cuántas respuestas se envían, así que conviene diseñar respuestas completas en lugar de muchos mensajes cortos y revisar las tarifas vigentes para la Argentina en la documentación de Meta. En DEVISEBIT desarrollamos asistentes de WhatsApp con IA que responden, toman datos y derivan a una persona, con cada conversación registrada."
    ],
    "box": [
      "¿Cuántas personas atienden hoy el mismo número de WhatsApp?",
      "¿Cuántas conversaciones recibís por mes?",
      "¿Qué avisos repetís a mano (turnos, pedidos, vencimientos)?",
      "¿Las consultas quedan registradas con su origen?",
      "¿Sabés cuántos mensajes de respuesta envía tu empresa por mes?"
    ],
    "link": {
      "t": "Asistente de WhatsApp con IA para empresas",
      "u": "/whatsapp"
    },
    "sources": [
      {
        "t": "Meta for Developers: Pricing on the WhatsApp Business Platform",
        "u": "https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing"
      },
      {
        "t": "WhatsApp Business: Plataforma de WhatsApp Business",
        "u": "https://whatsappbusiness.com/es-la/products/business-platform/"
      }
    ]
  },
  {
    "slug": "como-crear-una-pagina-web-con-ia",
    "seoTitle": "Cómo crear una página web con IA: guía práctica",
    "seoDesc": "Cómo crear una página web con IA: pasos, qué dice Google sobre el contenido generado con IA y qué revisar antes de publicar.",
    "date": "2026-11-15",
    "dateTxt": "15 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Cómo crear una página web con IA: qué resuelve y qué hay que revisar",
    "desc": "La inteligencia artificial acorta el diseño, los textos y la programación de una web. Qué pasos seguir, qué dice Google sobre el contenido generado con IA y qué controlar antes de publicar.",
    "body": [
      "Hoy se puede tener una página web publicada en muy poco tiempo con ayuda de la inteligencia artificial: la IA propone la estructura, redacta los textos y genera el código. Lo que no hace sola es conocer tu negocio ni verificar que lo que escribió sea cierto. Esta guía repasa los pasos y los controles que no conviene saltear.",
      "## Qué resuelve la IA y qué no",
      "La IA acelera lo que antes llevaba semanas: el primer diseño, la redacción de base y la programación. Lo que sigue dependiendo de una persona es definir qué se ofrece, a quién y con qué prueba: casos reales, fotos propias, condiciones del servicio y datos de contacto.",
      "## Los pasos, en orden",
      "Primero, definí un objetivo por página: que te escriban, que pidan un presupuesto o que reserven un turno. Segundo, reuní el contenido propio antes de generar nada: servicios, zona de atención, preguntas frecuentes y fotos reales. Tercero, generá la estructura y los textos con IA a partir de ese material, no desde cero.",
      "Cuarto, revisá cada dato: nombres, direcciones, horarios y todo lo que se promete. Quinto, publicá con el dominio registrado a nombre de la empresa y con certificado de seguridad (SSL). Sexto, medí cuántas visitas terminan en consulta y cuánto tarda en cargar la página.",
      "Un punto que suele pasarse por alto es la propiedad: el dominio, el hosting y el código tienen que quedar a nombre de la empresa, con los accesos documentados. Así la web se puede mover o modificar sin depender de quien la armó.",
    "## Qué dice Google sobre el contenido hecho con IA",
      "Google no prohíbe el contenido generado con IA. En sus directrices para sitios web señala que la IA generativa es útil para investigar un tema y darle estructura a contenido original, pero advierte que usarla para producir muchas páginas sin aportar valor puede infringir su política de spam sobre abuso de contenido a gran escala.",
      "El mismo documento recuerda que los modelos generativos predicen secuencias probables de palabras y que por eso pueden incluir datos inexactos. La recomendación es verificar y revisar todo antes de publicar, incluidos el título de la página, la metadescripción, los datos estructurados y los textos alternativos de las imágenes. También sugiere contarle al lector cómo se creó el contenido cuando eso le aporta contexto.",
      "## Velocidad: lo que se mide",
      "Una web generada con IA puede verse bien y cargar mal. Google propone tres métricas, las Core Web Vitals, medidas en el percentil 75 de las cargas: que el contenido principal aparezca en 2,5 segundos o menos (LCP), que la página responda a una interacción en 200 milisegundos o menos (INP) y que el diseño no se mueva mientras carga, con un valor de 0,1 o menos (CLS).",
      "Qué significa para tu empresa: la IA baja el tiempo de tener una web, pero el resultado depende del material que le des y de la revisión posterior. Pedí siempre que el dominio quede a tu nombre, que alguien verifique los textos y que la página se pruebe en el celular antes de publicarla. En DEVISEBIT diseñamos páginas web a medida con IA y revisión de especialistas."
    ],
    "box": [
      "¿Cuál es la única acción que querés que haga quien entra a tu web?",
      "¿Tenés fotos y casos propios para mostrar?",
      "¿El dominio está registrado a nombre de tu empresa?",
      "¿Alguien revisó cada dato que escribió la IA?",
      "¿Probaste cuánto tarda en cargar desde un celular?"
    ],
    "link": {
      "t": "Diseño de páginas web a medida para empresas",
      "u": "/webs"
    },
    "sources": [
      {
        "t": "Google Search Central: Directrices de la Búsqueda de Google sobre el uso de contenido generado por IA en tu sitio web (actualizado el 05/10/2026)",
        "u": "https://developers.google.com/search/docs/fundamentals/using-gen-ai-content?hl=es"
      },
      {
        "t": "web.dev: Web Vitals, métricas esenciales para un sitio en buen estado",
        "u": "https://web.dev/articles/vitals?hl=es-419"
      }
    ]
  },
  {
    "slug": "landing-page-ejemplos-que-debe-tener",
    "seoTitle": "Landing page: ejemplos y qué debe tener",
    "seoDesc": "Qué es una landing page, ejemplos según el objetivo, qué debe tener para generar consultas y cómo influye en el Nivel de calidad de Google Ads.",
    "date": "2026-11-15",
    "dateTxt": "15 de noviembre de 2026",
    "kicker": "Guía",
    "title": "Landing page: qué es, ejemplos y qué debe tener para generar consultas",
    "desc": "Una landing page es una página pensada para una sola acción. Ejemplos según el objetivo, los elementos que no pueden faltar y por qué pesa en el resultado de la publicidad.",
    "body": [
      "Una landing page, o página de destino, es una página pensada para una sola acción: que el visitante escriba, pida un presupuesto, reserve un turno o se inscriba. A diferencia de la página de inicio, no presenta toda la empresa: responde a una búsqueda o a un anuncio concreto.",
      "## Ejemplos de landing page según el objetivo",
      "Consulta por WhatsApp: presenta un servicio, sus beneficios, dos o tres casos y un botón que abre el chat con un mensaje ya escrito. Es un formato habitual en comercios y servicios profesionales.",
      "Pedido de presupuesto: explica el alcance, muestra trabajos anteriores y termina en un formulario corto, de tres o cuatro campos.",
      "Reserva de turno: muestra especialidades, horarios y cobertura, y lleva directo a la agenda. Es frecuente en consultorios y centros de salud.",
      "Descarga o inscripción: ofrece una guía, un curso o un evento a cambio del email, con la fecha y el temario a la vista.",
      "## Qué debe tener",
      "Un título que repita lo que la persona buscó, una explicación en dos líneas, una prueba (casos, cifras propias, opiniones verificables), respuestas a las dudas más comunes y un único llamado a la acción que se repite a lo largo de la página. Lo que no suma a esa acción, distrae.",
      "## Errores frecuentes",
    "Los más comunes son tres: mandar el anuncio a la página de inicio, donde el visitante tiene que buscar lo que le prometieron; pedir demasiados datos en el formulario; y sumar menús o enlaces que sacan a la persona de la página antes de que consulte. También conviene que el texto del anuncio y el título de la landing digan lo mismo, con las mismas palabras.",
    "## Por qué importa si hacés publicidad",
      "En Google Ads, la página de destino influye en el Nivel de calidad, un diagnóstico que va de 1 a 10 y se calcula por palabra clave. Tiene tres componentes: la tasa de clics esperada, la relevancia del anuncio y la experiencia en la página de destino, que Google define como el grado de relevancia y utilidad de la página para quien hizo clic en el anuncio. Cada componente se califica como superior al promedio, promedio o inferior al promedio.",
      "## Velocidad en el celular",
      "La mayoría de las visitas que llegan desde un anuncio entran por el celular, y una página lenta pierde consultas. Google propone tres métricas, las Core Web Vitals, medidas en el percentil 75 de las cargas: contenido principal visible en 2,5 segundos o menos (LCP), respuesta a una interacción en 200 milisegundos o menos (INP) y estabilidad visual de 0,1 o menos (CLS).",
      "Qué significa para tu empresa: una landing por servicio rinde más que mandar todos los anuncios a la página de inicio. Empezá por el servicio que más consultas recibe, escribí el título con las palabras que usa tu cliente y dejá un solo botón. Después medí cuántas visitas terminan en consulta y ajustá. En DEVISEBIT diseñamos páginas web y landings a medida, conectadas a WhatsApp y al sistema donde quedan registradas las consultas."
    ],
    "box": [
      "¿Cada anuncio lleva a una página que habla solo de ese servicio?",
      "¿El título repite lo que busca tu cliente?",
      "¿Hay un único botón o varios caminos que compiten?",
      "¿Mostrás una prueba concreta: casos, cifras u opiniones?",
      "¿Sabés cuántas visitas terminan en consulta?"
    ],
    "link": {
      "t": "Diseño de páginas web y landings a medida",
      "u": "/webs"
    },
    "sources": [
      {
        "t": "Ayuda de Google Ads: Acerca del Nivel de calidad de las campañas de Búsqueda",
        "u": "https://support.google.com/google-ads/answer/6167118?hl=es-419"
      },
      {
        "t": "web.dev: Web Vitals, métricas esenciales para un sitio en buen estado",
        "u": "https://web.dev/articles/vitals?hl=es-419"
      }
    ]
  },
  {
    "slug": "ia-argentina-2026-de-asistentes-a-agentes",
    "seoTitle": "IA en Argentina 2026: de asistentes a agentes",
    "seoDesc": "Según un estudio de UdeSA, solo el 11,2% de las empresas argentinas usa IA en su operación. Qué cambia con los agentes y cómo prepararse.",
    "date": "2026-11-09",
    "dateTxt": "9 de noviembre de 2026",
    "kicker": "Inteligencia artificial",
    "title": "Inteligencia artificial en Argentina: el salto de los asistentes a los agentes",
    "desc": "Un estudio de la Universidad de San Andrés estima que la IA podría aportar el 2,1% del PBI en 2030, pero la adopción en las empresas todavía es baja. Qué son los agentes y por qué importan.",
    "body": [
      "A fines de octubre, la Cátedra de Competitividad Jorge H. Forteza de la Universidad de San Andrés (UdeSA) presentó el estudio \"Una estrategia de competitividad en Inteligencia Artificial para la Argentina\", dirigido por Raúl Katz, Luciana Pagani y Natalia Méndez Huergo. Según el trabajo, la IA podría aportar a la economía argentina el equivalente al 2,1% del PBI proyectado para 2030, frente al 0,6% actual. Si se mantiene el ritmo de hoy, llegaría a cerca del 1,5%: la diferencia depende de cuántas organizaciones la incorporen de verdad.",
      "Ahí está el punto débil. De acuerdo con el estudio, el 11,2% de las empresas argentinas usa IA en sus operaciones, contra un promedio de 20,2% en los países de la OCDE, 16,5% en Uruguay y 13,5% en Chile. Entre las grandes la cifra sube al 34,7%, pero en las medianas es del 16% y en las pequeñas, del 8,5%. En el Índice Latinoamericano de Inteligencia Artificial 2026, elaborado por CEPAL y CENIA, la Argentina quedó sexta entre 19 economías.",
      "La misma semana, en las Jornadas Internacionales 2026 organizadas por ATVC y Cappsa, Juan Filips, country manager de AWS para Argentina, Paraguay y Uruguay, describió el panorama desde el lado de los proveedores de nube: \"Un 90% de los clientes con los que hablamos está usando IA en alguna tarea, pero en su mayoría como un asistente\". Según Filips, hoy solo un 25% piensa en agentes, aunque estimó que en dos años tres de cada cuatro empresas los tendrán desplegados. Es una proyección dicha en un panel, no el resultado de una encuesta, pero marca hacia dónde se mueve la industria.",
      "La diferencia entre un asistente y un agente no es menor. Un asistente responde: redacta un mail, resume un documento o contesta una consulta. Un agente, además, ejecuta: busca un dato en el sistema de gestión, agenda un turno, carga un pedido, actualiza una ficha o deriva un caso a la persona indicada, siguiendo reglas que define la organización. Para hacerlo bien necesita algo que muchas empresas todavía no tienen: procesos claros y datos ordenados en sistemas que se puedan consultar.",
      "El estudio de UdeSA señala además dos frenos para la próxima etapa. Por un lado, una posible brecha de talento hacia 2029 si la adopción se acelera. Por otro, advierte que \"los instrumentos de política pública y regulatoria continúan siendo fragmentados\". En otras palabras, buena parte del avance va a depender de lo que haga cada organización por su cuenta.",
      "Qué significa para tu empresa: no hace falta esperar a los agentes para empezar, pero sí prepararse para ellos. El primer paso es elegir un proceso repetitivo y medible, como las consultas por WhatsApp, la gestión de turnos o el seguimiento de pedidos; después, documentar cómo se resuelve hoy, ordenar los datos que usa y definir qué puede hacer la IA sola y qué necesita la aprobación de una persona. En DEVISEBIT desarrollamos sistemas de gestión y asistentes conectados a WhatsApp que trabajan sobre los datos reales de cada organización, con permisos por rol y registro de cada acción. Conocé cómo trabajamos en www.devisebit.com/sistemas."
    ],
    "box": [
      "¿Usás la IA solo para redactar textos o ya resuelve tareas dentro de tus sistemas?",
      "¿Tenés identificado un proceso repetitivo que se pueda medir?",
      "¿Tus datos de clientes, turnos o pedidos están en un sistema o en planillas sueltas?",
      "¿Está definido qué decisiones puede tomar la IA y cuáles requieren aprobación humana?",
      "¿Tu equipo sabe qué información no debe cargar en herramientas de IA?"
    ],
    "sources": [
      {
        "t": "Ámbito: La IA puede sumar u$s17.700 millones a la Argentina hasta 2030, pero necesita acelerar la adopción en empresas (29/10/2026)",
        "u": "https://www.ambito.com/negocios/la-ia-puede-sumar-us17700-millones-la-argentina-2030-pero-necesita-acelerar-la-adopcion-empresas-n6339356"
      },
      {
        "t": "ConverCom: Jornadas 2026, AWS estima que tres de cada cuatro empresas tendrán agentes de inteligencia artificial desplegados en dos años (28/10/2026)",
        "u": "https://convercom.info/comunidades/contenidos/jornadas-2026-aws-estima-que-tres-cada-cuatro-empresas-tendran-agentes-inteligencia-artificial-desplegados-dos-anos/"
      }
    ]
  },
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
