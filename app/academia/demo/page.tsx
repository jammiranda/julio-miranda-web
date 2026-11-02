import Link from "next/link"
import { notFound } from "next/navigation"
import { InicioAlumno, CursoAlumno, LeccionAlumno } from "@/components/aula/AulaAcademia"

export const dynamic = "force-dynamic"

/** SOLO PREVIEW: muestra el espacio del alumno con datos de ejemplo. No existe en producción. */
const av = (h: number, t: number) => ({ lecciones: t, hechas: h, pctLecciones: Math.round((h / t) * 100), clases: 4, presentes: 2, pctAsistencia: 50, dadas: 2 })
const ins = [
  { id: 1, estado: "cursando", titulo: "IA para tu pyme: 5 tareas en una semana", slug: "ia-para-tu-pyme-5-tareas-en-una-semana", modalidad: "online", horas: 6, parcial: false, certificado: null, av: av(5, 12) },
  { id: 2, estado: "inscripto", titulo: "WhatsApp con IA: el asistente de tu negocio", slug: "whatsapp-con-ia-asistente-de-tu-negocio", modalidad: "online", horas: 8, parcial: true, gratis_modulos: 1, certificado: null, av: av(1, 10) },
  { id: 3, estado: "aprobado", titulo: "Introducción a la transformación digital", slug: "introduccion-a-la-transformacion-digital", modalidad: "online", horas: 4, parcial: false, certificado: "DEMO-0001", aprobado_en: new Date(), av: av(8, 8) },
]
const manana = new Date(Date.now() + 26 * 3600e3)
const clases = [{ id: 1, fecha: manana, tema: "Automatizá tu primera tarea", titulo: ins[0].titulo, iid: 1, link: "#" }, { id: 2, fecha: new Date(Date.now() + 8 * 86400e3), tema: "Preguntas y casos", titulo: ins[0].titulo, iid: 1, link: "#" }]
const otros = [{ slug: "liderazgo-en-la-era-de-la-ia", titulo: "Liderazgo en la era de la IA", bajada: "Cómo conducir equipos cuando la IA ya trabaja con ellos.", modalidad: "online", horas: 5, precio: 49000 }, { slug: "prompt-engineering-para-ejecutivos", titulo: "Prompt engineering para ejecutivos", bajada: "Pedirle bien a la IA para decidir mejor.", modalidad: "online", horas: 3, precio: 0 }]
const lec = [
  ["Bienvenida", "Primeros pasos", "video", true], ["Qué puede hacer la IA hoy", "Primeros pasos", "video", true], ["Tu primera tarea automatizada", "Primeros pasos", "lectura", true],
  ["Ordená tu información", "Datos", "video", true], ["Plantilla de trabajo", "Datos", "descarga", true], ["Armá tu flujo", "Automatización", "video", false], ["Probalo con tu caso", "Automatización", "tarea", false],
  ["Medí resultados", "Automatización", "lectura", false], ["Escalá lo que funciona", "Cierre", "video", false], ["Cierre y próximos pasos", "Cierre", "lectura", false],
].map(([titulo, modulo, tipo, completada], n) => ({ id: n + 1, titulo, modulo, tipo, completada: completada ? new Date() : null, bloqueada: n >= 8, duracion_min: 6 + n, video_url: null, contenido: null }))
const curso = { id: 1, titulo: ins[0].titulo, slug: ins[0].slug, modalidad: "online", edicion: "A tu ritmo", estado: "cursando", horas: 6, docente: "Matías González D'Alessandro", docente_slug: "matias-gonzalez-dalessandro", parcial: false, certificado: null, videollamada: true, videollamada_en: null, req_lecciones: 80, req_asistencia: 70, inicio: null, fin: null, horario: "Martes 19 h", link: "#", lugar: null, descripcion: "Aprendés a delegar cinco tareas repetitivas en la IA y las dejás funcionando en una semana." }
const leccion = { ...lec[5], contenido: "## Armá tu flujo\n\nEn esta lección conectamos **tres pasos**: entrada, IA y salida.\n\n- Elegí una tarea que hagas todos los días\n- Escribí qué entra y qué querés que salga\n- Probá con un ejemplo real\n\n> Empezá chico: una tarea, un resultado.", quiz: null }

export default function Demo({ searchParams }: { searchParams: { v?: string } }) {
  if (process.env.VERCEL_ENV === "production") notFound()
  const v = searchParams.v ?? "inicio"
  const nav = [["inicio", "Inicio"], ["curso", "Curso"], ["leccion", "Lección"]]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm rounded-xl bg-amber-50 border border-amber-200 p-3"><strong>Vista de ejemplo (solo preview):</strong>
        {nav.map(([k, t]) => <Link key={k} href={`/academia/demo?v=${k}`} className={`px-3 py-1 rounded-full no-underline ${v === k ? "bg-[#0E1116] text-white" : "bg-white border border-[#E2E5EA] text-[#0E1116]"}`}>{t}</Link>)}
      </div>
      {v === "curso" ? <CursoAlumno i={curso} lecciones={lec} av={av(5, 10)} clases={[]} />
        : v === "leccion" ? <LeccionAlumno i={curso} lecciones={[...lec.slice(0, 5), leccion, ...lec.slice(6)]} k={5} />
        : <InicioAlumno nombre="Ana Pérez" ins={ins} clases={clases} compras={[]} otros={otros} salir={<button className="btn-s">Salir</button>} />}
    </div>
  )
}
