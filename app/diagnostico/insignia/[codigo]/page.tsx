import type { Metadata } from "next"
import Link from "next/link"
import { Award, Check } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TEXTO_INSIGNIA } from "@/lib/diagnosticos"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Verificación de insignia · DEVISEBIT", robots: { index: false, follow: false } }

const API = `${process.env.NEXT_PUBLIC_SISTEMA_URL ?? "https://sistema.devisebit.com"}/api/diagnosticos`
type Insignia = { codigo: string; organizacion: string; emitido: string; texto: string; niveles: { nivel: number; titulo: string; fecha: string }[] }
const fecha = (d: string) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })

/** Página pública: cualquiera verifica la insignia con el código. Los datos vienen del sistema. */
export default async function InsigniaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const cod = decodeURIComponent(codigo).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20)
  let ins: Insignia | null = null
  let caido = false
  try {
    const r = await fetch(`${API}?insignia=${encodeURIComponent(cod)}`, { cache: "no-store" })
    if (r.ok) ins = ((await r.json()) as { insignia: Insignia }).insignia
    else if (r.status !== 404) caido = true
  } catch { caido = true }
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px] bg-[#F5F6F8]">
        <div className="max-w-[760px] mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-5">
          {ins ? (
            <>
              <p role="status" className="m-0 self-start inline-flex items-center gap-2 rounded-full bg-[#E3F2E8] px-3 py-1 text-sm font-bold text-[#0B6B34]"><Check size={16} aria-hidden="true" /> Insignia válida, emitida por DEVISEBIT SRL</p>
              <section aria-labelledby="t-ins" className="relative overflow-hidden rounded-3xl border-2 border-[#0E1116] bg-white p-7 md:p-10 flex flex-col items-center text-center gap-4">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 90% 0%, rgba(200,35,31,.14), transparent 45%)" }} />
                <span className="relative w-20 h-20 rounded-3xl bg-[#0E1116] text-white flex items-center justify-center" aria-hidden="true"><Award size={42} /></span>
                <p className="relative m-0 text-xs font-bold tracking-[0.3em] text-[#4A515C]">ACADEMIA DEVISEBIT</p>
                <h1 id="t-ins" className="relative m-0 font-tight text-[30px] md:text-[40px] leading-tight font-extrabold">{ins.organizacion}</h1>
                <p className="relative m-0 text-lg text-[#262C37]">{TEXTO_INSIGNIA.split(" · ")[0]}</p>
                <ol className="relative m-0 p-0 list-none grid gap-2 sm:grid-cols-3 w-full">
                  {ins.niveles.map((n) => <li key={n.nivel} className="rounded-xl bg-[#F5F6F8] px-3 py-2 text-sm"><strong className="block">Nivel {n.nivel} · {n.titulo}</strong><span className="text-[#4A515C]">{fecha(n.fecha)}</span></li>)}
                </ol>
                <p className="relative m-0 text-sm text-[#4A515C]">Emitida el {fecha(ins.emitido)} · Código <strong className="font-mono text-[#0E1116]">{ins.codigo}</strong></p>
              </section>
              <p className="m-0 text-sm text-[#4A515C]">La insignia certifica que la organización completó los tres autodiagnósticos gratuitos de DEVISEBIT (madurez digital, procesos y automatización e IA). No es una auditoría ni una certificación de calidad.</p>
            </>
          ) : (
            <section className="rounded-2xl border border-[#E2E5EA] bg-white p-8 flex flex-col gap-3">
              <h1 className="m-0 font-tight text-3xl font-extrabold">{caido ? "No pudimos verificarla ahora" : "Insignia no válida"}</h1>
              <p className="m-0 text-[17px] text-[#4A515C]">{caido ? "Probá de nuevo en unos minutos." : <>No encontramos una insignia vigente con el código <strong className="text-[#0E1116]">{cod || "—"}</strong>. Revisá que esté bien escrito o escribinos a info@devisebit.com.</>}</p>
            </section>
          )}
          <Link href="/diagnostico" className="self-start rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white">Hacé los autodiagnósticos gratis</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
