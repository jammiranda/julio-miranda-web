/** Qué puede tocar la Oficina y qué no. Es la regla de oro: se muestra en el organigrama y se le pasa al jefe de oficina. */
export const POLITICA = {
  libre: {
    titulo: "Lo hacen solos (sin pedir permiso)",
    items: [
      "Leer y revisar: mails, planillas, métricas, redes, licitaciones, webs y sistemas.",
      "Reportar su estado en la Oficina y avisar cuando algo falla o necesita a una persona.",
      "Preparar borradores, listas, resúmenes, informes y propuestas (sin enviarlos).",
      "Proponer repartos de tareas entre agentes y personas.",
    ],
  },
  ok: {
    titulo: "Necesitan el OK final de Julio",
    items: [
      "Publicar o programar algo en redes, blog o sitios públicos.",
      "Enviar mails, mensajes de WhatsApp o invitaciones a personas de afuera.",
      "Presentar propuestas, ofertas o licitaciones, y cualquier monto o condición comercial.",
      "Cualquier cambio en el panel, el portal, los sistemas o el código que vaya a producción.",
      "Todo lo de Administración y finanzas (pagos, cobros, planillas, vencimientos): lo maneja solo Julio.",
      "Alta o baja de agentes, personas, áreas o permisos.",
      "Gastos o cuentas nuevas (claves de servicios, suscripciones, números de teléfono).",
    ],
  },
  nunca: {
    titulo: "Nunca, ni con pedido (límites fijos)",
    items: [
      "Mover plata, firmar o aceptar contratos en nombre de Julio.",
      "Entrar a LinkedIn con navegador automático ni mandar invitaciones o mensajes de LinkedIn.",
      "Borrar información de otros sistemas o de las personas del equipo.",
      "Poner claves, datos de salud o finanzas familiares en documentos compartidos.",
      "Publicar precios en piezas públicas o nombrar UTHGRA, OSDEPYM, MC SALUD o Grupo San Gabriel.",
      "Tocar San Patricio SRL (congelada) más allá de nombrarla como proyecto de DEVISEBIT.",
    ],
  },
} as const

export const politicaTexto = () =>
  Object.values(POLITICA).map((g) => `${g.titulo.toUpperCase()}:\n${g.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n")
