import type { Galaxia } from "@/lib/mapa-datos"

/**
 * English data for the 3D project map. Same ids, positions and colors as lib/mapa-datos.ts;
 * only the text is translated. No facts are added.
 */
export const GALAXIAS_EN: Galaxia[] = [
  {
    id: "gobierno",
    nombre: "Government and public sector",
    lema: "From city hall to the national level",
    color: "#FF6A63",
    pos: [-14, 3, -4],
    nodos: [
      { id: "tigre", t: "Municipality of Tigre · Soy Tigre app", d: "Development and support of the municipal app: registration of participating shops and enrollment for the Soy Tigre and Soy Tigre Joven (youth) cards.", cliente: "Municipality of Tigre", tags: ["React Native", "Firebase", "Cybersecurity"], destacado: true },
      { id: "ba-emprende", t: "City of Buenos Aires · BA Emprende Academy", d: "Online learning for entrepreneurs, with WordPress and Moodle joined by single sign-on and connected to a CRM.", cliente: "Government of the City of Buenos Aires", tags: ["WordPress", "Moodle", "SSO", "CRM"], destacado: true },
      { id: "cmd", t: "City of Buenos Aires · Design Center and Tech Lab", d: "Operational and technology management of the city's Metropolitan Design Center (14,000 sq m, about 150,000 sq ft) and its technology lab.", cliente: "Government of the City of Buenos Aires", destacado: true },
      { id: "ambiente", t: "National Ministry of Environment", d: "Federal Environmental Monitoring Network and waste traceability systems, with nationwide technology coordination.", cliente: "National Ministry of Environment (Argentina)", hecho: "Rolled out in every province", destacado: true },
      { id: "catamarca-exporta", t: "Catamarca Exporta", d: "Export portal and tools for small and mid-sized businesses in the province.", cliente: "Provincial government" },
      { id: "expo-productiva", t: "Provincial trade fair portal", d: "Industry sectors, exhibitors and the agenda of the fairgrounds.", cliente: "Provincial government" },
      { id: "agencia-desarrollo", t: "Brand identity for a development agency", d: "Brand and communication pieces for an economic development agency.", cliente: "Provincial government" },
    ],
  },
  {
    id: "educacion",
    nombre: "Education and universities",
    lema: "Academies, classrooms and ballots",
    color: "#6AA8FF",
    pos: [-3, 9, -14],
    nodos: [
      { id: "uba-modernizacion", t: "UBA · Modernization and Digital Transformation", d: "Project tracking, Power BI dashboards, electronic case files and documentation for the university's digital transformation office. UBA is the University of Buenos Aires.", cliente: "University of Buenos Aires", tags: ["Power BI", "UX/UI", "Scrum"], destacado: true },
      { id: "uba-votacion", t: "UBA · electronic voting for the University Council", d: "Voting system deployed for the sessions of the university's governing council.", cliente: "University of Buenos Aires", destacado: true },
      { id: "sodetec", t: "SODETEC Foundation · online academy", d: "Course platform with certificates and a community for the foundation.", cliente: "SODETEC Foundation" },
      { id: "expo-posgrados", t: "Graduate programs expo for a national university", d: "Brand identity, website and an interactive expo with talks and scholarships, plus a registration and check-in platform with a data warehouse and Power BI.", cliente: "National university" },
      { id: "academias", t: "Online academies", d: "Courses, certificates and community on dedicated campuses.", hecho: "1,000+ students enrolled in one year" },
    ],
  },
  {
    id: "salud",
    nombre: "Healthcare",
    lema: "Management and technology in production",
    color: "#2BD576",
    pos: [10, 6, -10],
    nodos: [
      { id: "crm-salud", t: "Healthcare CRM with medical records", d: "Patients, appointments, services and billing, running in production.", destacado: true },
      { id: "tablero-internacion", t: "Home-care dashboard", d: "A monthly spreadsheet in Drive becomes live indicators and alerts.", destacado: true },
      { id: "whatsapp-salud", t: "WhatsApp AI assistants", d: "24/7 support, handoff to human staff and logging in the CRM.", tags: ["AI", "WhatsApp"] },
      { id: "webs-centros", t: "Websites for medical centers", d: "Online booking, specialties and accepted health plans." },
      { id: "siben", t: "SIBEN · event ticketing", d: "Ticket sales, accreditation and access control for the events of the Ibero-American Society of Neonatology.", cliente: "SIBEN" },
    ],
  },
  {
    id: "gremios",
    nombre: "Unions and communities",
    lema: "Members, benefits and courses",
    color: "#FFC857",
    pos: [15, -2, 2],
    nodos: [
      { id: "usl", t: "USL Community · Academy", d: "Academy, member registry, benefits and health plan administration on a single platform, with a member app and digital marketing.", cliente: "Union community and health plan · San Luis, Argentina", hecho: "1,000+ students enrolled in the academy in one year", tags: ["Web platform", "Mobile app", "Dashboards"], destacado: true },
      { id: "obra-social", t: "Union health plan · digital management", d: "Web administration system for the member registry, contributions and benefits, plus social media marketing.", cliente: "Union health plan · San Luis, Argentina" },
      { id: "gremio-nacional", t: "National union for tourism, hotel and restaurant workers", d: "Seven years of work (2014–2021): official websites, a culture department with a newsletter, a magazine and national contests.", cliente: "National union" },
      { id: "iplido", t: "IPLIDO and the national Cup", d: "Website, mobile app and newsletter for the institute, plus the website and app of a national soccer tournament with teams from across the country.", cliente: "IPLIDO" },
    ],
  },
  {
    id: "plataformas",
    nombre: "Platforms, data and AI",
    lema: "Custom software",
    color: "#B58CFF",
    pos: [2, -8, 8],
    nodos: [
      { id: "panel-admin", t: "Custom admin panel", d: "Users, permissions, settings and reports for internal teams." },
      { id: "molinetes", t: "Turnstile access control", d: "Hardware and software integration for a top-division soccer club." },
      { id: "trade-marketing", t: "Trade Marketing and Nacelle apps", d: "A mobile trade marketing app with its web admin panel.", tags: ["PostgreSQL", ".NET Core", "Vue.js", "React Native"] },
      { id: "tsgroup", t: "End-to-end management for TSGROUP", d: "Support, tracking and documentation for the projects that make up its commitments to third parties.", tags: ["Power BI", "Scrum"] },
      { id: "scraping", t: "Web data extraction and chatbots", d: "Platforms that automatically collect and structure data available on the web and turn it into useful information.", tags: ["Python", "Web scraping"], destacado: true },
      { id: "gestion-proyectos", t: "Project Management and Tracking System", d: "A process analysis tool to improve end-to-end project management.", tags: ["Python", "JavaScript", "PHP"] },
    ],
  },
  {
    id: "medios",
    nombre: "Media, brands and commerce",
    lema: "From the first digital newspapers",
    color: "#4FD8E8",
    pos: [-10, -7, 6],
    nodos: [
      { id: "san-luis-diario", t: "San Luis Diario and 105.7 FM", d: "News and radio automation with artificial intelligence.", destacado: true },
      { id: "portales", t: "29 news portals and radio stations", d: "Newspapers, digital magazines and online FM radio in northwestern Argentina, starting with the first digital newspapers in the province of Catamarca.", hecho: "29 portals" },
      { id: "agenda-cultural", t: "Culture and sports guide", d: "Portal with music, theater, sports and dining events." },
      { id: "tienda", t: "Online musical instrument store", d: "Catalog, promotions and shopping cart." },
      { id: "bodega", t: "Online winery", d: "Store for wines and spirits." },
      { id: "club", t: "Soccer club website", d: "News, radio and a fan community." },
      { id: "turismo", t: "Inbound international tourism", d: "Travel website with packages and inquiries." },
    ],
  },
]

export const TOTAL_NODOS_EN = GALAXIAS_EN.reduce((n, g) => n + g.nodos.length, 0)
