/** Piezas de redes listas para usar a mano (feed 1080x1350 e historias 1080x1920). Imágenes en /public/marca/piezas. */
export type Pieza = {
  id: string
  titulo: string
  formato: "feed" | "historia"
  donde: string
  texto: string
  en: string
  link: string
}

const TAGS = "#DEVISEBIT #software #inteligenciaartificial #transformaciondigital #pymes"

export const PIEZAS: Pieza[] = [
  { id: "01-numeros", titulo: "Los números", formato: "feed", donde: "Instagram, Facebook, LinkedIn",
    texto: `Software que funciona, no que se promete.\n\n+150 proyectos en producción.\n17 años integrando sistemas.\n12 rubros con soluciones propias.\n1 responsable por proyecto.\n\nContanos qué necesitás y te decimos cómo lo resolvemos.\n👉 devisebit.com\n\n${TAGS}`,
    en: `Software that works, not software that is promised.\n\n150+ projects in production. 17 years integrating systems. One accountable lead per project.\n\ndevisebit.com/en\n\n#DEVISEBIT #software #AI #digitaltransformation`, link: "https://www.devisebit.com" },
  { id: "02-integrar", titulo: "Cualquiera arma piezas sueltas", formato: "feed", donde: "Instagram, Facebook, LinkedIn",
    texto: `Hoy con IA cualquiera arma un bot, una web o una automatización en una tarde.\n\nLo difícil es que todo funcione junto.\n\nDatos duplicados, sistemas que no se hablan y nadie que responda cuando algo falla: eso es lo que resolvemos. Integrar es lo que decide si un proyecto funciona.\n\n👉 devisebit.com\n\n${TAGS} #integracion`,
    en: `Anyone can build a bot, a site or an automation in an afternoon with AI.\n\nThe hard part is making everything work together. That is what we do.\n\ndevisebit.com/en\n\n#DEVISEBIT #integration #AI`, link: "https://www.devisebit.com" },
  { id: "03-mapa", titulo: "Todo conectado (infografía)", formato: "feed", donde: "Instagram, LinkedIn",
    texto: `WhatsApp, web, CRM, pagos, facturación, tableros, IA y tus sistemas actuales: conectados de punta a punta, probados con datos reales y con un responsable único.\n\n¿Querés ver cómo quedaría tu operación integrada? Pedí tu mapa de integración.\n👉 devisebit.com/diagnostico\n\n${TAGS} #integracion`,
    en: `WhatsApp, web, CRM, payments, billing, dashboards, AI and your existing systems: connected end to end, tested with real data, with one accountable lead.\n\n#DEVISEBIT #integration`, link: "https://www.devisebit.com/diagnostico" },
  { id: "04-comparativa", titulo: "Piezas sueltas vs. integrado", formato: "feed", donde: "Instagram, LinkedIn",
    texto: `Piezas sueltas vs. integrado:\n\n✕ Cada herramienta guarda sus propios datos\n✓ Un dato único entre todos los sistemas\n\n✕ Si falla, cada proveedor señala al otro\n✓ Un responsable que responde\n\n✕ El error aparece cuando el cliente se queja\n✓ Alertas: se detecta antes\n\n✕ Funciona en la demo\n✓ Probado con tus datos reales\n\n👉 devisebit.com\n\n${TAGS}`,
    en: `Loose pieces vs. integrated: one source of data, one accountable lead, alerts before customers notice, tested with real data.\n\ndevisebit.com/en\n\n#DEVISEBIT #integration`, link: "https://www.devisebit.com" },
  { id: "05-reunion", titulo: "Primera reunión sin cargo", formato: "feed", donde: "Instagram, Facebook, WhatsApp",
    texto: `Primera reunión sin cargo.\n\n1. Hacés el autodiagnóstico gratis.\n2. Llegás a la reunión con tu situación clara.\n3. Te decimos por dónde empezar.\n\n👉 devisebit.com/diagnostico\n\n${TAGS}`,
    en: `First meeting free of charge. Take the free self-assessment, come with your situation clear, and we tell you where to start.\n\ndevisebit.com/en/contact\n\n#DEVISEBIT`, link: "https://www.devisebit.com/diagnostico" },
  { id: "06-kits", titulo: "Los 4 Kits DEVISEBIT", formato: "feed", donde: "Instagram, Facebook, LinkedIn",
    texto: `4 kits con alcance cerrado, hechos sobre productos que ya funcionan en producción:\n\n01 · Canal Digital: web + WhatsApp + pagos\n02 · CRM y Automatización: seguimiento sin perder a nadie\n03 · IA Comercial: atención 24 h con derivación a personas\n04 · Gestión Documental: firma digital y trazabilidad\n\nSabés qué incluye, qué recibís y quién responde antes de empezar.\n👉 devisebit.com/kit-digital\n\n${TAGS} #kit`,
    en: `Four fixed-scope kits built on products already running in production: Digital Channel, CRM & Automation, Commercial AI, Document Management.\n\ndevisebit.com/en/digital-kit\n\n#DEVISEBIT #AI #SME`, link: "https://www.devisebit.com/kit-digital" },
  { id: "07-financiamiento", titulo: "Te ayudamos a conseguir financiamiento", formato: "feed", donde: "Instagram, LinkedIn",
    texto: `No financiamos nosotros. Te ayudamos a conseguirlo.\n\n✓ Relevamos qué programa te corresponde\n✓ Armamos el presupuesto desglosado y la carpeta\n✓ Trabajamos con especialistas en vinculación tecnológica\n\nEl financiamiento depende de cada programa y de los requisitos vigentes: lo confirmamos caso por caso, antes de que contrates.\n👉 devisebit.com/kit-digital\n\n${TAGS} #financiamiento`,
    en: `We do not lend. We help you get funded: we map the program that applies, build the itemized quote and the file, and work with technology liaison specialists.\n\ndevisebit.com/en/digital-kit\n\n#DEVISEBIT #funding`, link: "https://www.devisebit.com/kit-digital" },
  { id: "08-madurez", titulo: "¿En qué nivel está tu organización?", formato: "feed", donde: "Instagram, Facebook, LinkedIn",
    texto: `¿En qué nivel de madurez digital está tu organización?\n\n1 · Inicial\n2 · En orden\n3 · Integrado\n4 · Optimizado\n\nMedilo gratis en 5 minutos y llevate el resultado con los próximos pasos.\n👉 devisebit.com/diagnostico\n\n${TAGS}`,
    en: `Which digital maturity level is your organization at? Initial, organized, integrated or optimized. Find out in 5 minutes.\n\ndevisebit.com/en/contact\n\n#DEVISEBIT #digitaltransformation`, link: "https://www.devisebit.com/diagnostico" },
  { id: "09-historia-diagnostico", titulo: "Historia: autodiagnóstico", formato: "historia", donde: "Historias de Instagram y Facebook (sumá el sticker de link)",
    texto: `¿Qué nivel digital tiene tu empresa? 5 minutos, sin cargo, con resultado y próximos pasos.\n\nLink del sticker: devisebit.com/diagnostico`,
    en: `What digital level is your company at? 5 minutes, free, with results and next steps.`, link: "https://www.devisebit.com/diagnostico" },
  { id: "10-historia-integracion", titulo: "Historia: integración", formato: "historia", donde: "Historias de Instagram y Facebook (sumá el sticker de link)",
    texto: `Todo lo que armás, conectado. Pedí tu mapa de integración.\n\nLink del sticker: devisebit.com/diagnostico`,
    en: `Everything you build, connected.`, link: "https://www.devisebit.com/diagnostico" },
]
