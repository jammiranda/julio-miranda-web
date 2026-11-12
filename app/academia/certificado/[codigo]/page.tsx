import type { Metadata } from "next"
import { one } from "@/lib/db"
import Imprimir from "@/components/Imprimir"
import { modalidadYEdicion } from "@/lib/cursos"
import { firmaCertificado } from "@/lib/portadas"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Verificación de certificado", robots: { index: false, follow: false } }

/** Certificado público: cualquiera puede verificarlo con el código; el alumno lo imprime o guarda en PDF. */
export default async function Certificado({ params }: { params: { codigo: string } }) {
  const cod = params.codigo.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20)
  const c = await one<any>(
    `select ce.*, cu.modalidad, cu.docente, cu.docente_slug, to_char(ce.emitido at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD') dia
     from am_certificados ce join am_inscripciones i on i.id=ce.inscripcion_id join am_ediciones e on e.id=i.edicion_id join am_cursos cu on cu.id=e.curso_id
     where ce.codigo=$1`, [cod])
  if (!c || c.anulado)
    return (
      <main className="max-w-xl mx-auto px-4 py-20">
        <div className="card text-center flex flex-col gap-2">
          <h1 className="m-0">Certificado no válido</h1>
          <p className="m-0 text-[#4A515C]">No encontramos un certificado vigente con el código <strong>{cod}</strong>. Revisá que esté bien escrito o escribinos a info@devisebit.com.</p>
        </div>
      </main>
    )
  const dia = new Date(c.dia + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-4 cert-pagina">
      <h1 className="sr-only">Certificado de {c.nombre}: {c.curso}</h1>
      <style>{`.cert{container-type:inline-size}.cert .ct-11{font-size:clamp(8px,1vw,11px)}.cert .ct-13{font-size:clamp(9px,1.2vw,13px)}.cert .ct-14{font-size:clamp(10px,1.3vw,14px)}.cert .ct-16{font-size:clamp(11px,1.5vw,16px)}.cert .ct-26{font-size:clamp(14px,2.4vw,26px)}.cert .ct-28{font-size:clamp(16px,2.6vw,28px)}.cert .ct-46{font-size:clamp(22px,4.2vw,46px)}@supports (font-size:1cqw){.cert .ct-11{font-size:1.11cqw}.cert .ct-13{font-size:1.31cqw}.cert .ct-14{font-size:1.41cqw}.cert .ct-16{font-size:1.61cqw}.cert .ct-26{font-size:2.62cqw}.cert .ct-28{font-size:2.82cqw}.cert .ct-46{font-size:4.64cqw}}@media print { @page { size: A4 landscape; margin: 0 } body { background:#fff } .ficha-head, .no-print { display:none !important } .cert-pagina { padding:0 !important; max-width:none !important } .cert { border-radius:0 !important; box-shadow:none !important; width:297mm; height:210mm } }`}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="m-0 text-sm"><span className="chip bg-emerald-50 text-emerald-700">✓ Certificado válido</span> emitido por DEVISEBIT SRL</p>
        <Imprimir />
      </div>
      <section className="cert relative bg-white rounded-2xl shadow-xl overflow-hidden" style={{ aspectRatio: "297 / 210" }} aria-label="Certificado">
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 92% 8%, rgba(200,35,31,.16), transparent 40%), radial-gradient(circle at 4% 100%, rgba(14,17,22,.08), transparent 45%)" }} />
        <div aria-hidden="true" className="absolute inset-[3%] border-2 border-[#0E1116] rounded-xl" />
        <div aria-hidden="true" className="absolute inset-[4%] border border-[#C8231F]/50 rounded-lg" />
        <div className="relative h-full flex flex-col items-center justify-between text-center px-[9%] py-[7%]">
          <div className="flex flex-col items-center gap-1">
            <span className="ct-26 font-extrabold tracking-[0.06em] text-[#0E1116]">DEVISE<span className="text-[#C8231F]">BIT</span></span>
            <span className="ct-11 font-semibold tracking-[0.35em] text-[#4A515C]">ACADEMIA</span>
          </div>
          <div className="flex flex-col items-center gap-[1.4vw] max-w-[85%]">
            <span className="ct-14 font-bold tracking-[0.3em] text-[#C8231F]">CERTIFICADO DE APROBACIÓN</span>
            <span className="ct-16 text-[#262C37]">Se certifica que</span>
            <span className="ct-46 font-extrabold leading-tight text-[#0E1116] border-b-2 border-[#0E1116]/20 pb-[0.6vw] px-6">{c.nombre}</span>
            <span className="ct-16 text-[#262C37]">aprobó el curso</span>
            <span className="ct-28 font-bold leading-snug text-[#0E1116]">{c.curso}</span>
            <span className="ct-13 text-[#4A515C]">{[modalidadYEdicion(c.modalidad, c.edicion), c.horas ? `${Number(c.horas)} horas` : null].filter(Boolean).join(" · ")}</span>
          </div>
          <div className="w-full flex items-end justify-between gap-4 text-left">
            <div className="ct-11 text-[#4A515C] leading-relaxed">Emitido el {dia}<br />Código de verificación: <strong className="text-[#0E1116]">{c.codigo}</strong><br />Verificalo en academia.devisebit.com/certificado/{c.codigo}</div>
            <div className="text-center ct-11 text-[#4A515C]"><div className="border-t border-[#0E1116]/40 pt-1 px-6">{c.docente ? (firmaCertificado(c.docente_slug) === "Creado por" ? <>Creado por<br /><strong className="text-[#0E1116]">{c.docente}</strong></> : <><strong className="text-[#0E1116]">{c.docente}</strong><br />{firmaCertificado(c.docente_slug)}</>) : <><strong className="text-[#0E1116]">DEVISEBIT SRL</strong><br />Academia</>}</div></div>
          </div>
        </div>
      </section>
      <dl className="no-print sm:hidden m-0 card grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
        <dt className="text-[#4A515C]">Alumno</dt><dd className="m-0 font-semibold">{c.nombre}</dd>
        <dt className="text-[#4A515C]">Curso</dt><dd className="m-0 font-semibold">{c.curso}</dd>
        <dt className="text-[#4A515C]">Emitido</dt><dd className="m-0">{dia}</dd>
        <dt className="text-[#4A515C]">Código</dt><dd className="m-0 font-mono">{c.codigo}</dd>
      </dl>
      <p className="no-print m-0 text-sm text-[#4A515C] text-center">Para guardarlo en PDF: “Imprimir” y elegí “Guardar como PDF”, en horizontal.</p>
    </main>
  )
}
