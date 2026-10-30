"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { type Locale, defaultLocale } from "./config"

const dictionaries = {
  es: {
    "hero.title": "EL FUTURO ES HOY",
    "hero.subtitle": "Una nueva era de servicios tecnológicos",
    "hero.description":
      "Transformamos ideas en soluciones digitales innovadoras que impulsan el crecimiento de tu negocio.",
    "hero.cta.services": "Conocer Servicios",
    "hero.cta.contact": "Contactar Ahora",
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.products": "Productos",
    "nav.about": "Nosotros",
    "nav.contact": "Contacto",
    "nav.cases": "Casos de Éxito",
    "nav.careers": "Trabaja con Nosotros",
    "nav.about.who": "Quiénes Somos",
    "services.title": "NUESTROS SERVICIOS",
    "services.description":
      "Diseñados para satisfacer tus necesidades, nuestros servicios abarcan desde el Desarrollo Tecnológico hasta la Gestión Integral de proyectos IT, así como la Analítica de Datos, Inteligencia del Negocio e IA aplicada",
    "services.digital.title": "Soluciones Digitales",
    "services.digital.description":
      "Software hecho a medida e infraestructuras tecnológicas escalables. Te acompañamos en cada paso para alcanzar tus objetivos digitales.",
    "services.management.title": "Gestión Integral de Proyectos IT",
    "services.management.description":
      "Metodologías ágiles y equipo experto para maximizar resultados. Garantizamos soluciones innovadoras en cada fase del proyecto.",
    "services.intelligence.title": "Inteligencia del Negocio",
    "services.intelligence.description":
      "Transformamos datos en decisiones estratégicas. Incluye chatbots, analítica avanzada y servicios de atención optimizados.",
    "products.title": "Productos",
    "products.webData.title": "Web Data Extraction",
    "products.webData.description": "Extracción automática de datos web estructurados y listos para usar.",
    "products.chatbots.title": "Chatbots",
    "products.chatbots.description":
      "Interfaces conversacionales inteligentes para mejorar la experiencia del cliente.",
    "products.transformation.title": "Transformación Digital",
    "products.transformation.description":
      "Revoluciona tu modelo de negocio con tecnología 4.0 y diagnóstico de madurez digital.",
    "products.mobile": "Apps Móviles",
    "products.mobile.description": "Aplicaciones nativas e híbridas con experiencias excepcionales.",
    "products.ecommerce": "E-Commerce",
    "products.ecommerce.description": "Tiendas online completas con pagos integrados y gestión avanzada.",
    "products.database": "Bases de Datos",
    "products.database.description": "Diseño y optimización de bases de datos escalables y seguras.",
    "products.security": "Ciberseguridad",
    "products.security.description": "Protección integral con las mejores prácticas de seguridad.",
    "products.automation": "Automatización",
    "products.automation.description": "Procesos automatizados para mejorar eficiencia y reducir costos.",
    "contact.title": "Contáctanos",
    "contact.description": "¿Tienes un proyecto en mente? Hablemos sobre cómo podemos ayudarte",
    "contact.info": "Información de Contacto",
    "contact.email": "Email",
    "contact.address": "Dirección",
    "contact.website": "Sitio Web",
    "contact.social": "Redes Sociales",
    "contact.form.title": "Envíanos un Mensaje",
    "contact.form.name": "Tu nombre",
    "contact.form.email": "Tu email",
    "contact.form.message": "Tu mensaje",
    "contact.form.captcha": "Verificación: ¿Cuánto es",
    "contact.form.captcha.answer": "Respuesta",
    "contact.form.captcha.verify": "Verificar",
    "contact.form.captcha.error": "Por favor verifica el captcha antes de enviar",
    "contact.form.send": "Enviar Mensaje",
    "contact.form.sending": "Enviando...",
    "contact.form.success": "¡Mensaje enviado exitosamente! Te responderemos pronto.",
    "contact.form.error": "Error al enviar el mensaje. Por favor intenta nuevamente.",
    "footer.company": "Devisebit SRL",
    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "hero.title": "THE FUTURE IS NOW",
    "hero.subtitle": "A new era of technological services",
    "hero.description": "We transform ideas into innovative digital solutions that drive your business growth.",
    "hero.cta.services": "Learn Services",
    "hero.cta.contact": "Contact Now",
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.products": "Products",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.cases": "Success Cases",
    "nav.careers": "Work with Us",
    "nav.about.who": "Who We Are",
    "services.title": "OUR SERVICES",
    "services.description":
      "Designed to meet your needs, our services range from Technological Development to Comprehensive IT Project Management, as well as Data Analytics, Business Intelligence and applied AI",
    "services.digital.title": "Digital Solutions",
    "services.digital.description":
      "Custom software and scalable technological infrastructures. We accompany you every step of the way to achieve your digital goals.",
    "services.management.title": "Comprehensive IT Project Management",
    "services.management.description":
      "Agile methodologies and expert team to maximize results. We guarantee innovative solutions in every phase of the project.",
    "services.intelligence.title": "Business Intelligence",
    "services.intelligence.description":
      "We transform data into strategic decisions. Includes chatbots, advanced analytics and optimized customer service.",
    "products.title": "Products",
    "products.webData.title": "Web Data Extraction",
    "products.webData.description": "Automatic extraction of structured web data ready to use.",
    "products.chatbots.title": "Chatbots",
    "products.chatbots.description": "Intelligent conversational interfaces to improve customer experience.",
    "products.transformation.title": "Digital Transformation",
    "products.transformation.description":
      "Revolutionize your business model with 4.0 technology and digital maturity diagnosis.",
    "products.mobile": "Mobile Apps",
    "products.mobile.description": "Native and hybrid applications with exceptional experiences.",
    "products.ecommerce": "E-Commerce",
    "products.ecommerce.description": "Complete online stores with integrated payments and advanced management.",
    "products.database": "Databases",
    "products.database.description": "Design and optimization of scalable and secure databases.",
    "products.security": "Cybersecurity",
    "products.security.description": "Comprehensive protection with security best practices.",
    "products.automation": "Automation",
    "products.automation.description": "Automated processes to improve efficiency and reduce costs.",
    "contact.title": "Contact Us",
    "contact.description": "Do you have a project in mind? Let's talk about how we can help you",
    "contact.info": "Contact Information",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.website": "Website",
    "contact.social": "Social Media",
    "contact.form.title": "Send Us a Message",
    "contact.form.name": "Your name",
    "contact.form.email": "Your email",
    "contact.form.message": "Your message",
    "contact.form.captcha": "Verification: What is",
    "contact.form.captcha.answer": "Answer",
    "contact.form.captcha.verify": "Verify",
    "contact.form.captcha.error": "Please verify the captcha before sending",
    "contact.form.send": "Send Message",
    "contact.form.sending": "Sending...",
    "contact.form.success": "Message sent successfully! We will respond soon.",
    "contact.form.error": "Error sending message. Please try again.",
    "footer.company": "Devisebit SRL",
    "footer.rights": "All rights reserved.",
  },
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale)
    }
  }

  const t = (key: string): string => {
    const dict = dictionaries[locale] || dictionaries[defaultLocale]
    return (dict as Record<string, string>)[key] || key
  }

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
