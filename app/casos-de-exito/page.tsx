"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Target, Award, TrendingUp, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import TrabajosClient from "../trabajos/TrabajosClient"
import { REDES_GESTIONADAS } from "@/lib/marca"
import YoutubeUltimos from "@/components/youtube-ultimos"
import { Instagram, Globe } from "lucide-react"

export default function CasosDeExitoPage() {
  const [selectedSector, setSelectedSector] = useState("gobierno")
  const [currentIndex, setCurrentIndex] = useState(0)

  const sectors = [
    { id: "gobierno", name: "Gobierno y Administración", icon: "🏛️" },
    { id: "empresas", name: "Empresas Privadas", icon: "🏢" },
    { id: "innovacion", name: "Educación e Innovación", icon: "🎓" },
    { id: "analitica", name: "Analítica de Datos", icon: "📊" },
    { id: "gremios", name: "Gremios y Salud", icon: "🤝" },
  ]

  const successCases = [
    {
      id: 1,
      sector: "gobierno",
      category: "Gestión de Proyectos IT y Analítica de Datos",
      title:
        "Seguimiento y soporte de la gestión de la Subsecretaría de Modernización y Transformación Digital de la UBA",
      client: "Universidad de Buenos Aires (Argentina)",
      industry: "Educación Superior",
      challenge:
        "Soporte, seguimiento y documentación de los proyectos que desde el cliente se indican como relevantes.",
      service:
        "Análisis de datos, Microsoft Power BI. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
      achievements: "Actualización Tecnológica, Agilidad. Organización. Información oportuna y actualizada.",
      image: "/images/case-uba-new.png",
      technologies: ["Microsoft Power BI", "UX/UI", "Scrum Agile", "Análisis de Datos"],
    },
    {
      id: 2,
      sector: "innovacion",
      category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
      title: "Academia BA Emprende",
      client: "Gobierno de la Ciudad de Buenos Aires (Argentina)",
      industry: "Educación y Gobierno",
      challenge:
        "Proporcionar un espacio de interacción y oferta académica, para fomentar el desarrollo del conocimiento y experiencia de los ciudadanos de GCBA.",
      service:
        "Single Sign-On (SSO) entre WordPress y Moodle Gestión de contenidos para educación en línea. Implementación y conexión CRM UX/UI.Scrum Agile.",
      achievements: "Actualización Tecnológica. Agilidad. Organización. Información oportuna y actualizada",
      image: "/images/case-academia-new.png",
      technologies: ["WordPress", "Moodle", "SSO", "CRM", "UX/UI"],
    },
    {
      id: 3,
      sector: "analitica",
      category: "Analítica de Datos, Inteligencia del Negocio e IA",
      title: "Web Data Extraction y Chatbots",
      client: "Gestión Pública / Empresa Privada",
      industry: "Sector Público y Privado",
      challenge:
        "Desarrollamos plataformas eficientes que recopilan y estructuran automáticamente los datos disponibles en la web, transformándolos en información útil y eficiente",
      service:
        "Desarrollo Tecnológico. Python / JavaScript / PHP. Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
      achievements:
        "Desarrollo de Soluciones adaptadas a las necesidades del cliente. Agilidad. Información oportuna y actualizada",
      image: "/images/case-data-extraction-new.png",
      technologies: ["Python", "JavaScript", "PHP", "UX/UI", "Scrum Agile", "Web Scraping"],
    },
    {
      id: 4,
      sector: "empresas",
      category: "Gestión de Proyectos IT y Analítica de Datos",
      title: "Seguimiento y soporte de la gestión integral para TSGROUP",
      client: "Empresa Privada / Tecnología y Gestión de Gobierno Provincial",
      industry: "Tecnología Empresarial",
      challenge:
        "Soporte, seguimiento y documentación de los proyectos que desde el cliente se indican como relevantes y/o forman parte de sus compromisos con terceros.",
      service:
        "Análisis de datos Microsoft Power BI. Presentación de reportes según las necesidades del cliente.- UX/UI. Scrum Agile.",
      achievements: "Actualización tecnológica, agilidad, Organización, Información oportuna y actualizada.",
      image: "/images/case-tsgroup-new.png",
      technologies: ["Microsoft Power BI", "UX/UI", "Scrum Agile", "Análisis de Datos"],
    },
    {
      id: 5,
      sector: "gobierno",
      category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
      title: "Tigre Municipio",
      client: "Gobierno del Municipio Tigre (Argentina)",
      industry: "Gobierno Municipal",
      challenge:
        "servicio de desarrollo y soporte de la aplicación móvil del municipio, incluyendo el desarrollo e implementación de funcionalidades específicas como el registro de comercios afiliados y el alta de usuarios de las tarjetas 'Soy Tigre' y 'Soy Tigre Joven'.",
      service:
        "Desarrollo de Software, pruebas y depuración, actualizaciones y mantenimiento soporte técnico, monitoreo y análisis Git, Firebase Console,Eslint, Prettier, IDE Ciberseguridad UX/UI Scrum Agile.",
      achievements:
        "Innovación y actualización Tecnológica, Agilidad, Organización, Información oportuna y actualizada",
      image: "/images/case-tigre-new.png",
      technologies: ["React Native", "Firebase", "Git", "UX/UI", "Ciberseguridad"],
    },
    {
      id: 6,
      sector: "empresas",
      category: "Desarrollo Tecnológico y Gestión de Proyecto IT",
      title: "Aplicativos Trade Marketing y Nacelle",
      client: "Empresa Privada",
      industry: "Marketing y Comercio",
      challenge: "Desarrollo de aplicación desarrollar un aplicativo móvil de trade marketing.",
      service:
        "Backend: PostgreSQL. Net core. Orm. Aplicación web administrativa/B2B: VueJS. JS. SASS. Vuetify. Aplicación móvil: React native. JS. WIX UI. UX/UI.Scrum Agile.",
      achievements: "Actualización Tecnológica Agilidad Organización Gestión de Datos",
      image: "/images/case-trade-marketing-new.png",
      technologies: ["PostgreSQL", ".NET Core", "VueJS", "React Native", "SASS"],
    },
    {
      id: 8,
      sector: "analitica",
      category: "Gestión Integral de Proyectos IT",
      title: "Sistema de Gestión y Seguimiento de Proyectos",
      client: "Gestión Pública / Empresa Privada",
      industry: "Gestión Empresarial",
      challenge:
        "Diseño de una herramienta de análisis de procesos, con el fin de mejorar la gestión integral de los proyectos a través de una investigación minuciosa de las necesidades de los usuarios.",
      service:
        "Desarrollo Tecnológico. Python / JavaScript / PHP . Presentación de reportes según las necesidades del cliente. UX/UI. Scrum Agile.",
      achievements:
        "Desarrollo de Soluciones adaptadas a las necesidades del cliente. Agilidad. Información oportuna y actualizada",
      image: "/images/case-management-new.png",
      technologies: ["Python", "JavaScript", "PHP", "UX/UI", "Scrum Agile"],
    },
    {
      id: 9,
      sector: "gremios",
      category: "Desarrollo Tecnológico, Academia y Marketing Digital",
      title: "Ecosistema digital UTHGRA y Academia USL",
      client: "UTHGRA y OSUTHGRA San Luis (Argentina)",
      industry: "Gremios y Obra Social",
      challenge:
        "Unificar en una sola plataforma la academia, el padrón de afiliados, los beneficios y la gestión de la obra social, y acercar los servicios a los afiliados.",
      service:
        "Sistema web administrativo multi-módulo, app de afiliados, Academia USL con cursos y certificados, landing y marketing digital en redes. UX/UI. Scrum Agile.",
      achievements: "Más de 1.000 inscriptos en la academia en un año. Tableros en tiempo real. Afiliados, beneficios y prestaciones en un solo panel.",
      image: "https://julio.devisebit.com/media/trabajos/plataforma-academia.jpg",
      technologies: ["Plataforma web", "App móvil", "Academia online", "Tableros", "Marketing digital"],
    },
  ]

  const filteredCases = successCases.filter((case_) => case_.sector === selectedSector)

  const nextCase = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredCases.length)
  }

  const prevCase = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredCases.length) % filteredCases.length)
  }

  const handleSectorChange = (sectorId: string) => {
    setSelectedSector(sectorId)
    setCurrentIndex(0) // Reset to first case when changing sector
  }

  return (
    <div className="min-h-screen bg-[#0B0D12]">
      <Header />

      {/* Hero Section */}
      <section className="db-tech bg-[#0B0D12] text-white mt-[72px]">
        <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Casos de éxito</p>
          <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">Proyectos reales, en producción.</h1>
          <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">Así transformamos organizaciones de salud, gobierno, universidades, gremios y empresas. Abajo, el catálogo completo con más de 150 trabajos.</p>
          <a href="#todos" className="self-start mt-2 rounded-xl border-2 border-[#3A404B] hover:border-[#FF6A63] px-[22px] py-[14px] font-semibold text-white transition-colors">Ver todos los trabajos</a>
        </div>
        <div className="db-scan"><i /></div>
      </section>

      {/* Sector Filter Buttons */}
      <section className="py-8 bg-[#11141B] border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {sectors.map((sector, index) => (
              <Button
                key={sector.id}
                onClick={() => handleSectorChange(sector.id)}
                variant={selectedSector === sector.id ? "default" : "outline"}
                className={`
                  px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-105
                  ${
                    selectedSector === sector.id
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
                      : "bg-transparent border-white/15 text-[#D3D7DE] hover:bg-white/5 hover:border-[#FF6A63] hover:text-white"
                  }
                  animate-slide-up
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="mr-2">{sector.icon}</span>
                {sector.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Success Cases Carousel */}
      <section className="py-20 bg-[#0B0D12]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">{sectors.find((s) => s.id === selectedSector)?.name}</h2>
            <div className="flex justify-center items-center gap-4 text-gray-400">
              <span>
                {currentIndex + 1} de {filteredCases.length}
              </span>
            </div>
          </div>

          {filteredCases.length > 0 && (
            <div className="relative max-w-6xl mx-auto">
              {/* Carousel Navigation */}
              <div className="flex justify-between items-center mb-8">
                <Button
                  onClick={prevCase}
                  variant="outline"
                  size="lg"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-400 p-3 bg-transparent"
                  disabled={filteredCases.length <= 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <div className="flex gap-2">
                  {filteredCases.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex ? "bg-red-500 scale-125" : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextCase}
                  variant="outline"
                  size="lg"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-400 p-3 bg-transparent"
                  disabled={filteredCases.length <= 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Current Case Display */}
              <Card className="bg-[#161A22] border-[#262C37] hover:border-red-500/50 transition-all duration-500 group overflow-hidden animate-slide-up hover:shadow-2xl hover:shadow-red-500/20">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="relative overflow-hidden">
                    <Image
                      src={filteredCases[currentIndex].image || "/placeholder.svg"}
                      alt={filteredCases[currentIndex].title}
                      width={600}
                      height={400}
                      unoptimized
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 animate-float">
                      <Badge className="bg-red-600 text-white hover:bg-red-700 shadow-lg">
                        {filteredCases[currentIndex].category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 group-hover:transform group-hover:scale-105 transition-transform duration-500">
                    <CardHeader className="p-0 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center text-red-400 mb-2 animate-pulse">
                          <Building2 className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">{filteredCases[currentIndex].client}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors duration-300"
                        >
                          {filteredCases[currentIndex].industry}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl text-white mb-3 group-hover:text-red-400 transition-colors duration-500 hover:animate-pulse">
                        {filteredCases[currentIndex].title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 space-y-6">
                      <div className="transform hover:translate-x-2 transition-transform duration-300">
                        <div className="flex items-center text-white mb-2">
                          <Target className="w-4 h-4 mr-2 text-red-500 animate-spin-slow" />
                          <span className="font-semibold">Desafío del negocio</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{filteredCases[currentIndex].challenge}</p>
                      </div>

                      <div className="transform hover:translate-x-2 transition-transform duration-300">
                        <div className="flex items-center text-white mb-2">
                          <Users className="w-4 h-4 mr-2 text-red-500 animate-bounce-slow" />
                          <span className="font-semibold">Servicio ofrecido</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{filteredCases[currentIndex].service}</p>
                      </div>

                      <div className="transform hover:translate-x-2 transition-transform duration-300">
                        <div className="flex items-center text-white mb-3">
                          <Award className="w-4 h-4 mr-2 text-red-500 animate-pulse" />
                          <span className="font-semibold">Logros</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {filteredCases[currentIndex].achievements}
                        </p>
                      </div>

                      <div className="transform hover:translate-x-2 transition-transform duration-300">
                        <div className="flex items-center text-white mb-3">
                          <CheckCircle className="w-4 h-4 mr-2 text-red-500 animate-ping-slow" />
                          <span className="font-semibold">Tecnologías utilizadas</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {filteredCases[currentIndex].technologies.map((tech, techIndex) => (
                            <Badge
                              key={techIndex}
                              variant="outline"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-400 hover:scale-110 transition-all duration-300 cursor-pointer"
                              style={{ animationDelay: `${techIndex * 100}ms` }}
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Redes que gestionamos */}
      <section aria-labelledby="t-redes" className="db-tech bg-[#0B0D12] text-white border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-[72px] flex flex-col gap-8">
          <div className="flex flex-col gap-3 max-w-[820px]">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Redes que gestionamos</p>
            <h2 id="t-redes" className="m-0 font-tight text-[32px] md:text-[42px] leading-[1.1] font-extrabold">Contenido, reels y campañas, todas las semanas.</h2>
            <p className="m-0 text-lg leading-relaxed text-[#C3C8D1]">Estas son algunas de las cuentas que manejamos: planificación, diseño de placas y reels, publicación y respuesta con IA. Entrá y mirá cómo trabajamos.</p>
          </div>
          <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {REDES_GESTIONADAS.map((r) => {
              const href = r.ig ? `https://www.instagram.com/${r.ig}/` : r.web!
              return (
                <li key={r.nombre}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="db-card h-full rounded-2xl border border-white/15 hover:border-[#FF6A63] bg-white/[0.03] p-5 flex flex-col gap-2 transition-colors" aria-label={`${r.nombre} (se abre en otra pestaña)`}>
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]">{r.ig ? <Instagram size={22} aria-hidden="true" /> : <Globe size={22} aria-hidden="true" />}</span>
                    <strong className="text-[17px] leading-snug">{r.nombre}</strong>
                    <span className="text-sm text-[#C3C8D1]">{r.rubro}</span>
                    <span className="mt-auto pt-1 text-sm font-bold text-[#FF6A63]">{r.ig ? `@${r.ig}` : "Ver el sitio"} →</span>
                  </a>
                </li>
              )
            })}
          </ul>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-3">
              <h3 className="m-0 font-tight text-2xl font-bold">Los casos, también en video</h3>
              <p className="m-0 text-[#C3C8D1] leading-relaxed">Publicamos resúmenes de cada proyecto en reels y shorts: el problema, lo que hicimos y el resultado, en menos de un minuto. Suscribite para ver los nuevos.</p>
              <a href="https://www.instagram.com/devisebit/reels/" target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-[#FF6A63] px-4 py-2.5 text-sm font-bold"><Instagram size={18} aria-hidden="true" /> Reels en Instagram</a>
            </div>
            <YoutubeUltimos titulo="Últimos videos y shorts" />
          </div>
        </div>
      </section>

      <TrabajosClient embedded />

      {/* CTA Section */}
      <section className="db-tech py-20 bg-[#0B0D12] border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <TrendingUp className="w-16 h-16 text-red-500 animate-bounce" />
          </div>
          <h2 className="font-tight text-3xl md:text-4xl font-extrabold text-white mb-6">
            ¿Tu proyecto es el próximo caso de éxito?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-200">
            Sumate a las organizaciones que ya ordenaron su gestión con nuestras soluciones
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-400">
            <Link href="/contacto">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg hover:scale-105 transition-all duration-300"
              >
                Contanos tu proyecto
              </Button>
            </Link>
            <Link href="/servicios">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-slate-800 bg-transparent px-8 py-3 text-lg hover:scale-105 transition-all duration-300"
              >
                Ver servicios
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes ping-slow {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        /* Adding animation delays for EL FUTURO ES HOY elements */
        .animation-delay-100 {
          animation-delay: 100ms;
        }
      `}</style>
    </div>
  )
}
