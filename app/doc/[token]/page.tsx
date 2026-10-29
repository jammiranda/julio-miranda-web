import type { Metadata } from "next"
import { one, q } from "@/lib/db"
import { vigente, peso } from "@/lib/biblioteca"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Documento de DEVISEBIT", robots: { index: false, follow: false } }

const WA = "https://wa.me/5491173466490"

/** Página de un link personal a un documento de la empresa. */
export default async function DocCompartido({ params }: { params: { token: string } }) {
  const e = await one<{ id: number; doc_id: number; nombre: string | null; email: string | null; expira: Date; revocado: boolean; visitas: number; titulo: string; descripcion: string | null; confidencial: boolean }>(
    "select e.id, e.doc_id, e.nombre, e.email, e.expira, e.revocado, e.visitas, d.titulo, d.descripcion, d.confidencial from bib_envios e join bib_docs d on d.id=e.doc_id where e.token=$1", [params.token],
  ).catch(() => null)
  const ok = e && !e.revocado && new Date(e.expira) > new Date()
  if (!ok) {
    return (
      <main className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4 py-12">
        <div className="card max-w-md w-full flex flex-col gap-3 text-center">
          <h1 className="m-0 text-2xl">{e ? "Este link ya no está disponible" : "Link no válido"}</h1>
          <p className="m-0 text-[#4A515C]">Los links a documentos son personales y vencen. Pedile uno nuevo a quien te lo mandó o escribinos.</p>
          <a href={WA} className="btn-p mt-2">Escribir por WhatsApp</a>
        </div>
      </main>
    )
  }
  const v = await vigente(e!.doc_id)
  await q("update bib_envios set visitas=visitas+1, ultima=now() where id=$1", [e!.id])
  if (e!.visitas === 0) await notificar(["gerente", "coordinacion"], "📄 Abrieron un documento", `${e!.nombre ?? e!.email ?? "Un link"} abrió ${e!.titulo}`, "/biblioteca").catch(() => {})
  const vence = new Date(e!.expira).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long" })
  const fechaV = v ? new Date(v.publicado ?? v.creado).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", year: "numeric" }) : ""
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <header className="bg-[#0B0D12] text-white">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-10 sm:pt-12 sm:pb-14 flex flex-col gap-3">
          <span className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>
          <h1 className="m-0 text-[30px] sm:text-[42px] leading-tight font-extrabold text-white">{e!.titulo}</h1>
          {e!.descripcion && <p className="m-0 text-white/75">{e!.descripcion}</p>}
        </div>
      </header>
      <section className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <div className="card flex flex-col gap-3">
          {v ? (
            <>
              <p className="m-0 text-sm text-[#4A515C]">Versión {v.version} · {fechaV} · PDF de {peso(v.tamano)}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`/doc/${params.token}/archivo`} target="_blank" rel="noopener noreferrer" className="btn-p">Ver el documento</a>
                <a href={`/doc/${params.token}/archivo?descargar=1`} className="btn-s">Descargar</a>
              </div>
            </>
          ) : <p className="m-0">El documento se está actualizando. Probá de nuevo en unos minutos.</p>}
          <p className="m-0 text-xs text-[#4A515C]">Link personal{e!.nombre ? ` para ${e!.nombre}` : ""}, válido hasta el {vence}. Siempre abre la versión más reciente.{e!.confidencial ? " Documento de uso interno y confidencial: no lo reenvíes." : ""}</p>
        </div>
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="m-0 text-lg">¿Querés hablar con nosotros?</h2><p className="m-0 text-sm text-[#4A515C]">Software e IA. Desde 2009.</p></div>
          <div className="flex flex-wrap gap-2"><a href="https://sistema.devisebit.com/agendar" className="btn-p">Agendar una reunión</a><a href={WA} className="btn-s">WhatsApp</a></div>
        </div>
      </section>
    </main>
  )
}
