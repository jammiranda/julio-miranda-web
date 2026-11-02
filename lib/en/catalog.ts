/** English catalog for /en/services and /en/products. Mirrors lib/marca.ts (SOLUCIONES) without Spanish-only routes or ARS prices. */

export const PRODUCT_NAME: Record<string, string> = {
  clinicas: "Clinic management system",
  whatsapp: "WhatsApp AI assistant",
  crm: "Member & provider CRM",
  tableros: "Business dashboards",
  app: "Member app & digital ID",
  academias: "Online academies",
  votacion: "E-voting & access control",
  documental: "Document management with e-signature",
}

export const PACKAGES = [
  { id: "webs", tag: "Websites", title: "Your custom website, live in days", text: "Unique design built with AI, your own domain and WhatsApp connected.", href: "/en/contact", cta: "Ask for a quote", img: "/images/landings/og-webs.jpg", productos: [] as string[] },
  { id: "whatsapp", tag: "WhatsApp AI", title: "An assistant that answers 24/7", text: "Replies, sells and books appointments on WhatsApp without adding staff.", href: "/en/products#whatsapp", cta: "See the product", img: "/images/landings/og-whatsapp.jpg", productos: ["whatsapp"] },
  { id: "redes", tag: "Social media & ads", title: "Your social media and ads, handled", text: "Reels, graphics, stories and campaigns on Meta and Google.", href: "/en/contact", cta: "Ask for a quote", img: "/images/landings/og-redes.jpg", productos: [] as string[] },
  { id: "sistemas", tag: "Business systems", title: "CRM, scheduling and dashboards", text: "We start from proven modules: lower cost and a shorter timeline.", href: "/en/products", cta: "See the products", img: "/images/landings/og-sistemas.jpg", productos: ["clinicas", "crm", "tableros", "documental"] },
  { id: "asesoria", tag: "Tech & AI advisory", title: "A technology team, by the hour or by the month", text: "Single hours, hour banks or a monthly retainer, with one accountable lead and everything logged in your client portal.", href: "/en/advisory", cta: "See the advisory", img: "/images/landings/og-asesoria.jpg", productos: [] as string[] },
  { id: "comunidad", tag: "Member communities", title: "Your own academy and member registry", text: "For unions, associations, professional colleges and chambers of commerce.", href: "/en/products#academias", cta: "See the products", img: "/images/landings/og-comunidad.jpg", productos: ["academias", "app", "votacion"] },
]

export const SERVICES = [
  {
    id: "desarrollo-a-medida",
    ver: [{ href: "/en/products", t: "Products" }], productos: ["clinicas", "crm", "documental"],
    title: "Custom software development",
    text: "Software, apps and websites designed around your real processes, with fixed scope, date and price.",
    items: ["Web-based management systems", "iOS and Android apps", "Websites connected to your systems", "Integrations with the tools you already use"],
    caso: "Soy Tigre app for the Municipality of Tigre, Buenos Aires province (80,000+ subscribed residents)",
  },
  {
    id: "ia",
    ver: [{ href: "/en/products#whatsapp", t: "WhatsApp AI assistant" }], productos: ["whatsapp"],
    title: "Applied artificial intelligence",
    text: "WhatsApp assistants, inquiry triage and automatic summaries that save hours every week.",
    items: ["WhatsApp assistants, 24/7", "Inquiry triage and routing", "Automated web data extraction", "Automatic summaries and reports"],
    caso: "Web data extraction and chatbots for government agencies and companies",
  },
  {
    id: "tableros",
    ver: [{ href: "/en/products#tableros", t: "Dashboards" }], productos: ["tableros"],
    title: "Dashboards & business intelligence",
    text: "Up-to-date indicators, alerts and automatic reports so you can decide with data.",
    items: ["Power BI or web dashboards", "Alerts on consumption, costs and sales", "Automatic monthly reports", "Excel data turned into indicators"],
    caso: "Project tracking for the University of Buenos Aires' Undersecretariat for Modernization",
  },
  {
    id: "gestion-it",
    ver: [] as { href: string; t: string }[], productos: [] as string[],
    title: "IT project management",
    text: "Project leadership with agile methods and a single accountable owner from start to finish.",
    items: ["Discovery and documentation", "Planning in short deliveries", "Vendor coordination", "Tracking with indicators"],
    caso: "Argentina's Federal Environmental Monitoring Network",
  },
  {
    id: "transformacion",
    ver: [{ href: "/en/digital-transformation", t: "See the consulting" }, { href: "/en/advisory", t: "Advisory by the hour or monthly" }], productos: ["academias"],
    title: "Digital transformation consulting",
    text: "Digital maturity assessment, roadmap, pilots and certified training to organize your company step by step.",
    items: ["Digital maturity assessment", "Roadmap with indicators", "In-company workshops", "Certified training"],
    caso: "BA Emprende academy for the Buenos Aires City Government",
  },
  {
    id: "soporte",
    ver: [] as { href: string; t: string }[], productos: [] as string[],
    title: "Support & cybersecurity",
    text: "Infrastructure monitoring, backups and security best practices.",
    items: ["Server monitoring and alerts", "Backups", "Help desk", "Best practices and secure access"],
    caso: "Monitoring systems deployed across multiple sites",
  },
]

export const SERVICE_STEPS = [
  { n: "01", t: "Discovery", d: "We understand the problem before we write a single line of code." },
  { n: "02", t: "Fixed-price proposal", d: "Scope, delivery date and fixed price, in writing." },
  { n: "03", t: "Short deliveries", d: "Every two weeks you see progress and test it with your team." },
  { n: "04", t: "Support and improvement", d: "We stay with the operation and keep adding improvements." },
]

export const PRODUCTS = [
  { id: "clinicas", title: PRODUCT_NAME.clinicas, text: "Appointments, medical records, prescriptions and a management dashboard.", items: ["Online scheduling", "Electronic medical records", "Services and billing", "Management dashboard"] },
  { id: "whatsapp", title: PRODUCT_NAME.whatsapp, text: "24/7 customer service with handoff to your team.", items: ["Answers at any hour", "Books and confirms appointments", "Hands off to your team", "Logs everything in the CRM"] },
  { id: "crm", title: PRODUCT_NAME.crm, text: "One registry, authorizations and full traceability.", items: ["Member registry and family groups", "Contributions and collections", "Orders and authorizations", "Providers and benefits"] },
  { id: "tableros", title: PRODUCT_NAME.tableros, text: "Up-to-date indicators with alerts.", items: ["Real-time indicators", "Automatic alerts", "Monthly reports", "Built from your Excel files or systems"] },
  { id: "app", title: PRODUCT_NAME.app, text: "Your organization on every member's phone.", items: ["Digital ID card", "Benefits and news", "Push notifications", "iOS and Android"] },
  { id: "academias", title: PRODUCT_NAME.academias, text: "Courses, payments and certificates.", items: ["Courses and live classes", "Enrollment and payments", "Attendance and certificates", "Under your brand"] },
  { id: "votacion", title: PRODUCT_NAME.votacion, text: "Paperless elections and QR-code access.", items: ["Electronic voting", "Voter registry", "QR access and turnstiles", "Instant results"] },
  { id: "documental", title: PRODUCT_NAME.documental, text: "Documents organized and signed online.", items: ["Digital case files", "Digital signature", "Search and permissions", "Change history"] },
]

export const PRODUCT_STEPS = [
  { n: "01", t: "We configure it", d: "We load your FAQs, business hours, services and handoff rules." },
  { n: "02", t: "We connect it", d: "Official WhatsApp Business, your appointment calendar and your CRM." },
  { n: "03", t: "We test it", d: "Your team tries it with real cases before it opens to the public." },
  { n: "04", t: "We measure it", d: "A dashboard with inquiries handled, appointments booked and handoffs." },
]
