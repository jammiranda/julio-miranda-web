/**
 * Modelos legales base de DEVISEBIT SRL, listos para completar y editar, con el bloque de firma de Julio.
 * Son modelos de partida: antes de firmar algo con plata o responsabilidad en juego, que lo revise el abogado.
 * Los campos entre {{llaves}} se completan en el formulario; lo que quede sin completar se resalta en el documento.
 */
export type Plantilla = { k: string; titulo: string; para: string; cuerpo: string }

export const CAMPOS: { k: string; l: string; ph?: string; def?: string }[] = [
  { k: "cliente", l: "Cliente (razón social o nombre)", ph: "Ej.: Sindicato X" },
  { k: "cuit", l: "CUIT / DNI del cliente" },
  { k: "domicilio", l: "Domicilio del cliente" },
  { k: "representante", l: "Representante que firma (nombre y cargo)" },
  { k: "servicio", l: "Servicio o proyecto (descripción breve)", ph: "Ej.: Sistema de padrón y portal de afiliados" },
  { k: "monto", l: "Precio / valor", ph: "Ej.: $1.200.000 + IVA" },
  { k: "plazo", l: "Plazo o vigencia", ph: "Ej.: 60 días corridos / 12 meses" },
  { k: "fecha", l: "Fecha", ph: "Ej.: 5 de noviembre de 2026" },
  { k: "ciudad", l: "Ciudad de firma", def: "Ciudad Autónoma de Buenos Aires" },
  { k: "firmante", l: "Firma por DEVISEBIT: nombre", def: "Julio A. Miranda" },
  { k: "cargo", l: "Firma por DEVISEBIT: cargo", def: "Gerente" },
  { k: "cuit_devisebit", l: "CUIT de DEVISEBIT SRL", ph: "Completar" },
  { k: "kit", l: "Kit DEVISEBIT contratado", ph: "Ej.: Kit CRM y Automatización" },
  { k: "programa", l: "Programa o línea de financiamiento", ph: "Ej.: Programa Kit 4.0 / línea de promoción de la innovación" },
  { k: "honorarios", l: "Honorarios por la gestión del financiamiento", ph: "Ej.: $300.000 + IVA / % acordado" },
]

const PARTES = `Entre DEVISEBIT SRL, CUIT {{cuit_devisebit}}, con domicilio en Luna 24, 6.º piso, Parque Patricios, Ciudad Autónoma de Buenos Aires, representada por {{firmante}} en su carácter de {{cargo}} (en adelante, “DEVISEBIT”), y {{cliente}}, CUIT/DNI {{cuit}}, con domicilio en {{domicilio}}, representado por {{representante}} (en adelante, “el CLIENTE”), se acuerda lo siguiente:`

export const PLANTILLAS: Plantilla[] = [
  {
    k: "servicios-software", titulo: "Contrato de servicios de software a medida", para: "Sistemas, apps, webs, integraciones. Precio fijo y fecha de entrega.",
    cuerpo: `CONTRATO DE SERVICIOS DE DESARROLLO DE SOFTWARE

${PARTES}

PRIMERA · Objeto. DEVISEBIT desarrollará para el CLIENTE: {{servicio}}, conforme al alcance, las etapas y los entregables de la propuesta aceptada, que forma parte de este contrato.

SEGUNDA · Plazo. La entrega se realizará en {{plazo}} contados desde la recepción de la documentación, los accesos y el pago inicial. Los plazos se suspenden mientras el CLIENTE no entregue lo que le corresponde (contenidos, accesos, validaciones).

TERCERA · Precio y forma de pago. El precio total es de {{monto}}. Se paga el 50% al inicio y el 50% restante contra la entrega, salvo que la propuesta indique otro esquema. Las facturas se emiten conforme a la normativa vigente y los pagos vencen a los 5 días de emitidas.

CUARTA · Entregas y aceptación. DEVISEBIT realizará entregas parciales para su prueba. El CLIENTE tiene 5 días hábiles para observar cada entrega; vencido el plazo sin observaciones, se considera aceptada. Las observaciones fundadas se corrigen sin costo dentro del alcance acordado.

QUINTA · Cambios de alcance. Todo pedido fuera del alcance se cotiza y se aprueba por escrito antes de realizarse.

SEXTA · Obligaciones del CLIENTE. Brindar información, accesos y validaciones en tiempo y forma, designar un responsable y respetar los derechos de terceros sobre los contenidos que entregue.

SÉPTIMA · Propiedad intelectual. Cumplido el pago total, el CLIENTE recibe una licencia de uso perpetua, no exclusiva, sobre el software desarrollado para su operación. DEVISEBIT conserva la titularidad de sus componentes, librerías y herramientas preexistentes o de uso general, y el derecho a reutilizar conocimientos y componentes no confidenciales.

OCTAVA · Garantía y soporte. DEVISEBIT corrige sin costo los errores de funcionamiento respecto de lo acordado durante 30 días desde la aceptación. El soporte posterior y las mejoras se contratan por separado.

NOVENA · Confidencialidad y datos personales. Las partes mantendrán la confidencialidad de la información no pública. Si DEVISEBIT accede a datos personales, los tratará solo para prestar el servicio y conforme a la Ley 25.326.

DÉCIMA · Limitación de responsabilidad. La responsabilidad de DEVISEBIT se limita al monto efectivamente pagado por el servicio, salvo dolo. No responde por lucro cesante ni por servicios de terceros (hosting, pasarelas de pago, APIs).

UNDÉCIMA · Rescisión. Cualquiera de las partes puede rescindir con aviso escrito de 15 días ante incumplimiento no subsanado. El CLIENTE abona lo realizado hasta ese momento.

DUODÉCIMA · Jurisdicción. Para cualquier controversia, las partes se someten a los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}, se firman dos ejemplares de un mismo tenor.`,
  },
  {
    k: "asesoria", titulo: "Contrato de asesoría y consultoría en tecnología e IA", para: "Hora suelta, bolsa de horas, abono mensual, plan anual.",
    cuerpo: `CONTRATO DE ASESORÍA Y CONSULTORÍA EN TECNOLOGÍA E INTELIGENCIA ARTIFICIAL

${PARTES}

PRIMERA · Objeto. DEVISEBIT brindará al CLIENTE asesoría y consultoría en tecnología e inteligencia artificial bajo el formato contratado: {{servicio}}. Cada hora trabajada se registra con fecha, persona y tema en el portal del cliente.

SEGUNDA · Responsable único. DEVISEBIT designa un responsable que coordina la cuenta y a quien el CLIENTE dirige sus consultas.

TERCERA · Valor y pago. El valor es {{monto}}. Las horas sueltas y las bolsas se pagan por adelantado; los abonos, por mes adelantado. Las horas estratégicas descuentan 1,5 horas de una bolsa. La fracción mínima es de 30 minutos.

CUARTA · Vigencia y vencimiento de horas. Vigencia: {{plazo}}. Las bolsas vencen en el plazo informado al contratar. En los abonos, las horas no usadas pasan al mes siguiente una sola vez. Las horas excedentes se cobran al valor de hora extra, con aviso previo.

QUINTA · Alcance. Incluye consultas, revisión de presupuestos y proveedores, estrategia y acompañamiento según el formato. No incluye desarrollo, diseño ni campañas: si surge un proyecto, se cotiza aparte.

SEXTA · Informes. En los abonos, DEVISEBIT entrega un informe mensual con las horas utilizadas, los temas tratados y los próximos pasos.

SÉPTIMA · Recomendaciones. La asesoría es de medios, no de resultados. Las decisiones finales y su implementación corresponden al CLIENTE.

OCTAVA · Confidencialidad y datos. Las partes mantendrán la confidencialidad de la información intercambiada. Los datos personales se tratan conforme a la Ley 25.326.

NOVENA · Baja. Cualquiera de las partes puede terminar el abono con aviso escrito de 30 días, respetando el mínimo de meses del formato elegido. Las horas pagas no usadas de una bolsa vigente se mantienen hasta su vencimiento.

DÉCIMA · Jurisdicción. Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "nda", titulo: "Acuerdo de confidencialidad (NDA)", para: "Antes de compartir datos sensibles, accesos o proyectos.",
    cuerpo: `ACUERDO DE CONFIDENCIALIDAD

${PARTES}

PRIMERA · Información confidencial. Es toda información no pública que una parte entregue a la otra con motivo de {{servicio}}: datos, documentos, accesos, código, estrategias, listados de personas y condiciones comerciales.

SEGUNDA · Obligaciones. La parte receptora usará la información solo para el fin indicado, la protegerá con el mismo cuidado que a la propia y no la revelará a terceros sin autorización escrita, salvo a quienes necesiten conocerla y estén obligados a reserva.

TERCERA · Excepciones. No es confidencial la información que sea o se haga pública sin culpa del receptor, que ya conociera legítimamente, o cuya divulgación exija la ley o una autoridad (con aviso previo cuando sea posible).

CUARTA · Datos personales. Si se comparten datos personales, se tratarán conforme a la Ley 25.326 y solo en la medida necesaria.

QUINTA · Vigencia. Las obligaciones rigen durante {{plazo}} y se mantienen por 2 años después de terminada la relación.

SEXTA · Devolución. A pedido de la parte reveladora, se devuelve o elimina la información, salvo la que deba conservarse por ley.

SÉPTIMA · Jurisdicción. Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "datos", titulo: "Acuerdo de tratamiento de datos personales", para: "Cuando DEVISEBIT accede a datos de afiliados, pacientes o clientes del cliente.",
    cuerpo: `ACUERDO DE TRATAMIENTO DE DATOS PERSONALES

${PARTES}

PRIMERA · Roles. El CLIENTE es responsable de la base de datos y DEVISEBIT actúa como encargado del tratamiento, solo para prestar {{servicio}}.

SEGUNDA · Instrucciones. DEVISEBIT trata los datos únicamente según las instrucciones documentadas del CLIENTE y no los usa para otros fines ni los cede a terceros.

TERCERA · Seguridad. DEVISEBIT aplica medidas técnicas y organizativas razonables: acceso por roles, cifrado en tránsito, copias de resguardo y registro de accesos. Comunica al CLIENTE cualquier incidente de seguridad que lo afecte, sin demora injustificada.

CUARTA · Personal y subencargados. El personal con acceso está obligado a confidencialidad. DEVISEBIT puede usar proveedores de infraestructura (alojamiento, base de datos, correo, mensajería) bajo condiciones equivalentes de protección, y los informa al CLIENTE si lo solicita.

QUINTA · Derechos de las personas. DEVISEBIT asiste al CLIENTE para responder los pedidos de acceso, rectificación y supresión (Ley 25.326).

SEXTA · Datos de salud. Los datos sensibles se tratan con el máximo cuidado, solo por el personal necesario y sin copias fuera de los sistemas acordados.

SÉPTIMA · Devolución o supresión. Al terminar el servicio, DEVISEBIT devuelve o elimina los datos a elección del CLIENTE, salvo obligación legal de conservarlos.

OCTAVA · Vigencia. {{plazo}}. Jurisdicción: Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "licencia", titulo: "Licencia de uso de producto (incluye marca blanca)", para: "Panel de contenido, academia, padrón, CRM: abono como licencia de uso.",
    cuerpo: `LICENCIA DE USO DE SOFTWARE

${PARTES}

PRIMERA · Objeto. DEVISEBIT otorga al CLIENTE una licencia de uso, no exclusiva e intransferible, sobre: {{servicio}}, bajo la modalidad de abono.

SEGUNDA · Alcance. El CLIENTE puede usar el software para su propia operación y la de sus usuarios. No puede copiarlo, revenderlo, sublicenciarlo ni publicarlo como plantilla, salvo que se pacte expresamente una licencia de marca blanca para prestar servicios a sus clientes.

TERCERA · Precio. {{monto}}, con vigencia {{plazo}}. La falta de pago habilita la suspensión del servicio luego de un aviso de 5 días.

CUARTA · Actualizaciones y soporte. Incluye las actualizaciones del producto y el soporte técnico en horario hábil. No incluye desarrollos a medida, que se cotizan por separado.

QUINTA · Disponibilidad. DEVISEBIT procura una disponibilidad razonable del servicio y avisa los mantenimientos programados. No responde por fallas de terceros (hosting, conectividad, pasarelas).

SEXTA · Datos del CLIENTE. Los datos cargados son del CLIENTE. Al finalizar la licencia, DEVISEBIT entrega una copia de sus datos en un formato estándar.

SÉPTIMA · Propiedad intelectual. El software y su código son de DEVISEBIT. La licencia no transfiere la titularidad.

OCTAVA · Jurisdicción. Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "web-abono", titulo: "Términos de servicio de web con IA y abono mensual", para: "Páginas web, hosting, mantenimiento y asistente de WhatsApp con IA.",
    cuerpo: `TÉRMINOS DE SERVICIO · WEB, HOSTING Y MANTENIMIENTO

${PARTES}

PRIMERA · Servicio. DEVISEBIT presta: {{servicio}}, que incluye el alojamiento, el mantenimiento técnico y el soporte, según el plan de abono contratado.

SEGUNDA · Abono. {{monto}} por mes, pagadero por adelantado, vigencia {{plazo}} con renovación automática salvo aviso de 30 días.

TERCERA · Contenidos. El CLIENTE garantiza que los textos, imágenes y marcas que entrega son propios o cuenta con autorización para usarlos.

CUARTA · Inteligencia artificial. Cuando el servicio incluya asistentes o contenidos con IA, el CLIENTE entiende que las respuestas pueden contener errores, que DEVISEBIT configura reglas y derivación a personas, y que el CLIENTE revisa y es responsable del contenido que publica.

QUINTA · Dominio y cuentas. El dominio y las cuentas son del CLIENTE. DEVISEBIT los administra mientras dure el servicio y entrega los accesos al finalizar.

SEXTA · Cambios. Los cambios incluidos en el plan se detallan en la propuesta; los demás se cotizan.

SÉPTIMA · Baja. Con aviso de 30 días. DEVISEBIT entrega los contenidos y los accesos al CLIENTE.

OCTAVA · Jurisdicción. Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "acta-recepcion", titulo: "Acta de recepción conforme", para: "Al entregar un proyecto o etapa; sirve de aceptación.",
    cuerpo: `ACTA DE RECEPCIÓN CONFORME

En {{ciudad}}, a {{fecha}}, {{representante}}, en representación de {{cliente}} (CUIT/DNI {{cuit}}), recibe de DEVISEBIT SRL (CUIT {{cuit_devisebit}}) lo siguiente: {{servicio}}.

El CLIENTE declara haber probado lo entregado y recibirlo de conformidad respecto del alcance acordado, con las siguientes observaciones (si las hubiera): ______________________________.

Desde esta fecha comienza la garantía de corrección de errores prevista en el contrato.`,
  },
  {
    k: "caso-exito", titulo: "Autorización de uso como caso de éxito", para: "Para publicar el proyecto, el logo o un testimonio del cliente.",
    cuerpo: `AUTORIZACIÓN DE USO DE CASO DE ÉXITO

{{cliente}}, CUIT/DNI {{cuit}}, representado por {{representante}}, autoriza a DEVISEBIT SRL a mencionar el proyecto “{{servicio}}”, su nombre, su logo y, en su caso, un testimonio, en su sitio web, redes sociales, material comercial y presentaciones.

La autorización no incluye datos personales ni información confidencial, rige por {{plazo}} y puede revocarse por escrito con aviso de 15 días, sin afectar lo ya publicado en material impreso.

En {{ciudad}}, a {{fecha}}.`,
  },
  {
    k: "kit", titulo: "Contrato de Kit DEVISEBIT (alcance cerrado)", para: "Kit Canal Digital, CRM y Automatización, IA Comercial o Gestión Documental.",
    cuerpo: `CONTRATO DE KIT DEVISEBIT

${PARTES}

PRIMERA · Objeto. DEVISEBIT implementará para el CLIENTE el {{kit}}, con el alcance, los entregables y el presupuesto desglosado de la propuesta aceptada, que forma parte de este contrato.

SEGUNDA · Alcance cerrado. El kit incluye únicamente lo detallado en la propuesta. Todo pedido adicional se cotiza y se aprueba por escrito antes de realizarse.

TERCERA · Plazo. La implementación se realiza en {{plazo}} desde la recepción de los accesos, la información y el pago inicial. Los plazos se suspenden mientras el CLIENTE no entregue lo que le corresponde.

CUARTA · Precio y forma de pago. El precio total es de {{monto}}, según el presupuesto desglosado. Se paga conforme al plan acordado en la propuesta. Si una parte se financia con un programa de cofinanciamiento, el CLIENTE responde por su parte del precio en los plazos acordados, aunque el trámite del beneficio demore.

QUINTA · Implementación y pruebas. Cada integración se prueba con datos reales del CLIENTE antes de la puesta en producción. DEVISEBIT designa un responsable único del proyecto.

SEXTA · Entregables y recepción. Al finalizar se entregan el sistema configurado, la documentación y la capacitación indicadas. Se firma el Acta de Recepción Conforme; vencidos 5 días hábiles sin observaciones, la implementación se considera aceptada.

SÉPTIMA · Licencias y propiedad intelectual. El CLIENTE recibe el derecho de uso de lo implementado para su operación. DEVISEBIT conserva la titularidad de sus productos, componentes y herramientas preexistentes. Los datos del CLIENTE son del CLIENTE.

OCTAVA · Garantía y soporte. DEVISEBIT corrige sin costo los errores respecto de lo acordado durante 30 días desde la recepción. El soporte posterior, las licencias de terceros y el hosting se contratan por separado.

NOVENA · Confidencialidad y datos personales. Las partes mantienen la confidencialidad de la información no pública. DEVISEBIT trata los datos personales solo para prestar el servicio y conforme a la normativa vigente.

DÉCIMA · Financiamiento. DEVISEBIT no otorga financiamiento. La gestión de programas de cofinanciamiento, si se contrata, se rige por el acuerdo de gestión de financiamiento. La aprobación depende del organismo y no está garantizada.

UNDÉCIMA · Limitación de responsabilidad. La responsabilidad de DEVISEBIT se limita al monto efectivamente pagado por el kit, salvo dolo. No responde por servicios de terceros ni por lucro cesante.

DUODÉCIMA · Rescisión y jurisdicción. Cualquiera de las partes puede rescindir con aviso escrito de 15 días ante incumplimiento no subsanado; el CLIENTE abona lo realizado. Para cualquier controversia, las partes se someten a los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}, se firman dos ejemplares de un mismo tenor.`,
  },
  {
    k: "presupuesto-kit", titulo: "Presupuesto desglosado del kit", para: "El formato que piden los programas de cofinanciamiento: software, implementación, servicios, integraciones, capacitación y soporte.",
    cuerpo: `PRESUPUESTO DESGLOSADO

Proveedor: DEVISEBIT SRL, CUIT {{cuit_devisebit}}, Luna 24, 6.º piso, Parque Patricios, Ciudad Autónoma de Buenos Aires.
Cliente: {{cliente}}, CUIT/DNI {{cuit}}, {{domicilio}}.
Fecha: {{fecha}}. Validez: 15 días corridos.

SOLUCIÓN: {{kit}}
Descripción del problema y del uso esperado: {{servicio}}

DETALLE POR RUBRO (completar importes sin IVA)
1. Software y licencias ............................ $ ________
2. Implementación y configuración ................ $ ________
3. Servicios profesionales (relevamiento, diseño) .. $ ________
4. Integraciones ................................... $ ________
5. Capacitación del equipo ........................ $ ________
6. Soporte y garantía (período: {{plazo}}) ......... $ ________

SUBTOTAL sin IVA ................................. $ ________
IVA ............................................... $ ________
TOTAL ............................................. {{monto}}

ENTREGABLES: sistema configurado y en producción, integraciones probadas con datos reales, documentación, capacitación y acta de recepción conforme.

NOTA SOBRE FINANCIAMIENTO: si una parte de este presupuesto se presenta ante {{programa}}, el monto cofinanciable y los topes los determina el programa. DEVISEBIT no otorga financiamiento.

Por DEVISEBIT SRL.`,
  },
  {
    k: "gestion-financiamiento", titulo: "Acuerdo de gestión de financiamiento", para: "Cuando DEVISEBIT ayuda al cliente a identificar y tramitar cofinanciamiento (Kit 4.0, innovación, UVT).",
    cuerpo: `ACUERDO DE GESTIÓN DE FINANCIAMIENTO

${PARTES}

PRIMERA · Objeto. DEVISEBIT asistirá al CLIENTE para identificar, preparar y presentar la solicitud de {{programa}} vinculada a: {{servicio}}. La asistencia incluye el relevamiento de requisitos, la preparación del presupuesto desglosado, la carpeta de documentación y el seguimiento del trámite.

SEGUNDA · Alcance. DEVISEBIT no otorga financiamiento ni garantiza su aprobación. La decisión, los montos, los topes y los plazos dependen del organismo y de que el CLIENTE cumpla los requisitos vigentes.

TERCERA · Obligaciones del CLIENTE. Entregar la información y documentación exacta y actualizada, mantener su situación fiscal y previsional al día y firmar o presentar lo que le corresponda. El CLIENTE es responsable de la veracidad de lo declarado.

CUARTA · Honorarios. El CLIENTE abona {{honorarios}} por la gestión, con independencia de la aprobación del beneficio, salvo pacto escrito en contrario. Si el CLIENTE contrata también un kit, se rige por su contrato.

QUINTA · Plazo. Este acuerdo rige por {{plazo}} desde su firma y se extiende mientras dure el trámite acordado.

SEXTA · Confidencialidad y datos. Las partes mantienen la confidencialidad de la información no pública, y DEVISEBIT trata los datos solo para esta gestión.

SÉPTIMA · Jurisdicción. Para cualquier controversia, las partes se someten a los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.

En {{ciudad}}, a {{fecha}}, se firman dos ejemplares de un mismo tenor.`,
  },
  {
    k: "carpeta-financiamiento", titulo: "Checklist de carpeta de financiamiento", para: "Lista de control de documentación por cliente antes de presentar un cofinanciamiento.",
    cuerpo: `CHECKLIST DE CARPETA DE FINANCIAMIENTO

Cliente: {{cliente}} · CUIT {{cuit}}
Programa / línea: {{programa}} · Kit: {{kit}}
Fecha: {{fecha}}

[ ] CUIT activo y clave fiscal con nivel de seguridad suficiente
[ ] Adhesión a Trámites a Distancia (TAD) y, si es sociedad, delegación de servicios en ARCA
[ ] Certificado MiPyME vigente
[ ] Constancias de actividad (inscripciones, facturas, balances) por el período que exija el programa
[ ] Libre de deuda fiscal y previsional exigible
[ ] Presupuesto desglosado del proveedor (software, implementación, servicios, integraciones, capacitación, soporte)
[ ] Descripción del problema, del uso esperado y del alcance
[ ] Si hay IA o analítica: descripción de los datos disponibles y cómo se usan hoy
[ ] Solicitud presentada en el sistema del programa, con el presupuesto adjunto
[ ] Comprobante de presentación y número de trámite
[ ] Reserva de cupo / aprobación recibida
[ ] Acta de inicio firmada con el proveedor
[ ] Implementación realizada y Acta de Recepción Conforme firmada
[ ] Rendición o documentación final presentada

Responsable en DEVISEBIT: {{firmante}}.`,
  },
]

export const plantilla = (k: string) => PLANTILLAS.find((p) => p.k === k)
