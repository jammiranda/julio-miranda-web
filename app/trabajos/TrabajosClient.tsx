"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const IMG = "https://julio.devisebit.com/media/trabajos/"

type Item = { t: string; d: string; c: string; img?: string }

const ITEMS: Item[] = [
  { c: "Destacados", t: "UTHGRA · ecosistema digital gremial", d: "Webs, app de afiliados, boletín y Academia USL para la seccional San Luis, con más de 1.000 inscriptos en un año.", img: "plataforma-academia.jpg" },
  { c: "Destacados", t: "OSUTHGRA San Luis · gestión digital", d: "Sistema web administrativo de padrón, aportes y prestaciones, más marketing digital en redes." },
  { c: "Destacados", t: "Municipio de Tigre · app Soy Tigre", d: "Desarrollo y soporte de la app municipal: registro de comercios adheridos y alta de las tarjetas Soy Tigre y Soy Tigre Joven." },
  { c: "Destacados", t: "UBA · Modernización y Transformación Digital", d: "Seguimiento de proyectos, tableros en Power BI, expediente electrónico y documentación para la Subsecretaría." },
  { c: "Destacados", t: "UBA · votación electrónica del Consejo Superior", d: "Sistema de votación implementado para las sesiones del Consejo Superior." },
  { c: "Destacados", t: "GCBA · Academia BA Emprende", d: "Oferta académica online para emprendedores, con WordPress y Moodle unificados por SSO y conexión a CRM." },
  { c: "Destacados", t: "GCBA · CMD y BA Laboratorio Tecnológico", d: "Gestión operativa y tecnológica del Centro Metropolitano de Diseño y del laboratorio tecnológico de la Ciudad." },
  { c: "Destacados", t: "Ministerio de Ambiente de la Nación", d: "Red Federal de Monitoreo Ambiental y sistemas de trazabilidad de residuos, con coordinación tecnológica nacional." },
  { c: "Destacados", t: "Fundación SODETEC · academia online", d: "Plataforma de cursos, certificados y comunidad para la fundación." },
  { c: "Destacados", t: "Catamarca Exporta", d: "Portal de oferta exportable y herramientas para pymes de la provincia.", img: "portal-exportacion.jpg" },
  { c: "Destacados", t: "San Luis Diario y 105.7 FM", d: "Automatización de noticias y radio con inteligencia artificial." },
  { c: "Destacados", t: "SIBEN · venta de entradas para eventos", d: "Sistema de venta de entradas, acreditación y control de acceso para los eventos de la Sociedad Iberoamericana de Neonatología. La misma plataforma se replicó luego para una marca de cosmética." },
  { c: "Plataformas", t: "Panel de administración a medida", d: "Usuarios, permisos, configuración y reportes para equipos internos.", img: "panel-administracion.jpg" },
  { c: "Plataformas", t: "CRM de salud con historia clínica", d: "Pacientes, turnos, prestaciones y facturación en producción." },
  { c: "Plataformas", t: "Tablero de internación domiciliaria", d: "El Excel mensual de Drive se convierte en indicadores y alertas." },
  { c: "Plataformas", t: "Control de acceso con molinetes", d: "Integración de hardware y software para un club de primera división." },
  { c: "Plataformas", t: "Asistentes de WhatsApp con IA", d: "Atención 24 horas, derivación a humanos y registro en el CRM." },
  { c: "Apps", t: "App de espectáculos", d: "Cartelera, entradas y novedades en iOS y Android.", img: "app-espectaculos.jpg" },
  { c: "Educación", t: "Expo de posgrados de una universidad nacional", d: "Identidad, web y expo interactiva con charlas y becas.", img: "expo-posgrado-universidad.jpg" },
  { c: "Educación", t: "Academias online", d: "Cursos, certificados y comunidad, con más de 1.000 inscriptos en un año." },
  { c: "Gobierno", t: "Portal de una expo productiva provincial", d: "Sectores, expositores y agenda del predio ferial.", img: "portal-expo-productiva.jpg" },
  { c: "Gobierno", t: "Identidad de una agencia de desarrollo", d: "Marca y piezas para una agencia de desarrollo económico.", img: "marca-agencia-desarrollo.jpg" },
  { c: "Medios", t: "Agenda cultural y deportiva", d: "Portal con eventos de música, teatro, deporte y gastronomía.", img: "medio-agenda-cultural.jpg" },
  { c: "Medios", t: "Web de agencia de publicidad", d: "Sitio institucional con cobertura y casos.", img: "web-agencia-publicidad.jpg" },
  { c: "Medios", t: "29 portales de noticias y radios", d: "Diarios, revistas digitales y radios FM online del NOA." },
  { c: "Industria", t: "Web de maquinaria pesada", d: "Catálogo de equipos y distribución.", img: "web-maquinaria-pesada.jpg" },
  { c: "Industria", t: "Web de aislaciones industriales", d: "Productos, servicios y cotización.", img: "web-industria-aislaciones.jpg" },
  { c: "Industria", t: "Identidad para neumáticos", d: "Marca, papelería y aplicaciones.", img: "marca-neumaticos.jpg" },
  { c: "Industria", t: "Marca de juguetería", d: "Identidad para una fábrica con más de 50 años.", img: "marca-jugueteria.jpg" },
  { c: "Comercio", t: "Tienda online de instrumentos", d: "Catálogo, promociones y carrito.", img: "tienda-online.jpg" },
  { c: "Comercio", t: "E-commerce de calzado", d: "Catálogo web y canal mayorista.", img: "ecommerce-calzado.jpg" },
  { c: "Comercio", t: "Bodega online", d: "Tienda de vinos y destilados.", img: "bodega-online.jpg" },
  { c: "Comercio", t: "Identidad de perfumería", d: "Marca, packaging y papelería.", img: "marca-perfumeria.jpg" },
  { c: "Comercio", t: "Identidad de casa de té", d: "Marca y aplicaciones en el local.", img: "marca-casa-de-te.jpg" },
  { c: "Comercio", t: "Centro de estética y spa", d: "Identidad y piezas de comunicación.", img: "marca-centro-estetica.jpg" },
  { c: "Servicios", t: "Web de estudio de arquitectura", d: "Proyectos, planos y servicios con slider a pantalla completa.", img: "web-arquitectura.jpg" },
  { c: "Servicios", t: "Sitio de arquitectura y diseño", d: "Portfolio de obra y contacto.", img: "web-estudio-arquitectura.jpg" },
  { c: "Servicios", t: "Web de desarrollos inmobiliarios", d: "Viviendas, financiación y consultas.", img: "web-viviendas.jpg" },
  { c: "Servicios", t: "Espacio cultural", d: "Marca, productos y agenda.", img: "marca-espacio-cultural.jpg" },
  { c: "Turismo", t: "Turismo receptivo internacional", d: "Web de viajes con paquetes y consultas.", img: "web-turismo-receptivo.jpg" },
  { c: "Turismo", t: "Portal de pesca deportiva", d: "Destinos, guías y comunidad.", img: "portal-pesca.jpg" },
  { c: "Turismo", t: "Turismo náutico", d: "Web y piezas para una empresa náutica.", img: "turismo-nautico.jpg" },
  { c: "Deporte", t: "Web de club de fútbol", d: "Noticias, radio y comunidad de hinchas.", img: "web-club-futbol.jpg" },
  { c: "Deporte", t: "Liga recreativa", d: "Fixture, resultados e inscripción de equipos.", img: "liga-recreativa.jpg" },
  { c: "Salud", t: "Webs para centros médicos", d: "Turnero online, especialidades y obras sociales." },
]

const STATS = [
  { n: 150, s: "+", l: "proyectos" },
  { n: 17, s: "", l: "años" },
  { n: 12, s: "", l: "rubros" },
  { n: 29, s: "", l: "medios digitales" },
]

function Counter({ n, s }: { n: number; s: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400)
        setV(Math.round(n * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [n])
  return <span ref={ref}>{s}{v}</span>
}

export default function TrabajosClient({ embedded = false }: { embedded?: boolean }) {
  const cats = useMemo(() => ["Todos", ...Array.from(new Set(ITEMS.map((i) => i.c)))], [])
  const [cat, setCat] = useState("Todos")
  const list = cat === "Todos" ? ITEMS : ITEMS.filter((i) => i.c === cat)

  return (
    <>
      <section id="todos" className={"relative overflow-hidden bg-[#0B0D12] text-white " + (embedded ? "pt-20 pb-16 border-t border-red-900/30" : "pt-32 pb-20")}>
        <div className="tb-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="tb-glow absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#FF6A63]">Todos los trabajos · 2009–2026</p>
          {embedded ? <h2 className="text-4xl md:text-6xl font-extrabold mt-3 max-w-3xl leading-[1.05]">Más de 150 proyectos en producción.</h2> : <h1 className="text-4xl md:text-6xl font-extrabold mt-3 max-w-3xl leading-[1.05]">Más de 150 proyectos en producción.</h1>}
          <p className="text-lg text-gray-300 mt-5 max-w-2xl">Plataformas, apps, webs e identidad para salud, gobierno, universidades, gremios, medios y empresas de todo el país.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {STATS.map((x) => (
              <div key={x.l} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="text-4xl md:text-5xl font-extrabold"><Counter n={x.n} s={x.s} /></div>
                <div className="text-gray-400 mt-1">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-white"><section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filtrar por rubro">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={"px-4 py-2 rounded-full text-sm font-semibold border transition-all " + (cat === c ? "bg-[#C8231F] border-[#C8231F] text-white shadow-lg shadow-red-500/20" : "border-gray-300 text-gray-700 hover:border-[#C8231F] hover:text-[#C8231F]")}
            >
              {c} <span className="opacity-60">{c === "Todos" ? ITEMS.length : ITEMS.filter((i) => i.c === c).length}</span>
            </button>
          ))}
        </div>
        <div key={cat} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((i, k) => (
            <article key={i.t} className="tb-card group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${Math.min(k, 12) * 40}ms` }}>
              {i.img ? (
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <img src={IMG + i.img} alt={i.t} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-[#0B0D12] relative overflow-hidden flex flex-col justify-between p-6">
                  <div className="tb-grid absolute inset-0 opacity-50" aria-hidden="true" />
                  <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full" style={{ background: "radial-gradient(closest-side,rgba(200,35,31,.45),transparent)" }} aria-hidden="true" />
                  <span className="relative text-[#FF6A63] font-mono text-sm">{"<"}{i.c.toLowerCase()}{" />"}</span>
                  <span className="relative text-white text-2xl font-extrabold leading-tight max-w-[90%]">{i.t}</span>
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C8231F]">{i.c}</p>
                <h2 className="text-lg font-bold mt-1 text-gray-900">{i.t}</h2>
                <p className="text-gray-600 mt-1 text-[15px] leading-relaxed">{i.d}</p>
              </div>
            </article>
          ))}
        </div>
        {!embedded && <div className="mt-14 rounded-3xl bg-[#0B0D12] text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">¿Tu proyecto es el próximo?</h2>
            <p className="text-gray-300 mt-2">Contanos qué necesitás y te respondemos con alcance, fecha y precio fijo.</p>
          </div>
          <a href="/contacto" className="inline-flex justify-center rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-6 py-4 font-bold transition-colors">Contanos tu proyecto</a>
        </div>}
      </section></div>

      <style>{`
        .tb-grid{background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:44px 44px;animation:tbmove 18s linear infinite}
        .tb-glow{background:radial-gradient(closest-side,rgba(200,35,31,.45),transparent);animation:tbpulse 6s ease-in-out infinite}
        .tb-card{animation:tbrise .5s both}
        @keyframes tbmove{to{background-position:44px 44px}}
        @keyframes tbpulse{50%{opacity:.6;transform:translate(-50%,10px) scale(1.05)}}
        @keyframes tbrise{from{opacity:0;transform:translateY(14px)}}
        @media (prefers-reduced-motion:reduce){.tb-grid,.tb-glow,.tb-card{animation:none}}
      `}</style>
    </>
  )
}
